import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../common';
import LoginForm from '../auth/LoginForm';
import { openSignupModal } from './SignupModal';

/**
 * Login Modal Component
 * Simple modal that shows only the login form
 */
export default function LoginModal() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Listen for custom event to open modal
  useEffect(() => {
    const handleOpenModal = () => {
      setIsOpen(true);
    };

    window.addEventListener('openLoginModal', handleOpenModal);

    return () => {
      window.removeEventListener('openLoginModal', handleOpenModal);
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSignupClick = () => {
    handleClose();
    navigate('/becoming-a-member');
    // Small delay to ensure navigation completes before opening signup modal
    setTimeout(() => {
      openSignupModal();
    }, 100);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Member Login"
      size="lg"
    >
      <LoginForm onSuccess={handleClose} />

      <div className="mt-6 pt-6 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <button
            onClick={handleSignupClick}
            className="text-blue-600 hover:text-blue-700 font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-1"
          >
            Sign up
          </button>
        </p>
      </div>
    </Modal>
  );
}

/**
 * Helper function to open the login modal from anywhere
 */
export function openLoginModal() {
  window.dispatchEvent(new CustomEvent('openLoginModal'));
}
