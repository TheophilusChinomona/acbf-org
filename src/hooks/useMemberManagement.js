import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';
import { useUserManagement } from './useUserManagement';
import { USER_ROLES } from '../utils/userRoles';

async function enrichMemberWithApplication(memberDoc) {
  const memberData = memberDoc.data();
  const base = {
    id: memberDoc.id,
    ...memberData,
  };

  if (!memberData?.member_application_id) {
    return base;
  }

  try {
    const applicationRef = doc(db, 'membership_applications', memberData.member_application_id);
    const applicationSnapshot = await getDoc(applicationRef);
    if (applicationSnapshot.exists()) {
      return {
        ...base,
        application: {
          id: applicationSnapshot.id,
          ...applicationSnapshot.data(),
        },
      };
    }
  } catch (error) {
    console.error('Failed to fetch linked membership application:', error);
  }

  return base;
}

export function useMemberManagement({ listenToPendingMembers = false } = {}) {
  const { currentUser } = useAuth();
  const {
    userProfile,
    profileLoading,
    profileError,
    getUserProfile,
  } = useUserManagement();

  const [pendingMembers, setPendingMembers] = useState([]);
  const [pendingMembersLoading, setPendingMembersLoading] = useState(listenToPendingMembers);
  const [pendingMembersError, setPendingMembersError] = useState(null);

  useEffect(() => {
    if (!listenToPendingMembers) {
      setPendingMembers([]);
      setPendingMembersLoading(false);
      return undefined;
    }

    setPendingMembersLoading(true);
    setPendingMembersError(null);

    const membersQuery = query(
      collection(db, 'users'),
      where('role', '==', USER_ROLES.MEMBER),
      where('status', '==', 'pending'),
    );

    const unsubscribe = onSnapshot(
      membersQuery,
      async (snapshot) => {
        try {
          const enriched = await Promise.all(snapshot.docs.map(enrichMemberWithApplication));
          setPendingMembers(enriched);
          setPendingMembersError(null);
        } catch (error) {
          console.error('Error processing pending members snapshot:', error);
          setPendingMembersError(error.message || 'Failed to load pending members');
        } finally {
          setPendingMembersLoading(false);
        }
      },
      (error) => {
        console.error('Error listening to pending members:', error);
        setPendingMembersError(error.message || 'Failed to listen to pending members');
        setPendingMembersLoading(false);
      },
    );

    return () => unsubscribe();
  }, [listenToPendingMembers]);

  const getMemberStatus = useCallback(async (uid = currentUser?.uid) => {
    if (!uid) {
      throw new Error('User ID is required to check member status');
    }

    const profile = await getUserProfile(uid);
    if (!profile) {
      return null;
    }

    return {
      id: uid,
      status: profile.status ?? null,
      role: profile.role ?? null,
      profile,
    };
  }, [currentUser?.uid, getUserProfile]);

  const getPendingMembers = useCallback(async () => {
    const membersQuery = query(
      collection(db, 'users'),
      where('role', '==', USER_ROLES.MEMBER),
      where('status', '==', 'pending'),
    );

    const snapshot = await getDocs(membersQuery);
    return Promise.all(snapshot.docs.map(enrichMemberWithApplication));
  }, []);

  const approveMember = useCallback(async (memberId, options = {}) => {
    if (!memberId) {
      throw new Error('Member ID is required to approve a member');
    }

    const approverEmail = currentUser?.email || null;
    const profileRef = doc(db, 'users', memberId);
    const profileSnapshot = await getDoc(profileRef);

    if (!profileSnapshot.exists()) {
      throw new Error('Member profile not found');
    }

    const profileData = profileSnapshot.data();

    await updateDoc(profileRef, {
      status: 'approved',
      approved_at: serverTimestamp(),
      approved_by: approverEmail,
      rejection_reason: null,
      rejected_at: null,
      rejected_by: null,
      ...options.additionalProfileUpdates,
    });

    if (profileData.member_application_id) {
      const applicationRef = doc(db, 'membership_applications', profileData.member_application_id);
      try {
        await updateDoc(applicationRef, {
          status: 'approved',
          approved_at: serverTimestamp(),
          approved_by: approverEmail,
        });
      } catch (error) {
        console.error('Failed to update membership application on approval:', error);
      }
    }
  }, [currentUser?.email]);

  const rejectMember = useCallback(async (memberId, reason = 'Not specified', options = {}) => {
    if (!memberId) {
      throw new Error('Member ID is required to reject a member');
    }

    const rejectingAdmin = currentUser?.email || null;
    const profileRef = doc(db, 'users', memberId);
    const profileSnapshot = await getDoc(profileRef);

    if (!profileSnapshot.exists()) {
      throw new Error('Member profile not found');
    }

    const profileData = profileSnapshot.data();

    await updateDoc(profileRef, {
      status: 'rejected',
      rejected_at: serverTimestamp(),
      rejected_by: rejectingAdmin,
      rejection_reason: reason,
      approved_at: null,
      approved_by: null,
      ...options.additionalProfileUpdates,
    });

    if (profileData.member_application_id) {
      const applicationRef = doc(db, 'membership_applications', profileData.member_application_id);
      try {
        await updateDoc(applicationRef, {
          status: 'rejected',
          rejected_at: serverTimestamp(),
          rejected_by: rejectingAdmin,
          rejection_reason: reason,
        });
      } catch (error) {
        console.error('Failed to update membership application on rejection:', error);
      }
    }
  }, [currentUser?.email]);

  const memberStatus = useMemo(() => {
    if (!userProfile) {
      return null;
    }
    return userProfile.status ?? null;
  }, [userProfile]);

  return {
    currentMember: userProfile,
    memberStatus,
    memberProfileLoading: profileLoading,
    memberProfileError: profileError,
    pendingMembers,
    pendingMembersLoading,
    pendingMembersError,
    getMemberStatus,
    getPendingMembers,
    approveMember,
    rejectMember,
  };
}

