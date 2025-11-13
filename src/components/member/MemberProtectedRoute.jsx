import { Navigate, useLocation } from 'react-router-dom';
import Loading from '../common/Loading';
import { useAuth } from '../../hooks/useAuth';
import { useMemberManagement } from '../../hooks/useMemberManagement';

export default function MemberProtectedRoute({
  children,
  loginPath = '/register',
  requireApproved = true,
  pendingPath = '/member/pending',
}) {
  const { currentUser, loading: authLoading } = useAuth();
  const {
    currentMember,
    memberProfileLoading,
    memberProfileError,
  } = useMemberManagement();
  const location = useLocation();

  if (authLoading || memberProfileLoading) {
    return <Loading fullScreen text="Loading your member access..." />;
  }

  if (!currentUser) {
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (memberProfileError) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700 space-y-3">
          <h2 className="text-lg font-semibold">Unable to verify membership</h2>
          <p className="text-sm">{memberProfileError}</p>
        </div>
      </div>
    );
  }

  const role = currentMember?.role?.toLowerCase();
  const status = currentMember?.status?.toLowerCase();

  if (!role) {
    return <Navigate to="/becoming-a-member" replace />;
  }

  if (role !== 'member' && role !== 'super_admin') {
    return <Navigate to="/admin" replace />;
  }

  if (requireApproved && status !== 'approved') {
    return <Navigate to={pendingPath} replace />;
  }

  return children;
}


