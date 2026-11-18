/**
 * Run with: node --test src/utils/awardsExport.test.js
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { prepareAwardsResults, prepareAwardsVotes } from './awardsExport.js';

const categories = [
  { id: 'edu', name: 'Education' },
  { id: 'fin', name: 'Financial Services' },
];
const nominees = [
  { id: 'a', categoryId: 'fin', personName: 'Ada', businessName: 'Ada Bank', country: 'Ghana' },
  { id: 'b', categoryId: 'fin', personName: 'Bo', businessName: null, country: 'Kenya' },
  { id: 'c', categoryId: 'edu', personName: null, businessName: 'Abnah Academy', country: 'South Africa' },
];

test('results are grouped by category and ranked by votes, zero-vote nominees included', () => {
  const rows = prepareAwardsResults({ categories, nominees, totals: { a: 1, b: 5 } });
  assert.deepEqual(
    rows.map((r) => [r.Category, r.Rank, r.Nominee || r.Business, r.Votes]),
    [
      ['Education', 1, 'Abnah Academy', 0],
      ['Financial Services', 1, 'Bo', 5],
      ['Financial Services', 2, 'Ada', 1],
    ],
  );
  assert.ok(!Object.keys(rows[0]).some((key) => /voter|email/i.test(key)));
});

test('votes export carries voter details, resolves names and is oldest first', () => {
  const votes = [
    { categoryId: 'fin', nomineeId: 'b', name: null, email: null, createdAt: Date.parse('2026-11-18T10:00:05Z') },
    { categoryId: 'fin', nomineeId: 'a', name: 'Zed', email: 'zed@example.com', createdAt: Date.parse('2026-11-18T10:00:00Z') },
    { categoryId: 'gone', nomineeId: 'missing', name: '', email: '', createdAt: 0 },
  ];
  const rows = prepareAwardsVotes({ categories, nominees, votes });
  assert.equal(rows.length, 3);
  assert.equal(rows[1]['Voter Email'], 'zed@example.com');
  assert.equal(rows[1].Nominee, 'Ada');
  assert.equal(rows[1].Category, 'Financial Services');
  assert.equal(rows[2]['Voter Name'], '');
  assert.equal(rows[0].Category, 'gone');
  assert.equal(rows[0].Nominee, '');
});
