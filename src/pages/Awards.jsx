import { motion } from 'framer-motion';
import SEO from '../components/common/SEO';
import Container from '../components/common/Container';
import AwardsBallot from '../components/awards/AwardsBallot';
import { formatVotingDeadline } from '../utils/awardsVoting';
import { FiAward, FiStar, FiTrendingUp } from 'react-icons/fi';

export default function Awards() {
  const deadlineLabel = formatVotingDeadline();

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

  return (
    <>
      <SEO
        title="Awards Voting & Recognition"
        description="Vote for the official 2026 ACBF Awards nominees. Recognising excellence in entrepreneurship, innovation, leadership, and industry achievement across nine African countries. Voting closes 19 November 2026, 4:00 pm SAST."
        keywords="ACBF awards, awards voting, business awards, leadership recognition, entrepreneur awards, excellence awards, business recognition"
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
              The official 2026 nominees have been announced. Vote for the businesses and leaders
              who have demonstrated exceptional contributions to their industries, communities, and
              the broader business ecosystem.
            </p>
            <p className="mt-6 inline-flex items-center rounded-full bg-white/15 px-4 py-2 text-white font-medium">
              Voting closes {deadlineLabel}
            </p>
          </motion.div>
        </Container>
      </section>

      {/* Ballot Section */}
      <section className="py-16 bg-white">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-xl border border-gray-200 bg-gray-50 p-4 md:p-8"
          >
            <AwardsBallot />
          </motion.div>
        </Container>
      </section>

      {/* Why Vote Section */}
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
              Why Vote?
            </h2>
            <p className="text-lg text-gray-600">
              Public votes decide the winners. Every vote helps recognise the businesses and leaders
              raising the standard across the continent.
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
                title: 'Recognise Excellence',
                description: 'Back the nominees who have made significant contributions to their industries and communities.',
              },
              {
                icon: FiStar,
                title: 'Support Your Industry',
                description: 'Champion the people and businesses you know first-hand, from education to logistics and technology.',
              },
              {
                icon: FiTrendingUp,
                title: 'Celebrate Achievement',
                description: 'Acknowledge the hard work, innovation, and dedication that drives business growth.',
              },
            ].map((item) => (
              <motion.div
                key={item.title}
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
                question: 'Who can vote?',
                answer: 'Everyone. Voting is open to the public with no membership, login, or email verification required. Sharing your name and email is optional, and you can vote anonymously.',
              },
              {
                question: 'How many times can I vote?',
                answer: 'You can vote once in each award category. All countries compete on one ballot per category, and every browser is limited to one vote per category.',
              },
              {
                question: 'When does voting close?',
                answer: `Voting closes on ${deadlineLabel}. Votes submitted at or after that time are not counted, even if the page was already open.`,
              },
              {
                question: 'Can I change my vote?',
                answer: 'No. Votes are final for this launch, so please check your selection before confirming.',
              },
              {
                question: 'Is there a fee to vote?',
                answer: 'No, voting is completely free. We believe in recognising excellence without financial barriers.',
              },
              {
                question: 'When will the results be announced?',
                answer: 'Vote totals stay private to the awards committee until the results are announced at the ceremony. Public leaderboards are not published.',
              },
            ].map((faq) => (
              <motion.div
                key={faq.question}
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
          description: 'Annual awards recognising excellence in business leadership, innovation, and achievement across multiple industries.',
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
