/**
 * Pure helpers for the public awards ballot.
 *
 * Everything here is deliberately free of React and Firebase imports so it can be
 * unit tested with `node --test` and reused by the hook and the components.
 */

export const VOTING_COMPETITION_ID = '2026';

/** Closing time confirmed with the committee: 19 November 2026, 16:00 SAST. */
export const VOTING_DEADLINE_ISO = '2026-11-19T14:00:00Z';
export const VOTING_DEADLINE_MS = Date.parse(VOTING_DEADLINE_ISO);
export const VOTING_TIMEZONE = 'SAST';

export const BROWSER_TOKEN_KEY = 'acbf.awards.browserToken.v1';
export const VOTED_CATEGORIES_KEY = 'acbf.awards.votedCategories.v1';

export const MAX_NAME_LENGTH = 120;
export const MAX_EMAIL_LENGTH = 254;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Raised when the browser cannot store the voting token. */
export class AwardsStorageError extends Error {
  constructor(message) {
    super(
      message ??
        'Voting needs browser storage to remember your vote. Enable site data or use a private-free browser window, then reload.',
    );
    this.name = 'AwardsStorageError';
  }
}

function safeStorage(storage) {
  if (storage) return storage;
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    // Access can throw (Safari private mode, blocked third-party storage).
    const probe = '__acbf_storage_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Whether votes can be recorded safely in this browser.
 *
 * @param {Storage} [storage]
 * @returns {boolean}
 */
export function isBrowserStorageAvailable(storage) {
  return safeStorage(storage) !== null;
}

/**
 * Create a random, persistent browser identity token.
 *
 * @returns {string}
 */
export function createBrowserToken() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  throw new AwardsStorageError(
    'This browser cannot create a secure voting token. Please use a current browser.',
  );
}

/**
 * Read the stored browser token without creating one.
 *
 * @param {Storage} [storage]
 * @returns {string|null}
 */
export function readBrowserToken(storage) {
  const store = safeStorage(storage);
  if (!store) return null;
  try {
    const value = store.getItem(BROWSER_TOKEN_KEY);
    return value && value.trim() ? value.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Return the browser token, creating and persisting one when needed.
 *
 * Throws {@link AwardsStorageError} when storage is unavailable: silently creating
 * a fresh identity per submission would let one browser vote repeatedly.
 *
 * @param {Storage} [storage]
 * @returns {string}
 */
export function ensureBrowserToken(storage) {
  const store = safeStorage(storage);
  if (!store) throw new AwardsStorageError();

  const existing = readBrowserToken(store);
  if (existing) return existing;

  const token = createBrowserToken();
  try {
    store.setItem(BROWSER_TOKEN_KEY, token);
  } catch {
    throw new AwardsStorageError();
  }

  // A concurrent tab may have written first; trust the stored value.
  return readBrowserToken(store) ?? token;
}

/**
 * Categories this browser has already voted in, as a local feedback cache only.
 * The server remains authoritative.
 *
 * @param {Storage} [storage]
 * @returns {Record<string, {nomineeId: string, at: string}>}
 */
export function readVotedCategories(storage) {
  const store = safeStorage(storage);
  if (!store) return {};
  try {
    const raw = store.getItem(VOTED_CATEGORIES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Record a locally accepted vote so the ballot locks that category.
 *
 * @param {Storage} [storage]
 * @param {{categoryId: string, nomineeId: string}} vote
 * @returns {Record<string, {nomineeId: string, at: string}>}
 */
export function recordVotedCategory(storage, { categoryId, nomineeId }) {
  const store = safeStorage(storage);
  const current = readVotedCategories(store);
  if (!store || !categoryId) return current;

  const next = {
    ...current,
    [categoryId]: { nomineeId: nomineeId ?? null, at: new Date().toISOString() },
  };
  try {
    store.setItem(VOTED_CATEGORIES_KEY, JSON.stringify(next));
  } catch {
    // The server still enforces one vote per category; cache failure is cosmetic.
  }
  return next;
}

/**
 * Read a Firestore Timestamp, Date, ISO string or epoch-ms value as epoch ms.
 *
 * @param {unknown} value
 * @returns {number|null}
 */
export function toEpochMs(value) {
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
  if (typeof value.toDate === 'function') {
    const ms = value.toDate().getTime();
    return Number.isFinite(ms) ? ms : null;
  }
  if (typeof value === 'string') {
    const ms = Date.parse(value);
    return Number.isNaN(ms) ? null : ms;
  }
  return null;
}

/**
 * Whether the closing time has been reached on this device.
 *
 * This only drives the local UI; the server re-checks its own clock.
 *
 * @param {unknown} closesAt
 * @param {number} [nowMs]
 * @returns {boolean}
 */
export function isDeadlinePassed(closesAt, nowMs = Date.now()) {
  const closesAtMs = toEpochMs(closesAt);
  if (closesAtMs === null) return true;
  return nowMs >= closesAtMs;
}

/**
 * Format the closing time for the public page, always in South African time.
 *
 * @param {unknown} [closesAt]
 * @returns {string} e.g. `19 November 2026, 4:00 pm SAST`
 */
export function formatVotingDeadline(closesAt = VOTING_DEADLINE_ISO) {
  const closesAtMs = toEpochMs(closesAt) ?? VOTING_DEADLINE_MS;
  const date = new Date(closesAtMs);

  const day = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Johannesburg',
    day: 'numeric',
  }).format(date);
  const month = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Johannesburg',
    month: 'long',
  }).format(date);
  const year = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Johannesburg',
    year: 'numeric',
  }).format(date);
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Johannesburg',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
    .format(date)
    .toLowerCase();

  return `${day} ${month} ${year}, ${time} ${VOTING_TIMEZONE}`;
}

/**
 * Validate the optional voter details.
 *
 * @param {{name?: unknown, email?: unknown}} [details]
 * @returns {{ok: boolean, errors: {name?: string, email?: string}, value: {name: string|null, email: string|null}}}
 */
export function validateVoterDetails(details = {}) {
  const errors = {};

  const rawName = details.name;
  const name = typeof rawName === 'string' ? rawName.trim() : '';
  if (name.length > MAX_NAME_LENGTH) {
    errors.name = `Name must be ${MAX_NAME_LENGTH} characters or fewer.`;
  }

  const rawEmail = details.email;
  const email = typeof rawEmail === 'string' ? rawEmail.trim() : '';
  if (email.length > 0) {
    if (email.length > MAX_EMAIL_LENGTH) {
      errors.email = `Email must be ${MAX_EMAIL_LENGTH} characters or fewer.`;
    } else if (!EMAIL_PATTERN.test(email)) {
      errors.email = 'Enter a valid email address, or leave it blank.';
    }
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    value: {
      name: name || null,
      email: email || null,
    },
  };
}

/**
 * Display name for a nominee: both names when available, otherwise whichever is.
 *
 * @param {{personName?: string|null, businessName?: string|null}} nominee
 * @returns {string}
 */
export function nomineeDisplayName(nominee) {
  const person = nominee?.personName?.trim();
  const business = nominee?.businessName?.trim();
  if (person && business) return `${person} — ${business}`;
  return person || business || 'Nominee';
}

function searchKey(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Filter the ballot by category, free-text search and country.
 *
 * @param {Array<object>} nominees
 * @param {{categoryId?: string|null, search?: string, country?: string|null}} [filters]
 * @returns {Array<object>}
 */
export function filterNominees(nominees, { categoryId = null, search = '', country = null } = {}) {
  const term = searchKey(search);

  return (nominees ?? []).filter((nominee) => {
    if (categoryId && nominee.categoryId !== categoryId) return false;
    if (country && nominee.country !== country) return false;
    if (!term) return true;

    const haystack = searchKey(
      [nominee.personName, nominee.businessName, nominee.country].filter(Boolean).join(' '),
    );
    return haystack.includes(term);
  });
}

/**
 * Alphabetical, de-duplicated country list for the filter control.
 *
 * @param {Array<object>} nominees
 * @returns {string[]}
 */
export function listCountries(nominees) {
  const countries = new Set();
  for (const nominee of nominees ?? []) {
    if (nominee.country) countries.add(nominee.country);
  }
  return [...countries].sort((a, b) => a.localeCompare(b));
}

/**
 * Nominees per category, for the category picker.
 *
 * @param {Array<object>} categories
 * @param {Array<object>} nominees
 * @returns {Array<object & {nomineeCount: number}>}
 */
export function categoriesWithCounts(categories, nominees) {
  const counts = new Map();
  for (const nominee of nominees ?? []) {
    counts.set(nominee.categoryId, (counts.get(nominee.categoryId) ?? 0) + 1);
  }

  return (categories ?? [])
    .map((category) => ({ ...category, nomineeCount: counts.get(category.id) ?? 0 }))
    .filter((category) => category.nomineeCount > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
}
