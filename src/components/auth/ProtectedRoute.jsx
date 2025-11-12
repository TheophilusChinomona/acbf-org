import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Loading from '../common/Loading';

/**
 * Protected Route Component
 * Wraps routes that require authentication
 * Redirects to login page if user is not authenticated
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The component to render if authenticated
 * @param {string} props.redirectTo - Optional redirect path (defaults to /admin/login)
 */
export default function ProtectedRoute({ children, redirectTo = '/admin/login' }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return <Loading fullScreen text="Checking authentication..." />;
  }

  // If not authenticated, redirect to login page
  // Save the current location so we can redirect back after login
  if (!currentUser) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // User is authenticated, render the protected component
  return children;
}

