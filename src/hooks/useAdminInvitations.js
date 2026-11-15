import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { API_PATHS, postBackendApi } from '../lib/backendApi';
import { useAuth } from './useAuth';
import {
  generateInvitationToken,
  validateInvitationToken,
  getInvitationExpiryDate,
  isInvitationExpired,
  INVITATION_TOKEN_DEFAULTS,
} from '../utils/invitationToken';

const INVITATIONS_COLLECTION = 'admin_invitations';

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

export function useAdminInvitations({ listen = false } = {}) {
  const { currentUser } = useAuth();

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

    // Same-origin API: `admin_invitations` is not readable from the client.
    const response = await postBackendApi(API_PATHS.lookupInvitation, {
      token: rawToken.trim(),
    });
    const invitation = response?.data?.invitation ?? null;
    if (!invitation) {
      return null;
    }

    return {
      ...invitation,
      created_at: mapTimestamp(invitation.created_at),
      expires_at: mapTimestamp(invitation.expires_at),
    };
  }, []);

  const acceptInvitation = useCallback(async ({ token, password, name }) => {
    if (!validateInvitationToken(token, { minLength: 8, maxLength: 256 })) {
      throw new Error('Invalid invitation token.');
    }
    if (typeof password !== 'string' || password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const response = await postBackendApi(API_PATHS.acceptInvitation, {
      token: token.trim(),
      password,
      name,
    });
    const email = response?.data?.email;

    if (!email) {
      throw new Error('The invitation could not be completed. Please request a new invite.');
    }

    // The account and admin records are created server-side; signing in here
    // establishes the session the rest of the app expects.
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
  }, []);


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


