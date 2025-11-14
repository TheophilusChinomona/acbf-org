import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Container, Section, SEO } from '../../components/common';
import LoginForm from '../../components/auth/LoginForm';
import { useAuth } from '../../hooks/useAuth';
import { FiShield, FiLock } from 'react-icons/fi';

export default function AdminLogin() {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to admin dashboard if already logged in
  useEffect(() => {
    if (!loading && currentUser) {
      // If there's a 'from' location (redirect after login), go there
      // Otherwise, go to admin dashboard
      const from = location.state?.from?.pathname || '/admin';
      navigate(from, { replace: true });
    }
  }, [currentUser, loading, navigate, location]);

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If already logged in, don't show login form (will redirect)
  if (currentUser) {
    return null;
  }

  return (
    <>
      <SEO
        title="Admin Login"
        description="Admin login page for ACBF RSA website administration"
        url={`${typeof window !== 'undefined' ? window.location.origin : ''}/admin/login`}
        noindex={true}
      />

      {/* Hero Section with Gradient Background */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-secondary-dark via-secondary to-secondary-light py-12 md:py-16 lg:py-20 min-h-[40vh]">
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        </div>

        <Container>
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-4xl mx-auto"
            >
              {/* Icon */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full mb-8 border-2 border-white/30"
              >
                <FiShield className="w-12 h-12 text-white" />
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
              >
                Admin Login
              </motion.h1>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed"
              >
                Sign in to access the admin dashboard
              </motion.p>
            </motion.div>
          </div>
        </Container>

        {/* Bottom Wave Decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-12 text-white" viewBox="0 0 1200 120" preserveAspectRatio="none" fill="none">
            <path d="M0,0 C300,120 900,0 1200,120 L1200,120 L0,120 Z" fill="white"></path>
          </svg>
        </div>
      </section>

      {/* Login Form Section */}
      <Section bgColor="white" padding="xl">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-md mx-auto"
          >
            {/* Security Notice */}
            <div className="mb-8 p-4 bg-accent border border-primary-light rounded-lg flex items-start gap-3">
              <FiLock className="text-primary text-xl flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-secondary-dark mb-1">Secure Access</h3>
                <p className="text-sm text-primary-dark">
                  This is a restricted area. Only authorized administrators can access this section.
                </p>
              </div>
            </div>

            {/* Login Form Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
              <LoginForm />
            </div>
          </motion.div>
        </Container>
      </Section>
    </>
  );
}

