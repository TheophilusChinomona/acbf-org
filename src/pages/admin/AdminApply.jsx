import { Container, Section, SEO } from '../../components/common';
import AdminApplicationForm from '../../components/admin/AdminApplicationForm';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAdminManagement } from '../../hooks/useAdminManagement';
import { Navigate } from 'react-router-dom';
import Loading from '../../components/common/Loading';

export default function AdminApply() {
  const { currentUser, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminManagement();
  const navigate = useNavigate();

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

  const handleSuccess = () => {
    // Optionally redirect or show message
    navigate('/admin', { replace: true });
  };

  return (
    <>
      <SEO
        title="Apply for Admin Access"
        description="Request administrative access to the ACBF admin dashboard"
        noindex={true}
      />
      <Section bgColor="gray-50" padding="xl">
        <Container maxWidth="2xl">
          <AdminApplicationForm onSuccess={handleSuccess} />
        </Container>
      </Section>
    </>
  );
}

