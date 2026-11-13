'use strict';

/**
 * Awards voting policy: the single source of truth for the competition id, the
 * closing boundary, input validation, deduplication keys and rate-limit buckets.
 *
 * Kept free of Firebase imports so it can be unit tested directly and reused by
 * the import script.
 */

const crypto = require('node:crypto');

const VOTING_COMPETITION_ID = '2026';

/** Closing time confirmed with the client: 19 November 2026, 16:00 SAST (UTC+2). */
const VOTING_DEADLINE_ISO = '2026-11-19T14:00:00Z';
const VOTING_DEADLINE_MS = Date.parse(VOTING_DEADLINE_ISO);

const COMPETITION_COLLECTION = 'award_competitions';
const SUBCOLLECTIONS = Object.freeze({
  categories: 'categories',
  nominees: 'nominees',
  votes: 'votes',
  totals: 'totals',
  rateLimits: 'rate_limits',
});

/** Ceilings on accepted votes per rolling hour; duplicates never count. */
const RATE_LIMITS = Object.freeze({
  browserPerHour: 60,
  ipPerHour: 600,
});

const HOUR_MS = 60 * 60 * 1000;

const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,127}$/;

const ALLOWED_VOTE_FIELDS = Object.freeze([
  'competitionId',
  'categoryId',
  'nomineeId',
  'browserToken',
  'name',
  'email',
]);

const ERROR_CODES = Object.freeze({
  INVALID_ARGUMENT: 'invalid-argument',
  FAILED_PRECONDITION: 'failed-precondition',
  RESOURCE_EXHAUSTED: 'resource-exhausted',
  UNAVAILABLE: 'unavailable',
});

/** Error carrying one of the callable error codes the client understands. */
class AwardsVoteError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'AwardsVoteError';
    this.code = code;
  }
}

function invalid(message) {
  return new AwardsVoteError(ERROR_CODES.INVALID_ARGUMENT, message);
}

/**
 * Read a Firestore Timestamp, Date, ISO string or epoch-ms value as epoch ms.
 *
 * @param {unknown} value
 * @returns {number|null}
 */
function toEpochMs(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value instanceof Date) {
    const ms = value.getTime();
    return Number.isFinite(ms) ? ms : null;
  }
  if (typeof value === 'object' && typeof value.toMillis === 'function') {
    const ms = value.toMillis();
    return Number.isFinite(ms) ? ms : null;
  }
  if (typeof value === 'string') {
    const ms = Date.parse(value);
    return Number.isNaN(ms) ? null : ms;
  }
  return null;
}

/**
 * Decide whether votes are currently accepted.
 *
 * Voting is closed when the competition document is missing, when the admin flag
 * is not exactly `true`, when no closing time is configured, or when the server
 * clock has reached the closing time. The flag can never extend the deadline.
 *
 * @param {{isOpen?: boolean, closesAt?: unknown}|null|undefined} config
 * @param {number} nowMs - Server time in epoch milliseconds.
 * @returns {boolean}
 */
function isVotingOpen(config, nowMs) {
  if (!config || typeof config !== 'object') return false;
  if (config.isOpen !== true) return false;

  const closesAtMs = toEpochMs(config.closesAt);
  if (closesAtMs === null) return false;
  if (!Number.isFinite(nowMs)) return false;

  return nowMs < closesAtMs;
}

function trimmedOrNull(value) {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function assertId(value, fieldName) {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) {
    throw invalid(`${fieldName} is not a valid identifier.`);
  }
  return value;
}

/**
 * Validate and normalize a vote payload.
 *
 * Only the documented fields are accepted; anything else — including a client
 * supplied timestamp — is rejected. Optional identity fields are trimmed and
 * stored as null when absent or blank.
 *
 * @param {unknown} data - Raw callable payload.
 * @returns {{competitionId: string, categoryId: string, nomineeId: string, browserToken: string, name: string|null, email: string|null}}
 */
function validateVoteInput(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw invalid('A vote must be an object.');
  }

  const unexpected = Object.keys(data).filter((key) => !ALLOWED_VOTE_FIELDS.includes(key));
  if (unexpected.length > 0) {
    throw invalid(`Unexpected field(s): ${unexpected.join(', ')}.`);
  }

  const competitionId = assertId(data.competitionId, 'competitionId');
  if (competitionId !== VOTING_COMPETITION_ID) {
    throw invalid('Unknown competition.');
  }

  const categoryId = assertId(data.categoryId, 'categoryId');
  const nomineeId = assertId(data.nomineeId, 'nomineeId');

  if (typeof data.browserToken !== 'string' || !UUID_PATTERN.test(data.browserToken.trim())) {
    throw invalid('A browser token is required.');
  }

  const name = trimmedOrNull(data.name);
  if (name !== null && name.length > MAX_NAME_LENGTH) {
    throw invalid(`Name must be ${MAX_NAME_LENGTH} characters or fewer.`);
  }

  const email = trimmedOrNull(data.email);
  if (email !== null) {
    if (email.length > MAX_EMAIL_LENGTH) {
      throw invalid(`Email must be ${MAX_EMAIL_LENGTH} characters or fewer.`);
    }
    if (!EMAIL_PATTERN.test(email)) {
      throw invalid('Email address is not valid.');
    }
  }

  return {
    competitionId,
    categoryId,
    nomineeId,
    browserToken: data.browserToken.trim(),
    name,
    email,
  };
}

function sha256Hex(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

/**
 * Stable vote document id: one accepted vote per competition/category/browser.
 *
 * @param {{competitionId: string, categoryId: string, browserToken: string}} params
 * @returns {string}
 */
function voteKeyFor({ competitionId, categoryId, browserToken }) {
  return sha256Hex(`${competitionId}\u0000${categoryId}\u0000${browserToken}`);
}

/**
 * Hour bucket for rate limiting. The bucket start is part of the document id, so
 * a new hour always starts from zero and expired buckets never need to be deleted
 * for correctness.
 *
 * @param {number} nowMs
 * @returns {{hourIndex: number, windowStart: number, expiresAt: number}}
 */
function hourBucket(nowMs) {
  const hourIndex = Math.floor(nowMs / HOUR_MS);
  return {
    hourIndex,
    windowStart: hourIndex * HOUR_MS,
    expiresAt: (hourIndex + 1) * HOUR_MS,
  };
}

/**
 * Rate-limit document id for one identity in the current hour. The identity is
 * hashed; raw browser tokens and IP addresses are never stored.
 *
 * @param {{kind: 'browser'|'ip', identity: string, nowMs: number}} params
 * @returns {{key: string, windowStart: number, expiresAt: number, count: number}}
 */
function rateLimitRefFor({ kind, identity, nowMs }) {
  const bucket = hourBucket(nowMs);
  return {
    key: `${kind}_${sha256Hex(`${kind}\u0000${identity}\u0000${bucket.hourIndex}`)}`,
    windowStart: bucket.windowStart,
    expiresAt: bucket.expiresAt,
  };
}

/**
 * Hashed IP identity so a shared network can be rate limited without storing IPs.
 *
 * @param {unknown} ip
 * @returns {string|null}
 */
function ipIdentity(ip) {
  const trimmed = trimmedOrNull(ip);
  return trimmed === null ? null : sha256Hex(trimmed);
}

module.exports = {
  VOTING_COMPETITION_ID,
  VOTING_DEADLINE_ISO,
  VOTING_DEADLINE_MS,
  COMPETITION_COLLECTION,
  SUBCOLLECTIONS,
  RATE_LIMITS,
  HOUR_MS,
  MAX_NAME_LENGTH,
  MAX_EMAIL_LENGTH,
  ALLOWED_VOTE_FIELDS,
  ERROR_CODES,
  AwardsVoteError,
  isVotingOpen,
  validateVoteInput,
  sha256Hex,
  voteKeyFor,
  rateLimitRefFor,
  ipIdentity,
  hourBucket,
};
