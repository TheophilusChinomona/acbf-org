import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Container, Section, SEO } from '../../components/common';
import { useAuth } from '../../hooks/useAuth';
import { useSubmissions } from '../../hooks/useSubmissions';
import SubmissionsList from './SubmissionsList';
import { 
  FiLogOut, 
  FiUser, 
  FiMail, 
  FiFileText, 
  FiShield,
  FiLoader
} from 'react-icons/fi';
import Button from '../../components/common/Button';

export default function AdminDashboard() {
  const { currentUser, logout } = useAuth();
  const { contactSubmissions, membershipApplications, loading, error } = useSubmissions();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('contact'); // 'contact' or 'membership'
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      navigate('/admin/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  // Count submissions by status
  const contactStats = {
    total: contactSubmissions.length,
    new: contactSubmissions.filter(s => s.status === 'new').length,
    inProgress: contactSubmissions.filter(s => s.status === 'in-progress').length,
    resolved: contactSubmissions.filter(s => s.status === 'resolved').length,
  };

  const membershipStats = {
    total: membershipApplications.length,
    pending: membershipApplications.filter(a => a.status === 'pending').length,
    approved: membershipApplications.filter(a => a.status === 'approved').length,
    rejected: membershipApplications.filter(a => a.status === 'rejected').length,
  };

  return (
    <>
      <SEO
        title="Admin Dashboard"
        description="Admin dashboard for managing contact submissions and membership applications"
        url={`${typeof window !== 'undefined' ? window.location.origin : ''}/admin`}
        noindex={true}
      />

      {/* Hero Section with Gradient Background */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 py-8 md:py-12">
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        <Container>
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              {/* Title Section */}
              <div className="flex items-center gap-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full border-2 border-white/30">
                  <FiShield className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
                    Admin Dashboard
                  </h1>
                  <p className="text-white/90 text-sm md:text-base">
                    Manage submissions and applications
                  </p>
                </div>
              </div>

              {/* User Info & Logout */}
              <div className="flex items-center gap-4">
                {/* User Info */}
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <FiUser className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-white">
                    <p className="text-sm font-medium">
                      {currentUser?.email || 'Admin'}
                    </p>
                    <p className="text-xs text-white/80">Administrator</p>
                  </div>
                </div>

                {/* Logout Button */}
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
                >
                  {isLoggingOut ? (
                    <>
                      <FiLoader className="animate-spin mr-2" />
                      Logging out...
                    </>
                  ) : (
                    <>
                      <FiLogOut className="mr-2" />
                      Logout
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Main Content */}
      <Section bgColor="white" padding="xl">
        <Container>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Contact Submissions Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-blue-900">Contact Submissions</h3>
                <FiMail className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-blue-900 mb-1">{contactStats.total}</p>
              <div className="flex gap-2 text-xs text-blue-700">
                <span>{contactStats.new} new</span>
                <span>•</span>
                <span>{contactStats.inProgress} in progress</span>
                <span>•</span>
                <span>{contactStats.resolved} resolved</span>
              </div>
            </motion.div>

            {/* Membership Applications Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-green-900">Membership Applications</h3>
                <FiFileText className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-green-900 mb-1">{membershipStats.total}</p>
              <div className="flex gap-2 text-xs text-green-700">
                <span>{membershipStats.pending} pending</span>
                <span>•</span>
                <span>{membershipStats.approved} approved</span>
                <span>•</span>
                <span>{membershipStats.rejected} rejected</span>
              </div>
            </motion.div>

            {/* New Contact Submissions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border border-orange-200"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-orange-900">New Submissions</h3>
                <FiMail className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-3xl font-bold text-orange-900">{contactStats.new}</p>
              <p className="text-xs text-orange-700 mt-1">Requires attention</p>
            </motion.div>

            {/* Pending Applications */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-purple-900">Pending Applications</h3>
                <FiFileText className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-purple-900">{membershipStats.pending}</p>
              <p className="text-xs text-purple-700 mt-1">Awaiting review</p>
            </motion.div>
          </div>

          {/* Tabs Navigation */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex gap-2" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('contact')}
                  className={`
                    px-6 py-3 text-sm font-medium border-b-2 transition-colors
                    ${
                      activeTab === 'contact'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <FiMail />
                    <span>Contact Submissions</span>
                    {contactStats.total > 0 && (
                      <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                        {contactStats.total}
                      </span>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('membership')}
                  className={`
                    px-6 py-3 text-sm font-medium border-b-2 transition-colors
                    ${
                      activeTab === 'membership'
                        ? 'border-green-600 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <FiFileText />
                    <span>Membership Applications</span>
                    {membershipStats.total > 0 && (
                      <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                        {membershipStats.total}
                      </span>
                    )}
                  </div>
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <FiLoader className="w-8 h-8 text-gray-400 animate-spin mb-4" />
                <p className="text-gray-600">Loading submissions...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-medium mb-1">Error loading data</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === 'contact' ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-900">
                        Contact Submissions
                      </h2>
                      {contactSubmissions.length > 0 && (
                        <p className="text-sm text-gray-600">
                          {contactSubmissions.length} submission{contactSubmissions.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    <SubmissionsList
                      submissions={contactSubmissions}
                      type="contact"
                    />
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-900">
                        Membership Applications
                      </h2>
                      {membershipApplications.length > 0 && (
                        <p className="text-sm text-gray-600">
                          {membershipApplications.length} application{membershipApplications.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    <SubmissionsList
                      submissions={membershipApplications}
                      type="membership"
                    />
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </Container>
      </Section>
    </>
  );
}

