import { useMemberManagement } from '../../hooks/useMemberManagement';
import { Container, Section, SEO, Loading } from '../../components/common';
import { FiSettings, FiTrendingUp, FiAward, FiUsers } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';

export default function MemberDashboard() {
  const {
    currentMember,
    memberProfileLoading,
    memberProfileError,
  } = useMemberManagement();

  if (memberProfileLoading) {
    return <Loading fullScreen text="Loading your dashboard..." />;
  }

  if (memberProfileError) {
    return (
      <Section bgColor="gray" padding="lg">
        <Container className="max-w-4xl">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-800">
            <h2 className="text-lg font-semibold mb-2">Unable to Load Dashboard</h2>
            <p>{memberProfileError}</p>
          </div>
        </Container>
      </Section>
    );
  }

  const memberName = currentMember?.name?.split(' ')[0] || 'Member';

  return (
    <>
      <SEO
        title="Member Dashboard"
        description="Your ACBF member dashboard - Access your profile, resources, and community features."
        url={`${typeof window !== 'undefined' ? window.location.origin : ''}/member/dashboard`}
        noindex
      />

      <Section bgColor="gray" padding="lg">
        <Container className="max-w-5xl space-y-8">
          {/* Welcome Header */}
          <header className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <HiSparkles className="w-8 h-8 text-primary animate-pulse" aria-hidden="true" />
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                Welcome back, {memberName}!
              </h1>
              <HiSparkles className="w-8 h-8 text-primary animate-pulse" aria-hidden="true" />
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Your personalized member dashboard is currently under construction.
            </p>
          </header>

          {/* Coming Soon Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-primary-light rounded-2xl p-8 md:p-12 text-center shadow-lg">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full mb-4">
                <FiSettings className="w-10 h-10 text-white animate-spin" style={{ animationDuration: '3s' }} aria-hidden="true" />
              </div>

              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                We're Building Something Great!
              </h2>

              <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                Our team is hard at work creating an exceptional member experience for you.
                Your dashboard will soon include powerful tools and resources to help you
                connect, grow, and succeed.
              </p>

              <div className="pt-4">
                <span className="inline-flex items-center gap-2 px-6 py-3 bg-white/80 backdrop-blur rounded-full text-sm font-medium text-gray-700 border border-gray-200">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </span>
                  Coming Soon
                </span>
              </div>
            </div>
          </div>

          {/* Features Preview */}
          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FiTrendingUp className="w-6 h-6 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Analytics & Insights</h3>
                  <p className="text-sm text-gray-600">
                    Track your engagement, contributions, and impact within the community.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <FiUsers className="w-6 h-6 text-secondary" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Networking</h3>
                  <p className="text-sm text-gray-600">
                    Connect with fellow members and expand your professional network.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-secondary-light rounded-lg flex items-center justify-center">
                  <FiAward className="w-6 h-6 text-secondary-light" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Resources & Tools</h3>
                  <p className="text-sm text-gray-600">
                    Access exclusive content, tools, and learning materials for members.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Support Section */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Need Assistance?
            </h3>
            <p className="text-gray-600 mb-4">
              Our team is here to help. If you have questions or need support, don't hesitate to reach out.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-medium rounded-lg hover:from-primary-dark hover:to-secondary-dark transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 shadow-md hover:shadow-lg"
            >
              Contact Support
            </a>
          </div>
        </Container>
      </Section>
    </>
  );
}
