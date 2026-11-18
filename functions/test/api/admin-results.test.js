'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { createApiServer } = require('../../src/api/app');
const { DomainError, ERROR_CODES } = require('../../src/errors');

const RESULTS = { totals: { a: 2 }, acceptedVoteCount: 2, categories: [], nominees: [], competition: {} };

async function withServer(readAdminResults, run) {
  const server = createApiServer({
    castVote: async () => ({}),
    lookupInvitation: async () => ({}),
    acceptInvitation: async () => ({}),
    readiness: async () => {},
    readAdminResults,
    allowedOrigin: 'https://acbf.org.za',
    logger: { warn() {}, error() {}, info() {} },
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

const reader = async (token) => {
  if (token === 'admin-token') return RESULTS;
  if (token === 'other-token') {
    throw new DomainError(ERROR_CODES.PERMISSION_DENIED, 'Your account is not authorised to view award results.');
  }
  throw new DomainError(ERROR_CODES.UNAUTHENTICATED, 'Your session has expired. Sign in again.');
};

test('admin results: no token is 401, bad token is 401, non-admin is 403', async () => {
  await withServer(reader, async (base) => {
    const url = `${base}/api/v1/admin/awards/results`;
    assert.equal((await fetch(url)).status, 401);
    assert.equal((await fetch(url, { headers: { authorization: 'Basic abc' } })).status, 401);
    assert.equal((await fetch(url, { headers: { authorization: 'Bearer nope' } })).status, 401);
    const denied = await fetch(url, { headers: { authorization: 'Bearer other-token' } });
    assert.equal(denied.status, 403);
    assert.ok(!JSON.stringify(await denied.json()).includes('totals'));
  });
});

test('admin results: an authorised admin gets the totals, never cached', async () => {
  await withServer(reader, async (base) => {
    const res = await fetch(`${base}/api/v1/admin/awards/results`, {
      headers: { authorization: 'Bearer admin-token' },
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('cache-control'), 'no-store');
    assert.deepEqual((await res.json()).data.totals, { a: 2 });
  });
});

test('admin results: the route does not exist when no reader is configured', async () => {
  await withServer(undefined, async (base) => {
    const res = await fetch(`${base}/api/v1/admin/awards/results`, {
      headers: { authorization: 'Bearer admin-token' },
    });
    assert.equal(res.status, 404);
  });
});

const VOTES = { ...RESULTS, votes: [{ categoryId: 'a', nomineeId: 'n', name: 'Ada', email: 'ada@example.com', createdAt: 1 }] };

async function withVotesServer(readAdminVotes, run) {
  const server = createApiServer({
    castVote: async () => ({}),
    lookupInvitation: async () => ({}),
    acceptInvitation: async () => ({}),
    readiness: async () => {},
    readAdminVotes,
    allowedOrigin: 'https://acbf.org.za',
    logger: { warn() {}, error() {}, info() {} },
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

const votesReader = async (token) => {
  if (token === 'admin-token') return VOTES;
  if (token === 'other-token') {
    throw new DomainError(ERROR_CODES.PERMISSION_DENIED, 'Your account is not authorised to view award results.');
  }
  throw new DomainError(ERROR_CODES.UNAUTHENTICATED, 'Your session has expired. Sign in again.');
};

test('admin votes: only an authorised admin gets voter details; nobody else sees them', async () => {
  await withVotesServer(votesReader, async (base) => {
    const url = `${base}/api/v1/admin/awards/votes`;
    assert.equal((await fetch(url)).status, 401);
    assert.equal((await fetch(url, { headers: { authorization: 'Bearer nope' } })).status, 401);
    const denied = await fetch(url, { headers: { authorization: 'Bearer other-token' } });
    assert.equal(denied.status, 403);
    assert.ok(!JSON.stringify(await denied.json()).includes('ada@example.com'));

    const ok = await fetch(url, { headers: { authorization: 'Bearer admin-token' } });
    assert.equal(ok.status, 200);
    assert.equal(ok.headers.get('cache-control'), 'no-store');
    assert.equal((await ok.json()).data.votes[0].email, 'ada@example.com');
  });
});

test('admin votes: the route does not exist when no reader is configured', async () => {
  await withVotesServer(undefined, async (base) => {
    const res = await fetch(`${base}/api/v1/admin/awards/votes`, {
      headers: { authorization: 'Bearer admin-token' },
    });
    assert.equal(res.status, 404);
  });
});

test('the results reader never serves the votes route', async () => {
  await withServer(reader, async (base) => {
    const res = await fetch(`${base}/api/v1/admin/awards/votes`, {
      headers: { authorization: 'Bearer admin-token' },
    });
    assert.equal(res.status, 404);
  });
});
