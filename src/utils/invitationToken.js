const DEFAULT_TOKEN_BYTE_LENGTH = 32; // 256-bit token
const DEFAULT_TOKEN_TTL_HOURS = 24 * 7; // 7 days
const HEX_TOKEN_REGEX = /^[a-f0-9]+$/i;

function getCrypto() {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    return globalThis.crypto;
  }
  return null;
}

function generateRandomBytes(byteLength) {
  const cryptoObj = getCrypto();

  if (cryptoObj) {
    const array = new Uint8Array(byteLength);
    cryptoObj.getRandomValues(array);
    return array;
  }

  // Fallback for non-browser environments (e.g., tests, Node scripts)
  try {
    // Using eval to avoid bundlers attempting to polyfill Node's crypto module
    const nodeRequire = typeof require === 'function' ? require : eval('require');
    const { randomBytes } = nodeRequire('crypto');
    return randomBytes(byteLength);
  } catch (error) {
    throw new Error('Secure random number generation is not supported in this environment.');
  }
}

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function generateInvitationToken(options = {}) {
  const { byteLength = DEFAULT_TOKEN_BYTE_LENGTH } = options;

  if (!Number.isInteger(byteLength) || byteLength <= 0) {
    throw new TypeError('byteLength must be a positive integer.');
  }

  const randomBytes = generateRandomBytes(byteLength);
  return bytesToHex(randomBytes);
}

export function validateInvitationToken(token, options = {}) {
  const {
    minLength = DEFAULT_TOKEN_BYTE_LENGTH * 2,
    maxLength = DEFAULT_TOKEN_BYTE_LENGTH * 2,
    pattern = HEX_TOKEN_REGEX,
  } = options;

  if (typeof token !== 'string') {
    return false;
  }

  const trimmed = token.trim();

  if (trimmed.length < minLength || trimmed.length > maxLength) {
    return false;
  }

  return pattern.test(trimmed);
}

export function getInvitationExpiryDate(options = {}) {
  const { ttlHours = DEFAULT_TOKEN_TTL_HOURS, from = new Date() } = options;

  if (!(from instanceof Date) || Number.isNaN(from.getTime())) {
    throw new TypeError('`from` must be a valid Date instance.');
  }

  if (typeof ttlHours !== 'number' || Number.isNaN(ttlHours) || ttlHours <= 0) {
    throw new TypeError('ttlHours must be a positive number.');
  }

  const expiresAt = new Date(from.getTime());
  expiresAt.setHours(expiresAt.getHours() + ttlHours);
  return expiresAt;
}

export function isInvitationExpired(expiresAt, options = {}) {
  const { referenceDate = new Date() } = options;

  if (!(expiresAt instanceof Date) || Number.isNaN(expiresAt.getTime())) {
    throw new TypeError('`expiresAt` must be a valid Date instance.');
  }

  if (!(referenceDate instanceof Date) || Number.isNaN(referenceDate.getTime())) {
    throw new TypeError('`referenceDate` must be a valid Date instance.');
  }

  return expiresAt.getTime() <= referenceDate.getTime();
}

export const INVITATION_TOKEN_DEFAULTS = Object.freeze({
  BYTE_LENGTH: DEFAULT_TOKEN_BYTE_LENGTH,
  TTL_HOURS: DEFAULT_TOKEN_TTL_HOURS,
  PATTERN: HEX_TOKEN_REGEX,
});


