import { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
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
  const [awardsNominations, setAwardsNominations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contactSubmissionsLoaded, setContactSubmissionsLoaded] = useState(false);
  const [membershipApplicationsLoaded, setMembershipApplicationsLoaded] = useState(false);
  const [awardsNominationsLoaded, setAwardsNominationsLoaded] = useState(false);

  // Update loading state when all collections are loaded
  useEffect(() => {
    if (contactSubmissionsLoaded && membershipApplicationsLoaded && awardsNominationsLoaded) {
      setLoading(false);
    }
  }, [contactSubmissionsLoaded, membershipApplicationsLoaded, awardsNominationsLoaded]);

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

  // Fetch awards nominations with real-time listener
  useEffect(() => {
    try {
      const q = query(
        collection(db, 'awards_nominations'),
        orderBy('submittedAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const nominations = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            // Convert Firestore Timestamp to Date if it exists
            submittedAt: doc.data().submittedAt?.toDate
              ? doc.data().submittedAt.toDate()
              : doc.data().submittedAt,
            archived_at: doc.data().archived_at?.toDate
              ? doc.data().archived_at.toDate()
              : doc.data().archived_at,
          }));
          setAwardsNominations(nominations);
          setAwardsNominationsLoaded(true);
          setError(null);
        },
        (err) => {
          console.error('Error fetching awards nominations:', err);
          setError(err.message || 'Failed to fetch awards nominations');
          setAwardsNominationsLoaded(true);
        }
      );

      // Cleanup listener on unmount
      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up awards nominations listener:', err);
      setError(err.message || 'Failed to set up awards nominations listener');
      setAwardsNominationsLoaded(true);
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

  /**
   * Update the status of an awards nomination
   * @param {string} nominationId - Document ID of the nomination
   * @param {string} newStatus - New status value ('pending', 'approved', 'rejected')
   * @returns {Promise<void>}
   */
  const updateAwardsNominationStatus = async (nominationId, newStatus) => {
    try {
      const validStatuses = ['pending', 'approved', 'rejected'];
      if (!validStatuses.includes(newStatus)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      const nominationRef = doc(db, 'awards_nominations', nominationId);
      await updateDoc(nominationRef, {
        status: newStatus,
      });
    } catch (err) {
      console.error('Error updating awards nomination status:', err);
      throw err;
    }
  };

  /**
   * Get a single awards nomination by ID
   * @param {string} nominationId - Document ID
   * @returns {Object|null} Nomination object or null if not found
   */
  const getAwardsNomination = (nominationId) => {
    return awardsNominations.find((nom) => nom.id === nominationId) || null;
  };

  /**
   * Archive an awards nomination
   * @param {string} nominationId - Document ID of the nomination
   * @returns {Promise<void>}
   */
  const archiveAwardsNomination = async (nominationId) => {
    try {
      const nominationRef = doc(db, 'awards_nominations', nominationId);
      await updateDoc(nominationRef, {
        archived: true,
        archived_at: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error archiving awards nomination:', err);
      throw err;
    }
  };

  /**
   * Unarchive an awards nomination
   * @param {string} nominationId - Document ID of the nomination
   * @returns {Promise<void>}
   */
  const unarchiveAwardsNomination = async (nominationId) => {
    try {
      const nominationRef = doc(db, 'awards_nominations', nominationId);
      await updateDoc(nominationRef, {
        archived: false,
        archived_at: null,
      });
    } catch (err) {
      console.error('Error unarchiving awards nomination:', err);
      throw err;
    }
  };

  /**
   * Delete a contact submission
   * @param {string} submissionId - Document ID of the contact submission
   * @returns {Promise<void>}
   */
  const deleteContactSubmission = async (submissionId) => {
    try {
      const submissionRef = doc(db, 'contact_submissions', submissionId);
      await deleteDoc(submissionRef);
    } catch (err) {
      console.error('Error deleting contact submission:', err);
      throw err;
    }
  };

  /**
   * Delete a membership application
   * @param {string} applicationId - Document ID of the membership application
   * @returns {Promise<void>}
   */
  const deleteMembershipApplication = async (applicationId) => {
    try {
      const applicationRef = doc(db, 'membership_applications', applicationId);
      await deleteDoc(applicationRef);
    } catch (err) {
      console.error('Error deleting membership application:', err);
      throw err;
    }
  };

  /**
   * Delete an awards nomination
   * @param {string} nominationId - Document ID of the awards nomination
   * @returns {Promise<void>}
   */
  const deleteAwardsNomination = async (nominationId) => {
    try {
      const nominationRef = doc(db, 'awards_nominations', nominationId);
      await deleteDoc(nominationRef);
    } catch (err) {
      console.error('Error deleting awards nomination:', err);
      throw err;
    }
  };

  /**
   * Batch delete contact submissions
   * @param {string[]} submissionIds - Array of document IDs to delete
   * @returns {Promise<{success: number, failed: number, errors: Array}>}
   */
  const batchDeleteContactSubmissions = async (submissionIds) => {
    const results = { success: 0, failed: 0, errors: [] };

    for (const id of submissionIds) {
      try {
        await deleteContactSubmission(id);
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push({ id, error: err.message });
      }
    }

    return results;
  };

  /**
   * Batch delete membership applications
   * @param {string[]} applicationIds - Array of document IDs to delete
   * @returns {Promise<{success: number, failed: number, errors: Array}>}
   */
  const batchDeleteMembershipApplications = async (applicationIds) => {
    const results = { success: 0, failed: 0, errors: [] };

    for (const id of applicationIds) {
      try {
        await deleteMembershipApplication(id);
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push({ id, error: err.message });
      }
    }

    return results;
  };

  /**
   * Batch delete awards nominations
   * @param {string[]} nominationIds - Array of document IDs to delete
   * @returns {Promise<{success: number, failed: number, errors: Array}>}
   */
  const batchDeleteAwardsNominations = async (nominationIds) => {
    const results = { success: 0, failed: 0, errors: [] };

    for (const id of nominationIds) {
      try {
        await deleteAwardsNomination(id);
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push({ id, error: err.message });
      }
    }

    return results;
  };

  return {
    // Data
    contactSubmissions,
    membershipApplications,
    awardsNominations,

    // States
    loading,
    error,

    // Functions
    updateContactSubmissionStatus,
    updateMembershipApplicationStatus,
    updateAwardsNominationStatus,
    getContactSubmission,
    getMembershipApplication,
    getAwardsNomination,
    archiveContactSubmission,
    unarchiveContactSubmission,
    archiveMembershipApplication,
    unarchiveMembershipApplication,
    archiveAwardsNomination,
    unarchiveAwardsNomination,
    deleteContactSubmission,
    deleteMembershipApplication,
    deleteAwardsNomination,
    batchDeleteContactSubmissions,
    batchDeleteMembershipApplications,
    batchDeleteAwardsNominations,
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

