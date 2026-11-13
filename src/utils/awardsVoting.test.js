/**
 * Tests for the public ballot utilities.
 *
 * Run with: node --test src/utils/awardsVoting.test.js
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  AwardsStorageError,
  BROWSER_TOKEN_KEY,
  VOTING_DEADLINE_MS,
  categoriesWithCounts,
  ensureBrowserToken,
  filterNominees,
  formatVotingDeadline,
  isBrowserStorageAvailable,
  isDeadlinePassed,
  listCountries,
  nomineeDisplayName,
  readBrowserToken,
  readVotedCategories,
  recordVotedCategory,
  validateVoterDetails,
} from './awardsVoting.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function memoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => {
      map.set(key, String(value));
    },
    removeItem: (key) => {
      map.delete(key);
    },
    clear: () => map.clear(),
    key: (index) => [...map.keys()][index] ?? null,
    get length() {
      return map.size;
    },
  };
}

function failingStorage() {
  const denied = () => {
    throw new Error('storage access denied');
  };
  return { getItem: denied, setItem: denied, removeItem: denied };
}

test('formats the confirmed closing time in South African time', () => {
  assert.equal(formatVotingDeadline(), '19 November 2026, 4:00 pm SAST');
  assert.equal(formatVotingDeadline('2026-11-19T14:00:00Z'), '19 November 2026, 4:00 pm SAST');
  assert.equal(formatVotingDeadline(new Date(VOTING_DEADLINE_MS)), '19 November 2026, 4:00 pm SAST');
  // A timestamp just after midnight UTC is already the next morning in SAST.
  assert.equal(formatVotingDeadline('2026-11-19T22:30:00Z'), '20 November 2026, 12:30 am SAST');
});

test('reuses the same persistent browser token across reads', () => {
  const storage = memoryStorage();
  const token = ensureBrowserToken(storage);

  assert.match(token, UUID_PATTERN);
  assert.equal(storage.getItem(BROWSER_TOKEN_KEY), token);
  assert.equal(ensureBrowserToken(storage), token);
  assert.equal(readBrowserToken(storage), token);
});

test('does not silently mint a new identity when storage is unavailable', () => {
  assert.throws(() => ensureBrowserToken(null), AwardsStorageError);
  assert.throws(() => ensureBrowserToken(failingStorage()), AwardsStorageError);

  // The failing storage must not have leaked a token anywhere.
  assert.throws(
    () => ensureBrowserToken(failingStorage()),
    /browser storage/i,
  );
});

test('reports storage availability without throwing', () => {
  assert.equal(isBrowserStorageAvailable(memoryStorage()), true);
  assert.equal(isBrowserStorageAvailable(null), false);
});

test('keeps a corrupted token store from crashing the ballot', () => {
  const storage = memoryStorage({ [BROWSER_TOKEN_KEY]: '   ' });
  assert.equal(readBrowserToken(storage), null);
  assert.match(ensureBrowserToken(storage), UUID_PATTERN);
});

test('remembers locally accepted categories for feedback', () => {
  const storage = memoryStorage();
  assert.deepEqual(readVotedCategories(storage), {});

  recordVotedCategory(storage, { categoryId: 'education', nomineeId: 'education-kenya-person' });
  const cached = readVotedCategories(storage);
  assert.equal(cached.education.nomineeId, 'education-kenya-person');
  assert.ok(cached.education.at);

  recordVotedCategory(storage, { categoryId: 'logistics', nomineeId: 'logistics-kenya-person' });
  assert.deepEqual(Object.keys(readVotedCategories(storage)).sort(), ['education', 'logistics']);
});

test('ignores a corrupted voted-categories cache', () => {
  const storage = memoryStorage({ 'acbf.awards.votedCategories.v1': '{not json' });
  assert.deepEqual(readVotedCategories(storage), {});
  assert.deepEqual(readVotedCategories(null), {});
});

test('treats optional voter details as optional but validated', () => {
  const blank = validateVoterDetails({});
  assert.equal(blank.ok, true);
  assert.deepEqual(blank.value, { name: null, email: null });

  const filled = validateVoterDetails({ name: '  Thandi Mokoena ', email: ' voter@example.com ' });
  assert.equal(filled.ok, true);
  assert.deepEqual(filled.value, { name: 'Thandi Mokoena', email: 'voter@example.com' });

  const tooLong = validateVoterDetails({ name: 'a'.repeat(121) });
  assert.equal(tooLong.ok, false);
  assert.match(tooLong.errors.name, /120/);

  const longEmail = validateVoterDetails({ email: `${'a'.repeat(250)}@example.com` });
  assert.equal(longEmail.ok, false);
  assert.match(longEmail.errors.email, /254/);

  const badEmail = validateVoterDetails({ email: 'not-an-email' });
  assert.equal(badEmail.ok, false);
  assert.match(badEmail.errors.email, /valid email/i);

  const whitespaceOnly = validateVoterDetails({ name: '   ', email: '   ' });
  assert.equal(whitespaceOnly.ok, true);
  assert.deepEqual(whitespaceOnly.value, { name: null, email: null });
});

test('falls back to whichever nominee name is available', () => {
  assert.equal(
    nomineeDisplayName({ personName: 'Some Person', businessName: 'Some Business' }),
    'Some Person — Some Business',
  );
  assert.equal(nomineeDisplayName({ personName: 'Some Person', businessName: null }), 'Some Person');
  assert.equal(nomineeDisplayName({ personName: '', businessName: 'Some Business' }), 'Some Business');
  assert.equal(nomineeDisplayName({ personName: null, businessName: null }), 'Nominee');
});

test('filters nominees by category, country and accent-insensitive search', () => {
  const nominees = [
    { id: 'a', categoryId: 'education', personName: 'Thandé Mokoena', businessName: 'Ubuntu Academy', country: 'South Africa' },
    { id: 'b', categoryId: 'education', personName: null, businessName: 'Kigali Foods', country: 'Rwanda' },
    { id: 'c', categoryId: 'logistics', personName: 'Ama Osei', businessName: 'Accra Movers', country: 'Ghana' },
  ];

  assert.deepEqual(
    filterNominees(nominees, { categoryId: 'education' }).map((n) => n.id),
    ['a', 'b'],
  );
  assert.deepEqual(filterNominees(nominees, { search: 'thande' }).map((n) => n.id), ['a']);
  assert.deepEqual(filterNominees(nominees, { search: 'UBUNTU' }).map((n) => n.id), ['a']);
  assert.deepEqual(filterNominees(nominees, { country: 'Ghana' }).map((n) => n.id), ['c']);
  assert.deepEqual(
    filterNominees(nominees, { categoryId: 'education', country: 'Rwanda' }).map((n) => n.id),
    ['b'],
  );
  assert.deepEqual(filterNominees(nominees, { search: 'zzz' }), []);
  assert.deepEqual(filterNominees(undefined, {}), []);
});

test('lists countries alphabetically without duplicates', () => {
  const nominees = [
    { country: 'Zambia' },
    { country: 'Ghana' },
    { country: 'Zambia' },
    { country: null },
  ];
  assert.deepEqual(listCountries(nominees), ['Ghana', 'Zambia']);
});

test('counts nominees per category and hides empty categories', () => {
  const categories = [
    { id: 'education', name: 'Excellence in Education' },
    { id: 'logistics', name: 'Excellence in Logistics' },
    { id: 'empty', name: 'Empty Category' },
  ];
  const nominees = [
    { categoryId: 'education' },
    { categoryId: 'education' },
    { categoryId: 'logistics' },
  ];

  const result = categoriesWithCounts(categories, nominees);
  assert.deepEqual(
    result.map(({ id, nomineeCount }) => ({ id, nomineeCount })),
    [
      { id: 'education', nomineeCount: 2 },
      { id: 'logistics', nomineeCount: 1 },
    ],
  );
});

test('evaluates the closing boundary exactly like the server', () => {
  assert.equal(isDeadlinePassed(VOTING_DEADLINE_MS, VOTING_DEADLINE_MS - 1), false);
  assert.equal(isDeadlinePassed(VOTING_DEADLINE_MS, VOTING_DEADLINE_MS), true);
  assert.equal(isDeadlinePassed(VOTING_DEADLINE_MS, VOTING_DEADLINE_MS + 1), true);
  assert.equal(isDeadlinePassed('2026-11-19T14:00:00Z', VOTING_DEADLINE_MS - 1), false);
  assert.equal(isDeadlinePassed(null, 0), true);
});
