'use strict';

/**
 * Awards vote acceptance tests.
 *
 * Policy tests run anywhere:
 *   node --test functions/test/awards-voting.test.js
 *
 * Transaction tests need the Firestore emulator and are run through:
 *   npm run test:emulator:voting
 * (which is `firebase emulators:exec --only firestore --project demo-acbf ...`).
 * They never touch production: the emulator is selected by project id.
 */

const { describe, it, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const policy = require('../src/awards/policy');
const {
  createCastAwardVote,
  BROWSER_LIMIT_MESSAGE,
  NETWORK_LIMIT_MESSAGE,
} = require('../src/awards/voting');

const PROJECT_ID = 'demo-acbf';
const DEADLINE = policy.VOTING_DEADLINE_MS;
const HAS_EMULATOR = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

const CATEGORY_ID = 'education';
const NOMINEE_ID = 'education-kenya-some-person';
const OTHER_NOMINEE_ID = 'education-botswana-other-person';

function newToken() {
  return crypto.randomUUID();
}

function basePayload(overrides = {}) {
  return {
    competitionId: '2026',
    categoryId: CATEGORY_ID,
    nomineeId: NOMINEE_ID,
    browserToken: newToken(),
    ...overrides,
  };
}

function isHttpsError(code) {
  return (error) => {
    assert.equal(error.code, code, `expected ${code}, got ${error.code} (${error.message})`);
    return true;
  };
}

// ---------------------------------------------------------------------------
// Policy: opening window
// ---------------------------------------------------------------------------

describe('isVotingOpen', () => {
  const openConfig = { isOpen: true, closesAt: new Date(DEADLINE) };

  it('accepts votes before the deadline', () => {
    assert.equal(policy.isVotingOpen(openConfig, DEADLINE - 1), true);
    assert.equal(policy.isVotingOpen(openConfig, DEADLINE - 60 * 60 * 1000), true);
  });

  it('rejects votes exactly at 2026-11-19T14:00:00Z', () => {
    assert.equal(Date.parse('2026-11-19T14:00:00Z'), DEADLINE);
    assert.equal(policy.isVotingOpen(openConfig, DEADLINE), false);
  });

  it('rejects votes after the deadline', () => {
    assert.equal(policy.isVotingOpen(openConfig, DEADLINE + 1), false);
  });

  it('stays closed when the admin flag is false, even before the deadline', () => {
    assert.equal(policy.isVotingOpen({ isOpen: false, closesAt: new Date(DEADLINE) }, DEADLINE - 1000), false);
    assert.equal(policy.isVotingOpen({ isOpen: 'true', closesAt: new Date(DEADLINE) }, 0), false);
  });

  it('is closed when the competition is missing or has no closing time', () => {
    assert.equal(policy.isVotingOpen(null, 0), false);
    assert.equal(policy.isVotingOpen(undefined, 0), false);
    assert.equal(policy.isVotingOpen({ isOpen: true }, 0), false);
    assert.equal(policy.isVotingOpen({ isOpen: true, closesAt: 'not-a-date' }, 0), false);
  });

  it('understands Firestore timestamps', () => {
    const fakeTimestamp = { toMillis: () => DEADLINE };
    assert.equal(policy.isVotingOpen({ isOpen: true, closesAt: fakeTimestamp }, DEADLINE - 1), true);
  });
});

// ---------------------------------------------------------------------------
// Policy: input validation
// ---------------------------------------------------------------------------

describe('validateVoteInput', () => {
  it('accepts a minimal anonymous vote and stores null identity fields', () => {
    const input = policy.validateVoteInput(basePayload());
    assert.equal(input.name, null);
    assert.equal(input.email, null);
    assert.equal(input.competitionId, '2026');
    assert.equal(input.categoryId, CATEGORY_ID);
    assert.equal(input.nomineeId, NOMINEE_ID);
  });

  it('trims optional identity details', () => {
    const input = policy.validateVoteInput(
      basePayload({ name: '  Thandi Mokoena  ', email: '  voter@example.com ' }),
    );
    assert.equal(input.name, 'Thandi Mokoena');
    assert.equal(input.email, 'voter@example.com');
  });

  it('treats blank identity fields as absent', () => {
    const input = policy.validateVoteInput(basePayload({ name: '   ', email: '' }));
    assert.equal(input.name, null);
    assert.equal(input.email, null);
  });

  it('rejects unexpected fields, including client timestamps', () => {
    assert.throws(() => policy.validateVoteInput(basePayload({ timestamp: 1 })), isHttpsError('invalid-argument'));
    assert.throws(() => policy.validateVoteInput(basePayload({ isAdmin: true })), isHttpsError('invalid-argument'));
  });

  it('rejects a non-object payload', () => {
    for (const payload of [null, undefined, 'vote', 42, []]) {
      assert.throws(() => policy.validateVoteInput(payload), isHttpsError('invalid-argument'));
    }
  });

  it('rejects malformed identifiers and tokens', () => {
    assert.throws(() => policy.validateVoteInput(basePayload({ competitionId: '2025' })), isHttpsError('invalid-argument'));
    assert.throws(() => policy.validateVoteInput(basePayload({ categoryId: 'Education Category!' })), isHttpsError('invalid-argument'));
    assert.throws(() => policy.validateVoteInput(basePayload({ nomineeId: '../escape' })), isHttpsError('invalid-argument'));
    assert.throws(() => policy.validateVoteInput(basePayload({ browserToken: 'not-a-uuid' })), isHttpsError('invalid-argument'));
    assert.throws(() => policy.validateVoteInput(basePayload({ browserToken: undefined })), isHttpsError('invalid-argument'));
  });

  it('enforces name and email limits', () => {
    assert.throws(
      () => policy.validateVoteInput(basePayload({ name: 'a'.repeat(121) })),
      isHttpsError('invalid-argument'),
    );
    assert.throws(
      () => policy.validateVoteInput(basePayload({ email: `${'a'.repeat(250)}@example.com` })),
      isHttpsError('invalid-argument'),
    );
    assert.throws(() => policy.validateVoteInput(basePayload({ email: 'not-an-email' })), isHttpsError('invalid-argument'));
    assert.doesNotThrow(() => policy.validateVoteInput(basePayload({ name: 'a'.repeat(120) })));
  });
});

describe('vote keys and rate-limit buckets', () => {
  it('derives a stable vote key per competition/category/browser', () => {
    const token = newToken();
    const key = policy.voteKeyFor({ competitionId: '2026', categoryId: 'education', browserToken: token });
    assert.match(key, /^[a-f0-9]{64}$/);
    assert.equal(
      key,
      policy.voteKeyFor({ competitionId: '2026', categoryId: 'education', browserToken: token }),
    );
    assert.notEqual(
      key,
      policy.voteKeyFor({ competitionId: '2026', categoryId: 'logistics', browserToken: token }),
    );
    assert.ok(!key.includes(token), 'the raw browser token must never be derivable from the key');
  });

  it('buckets rate limits by hour without storing the identity', () => {
    const nowMs = Date.parse('2026-11-18T10:30:00Z');
    const bucket = policy.rateLimitRefFor({ kind: 'browser', identity: 'token-value', nowMs });

    assert.ok(!bucket.key.includes('token-value'));
    assert.equal(bucket.windowStart, Date.parse('2026-11-18T10:00:00Z'));
    assert.equal(bucket.expiresAt, Date.parse('2026-11-18T11:00:00Z'));
    assert.notEqual(
      bucket.key,
      policy.rateLimitRefFor({ kind: 'browser', identity: 'token-value', nowMs: nowMs + policy.HOUR_MS }).key,
    );
  });

  it('hashes IP addresses rather than storing them', () => {
    const hashed = policy.ipIdentity(' 203.0.113.7 ');
    assert.match(hashed, /^[a-f0-9]{64}$/);
    assert.ok(!hashed.includes('203.0.113.7'));
    assert.equal(policy.ipIdentity('  '), null);
  });
});

// ---------------------------------------------------------------------------
// Transactions against the Firestore emulator
// ---------------------------------------------------------------------------

describe(
  'vote acceptance (Firestore emulator)',
  { skip: HAS_EMULATOR ? false : 'FIRESTORE_EMULATOR_HOST is not set — run npm run test:emulator:voting' },
  () => {
    let admin;
    let db;
    let clock;
    let castVote;
    const competition = () => db.doc('award_competitions/2026');
    const votes = () => competition().collection('votes');
    const totals = () => competition().collection('totals');
    const rateLimits = () => competition().collection('rate_limits');

    async function seed({ isOpen = true, closesAt = DEADLINE, withCompetition = true } = {}) {
      if (withCompetition) {
        await competition().set({
          isOpen,
          closesAt: admin.firestore.Timestamp.fromMillis(closesAt),
        });
      }
      await competition().collection('categories').doc(CATEGORY_ID).set({
        id: CATEGORY_ID,
        name: 'Excellence in Education',
      });
      await competition().collection('nominees').doc(NOMINEE_ID).set({
        id: NOMINEE_ID,
        categoryId: CATEGORY_ID,
        businessName: 'Synthetic Business',
        personName: 'Some Person',
        country: 'Kenya',
      });
      await competition().collection('nominees').doc(OTHER_NOMINEE_ID).set({
        id: OTHER_NOMINEE_ID,
        categoryId: CATEGORY_ID,
        businessName: null,
        personName: 'Other Person',
        country: 'Botswana',
      });
    }

    async function totalFor(nomineeId) {
      const snapshot = await totals().doc(nomineeId).get();
      return snapshot.exists ? snapshot.get('count') : 0;
    }

    async function voteCount() {
      const snapshot = await votes().get();
      return snapshot.size;
    }

    async function seedRateLimit(kind, identity, count) {
      const bucket = policy.rateLimitRefFor({ kind, identity, nowMs: clock });
      await rateLimits().doc(bucket.key).set({ count, windowStart: new Date(bucket.windowStart) });
    }

    before(() => {
      admin = require('firebase-admin');
      if (!admin.apps.length) admin.initializeApp({ projectId: PROJECT_ID });
      db = admin.firestore();
    });

    beforeEach(async () => {
      await db.recursiveDelete(competition());
      clock = Date.parse('2026-11-18T12:00:00Z');
      castVote = createCastAwardVote({ db, now: () => clock });
      await seed();
    });

    after(async () => {
      await db.recursiveDelete(competition());
    });

    it('accepts a first vote and increments the private total', async () => {
      const payload = basePayload();
      const result = await castVote(payload, { rawRequest: { ip: '203.0.113.7' } });

      assert.deepEqual(result, { status: 'accepted', nomineeId: NOMINEE_ID });
      assert.equal(await totalFor(NOMINEE_ID), 1);
      assert.equal(await voteCount(), 1);

      const snapshot = await votes().doc(policy.voteKeyFor(payload)).get();
      assert.equal(snapshot.get('nomineeId'), NOMINEE_ID);
      assert.equal(snapshot.get('name'), null);
      assert.equal(snapshot.get('email'), null);
      assert.ok(snapshot.get('createdAt'), 'a server timestamp must be recorded');
      assert.ok(!snapshot.get('browserToken'), 'the raw browser token must never be stored');
    });

    it('answers a retry with already-voted and leaves the total unchanged', async () => {
      const payload = basePayload();
      await castVote(payload, { rawRequest: { ip: '203.0.113.7' } });
      const retry = await castVote(payload, { rawRequest: { ip: '203.0.113.7' } });

      assert.deepEqual(retry, { status: 'already-voted' });
      assert.equal(await totalFor(NOMINEE_ID), 1);
      assert.equal(await voteCount(), 1);

      const bucket = policy.rateLimitRefFor({
        kind: 'browser',
        identity: payload.browserToken,
        nowMs: clock,
      });
      const bucketSnapshot = await rateLimits().doc(bucket.key).get();
      assert.equal(bucketSnapshot.get('count'), 1, 'duplicates must not advance rate-limit counters');
    });

    it('never discloses the prior choice for a duplicate picking another nominee', async () => {
      const payload = basePayload();
      await castVote(payload, { rawRequest: { ip: '203.0.113.7' } });
      const retry = await castVote(
        { ...payload, nomineeId: OTHER_NOMINEE_ID },
        { rawRequest: { ip: '203.0.113.7' } },
      );

      assert.deepEqual(retry, { status: 'already-voted' });
      assert.equal(await totalFor(OTHER_NOMINEE_ID), 0);
      assert.equal(await totalFor(NOMINEE_ID), 1);
    });

    it('counts two concurrent submissions from the same browser once', async () => {
      const payload = basePayload();
      const results = await Promise.allSettled([
        castVote(payload, { rawRequest: { ip: '203.0.113.7' } }),
        castVote(payload, { rawRequest: { ip: '203.0.113.7' } }),
      ]);

      const statuses = results
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value.status)
        .sort();
      assert.deepEqual(statuses, ['accepted', 'already-voted']);
      assert.equal(await voteCount(), 1);
      assert.equal(await totalFor(NOMINEE_ID), 1);
    });

    it('accepts different categories separately for the same browser', async () => {
      await competition().collection('categories').doc('logistics').set({
        id: 'logistics',
        name: 'Excellence in Logistics',
      });
      await competition().collection('nominees').doc('logistics-kenya-person').set({
        id: 'logistics-kenya-person',
        categoryId: 'logistics',
        businessName: null,
        personName: 'Logistics Person',
        country: 'Kenya',
      });

      const token = newToken();
      const first = await castVote(basePayload({ browserToken: token }), { rawRequest: { ip: '203.0.113.7' } });
      const second = await castVote(
        basePayload({ browserToken: token, categoryId: 'logistics', nomineeId: 'logistics-kenya-person' }),
        { rawRequest: { ip: '203.0.113.7' } },
      );

      assert.equal(first.status, 'accepted');
      assert.equal(second.status, 'accepted');
      assert.equal(await totalFor(NOMINEE_ID), 1);
      assert.equal(await totalFor('logistics-kenya-person'), 1);
    });

    it('keeps totals equal to accepted vote records under contention', async () => {
      const tokens = Array.from({ length: 8 }, newToken);
      const results = await Promise.all(
        tokens.map((token, index) =>
          castVote(basePayload({ browserToken: token }), { rawRequest: { ip: `198.51.100.${index}` } }),
        ),
      );

      assert.ok(results.every((result) => result.status === 'accepted'));
      assert.equal(await totalFor(NOMINEE_ID), tokens.length);
      assert.equal(await voteCount(), tokens.length);
    });

    it('rejects votes once the competition flag is closed', async () => {
      await competition().set({
        isOpen: false,
        closesAt: admin.firestore.Timestamp.fromMillis(DEADLINE),
      });

      await assert.rejects(castVote(basePayload()), isHttpsError('failed-precondition'));
      assert.equal(await voteCount(), 0);
    });

    it('rejects votes at and after the deadline, accepting the millisecond before', async () => {
      clock = DEADLINE - 1;
      const accepted = await castVote(basePayload(), { rawRequest: { ip: '203.0.113.7' } });
      assert.equal(accepted.status, 'accepted');

      clock = DEADLINE;
      await assert.rejects(
        castVote(basePayload(), { rawRequest: { ip: '203.0.113.7' } }),
        isHttpsError('failed-precondition'),
      );

      clock = DEADLINE + 1000;
      await assert.rejects(
        castVote(basePayload(), { rawRequest: { ip: '203.0.113.7' } }),
        isHttpsError('failed-precondition'),
      );

      assert.equal(await totalFor(NOMINEE_ID), 1);
    });

    it('re-evaluates the server clock inside the transaction', async () => {
      // The handler reads the clock when it runs, so a page left open past the
      // deadline cannot slip a vote through.
      clock = DEADLINE + 5000;
      await assert.rejects(castVote(basePayload()), isHttpsError('failed-precondition'));
    });

    it('rejects an absent competition configuration', async () => {
      await db.recursiveDelete(competition());
      await seed({ withCompetition: false });

      await assert.rejects(castVote(basePayload()), isHttpsError('failed-precondition'));
      assert.equal(await voteCount(), 0);
    });

    it('rejects unknown nominees and category mismatches', async () => {
      await assert.rejects(
        castVote(basePayload({ nomineeId: 'education-kenya-does-not-exist' })),
        isHttpsError('invalid-argument'),
      );
      await assert.rejects(
        castVote(basePayload({ categoryId: 'logistics' })),
        isHttpsError('invalid-argument'),
      );
      await assert.rejects(
        castVote(basePayload({ nomineeId: OTHER_NOMINEE_ID, categoryId: 'logistics' })),
        isHttpsError('invalid-argument'),
      );
      assert.equal(await voteCount(), 0);
    });

    it('rejects disabled nominees', async () => {
      await competition().collection('nominees').doc(NOMINEE_ID).update({ disabled: true });

      await assert.rejects(castVote(basePayload()), isHttpsError('failed-precondition'));
      assert.equal(await voteCount(), 0);
    });

    it('enforces the per-browser hourly ceiling with a clear retry message', async () => {
      const payload = basePayload();
      await seedRateLimit('browser', payload.browserToken, policy.RATE_LIMITS.browserPerHour);

      await assert.rejects(castVote(payload), (error) => {
        assert.equal(error.code, 'resource-exhausted');
        assert.equal(error.message, BROWSER_LIMIT_MESSAGE);
        return true;
      });
      assert.equal(await voteCount(), 0);
    });

    it('enforces the per-network ceiling without storing the IP', async () => {
      const payload = basePayload();
      await seedRateLimit('ip', policy.ipIdentity('198.51.100.9'), policy.RATE_LIMITS.ipPerHour);

      await assert.rejects(
        castVote(payload, { rawRequest: { ip: '198.51.100.9' } }),
        (error) => {
          assert.equal(error.code, 'resource-exhausted');
          assert.equal(error.message, NETWORK_LIMIT_MESSAGE);
          return true;
        },
      );
      assert.equal(await voteCount(), 0);
    });

    it('resets the ceiling in a new hour', async () => {
      const payload = basePayload();
      await seedRateLimit('browser', payload.browserToken, policy.RATE_LIMITS.browserPerHour);

      clock += policy.HOUR_MS;
      const result = await castVote(payload, { rawRequest: { ip: '203.0.113.7' } });
      assert.equal(result.status, 'accepted');
    });

    it('rejects malformed payloads with invalid-argument', async () => {
      await assert.rejects(castVote(undefined), isHttpsError('invalid-argument'));
      await assert.rejects(castVote({ ...basePayload(), extra: true }), isHttpsError('invalid-argument'));
      await assert.rejects(
        castVote(basePayload({ browserToken: 'nope' })),
        isHttpsError('invalid-argument'),
      );
      assert.equal(await voteCount(), 0);
    });

    it('stores optional identity details only on the private vote record', async () => {
      const payload = basePayload({ name: '  Thandi Mokoena ', email: ' thandi@example.com ' });
      await castVote(payload, { rawRequest: { ip: '203.0.113.7' } });

      const snapshot = await votes().doc(policy.voteKeyFor(payload)).get();
      assert.equal(snapshot.get('name'), 'Thandi Mokoena');
      assert.equal(snapshot.get('email'), 'thandi@example.com');

      const nominee = await competition().collection('nominees').doc(NOMINEE_ID).get();
      assert.equal(nominee.get('name'), undefined);
      assert.deepEqual(Object.keys(nominee.data()).sort(), [
        'businessName',
        'categoryId',
        'country',
        'id',
        'personName',
      ]);
    });
  },
);
