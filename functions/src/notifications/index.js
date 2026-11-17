'use strict';

/**
 * Admin email notifications for the public contact and membership forms.
 *
 * The forms save to Firestore first; these endpoints only notify. Validation
 * mirrors the retired PHP endpoints, the recipient is fixed server-side, and a
 * per-network plus global hourly cap stops the endpoints being used to flood the
 * inbox or exhaust the email plan. Counters are in memory (they reset on restart).
 */

const { DomainError, ERROR_CODES } = require('../errors');
const { contactEmail, membershipEmail } = require('./templates');

const HOUR_MS = 60 * 60 * 1000;
const LIMITS = Object.freeze({ perNetworkPerHour: 5, globalPerHour: 60 });
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const NOT_CONFIGURED = 'Email notifications are not configured.';
const BUSY = 'Too many messages from this network. Please try again later.';

function invalid(message) {
  return new DomainError(ERROR_CODES.INVALID_ARGUMENT, message);
}

function text(value, field, { min = 0, max, required = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw invalid(`Missing required field: ${field}.`);
    return '';
  }
  if (typeof value !== 'string') throw invalid(`${field} must be text.`);
  const trimmed = value.trim();
  if (required && trimmed === '') throw invalid(`Missing required field: ${field}.`);
  if (trimmed.length < min) throw invalid(`${field} must be at least ${min} characters.`);
  if (trimmed.length > max) throw invalid(`${field} must be ${max} characters or fewer.`);
  return trimmed;
}

function email(value) {
  const trimmed = text(value, 'email', { max: 254, required: true });
  if (!EMAIL_PATTERN.test(trimmed)) throw invalid('Invalid email address.');
  return trimmed;
}

function validateContact(data) {
  return {
    name: text(data.name, 'name', { min: 2, max: 120, required: true }),
    email: email(data.email),
    subject: text(data.subject, 'subject', { min: 5, max: 200, required: true }),
    message: text(data.message, 'message', { min: 10, max: 5000, required: true }),
  };
}

function validateMembership(data) {
  const phone = text(data.phone, 'phone', { max: 40, required: true });
  if (phone.replace(/[^0-9+]/g, '').length < 10) throw invalid('Invalid phone number.');
  return {
    name: text(data.name, 'name', { min: 2, max: 120, required: true }),
    email: email(data.email),
    phone,
    business_name: text(data.business_name, 'business_name', { max: 200 }),
    business_type: text(data.business_type, 'business_type', { max: 120, required: true }),
    message: text(data.message, 'message', { max: 500 }),
  };
}

function createLimiter({ now }) {
  const buckets = new Map();
  return function allow(key, limit) {
    const t = now();
    const recent = (buckets.get(key) ?? []).filter((at) => t - at < HOUR_MS);
    if (recent.length >= limit) {
      buckets.set(key, recent);
      return false;
    }
    recent.push(t);
    buckets.set(key, recent);
    if (buckets.size > 5000) {
      for (const [k, list] of buckets) if (list.every((at) => t - at >= HOUR_MS)) buckets.delete(k);
    }
    return true;
  };
}

/**
 * @param {{mailer: {send: Function}|null, now?: () => number}} options
 */
function createNotifications({ mailer, now = Date.now } = {}) {
  const allow = createLimiter({ now });

  async function dispatch(kind, validate, build, data, context) {
    if (!mailer) throw new DomainError(ERROR_CODES.UNAVAILABLE, NOT_CONFIGURED);
    const clean = validate(data);
    const ip = typeof context?.clientIp === 'string' ? context.clientIp : 'unknown';
    if (!allow(`${kind}:ip:${ip}`, LIMITS.perNetworkPerHour) || !allow(`${kind}:all`, LIMITS.globalPerHour)) {
      throw new DomainError(ERROR_CODES.RESOURCE_EXHAUSTED, BUSY);
    }
    await mailer.send(build(clean, new Date(now())));
    return { status: 'sent' };
  }

  return {
    sendContact: (data, context) => dispatch('contact', validateContact, contactEmail, data, context),
    sendMembership: (data, context) => dispatch('membership', validateMembership, membershipEmail, data, context),
  };
}

module.exports = { createNotifications, validateContact, validateMembership, LIMITS };
