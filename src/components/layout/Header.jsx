import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSite } from '../../context/SiteContext';
import { useAuth } from '../../hooks/useAuth';
import { useUserManagement } from '../../hooks/useUserManagement';
import { HiMenu, HiX, HiSearch } from 'react-icons/hi';
import { FiUsers, FiLogOut, FiUser } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import menusData from '../../data/menus.json';
import settingsData from '../../data/settings.json';
import { openLoginModal } from '../modals/LoginModal';
import Image from '../common/Image';
import toast from 'react-hot-toast';

export default function Header() {
  const { mobileMenuOpen, setMobileMenuOpen, searchOpen, setSearchOpen } = useSite();
  const { currentUser, logout } = useAuth();
  const { userProfile } = useUserManagement();
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUserMenu]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleSearch = () => {
    setSearchOpen(!searchOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleSearchIconClick = () => {
    if (searchOpen) {
      // If search is open, navigate to search page
      navigate('/search');
    } else {
      // Otherwise, toggle search bar
      toggleSearch();
    }
  };

  const handleLoginClick = () => {
    // Open the login modal
    openLoginModal();
  };

  const handleLogout = async () => {
    try {
      setShowUserMenu(false);
      closeMobileMenu();
      await logout();
      toast.success('Logged out successfully');
      // Navigate to home page after logout
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const handleUserNavigation = (path) => {
    navigate(path);
    setShowUserMenu(false);
    closeMobileMenu();
  };

  // Get appropriate dashboard link based on user role
  const getDashboardLink = () => {
    if (!userProfile) return '/member/pending';

    const role = userProfile.role;
    if (role === 'admin' || role === 'super_admin') {
      return '/admin';
    }

    // For members, show pending page if not approved, otherwise show dashboard
    if (userProfile.status === 'pending') {
      return '/member/pending';
    }

    return '/member/dashboard';
  };

  return (
    <header
      className={`sticky top-0 z-50 bg-white shadow-md transition-all duration-300 ${
        scrolled ? 'shadow-lg' : ''
      }`}
      role="banner"
    >
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between py-4" role="navigation" aria-label="Main navigation">
          {/* Logo */}
          <Link to="/" className="flex items-center" aria-label="Home">
            <Image
              src="/assets/images/logos/acbf logos/acbf-logo-header.png"
              alt={settingsData.siteName}
              className="h-12 w-auto"
              lazy={false}
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <ul className="flex items-center space-x-6" role="list">
              {menusData.main.map((item) => (
                <li key={item.url} role="listitem">
                  <Link
                    to={item.url}
                    className="text-gray-700 hover:text-primary transition-colors duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-2 py-1"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* User Menu (when logged in) or Join Now Button (when logged out) */}
            {currentUser ? (
              <div className="relative user-menu-container">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white font-medium rounded-lg hover:from-primary-dark hover:to-secondary-dark transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 shadow-md hover:shadow-lg"
                  aria-label="User Menu"
                  aria-expanded={showUserMenu}
                >
                  <FiUser className="w-4 h-4" />
                  <span>{userProfile?.name || 'Account'}</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <button
                      onClick={() => handleUserNavigation(getDashboardLink())}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                    >
                      <FiUser className="inline w-4 h-4 mr-2" />
                      Dashboard
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                    >
                      <FiLogOut className="inline w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleLoginClick}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white font-medium rounded-lg hover:from-primary-dark hover:to-secondary-dark transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 shadow-md hover:shadow-lg"
                aria-label="Login"
              >
                <FiUser className="w-4 h-4" />
                <span>Login</span>
              </button>
            )}

            {/* Search Icon */}
            <button
              onClick={handleSearchIconClick}
              className="p-2 text-gray-700 hover:text-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              aria-label="Search"
              aria-expanded={searchOpen}
            >
              <HiSearch className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={handleSearchIconClick}
              className="p-2 text-gray-700 hover:text-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              aria-label="Search"
              aria-expanded={searchOpen}
            >
              <HiSearch className="w-5 h-5" />
            </button>
            <button
              onClick={toggleMobileMenu}
              className="p-2 text-gray-700 hover:text-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <HiX className="w-6 h-6" />
              ) : (
                <HiMenu className="w-6 h-6" />
              )}
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4" role="menu">
            <ul className="flex flex-col space-y-4" role="list">
              {menusData.main.map((item) => (
                <li key={item.url} role="listitem">
                  <Link
                    to={item.url}
                    onClick={closeMobileMenu}
                    className="block text-gray-700 hover:text-primary transition-colors duration-200 font-medium py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-2"
                    role="menuitem"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* User Menu or Join Now Button for Mobile */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              {currentUser ? (
                <div className="space-y-2">
                  <button
                    onClick={() => handleUserNavigation(getDashboardLink())}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white font-medium rounded-lg hover:from-primary-dark hover:to-secondary-dark transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 shadow-md hover:shadow-lg"
                    aria-label="Dashboard"
                  >
                    <FiUser className="w-4 h-4" />
                    <span>{userProfile?.name || 'Account'}</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                    aria-label="Logout"
                  >
                    <FiLogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    handleLoginClick();
                    closeMobileMenu();
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white font-medium rounded-lg hover:from-primary-dark hover:to-secondary-dark transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 shadow-md hover:shadow-lg"
                  aria-label="Login"
                >
                  <FiUser className="w-4 h-4" />
                  <span>Login</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Search Bar */}
        {searchOpen && (
          <div className="border-t border-gray-200 py-4" role="search">
            <form onSubmit={handleSearchSubmit} className="relative">
              <label htmlFor="header-search" className="sr-only">
                Search
              </label>
              <input
                id="header-search"
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                autoFocus
                aria-label="Search input"
              />
              <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" aria-hidden="true" />
            </form>
          </div>
        )}
      </div>
    </header>
  );
}

