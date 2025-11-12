import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Container, Section, SEO } from '../../components/common';
import { useAuth } from '../../hooks/useAuth';
import { useSubmissions } from '../../hooks/useSubmissions';
import { useAdminManagement } from '../../hooks/useAdminManagement';
import SubmissionsList from './SubmissionsList';
import FilterBar from '../../components/admin/FilterBar';
import ExportButton from '../../components/admin/ExportButton';
import { 
  FiLogOut, 
  FiUser, 
  FiMail, 
  FiFileText, 
  FiShield,
  FiLoader,
  FiUsers
} from 'react-icons/fi';
import Button from '../../components/common/Button';

export default function AdminDashboard() {
  const { currentUser, logout } = useAuth();
  const { contactSubmissions, membershipApplications, loading, error } = useSubmissions();
  const { isSuperAdmin } = useAdminManagement();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('contact'); // 'contact' or 'membership'
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    dateFrom: '',
    dateTo: '',
  });

  // Reset filters when switching tabs
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFilters({ search: '', status: 'all', dateFrom: '', dateTo: '' });
  };

  // Filter submissions - must be at top level (Rules of Hooks)
  const filteredContactSubmissions = useMemo(() => {
    let filtered = [...contactSubmissions];
    
    // Filter by status
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(s => s.status === filters.status);
    }
    
    // Filter by search query
    if (filters.search && filters.search.trim()) {
      const searchLower = filters.search.toLowerCase().trim();
      filtered = filtered.filter(s => 
        s.name?.toLowerCase().includes(searchLower) ||
        s.email?.toLowerCase().includes(searchLower) ||
        s.subject?.toLowerCase().includes(searchLower) ||
        s.message?.toLowerCase().includes(searchLower)
      );
    }
    
    // Filter by date range
    if (filters.dateFrom || filters.dateTo) {
      filtered = filtered.filter(s => {
        if (!s.created_at) return false;
        
        // Convert submission date to Date object
        let submissionDate = s.created_at instanceof Date 
          ? new Date(s.created_at) 
          : s.created_at.toDate 
            ? s.created_at.toDate() 
            : new Date(s.created_at);
        
        // Create new Date objects to avoid mutation
        const dateFrom = filters.dateFrom ? new Date(filters.dateFrom + 'T00:00:00') : null;
        const dateTo = filters.dateTo ? new Date(filters.dateTo + 'T23:59:59') : null;
        
        // Normalize submission date to start of day (local time)
        const submissionDateOnly = new Date(submissionDate.getFullYear(), submissionDate.getMonth(), submissionDate.getDate());
        
        // Normalize filter dates to start/end of day (local time)
        const dateFromOnly = dateFrom ? new Date(dateFrom.getFullYear(), dateFrom.getMonth(), dateFrom.getDate()) : null;
        const dateToOnly = dateTo ? new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate()) : null;
        
        // Compare dates (ignoring time)
        if (dateFromOnly && submissionDateOnly < dateFromOnly) return false;
        if (dateToOnly && submissionDateOnly > dateToOnly) return false;
        
        return true;
      });
    }
    
    return filtered;
  }, [contactSubmissions, filters]);

  const filteredMembershipApplications = useMemo(() => {
    let filtered = [...membershipApplications];
    
    // Filter by status
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(a => a.status === filters.status);
    }
    
    // Filter by search query
    if (filters.search && filters.search.trim()) {
      const searchLower = filters.search.toLowerCase().trim();
      filtered = filtered.filter(a => 
        a.name?.toLowerCase().includes(searchLower) ||
        a.email?.toLowerCase().includes(searchLower) ||
        a.phone?.toLowerCase().includes(searchLower) ||
        a.business_name?.toLowerCase().includes(searchLower) ||
        a.business_type?.toLowerCase().includes(searchLower) ||
        a.message?.toLowerCase().includes(searchLower)
      );
    }
    
    // Filter by date range
    if (filters.dateFrom || filters.dateTo) {
      filtered = filtered.filter(a => {
        if (!a.created_at) return false;
        
        // Convert application date to Date object
        let applicationDate = a.created_at instanceof Date 
          ? new Date(a.created_at) 
          : a.created_at.toDate 
            ? a.created_at.toDate() 
            : new Date(a.created_at);
        
        // Create new Date objects to avoid mutation
        const dateFrom = filters.dateFrom ? new Date(filters.dateFrom + 'T00:00:00') : null;
        const dateTo = filters.dateTo ? new Date(filters.dateTo + 'T23:59:59') : null;
        
        // Normalize application date to start of day (local time)
        const applicationDateOnly = new Date(applicationDate.getFullYear(), applicationDate.getMonth(), applicationDate.getDate());
        
        // Normalize filter dates to start/end of day (local time)
        const dateFromOnly = dateFrom ? new Date(dateFrom.getFullYear(), dateFrom.getMonth(), dateFrom.getDate()) : null;
        const dateToOnly = dateTo ? new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate()) : null;
        
        // Compare dates (ignoring time)
        if (dateFromOnly && applicationDateOnly < dateFromOnly) return false;
        if (dateToOnly && applicationDateOnly > dateToOnly) return false;
        
        return true;
      });
    }
    
    return filtered;
  }, [membershipApplications, filters]);

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
            <div className="border-b border-gray-200 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
              <nav className="flex gap-2 flex-nowrap min-w-max md:min-w-0" aria-label="Tabs">
                <button
                  onClick={() => handleTabChange('contact')}
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
                  onClick={() => handleTabChange('membership')}
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
                {isSuperAdmin && (
                  <button
                    onClick={() => navigate('/admin/management')}
                    className="px-6 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FiUsers />
                      <span>Admin Management</span>
                    </div>
                  </button>
                )}
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
                      <div className="flex items-center gap-4">
                        {contactSubmissions.length > 0 && (
                          <p className="text-sm text-gray-600">
                            {filteredContactSubmissions.length} of {contactSubmissions.length} submission{contactSubmissions.length !== 1 ? 's' : ''}
                          </p>
                        )}
                        <ExportButton
                          data={filteredContactSubmissions}
                          type="contact"
                        />
                      </div>
                    </div>
                    <FilterBar
                      type="contact"
                      filters={filters}
                      onFilterChange={setFilters}
                    />
                    <SubmissionsList
                      submissions={filteredContactSubmissions}
                      type="contact"
                    />
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-900">
                        Membership Applications
                      </h2>
                      <div className="flex items-center gap-4">
                        {membershipApplications.length > 0 && (
                          <p className="text-sm text-gray-600">
                            {filteredMembershipApplications.length} of {membershipApplications.length} application{membershipApplications.length !== 1 ? 's' : ''}
                          </p>
                        )}
                        <ExportButton
                          data={filteredMembershipApplications}
                          type="membership"
                        />
                      </div>
                    </div>
                    <FilterBar
                      type="membership"
                      filters={filters}
                      onFilterChange={setFilters}
                    />
                    <SubmissionsList
                      submissions={filteredMembershipApplications}
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

