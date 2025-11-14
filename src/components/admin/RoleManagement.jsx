import { useState, useMemo } from 'react';
import { FiUsers, FiShield, FiArrowUp, FiArrowDown, FiLoader } from 'react-icons/fi';
import { useAllUsers } from '../../hooks/useAllUsers';
import { useUserManagement } from '../../hooks/useUserManagement';
import { USER_ROLES } from '../../utils/userRoles';
import Button from '../common/Button';
import toast from 'react-hot-toast';

export default function RoleManagement() {
  const { allUsers, loading, error } = useAllUsers();
  const { updateUserRole } = useUserManagement();
  const [processingUserId, setProcessingUserId] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'member', 'admin'

  const handleRoleChange = async (user, newRole) => {
    const action = newRole === USER_ROLES.ADMIN ? 'promote' : 'demote';
    const roleName = newRole === USER_ROLES.ADMIN ? 'Admin' : 'Member';

    if (!window.confirm(
      `Are you sure you want to ${action} ${user.name || user.email} to ${roleName}?`
    )) {
      return;
    }

    try {
      setProcessingUserId(user.uid);
      await updateUserRole(user.uid, newRole);
      toast.success(`Successfully ${action}d ${user.name || user.email} to ${roleName}`);
    } catch (error) {
      console.error('Error changing user role:', error);
      toast.error(error.message || `Failed to ${action} user`);
    } finally {
      setProcessingUserId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    if (filter === 'all') return allUsers;
    if (filter === 'member') return allUsers.filter(u => u.role === USER_ROLES.MEMBER);
    if (filter === 'admin') return allUsers.filter(u => u.role === USER_ROLES.ADMIN);
    return allUsers;
  }, [allUsers, filter]);

  const stats = useMemo(() => {
    return {
      total: allUsers.length,
      members: allUsers.filter(u => u.role === USER_ROLES.MEMBER).length,
      admins: allUsers.filter(u => u.role === USER_ROLES.ADMIN).length,
      superAdmins: allUsers.filter(u => u.role === USER_ROLES.SUPER_ADMIN).length,
    };
  }, [allUsers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FiLoader className="w-6 h-6 text-primary animate-spin" />
        <span className="ml-2 text-gray-600">Loading users...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        <p className="font-semibold">Error loading users</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <FiUsers className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Members</p>
              <p className="text-2xl font-bold text-blue-600">{stats.members}</p>
            </div>
            <FiUsers className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Admins</p>
              <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
            </div>
            <FiShield className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Super Admins</p>
              <p className="text-2xl font-bold text-red-600">{stats.superAdmins}</p>
            </div>
            <FiShield className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({stats.total})
        </Button>
        <Button
          variant={filter === 'member' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('member')}
        >
          Members ({stats.members})
        </Button>
        <Button
          variant={filter === 'admin' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('admin')}
        >
          Admins ({stats.admins})
        </Button>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === USER_ROLES.SUPER_ADMIN
                            ? 'bg-red-100 text-red-800'
                            : user.role === USER_ROLES.ADMIN
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {user.role === USER_ROLES.SUPER_ADMIN && <FiShield className="w-3 h-3 mr-1" />}
                        {user.role === USER_ROLES.ADMIN && <FiShield className="w-3 h-3 mr-1" />}
                        {user.role === USER_ROLES.MEMBER && <FiUsers className="w-3 h-3 mr-1" />}
                        {user.role?.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : user.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {user.status || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {user.role === USER_ROLES.SUPER_ADMIN ? (
                        <span className="text-gray-400 text-xs">Cannot modify</span>
                      ) : user.role === USER_ROLES.MEMBER ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRoleChange(user, USER_ROLES.ADMIN)}
                          disabled={processingUserId === user.uid}
                          className="inline-flex items-center gap-1"
                        >
                          {processingUserId === user.uid ? (
                            <FiLoader className="w-3 h-3 animate-spin" />
                          ) : (
                            <FiArrowUp className="w-3 h-3" />
                          )}
                          Promote to Admin
                        </Button>
                      ) : user.role === USER_ROLES.ADMIN ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRoleChange(user, USER_ROLES.MEMBER)}
                          disabled={processingUserId === user.uid}
                          className="inline-flex items-center gap-1"
                        >
                          {processingUserId === user.uid ? (
                            <FiLoader className="w-3 h-3 animate-spin" />
                          ) : (
                            <FiArrowDown className="w-3 h-3" />
                          )}
                          Demote to Member
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
