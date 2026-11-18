'use strict';

/**
 * SQLite-backed award voting.
 *
 * Replaces the Firestore transaction in `voting.js` so a vote never depends on
 * Firestore quota. Same contract as `createCastAwardVote`: validate, check the
 * catalogue, deduplicate per competition/category/browser, enforce the hourly
 * browser and network ceilings, then record the vote - all inside one
 * `BEGIN IMMEDIATE` transaction. The API is one process and SQLite serialises
 * writers, so a retried or concurrent submission can never count twice.
 *
 * The catalogue (competition settings, categories, nominees) is a JSON snapshot
 * file exported once from Firestore; it is reloaded when the file changes.
 * Totals are derived from the votes table, so they can never drift from it.
 */

const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const policy = require('./policy');
const { normalizeDomainError } = require('../errors');

const { AwardsVoteError, ERROR_CODES } = policy;

const UNAVAILABLE_MESSAGE = 'Voting is temporarily unavailable. Please try again.';
const CLOSED_MESSAGE = 'Voting has closed for the 2026 ACBF Awards.';
const NOT_OPEN_MESSAGE = 'Voting is not open for the 2026 ACBF Awards.';
const BROWSER_LIMIT_MESSAGE =
  'Too many votes from this browser in the last hour. Please try again later.';
const NETWORK_LIMIT_MESSAGE =
  'Too many votes from this network in the last hour. Please try again later.';

const CATALOGUE_RECHECK_MS = 5_000;

/**
 * Catalogue snapshot reader. The file is re-stat'ed at most every few seconds so
 * a fresh export is picked up without restarting the API.
 *
 * @param {string} filePath
 * @param {{now?: () => number}} [options]
 */
function createCatalogueSource(filePath, { now = Date.now } = {}) {
  let cached = null;
  let cachedMtime = null;
  let checkedAt = 0;

  function load() {
    const stat = fs.statSync(filePath);
    if (cached && cachedMtime === stat.mtimeMs) return cached;

    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !parsed.competition ||
      !Array.isArray(parsed.categories) ||
      !Array.isArray(parsed.nominees)
    ) {
      throw new Error('catalogue snapshot has an unexpected shape');
    }

    const categoryIds = new Set(parsed.categories.map((category) => category.id));
    const nomineesById = new Map(parsed.nominees.map((nominee) => [nominee.id, nominee]));
    cached = { snapshot: parsed, categoryIds, nomineesById };
    cachedMtime = stat.mtimeMs;
    return cached;
  }

  return {
    /** @returns {{snapshot: object, categoryIds: Set<string>, nomineesById: Map<string, object>}|null} */
    get() {
      const t = now();
      if (cached && t - checkedAt < CATALOGUE_RECHECK_MS) return cached;
      checkedAt = t;
      try {
        return load();
      } catch {
        return cached; // keep serving the last good snapshot
      }
    },
  };
}

/**
 * @param {{path: string, catalogue: ReturnType<typeof createCatalogueSource>, now?: () => number}} options
 */
function createSqliteVoteStore({ path: dbPath, catalogue, now = Date.now } = {}) {
  if (typeof dbPath !== 'string' || dbPath === '') {
    throw new TypeError('createSqliteVoteStore requires a database path');
  }
  if (!catalogue || typeof catalogue.get !== 'function') {
    throw new TypeError('createSqliteVoteStore requires a catalogue source');
  }

  if (dbPath !== ':memory:') fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = FULL;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS votes (
      vote_key       TEXT PRIMARY KEY,
      competition_id TEXT NOT NULL,
      category_id    TEXT NOT NULL,
      nominee_id     TEXT NOT NULL,
      name           TEXT,
      email          TEXT,
      created_at     INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS votes_by_nominee ON votes (nominee_id);
    CREATE TABLE IF NOT EXISTS rate_limits (
      key          TEXT PRIMARY KEY,
      count        INTEGER NOT NULL,
      window_start INTEGER NOT NULL,
      expires_at   INTEGER NOT NULL
    );
  `);

  const selectVote = db.prepare('SELECT 1 AS found FROM votes WHERE vote_key = ?');
  const selectBucket = db.prepare('SELECT count FROM rate_limits WHERE key = ?');
  const insertVote = db.prepare(
    `INSERT INTO votes (vote_key, competition_id, category_id, nominee_id, name, email, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  const upsertBucket = db.prepare(
    `INSERT INTO rate_limits (key, count, window_start, expires_at) VALUES (?, 1, ?, ?)
     ON CONFLICT(key) DO UPDATE SET count = count + 1`,
  );
  const purgeBuckets = db.prepare('DELETE FROM rate_limits WHERE expires_at < ?');
  const importVote = db.prepare(
    `INSERT OR IGNORE INTO votes (vote_key, competition_id, category_id, nominee_id, name, email, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );

  function toDomainError(error) {
    return normalizeDomainError(error, { context: 'castAwardVote', message: UNAVAILABLE_MESSAGE });
  }

  function inTransaction(work) {
    db.exec('BEGIN IMMEDIATE');
    try {
      const result = work();
      db.exec('COMMIT');
      return result;
    } catch (error) {
      try {
        db.exec('ROLLBACK');
      } catch {
        // the original error is the one worth reporting
      }
      throw error;
    }
  }

  /**
   * @param {unknown} data
   * @param {{clientIp?: string, rawRequest?: {ip?: string}}} [context]
   */
  async function castAwardVote(data, context = {}) {
    try {
      const input = policy.validateVoteInput(data);
      const loaded = catalogue.get();
      if (!loaded) throw new Error('catalogue snapshot is not available');

      const nowMs = now();
      if (!loaded.snapshot.competition) {
        throw new AwardsVoteError(ERROR_CODES.FAILED_PRECONDITION, NOT_OPEN_MESSAGE);
      }
      if (!policy.isVotingOpen(loaded.snapshot.competition, nowMs)) {
        throw new AwardsVoteError(ERROR_CODES.FAILED_PRECONDITION, CLOSED_MESSAGE);
      }
      if (!loaded.categoryIds.has(input.categoryId)) {
        throw new AwardsVoteError(ERROR_CODES.INVALID_ARGUMENT, 'Unknown award category.');
      }
      const nominee = loaded.nomineesById.get(input.nomineeId);
      if (!nominee) {
        throw new AwardsVoteError(ERROR_CODES.INVALID_ARGUMENT, 'Unknown nominee.');
      }
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

      const voteKey = policy.voteKeyFor(input);
      const clientIp = typeof context.clientIp === 'string' ? context.clientIp : context.rawRequest?.ip;
      const hashedIp = policy.ipIdentity(typeof clientIp === 'string' ? clientIp : null);
      const browserBucket = policy.rateLimitRefFor({
        kind: 'browser',
        identity: input.browserToken,
        nowMs,
      });
      const ipBucket = hashedIp
        ? policy.rateLimitRefFor({ kind: 'ip', identity: hashedIp, nowMs })
        : null;

      return inTransaction(() => {
        // A duplicate is answered before any counter is touched.
        if (selectVote.get(voteKey)) return { status: 'already-voted' };

        const browserCount = selectBucket.get(browserBucket.key)?.count ?? 0;
        if (browserCount >= policy.RATE_LIMITS.browserPerHour) {
          throw new AwardsVoteError(ERROR_CODES.RESOURCE_EXHAUSTED, BROWSER_LIMIT_MESSAGE);
        }
        if (ipBucket) {
          const ipCount = selectBucket.get(ipBucket.key)?.count ?? 0;
          if (ipCount >= policy.RATE_LIMITS.ipPerHour) {
            throw new AwardsVoteError(ERROR_CODES.RESOURCE_EXHAUSTED, NETWORK_LIMIT_MESSAGE);
          }
        }

        insertVote.run(
          voteKey,
          input.competitionId,
          input.categoryId,
          input.nomineeId,
          input.name,
          input.email,
          nowMs,
        );
        upsertBucket.run(browserBucket.key, browserBucket.windowStart, browserBucket.expiresAt);
        if (ipBucket) upsertBucket.run(ipBucket.key, ipBucket.windowStart, ipBucket.expiresAt);
        purgeBuckets.run(nowMs - policy.HOUR_MS);

        return { status: 'accepted', nomineeId: input.nomineeId };
      });
    } catch (error) {
      throw toDomainError(error);
    }
  }

  /**
   * Import votes recorded elsewhere (for example in Firestore before the switch).
   * Existing keys are left untouched, so the import can be re-run safely.
   *
   * @param {Array<{voteKey: string, competitionId: string, categoryId: string, nomineeId: string, name?: string|null, email?: string|null, createdAt: number}>} rows
   * @returns {{imported: number, skipped: number}}
   */
  function importVotes(rows) {
    let imported = 0;
    let skipped = 0;
    inTransaction(() => {
      for (const row of rows) {
        const result = importVote.run(
          row.voteKey,
          row.competitionId,
          row.categoryId,
          row.nomineeId,
          row.name ?? null,
          row.email ?? null,
          row.createdAt,
        );
        if (result.changes > 0) imported += 1;
        else skipped += 1;
      }
    });
    return { imported, skipped };
  }

  /** @returns {Array<{nomineeId: string, categoryId: string, count: number}>} */
  function totals() {
    return db
      .prepare(
        `SELECT nominee_id AS nomineeId, category_id AS categoryId, COUNT(*) AS count
         FROM votes GROUP BY nominee_id, category_id ORDER BY category_id, count DESC`,
      )
      .all()
      .map((row) => ({ ...row, count: Number(row.count) }));
  }

  /**
   * Everything the admin results panel shows, in the shape it already uses.
   * Totals come from the votes table; individual votes and voter details are
   * never included.
   */
  function results() {
    const loaded = catalogue.get();
    if (!loaded) throw new Error('catalogue snapshot is not available');
    const totalsByNominee = {};
    let acceptedVoteCount = 0;
    for (const row of totals()) {
      totalsByNominee[row.nomineeId] = row.count;
      acceptedVoteCount += row.count;
    }
    return {
      competition: loaded.snapshot.competition,
      categories: loaded.snapshot.categories,
      nominees: loaded.snapshot.nominees,
      totals: totalsByNominee,
      acceptedVoteCount,
    };
  }

  /**
   * Every accepted vote, oldest first, for the private admin export. This
   * includes the optional voter name and email, which voters were told are kept
   * private, so only the admin-authorised route may return it. The vote key
   * (a hash of the browser token) is deliberately left out.
   *
   * @returns {Array<{categoryId: string, nomineeId: string, name: string|null,
   *   email: string|null, createdAt: number}>}
   */
  function votes() {
    return db
      .prepare(
        `SELECT category_id AS categoryId, nominee_id AS nomineeId, name, email,
                created_at AS createdAt
         FROM votes ORDER BY created_at, rowid`,
      )
      .all()
      .map((row) => ({ ...row, createdAt: Number(row.createdAt) }));
  }

  /** Throws unless the database answers and a catalogue snapshot is loaded. */
  function readiness() {
    db.prepare('SELECT 1').get();
    if (!catalogue.get()) throw new Error('catalogue snapshot is not available');
  }

  return { castAwardVote, importVotes, totals, results, votes, readiness, close: () => db.close() };
}

module.exports = { createSqliteVoteStore, createCatalogueSource };
