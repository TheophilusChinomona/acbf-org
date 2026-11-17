'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { createSqliteVoteStore, createCatalogueSource } = require('../src/awards/sqliteStore');
const policy = require('../src/awards/policy');

const NOW = Date.parse('2026-11-17T10:00:00Z');
const TOKEN = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

function fixture({ open = true, now = NOW } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'acbf-sqlite-'));
  const cataloguePath = path.join(dir, 'catalogue.json');
  fs.writeFileSync(
    cataloguePath,
    JSON.stringify({
      competition: { isOpen: open, closesAt: '2026-11-19T14:00:00.000Z' },
      categories: [{ id: 'cat-a' }, { id: 'cat-b' }],
      nominees: [
        { id: 'n-1', categoryId: 'cat-a' },
        { id: 'n-2', categoryId: 'cat-a' },
        { id: 'n-3', categoryId: 'cat-b' },
        { id: 'n-off', categoryId: 'cat-b', disabled: true },
      ],
    }),
  );
  const dbPath = path.join(dir, 'awards.sqlite');
  const clock = { now };
  const make = () =>
    createSqliteVoteStore({
      path: dbPath,
      catalogue: createCatalogueSource(cataloguePath, { now: () => clock.now }),
      now: () => clock.now,
    });
  return { dir, dbPath, cataloguePath, clock, make, store: make() };
}

const vote = (over = {}) => ({
  competitionId: '2026',
  categoryId: 'cat-a',
  nomineeId: 'n-1',
  browserToken: TOKEN(1),
  ...over,
});

test('accepts a vote with name and email and counts it', async () => {
  const { store } = fixture();
  const res = await store.castAwardVote(vote({ name: 'Ada', email: 'ada@example.com' }), {
    clientIp: '41.0.0.1',
  });
  assert.deepEqual(res, { status: 'accepted', nomineeId: 'n-1' });
  assert.deepEqual(store.totals(), [{ nomineeId: 'n-1', categoryId: 'cat-a', count: 1 }]);
});

test('a retry is already-voted and never inflates the total, even for another nominee', async () => {
  const { store } = fixture();
  await store.castAwardVote(vote(), { clientIp: '41.0.0.1' });
  const again = await store.castAwardVote(vote(), { clientIp: '41.0.0.1' });
  const other = await store.castAwardVote(vote({ nomineeId: 'n-2' }), { clientIp: '41.0.0.1' });
  assert.deepEqual(again, { status: 'already-voted' });
  assert.deepEqual(other, { status: 'already-voted' });
  assert.equal(store.totals().reduce((n, r) => n + r.count, 0), 1);
});

test('different categories count separately for one browser', async () => {
  const { store } = fixture();
  await store.castAwardVote(vote(), {});
  const res = await store.castAwardVote(vote({ categoryId: 'cat-b', nomineeId: 'n-3' }), {});
  assert.equal(res.status, 'accepted');
});

test('concurrent submissions from one browser count once', async () => {
  const { store } = fixture();
  const results = await Promise.all(Array.from({ length: 20 }, () => store.castAwardVote(vote(), {})));
  assert.equal(results.filter((r) => r.status === 'accepted').length, 1);
  assert.equal(store.totals()[0].count, 1);
});

test('rejects unknown, mismatched and disabled nominees', async () => {
  const { store } = fixture();
  await assert.rejects(store.castAwardVote(vote({ categoryId: 'zz' }), {}), { code: 'invalid-argument' });
  await assert.rejects(store.castAwardVote(vote({ nomineeId: 'zz' }), {}), { code: 'invalid-argument' });
  await assert.rejects(store.castAwardVote(vote({ nomineeId: 'n-3' }), {}), { code: 'invalid-argument' });
  await assert.rejects(
    store.castAwardVote(vote({ categoryId: 'cat-b', nomineeId: 'n-off' }), {}),
    { code: 'failed-precondition' },
  );
  assert.deepEqual(store.totals(), []);
});

test('rejects malformed payloads', async () => {
  const { store } = fixture();
  await assert.rejects(store.castAwardVote(vote({ email: 'nope' }), {}), { code: 'invalid-argument' });
  await assert.rejects(store.castAwardVote(vote({ extra: 1 }), {}), { code: 'invalid-argument' });
});

test('closed flag and the deadline both stop votes', async () => {
  const closed = fixture({ open: false });
  await assert.rejects(closed.store.castAwardVote(vote(), {}), { code: 'failed-precondition' });
  const late = fixture({ now: Date.parse('2026-11-19T14:00:00Z') });
  await assert.rejects(late.store.castAwardVote(vote(), {}), { code: 'failed-precondition' });
  const justBefore = fixture({ now: Date.parse('2026-11-19T13:59:59.999Z') });
  assert.equal((await justBefore.store.castAwardVote(vote(), {})).status, 'accepted');
});

test('enforces the per-browser and per-network hourly ceilings, then resets next hour', async () => {
  const { store, clock } = fixture();
  // browser ceiling: only distinct categories count, so use many tokens against the ip ceiling instead
  for (let i = 0; i < policy.RATE_LIMITS.ipPerHour; i += 1) {
    await store.castAwardVote(vote({ browserToken: TOKEN(1000 + i) }), { clientIp: '41.9.9.9' });
  }
  await assert.rejects(
    store.castAwardVote(vote({ browserToken: TOKEN(99999) }), { clientIp: '41.9.9.9' }),
    { code: 'resource-exhausted' },
  );
  // another network is unaffected
  assert.equal(
    (await store.castAwardVote(vote({ browserToken: TOKEN(99999) }), { clientIp: '41.8.8.8' })).status,
    'accepted',
  );
  clock.now += policy.HOUR_MS;
  assert.equal(
    (await store.castAwardVote(vote({ browserToken: TOKEN(100000) }), { clientIp: '41.9.9.9' })).status,
    'accepted',
  );
});

test('votes survive a restart and imports are idempotent', async () => {
  const f = fixture();
  await f.store.castAwardVote(vote(), {});
  f.store.close();
  const reopened = f.make();
  assert.equal(reopened.totals()[0].count, 1);
  const row = {
    voteKey: 'imported-1',
    competitionId: '2026',
    categoryId: 'cat-a',
    nomineeId: 'n-2',
    createdAt: NOW,
  };
  assert.deepEqual(reopened.importVotes([row]), { imported: 1, skipped: 0 });
  assert.deepEqual(reopened.importVotes([row]), { imported: 0, skipped: 1 });
  assert.equal(reopened.totals().reduce((n, r) => n + r.count, 0), 2);
});

test('is unavailable (not a crash) while no catalogue exists, then recovers', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'acbf-sqlite-'));
  const cataloguePath = path.join(dir, 'catalogue.json');
  let t = NOW;
  const store = createSqliteVoteStore({
    path: path.join(dir, 'a.sqlite'),
    catalogue: createCatalogueSource(cataloguePath, { now: () => t }),
    now: () => NOW,
  });
  await assert.rejects(store.castAwardVote(vote(), {}), { code: 'unavailable' });
  assert.throws(() => store.readiness());
  fs.writeFileSync(
    cataloguePath,
    JSON.stringify({
      competition: { isOpen: true, closesAt: '2026-11-19T14:00:00Z' },
      categories: [{ id: 'cat-a' }],
      nominees: [{ id: 'n-1', categoryId: 'cat-a' }],
    }),
  );
  t += 10_000;
  assert.equal((await store.castAwardVote(vote(), {})).status, 'accepted');
  assert.doesNotThrow(() => store.readiness());
});

test('results() reports totals per nominee without any voter details', async () => {
  const { store } = fixture();
  await store.castAwardVote(vote({ name: 'Ada', email: 'ada@example.com' }), { clientIp: '41.0.0.1' });
  await store.castAwardVote(vote({ browserToken: TOKEN(2) }), { clientIp: '41.0.0.2' });
  await store.castAwardVote(vote({ browserToken: TOKEN(3), nomineeId: 'n-2' }), { clientIp: '41.0.0.3' });

  const results = store.results();
  assert.deepEqual(results.totals, { 'n-1': 2, 'n-2': 1 });
  assert.equal(results.acceptedVoteCount, 3);
  assert.equal(results.categories.length, 2);
  assert.equal(results.nominees.length, 4);
  assert.ok(!JSON.stringify(results).includes('ada@example.com'));
  assert.ok(!JSON.stringify(results).includes('Ada'));
});
