'use strict';

/**
 * Internal HTTP API tests.
 *
 * The server is built with injected services, so these tests exercise the
 * transport contract — routing, origin/content-type gating, body limits, the
 * proxy client-IP header, error translation and timeouts — without Firestore.
 * Real transaction behaviour is covered by the emulator suites.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const net = require('node:net');

const { createApiServer } = require('../../src/api/app');
const { DomainError } = require('../../src/errors');

const ORIGIN = 'https://acbf.example';
const CLIENT_IP = '203.0.113.7';
const VOTE_PATH = '/api/v1/awards/vote';
const LOOKUP_PATH = '/api/v1/admin/invitations/lookup';
const ACCEPT_PATH = '/api/v1/admin/invitations/accept';
const HEALTH_PATH = '/api/v1/health';
const READY_PATH = '/api/v1/ready';

const VOTE_PAYLOAD = Object.freeze({
  competitionId: '2026',
  categoryId: 'education',
  nomineeId: 'education-kenya-some-person',
  browserToken: '8f14e45f-ea43-4c3f-9a0e-0b6c7b7d5a11',
});

function quietLogger(entries = []) {
  return {
    error: (...args) => entries.push(args),
    warn: (...args) => entries.push(args),
    info: () => {},
    log: () => {},
  };
}

async function startServer(overrides = {}) {
  const calls = [];
  const server = createApiServer({
    castVote: async (data, context) => {
      calls.push({ route: 'vote', data, context });
      return { status: 'accepted', nomineeId: data.nomineeId };
    },
    lookupInvitation: async (data) => {
      calls.push({ route: 'lookup', data });
      return { invitation: { id: 'invitation-1', status: 'pending' }, reason: null };
    },
    acceptInvitation: async (data) => {
      calls.push({ route: 'accept', data });
      return { uid: 'uid-1', email: 'invitee@example.test' };
    },
    readiness: async () => {},
    allowedOrigin: ORIGIN,
    logger: quietLogger(),
    ...overrides,
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  return {
    calls,
    baseUrl: `http://127.0.0.1:${port}`,
    async close() {
      server.closeAllConnections?.();
      await new Promise((resolve) => server.close(resolve));
    },
  };
}

async function withServer(overrides, run) {
  const harness = await startServer(overrides);
  try {
    return await run(harness);
  } finally {
    await harness.close();
  }
}

function post(baseUrl, path, { headers = {}, body = {}, rawBody } = {}) {
  const merged = {
    origin: ORIGIN,
    'content-type': 'application/json',
    'x-acbf-client-ip': CLIENT_IP,
    ...headers,
  };
  const finalHeaders = Object.fromEntries(
    Object.entries(merged).filter(([, value]) => value !== null && value !== undefined),
  );

  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: finalHeaders,
    body: rawBody !== undefined ? rawBody : JSON.stringify(body),
  });
}

async function readJson(response) {
  assert.match(
    response.headers.get('content-type') || '',
    /^application\/json/,
    'every API response must be JSON, never SPA HTML',
  );
  return response.json();
}

describe('internal API routing and contract', () => {
  it('serves health as process liveness only', async () => {
    await withServer({}, async ({ baseUrl }) => {
      const response = await fetch(`${baseUrl}${HEALTH_PATH}`);
      assert.equal(response.status, 200);
      assert.deepEqual(await readJson(response), { data: { status: 'ok' } });
    });
  });

  it('serves readiness only when the dependency check passes', async () => {
    await withServer({}, async ({ baseUrl }) => {
      const response = await fetch(`${baseUrl}${READY_PATH}`);
      assert.equal(response.status, 200);
      assert.deepEqual(await readJson(response), { data: { status: 'ready' } });
    });

    await withServer(
      {
        readiness: async () => {
          throw new Error('Firestore unreachable at 10.0.0.5: wrong password');
        },
      },
      async ({ baseUrl }) => {
        const response = await fetch(`${baseUrl}${READY_PATH}`);
        assert.equal(response.status, 503);
        const body = await readJson(response);
        assert.equal(body.error.code, 'unavailable');
        assert.ok(!JSON.stringify(body).includes('10.0.0.5'));
      },
    );
  });

  it('accepts a vote and passes only the trusted client IP to the service', async () => {
    await withServer({}, async ({ baseUrl, calls }) => {
      const response = await post(baseUrl, VOTE_PATH, {
        body: VOTE_PAYLOAD,
        headers: { 'x-forwarded-for': '198.51.100.9' },
      });

      assert.equal(response.status, 200);
      assert.deepEqual(await readJson(response), {
        data: { status: 'accepted', nomineeId: VOTE_PAYLOAD.nomineeId },
      });
      assert.equal(calls.length, 1);
      assert.deepEqual(calls[0].data, VOTE_PAYLOAD);
      assert.deepEqual(calls[0].context, { clientIp: CLIENT_IP });
    });
  });

  it('looks up and accepts invitations', async () => {
    await withServer({}, async ({ baseUrl, calls }) => {
      const lookup = await post(baseUrl, LOOKUP_PATH, { body: { token: 'abc' } });
      assert.equal(lookup.status, 200);
      assert.deepEqual(await readJson(lookup), {
        data: { invitation: { id: 'invitation-1', status: 'pending' }, reason: null },
      });

      const accept = await post(baseUrl, ACCEPT_PATH, {
        body: { token: 'abc', password: 'secret123', name: 'New Admin' },
      });
      assert.equal(accept.status, 200);
      assert.deepEqual(await readJson(accept), {
        data: { uid: 'uid-1', email: 'invitee@example.test' },
      });

      assert.deepEqual(calls.map((call) => call.route), ['lookup', 'accept']);
    });
  });

  it('preserves existing domain error codes and statuses', async () => {
    const cases = [
      ['invalid-argument', 400],
      ['unauthenticated', 401],
      ['permission-denied', 403],
      ['not-found', 404],
      ['already-exists', 409],
      ['failed-precondition', 409],
      ['resource-exhausted', 429],
      ['unavailable', 503],
      ['internal', 503],
    ];

    let nextError;
    await withServer(
      {
        castVote: async () => {
          throw nextError;
        },
      },
      async ({ baseUrl }) => {
        for (const [code, status] of cases) {
          nextError = new DomainError(code, 'Reviewed safe message.');
          const response = await post(baseUrl, VOTE_PATH, { body: VOTE_PAYLOAD });
          assert.equal(response.status, status, `${code} must map to ${status}`);
          assert.deepEqual(await readJson(response), {
            error: { code, message: 'Reviewed safe message.' },
          });
        }
      },
    );
  });

  it('rejects invalid JSON, non-object payloads and unknown fields', async () => {
    await withServer({}, async ({ baseUrl, calls }) => {
      for (const rawBody of ['{', '', 'undefined']) {
        const response = await post(baseUrl, VOTE_PATH, { rawBody });
        assert.equal(response.status, 400, `body ${JSON.stringify(rawBody)} must be rejected`);
        assert.equal((await readJson(response)).error.code, 'invalid-argument');
      }

      for (const rawBody of ['[]', '"vote"', 'null', '42']) {
        const response = await post(baseUrl, VOTE_PATH, { rawBody });
        assert.equal(response.status, 400);
        assert.equal((await readJson(response)).error.code, 'invalid-argument');
      }

      const unknownField = await post(baseUrl, VOTE_PATH, {
        body: { ...VOTE_PAYLOAD, timestamp: 1 },
      });
      assert.equal(unknownField.status, 400);
      assert.match((await readJson(unknownField)).error.message, /Unexpected field/);

      const unknownLookupField = await post(baseUrl, LOOKUP_PATH, {
        body: { token: 'abc', email: 'attacker@example.test' },
      });
      assert.equal(unknownLookupField.status, 400);

      assert.deepEqual(calls, [], 'a rejected request must never reach a service');
    });
  });

  it('rejects oversized bodies', async () => {
    await withServer({}, async ({ baseUrl }) => {
      const response = await post(baseUrl, VOTE_PATH, {
        rawBody: JSON.stringify({ ...VOTE_PAYLOAD, email: `${'a'.repeat(20000)}@example.test` }),
      });
      assert.equal(response.status, 413);
      assert.equal((await readJson(response)).error.code, 'invalid-argument');
    });
  });

  it('requires an exact Origin and a JSON content type on mutations', async () => {
    await withServer({}, async ({ baseUrl }) => {
      const wrongOrigin = await post(baseUrl, VOTE_PATH, {
        body: VOTE_PAYLOAD,
        headers: { origin: 'https://attacker.example' },
      });
      assert.equal(wrongOrigin.status, 403);

      const missingOrigin = await post(baseUrl, VOTE_PATH, {
        body: VOTE_PAYLOAD,
        headers: { origin: null },
      });
      assert.equal(missingOrigin.status, 403);

      const wildcardOrigin = await post(baseUrl, VOTE_PATH, {
        body: VOTE_PAYLOAD,
        headers: { origin: '*' },
      });
      assert.equal(wildcardOrigin.status, 403);

      const textPlain = await post(baseUrl, VOTE_PATH, {
        body: VOTE_PAYLOAD,
        headers: { 'content-type': 'text/plain' },
      });
      assert.equal(textPlain.status, 415);

      const withCharset = await post(baseUrl, VOTE_PATH, {
        body: VOTE_PAYLOAD,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      });
      assert.equal(withCharset.status, 200);
    });
  });

  it('reports wrong methods and unknown routes as JSON', async () => {
    await withServer({}, async ({ baseUrl }) => {
      const wrongMethod = await fetch(`${baseUrl}${VOTE_PATH}`, { method: 'GET' });
      assert.equal(wrongMethod.status, 405);
      assert.equal(wrongMethod.headers.get('allow'), 'POST');
      assert.equal((await readJson(wrongMethod)).error.code, 'invalid-argument');

      const unknown = await post(baseUrl, '/api/v1/does-not-exist', { body: {} });
      assert.equal(unknown.status, 404);
      assert.equal((await readJson(unknown)).error.code, 'not-found');

      const spaPath = await fetch(`${baseUrl}/awards`);
      assert.equal(spaPath.status, 404);
      await readJson(spaPath);
    });
  });

  it('never leaks internals or logs request detail on unexpected failures', async () => {
    const logged = [];
    await withServer(
      {
        castVote: async () => {
          throw new Error('secret internal detail: service account token=abc');
        },
        logger: quietLogger(logged),
      },
      async ({ baseUrl }) => {
        const response = await post(baseUrl, VOTE_PATH, {
          body: { ...VOTE_PAYLOAD, email: 'voter@example.test' },
        });
        assert.equal(response.status, 503);
        const body = await readJson(response);
        assert.equal(body.error.code, 'unavailable');
        assert.match(body.error.message, /temporarily unavailable/i);
        assert.ok(!JSON.stringify(body).includes('secret internal detail'));

        const loggedText = JSON.stringify(logged);
        assert.ok(!loggedText.includes('secret internal detail'));
        assert.ok(!loggedText.includes('voter@example.test'));
        assert.ok(!loggedText.includes(VOTE_PAYLOAD.browserToken));
      },
    );
  });

  it('returns unavailable instead of hanging when a service exceeds its deadline', async () => {
    await withServer(
      {
        castVote: () => new Promise(() => {}),
        handlerTimeoutMs: 25,
      },
      async ({ baseUrl }) => {
        const response = await post(baseUrl, VOTE_PATH, { body: VOTE_PAYLOAD });
        assert.equal(response.status, 503);
        assert.equal((await readJson(response)).error.code, 'unavailable');
      },
    );
  });
});

describe('proxy client-IP contract', () => {
  it('ignores spoofed forwarding headers and multi-value identities', async () => {
    await withServer({}, async ({ baseUrl, calls }) => {
      const cases = [
        { 'x-acbf-client-ip': null },
        { 'x-acbf-client-ip': '' },
        { 'x-acbf-client-ip': 'not-an-ip' },
        { 'x-acbf-client-ip': `${CLIENT_IP}, 198.51.100.9` },
        { 'x-acbf-client-ip': null, 'x-forwarded-for': '198.51.100.9' },
        { 'x-acbf-client-ip': null, 'forwarded': `for=198.51.100.9` },
      ];

      for (const headers of cases) {
        const response = await post(baseUrl, VOTE_PATH, { body: VOTE_PAYLOAD, headers });
        assert.equal(response.status, 503, `headers ${JSON.stringify(headers)} must not vote`);
        assert.equal((await readJson(response)).error.code, 'unavailable');
      }

      assert.deepEqual(calls, [], 'no vote may be attempted without a trusted identity');
    });
  });

  it('accepts IPv6 identities supplied by the proxy', async () => {
    await withServer({}, async ({ baseUrl, calls }) => {
      const ipv6 = '2001:db8::1';
      assert.equal(net.isIP(ipv6), 6);
      const response = await post(baseUrl, VOTE_PATH, {
        body: VOTE_PAYLOAD,
        headers: { 'x-acbf-client-ip': ipv6 },
      });
      assert.equal(response.status, 200);
      assert.deepEqual(calls[0].context, { clientIp: ipv6 });
    });
  });
});
