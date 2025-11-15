import { Link, useNavigate } from 'react-router-dom';
import { FiLogOut, FiHome, FiMenu, FiX } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Image from '../common/Image';
import Button from '../common/Button';
import toast from 'react-hot-toast';
import settingsData from '../../data/settings.json';

export default function AdminNavBar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Close mobile menu when window resizes to desktop size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      navigate('/admin/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
      setIsLoggingOut(false);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Navigation links to main website pages
  // "Becoming a Member" is hidden for signed-in users (admins)
  const navLinks = [
    { label: 'Home', path: '/', icon: FiHome },
    { label: 'About', path: '/about' },
    { label: 'Blog', path: '/blog' },
    { label: 'Members', path: '/members' },
    { label: 'Contact', path: '/contact' },
    { label: 'Awards', path: '/awards' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-3 md:py-4">
          {/* Left: Logo and Dashboard Link */}
          <div className="flex items-center gap-2 md:gap-4">
            <Link to="/" className="flex items-center hover:opacity-80 transition-opacity" aria-label="Home">
              <Image
                src="/assets/images/logos/acbf logos/acbf-logo-header.png"
                alt={settingsData.siteName}
                className="h-10 w-auto md:h-12"
                lazy={false}
              />
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-0.5 ml-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={closeMobileMenu}
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded transition-colors duration-200 whitespace-nowrap"
                >
                  {link.label}
                </Link>
              ))}
              <span className="px-3 py-2 text-sm font-medium text-primary-dark bg-primary-light/20 rounded whitespace-nowrap">
                Admin Dashboard
              </span>
            </div>
          </div>

          {/* Right: User Info and Logout */}
          <div className="hidden lg:flex items-center gap-4">
            {currentUser?.email && (
              <div className="text-right">
                <p className="text-xs md:text-sm font-medium text-gray-700">
                  {currentUser.email}
                </p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              <FiLogOut className="mr-2" />
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 text-gray-700 hover:bg-gray-100 rounded transition-colors"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <FiX className="w-6 h-6" />
            ) : (
              <FiMenu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-3 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={closeMobileMenu}
                className="block px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="px-4 py-2 text-sm font-medium text-primary-dark bg-primary-light/20 rounded">
              Admin Dashboard
            </div>

            {/* Mobile: User Info and Logout */}
            <div className="border-t border-gray-200 pt-3 mt-3 space-y-2">
              {currentUser?.email && (
                <div className="px-4 py-2">
                  <p className="text-xs font-medium text-gray-700">{currentUser.email}</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              )}
              <Button
                variant="outline"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                <FiLogOut className="mr-2" />
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
