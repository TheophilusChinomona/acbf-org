import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { FiMail, FiPhone, FiInfo, FiClipboard } from 'react-icons/fi';
import { Container, Section, SEO, Loading } from '../../components/common';
import ApprovalStatus from '../../components/member/ApprovalStatus';
import { db } from '../../lib/firebase';
import { useMemberManagement } from '../../hooks/useMemberManagement';

export default function PendingApproval() {
  const {
    currentMember,
    memberProfileLoading,
    memberProfileError,
  } = useMemberManagement();

  const [applicationDetails, setApplicationDetails] = useState(null);
  const [applicationLoading, setApplicationLoading] = useState(false);
  const [applicationError, setApplicationError] = useState(null);

  useEffect(() => {
    const applicationId = currentMember?.member_application_id;
    if (!applicationId) {
      setApplicationDetails(null);
      setApplicationError(null);
      setApplicationLoading(false);
      return;
    }

    let isMounted = true;
    const fetchApplication = async () => {
      setApplicationLoading(true);
      setApplicationError(null);
      try {
        const applicationRef = doc(db, 'membership_applications', applicationId);
        const applicationSnapshot = await getDoc(applicationRef);

        if (!applicationSnapshot.exists()) {
          throw new Error('We could not find your membership application details.');
        }

        if (isMounted) {
          setApplicationDetails({
            id: applicationSnapshot.id,
            ...applicationSnapshot.data(),
          });
        }
      } catch (error) {
        console.error('Error loading membership application:', error);
        if (isMounted) {
          setApplicationError(error.message || 'Failed to load your membership application.');
        }
      } finally {
        if (isMounted) {
          setApplicationLoading(false);
        }
      }
    };

    fetchApplication();

    return () => {
      isMounted = false;
    };
  }, [currentMember?.member_application_id]);

  const status = currentMember?.status ?? null;

  return (
    <>
      <SEO
        title="Membership Approval Status"
        description="Check the status of your ACBF membership application and learn about next steps."
        url={`${typeof window !== 'undefined' ? window.location.origin : ''}/member/pending`}
        noindex
      />

      <Section bgColor="gray" padding="lg">
        <Container className="max-w-5xl space-y-8 md:space-y-10">
          <header className="space-y-3 text-center md:text-left">
            <p className="text-xs md:text-sm font-semibold uppercase tracking-wider text-primary">
              Membership Portal
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Membership Approval Status
            </h1>
            <p className="text-gray-600 text-base md:text-lg max-w-2xl">
              Track the progress of your application and find resources to help while you wait for approval.
            </p>
          </header>

          {memberProfileLoading ? (
            <Loading text="Loading your membership status..." />
          ) : memberProfileError ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 md:p-6 text-red-800">
              <h2 className="text-lg font-semibold mb-2">Unable to Load Profile</h2>
              <p className="text-sm md:text-base">{memberProfileError}</p>
            </div>
          ) : (
            <ApprovalStatus
              status={status}
              updatedAt={currentMember?.approved_at || currentMember?.rejected_at || currentMember?.updated_at}
              rejectionReason={currentMember?.rejection_reason}
            />
          )}

          <section className="grid gap-6 md:gap-8 md:grid-cols-2">
            <div className="space-y-4 p-5 md:p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <FiInfo className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">What happens next?</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Our admin team reviews every application carefully. You’ll receive updates via email. Approved members
                    gain access to the member portal and resources immediately.
                  </p>
                </div>
              </div>
              <ul className="space-y-3 text-sm text-gray-700">
                <li>• Keep an eye on your inbox for important updates.</li>
                <li>• Reach out if any of your contact details change.</li>
                <li>• Expect reviews to take 5–7 business days in most cases.</li>
              </ul>
            </div>

            <div className="space-y-4 p-5 md:p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <FiClipboard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Need assistance?</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Our team is here to help with questions about your application or the approval timeline.
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <p className="flex items-center gap-2">
                  <FiMail className="text-primary" />
                  <span>support@acbfrsa.org.za</span>
                </p>
                <p className="flex items-center gap-2">
                  <FiPhone className="text-primary" />
                  <span>+27 12 345 6789</span>
                </p>
              </div>
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 md:p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Your Application Details</h2>

            {applicationLoading ? (
              <Loading text="Loading application details..." />
            ) : applicationError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                {applicationError}
              </div>
            ) : applicationDetails ? (
              <div className="grid gap-4 md:grid-cols-2 text-sm md:text-base text-gray-700">
                <div>
                  <p className="font-medium text-gray-900">Full Name</p>
                  <p>{applicationDetails.name || 'Not provided'}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Email Address</p>
                  <p>{applicationDetails.email || 'Not provided'}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Phone Number</p>
                  <p>{applicationDetails.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Business Name</p>
                  <p>{applicationDetails.business_name || 'Not provided'}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Business Type</p>
                  <p>{applicationDetails.business_type || 'Not provided'}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Submitted On</p>
                  <p>
                    {applicationDetails.created_at?.toDate
                      ? applicationDetails.created_at.toDate().toLocaleString()
                      : applicationDetails.created_at
                        ? new Date(applicationDetails.created_at).toLocaleString()
                        : 'Not available'}
                  </p>
                </div>
                {applicationDetails.message && (
                  <div className="md:col-span-2">
                    <p className="font-medium text-gray-900">Additional Information</p>
                    <p className="mt-1 whitespace-pre-wrap">{applicationDetails.message}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm md:text-base text-gray-600">
                We couldn’t find any linked membership application details. If you believe this is an error, please contact support.
              </p>
            )}
          </section>
        </Container>
      </Section>
    </>
  );
}


