'use strict';

/**
 * Admin invitation callables.
 *
 * Admin provisioning has to happen on the server: the previous client-side flow
 * let any fresh account write its own `users.role = 'admin'` profile and its own
 * `approved_admins` record, which cannot be authorised by security rules. These
 * callables keep the invitation experience unchanged while moving every
 * privileged write behind the Admin SDK.
 *
 * - `getAdminInvitation` returns the sanitized invitation details the acceptance
 *   page needs, so `admin_invitations` no longer has to be publicly readable
 *   (public reads exposed live invitation tokens).
 * - `acceptAdminInvitation` verifies the token, creates the Auth user, creates the
 *   approved admin profile, records the approved admin, and marks the invitation
 *   accepted.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

const INVITATIONS_COLLECTION = 'admin_invitations';
const APPROVED_ADMINS_COLLECTION = 'approved_admins';
const USERS_COLLECTION = 'users';

const TOKEN_PATTERN = /^[a-f0-9]{32,128}$/i;
const MAX_NAME_LENGTH = 120;
const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_LENGTH = 256;

function invalid(message) {
  return new functions.https.HttpsError('invalid-argument', message);
}

function readToken(data) {
  const token = typeof data?.token === 'string' ? data.token.trim() : '';
  if (!TOKEN_PATTERN.test(token)) throw invalid('Invalid invitation token.');
  return token;
}

function toIsoString(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return null;
}

function invitationExpired(data, nowMs) {
  if (!data?.expires_at) return false;
  const expiresAt =
    typeof data.expires_at.toMillis === 'function'
      ? data.expires_at.toMillis()
      : new Date(data.expires_at).getTime();
  return Number.isFinite(expiresAt) ? expiresAt <= nowMs : false;
}

/** Only display fields: the token and inviter address never leave the server. */
function serializeInvitation(snapshot) {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    email: data.email ?? '',
    invitee_name: data.invitee_name ?? '',
    invited_by_name: data.invited_by_name ?? '',
    note: data.note ?? '',
    status: data.status ?? 'pending',
    expires_at: toIsoString(data.expires_at),
    created_at: toIsoString(data.created_at),
  };
}

async function findInvitationByToken(db, token) {
  const snapshot = await db
    .collection(INVITATIONS_COLLECTION)
    .where('token', '==', token)
    .limit(1)
    .get();
  return snapshot.empty ? null : snapshot.docs[0];
}

/**
 * @param {{db: import('firebase-admin/firestore').Firestore, now?: () => number}} options
 */
function createGetAdminInvitation({ db, now = Date.now } = {}) {
  if (!db) throw new TypeError('createGetAdminInvitation requires a Firestore instance');

  return async function getAdminInvitation(data) {
    const token = readToken(data);
    const snapshot = await findInvitationByToken(db, token);
    if (!snapshot) return { invitation: null, reason: 'not-found' };

    const invitation = serializeInvitation(snapshot);
    if (invitation.status !== 'pending') return { invitation, reason: 'not-active' };
    if (invitationExpired(snapshot.data(), now())) return { invitation, reason: 'expired' };

    return { invitation, reason: null };
  };
}

/**
 * @param {{db: import('firebase-admin/firestore').Firestore, auth: import('firebase-admin/auth').Auth, now?: () => number}} options
 */
function createAcceptAdminInvitation({ db, auth, now = Date.now } = {}) {
  if (!db) throw new TypeError('createAcceptAdminInvitation requires a Firestore instance');
  if (!auth) throw new TypeError('createAcceptAdminInvitation requires an Auth instance');

  return async function acceptAdminInvitation(data) {
    const token = readToken(data);

    const password = typeof data?.password === 'string' ? data.password : '';
    if (password.length < MIN_PASSWORD_LENGTH) {
      throw invalid(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
    }
    if (password.length > MAX_PASSWORD_LENGTH) throw invalid('Password is too long.');

    const trimmedName = typeof data?.name === 'string' ? data.name.trim() : '';
    if (trimmedName.length > MAX_NAME_LENGTH) {
      throw invalid(`Name must be ${MAX_NAME_LENGTH} characters or fewer.`);
    }

    const snapshot = await findInvitationByToken(db, token);
    if (!snapshot) throw new functions.https.HttpsError('not-found', 'Invitation not found.');

    const invitation = snapshot.data();
    if (invitation.status !== 'pending') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'This invitation has already been used or cancelled.',
      );
    }
    if (invitationExpired(invitation, now())) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'This invitation has expired. Please request a new one.',
      );
    }

    const email = String(invitation.email ?? '').trim().toLowerCase();
    if (!email) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'This invitation is missing an email address. Please request a new one.',
      );
    }

    const displayName = trimmedName || invitation.invitee_name || email;

    let userRecord;
    try {
      userRecord = await auth.createUser({ email, password, displayName });
    } catch (error) {
      if (error?.code === 'auth/email-already-exists') {
        throw new functions.https.HttpsError(
          'already-exists',
          'An account already exists for this email. Sign in instead.',
        );
      }
      console.error('acceptAdminInvitation: failed to create auth user', { code: error?.code });
      throw new functions.https.HttpsError(
        'unavailable',
        'Could not create the account. Please try again.',
      );
    }

    const { FieldValue } = admin.firestore;
    const batch = db.batch();
    batch.set(db.collection(USERS_COLLECTION).doc(userRecord.uid), {
      email,
      name: displayName,
      role: 'admin',
      status: 'approved',
      approved_at: FieldValue.serverTimestamp(),
      approved_by: invitation.invited_by ?? null,
      member_application_id: null,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    });
    batch.set(
      db.collection(APPROVED_ADMINS_COLLECTION).doc(email),
      {
        email,
        name: displayName,
        approved_at: FieldValue.serverTimestamp(),
        approved_by: invitation.invited_by ?? null,
        status: 'approved',
      },
      { merge: true },
    );
    batch.update(db.collection(INVITATIONS_COLLECTION).doc(snapshot.id), {
      status: 'accepted',
      accepted_at: FieldValue.serverTimestamp(),
      accepted_by: userRecord.uid,
    });

    try {
      await batch.commit();
    } catch (error) {
      // Do not leave an orphaned auth account that cannot be provisioned again.
      await auth.deleteUser(userRecord.uid).catch(() => undefined);
      console.error('acceptAdminInvitation: failed to write admin records', {
        code: error?.code,
      });
      throw new functions.https.HttpsError(
        'unavailable',
        'Could not finish creating the account. Please try again.',
      );
    }

    return { uid: userRecord.uid, email };
  };
}

module.exports = {
  INVITATIONS_COLLECTION,
  createGetAdminInvitation,
  createAcceptAdminInvitation,
  serializeInvitation,
  findInvitationByToken,
};
