import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Container, Section, SEO } from '../../components/common';
import { useSubmissions } from '../../hooks/useSubmissions';
import StatusBadge from '../../components/admin/StatusBadge';
import Button from '../../components/common/Button';
import {
  FiArrowLeft,
  FiMail,
  FiUser,
  FiCalendar,
  FiMessageSquare,
  FiFileText,
  FiPhone,
  FiBriefcase,
  FiCheckCircle,
  FiAlertCircle,
  FiLoader,
  FiSave
} from 'react-icons/fi';

export default function SubmissionDetail() {
  const { type, id } = useParams(); // type: 'contact' or 'membership', id: submission ID
  const navigate = useNavigate();
  const {
    contactSubmissions,
    membershipApplications,
    updateContactSubmissionStatus,
    updateMembershipApplicationStatus,
    getContactSubmission,
    getMembershipApplication,
  } = useSubmissions();

  const [submission, setSubmission] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState(null); // 'success', 'error', or null
  const [updateMessage, setUpdateMessage] = useState('');

  // Get the submission based on type
  useEffect(() => {
    if (type === 'contact') {
      const sub = getContactSubmission(id);
      if (sub) {
        setSubmission(sub);
        // Only update selectedStatus if it's different (to preserve user's selection)
        if (selectedStatus === '' || selectedStatus === sub.status) {
          setSelectedStatus(sub.status || 'new');
        }
      }
    } else if (type === 'membership') {
      const app = getMembershipApplication(id);
      if (app) {
        setSubmission(app);
        // Only update selectedStatus if it's different (to preserve user's selection)
        if (selectedStatus === '' || selectedStatus === app.status) {
          setSelectedStatus(app.status || 'pending');
        }
      }
    }
  }, [type, id, contactSubmissions, membershipApplications, getContactSubmission, getMembershipApplication]);

  const handleStatusUpdate = async () => {
    if (!submission) {
      console.error('No submission found');
      setUpdateStatus('error');
      setUpdateMessage('Submission not found. Please refresh the page.');
      return;
    }

    if (!selectedStatus) {
      console.error('No status selected');
      setUpdateStatus('error');
      setUpdateMessage('Please select a status.');
      return;
    }

    if (selectedStatus === submission.status) {
      console.log('Status unchanged, no update needed');
      return;
    }

    setIsUpdating(true);
    setUpdateStatus(null);
    setUpdateMessage('');

    try {
      console.log('Updating status:', { id, type, oldStatus: submission.status, newStatus: selectedStatus });
      
      if (type === 'contact') {
        await updateContactSubmissionStatus(id, selectedStatus);
      } else {
        await updateMembershipApplicationStatus(id, selectedStatus);
      }

      console.log('Status update successful');
      setUpdateStatus('success');
      setUpdateMessage('Status updated successfully!');
      
      // Update local state immediately for better UX
      setSubmission({ ...submission, status: selectedStatus });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setUpdateStatus(null);
        setUpdateMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error updating status:', error);
      setUpdateStatus('error');
      setUpdateMessage(error.message || 'Failed to update status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      const dateObj = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
      return format(dateObj, 'MMMM dd, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    try {
      const dateObj = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
      return format(dateObj, 'MMMM dd, yyyy \'at\' HH:mm');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Get available statuses based on type
  const getAvailableStatuses = () => {
    if (type === 'contact') {
      return [
        { value: 'new', label: 'New' },
        { value: 'in-progress', label: 'In Progress' },
        { value: 'resolved', label: 'Resolved' },
      ];
    } else {
      return [
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
      ];
    }
  };

  if (!submission) {
    return (
      <>
        <SEO
          title="Submission Not Found"
          description="The requested submission could not be found"
          noindex={true}
        />
        <Section bgColor="white" padding="xl">
          <Container>
            <div className="text-center py-12">
              <FiAlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Submission Not Found</h1>
              <p className="text-gray-600 mb-6">
                The submission you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => navigate('/admin')} variant="primary">
                <FiArrowLeft className="mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </Container>
        </Section>
      </>
    );
  }

  return (
    <>
      <SEO
        title={`${type === 'contact' ? 'Contact Submission' : 'Membership Application'} Details`}
        description={`View details for ${type === 'contact' ? 'contact submission' : 'membership application'}`}
        noindex={true}
      />

      {/* Header */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 py-8 md:py-12">
        <Container>
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Button
                onClick={() => navigate('/admin')}
                variant="ghost"
                className="mb-4 text-white hover:bg-white/20"
              >
                <FiArrowLeft className="mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center gap-3 mb-2">
                {type === 'contact' ? (
                  <FiMail className="w-8 h-8 text-white" />
                ) : (
                  <FiFileText className="w-8 h-8 text-white" />
                )}
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  {type === 'contact' ? 'Contact Submission' : 'Membership Application'}
                </h1>
              </div>
              <p className="text-white/90">
                Submitted on {formatDateTime(submission.created_at)}
              </p>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Main Content */}
      <Section bgColor="white" padding="xl">
        <Container>
          <div className="max-w-4xl mx-auto">
            {/* Status Update Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-lg border border-gray-200 p-6 mb-6"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Update Status</h2>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm text-gray-600 whitespace-nowrap">Current status:</span>
                    <StatusBadge status={submission.status} />
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    disabled={isUpdating}
                    className="px-4 py-2 min-w-[140px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed bg-white text-sm font-medium"
                  >
                    {getAvailableStatuses().map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                  <Button
                    onClick={handleStatusUpdate}
                    disabled={isUpdating || !submission || !selectedStatus || selectedStatus === submission.status}
                    variant="primary"
                  >
                    {isUpdating ? (
                      <>
                        <FiLoader className="animate-spin mr-2" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <FiSave className="mr-2" />
                        Update Status
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Update Status Messages */}
              {updateStatus === 'success' && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                  <FiCheckCircle className="text-green-600 text-xl flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-900">{updateMessage}</p>
                  </div>
                </div>
              )}

              {updateStatus === 'error' && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <FiAlertCircle className="text-red-600 text-xl flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900">{updateMessage}</p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Submission Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-white rounded-lg border border-gray-200 p-6 space-y-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Submission Details</h2>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FiUser className="inline mr-2" />
                    Name
                  </label>
                  <p className="text-gray-900">{submission.name || 'N/A'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FiMail className="inline mr-2" />
                    Email
                  </label>
                  <a
                    href={`mailto:${submission.email}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {submission.email || 'N/A'}
                  </a>
                </div>

                {type === 'membership' && submission.phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FiPhone className="inline mr-2" />
                      Phone
                    </label>
                    <a
                      href={`tel:${submission.phone}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {submission.phone}
                    </a>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FiCalendar className="inline mr-2" />
                    Submitted
                  </label>
                  <p className="text-gray-900">{formatDateTime(submission.created_at)}</p>
                </div>

                {type === 'membership' && submission.business_name && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FiBriefcase className="inline mr-2" />
                      Business Name
                    </label>
                    <p className="text-gray-900">{submission.business_name}</p>
                  </div>
                )}

                {type === 'membership' && submission.business_type && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Type
                    </label>
                    <p className="text-gray-900">{submission.business_type}</p>
                  </div>
                )}

                {type === 'contact' && submission.subject && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject
                    </label>
                    <p className="text-gray-900">{submission.subject}</p>
                  </div>
                )}
              </div>

              {/* Message */}
              {(submission.message || (type === 'contact' && submission.subject)) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiMessageSquare className="inline mr-2" />
                    {type === 'contact' ? 'Message' : 'Additional Information'}
                  </label>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {submission.message || 'No message provided'}
                    </p>
                  </div>
                </div>
              )}

              {/* Submission ID (for reference) */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Submission ID: <span className="font-mono">{submission.id}</span>
                </p>
              </div>
            </motion.div>
          </div>
        </Container>
      </Section>
    </>
  );
}

