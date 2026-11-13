'use strict';

/**
 * End-to-end HTTP API checks against the Firestore emulator.
 *
 * These use the real vote transaction through the real HTTP transport, which is
 * the pairing the browser now depends on. The security-rules boundary for private
 * results is covered by `tests/firestore/awards.rules.test.mjs`; both suites run
 * under `npm run test:emulator`.
 *
 * Run with:
 *   firebase emulators:exec --only firestore --project demo-acbf \
 *     "node --test functions/test/api/http.emulator.test.js"
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const { createApiServer } = require('../../src/api/app');
const { createCastAwardVote } = require('../../src/awards/voting');

const PROJECT_ID = 'demo-acbf';
const HAS_EMULATOR = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

const ORIGIN = 'http://localhost:8080';
const CLIENT_IP = '203.0.113.7';
const CATEGORY_ID = 'education';
const NOMINEE_ID = 'education-kenya-some-person';

describe(
  'vote endpoint (Firestore emulator)',
  { skip: HAS_EMULATOR ? false : 'FIRESTORE_EMULATOR_HOST is not set — run npm run test:emulator:api' },
  () => {
    let admin;
    let db;
    let server;
    let baseUrl;
    const competition = () => db.doc('award_competitions/2026');

    async function seed() {
      await competition().set({
        isOpen: true,
        closesAt: admin.firestore.Timestamp.fromMillis(Date.parse('2026-11-19T14:00:00Z')),
      });
      await competition().collection('categories').doc(CATEGORY_ID).set({
        id: CATEGORY_ID,
        name: 'Excellence in Education',
      });
      await competition().collection('nominees').doc(NOMINEE_ID).set({
        id: NOMINEE_ID,
        categoryId: CATEGORY_ID,
        businessName: 'Synthetic Business',
        personName: 'Some Person',
        country: 'Kenya',
      });
    }

    function voteRequest(browserToken) {
      return fetch(`${baseUrl}/api/v1/awards/vote`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: ORIGIN,
          'x-acbf-client-ip': CLIENT_IP,
        },
        body: JSON.stringify({
          competitionId: '2026',
          categoryId: CATEGORY_ID,
          nomineeId: NOMINEE_ID,
          browserToken,
        }),
      });
    }

    before(async () => {
      admin = require('firebase-admin');
      if (!admin.apps.length) admin.initializeApp({ projectId: PROJECT_ID });
      db = admin.firestore();

      server = createApiServer({
        castVote: createCastAwardVote({ db, now: Date.now }),
        lookupInvitation: async () => {
          throw new Error('invitation lookup is not part of this suite');
        },
        acceptInvitation: async () => {
          throw new Error('invitation acceptance is not part of this suite');
        },
        readiness: async () => {
          await db.doc('award_competitions/2026').get();
        },
        allowedOrigin: ORIGIN,
        logger: { error() {}, warn() {}, info() {}, log() {} },
      });

      await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
      baseUrl = `http://127.0.0.1:${server.address().port}`;
    });

    after(async () => {
      server.closeAllConnections?.();
      await new Promise((resolve) => server.close(resolve));
      await db.recursiveDelete(competition());
    });

    it('reports readiness from a real Firestore read', async () => {
      const response = await fetch(`${baseUrl}/api/v1/ready`);
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { data: { status: 'ready' } });
    });

    it('counts ten concurrent same-browser HTTP votes once', async () => {
      await db.recursiveDelete(competition());
      await seed();

      const browserToken = crypto.randomUUID();
      const responses = await Promise.all(
        Array.from({ length: 10 }, () => voteRequest(browserToken)),
      );

      const bodies = await Promise.all(responses.map((response) => response.json()));
      assert.ok(
        responses.every((response) => response.status === 200),
        `unexpected statuses: ${responses.map((response) => response.status).join(', ')}`,
      );

      const statuses = bodies.map((body) => body.data && body.data.status).sort();
      assert.equal(statuses.filter((status) => status === 'accepted').length, 1);
      assert.equal(statuses.filter((status) => status === 'already-voted').length, 9);

      const votes = await competition().collection('votes').get();
      assert.equal(votes.size, 1);

      const total = await competition().collection('totals').doc(NOMINEE_ID).get();
      assert.equal(total.get('count'), 1);
    });
  },
);
