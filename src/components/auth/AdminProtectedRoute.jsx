import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAdminManagement } from '../../hooks/useAdminManagement';
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
  const location = useLocation();

  // Show loading state while checking authentication and admin status
  if (authLoading || adminLoading) {
    return <Loading fullScreen text="Checking access..." />;
  }

  // If not authenticated, redirect to login page
  if (!currentUser) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If authenticated but not an admin, redirect to application page
  // Note: Super admin can access even if not in approved_admins (for initial setup)
  if (!isAdmin && !isSuperAdmin) {
    return <Navigate to="/admin/apply" state={{ from: location }} replace />;
  }

  // User is authenticated and is an admin, render the protected component
  return children;
}

