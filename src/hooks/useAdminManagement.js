import { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';

/**
 * Hook to manage admin applications and approved admins
 * Provides functions to apply for admin access, approve/deny applications, and check admin status
 * 
 * @returns {Object} Object containing admin data, loading states, and management functions
 */
// Super Admin Email - Only this user can manage admin applications
const SUPER_ADMIN_EMAIL = 'chinomonatinotenda19@gmail.com';

export function useAdminManagement() {
  const { currentUser } = useAuth();
  const [adminApplications, setAdminApplications] = useState([]);
  const [approvedAdmins, setApprovedAdmins] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if current user is super admin and/or approved admin
  useEffect(() => {
    if (!currentUser?.email) {
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setLoading(false);
      return;
    }

    const checkAdminStatus = async () => {
      try {
        // Check if user is super admin
        const isSuper = currentUser.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
        setIsSuperAdmin(isSuper);
        
        // Check if user is an approved admin
        const adminDocRef = doc(db, 'approved_admins', currentUser.email);
        const adminDoc = await getDoc(adminDocRef);
        
        if (adminDoc.exists() && adminDoc.data().status === 'approved') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error checking admin status:', err);
        setError(err.message || 'Failed to check admin status');
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [currentUser]);

  // Fetch admin applications with real-time listener (only super admin can see these)
  useEffect(() => {
    if (!isSuperAdmin) {
      setAdminApplications([]);
      return;
    }

    try {
      const q = query(
        collection(db, 'admin_applications'),
        orderBy('created_at', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const applications = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            created_at: doc.data().created_at?.toDate
              ? doc.data().created_at.toDate()
              : doc.data().created_at,
          }));
          setAdminApplications(applications);
          setError(null);
        },
        (err) => {
          console.error('Error fetching admin applications:', err);
          setError(err.message || 'Failed to fetch admin applications');
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up admin applications listener:', err);
      setError(err.message || 'Failed to set up admin applications listener');
    }
  }, [isSuperAdmin]);

  // Fetch approved admins with real-time listener (only super admin can see these)
  useEffect(() => {
    if (!isSuperAdmin) {
      setApprovedAdmins([]);
      return;
    }

    try {
      const q = query(
        collection(db, 'approved_admins'),
        orderBy('approved_at', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const admins = snapshot.docs.map((doc) => ({
            id: doc.id,
            email: doc.id, // Email is the document ID
            ...doc.data(),
            approved_at: doc.data().approved_at?.toDate
              ? doc.data().approved_at.toDate()
              : doc.data().approved_at,
          }));
          setApprovedAdmins(admins);
          setError(null);
        },
        (err) => {
          console.error('Error fetching approved admins:', err);
          setError(err.message || 'Failed to fetch approved admins');
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up approved admins listener:', err);
      setError(err.message || 'Failed to set up approved admins listener');
    }
  }, [isSuperAdmin]);

  /**
   * Apply for admin access
   * @param {string} name - Applicant's name
   * @param {string} reason - Reason for requesting admin access
   * @returns {Promise<string>} Application ID
   */
  const applyForAdminAccess = async (name, reason) => {
    if (!currentUser?.email) {
      throw new Error('You must be logged in to apply for admin access');
    }

    try {
      // Check if user already has an application
      const existingApps = adminApplications.filter(
        (app) => app.email === currentUser.email && app.status === 'pending'
      );
      
      if (existingApps.length > 0) {
        throw new Error('You already have a pending admin application');
      }

      // Check if user is already an admin
      if (isAdmin) {
        throw new Error('You are already an approved admin');
      }

      const applicationData = {
        email: currentUser.email,
        name: name || currentUser.displayName || currentUser.email,
        reason,
        status: 'pending',
        created_at: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'admin_applications'), applicationData);
      return docRef.id;
    } catch (err) {
      console.error('Error applying for admin access:', err);
      throw err;
    }
  };

  /**
   * Approve an admin application
   * @param {string} applicationId - Application document ID
   * @returns {Promise<void>}
   */
  const approveAdminApplication = async (applicationId) => {
    if (!isSuperAdmin) {
      throw new Error('Only the super admin can approve applications');
    }

    try {
      const applicationRef = doc(db, 'admin_applications', applicationId);
      const applicationDoc = await getDoc(applicationRef);

      if (!applicationDoc.exists()) {
        throw new Error('Application not found');
      }

      const applicationData = applicationDoc.data();

      // Update application status
      await updateDoc(applicationRef, {
        status: 'approved',
        approved_by: currentUser.email,
        approved_at: serverTimestamp(),
      });

      // Add to approved_admins collection (using email as document ID)
      const adminData = {
        email: applicationData.email,
        name: applicationData.name,
        approved_by: currentUser.email,
        approved_at: serverTimestamp(),
        status: 'approved',
      };

      await setDoc(doc(db, 'approved_admins', applicationData.email), adminData, {
        merge: true,
      });
    } catch (err) {
      console.error('Error approving admin application:', err);
      throw err;
    }
  };

  /**
   * Deny an admin application
   * @param {string} applicationId - Application document ID
   * @param {string} reason - Optional reason for denial
   * @returns {Promise<void>}
   */
  const denyAdminApplication = async (applicationId, reason = '') => {
    if (!isSuperAdmin) {
      throw new Error('Only the super admin can deny applications');
    }

    try {
      const applicationRef = doc(db, 'admin_applications', applicationId);
      await updateDoc(applicationRef, {
        status: 'denied',
        denied_by: currentUser.email,
        denied_at: serverTimestamp(),
        denial_reason: reason,
      });
    } catch (err) {
      console.error('Error denying admin application:', err);
      throw err;
    }
  };

  /**
   * Remove an admin (revoke admin access)
   * @param {string} email - Admin email to remove
   * @returns {Promise<void>}
   */
  const removeAdmin = async (email) => {
    if (!isSuperAdmin) {
      throw new Error('Only the super admin can remove admins');
    }

    if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      throw new Error('Super admin cannot be removed');
    }

    try {
      const adminRef = doc(db, 'approved_admins', email);
      await updateDoc(adminRef, {
        status: 'revoked',
        revoked_by: currentUser.email,
        revoked_at: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error removing admin:', err);
      throw err;
    }
  };

  /**
   * Get current user's admin application status
   * @returns {Object|null} Application object or null
   */
  const getMyApplication = () => {
    if (!currentUser?.email) return null;
    return adminApplications.find((app) => app.email === currentUser.email) || null;
  };

  return {
    // Data
    adminApplications,
    approvedAdmins,
    isAdmin,
    isSuperAdmin,
    
    // States
    loading,
    error,
    
    // Functions
    applyForAdminAccess,
    approveAdminApplication,
    denyAdminApplication,
    removeAdmin,
    getMyApplication,
  };
}

