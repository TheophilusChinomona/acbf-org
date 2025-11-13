import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiShield, FiUserPlus } from 'react-icons/fi';
import { Container, Section, SEO } from '../../components/common';
import MemberRegisterForm from '../../components/auth/MemberRegisterForm';

export default function Register() {
  const { applicationId } = useParams();

  const pageContent = useMemo(() => {
    if (applicationId) {
      return {
        title: 'Complete Your Membership Registration',
        description: 'Create your ACBF member account using the details from your membership application.',
        helper: 'Your application details are pre-filled. Simply create a secure password to access the member portal once approved.',
      };
    }

    return {
      title: 'Create Your ACBF Account',
      description: 'Register for an ACBF member account to access exclusive member resources and updates.',
      helper: 'If you have already submitted a membership application, use the link from your confirmation email to pre-fill your details.',
    };
  }, [applicationId]);

  const seoUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/register${applicationId ? `/${applicationId}` : ''}`
    : '';

  return (
    <>
      <SEO
        title="Member Registration"
        description={pageContent.description}
        url={seoUrl}
      />

      <Section bgColor="gray" padding="lg">
        <Container className="max-w-4xl">
          <div className="bg-white shadow-xl border border-gray-200 rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-10 text-white">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <FiUserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-semibold">{pageContent.title}</h1>
                  <p className="mt-3 text-white/80 text-sm md:text-base">
                    {pageContent.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-8 space-y-6">
              <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
                <FiShield className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium text-blue-900">Secure Registration</p>
                  <p className="mt-1">{pageContent.helper}</p>
                </div>
              </div>

              {!applicationId && (
                <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="font-medium text-gray-900 mb-1">Already applied for membership?</p>
                  <p>
                    Use the registration link sent to your email after submitting your application to ensure your account is linked correctly.
                  </p>
                </div>
              )}

              <MemberRegisterForm applicationId={applicationId || null} />

              <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t border-gray-200">
                <Link to="/becoming-a-member" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium">
                  <FiArrowLeft className="h-4 w-4" />
                  Back to membership info
                </Link>
                <p>
                  Need help?{' '}
                  <Link to="/contact" className="text-primary hover:text-primary/80 font-medium">
                    Contact us
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

