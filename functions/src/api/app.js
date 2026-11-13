'use strict';

/**
 * Internal HTTP API for voting and invitation acceptance.
 *
 * This service replaces the Firebase callable transport for production browser
 * flows so nothing has to be deployed to Cloud Functions (which needs Blaze).
 * It is reachable only inside the Compose network: nginx terminates public
 * traffic on the frontend service and proxies `/api/v1/` here.
 *
 * Trust boundaries enforced here:
 * - the caller must send the exact configured `Origin`; the origin is never
 *   treated as voter identity and no wildcard CORS is offered;
 * - the client address used for rate limiting comes only from the single
 *   `X-ACBF-Client-IP` header that nginx overwrites. `X-Forwarded-For` and other
 *   forwarding headers are ignored, so spoofing cannot select a rate-limit bucket;
 * - bodies are capped, unknown fields are rejected, and every response — success,
 *   domain error or proxy failure — is JSON.
 */

const http = require('node:http');
const net = require('node:net');

const { ERROR_CODES } = require('../errors');
const policy = require('../awards/policy');
const { MESSAGES, UNEXPECTED_MESSAGE, sendData, sendError, sendServiceError } = require('./errors');

const JSON_CONTENT_TYPE = 'application/json';
const CLIENT_IP_HEADER = 'x-acbf-client-ip';

const DEFAULT_MAX_BODY_BYTES = 16 * 1024;
const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;
const DEFAULT_HEADERS_TIMEOUT_MS = 10_000;
const DEFAULT_HANDLER_TIMEOUT_MS = 15_000;

const ROUTES = Object.freeze([
  {
    method: 'POST',
    path: '/api/v1/awards/vote',
    kind: 'vote',
    fields: policy.ALLOWED_VOTE_FIELDS,
    requiresClientIp: true,
  },
  {
    method: 'POST',
    path: '/api/v1/admin/invitations/lookup',
    kind: 'lookup',
    fields: Object.freeze(['token']),
  },
  {
    method: 'POST',
    path: '/api/v1/admin/invitations/accept',
    kind: 'accept',
    fields: Object.freeze(['token', 'password', 'name']),
  },
  { method: 'GET', path: '/api/v1/health', kind: 'health' },
  { method: 'GET', path: '/api/v1/ready', kind: 'ready' },
]);

const ROUTES_BY_KEY = new Map(ROUTES.map((route) => [`${route.method} ${route.path}`, route]));
const ROUTES_BY_PATH = new Map(ROUTES.map((route) => [route.path, route]));

class TimeoutError extends Error {
  constructor() {
    super('service call exceeded its deadline');
    this.name = 'TimeoutError';
  }
}

/**
 * Reject after `ms` without leaving a timer behind.
 *
 * @template T
 * @param {Promise<T>} promise
 * @param {number} ms
 * @returns {Promise<T>}
 */
function withTimeout(promise, ms) {
  if (!Number.isFinite(ms) || ms <= 0) return promise;

  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError()), ms);
    if (typeof timer.unref === 'function') timer.unref();
  });

  return Promise.race([promise, deadline]).finally(() => clearTimeout(timer));
}

function isJsonContentType(value) {
  const [type] = String(value || '').split(';');
  return type.trim().toLowerCase() === JSON_CONTENT_TYPE;
}

/**
 * The trusted proxy identity. nginx overwrites this header with `$remote_addr`,
 * so a browser cannot supply it. Multiple values and malformed addresses are
 * rejected rather than guessed.
 *
 * @param {import('node:http').IncomingMessage} req
 * @returns {string|null}
 */
function readClientIp(req) {
  const value = req.headers[CLIENT_IP_HEADER];
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed === '' || trimmed.includes(',')) return null;
  return net.isIP(trimmed) === 0 ? null : trimmed;
}

/**
 * Read and parse a bounded JSON object body.
 *
 * @param {import('node:http').IncomingMessage} req
 * @param {number} maxBytes
 * @returns {Promise<{ok: true, value: Record<string, unknown>}|{ok: false, status: number, message: string}>}
 */
function readJsonBody(req, maxBytes) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };
    const tooLarge = () => {
      finish({ ok: false, status: 413, message: MESSAGES.bodyTooLarge });
    };

    const declaredLength = Number(req.headers['content-length']);
    if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
      req.resume();
      tooLarge();
      return;
    }

    const chunks = [];
    let total = 0;

    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        tooLarge();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (raw.trim() === '') {
        finish({ ok: false, status: 400, message: MESSAGES.notJson });
        return;
      }

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        finish({ ok: false, status: 400, message: MESSAGES.notJson });
        return;
      }

      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        finish({ ok: false, status: 400, message: MESSAGES.notAnObject });
        return;
      }

      finish({ ok: true, value: parsed });
    });

    req.on('error', () => finish({ ok: false, status: 400, message: MESSAGES.notJson }));
    req.on('aborted', () => finish({ ok: false, status: 400, message: MESSAGES.notJson }));
  });
}

async function handleRequest(req, res, settings) {
  const { pathname } = new URL(req.url || '/', 'http://internal');
  const route = ROUTES_BY_KEY.get(`${req.method} ${pathname}`);

  if (!route) {
    const otherMethod = ROUTES_BY_PATH.get(pathname);
    if (otherMethod) {
      sendError(res, 405, ERROR_CODES.INVALID_ARGUMENT, MESSAGES.methodNotAllowed, {
        allow: otherMethod.method,
      });
      return;
    }
    sendError(res, 404, ERROR_CODES.NOT_FOUND, MESSAGES.notFound);
    return;
  }

  if (route.kind === 'health') {
    // Process liveness only: no credential, project or Firestore detail.
    sendData(res, 200, { status: 'ok' });
    return;
  }

  if (route.kind === 'ready') {
    try {
      await withTimeout(Promise.resolve(settings.readiness()), settings.handlerTimeoutMs);
      sendData(res, 200, { status: 'ready' });
    } catch (error) {
      sendServiceError(res, error, { context: 'readiness check' });
    }
    return;
  }

  if (req.headers.origin !== settings.allowedOrigin) {
    sendError(res, 403, ERROR_CODES.PERMISSION_DENIED, MESSAGES.originDenied);
    return;
  }

  if (!isJsonContentType(req.headers['content-type'])) {
    sendError(res, 415, ERROR_CODES.INVALID_ARGUMENT, MESSAGES.notJson);
    return;
  }

  const body = await readJsonBody(req, settings.maxBodyBytes);
  if (!body.ok) {
    sendError(res, body.status, ERROR_CODES.INVALID_ARGUMENT, body.message);
    return;
  }

  const unexpected = Object.keys(body.value).filter((field) => !route.fields.includes(field));
  if (unexpected.length > 0) {
    sendError(
      res,
      400,
      ERROR_CODES.INVALID_ARGUMENT,
      `Unexpected field(s): ${unexpected.join(', ')}.`,
    );
    return;
  }

  let clientIp = null;
  if (route.requiresClientIp) {
    clientIp = readClientIp(req);
    if (clientIp === null) {
      // The proxy contract is broken (or the header was stripped). Never fall
      // back to an attacker-controlled forwarding header.
      settings.logger.warn('api: rejected a vote without a trusted proxy client IP');
      sendError(res, 503, ERROR_CODES.UNAVAILABLE, MESSAGES.clientIdentity);
      return;
    }
  }

  try {
    let result;
    if (route.kind === 'vote') {
      result = await withTimeout(
        Promise.resolve(settings.castVote(body.value, { clientIp })),
        settings.handlerTimeoutMs,
      );
    } else if (route.kind === 'lookup') {
      result = await withTimeout(
        Promise.resolve(settings.lookupInvitation(body.value)),
        settings.handlerTimeoutMs,
      );
    } else {
      result = await withTimeout(
        Promise.resolve(settings.acceptInvitation(body.value)),
        settings.handlerTimeoutMs,
      );
    }

    sendData(res, 200, result);
  } catch (error) {
    sendServiceError(res, error, { context: `api ${route.kind}` });
  }
}

/**
 * Build the API server.
 *
 * @param {{
 *   castVote: Function,
 *   lookupInvitation: Function,
 *   acceptInvitation: Function,
 *   readiness: Function,
 *   allowedOrigin: string,
 *   maxBodyBytes?: number,
 *   requestTimeoutMs?: number,
 *   headersTimeoutMs?: number,
 *   handlerTimeoutMs?: number,
 *   logger?: Console,
 * }} options
 * @returns {import('node:http').Server}
 */
function createApiServer(options = {}) {
  const {
    castVote,
    lookupInvitation,
    acceptInvitation,
    readiness,
    allowedOrigin,
    maxBodyBytes = DEFAULT_MAX_BODY_BYTES,
    requestTimeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
    headersTimeoutMs = DEFAULT_HEADERS_TIMEOUT_MS,
    handlerTimeoutMs = DEFAULT_HANDLER_TIMEOUT_MS,
    logger = console,
  } = options;

  for (const [name, value] of Object.entries({
    castVote,
    lookupInvitation,
    acceptInvitation,
    readiness,
  })) {
    if (typeof value !== 'function') {
      throw new TypeError(`createApiServer requires a ${name} function`);
    }
  }
  if (typeof allowedOrigin !== 'string' || allowedOrigin === '' || allowedOrigin === '*') {
    throw new TypeError('createApiServer requires one exact allowedOrigin');
  }

  const settings = {
    castVote,
    lookupInvitation,
    acceptInvitation,
    readiness,
    allowedOrigin,
    maxBodyBytes,
    handlerTimeoutMs,
    logger,
  };

  const server = http.createServer((req, res) => {
    // A client that disconnects mid-response would otherwise emit an unhandled
    // 'error' on the response and take down the process.
    res.on('error', () => {});

    handleRequest(req, res, settings).catch((error) => {
      logger.error('api: unhandled request failure', { name: error && error.name });
      if (!res.headersSent) {
        sendError(res, 503, ERROR_CODES.UNAVAILABLE, UNEXPECTED_MESSAGE);
        return;
      }
      res.destroy?.();
    });
  });

  // Bound slow clients: headers within 10 s, a complete request within 15 s.
  server.headersTimeout = headersTimeoutMs;
  server.requestTimeout = requestTimeoutMs;
  server.keepAliveTimeout = 65_000;

  return server;
}

module.exports = {
  CLIENT_IP_HEADER,
  DEFAULT_HANDLER_TIMEOUT_MS,
  DEFAULT_HEADERS_TIMEOUT_MS,
  DEFAULT_MAX_BODY_BYTES,
  DEFAULT_REQUEST_TIMEOUT_MS,
  ROUTES,
  TimeoutError,
  createApiServer,
  readClientIp,
  withTimeout,
};
