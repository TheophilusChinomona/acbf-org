import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  query,
  orderBy,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';
import {
  USER_ROLES,
  normalizeRole,
  hasAtLeastRole,
} from '../utils/userRoles';

function formatProfileSnapshot(snapshot) {
  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

export function useUserManagement(targetUserId = null) {
  const { currentUser } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);

  const activeUserId = useMemo(
    () => targetUserId ?? currentUser?.uid ?? null,
    [currentUser?.uid, targetUserId],
  );

  useEffect(() => {
    setProfileError(null);
    if (!activeUserId) {
      setUserProfile(null);
      setProfileLoading(false);
      return undefined;
    }

    setProfileLoading(true);
    const profileRef = doc(db, 'users', activeUserId);

    const unsubscribe = onSnapshot(
      profileRef,
      (snapshot) => {
        setUserProfile(formatProfileSnapshot(snapshot));
        setProfileLoading(false);
      },
      (error) => {
        console.error('Error listening to user profile:', error);
        setProfileError(error.message || 'Failed to load user profile');
        setProfileLoading(false);
        setUserProfile(null);
      },
    );

    return () => unsubscribe();
  }, [activeUserId]);

  const createUserProfile = useCallback(
    async (uid, profileData = {}) => {
      if (!uid) {
        throw new Error('User ID is required to create a profile');
      }

      const profileRef = doc(db, 'users', uid);
      const existingProfile = await getDoc(profileRef);

      if (existingProfile.exists()) {
        throw new Error('User profile already exists');
      }

      const role = normalizeRole(profileData.role) ?? USER_ROLES.MEMBER;

      await setDoc(profileRef, {
        ...profileData,
        role,
        status: profileData.status ?? 'pending',
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
    },
    [],
  );

  const getUserProfile = useCallback(
    async (uid = activeUserId) => {
      if (!uid) {
        throw new Error('User ID is required to fetch a profile');
      }

      const profileRef = doc(db, 'users', uid);
      const snapshot = await getDoc(profileRef);
      return formatProfileSnapshot(snapshot);
    },
    [activeUserId],
  );

  const updateUserRole = useCallback(
    async (uid, role, additionalUpdates = {}) => {
      if (!uid) {
        throw new Error('User ID is required to update a role');
      }

      const normalizedRole = normalizeRole(role);
      if (!normalizedRole) {
        throw new Error('A valid role is required');
      }

      // Get user profile to retrieve email
      const userProfile = await getUserProfile(uid);
      if (!userProfile || !userProfile.email) {
        throw new Error('User profile or email not found');
      }

      // Update user role in users collection
      const profileRef = doc(db, 'users', uid);
      await updateDoc(profileRef, {
        role: normalizedRole,
        ...additionalUpdates,
        updated_at: serverTimestamp(),
      });

      // Sync with approved_admins collection
      const adminDocRef = doc(db, 'approved_admins', userProfile.email);

      if (normalizedRole === USER_ROLES.ADMIN || normalizedRole === USER_ROLES.SUPER_ADMIN) {
        // User is being promoted to admin - add to approved_admins collection
        await setDoc(adminDocRef, {
          email: userProfile.email,
          name: userProfile.name || userProfile.email,
          role: normalizedRole,
          approved_by: currentUser?.email || 'system',
          approved_at: serverTimestamp(),
          status: 'approved',
        }, { merge: true });
      } else {
        // User is being demoted from admin - update status in approved_admins
        const adminDoc = await getDoc(adminDocRef);
        if (adminDoc.exists()) {
          await updateDoc(adminDocRef, {
            status: 'revoked',
            revoked_by: currentUser?.email || 'system',
            revoked_at: serverTimestamp(),
          });
        }
      }
    },
    [currentUser?.email, getUserProfile],
  );

  const checkUserRole = useCallback(
    async (uid = activeUserId, requiredRole) => {
      if (!uid) {
        throw new Error('User ID is required to check a role');
      }

      if (!requiredRole) {
        throw new Error('Required role must be specified');
      }

      const profile = await getUserProfile(uid);
      if (!profile?.role) {
        return false;
      }

      return hasAtLeastRole(profile.role, requiredRole);
    },
    [activeUserId, getUserProfile],
  );

  const updateUserStatus = useCallback(
    async (uid, status, additionalUpdates = {}) => {
      if (!uid) {
        throw new Error('User ID is required to update status');
      }

      const validStatuses = ['pending', 'approved', 'rejected'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      const profileRef = doc(db, 'users', uid);
      const updateData = {
        status,
        ...additionalUpdates,
        updated_at: serverTimestamp(),
      };

      // Add timestamp based on status
      if (status === 'approved') {
        updateData.approved_at = serverTimestamp();
        updateData.approved_by = currentUser?.email || 'system';
      } else if (status === 'rejected') {
        updateData.rejected_at = serverTimestamp();
        updateData.rejected_by = currentUser?.email || 'system';
      }

      await updateDoc(profileRef, updateData);
    },
    [currentUser?.email],
  );

  const deleteUser = useCallback(
    async (uid) => {
      if (!uid) {
        throw new Error('User ID is required to delete user');
      }

      // Prevent deleting yourself
      if (uid === currentUser?.uid) {
        throw new Error('You cannot delete your own account');
      }

      const userRef = doc(db, 'users', uid);

      // Get user email to potentially remove from approved_admins
      const userProfile = await getUserProfile(uid);

      // Delete user
      await deleteDoc(userRef);

      // If user was an admin, also remove from approved_admins collection
      if (userProfile?.email) {
        const adminDocRef = doc(db, 'approved_admins', userProfile.email);
        const adminDoc = await getDoc(adminDocRef);
        if (adminDoc.exists()) {
          await deleteDoc(adminDocRef);
        }
      }
    },
    [currentUser?.uid, getUserProfile],
  );

  return {
    userProfile,
    profileLoading,
    profileError,
    createUserProfile,
    getUserProfile,
    updateUserRole,
    checkUserRole,
    updateUserStatus,
    deleteUser,
  };
}

/**
 * Hook to fetch all users (Super Admin only)
 * @returns {Object} Object containing all users, loading state, and error
 */
export function useAllUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const q = query(
        collection(db, 'users'),
        orderBy('created_at', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const usersList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            // Convert Firestore Timestamp to Date if it exists
            created_at: doc.data().created_at?.toDate
              ? doc.data().created_at.toDate()
              : doc.data().created_at,
            approved_at: doc.data().approved_at?.toDate
              ? doc.data().approved_at.toDate()
              : doc.data().approved_at,
            rejected_at: doc.data().rejected_at?.toDate
              ? doc.data().rejected_at.toDate()
              : doc.data().rejected_at,
            updated_at: doc.data().updated_at?.toDate
              ? doc.data().updated_at.toDate()
              : doc.data().updated_at,
          }));
          setUsers(usersList);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Error fetching users:', err);
          setError(err.message || 'Failed to fetch users');
          setLoading(false);
        }
      );

      // Cleanup listener on unmount
      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up user listener:', err);
      setError(err.message || 'Failed to setup user listener');
      setLoading(false);
    }
  }, []);

  return {
    users,
    loading,
    error,
  };
}

