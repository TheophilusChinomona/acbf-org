import { useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Modal } from '../common';
import ContactForm from '../forms/ContactForm';

/**
 * Reusable Contact Modal Component
 * Automatically hides on the contact page
 */
export default function ContactModal() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Don't show modal on contact page
  const isContactPage = location.pathname === '/contact';

  // Close modal if navigating to contact page
  useEffect(() => {
    if (isContactPage && isOpen) {
      setIsOpen(false);
    }
  }, [isContactPage, isOpen]);

  // Listen for custom event to open modal
  useEffect(() => {
    const handleOpenModal = () => {
      if (!isContactPage) {
        setIsOpen(true);
      }
    };

    window.addEventListener('openContactModal', handleOpenModal);

    return () => {
      window.removeEventListener('openContactModal', handleOpenModal);
    };
  }, [isContactPage]);

  if (isContactPage) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="Contact Us"
      size="lg"
    >
      <ContactForm />
    </Modal>
  );
}

/**
 * Helper function to open the contact modal from anywhere
 */
export function openContactModal() {
  window.dispatchEvent(new CustomEvent('openContactModal'));
}

