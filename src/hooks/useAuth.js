/**
 * Hook to access authentication context
 * This is a convenience export that re-exports useAuth from AuthContext
 * for consistency with other hooks in the codebase
 * 
 * @returns {Object} Auth context with currentUser, login, logout, loading, error
 */
export { useAuth } from '../context/AuthContext';

