import { Container, Section, SEO } from '../../components/common';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAdminManagement } from '../../hooks/useAdminManagement';
import { Navigate } from 'react-router-dom';
import Loading from '../../components/common/Loading';
import { FiAlertCircle, FiMail, FiArrowRight } from 'react-icons/fi';

export default function AdminApply() {
  const { currentUser, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminManagement();

  if (authLoading || adminLoading) {
    return <Loading fullScreen text="Loading..." />;
  }

  // If not authenticated, redirect to login
  if (!currentUser) {
    return <Navigate to="/admin/login" replace />;
  }

  // If already an admin, redirect to dashboard
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <>
      <SEO
        title="Admin Applications Deprecated"
        description="Admin access is now granted via invitation only"
        noindex={true}
      />
      <Section bgColor="gray-50" padding="xl">
        <Container maxWidth="2xl">
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            {/* Deprecation Notice */}
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <FiAlertCircle className="w-6 h-6 text-amber-600" />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Admin Applications No Longer Accepted
                </h2>
                <p className="text-gray-600 text-lg">
                  Admin access is now granted via invitation only for improved security.
                </p>
              </div>
            </div>

            {/* Information Section */}
            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <FiMail className="w-5 h-5" />
                How to Get Admin Access
              </h3>
              <div className="space-y-3 text-blue-800">
                <p>
                  To become an administrator, you must be invited by an existing administrator.
                  The invitation system ensures better security and control over who has access to
                  administrative features.
                </p>
                <div className="bg-white rounded-lg p-4 mt-4">
                  <p className="font-medium text-blue-900 mb-2">Steps to request access:</p>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Contact an existing administrator via email or phone</li>
                    <li>Explain why you need administrative access</li>
                    <li>Wait for the administrator to send you an invitation link</li>
                    <li>Click the invitation link and complete your registration</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Need Help?
              </h3>
              <p className="text-gray-600 mb-4">
                If you believe you should have administrative access, please contact us through
                our contact page or reach out to an existing administrator directly.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  <FiMail className="w-5 h-5" />
                  <span>Contact Us</span>
                  <FiArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  Return to Home
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

