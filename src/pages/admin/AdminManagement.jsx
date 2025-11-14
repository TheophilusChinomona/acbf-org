import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { Container, Section, SEO } from '../../components/common';
import { useAdminManagement } from '../../hooks/useAdminManagement';
import { useAdminInvitations } from '../../hooks/useAdminInvitations';
import {
  FiUsers,
  FiCheckCircle,
  FiClock,
  FiMail,
  FiCalendar,
  FiLoader,
  FiShield,
  FiTrash2,
  FiArrowLeft,
  FiClipboard,
  FiSend,
  FiAlertCircle,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button';
import AdminInviteForm from '../../components/admin/AdminInviteForm';
import RoleManagement from '../../components/admin/RoleManagement';
import { isInvitationExpired } from '../../utils/invitationToken';

export default function AdminManagement() {
  const navigate = useNavigate();
  const {
    approvedAdmins,
    isSuperAdmin,
    loading: adminLoading,
    error: adminError,
    removeAdmin,
  } = useAdminManagement();
  const {
    invitations,
    pendingInvitations,
    loading: invitationLoading,
    error: invitationsError,
    createAdminInvitation,
    cancelInvitation,
  } = useAdminInvitations({ listen: true });

  const [processingAdminId, setProcessingAdminId] = useState(null);
  const [cancellingInvitationId, setCancellingInvitationId] = useState(null);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return format(dateObj, 'MMM dd, yyyy • p');
    } catch {
      return 'Invalid date';
    }
  };

  const getInvitationLink = (token) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/invite/${token}`;
  };

  const handleCopyInvitationLink = async (token) => {
    const invitationLink = getInvitationLink(token);

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(invitationLink);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = invitationLink;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      toast.success('Invitation link copied to clipboard.');
    } catch (error) {
      console.error('Failed to copy invitation link:', error);
      toast.error('Unable to copy invitation link. Please copy it manually.');
    }
  };

  const handleCreateInvitation = async (payload) => {
    try {
      const invitation = await createAdminInvitation(payload);
      toast.success('Admin invitation created successfully.');
      return invitation;
    } catch (error) {
      console.error('Failed to create admin invitation:', error);
      toast.error(error.message || 'Unable to create invitation. Please try again.');
      throw error;
    }
  };

  const handleRemoveAdmin = async (email, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name || email} as an admin?`)) {
      return;
    }

    try {
      setProcessingAdminId(email);
      await removeAdmin(email);
      toast.success('Admin access revoked successfully');
    } catch (error) {
      console.error('Error removing admin:', error);
      toast.error(error.message || 'Failed to remove admin');
    } finally {
      setProcessingAdminId(null);
    }
  };

  const handleCancelInvitation = async (invitation) => {
    if (!invitation?.id) return;

    const confirmation = window.confirm(
      `Cancel invitation for ${invitation.email}? The link will stop working immediately.`,
    );

    if (!confirmation) {
      return;
    }

    try {
      setCancellingInvitationId(invitation.id);
      await cancelInvitation(invitation.id);
      toast.success('Invitation cancelled.');
    } catch (error) {
      console.error('Failed to cancel invitation:', error);
      toast.error(error.message || 'Unable to cancel invitation.');
    } finally {
      setCancellingInvitationId(null);
    }
  };

  const activeAdmins = useMemo(
    () => approvedAdmins.filter((admin) => admin.status === 'approved'),
    [approvedAdmins],
  );

  const acceptedInvitationsCount = useMemo(
    () => invitations.filter((invitation) => invitation.status === 'accepted').length,
    [invitations],
  );

  const expiredInvitationsCount = useMemo(
    () =>
      invitations.filter(
        (invitation) =>
          invitation.status === 'pending' &&
          invitation.expires_at &&
          isInvitationExpired(invitation.expires_at),
      ).length,
    [invitations],
  );

  const cancelledInvitationsCount = useMemo(
    () => invitations.filter((invitation) => invitation.status === 'cancelled').length,
    [invitations],
  );

  const recentInvitationActivity = useMemo(
    () =>
      invitations
        .filter((invitation) => {
          if (invitation.status !== 'pending') {
            return true;
          }
          return invitation.expires_at && isInvitationExpired(invitation.expires_at);
        })
        .slice(0, 5),
    [invitations],
  );

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

  const invitationStatusChip = (invitation) => {
    const expired = invitation.expires_at ? isInvitationExpired(invitation.expires_at) : false;
    let statusKey = invitation.status;

    if (invitation.status === 'pending' && expired) {
      statusKey = 'expired';
    }

    const config = {
      pending: {
        label: 'Pending',
        classes: 'bg-orange-100 text-orange-800 border border-orange-200',
      },
      accepted: {
        label: 'Accepted',
        classes: 'bg-green-100 text-green-800 border border-green-200',
      },
      cancelled: {
        label: 'Cancelled',
        classes: 'bg-gray-100 text-gray-700 border border-gray-200',
      },
      expired: {
        label: 'Expired',
        classes: 'bg-red-100 text-red-700 border border-red-200',
      },
    }[statusKey] || {
      label: statusKey,
      classes: 'bg-gray-100 text-gray-700 border border-gray-200',
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.classes}`}>
        {config.label}
      </span>
    );
  };

  return (
    <>
      <SEO
        title="Admin Management"
        description="Manage admin invitations and approved administrators"
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
              Invite new administrators, monitor invitation activity, and manage active admin accounts.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-indigo-50 border border-indigo-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-indigo-900">Active Invitations</h3>
                <FiSend className="w-5 h-5 text-indigo-600" />
              </div>
              <p className="text-2xl font-bold text-indigo-900">{pendingInvitations.length}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-blue-50 border border-blue-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-blue-900">Active Admins</h3>
                <FiUsers className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-900">{activeAdmins.length}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-green-50 border border-green-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-green-900">Accepted Invites</h3>
                <FiCheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-900">{acceptedInvitationsCount}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="bg-red-50 border border-red-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-red-900">Expired / Cancelled</h3>
                <FiClock className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-900">
                {expiredInvitationsCount + cancelledInvitationsCount}
              </p>
            </motion.div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 mb-8">
            <AdminInviteForm onCreateInvitation={handleCreateInvitation} />

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Pending Invitations</h2>
                <span className="text-sm text-gray-500">{pendingInvitations.length} active</span>
              </div>

              {invitationLoading ? (
                <div className="flex items-center gap-3 text-gray-600">
                  <FiLoader className="w-5 h-5 animate-spin" />
                  <span>Loading invitations…</span>
                </div>
              ) : invitationsError ? (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  <FiAlertCircle className="mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900">Unable to load invitations</p>
                    <p>{invitationsError}</p>
                  </div>
                </div>
              ) : pendingInvitations.length === 0 ? (
                <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-6 text-center text-sm text-gray-600">
                  <p>No pending invitations at the moment.</p>
                  <p className="mt-1">Use the form to the left to invite a new administrator.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingInvitations.map((invitation) => {
                    const expiresAt = invitation.expires_at ? new Date(invitation.expires_at) : null;
                    const expiresIn = expiresAt
                      ? formatDistanceToNow(expiresAt, { addSuffix: true })
                      : 'No expiration';

                    return (
                      <div
                        key={invitation.id}
                        className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:border-indigo-200 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{invitation.email}</p>
                            {invitation.invitee_name && (
                              <p className="text-sm text-gray-600">{invitation.invitee_name}</p>
                            )}
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-600">
                              <span className="flex items-center gap-1">
                                <FiMail className="w-3 h-3" />
                                Invited by {invitation.invited_by_name || invitation.invited_by || 'Admin'}
                              </span>
                              {invitation.created_at && (
                                <span className="flex items-center gap-1">
                                  <FiCalendar className="w-3 h-3" />
                                  {formatDate(invitation.created_at)}
                                </span>
                              )}
                              {expiresAt && (
                                <span className="flex items-center gap-1">
                                  <FiClock className="w-3 h-3" />
                                  Expires {expiresIn}
                                </span>
                              )}
                            </div>
                          </div>
                          {invitationStatusChip(invitation)}
                        </div>

                        {invitation.note && (
                          <div className="mt-3 text-xs bg-white border border-gray-200 rounded-md p-3 text-gray-700 whitespace-pre-wrap">
                            {invitation.note}
                          </div>
                        )}

                        <div className="mt-4 flex flex-wrap gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyInvitationLink(invitation.token)}
                            className="flex items-center gap-2"
                          >
                            <FiClipboard className="w-4 h-4" />
                            Copy Link
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={cancellingInvitationId === invitation.id}
                            onClick={() => handleCancelInvitation(invitation)}
                            className="flex items-center gap-2 text-red-600 hover:text-red-700"
                          >
                            {cancellingInvitationId === invitation.id ? (
                              <>
                                <FiLoader className="w-4 h-4 animate-spin" />
                                Cancelling…
                              </>
                            ) : (
                              <>
                                <FiTrash2 className="w-4 h-4" />
                                Cancel Invite
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Invitation Activity</h2>
            {recentInvitationActivity.length === 0 ? (
              <p className="text-sm text-gray-600">No invitation activity yet.</p>
            ) : (
              <div className="space-y-3">
                {recentInvitationActivity.map((invitation) => (
                  <div
                    key={`history-${invitation.id}`}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-gray-100 rounded-lg p-3"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-900">{invitation.email}</p>
                      <p className="text-xs text-gray-600">
                        {invitation.status === 'accepted' && 'Invitation accepted'}
                        {invitation.status === 'cancelled' && 'Invitation cancelled'}
                        {invitation.status === 'pending' &&
                          invitation.expires_at &&
                          isInvitationExpired(invitation.expires_at) &&
                          'Invitation expired'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {invitation.created_at && (
                        <span className="text-xs text-gray-500">
                          Sent {formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true })}
                        </span>
                      )}
                      {invitationStatusChip(invitation)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Approved Administrators</h2>
            {adminLoading ? (
              <div className="flex items-center gap-3 text-gray-600">
                <FiLoader className="w-5 h-5 animate-spin" />
                <span>Loading administrators…</span>
              </div>
            ) : adminError ? (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                <FiAlertCircle className="mt-0.5" />
                <div>
                  <p className="font-medium text-red-900">Unable to load admins</p>
                  <p>{adminError}</p>
                </div>
              </div>
            ) : activeAdmins.length === 0 ? (
              <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-6 text-center text-sm text-gray-600">
                No approved administrators yet.
              </div>
            ) : (
              <div className="space-y-3">
                {activeAdmins.map((admin) => (
                  <div
                    key={admin.email}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{admin.name || admin.email}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center gap-1">
                          <FiMail className="w-4 h-4" />
                          {admin.email}
                        </span>
                        {admin.approved_at && (
                          <span className="flex items-center gap-1">
                            <FiCalendar className="w-4 h-4" />
                            Approved {formatDate(admin.approved_at)}
                          </span>
                        )}
                        {admin.approved_by && (
                          <span className="flex items-center gap-1">
                            <FiShield className="w-4 h-4" />
                            Approved by {admin.approved_by}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveAdmin(admin.email, admin.name)}
                      disabled={processingAdminId === admin.email}
                      className="flex items-center gap-2"
                    >
                      {processingAdminId === admin.email ? (
                        <>
                          <FiLoader className="w-4 h-4 animate-spin" />
                          Processing…
                        </>
                      ) : (
                        <>
                          <FiTrash2 className="w-4 h-4" />
                          Remove Admin
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Role Management Section */}
          <div className="mt-12">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">User Role Management</h2>
              <p className="text-gray-600">
                Manage user roles across the system. Promote members to admins or demote admins to members.
              </p>
            </div>
            <RoleManagement />
          </div>
        </Container>
      </Section>
    </>
  );
}

