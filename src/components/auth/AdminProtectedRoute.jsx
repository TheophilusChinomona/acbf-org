import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAdminManagement } from '../../hooks/useAdminManagement';
import { useUserManagement } from '../../hooks/useUserManagement';
import Loading from '../common/Loading';

/**
 * Admin Protected Route Component
 * Wraps routes that require admin access
 * Redirects to login page if user is not authenticated
 * Redirects to admin application page if user is not an admin
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The component to render if admin
 * @param {string} props.redirectTo - Optional redirect path (defaults to /admin/login)
 */
export default function AdminProtectedRoute({ children, redirectTo = '/admin/login' }) {
  const { currentUser, loading: authLoading } = useAuth();
  const { isAdmin, isSuperAdmin, loading: adminLoading } = useAdminManagement();
  const { userProfile, profileLoading } = useUserManagement();
  const location = useLocation();

  console.log('[AdminProtectedRoute] Access check:', {
    path: location.pathname,
    isAdmin,
    isSuperAdmin,
    authLoading,
    adminLoading,
    profileLoading,
    userRole: userProfile?.role,
    hasAccess: isAdmin || isSuperAdmin,
  });

  // Show loading state while checking authentication and admin status
  if (authLoading || adminLoading || profileLoading) {
    return <Loading fullScreen text="Checking access..." />;
  }

  // If not authenticated, redirect to login page
  if (!currentUser) {
    console.log('[AdminProtectedRoute] Not authenticated, redirecting to login');
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If authenticated but not an admin, redirect based on user role
  // Note: Super admin can access even if not in approved_admins (for initial setup)
  if (!isAdmin && !isSuperAdmin) {
    console.log('[AdminProtectedRoute] Not admin, redirecting based on role');

    // If user has a member role and approved status, send to member dashboard
    if (userProfile?.role === 'member' && userProfile?.status === 'approved') {
      console.log('[AdminProtectedRoute] Redirecting to member dashboard');
      return <Navigate to="/member/dashboard" state={{ from: location }} replace />;
    }

    // If user has a member role but pending status, send to pending page
    if (userProfile?.role === 'member' && userProfile?.status === 'pending') {
      console.log('[AdminProtectedRoute] Redirecting to pending approval page');
      return <Navigate to="/member/pending" state={{ from: location }} replace />;
    }

    // If no member profile, redirect to becoming a member page to sign up
    console.log('[AdminProtectedRoute] No member profile, redirecting to becoming a member');
    return <Navigate to="/becoming-a-member" state={{ from: location }} replace />;
  }

  // User is authenticated and is an admin, render the protected component
  console.log('[AdminProtectedRoute] Access granted');
  return children;
}

