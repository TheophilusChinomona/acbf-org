'use strict';

/**
 * HTTP error envelope and status translation.
 *
 * Responses are always `{data: ...}` or `{error: {code, message}}`. Domain error
 * codes keep their approved safe messages; anything unrecognised becomes a
 * generic `unavailable` so internal detail cannot reach the browser.
 */

const {
  DEFAULT_MESSAGES,
  ERROR_CODES,
  normalizeDomainError,
} = require('../errors');

const STATUS_BY_CODE = Object.freeze({
  [ERROR_CODES.INVALID_ARGUMENT]: 400,
  [ERROR_CODES.UNAUTHENTICATED]: 401,
  [ERROR_CODES.PERMISSION_DENIED]: 403,
  [ERROR_CODES.NOT_FOUND]: 404,
  [ERROR_CODES.ALREADY_EXISTS]: 409,
  [ERROR_CODES.FAILED_PRECONDITION]: 409,
  [ERROR_CODES.RESOURCE_EXHAUSTED]: 429,
  [ERROR_CODES.UNAVAILABLE]: 503,
  [ERROR_CODES.INTERNAL]: 503,
});

/** Message used for any unexpected failure, including a handler timeout. */
const UNEXPECTED_MESSAGE = 'The voting service is temporarily unavailable. Please try again.';

const BASE_HEADERS = Object.freeze({
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
});

const MESSAGES = Object.freeze({
  notJson: 'Requests must use a JSON body with content-type application/json.',
  bodyTooLarge: 'The request body is too large.',
  notAnObject: 'The request body must be a JSON object.',
  notFound: 'That endpoint does not exist.',
  methodNotAllowed: 'That method is not supported for this endpoint.',
  originDenied: 'This request is not permitted.',
  clientIdentity: UNEXPECTED_MESSAGE,
});

/**
 * @param {import('node:http').ServerResponse} res
 * @param {number} status
 * @param {unknown} body
 * @param {Record<string, string>} [extraHeaders]
 */
function sendJson(res, status, body, extraHeaders = {}) {
  if (res.headersSent) return;
  res.writeHead(status, { ...BASE_HEADERS, ...extraHeaders });
  res.end(JSON.stringify(body));
}

function sendData(res, status, data) {
  sendJson(res, status, { data });
}

/**
 * Transport-level rejection that has no domain error behind it.
 *
 * @param {import('node:http').ServerResponse} res
 * @param {number} status
 * @param {string} code
 * @param {string} message
 * @param {Record<string, string>} [extraHeaders]
 */
function sendError(res, status, code, message, extraHeaders = {}) {
  sendJson(res, status, { error: { code, message } }, extraHeaders);
}

/**
 * Translate a thrown service error into the response envelope.
 *
 * @param {import('node:http').ServerResponse} res
 * @param {unknown} error
 * @param {{context?: string, message?: string}} [options]
 */
function sendServiceError(res, error, { context = 'api request', message = UNEXPECTED_MESSAGE } = {}) {
  const domainError = normalizeDomainError(error, { context, message });
  const status = STATUS_BY_CODE[domainError.code] || 503;
  sendError(res, status, domainError.code, domainError.message || DEFAULT_MESSAGES[domainError.code]);
}

module.exports = {
  MESSAGES,
  STATUS_BY_CODE,
  UNEXPECTED_MESSAGE,
  sendData,
  sendError,
  sendJson,
  sendServiceError,
};
