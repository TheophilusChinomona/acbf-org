import { useState, useEffect } from 'react';
import { Modal } from '../common';
import SignupForm from '../forms/SignupForm';

/**
 * Signup Modal Component
 * Shows membership application form only
 */
export default function SignupModal() {
  const [isOpen, setIsOpen] = useState(false);

  // Listen for custom event to open modal
  useEffect(() => {
    const handleOpenModal = () => {
      setIsOpen(true);
    };

    window.addEventListener('openSignupModal', handleOpenModal);

    return () => {
      window.removeEventListener('openSignupModal', handleOpenModal);
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Membership Application"
      size="lg"
    >
      <SignupForm />
    </Modal>
  );
}

/**
 * Helper function to open the signup modal from anywhere
 */
export function openSignupModal() {
  window.dispatchEvent(new CustomEvent('openSignupModal'));
}

