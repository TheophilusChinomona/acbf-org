import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Hook to fetch and manage contact submissions and membership applications
 * Provides real-time updates, loading states, and error handling
 * 
 * @returns {Object} Object containing submissions data, loading states, and update functions
 */
export function useSubmissions() {
  const [contactSubmissions, setContactSubmissions] = useState([]);
  const [membershipApplications, setMembershipApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contactSubmissionsLoaded, setContactSubmissionsLoaded] = useState(false);
  const [membershipApplicationsLoaded, setMembershipApplicationsLoaded] = useState(false);

  // Update loading state when both collections are loaded
  useEffect(() => {
    if (contactSubmissionsLoaded && membershipApplicationsLoaded) {
      setLoading(false);
    }
  }, [contactSubmissionsLoaded, membershipApplicationsLoaded]);

  // Fetch contact submissions with real-time listener
  useEffect(() => {
    try {
      const q = query(
        collection(db, 'contact_submissions'),
        orderBy('created_at', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const submissions = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            // Convert Firestore Timestamp to Date if it exists
            created_at: doc.data().created_at?.toDate 
              ? doc.data().created_at.toDate() 
              : doc.data().created_at,
          }));
          setContactSubmissions(submissions);
          setContactSubmissionsLoaded(true);
          setError(null);
        },
        (err) => {
          console.error('Error fetching contact submissions:', err);
          setError(err.message || 'Failed to fetch contact submissions');
          setContactSubmissionsLoaded(true);
        }
      );

      // Cleanup listener on unmount
      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up contact submissions listener:', err);
      setError(err.message || 'Failed to set up contact submissions listener');
      setContactSubmissionsLoaded(true);
    }
  }, []);

  // Fetch membership applications with real-time listener
  useEffect(() => {
    try {
      const q = query(
        collection(db, 'membership_applications'),
        orderBy('created_at', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const applications = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            // Convert Firestore Timestamp to Date if it exists
            created_at: doc.data().created_at?.toDate 
              ? doc.data().created_at.toDate() 
              : doc.data().created_at,
          }));
          setMembershipApplications(applications);
          setMembershipApplicationsLoaded(true);
          setError(null);
        },
        (err) => {
          console.error('Error fetching membership applications:', err);
          setError(err.message || 'Failed to fetch membership applications');
          setMembershipApplicationsLoaded(true);
        }
      );

      // Cleanup listener on unmount
      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up membership applications listener:', err);
      setError(err.message || 'Failed to set up membership applications listener');
      setMembershipApplicationsLoaded(true);
    }
  }, []);

  /**
   * Update the status of a contact submission
   * @param {string} submissionId - Document ID of the submission
   * @param {string} newStatus - New status value ('new', 'in-progress', 'resolved')
   * @returns {Promise<void>}
   */
  const updateContactSubmissionStatus = async (submissionId, newStatus) => {
    try {
      const validStatuses = ['new', 'in-progress', 'resolved'];
      if (!validStatuses.includes(newStatus)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      const submissionRef = doc(db, 'contact_submissions', submissionId);
      await updateDoc(submissionRef, {
        status: newStatus,
      });
    } catch (err) {
      console.error('Error updating contact submission status:', err);
      throw err;
    }
  };

  /**
   * Update the status of a membership application
   * @param {string} applicationId - Document ID of the application
   * @param {string} newStatus - New status value ('pending', 'approved', 'rejected')
   * @returns {Promise<void>}
   */
  const updateMembershipApplicationStatus = async (applicationId, newStatus) => {
    try {
      const validStatuses = ['pending', 'approved', 'rejected'];
      if (!validStatuses.includes(newStatus)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      const applicationRef = doc(db, 'membership_applications', applicationId);
      await updateDoc(applicationRef, {
        status: newStatus,
      });
    } catch (err) {
      console.error('Error updating membership application status:', err);
      throw err;
    }
  };

  /**
   * Get a single contact submission by ID
   * @param {string} submissionId - Document ID
   * @returns {Object|null} Submission object or null if not found
   */
  const getContactSubmission = (submissionId) => {
    return contactSubmissions.find((sub) => sub.id === submissionId) || null;
  };

  /**
   * Get a single membership application by ID
   * @param {string} applicationId - Document ID
   * @returns {Object|null} Application object or null if not found
   */
  const getMembershipApplication = (applicationId) => {
    return membershipApplications.find((app) => app.id === applicationId) || null;
  };

  /**
   * Archive a contact submission
   * @param {string} submissionId - Document ID of the submission
   * @returns {Promise<void>}
   */
  const archiveContactSubmission = async (submissionId) => {
    try {
      const submissionRef = doc(db, 'contact_submissions', submissionId);
      await updateDoc(submissionRef, {
        archived: true,
        archived_at: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error archiving contact submission:', err);
      throw err;
    }
  };

  /**
   * Unarchive a contact submission
   * @param {string} submissionId - Document ID of the submission
   * @returns {Promise<void>}
   */
  const unarchiveContactSubmission = async (submissionId) => {
    try {
      const submissionRef = doc(db, 'contact_submissions', submissionId);
      await updateDoc(submissionRef, {
        archived: false,
        archived_at: null,
      });
    } catch (err) {
      console.error('Error unarchiving contact submission:', err);
      throw err;
    }
  };

  /**
   * Archive a membership application
   * @param {string} applicationId - Document ID of the application
   * @returns {Promise<void>}
   */
  const archiveMembershipApplication = async (applicationId) => {
    try {
      const applicationRef = doc(db, 'membership_applications', applicationId);
      await updateDoc(applicationRef, {
        archived: true,
        archived_at: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error archiving membership application:', err);
      throw err;
    }
  };

  /**
   * Unarchive a membership application
   * @param {string} applicationId - Document ID of the application
   * @returns {Promise<void>}
   */
  const unarchiveMembershipApplication = async (applicationId) => {
    try {
      const applicationRef = doc(db, 'membership_applications', applicationId);
      await updateDoc(applicationRef, {
        archived: false,
        archived_at: null,
      });
    } catch (err) {
      console.error('Error unarchiving membership application:', err);
      throw err;
    }
  };

  return {
    // Data
    contactSubmissions,
    membershipApplications,
    
    // States
    loading,
    error,
    
    // Functions
    updateContactSubmissionStatus,
    updateMembershipApplicationStatus,
    getContactSubmission,
    getMembershipApplication,
    archiveContactSubmission,
    unarchiveContactSubmission,
    archiveMembershipApplication,
    unarchiveMembershipApplication,
  };
}

/**
 * Hook to fetch only contact submissions
 * @returns {Object} Object containing contact submissions, loading, and error states
 */
export function useContactSubmissions() {
  const { contactSubmissions, loading, error, updateContactSubmissionStatus, getContactSubmission } = useSubmissions();
  
  return {
    contactSubmissions,
    loading,
    error,
    updateStatus: updateContactSubmissionStatus,
    getSubmission: getContactSubmission,
  };
}

/**
 * Hook to fetch only membership applications
 * @returns {Object} Object containing membership applications, loading, and error states
 */
export function useMembershipApplications() {
  const { membershipApplications, loading, error, updateMembershipApplicationStatus, getMembershipApplication } = useSubmissions();
  
  return {
    membershipApplications,
    loading,
    error,
    updateStatus: updateMembershipApplicationStatus,
    getApplication: getMembershipApplication,
  };
}

