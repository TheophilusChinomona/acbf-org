import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  API_PATHS,
  BackendApiError,
  VOTE_STATUSES,
  parseVoteResult,
  postBackendApi,
} from './backendApi.js';

const PAYLOAD = Object.freeze({
  competitionId: '2026',
  categoryId: 'education',
  nomineeId: 'education-kenya-some-person',
  browserToken: '8f14e45f-ea43-4c3f-9a0e-0b6c7b7d5a11',
});

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function htmlResponse() {
  return new Response('<!doctype html><html><body>ACBF</body></html>', {
    status: 200,
    headers: { 'content-type': 'text/html' },
  });
}

function codeIs(code) {
  return (error) => {
    assert.ok(error instanceof BackendApiError, `expected BackendApiError, got ${error?.name}`);
    assert.equal(error.code, code, `expected ${code}, got ${error.code} (${error.message})`);
    return true;
  };
}

describe('postBackendApi', () => {
  it('posts JSON to an allowed path and returns the data envelope', async () => {
    const calls = [];
    const fetchImpl = async (url, options) => {
      calls.push({ url, options });
      return jsonResponse({ data: { status: 'accepted', nomineeId: PAYLOAD.nomineeId } });
    };

    const result = await postBackendApi(API_PATHS.vote, PAYLOAD, { fetchImpl });

    assert.deepEqual(result, { data: { status: 'accepted', nomineeId: PAYLOAD.nomineeId } });
    assert.equal(calls.length, 1, 'a single attempt — never an automatic retry');
    assert.equal(calls[0].url, '/api/v1/awards/vote');
    assert.equal(calls[0].options.method, 'POST');
    assert.equal(calls[0].options.headers['content-type'], 'application/json');
    assert.deepEqual(JSON.parse(calls[0].options.body), PAYLOAD);
  });

  it('refuses any path outside the fixed allowlist', async () => {
    let called = false;
    const fetchImpl = async () => {
      called = true;
      return jsonResponse({ data: {} });
    };

    for (const path of [
      'https://attacker.example/collect',
      '/api/v1/admin/invitations/delete',
      '/api/v1/awards/vote/../admin',
      '',
    ]) {
      await assert.rejects(
        postBackendApi(path, PAYLOAD, { fetchImpl }),
        codeIs('invalid-argument'),
      );
    }
    assert.equal(called, false);
  });

  it('reports a timeout without retrying', async () => {
    let attempts = 0;
    const fetchImpl = (url, options) => {
      attempts += 1;
      return new Promise((_, reject) => {
        options.signal.addEventListener('abort', () => {
          const error = new Error('aborted');
          error.name = 'AbortError';
          reject(error);
        });
      });
    };

    await assert.rejects(
      postBackendApi(API_PATHS.vote, PAYLOAD, { fetchImpl, timeoutMs: 10 }),
      codeIs('deadline-exceeded'),
    );
    assert.equal(attempts, 1);
  });

  it('reports a connection failure as unavailable', async () => {
    const fetchImpl = async () => {
      throw new TypeError('Failed to fetch');
    };

    await assert.rejects(postBackendApi(API_PATHS.vote, PAYLOAD, { fetchImpl }), codeIs('unavailable'));
  });

  it('treats a non-JSON reply as a failure, never a success', async () => {
    for (const response of [htmlResponse(), jsonResponse({ data: {} }, 502)]) {
      const fetchImpl = async () => response.clone();
      await assert.rejects(
        postBackendApi(API_PATHS.vote, PAYLOAD, { fetchImpl }),
        codeIs('unavailable'),
      );
    }
  });

  it('rejects a malformed success envelope', async () => {
    for (const body of [{}, { data: null }, { data: [] }, { data: 'accepted' }, { success: true }]) {
      const fetchImpl = async () => jsonResponse(body);
      await assert.rejects(postBackendApi(API_PATHS.vote, PAYLOAD, { fetchImpl }), codeIs('internal'));
    }
  });

  it('preserves the server error code and safe message', async () => {
    const fetchImpl = async () =>
      jsonResponse(
        {
          error: {
            code: 'resource-exhausted',
            message: 'Too many votes from this network in the last hour. Please try again later.',
          },
        },
        429,
      );

    await assert.rejects(postBackendApi(API_PATHS.vote, PAYLOAD, { fetchImpl }), (error) => {
      assert.ok(error instanceof BackendApiError);
      assert.equal(error.code, 'resource-exhausted');
      assert.match(error.message, /Too many votes from this network/);
      return true;
    });
  });

  it('reports an error status without a usable envelope as unavailable', async () => {
    for (const response of [
      jsonResponse({ error: 'gone' }, 503),
      jsonResponse({}, 500),
      jsonResponse({ error: { code: 'unavailable' } }, 503),
    ]) {
      const fetchImpl = async () => response.clone();
      await assert.rejects(postBackendApi(API_PATHS.vote, PAYLOAD, { fetchImpl }), codeIs('unavailable'));
    }
  });

  it('works for invitation lookup and acceptance too', async () => {
    const fetchImpl = async (url) => {
      if (url === API_PATHS.lookupInvitation) {
        return jsonResponse({ data: { invitation: { id: 'invitation-1' }, reason: null } });
      }
      return jsonResponse({ data: { uid: 'uid-1', email: 'invitee@example.test' } });
    };

    const lookup = await postBackendApi(API_PATHS.lookupInvitation, { token: 'abc' }, { fetchImpl });
    assert.equal(lookup.data.reason, null);

    const accept = await postBackendApi(
      API_PATHS.acceptInvitation,
      { token: 'abc', password: 'secret123' },
      { fetchImpl },
    );
    assert.equal(accept.data.email, 'invitee@example.test');
  });
});

describe('parseVoteResult', () => {
  it('accepts the two vote outcomes', () => {
    assert.deepEqual(VOTE_STATUSES, ['accepted', 'already-voted']);
    assert.deepEqual(parseVoteResult({ status: 'accepted', nomineeId: PAYLOAD.nomineeId }), {
      status: 'accepted',
      nomineeId: PAYLOAD.nomineeId,
    });
    assert.deepEqual(parseVoteResult({ status: 'already-voted' }), { status: 'already-voted' });
  });

  it('rejects unknown or missing vote statuses before local state changes', () => {
    for (const data of [{ status: 'recorded' }, { status: true }, {}, null, 'accepted', []]) {
      assert.throws(() => parseVoteResult(data), codeIs('internal'));
    }
  });
});
