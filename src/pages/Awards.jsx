import { motion } from 'framer-motion';
import SEO from '../components/common/SEO';
import Container from '../components/common/Container';
import AwardsNominationForm from '../components/forms/AwardsNominationForm';
import awardCategories from '../data/award-categories.json';
import * as FiIcons from 'react-icons/fi';
import { FiAward, FiStar, FiTrendingUp } from 'react-icons/fi';

export default function Awards() {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  // Get icon component dynamically
  const getIcon = (iconName) => {
    const Icon = FiIcons[iconName] || FiAward;
    return Icon;
  };

  return (
    <>
      <SEO
        title="Awards & Recognition"
        description="Nominate outstanding business leaders and organizations for ACBF Awards. Recognizing excellence in entrepreneurship, innovation, leadership, and industry achievement."
        keywords="ACBF awards, business awards, leadership recognition, entrepreneur awards, excellence awards, business recognition"
        ogType="website"
      />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary-dark to-secondary py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        <Container>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full mb-6"
            >
              <FiAward className="w-10 h-10 text-white" />
            </motion.div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              ACBF Awards & Recognition
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
              Celebrating Excellence in Business Leadership, Innovation, and Achievement
            </p>
            <p className="text-lg text-white/80 max-w-3xl mx-auto">
              Nominate outstanding individuals and organizations who have demonstrated exceptional contributions
              to their industries, communities, and the broader business ecosystem.
            </p>
          </motion.div>
        </Container>
      </section>

      {/* Why Nominate Section */}
      <section className="py-16 bg-gray-50">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Nominate?
            </h2>
            <p className="text-lg text-gray-600">
              Recognition drives excellence. By nominating deserving individuals and organizations,
              you help celebrate achievements and inspire others to reach new heights.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: FiAward,
                title: 'Recognize Excellence',
                description: 'Honor those who have made significant contributions to their industries and communities.',
              },
              {
                icon: FiStar,
                title: 'Inspire Others',
                description: 'Showcase success stories that motivate and encourage the next generation of leaders.',
              },
              {
                icon: FiTrendingUp,
                title: 'Celebrate Achievement',
                description: 'Acknowledge hard work, innovation, and dedication that drives business growth.',
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </section>

      {/* Award Categories Section */}
      <section className="py-16 bg-white">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Award Categories
            </h2>
            <p className="text-lg text-gray-600">
              We recognize excellence across {awardCategories.length} categories spanning diverse industries and achievements.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {awardCategories.map((category, index) => {
              const IconComponent = getIcon(category.icon);
              return (
                <motion.div
                  key={category.id}
                  variants={itemVariants}
                  className="group bg-gray-50 hover:bg-primary/5 rounded-lg p-4 transition-all hover:shadow-sm border border-gray-200 hover:border-primary/20"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="inline-flex items-center justify-center w-10 h-10 bg-white rounded-lg group-hover:bg-primary/10 transition-colors">
                        <IconComponent className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1 text-sm leading-tight">
                        {category.name}
                      </h3>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {category.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </Container>
      </section>

      {/* Nomination Form Section */}
      <section className="py-16 bg-gray-50">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Submit Your Nomination
            </h2>
            <p className="text-lg text-gray-600">
              Know someone deserving of recognition? Complete the form below to submit your nomination.
              All submissions are reviewed by our awards committee.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <AwardsNominationForm />
          </motion.div>
        </Container>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="max-w-4xl mx-auto space-y-6"
          >
            {[
              {
                question: 'Who can submit a nomination?',
                answer: 'Anyone can submit a nomination! We welcome submissions from colleagues, clients, business partners, peers, and industry associates. Self-nominations are also accepted for certain categories.',
              },
              {
                question: 'When are nominations reviewed?',
                answer: 'Nominations are accepted year-round and reviewed on a rolling basis. Our awards committee evaluates submissions quarterly and announces winners at our annual awards ceremony.',
              },
              {
                question: 'Can I nominate the same person for multiple awards?',
                answer: 'Yes, you can submit separate nominations for the same individual or organization across different categories. Each nomination will be evaluated independently.',
              },
              {
                question: 'What happens after I submit a nomination?',
                answer: 'You will receive a confirmation email upon successful submission. Our awards committee will review all nominations and may contact nominators for additional information. Winners will be notified directly and announced publicly.',
              },
              {
                question: 'Is there a fee to submit a nomination?',
                answer: 'No, submitting a nomination is completely free. We believe in recognizing excellence without financial barriers.',
              },
            ].map((faq, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-gray-50 rounded-lg p-6 hover:shadow-sm transition-shadow"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {faq.question}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {faq.answer}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </section>

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Event',
          name: 'ACBF Awards & Recognition Program',
          description: 'Annual awards recognizing excellence in business leadership, innovation, and achievement across multiple industries.',
          organizer: {
            '@type': 'Organization',
            name: 'ACBF',
            url: 'https://acbf.org.za',
          },
          eventStatus: 'https://schema.org/EventScheduled',
          eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'ZAR',
            availability: 'https://schema.org/InStock',
            url: 'https://acbf.org.za/awards',
          },
        })}
      </script>
    </>
  );
}
