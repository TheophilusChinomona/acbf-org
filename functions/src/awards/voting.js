'use strict';

/**
 * Callable Cloud Function that accepts one award vote.
 *
 * A vote is accepted only inside a Firestore transaction that, in order:
 *   1. re-reads the competition document and evaluates the server clock,
 *   2. verifies the category and that the nominee belongs to it,
 *   3. looks up the deduplication key (competition + category + browser token),
 *   4. enforces per-browser and per-IP hourly ceilings,
 *   5. creates the vote record, increments the private nominee total, and
 *      advances the rate-limit buckets together.
 *
 * Concurrent or retried submissions therefore count once: the second attempt
 * finds the vote document and returns `already-voted` without touching totals.
 * Nothing here logs or returns voter details, and the response for a duplicate
 * never reveals which nominee was voted for.
 */

const { FieldValue, Timestamp } = require('firebase-admin/firestore');

const policy = require('./policy');
const { normalizeDomainError } = require('../errors');

const { AwardsVoteError, ERROR_CODES } = policy;

const CLOSED_MESSAGE = 'Voting has closed for the 2026 ACBF Awards.';
const NOT_OPEN_MESSAGE = 'Voting is not open for the 2026 ACBF Awards.';
const UNAVAILABLE_MESSAGE = 'Voting is temporarily unavailable. Please try again.';
const BROWSER_LIMIT_MESSAGE =
  'Too many votes from this browser in the last hour. Please try again later.';
const NETWORK_LIMIT_MESSAGE =
  'Too many votes from this network in the last hour. Please try again later.';

function competitionRefs(db, competitionId) {
  const root = db.collection(policy.COMPETITION_COLLECTION).doc(competitionId);
  return {
    competition: root,
    categories: root.collection(policy.SUBCOLLECTIONS.categories),
    nominees: root.collection(policy.SUBCOLLECTIONS.nominees),
    votes: root.collection(policy.SUBCOLLECTIONS.votes),
    totals: root.collection(policy.SUBCOLLECTIONS.totals),
    rateLimits: root.collection(policy.SUBCOLLECTIONS.rateLimits),
  };
}

/**
 * Read the transport-supplied client address.
 *
 * The HTTP API passes `clientIp` taken from the single trusted proxy header; the
 * legacy callable passes its own `rawRequest.ip`. Callers cannot choose either
 * value from a request body.
 *
 * @param {{clientIp?: string, rawRequest?: {ip?: string}}} [context]
 * @returns {string|null}
 */
function readClientIp(context) {
  if (!context || typeof context !== 'object') return null;
  if (typeof context.clientIp === 'string') return context.clientIp;
  const rawIp = context.rawRequest && context.rawRequest.ip;
  return typeof rawIp === 'string' ? rawIp : null;
}

function toDomainError(error) {
  // Log only the shape of unexpected failures: never voter data or payloads.
  return normalizeDomainError(error, {
    context: 'castAwardVote',
    message: UNAVAILABLE_MESSAGE,
  });
}

/**
 * Build the callable handler.
 *
 * @param {{ db: import('firebase-admin/firestore').Firestore, now?: () => number }} options
 * @returns {(data: unknown, context?: object) => Promise<{status: 'accepted'|'already-voted', nomineeId?: string}>}
 */
function createCastAwardVote({ db, now = Date.now } = {}) {
  if (!db || typeof db.runTransaction !== 'function') {
    throw new TypeError('createCastAwardVote requires a Firestore instance');
  }

  return async function castAwardVote(data, context = {}) {
    let input;
    try {
      input = policy.validateVoteInput(data);
    } catch (error) {
      throw toDomainError(error);
    }

    const refs = competitionRefs(db, input.competitionId);
    const voteRef = refs.votes.doc(policy.voteKeyFor(input));
    const hashedIp = policy.ipIdentity(readClientIp(context));

    try {
      return await db.runTransaction(async (transaction) => {
        // Server time is read inside the transaction: a request that started
        // before the deadline but waited past it is rejected.
        const nowMs = now();

        const browserBucket = policy.rateLimitRefFor({
          kind: 'browser',
          identity: input.browserToken,
          nowMs,
        });
        const browserRef = refs.rateLimits.doc(browserBucket.key);
        const ipBucket = hashedIp
          ? policy.rateLimitRefFor({ kind: 'ip', identity: hashedIp, nowMs })
          : null;
        const ipRef = ipBucket ? refs.rateLimits.doc(ipBucket.key) : null;

        const snapshots = await transaction.getAll(
          refs.competition,
          refs.categories.doc(input.categoryId),
          refs.nominees.doc(input.nomineeId),
          voteRef,
          browserRef,
          ...(ipRef ? [ipRef] : []),
        );

        const [competitionSnap, categorySnap, nomineeSnap, voteSnap, browserSnap] = snapshots;
        const ipSnap = ipRef ? snapshots[snapshots.length - 1] : null;

        if (!competitionSnap.exists) {
          throw new AwardsVoteError(ERROR_CODES.FAILED_PRECONDITION, NOT_OPEN_MESSAGE);
        }
        if (!policy.isVotingOpen(competitionSnap.data(), nowMs)) {
          throw new AwardsVoteError(ERROR_CODES.FAILED_PRECONDITION, CLOSED_MESSAGE);
        }

        if (!categorySnap.exists) {
          throw new AwardsVoteError(ERROR_CODES.INVALID_ARGUMENT, 'Unknown award category.');
        }
        if (!nomineeSnap.exists) {
          throw new AwardsVoteError(ERROR_CODES.INVALID_ARGUMENT, 'Unknown nominee.');
        }

        const nominee = nomineeSnap.data();
        if (nominee.categoryId !== input.categoryId) {
          throw new AwardsVoteError(
            ERROR_CODES.INVALID_ARGUMENT,
            'That nominee does not belong to the chosen category.',
          );
        }
        if (nominee.disabled === true) {
          throw new AwardsVoteError(
            ERROR_CODES.FAILED_PRECONDITION,
            'That nominee is not accepting votes.',
          );
        }

        // A duplicate is answered before any counter is read or written, so a
        // retry can never inflate the totals.
        if (voteSnap.exists) {
          return { status: 'already-voted' };
        }

        const browserCount = browserSnap.exists ? Number(browserSnap.get('count') || 0) : 0;
        if (browserCount >= policy.RATE_LIMITS.browserPerHour) {
          throw new AwardsVoteError(ERROR_CODES.RESOURCE_EXHAUSTED, BROWSER_LIMIT_MESSAGE);
        }

        if (ipSnap) {
          const ipCount = ipSnap.exists ? Number(ipSnap.get('count') || 0) : 0;
          if (ipCount >= policy.RATE_LIMITS.ipPerHour) {
            throw new AwardsVoteError(ERROR_CODES.RESOURCE_EXHAUSTED, NETWORK_LIMIT_MESSAGE);
          }
        }

        transaction.create(voteRef, {
          competitionId: input.competitionId,
          categoryId: input.categoryId,
          nomineeId: input.nomineeId,
          name: input.name,
          email: input.email,
          createdAt: FieldValue.serverTimestamp(),
        });

        transaction.set(
          refs.totals.doc(input.nomineeId),
          { count: FieldValue.increment(1) },
          { merge: true },
        );

        transaction.set(browserRef, {
          count: browserCount + 1,
          windowStart: Timestamp.fromMillis(browserBucket.windowStart),
          expiresAt: Timestamp.fromMillis(browserBucket.expiresAt),
        });

        if (ipRef && ipSnap) {
          const ipCount = ipSnap.exists ? Number(ipSnap.get('count') || 0) : 0;
          transaction.set(ipRef, {
            count: ipCount + 1,
            windowStart: Timestamp.fromMillis(ipBucket.windowStart),
            expiresAt: Timestamp.fromMillis(ipBucket.expiresAt),
          });
        }

        return { status: 'accepted', nomineeId: input.nomineeId };
      });
    } catch (error) {
      throw toDomainError(error);
    }
  };
}

module.exports = {
  createCastAwardVote,
  competitionRefs,
  readClientIp,
  CLOSED_MESSAGE,
  NOT_OPEN_MESSAGE,
  UNAVAILABLE_MESSAGE,
  BROWSER_LIMIT_MESSAGE,
  NETWORK_LIMIT_MESSAGE,
};
