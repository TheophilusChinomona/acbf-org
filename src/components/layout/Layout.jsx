import Header from './Header';
import Footer from './Footer';
import { BackToTop } from '../common';
import ContactModal from '../modals/ContactModal';
import LoginModal from '../modals/LoginModal';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>
      <Header />
      <main id="main-content" className="flex-grow">
        {children}
      </main>
      <Footer />
      <BackToTop />
      <ContactModal />
      <LoginModal />
    </div>
  );
}

