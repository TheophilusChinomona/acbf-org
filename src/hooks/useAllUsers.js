import { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';
import { useUserManagement } from './useUserManagement';

/**
 * Hook to fetch all users for super admin
 * Only super admins can see all users
 *
 * @returns {Object} Object containing all users and loading states
 */
export function useAllUsers() {
  const { currentUser } = useAuth();
  const { userProfile } = useUserManagement();
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isSuperAdmin = userProfile?.role === 'super_admin';

  useEffect(() => {
    if (!currentUser || !isSuperAdmin) {
      setAllUsers([]);
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, 'users'),
        orderBy('created_at', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const users = snapshot.docs.map((doc) => ({
            uid: doc.id,
            ...doc.data(),
            created_at: doc.data().created_at?.toDate
              ? doc.data().created_at.toDate()
              : doc.data().created_at,
            updated_at: doc.data().updated_at?.toDate
              ? doc.data().updated_at.toDate()
              : doc.data().updated_at,
          }));
          setAllUsers(users);
          setError(null);
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching all users:', err);
          setError(err.message || 'Failed to fetch users');
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up users listener:', err);
      setError(err.message || 'Failed to set up users listener');
      setLoading(false);
    }
  }, [currentUser, isSuperAdmin]);

  return {
    allUsers,
    loading,
    error,
  };
}
