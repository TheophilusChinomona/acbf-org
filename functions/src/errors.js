'use strict';

/**
 * Transport-independent domain errors.
 *
 * Business services under `src/awards/` and `src/admin/` must not depend on the
 * Cloud Functions runtime: the same handlers run behind the internal HTTP API on
 * Dokploy. They therefore throw `DomainError` carrying a stable, client-safe
 * `code` and message. The callable adapter in `functions/index.js` and the HTTP
 * adapter in `src/api/errors.js` are the only places that translate them into
 * their own error type.
 *
 * Messages placed on a `DomainError` are reviewed safe text: they may explain
 * what the caller did wrong or that the service is unavailable, and must never
 * contain voter identity, tokens, credentials or internal stack detail.
 */

const ERROR_CODES = Object.freeze({
  INVALID_ARGUMENT: 'invalid-argument',
  UNAUTHENTICATED: 'unauthenticated',
  PERMISSION_DENIED: 'permission-denied',
  NOT_FOUND: 'not-found',
  ALREADY_EXISTS: 'already-exists',
  FAILED_PRECONDITION: 'failed-precondition',
  RESOURCE_EXHAUSTED: 'resource-exhausted',
  UNAVAILABLE: 'unavailable',
  INTERNAL: 'internal',
});

const CODE_VALUES = Object.freeze(new Set(Object.values(ERROR_CODES)));

/**
 * Fallback text for each code. Used whenever a raw (non-domain) failure has to
 * be reported and when a caller passes an empty message.
 */
const DEFAULT_MESSAGES = Object.freeze({
  [ERROR_CODES.INVALID_ARGUMENT]: 'The request was not valid.',
  [ERROR_CODES.UNAUTHENTICATED]: 'Sign in is required for this request.',
  [ERROR_CODES.PERMISSION_DENIED]: 'This request is not permitted.',
  [ERROR_CODES.NOT_FOUND]: 'The requested item was not found.',
  [ERROR_CODES.ALREADY_EXISTS]: 'That item already exists.',
  [ERROR_CODES.FAILED_PRECONDITION]:
    'This request cannot be completed in the current state.',
  [ERROR_CODES.RESOURCE_EXHAUSTED]: 'Too many requests. Please try again later.',
  [ERROR_CODES.UNAVAILABLE]: 'The service is temporarily unavailable. Please try again.',
  [ERROR_CODES.INTERNAL]: 'Something went wrong. Please try again.',
});

class DomainError extends Error {
  /**
   * @param {string} code - One of `ERROR_CODES`.
   * @param {string} [message] - Reviewed, client-safe text.
   */
  constructor(code, message) {
    const safeCode = CODE_VALUES.has(code) ? code : ERROR_CODES.INTERNAL;
    const text =
      typeof message === 'string' && message.trim().length > 0
        ? message
        : DEFAULT_MESSAGES[safeCode];
    super(text);
    this.name = 'DomainError';
    this.code = safeCode;
  }
}

function isDomainError(value) {
  return value instanceof DomainError;
}

/**
 * Coerce any thrown value into a `DomainError`.
 *
 * Unexpected failures are logged by shape only (never payload or identity) and
 * reported as a generic `unavailable` so an internal message cannot leak.
 *
 * @param {unknown} error
 * @param {{context?: string, message?: string, log?: Function}} [options]
 * @returns {DomainError}
 */
function normalizeDomainError(error, { context = 'domain call', message, log = console.error } = {}) {
  if (isDomainError(error)) return error;

  log(`${context} failed`, {
    name: error && error.name,
    code: error && error.code,
  });

  return new DomainError(ERROR_CODES.UNAVAILABLE, message);
}

/**
 * The approved `{code, message}` pair for any thrown value. Adapters use this so
 * both transports report identical text for the same failure.
 *
 * @param {unknown} error
 * @param {{context?: string, message?: string}} [options]
 * @returns {{code: string, message: string}}
 */
function toPublicError(error, options = {}) {
  const domainError = isDomainError(error)
    ? error
    : normalizeDomainError(error, options);
  return {
    code: domainError.code,
    message: domainError.message || DEFAULT_MESSAGES[domainError.code],
  };
}

module.exports = {
  ERROR_CODES,
  DEFAULT_MESSAGES,
  DomainError,
  isDomainError,
  normalizeDomainError,
  toPublicError,
};
