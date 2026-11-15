'use strict';

/**
 * Admin invitation domain-service tests.
 *
 * Pure validation tests run anywhere:
 *   node --test functions/test/api/invitations.test.js
 *
 * Lookup/acceptance tests need the Firestore emulator (see
 * `npm run test:emulator:voting`). Auth is replaced by a small in-memory double
 * so the conflicting-account and partial-failure paths are deterministic; the
 * real Admin SDK Auth contract used here is only `createUser` and `deleteUser`.
 */

const { describe, it, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const { DomainError } = require('../../src/errors');
const {
  createGetAdminInvitation,
  createAcceptAdminInvitation,
} = require('../../src/admin/invitations');
const { createCastAwardVote } = require('../../src/awards/voting');

const PROJECT_ID = 'demo-acbf';
const HAS_EMULATOR = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
const NOW = Date.parse('2026-11-13T09:00:00Z');
const DAY_MS = 24 * 60 * 60 * 1000;

const INVITATIONS = 'admin_invitations';
const USERS = 'users';
const APPROVED_ADMINS = 'approved_admins';

function newToken() {
  return crypto.randomBytes(32).toString('hex');
}

function codeIs(code) {
  return (error) => {
    assert.ok(error instanceof DomainError, `expected a DomainError, got ${error?.name}`);
    assert.equal(error.code, code, `expected ${code}, got ${error.code} (${error.message})`);
    return true;
  };
}

/** In-memory stand-in for the Admin Auth operations used by acceptance. */
function createFakeAuth({ existingEmails = [] } = {}) {
  const users = new Map();
  const taken = new Set(existingEmails.map((email) => email.toLowerCase()));
  let sequence = 0;

  return {
    users,
    async createUser({ email, password, displayName }) {
      const normalized = String(email).toLowerCase();
      if (taken.has(normalized)) {
        const error = new Error('The email address is already in use by another account.');
        error.code = 'auth/email-already-exists';
        throw error;
      }
      taken.add(normalized);
      sequence += 1;
      const record = { uid: `uid-${sequence}`, email: normalized, password, displayName };
      users.set(record.uid, record);
      return record;
    },
    async deleteUser(uid) {
      const record = users.get(uid);
      if (!record) {
        const error = new Error('No user record found.');
        error.code = 'auth/user-not-found';
        throw error;
      }
      users.delete(uid);
      taken.delete(record.email);
    },
  };
}

// ---------------------------------------------------------------------------
// Transport independence
// ---------------------------------------------------------------------------

describe('domain services are transport independent', () => {
  it('loads without the Cloud Functions runtime', () => {
    assert.equal(typeof createCastAwardVote, 'function');
    assert.equal(typeof createGetAdminInvitation, 'function');
    assert.equal(typeof createAcceptAdminInvitation, 'function');
    const loaded = Object.keys(require.cache).filter((id) =>
      id.includes(`${require('node:path').sep}firebase-functions${require('node:path').sep}`),
    );
    assert.deepEqual(loaded, [], 'domain modules must not require firebase-functions');
  });

  it('throws domain errors rather than framework errors', async () => {
    const lookup = createGetAdminInvitation({ db: {}, now: () => NOW });
    await assert.rejects(lookup({ token: 'not-a-token' }), codeIs('invalid-argument'));

    const accept = createAcceptAdminInvitation({ db: {}, auth: {}, now: () => NOW });
    await assert.rejects(accept({ token: 'not-a-token', password: 'secret123' }), codeIs('invalid-argument'));
    await assert.rejects(accept({ token: newToken(), password: 'short' }), codeIs('invalid-argument'));
    await assert.rejects(
      accept({ token: newToken(), password: 'secret123', name: 'a'.repeat(121) }),
      codeIs('invalid-argument'),
    );
  });
});

// ---------------------------------------------------------------------------
// Lookup and acceptance against the Firestore emulator
// ---------------------------------------------------------------------------

describe(
  'invitations (Firestore emulator)',
  { skip: HAS_EMULATOR ? false : 'FIRESTORE_EMULATOR_HOST is not set — run npm run test:emulator:voting' },
  () => {
    let admin;
    let db;
    let lookup;
    let fakeAuth;

    function invitationRef(id) {
      return db.collection(INVITATIONS).doc(id);
    }

    async function seedInvitation(overrides = {}) {
      const id = overrides.id || crypto.randomUUID();
      await invitationRef(id).set({
        email: 'Invitee@Example.test',
        invitee_name: 'Invitee Person',
        invited_by: 'admin@example.test',
        invited_by_name: 'Approving Admin',
        note: 'Welcome aboard',
        status: 'pending',
        token: overrides.token || newToken(),
        expires_at: admin.firestore.Timestamp.fromMillis(NOW + 7 * DAY_MS),
        created_at: admin.firestore.Timestamp.fromMillis(NOW - DAY_MS),
        ...overrides.data,
      });
      return id;
    }

    async function readInvitation(id) {
      const snapshot = await invitationRef(id).get();
      return snapshot.data();
    }

    before(() => {
      admin = require('firebase-admin');
      if (!admin.apps.length) admin.initializeApp({ projectId: PROJECT_ID });
      db = admin.firestore();
    });

    beforeEach(async () => {
      await db.recursiveDelete(db.collection(INVITATIONS));
      await db.recursiveDelete(db.collection(USERS));
      await db.recursiveDelete(db.collection(APPROVED_ADMINS));
      lookup = createGetAdminInvitation({ db, now: () => NOW });
      fakeAuth = createFakeAuth();
    });

    after(async () => {
      await db.recursiveDelete(db.collection(INVITATIONS));
      await db.recursiveDelete(db.collection(USERS));
      await db.recursiveDelete(db.collection(APPROVED_ADMINS));
    });

    it('returns only display fields for a pending invitation', async () => {
      const token = newToken();
      const id = await seedInvitation({ token });

      const result = await lookup({ token });

      assert.equal(result.reason, null);
      assert.deepEqual(Object.keys(result.invitation).sort(), [
        'created_at',
        'email',
        'expires_at',
        'id',
        'invited_by_name',
        'invitee_name',
        'note',
        'status',
      ]);
      assert.equal(result.invitation.id, id);
      assert.equal(result.invitation.email, 'Invitee@Example.test');
      assert.equal(result.invitation.status, 'pending');
      assert.ok(!('token' in result.invitation), 'the token must never be echoed');
      assert.ok(!('invited_by' in result.invitation), 'the inviter address must not be exposed');
    });

    it('reports an unknown token without throwing', async () => {
      const result = await lookup({ token: newToken() });
      assert.deepEqual(result, { invitation: null, reason: 'not-found' });
    });

    it('reports expired, cancelled and accepted invitations without granting access', async () => {
      const expiredToken = newToken();
      await seedInvitation({
        token: expiredToken,
        data: { expires_at: admin.firestore.Timestamp.fromMillis(NOW) },
      });
      assert.equal((await lookup({ token: expiredToken })).reason, 'expired');

      const cancelledToken = newToken();
      const cancelledId = await seedInvitation({ token: cancelledToken, data: { status: 'cancelled' } });
      assert.equal((await lookup({ token: cancelledToken })).reason, 'not-active');

      const acceptedToken = newToken();
      await seedInvitation({ token: acceptedToken, data: { status: 'accepted' } });
      assert.equal((await lookup({ token: acceptedToken })).reason, 'not-active');

      const accept = createAcceptAdminInvitation({ db, auth: fakeAuth, now: () => NOW });
      await assert.rejects(
        accept({ token: expiredToken, password: 'secret123' }),
        codeIs('failed-precondition'),
      );
      await assert.rejects(
        accept({ token: cancelledToken, password: 'secret123' }),
        codeIs('failed-precondition'),
      );
      await assert.rejects(
        accept({ token: acceptedToken, password: 'secret123' }),
        codeIs('failed-precondition'),
      );
      assert.equal((await readInvitation(cancelledId)).status, 'cancelled');
      assert.equal(fakeAuth.users.size, 0, 'no account may be created for a dead invitation');
    });

    it('provisions admin access from the stored invitation, ignoring client identity', async () => {
      const token = newToken();
      const id = await seedInvitation({ token });
      const accept = createAcceptAdminInvitation({ db, auth: fakeAuth, now: () => NOW });

      const result = await accept({
        token,
        password: 'secret123',
        name: '  Chosen Name  ',
        email: 'attacker@example.test',
        role: 'super_admin',
        status: 'approved',
      });

      assert.equal(result.email, 'invitee@example.test');
      assert.match(result.uid, /^uid-/);

      const users = await db.collection(USERS).get();
      assert.equal(users.size, 1);
      const profile = users.docs[0].data();
      assert.equal(users.docs[0].id, result.uid);
      assert.equal(profile.email, 'invitee@example.test');
      assert.equal(profile.role, 'admin');
      assert.equal(profile.status, 'approved');
      assert.equal(profile.name, 'Chosen Name');

      const approved = await db.collection(APPROVED_ADMINS).get();
      assert.equal(approved.size, 1);
      assert.equal(approved.docs[0].id, 'invitee@example.test');
      assert.equal(approved.docs[0].get('status'), 'approved');

      const stored = await readInvitation(id);
      assert.equal(stored.status, 'accepted');
      assert.equal(stored.accepted_by, result.uid);

      assert.equal(fakeAuth.users.size, 1);
    });

    it('rejects an existing Auth account without duplicating privilege or deleting it', async () => {
      const token = newToken();
      const id = await seedInvitation({ token });
      fakeAuth = createFakeAuth({ existingEmails: ['invitee@example.test'] });
      const accept = createAcceptAdminInvitation({ db, auth: fakeAuth, now: () => NOW });

      await assert.rejects(accept({ token, password: 'secret123' }), codeIs('already-exists'));

      assert.equal(fakeAuth.users.size, 0, 'a pre-existing account must not be created or removed');
      assert.equal((await db.collection(USERS).get()).size, 0);
      assert.equal((await db.collection(APPROVED_ADMINS).get()).size, 0);
      assert.equal((await readInvitation(id)).status, 'pending');
    });

    it('grants exactly one admin record for concurrent acceptance attempts', async () => {
      const token = newToken();
      await seedInvitation({ token });
      const accept = createAcceptAdminInvitation({ db, auth: fakeAuth, now: () => NOW });

      const results = await Promise.allSettled([
        accept({ token, password: 'secret123' }),
        accept({ token, password: 'secret123' }),
      ]);

      const fulfilled = results.filter((result) => result.status === 'fulfilled');
      const rejected = results.filter((result) => result.status === 'rejected');
      assert.equal(fulfilled.length, 1, 'exactly one acceptance may succeed');
      assert.equal(rejected.length, 1);
      assert.ok(
        ['already-exists', 'failed-precondition'].includes(rejected[0].reason.code),
        `unexpected rejection code ${rejected[0].reason.code}`,
      );

      assert.equal((await db.collection(USERS).get()).size, 1);
      assert.equal((await db.collection(APPROVED_ADMINS).get()).size, 1);
      assert.equal(fakeAuth.users.size, 1);
    });

    it('rolls back only the account it created when profile writes fail', async () => {
      const token = newToken();
      const id = await seedInvitation({ token });

      const failingDb = {
        collection: (...args) => db.collection(...args),
        batch: () => {
          const batch = db.batch();
          return {
            set: (...args) => batch.set(...args),
            update: (...args) => batch.update(...args),
            commit: async () => {
              throw new Error('simulated Firestore write failure');
            },
          };
        },
      };
      const accept = createAcceptAdminInvitation({
        db: failingDb,
        auth: fakeAuth,
        now: () => NOW,
      });

      await assert.rejects(accept({ token, password: 'secret123' }), codeIs('unavailable'));

      assert.equal(fakeAuth.users.size, 0, 'the just-created account must be removed');
      assert.equal((await db.collection(USERS).get()).size, 0);
      assert.equal((await db.collection(APPROVED_ADMINS).get()).size, 0);
      assert.equal((await readInvitation(id)).status, 'pending');
    });
  },
);
