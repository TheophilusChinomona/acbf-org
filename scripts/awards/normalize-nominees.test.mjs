/**
 * Tests for the official nominee catalogue pipeline.
 *
 * Run with: node --test scripts/awards/normalize-nominees.test.mjs
 *
 * The committed fixture is synthetic test data shaped like the supplied workbook
 * (139 nominees, nine countries, three missing business names, 21 missing person
 * names, blank country cells, blank separator rows and contact columns). Point
 * AWARDS_NOMINEES_XLSX at the real workbook to additionally verify the supplied
 * file itself.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

import {
  loadCategoryMap,
  normalizeNominees,
  normalizeKey,
  readNomineeWorkbook,
  summarizeNormalization,
  formatDryRunReport,
} from './normalize-nominees.mjs';
import { evaluateExistingCatalogue } from './import-nominees.mjs';

const require = createRequire(import.meta.url);
const categoryMap = loadCategoryMap();
const fixture = JSON.parse(
  readFileSync(new URL('./fixtures/synthetic-version5-nominees.json', import.meta.url), 'utf8'),
);

/** Category labels that exist in the reviewed map, so these rows normalize cleanly. */
function row({ category, business, person, country }) {
  return { 'Award Category': category, 'Business Name': business, 'Person Name': person, Country: country };
}

test('carries the country forward through blank country cells', () => {
  const { nominees, issues } = normalizeNominees(
    [
      row({ category: 'Social Impact Award', business: 'Alpha Ltd', person: 'A Person', country: 'Kenya' }),
      row({ category: 'Social Impact Award', business: 'Beta Ltd', person: 'B Person', country: '' }),
      row({ category: 'Social Impact Award', business: 'Gamma Ltd', person: 'C Person', country: '   ' }),
      row({ category: 'Social Impact Award', business: 'Delta Ltd', person: 'D Person', country: 'Ghana' }),
      row({ category: 'Social Impact Award', business: 'Epsilon Ltd', person: 'E Person', country: '' }),
    ],
    categoryMap,
  );

  assert.deepEqual(
    nominees.map((nominee) => nominee.country),
    ['Kenya', 'Kenya', 'Kenya', 'Ghana', 'Ghana'],
  );
  assert.equal(issues.filter((issue) => issue.severity === 'error').length, 0);
});

test('keeps person-only, business-only and combined nominees distinct', () => {
  const { nominees, issues } = normalizeNominees(
    [
      row({ category: 'Excellence in Education', business: 'Both Ltd', person: 'Both Person', country: 'Zambia' }),
      row({ category: 'Excellence in Education', business: '', person: 'Person Only', country: '' }),
      row({ category: 'Excellence in Education', business: 'Business Only Ltd', person: '', country: '' }),
    ],
    categoryMap,
  );

  assert.equal(nominees.length, 3);
  assert.deepEqual(
    nominees.map(({ businessName, personName }) => ({ businessName, personName })),
    [
      { businessName: 'Both Ltd', personName: 'Both Person' },
      { businessName: null, personName: 'Person Only' },
      { businessName: 'Business Only Ltd', personName: null },
    ],
  );
  assert.equal(issues.filter((issue) => issue.severity === 'error').length, 0);
});

test('ignores blank rows without producing nominees or issues', () => {
  const blank = { 'Award Category': '', 'Business Name': '', 'Person Name': '', Country: '' };
  const whitespace = { 'Award Category': '   ', 'Business Name': ' ', 'Person Name': '', Country: '  ' };
  const { nominees, issues } = normalizeNominees(
    [
      blank,
      row({ category: 'Excellence in Healthcare', business: 'Clinic Ltd', person: 'Clinician', country: 'Namibia' }),
      whitespace,
      blank,
    ],
    categoryMap,
  );

  assert.equal(nominees.length, 1);
  assert.equal(issues.length, 0);
});

test('normalizes the synthetic version 5 workbook to exactly 139 unique nominees', () => {
  const { nominees, categories, issues } = normalizeNominees(fixture.rows, categoryMap);
  const summary = summarizeNormalization({ nominees, categories, issues });

  assert.equal(summary.nomineeCount, 139);
  assert.equal(summary.countryCount, 9);
  assert.equal(summary.categoryCount, 28);
  assert.equal(summary.errorCount, 0, 'fixture must normalize without blocking issues');
  assert.equal(new Set(nominees.map((nominee) => nominee.id)).size, 139);

  assert.equal(nominees.filter((nominee) => nominee.businessName === null).length, 3);
  assert.equal(nominees.filter((nominee) => nominee.personName === null).length, 21);
  assert.ok(nominees.every((nominee) => nominee.country));
  assert.ok(nominees.every((nominee) => nominee.businessName || nominee.personName));
});

test('never imports contact columns into nominee records', () => {
  const { nominees } = normalizeNominees(fixture.rows, categoryMap);
  const allowedKeys = ['id', 'categoryId', 'businessName', 'personName', 'country'];

  for (const nominee of nominees) {
    assert.deepEqual(Object.keys(nominee).sort(), [...allowedKeys].sort());
  }

  const serialized = JSON.stringify(nominees);
  assert.ok(!serialized.includes('example.test'), 'email addresses leaked into the catalogue');
  assert.ok(!serialized.includes('+27 00 000'), 'contact numbers leaked into the catalogue');
  assert.ok(!serialized.includes('Synthetic contact detail'), 'notes leaked into the catalogue');
  assert.ok(!("contactNumber" in nominees[0]));

  const summary = summarizeNormalization({ nominees, categories: [], issues: [] });
  const report = formatDryRunReport(summary, { source: 'synthetic fixture' });
  assert.ok(!report.includes('example.test'));
  assert.ok(!report.includes('+27 00 000'));
});

test('re-normalizing the same rows yields identical nominee ids', () => {
  const first = normalizeNominees(fixture.rows, categoryMap);
  const second = normalizeNominees(fixture.rows, categoryMap);

  assert.deepEqual(
    first.nominees.map((nominee) => nominee.id),
    second.nominees.map((nominee) => nominee.id),
  );
  assert.deepEqual(first.nominees, second.nominees);
  assert.deepEqual(first.categories, second.categories);
});

test('normalizes case, punctuation and whitespace variants of a mapped category', () => {
  const variants = [
    'excellence in education',
    'Excellence  in  Education',
    'EXCELLENCE IN EDUCATION!!',
    'Excellence In Education',
  ];

  for (const variant of variants) {
    const { nominees, issues } = normalizeNominees(
      [row({ category: variant, business: 'Variant Ltd', person: '', country: 'Kenya' })],
      categoryMap,
    );
    assert.equal(issues.filter((issue) => issue.severity === 'error').length, 0, variant);
    assert.equal(nominees[0].categoryId, 'education');
  }
});

test('normalizeKey strips ampersands and punctuation consistently', () => {
  assert.equal(normalizeKey('  Business Innovation & Technology Award '), 'business innovation and technology award');
  assert.equal(normalizeKey('Business Innovation and Technology Award'), 'business innovation and technology award');
});

test('reports unmapped categories as blocking issues instead of merging them', () => {
  const { nominees, categories, issues } = normalizeNominees(
    [
      row({ category: 'New Category One', business: 'One Ltd', person: '', country: 'Kenya' }),
      row({ category: 'New Category Two', business: 'Two Ltd', person: '', country: 'Kenya' }),
    ],
    categoryMap,
  );

  const unmapped = issues.filter((issue) => issue.code === 'unmapped-category');
  assert.equal(unmapped.length, 2);
  assert.ok(unmapped.every((issue) => issue.severity === 'error'));
  assert.equal(categories.length, 2, 'distinct unmapped labels stay distinct');
  assert.equal(new Set(nominees.map((nominee) => nominee.categoryId)).size, 2);
});

test('reports ambiguous category labels for review instead of guessing', () => {
  const { nominees, issues } = normalizeNominees(
    [row({ category: 'Legal Services', business: 'Law Ltd', person: '', country: 'Kenya' })],
    categoryMap,
  );

  const ambiguous = issues.find((issue) => issue.code === 'ambiguous-category');
  assert.ok(ambiguous);
  assert.equal(ambiguous.severity, 'error');
  assert.match(nominees[0].categoryId, /^review-/);
});

test('rejects two source rows that resolve to the same nominee identity', () => {
  const identical = row({
    category: 'Excellence in Logistics',
    business: 'Same Ltd',
    person: 'Same Person',
    country: 'Kenya',
  });
  const { nominees, issues } = normalizeNominees([identical, { ...identical }], categoryMap);

  assert.equal(nominees.length, 1, 'collisions must never collapse silently into one nominee');
  const collision = issues.find((issue) => issue.code === 'duplicate-nominee-id');
  assert.ok(collision);
  assert.equal(collision.severity, 'error');
  assert.equal(collision.row, 3);
});

test('reports rows missing a category or both names', () => {
  const { nominees, issues } = normalizeNominees(
    [
      row({ category: '', business: 'No Category Ltd', person: '', country: 'Kenya' }),
      row({ category: 'Excellence in Services', business: '', person: '', country: 'Kenya' }),
    ],
    categoryMap,
  );

  assert.equal(nominees.length, 0);
  assert.ok(issues.some((issue) => issue.code === 'missing-category'));
  assert.ok(issues.some((issue) => issue.code === 'missing-nominee-name'));
});

test('resolve column aliases used by different sheet headers', () => {
  const { nominees, issues } = normalizeNominees(
    [
      { Award: 'Excellence in Tourism & Events', 'Company Name': 'Alias Ltd', 'Nominee Name': 'Alias Person', Country: 'Kenya' },
    ],
    categoryMap,
  );

  assert.equal(issues.filter((issue) => issue.severity === 'error').length, 0);
  assert.equal(nominees[0].businessName, 'Alias Ltd');
  assert.equal(nominees[0].personName, 'Alias Person');
  assert.equal(nominees[0].categoryId, 'tourism-events');
});

test('throws when the sheet is missing required columns', () => {
  assert.throws(
    () => normalizeNominees([{ 'Business Name': 'X' }], categoryMap),
    /missing required column/i,
  );
});

test('reads rows from a workbook on disk and normalizes them', () => {
  const XLSX = require('xlsx');
  const directory = mkdtempSync(join(tmpdir(), 'acbf-nominees-'));
  const workbookPath = join(directory, 'nominees.xlsx');

  try {
    const worksheet = XLSX.utils.json_to_sheet([
      { 'Award Category': 'Excellence in Education', 'Business Name': 'Sheet Ltd', 'Person Name': 'Sheet Person', Country: 'Kenya' },
      { 'Award Category': 'Excellence in Education', 'Business Name': 'Sheet Two Ltd', 'Person Name': '', Country: '' },
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Awards Nominees');
    XLSX.writeFile(workbook, workbookPath);

    const rows = readNomineeWorkbook(workbookPath);
    const { nominees, issues } = normalizeNominees(rows, categoryMap);

    assert.equal(rows.length, 2);
    assert.equal(nominees.length, 2);
    assert.equal(issues.filter((issue) => issue.severity === 'error').length, 0);
    assert.equal(nominees[1].country, 'Kenya');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('importer allows catalogue changes while no votes exist', () => {
  const result = evaluateExistingCatalogue({
    nominees: [
      { id: 'a', categoryId: 'education' },
      { id: 'b', categoryId: 'education' },
    ],
    existingNominees: [{ id: 'a', categoryId: 'logistics' }],
    hasVotes: false,
  });

  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.added, ['b']);
  assert.deepEqual(result.removed, []);
  assert.deepEqual(result.changedCategory, ['a']);
});

test('importer refuses identity and category changes once votes exist', () => {
  const result = evaluateExistingCatalogue({
    nominees: [
      { id: 'a', categoryId: 'education' },
      { id: 'c', categoryId: 'education' },
    ],
    existingNominees: [
      { id: 'a', categoryId: 'logistics' },
      { id: 'b', categoryId: 'education' },
    ],
    hasVotes: true,
  });

  assert.equal(result.errors.length, 3);
  assert.ok(result.errors.some((error) => error.includes('add')));
  assert.ok(result.errors.some((error) => error.includes('remove')));
  assert.ok(result.errors.some((error) => error.includes('category')));
});

test('importer permits display corrections for an unchanged identity after votes exist', () => {
  const result = evaluateExistingCatalogue({
    nominees: [{ id: 'a', categoryId: 'education' }],
    existingNominees: [{ id: 'a', categoryId: 'education' }],
    hasVotes: true,
  });

  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.added, []);
  assert.deepEqual(result.removed, []);
  assert.deepEqual(result.changedCategory, []);
});

test('supplied version 5 workbook (AWARDS_NOMINEES_XLSX) has 139 nominees from nine countries', async (t) => {
  const workbookPath = process.env.AWARDS_NOMINEES_XLSX;
  if (!workbookPath) {
    t.diagnostic(
      'AWARDS_NOMINEES_XLSX is not set; the committed synthetic fixture covers the same shape. ' +
        'Set it to the supplied workbook to verify the real file.',
    );
    return;
  }

  const rows = readNomineeWorkbook(workbookPath);
  const { nominees, categories, issues } = normalizeNominees(rows, categoryMap);
  const summary = summarizeNormalization({ nominees, categories, issues });

  assert.equal(summary.nomineeCount, 139);
  assert.equal(summary.countryCount, 9);
  assert.equal(new Set(nominees.map((nominee) => nominee.id)).size, 139);
});
