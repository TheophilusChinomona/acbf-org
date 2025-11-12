import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Container, Section, SEO } from '../../components/common';
import { useAdminManagement } from '../../hooks/useAdminManagement';
import {
  FiUsers,
  FiCheckCircle,
  FiXCircle,
  FiMail,
  FiCalendar,
  FiUser,
  FiLoader,
  FiShield,
  FiTrash2,
  FiArrowLeft,
} from 'react-icons/fi';
import StatusBadge from '../../components/admin/StatusBadge';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button';

export default function AdminManagement() {
  const navigate = useNavigate();
  const {
    adminApplications,
    approvedAdmins,
    isAdmin,
    isSuperAdmin,
    loading,
    error,
    approveAdminApplication,
    denyAdminApplication,
    removeAdmin,
  } = useAdminManagement();

  const [activeTab, setActiveTab] = useState('applications'); // 'applications' or 'admins'
  const [processingId, setProcessingId] = useState(null);
  const [selectedApplicationIds, setSelectedApplicationIds] = useState(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      const dateObj = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
      return format(dateObj, 'MMM dd, yyyy HH:mm');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const handleApprove = async (applicationId) => {
    try {
      setProcessingId(applicationId);
      await approveAdminApplication(applicationId);
      toast.success('Admin application approved successfully!');
    } catch (error) {
      console.error('Error approving application:', error);
      toast.error(error.message || 'Failed to approve application');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeny = async (applicationId) => {
    const reason = window.prompt('Please provide a reason for denial (optional):');
    if (reason === null) return; // User cancelled

    try {
      setProcessingId(applicationId);
      await denyAdminApplication(applicationId, reason || '');
      toast.success('Admin application denied');
    } catch (error) {
      console.error('Error denying application:', error);
      toast.error(error.message || 'Failed to deny application');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRemoveAdmin = async (email, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name || email} as an admin?`)) {
      return;
    }

    try {
      setProcessingId(email);
      await removeAdmin(email);
      toast.success('Admin access revoked successfully');
    } catch (error) {
      console.error('Error removing admin:', error);
      toast.error(error.message || 'Failed to remove admin');
    } finally {
      setProcessingId(null);
    }
  };

  // Bulk action handlers
  const handleToggleSelection = (applicationId) => {
    setSelectedApplicationIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(applicationId)) {
        newSet.delete(applicationId);
      } else {
        newSet.add(applicationId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (pendingApps) => {
    if (selectedApplicationIds.size === pendingApps.length) {
      setSelectedApplicationIds(new Set());
    } else {
      setSelectedApplicationIds(new Set(pendingApps.map((app) => app.id)));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedApplicationIds.size === 0) return;

    const ids = Array.from(selectedApplicationIds);
    setIsBulkProcessing(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const id of ids) {
        try {
          await approveAdminApplication(id);
          successCount++;
        } catch (error) {
          console.error(`Error approving application ${id}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully approved ${successCount} application${successCount !== 1 ? 's' : ''}`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to approve ${errorCount} application${errorCount !== 1 ? 's' : ''}`);
      }

      setSelectedApplicationIds(new Set());
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkDeny = async () => {
    if (selectedApplicationIds.size === 0) return;

    const reason = window.prompt('Please provide a reason for denial (optional):');
    if (reason === null) return; // User cancelled

    const ids = Array.from(selectedApplicationIds);
    setIsBulkProcessing(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const id of ids) {
        try {
          await denyAdminApplication(id, reason || '');
          successCount++;
        } catch (error) {
          console.error(`Error denying application ${id}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully denied ${successCount} application${successCount !== 1 ? 's' : ''}`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to deny ${errorCount} application${errorCount !== 1 ? 's' : ''}`);
      }

      setSelectedApplicationIds(new Set());
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Clear selection when switching tabs
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedApplicationIds(new Set());
  };

  if (!isSuperAdmin) {
    return (
      <>
        <SEO
          title="Admin Management - Access Denied"
          description="Admin management page"
          noindex={true}
        />
        <Section bgColor="white" padding="xl">
          <Container>
            {/* Back Button */}
            <div className="mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2"
              >
                <FiArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <FiShield className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-900 mb-2">Access Denied</h2>
              <p className="text-red-700">
                Only the super admin can access admin management. You can still access the admin dashboard to manage submissions.
              </p>
            </div>
          </Container>
        </Section>
      </>
    );
  }

  const pendingApplications = adminApplications.filter((app) => app.status === 'pending');
  const approvedApplications = adminApplications.filter((app) => app.status === 'approved');
  const deniedApplications = adminApplications.filter((app) => app.status === 'denied');
  const activeAdmins = approvedAdmins.filter((admin) => admin.status === 'approved');

  return (
    <>
      <SEO
        title="Admin Management"
        description="Manage admin applications and approved administrators"
        noindex={true}
      />

      <Section bgColor="white" padding="xl">
        <Container>
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2"
              >
                <FiArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Management</h1>
            <p className="text-gray-600">
              Review admin applications and manage approved administrators
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-yellow-900">Pending Applications</h3>
                <FiLoader className="w-5 h-5 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-yellow-900">{pendingApplications.length}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-green-50 border border-green-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-green-900">Approved Applications</h3>
                <FiCheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-900">{approvedApplications.length}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-red-50 border border-red-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-red-900">Denied Applications</h3>
                <FiXCircle className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-900">{deniedApplications.length}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="bg-blue-50 border border-blue-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-blue-900">Active Admins</h3>
                <FiUsers className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-900">{activeAdmins.length}</p>
            </motion.div>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
              <nav className="flex gap-2 flex-nowrap min-w-max md:min-w-0" aria-label="Tabs">
                <button
                  onClick={() => handleTabChange('applications')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'applications'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FiMail />
                    <span>Applications</span>
                    {pendingApplications.length > 0 && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                        {pendingApplications.length}
                      </span>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => handleTabChange('admins')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'admins'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FiUsers />
                    <span>Approved Admins</span>
                  </div>
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <FiLoader className="w-8 h-8 text-gray-400 animate-spin mb-4" />
                <p className="text-gray-600">Loading...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-medium mb-1">Error loading data</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            ) : activeTab === 'applications' ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Admin Applications</h2>
                  {pendingApplications.length > 0 && (
                    <div className="flex items-center gap-3">
                      {selectedApplicationIds.size > 0 && (
                        <>
                          <span className="text-sm text-gray-600">
                            {selectedApplicationIds.size} selected
                          </span>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleBulkApprove}
                            disabled={isBulkProcessing}
                          >
                            {isBulkProcessing ? (
                              <>
                                <FiLoader className="animate-spin mr-2" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <FiCheckCircle className="mr-2" />
                                Bulk Approve
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleBulkDeny}
                            disabled={isBulkProcessing}
                          >
                            <FiXCircle className="mr-2" />
                            Bulk Deny
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
                {adminApplications.length === 0 ? (
                  <div className="text-center py-12">
                    <FiMail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No admin applications found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingApplications.length > 0 && (
                      <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                        <input
                          type="checkbox"
                          checked={selectedApplicationIds.size === pendingApplications.length && pendingApplications.length > 0}
                          onChange={() => handleSelectAll(pendingApplications)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label className="text-sm font-medium text-gray-700 cursor-pointer" onClick={() => handleSelectAll(pendingApplications)}>
                          Select All ({pendingApplications.length} pending)
                        </label>
                      </div>
                    )}
                    {adminApplications.map((application) => (
                      <div
                        key={application.id}
                        className={`bg-gray-50 border rounded-lg p-4 ${
                          selectedApplicationIds.has(application.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {application.status === 'pending' && (
                                <input
                                  type="checkbox"
                                  checked={selectedApplicationIds.has(application.id)}
                                  onChange={() => handleToggleSelection(application.id)}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0 mt-1"
                                />
                              )}
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <FiUser className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{application.name}</h3>
                                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                  <span className="flex items-center gap-1">
                                    <FiMail className="w-4 h-4" />
                                    {application.email}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <FiCalendar className="w-4 h-4" />
                                    {formatDate(application.created_at)}
                                  </span>
                                </div>
                              </div>
                              <StatusBadge status={application.status} />
                            </div>
                            <div className="ml-[52px] mt-3">
                              <p className="text-sm font-medium text-gray-700 mb-1">Reason:</p>
                              <p className="text-sm text-gray-600 bg-white rounded p-3 border border-gray-200">
                                {application.reason}
                              </p>
                            </div>
                            {application.approved_by && (
                              <p className="text-xs text-gray-500 mt-2 ml-[52px]">
                                {application.status === 'approved'
                                  ? `Approved by: ${application.approved_by}`
                                  : `Denied by: ${application.denied_by || application.approved_by}`}
                              </p>
                            )}
                            {application.denial_reason && (
                              <div className="ml-[52px] mt-2">
                                <p className="text-xs font-medium text-red-700 mb-1">
                                  Denial Reason:
                                </p>
                                <p className="text-xs text-red-600">{application.denial_reason}</p>
                              </div>
                            )}
                          </div>
                          {application.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleApprove(application.id)}
                                disabled={processingId === application.id}
                              >
                                {processingId === application.id ? (
                                  <>
                                    <FiLoader className="animate-spin mr-2" />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <FiCheckCircle className="mr-2" />
                                    Approve
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeny(application.id)}
                                disabled={processingId === application.id}
                              >
                                <FiXCircle className="mr-2" />
                                Deny
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Approved Administrators</h2>
                {activeAdmins.length === 0 ? (
                  <div className="text-center py-12">
                    <FiUsers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No approved admins found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeAdmins.map((admin) => (
                      <div
                        key={admin.email}
                        className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <FiShield className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{admin.name}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <FiMail className="w-4 h-4" />
                                {admin.email}
                              </span>
                              {admin.approved_at && (
                                <span className="flex items-center gap-1">
                                  <FiCalendar className="w-4 h-4" />
                                  Approved: {formatDate(admin.approved_at)}
                                </span>
                              )}
                            </div>
                            {admin.approved_by && (
                              <p className="text-xs text-gray-500 mt-1">
                                Approved by: {admin.approved_by}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveAdmin(admin.email, admin.name)}
                          disabled={processingId === admin.email}
                        >
                          {processingId === admin.email ? (
                            <>
                              <FiLoader className="animate-spin mr-2" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <FiTrash2 className="mr-2" />
                              Remove
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Container>
      </Section>
    </>
  );
}

