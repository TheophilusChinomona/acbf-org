import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Container, Section, SEO, Modal } from '../components/common';
import SignupForm from '../components/forms/SignupForm';
import SignupModal from '../components/modals/SignupModal';
import {
  FiUsers, FiRefreshCw, FiXCircle, FiFileText, FiUserCheck, FiAward,
  FiActivity, FiTrendingUp, FiBriefcase, FiTarget, FiZap, FiGlobe, FiCreditCard
} from 'react-icons/fi';

// Custom Rand Icon Component
const RandIcon = ({ className }) => (
  <span className={`font-bold ${className}`} style={{ fontFamily: 'Arial, sans-serif' }}>R</span>
);

export default function BecomingAMember() {
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);

  // Listen for custom event from navigation "Join Now" button
  useEffect(() => {
    const handleOpenModal = () => {
      setIsSignupModalOpen(true);
    };

    window.addEventListener('openBecomingAMemberModal', handleOpenModal);

    return () => {
      window.removeEventListener('openBecomingAMemberModal', handleOpenModal);
    };
  }, []);

  const membershipBenefits = [
    {
      icon: FiActivity,
      title: 'Networking Opportunities',
      description: 'Connect with like-minded business professionals, entrepreneurs, and industry leaders.',
      color: 'bg-accent border-primary-light',
      iconColor: 'text-primary',
    },
    {
      icon: FiTrendingUp,
      title: 'Business Growth',
      description: 'Access resources, mentorship, and opportunities to grow your business.',
      color: 'bg-green-50 border-green-200',
      iconColor: 'text-green-600',
    },
    {
      icon: FiBriefcase,
      title: 'Professional Development',
      description: 'Attend workshops, seminars, and training sessions to enhance your skills.',
      color: 'bg-purple-50 border-purple-200',
      iconColor: 'text-secondary-light',
    },
    {
      icon: FiTarget,
      title: 'Business Opportunities',
      description: 'Discover new business opportunities and partnerships within the fellowship.',
      color: 'bg-orange-50 border-orange-200',
      iconColor: 'text-orange-600',
    },
    {
      icon: FiZap,
      title: 'Exclusive Events',
      description: 'Get access to exclusive events, conferences, and business gatherings.',
      color: 'bg-yellow-50 border-yellow-200',
      iconColor: 'text-yellow-600',
    },
    {
      icon: FiGlobe,
      title: 'Community Impact',
      description: 'Be part of a community that makes a positive impact in the business world.',
      color: 'bg-indigo-50 border-indigo-200',
      iconColor: 'text-secondary',
    },
  ];

  const membershipInfo = [
    {
      icon: FiUsers,
      title: 'Who Can Join',
      content: 'Africa Christian Business Fellowship is for aspiring business people, and people already in business, and professionals such as accountants, lawyers etc. People are however, encouraged to start, and run their own businesses.',
      color: 'bg-accent border-primary-light',
      iconColor: 'text-primary',
    },
    {
      icon: RandIcon,
      title: 'Membership Eligibility & Fees',
      content: 'Membership shall be open to any business person who shall pay the prescribed membership fee. The Board shall determine from time to time the appropriate membership fee subscription. There shall be membership categories one which is by invitation Gold, Silver, Bronze, and Ordinary.',
      color: 'bg-green-50 border-green-200',
      iconColor: 'text-green-600',
    },
    {
      icon: FiRefreshCw,
      title: 'Membership Renewal',
      content: 'Membership shall be renewed at the beginning of each year.',
      color: 'bg-purple-50 border-purple-200',
      iconColor: 'text-secondary-light',
    },
    {
      icon: FiXCircle,
      title: 'Membership Termination',
      content: 'Membership shall be terminated by voluntary resignation, insanity, or if a member continues to lead an immoral life. The Board is empowered to terminate membership of a person after hearing representations from the person concerned.',
      color: 'bg-red-50 border-red-200',
      iconColor: 'text-red-600',
    },
    {
      icon: FiFileText,
      title: 'Board Member Resignation',
      content: 'Any member of the Board may resign by conveying written notice of his intention to the Board.',
      color: 'bg-orange-50 border-orange-200',
      iconColor: 'text-orange-600',
    },
    {
      icon: FiUserCheck,
      title: 'Board Member Qualifications',
      content: 'Any member of the Board who ceases to meet the qualification of a Board member, or is absent from three consecutive meetings of the Board without the permission of the Board without good cause shown to the Board, shall be deemed to have resigned from the Board.',
      color: 'bg-indigo-50 border-indigo-200',
      iconColor: 'text-secondary',
    },
    {
      icon: FiAward,
      title: 'President\'s Role',
      content: 'The President of ACBF shall be a member of all boards.',
      color: 'bg-yellow-50 border-yellow-200',
      iconColor: 'text-yellow-600',
    },
  ];

  return (
    <>
      <SEO
        title="Becoming a Member"
        description="Learn about membership opportunities with Africa Christian Business Fellowship. Open to business people, professionals, and aspiring entrepreneurs."
        url={`${typeof window !== 'undefined' ? window.location.origin : ''}/becoming-a-member`}
      />
      
      {/* Hero Section with Gradient Background */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-secondary-dark via-secondary to-secondary-light py-12 md:py-16 lg:py-20">
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
                <FiUsers className="w-12 h-12 text-white" />
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
              >
                Becoming a Member
              </motion.h1>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed"
              >
                Join Africa Christian Business Fellowship and connect with a community of business professionals, entrepreneurs, and aspiring business leaders.
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

      {/* Introduction Section - Enhanced with better spacing */}
      <Section bgColor="white" padding="lg">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 md:p-10 border-2 border-blue-100 shadow-sm -mt-12 relative z-10">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-6">
                  <FiUsers className="w-8 h-8 text-white" />
                </div>
                <p className="text-lg md:text-xl leading-relaxed text-gray-800">
                  <span className="font-bold text-gray-900">Africa Christian Business Fellowship</span> welcomes aspiring business people, established entrepreneurs, and professionals such as accountants and lawyers. We encourage everyone to start and run their own businesses while building a supportive community.
                </p>
              </div>
            </div>
          </motion.div>
        </Container>
      </Section>

      {/* Membership Benefits Section - Enhanced visual design */}
      <Section bgColor="gray" padding="xl">
        <Container>
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-7xl mx-auto"
          >
            <div className="text-center mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  Membership Benefits
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto mb-6 rounded-full"></div>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                  Join ACBF and unlock a world of opportunities for your business and professional growth
                </p>
              </motion.div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {membershipBenefits.map((benefit, index) => {
                const IconComponent = benefit.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                    className={`${benefit.color} rounded-2xl p-6 border-2 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group cursor-default`}
                  >
                    <div className="flex flex-col">
                      <div className={`flex-shrink-0 w-12 h-12 ${benefit.color.replace('-50', '-100')} rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-md`}>
                        <IconComponent className={`w-7 h-7 ${benefit.iconColor}`} />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-gray-800 transition-colors">
                        {benefit.title}
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm">
                        {benefit.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.article>
        </Container>
      </Section>

      {/* Membership Information Section - Better organization */}
      <Section bgColor="white" padding="xl">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-7xl mx-auto"
          >
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Membership Information
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto mb-6 rounded-full"></div>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Everything you need to know about joining and maintaining your ACBF membership
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 md:gap-6">
              {membershipInfo.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 + index * 0.1 }}
                    className={`${item.color} rounded-xl p-5 md:p-6 border-2 hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-12 h-12 ${item.color.replace('-50', '-100')} rounded-xl flex items-center justify-center shadow-md`}>
                        {item.icon === RandIcon ? (
                          <RandIcon className={`text-lg ${item.iconColor}`} />
                        ) : (
                          <IconComponent className={`w-7 h-7 ${item.iconColor}`} />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2">
                          {item.title}
                        </h3>
                        <p className="text-gray-700 leading-relaxed text-sm">
                          {item.content}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </Container>
      </Section>

      {/* Enhanced Call to Action Section */}
      <Section bgColor="gray" padding="xl">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-gradient-to-br from-primary via-primary-dark to-secondary rounded-3xl p-10 md:p-12 text-center text-white shadow-2xl relative overflow-hidden">
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
              
              <div className="relative z-10">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-6 border-2 border-white/30"
                >
                  <FiUsers className="w-10 h-10 text-white" />
                </motion.div>
                
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Ready to Join?
                </h2>
                <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto leading-relaxed">
                  Start your membership application today. Fill out the form below or contact us for more information.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <button
                    onClick={() => setIsSignupModalOpen(true)}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary font-bold rounded-xl hover:bg-accent transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-white/50 shadow-lg hover:shadow-xl hover:scale-105 transform"
                  >
                    <FiUsers className="w-5 h-5" />
                    Apply for Membership
                  </button>
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-transparent text-white border-2 border-white/80 font-bold rounded-xl hover:bg-white/10 hover:border-white transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-white/50"
                  >
                    Contact Us
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </Container>
      </Section>

      {/* Signup Modal */}
      <Modal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
        title="Membership Application"
        size="lg"
      >
        <SignupForm />
      </Modal>

      {/* Global Signup Modal (responds to openSignupModal event) */}
      <SignupModal />
    </>
  );
}

