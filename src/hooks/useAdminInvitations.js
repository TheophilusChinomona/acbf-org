import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';
import { useUserManagement } from './useUserManagement';
import {
  generateInvitationToken,
  validateInvitationToken,
  getInvitationExpiryDate,
  isInvitationExpired,
  INVITATION_TOKEN_DEFAULTS,
} from '../utils/invitationToken';
import { USER_ROLES } from '../utils/userRoles';

const INVITATIONS_COLLECTION = 'admin_invitations';
const APPROVED_ADMINS_COLLECTION = 'approved_admins';

function normaliseEmail(email) {
  if (typeof email !== 'string') {
    return '';
  }
  return email.trim().toLowerCase();
}

function mapTimestamp(value) {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value;
  }
  if (value.toDate) {
    return value.toDate();
  }
  return new Date(value);
}

function formatInvitationDoc(snapshot) {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    ...data,
    created_at: mapTimestamp(data?.created_at),
    expires_at: mapTimestamp(data?.expires_at),
    accepted_at: mapTimestamp(data?.accepted_at),
    cancelled_at: mapTimestamp(data?.cancelled_at),
  };
}

async function findInvitationByToken(token) {
  const invitationsQuery = query(
    collection(db, INVITATIONS_COLLECTION),
    where('token', '==', token),
    limit(1),
  );

  const snapshot = await getDocs(invitationsQuery);
  if (snapshot.empty) {
    return null;
  }
  return snapshot.docs[0];
}

export function useAdminInvitations({ listen = false } = {}) {
  const { currentUser, register } = useAuth();
  const { createUserProfile } = useUserManagement();

  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(listen);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!listen) {
      setInvitations([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    setError(null);

    const invitationsQuery = query(
      collection(db, INVITATIONS_COLLECTION),
      orderBy('created_at', 'desc'),
    );

    const unsubscribe = onSnapshot(
      invitationsQuery,
      (snapshot) => {
        const invitationList = snapshot.docs.map(formatInvitationDoc);
        setInvitations(invitationList);
        setError(null);
        setLoading(false);
      },
      (listenerError) => {
        console.error('Failed to listen to admin invitations:', listenerError);
        setError(listenerError.message || 'Failed to load admin invitations');
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [listen]);

  const pendingInvitations = useMemo(
    () =>
      invitations.filter((invitation) => {
        if (invitation.status !== 'pending') {
          return false;
        }
        if (!invitation.expires_at) {
          return true;
        }
        try {
          return !isInvitationExpired(invitation.expires_at);
        } catch (err) {
          console.warn('Failed to evaluate invitation expiry:', err);
          return true;
        }
      }),
    [invitations],
  );

  const createAdminInvitation = useCallback(
    async ({ email, name = '', note = '', ttlHours = INVITATION_TOKEN_DEFAULTS.TTL_HOURS } = {}) => {
      const normalizedEmail = normaliseEmail(email);
      if (!normalizedEmail) {
        throw new Error('A valid email is required to invite an admin.');
      }

      const inviterEmail = currentUser?.email ?? null;
      if (!inviterEmail) {
        throw new Error('You must be signed in to send an invitation.');
      }

      const token = generateInvitationToken();
      const expiresAtDate = getInvitationExpiryDate({ ttlHours });

      const invitationData = {
        email: normalizedEmail,
        invited_by: inviterEmail,
        invited_by_name: currentUser?.displayName || inviterEmail,
        status: 'pending',
        token,
        note: note?.trim() || '',
        expires_at: Timestamp.fromDate(expiresAtDate),
        created_at: serverTimestamp(),
        ttl_hours: ttlHours,
        invitee_name: name?.trim() || '',
      };

      const docRef = await addDoc(collection(db, INVITATIONS_COLLECTION), invitationData);
      const snapshot = await getDoc(docRef);
      return formatInvitationDoc(snapshot);
    },
    [currentUser?.displayName, currentUser?.email],
  );

  const getInvitationByToken = useCallback(async (rawToken) => {
    if (!validateInvitationToken(rawToken, { minLength: 8, maxLength: 256 })) {
      return null;
    }

    const trimmedToken = rawToken.trim();
    const snapshot = await findInvitationByToken(trimmedToken);
    if (!snapshot) {
      return null;
    }
    return formatInvitationDoc(snapshot);
  }, []);

  const markInvitationAsAccepted = useCallback(async (invitationId, acceptedBy) => {
    const invitationRef = doc(db, INVITATIONS_COLLECTION, invitationId);
    await updateDoc(invitationRef, {
      status: 'accepted',
      accepted_at: serverTimestamp(),
      accepted_by: acceptedBy ?? null,
    });
  }, []);

  const addApprovedAdminRecord = useCallback(async ({ email, name, approver }) => {
    const adminRef = doc(db, APPROVED_ADMINS_COLLECTION, email);
    await setDoc(
      adminRef,
      {
        email,
        name: name || email,
        approved_by: approver || null,
        approved_at: serverTimestamp(),
        status: 'approved',
      },
      { merge: true },
    );
  }, []);

  const acceptInvitation = useCallback(
    async ({ token, password, name }) => {
      if (!validateInvitationToken(token, { minLength: 8, maxLength: 256 })) {
        throw new Error('Invalid invitation token.');
      }
      if (typeof password !== 'string' || password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }

      const trimmedToken = token.trim();
      const invitationSnapshot = await findInvitationByToken(trimmedToken);

      if (!invitationSnapshot) {
        throw new Error('Invitation not found or already used.');
      }

      const invitation = formatInvitationDoc(invitationSnapshot);
      if (invitation.status !== 'pending') {
        throw new Error('This invitation has already been used or cancelled.');
      }

      if (invitation.expires_at && isInvitationExpired(invitation.expires_at)) {
        throw new Error('This invitation has expired. Please request a new one.');
      }

      const registrationName = name?.trim() || invitation.invitee_name || invitation.email;
      const newUser = await register(invitation.email, password);

      await createUserProfile(newUser.uid, {
        email: invitation.email,
        name: registrationName,
        role: USER_ROLES.ADMIN,
        status: 'approved',
        approved_at: serverTimestamp(),
        approved_by: invitation.invited_by || null,
      });

      await markInvitationAsAccepted(invitation.id, newUser.uid);

      try {
        await addApprovedAdminRecord({
          email: invitation.email,
          name: registrationName,
          approver: invitation.invited_by || null,
        });
      } catch (adminRecordError) {
        console.warn('Failed to update approved_admins record:', adminRecordError);
      }

      return newUser;
    },
    [addApprovedAdminRecord, createUserProfile, markInvitationAsAccepted, register],
  );

  const getPendingInvitations = useCallback(async () => {
    const pendingQuery = query(
      collection(db, INVITATIONS_COLLECTION),
      where('status', '==', 'pending'),
      orderBy('created_at', 'desc'),
    );
    const snapshot = await getDocs(pendingQuery);
    return snapshot.docs.map(formatInvitationDoc);
  }, []);

  const cancelInvitation = useCallback(async (invitationId, reason = '') => {
    if (!invitationId) {
      throw new Error('Invitation ID is required to cancel an invitation.');
    }

    const invitationRef = doc(db, INVITATIONS_COLLECTION, invitationId);
    const existing = await getDoc(invitationRef);
    if (!existing.exists()) {
      throw new Error('Invitation not found.');
    }

    await updateDoc(invitationRef, {
      status: 'cancelled',
      cancelled_at: serverTimestamp(),
      cancelled_by: currentUser?.email ?? null,
      cancellation_reason: reason,
    });
  }, [currentUser?.email]);

  return {
    invitations,
    pendingInvitations,
    loading,
    error,
    createAdminInvitation,
    getInvitationByToken,
    acceptInvitation,
    getPendingInvitations,
    cancelInvitation,
  };
}


