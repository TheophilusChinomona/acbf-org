'use strict';

/**
 * Minimal Resend client (https://resend.com/docs/api-reference/emails/send-email).
 *
 * Uses the platform `fetch`, so there is no extra dependency. The recipient is
 * fixed at construction time: callers can never choose who receives a message,
 * which keeps the public form endpoints from being used to mail other people.
 * Failures report the HTTP status only, never the response body or request data.
 */

const { DomainError, ERROR_CODES } = require('../errors');

const RESEND_URL = 'https://api.resend.com/emails';
const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * @param {{apiKey: string, from: string, to: string, fetchImpl?: typeof fetch, timeoutMs?: number, logger?: Console}} options
 * @returns {{send: (message: {subject: string, html: string, text: string, replyTo?: string}) => Promise<void>}}
 */
function createResendMailer({
  apiKey,
  from,
  to,
  fetchImpl = typeof fetch === 'function' ? fetch : null,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  logger = console,
} = {}) {
  for (const [name, value] of Object.entries({ apiKey, from, to })) {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new TypeError(`createResendMailer requires ${name}`);
    }
  }
  if (typeof fetchImpl !== 'function') throw new TypeError('createResendMailer requires fetch');

  return {
    async send({ subject, html, text, replyTo }) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      let response;
      try {
        response = await fetchImpl(RESEND_URL, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${apiKey}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            from,
            to: [to],
            subject: String(subject).replace(/[\r\n]+/g, ' ').slice(0, 250),
            html,
            text,
            ...(replyTo ? { reply_to: replyTo } : {}),
          }),
          signal: controller.signal,
        });
      } catch (error) {
        logger.error('notify: email provider unreachable', { name: error && error.name });
        throw new DomainError(ERROR_CODES.UNAVAILABLE, 'The message could not be sent right now. Please try again.');
      } finally {
        clearTimeout(timer);
      }

      if (!response.ok) {
        logger.error('notify: email provider rejected the message', { status: response.status });
        throw new DomainError(ERROR_CODES.UNAVAILABLE, 'The message could not be sent right now. Please try again.');
      }
    },
  };
}

module.exports = { createResendMailer, RESEND_URL };
