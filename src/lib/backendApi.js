/**
 * Browser transport for the internal voting API.
 *
 * Production voting and invitation acceptance now call the same-origin
 * `/api/v1/` endpoints served by nginx → the Dokploy `api` service instead of
 * Firebase callables (Cloud Functions requires the Blaze plan and was never
 * deployed). The envelope is `{data}` on success and `{error:{code,message}}` on
 * failure, so callers keep using the same error codes as before.
 *
 * Deliberate constraints:
 * - only the three fixed relative paths may be requested, so this cannot become
 *   an open proxy;
 * - there is no automatic retry: a retried vote is safe server-side, but an
 *   automatic retry would mask a real failure and could confuse local state;
 * - a non-JSON reply (for example an SPA `index.html` fallback) is a failure, so
 *   a proxy misconfiguration can never look like a successful vote.
 */

/** The only endpoints the browser may call. */
export const API_PATHS = Object.freeze({
  vote: '/api/v1/awards/vote',
  lookupInvitation: '/api/v1/admin/invitations/lookup',
  acceptInvitation: '/api/v1/admin/invitations/accept',
});

/** Vote outcomes the ballot understands; anything else is a protocol failure. */
export const VOTE_STATUSES = Object.freeze(['accepted', 'already-voted']);

const ALLOWED_PATHS = new Set(Object.values(API_PATHS));
const ALLOWED_VOTE_STATUSES = new Set(VOTE_STATUSES);

export const DEFAULT_TIMEOUT_MS = 15_000;

const MESSAGES = Object.freeze({
  unsupportedPath: 'Unsupported API endpoint.',
  timeout: 'The request timed out. Please try again.',
  unreachable: 'The service is unreachable. Check your connection and try again.',
  badReply: 'The service returned an unexpected response. Please try again.',
});

/** Error carrying the same `code` values the server uses. */
export class BackendApiError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'BackendApiError';
    this.code = code;
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/**
 * POST JSON to one allowed API path.
 *
 * @param {string} path - One of {@link API_PATHS}.
 * @param {Record<string, unknown>} payload
 * @param {{fetchImpl?: typeof fetch, timeoutMs?: number}} [options]
 * @returns {Promise<{data: Record<string, unknown>}>}
 */
export async function postBackendApi(path, payload, { fetchImpl, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  if (!ALLOWED_PATHS.has(path)) {
    throw new BackendApiError('invalid-argument', MESSAGES.unsupportedPath);
  }

  const doFetch = fetchImpl ?? (typeof fetch === 'function' ? fetch : null);
  if (typeof doFetch !== 'function') {
    throw new BackendApiError('unavailable', MESSAGES.unreachable);
  }

  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  let response;
  try {
    response = await doFetch(path, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(payload ?? {}),
      signal: controller ? controller.signal : undefined,
    });
  } catch (error) {
    if ((controller && controller.signal.aborted) || error?.name === 'AbortError') {
      throw new BackendApiError('deadline-exceeded', MESSAGES.timeout);
    }
    throw new BackendApiError('unavailable', MESSAGES.unreachable);
  } finally {
    clearTimeout(timer);
  }

  let body;
  try {
    // A reverse-proxy HTML page parses as neither JSON nor a success envelope.
    body = await response.json();
  } catch {
    throw new BackendApiError('unavailable', MESSAGES.badReply);
  }

  if (!response.ok) {
    const error = isPlainObject(body) ? body.error : null;
    if (isPlainObject(error) && typeof error.code === 'string' && typeof error.message === 'string') {
      throw new BackendApiError(error.code, error.message);
    }
    throw new BackendApiError('unavailable', MESSAGES.badReply);
  }

  if (!isPlainObject(body) || !isPlainObject(body.data)) {
    throw new BackendApiError('internal', MESSAGES.badReply);
  }

  return body;
}

/**
 * Validate a vote result before it changes local ballot state.
 *
 * Only `accepted` and `already-voted` mean the server recorded this browser for
 * the category; anything else must not lock the category locally.
 *
 * @param {unknown} data
 * @returns {{status: 'accepted'|'already-voted', nomineeId?: string}}
 */
export function parseVoteResult(data) {
  if (!isPlainObject(data) || !ALLOWED_VOTE_STATUSES.has(data.status)) {
    throw new BackendApiError('internal', MESSAGES.badReply);
  }
  return data;
}
