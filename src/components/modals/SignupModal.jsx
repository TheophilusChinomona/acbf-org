import { useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Modal } from '../common';
import SignupForm from '../forms/SignupForm';

/**
 * Reusable Signup Modal Component
 * Automatically hides on the becoming-a-member page
 */
export default function SignupModal() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Don't show modal on becoming-a-member page
  const isBecomingAMemberPage = location.pathname === '/becoming-a-member';

  // Close modal if navigating to becoming-a-member page
  useEffect(() => {
    if (isBecomingAMemberPage && isOpen) {
      setIsOpen(false);
    }
  }, [isBecomingAMemberPage, isOpen]);

  // Listen for custom event to open modal
  useEffect(() => {
    const handleOpenModal = () => {
      if (!isBecomingAMemberPage) {
        setIsOpen(true);
      }
    };

    window.addEventListener('openSignupModal', handleOpenModal);

    return () => {
      window.removeEventListener('openSignupModal', handleOpenModal);
    };
  }, [isBecomingAMemberPage]);

  if (isBecomingAMemberPage) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
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

