import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
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

      const profileRef = doc(db, 'users', uid);
      await updateDoc(profileRef, {
        role: normalizedRole,
        ...additionalUpdates,
        updated_at: serverTimestamp(),
      });
    },
    [],
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

  return {
    userProfile,
    profileLoading,
    profileError,
    createUserProfile,
    getUserProfile,
    updateUserRole,
    checkUserRole,
  };
}

