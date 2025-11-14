import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiMail,
  FiUsers,
} from 'react-icons/fi';
import { Container, Section, SEO } from '../../components/common';
import AdminInviteAcceptanceForm from '../../components/auth/AdminInviteForm';
import { useAdminInvitations } from '../../hooks/useAdminInvitations';
import { isInvitationExpired } from '../../utils/invitationToken';

export default function Invite() {
  const { token } = useParams();
  const navigate = useNavigate();

  const { getInvitationByToken } = useAdminInvitations();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invitation, setInvitation] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchInvitation = async () => {
      if (!token) {
        setError('Invitation token is missing.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const invitationData = await getInvitationByToken(token);

        if (!invitationData) {
          throw new Error('Invitation not found. It may have been used or revoked.');
        }

        const expired = invitationData.expires_at
          ? isInvitationExpired(new Date(invitationData.expires_at))
          : false;

        if (isMounted) {
          setInvitation(invitationData);
          setIsExpired(expired);

          if (invitationData.status !== 'pending') {
            setError('This invitation has already been used or is no longer active.');
          } else if (expired) {
            setError('This invitation has expired. Please contact the administrator for a new invite.');
          }
        }
      } catch (fetchError) {
        console.error('Failed to load invitation:', fetchError);
        if (isMounted) {
          setInvitation(null);
          setError(fetchError.message || 'Unable to load invitation details.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchInvitation();

    return () => {
      isMounted = false;
    };
  }, [getInvitationByToken, token]);

  const handleAccepted = useCallback(() => {
    setAccepted(true);
    setTimeout(() => {
      navigate('/admin', { replace: true });
    }, 2000);
  }, [navigate]);

  const seoTitle = 'Admin Invitation';
  const seoUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return '';
    }
    return `${window.location.origin}/invite/${token || ''}`;
  }, [token]);

  return (
    <>
      <SEO
        title={seoTitle}
        description="Accept your ACBF administrator invitation to gain access to the admin dashboard."
        url={seoUrl}
      />

      <Section bgColor="gray" padding="lg">
        <Container className="max-w-4xl">
          <div className="mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back to homepage
            </Link>
          </div>

          <div className="bg-white shadow-xl border border-gray-200 rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-secondary-light px-6 py-10 text-white">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <FiUsers className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-semibold">Administrator Invitation</h1>
                  <p className="mt-3 text-white/80 text-sm md:text-base">
                    Use the secure form below to create your administrator account. This invitation is exclusive to the email address provided.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-8 space-y-6">
              {loading && (
                <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-3 text-gray-600">
                  <svg
                    className="animate-spin h-5 w-5 text-primary"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Verifying invitation details…</span>
                </div>
              )}

              {!loading && error && (
                <div className="p-6 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-sm text-red-700">
                  <FiAlertCircle className="text-lg flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900">Unable to proceed</p>
                    <p>{error}</p>
                    <p className="mt-3 text-xs text-red-600">
                      Need help?{' '}
                      <Link to="/contact" className="underline font-medium">
                        Contact the ACBF team
                      </Link>{' '}
                      for assistance.
                    </p>
                  </div>
                </div>
              )}

              {!loading && !error && invitation && (
                <AdminInviteAcceptanceForm
                  token={token}
                  invitation={invitation}
                  onAccepted={handleAccepted}
                />
              )}

              {accepted && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3 text-sm text-green-700">
                  <FiCheckCircle className="text-lg flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900">Redirecting to admin dashboard…</p>
                    <p>You will be redirected automatically. If not, please click the button below.</p>
                    <div className="mt-3">
                      <Link
                        to="/admin"
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80"
                      >
                        Go to admin dashboard
                        <FiMail className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {!loading && invitation && invitation.status === 'pending' && !isExpired && (
                <div className="p-4 bg-accent border border-primary-light rounded-lg flex items-start gap-3 text-xs text-primary-dark">
                  <FiClock className="text-sm flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-secondary-dark">Need more time?</p>
                    <p>
                      If you are unable to complete this now, keep this page bookmarked. The invitation will remain valid until it expires.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}


