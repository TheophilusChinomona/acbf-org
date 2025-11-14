import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Container, Section, SEO } from '../../components/common';
import { useAllUsers, useUserManagement } from '../../hooks/useUserManagement';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button';
import {
  FiArrowLeft,
  FiUsers,
  FiShield,
  FiTrash2,
  FiAlertCircle,
  FiLoader,
  FiSearch,
  FiCheckCircle,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const RoleBadge = ({ role }) => {
  const colors = {
    super_admin: 'bg-purple-100 text-purple-800 border-purple-200',
    admin: 'bg-blue-100 text-blue-800 border-blue-200',
    member: 'bg-green-100 text-green-800 border-green-200',
  };

  const labels = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    member: 'Member',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${colors[role] || colors.member}`}>
      {labels[role] || role}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const colors = {
    approved: 'bg-green-100 text-green-800 border-green-200',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${colors[status] || colors.pending}`}>
      {status}
    </span>
  );
};

export default function UserManagement() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { users, loading, error } = useAllUsers();
  const { updateUserRole, deleteUser } = useUserManagement();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [userToDelete, setUserToDelete] = useState(null);
  const [userToChangeRole, setUserToChangeRole] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      await deleteUser(userToDelete.id);
      toast.success(`User ${userToDelete.name} deleted successfully`);
      setUserToDelete(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleChangeRole = async () => {
    if (!userToChangeRole || !newRole) return;

    setIsUpdatingRole(true);
    try {
      await updateUserRole(userToChangeRole.id, newRole);
      toast.success(`Role updated for ${userToChangeRole.name}`);
      setUserToChangeRole(null);
      setNewRole('');
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error(error.message || 'Failed to update role');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FiLoader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FiAlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="User Management"
        description="Manage all users and their permissions"
        noindex={true}
      />

      {/* Header */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-secondary-dark via-secondary to-secondary-light py-8 md:py-12">
        <Container>
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
              <FiUsers className="w-8 h-8 text-white" />
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                User Management
              </h1>
            </div>
            <p className="text-white/90">
              Manage all users and their permissions
            </p>
          </motion.div>
        </Container>
      </section>

      {/* Main Content */}
      <Section bgColor="white" padding="xl">
        <Container>
          <div className="max-w-7xl mx-auto">
            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-white rounded-lg border border-gray-200 p-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Users
                  </label>
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name or email..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Role Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Role
                  </label>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="all">All Roles</option>
                    <option value="super_admin">Super Admin</option>
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="text-sm text-gray-600 mb-1">Total Users</div>
                <div className="text-2xl font-bold text-gray-900">{users.length}</div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="text-sm text-gray-600 mb-1">Super Admins</div>
                <div className="text-2xl font-bold text-purple-600">
                  {users.filter(u => u.role === 'super_admin').length}
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="text-sm text-gray-600 mb-1">Admins</div>
                <div className="text-2xl font-bold text-blue-600">
                  {users.filter(u => u.role === 'admin').length}
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="text-sm text-gray-600 mb-1">Members</div>
                <div className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.role === 'member').length}
                </div>
              </div>
            </div>

            {/* Users Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => {
                        const isCurrentUser = user.id === currentUser?.uid;
                        return (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div>
                                <div className="font-medium text-gray-900">{user.name}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                                {isCurrentUser && (
                                  <span className="text-xs text-primary font-medium">(You)</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <RoleBadge role={user.role} />
                            </td>
                            <td className="px-6 py-4">
                              <StatusBadge status={user.status} />
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                              <Button
                                onClick={() => {
                                  setUserToChangeRole(user);
                                  setNewRole(user.role);
                                }}
                                disabled={isCurrentUser}
                                size="sm"
                                variant="outline"
                              >
                                <FiShield className="mr-1" />
                                Change Role
                              </Button>
                              <Button
                                onClick={() => setUserToDelete(user)}
                                disabled={isCurrentUser}
                                size="sm"
                                variant="outline"
                                className="border-red-500 text-red-600 hover:bg-red-50"
                              >
                                <FiTrash2 className="mr-1" />
                                Delete
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        </Container>
      </Section>

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <FiAlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete User</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-gray-700 mb-6">
              Are you sure you want to delete <strong>{userToDelete.name}</strong>? All their data will be permanently removed.
            </p>

            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setUserToDelete(null)}
                disabled={isDeleting}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteUser}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? (
                  <>
                    <FiLoader className="animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <FiTrash2 className="mr-2" />
                    Delete User
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Change Role Modal */}
      {userToChangeRole && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <FiShield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Change User Role</h3>
                <p className="text-sm text-gray-600">{userToChangeRole.name}</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select New Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
              <p className="mt-2 text-sm text-gray-500">
                Current role: <strong>{userToChangeRole.role}</strong>
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => {
                  setUserToChangeRole(null);
                  setNewRole('');
                }}
                disabled={isUpdatingRole}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleChangeRole}
                disabled={isUpdatingRole || newRole === userToChangeRole.role}
                variant="primary"
              >
                {isUpdatingRole ? (
                  <>
                    <FiLoader className="animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  <>
                    <FiCheckCircle className="mr-2" />
                    Update Role
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
