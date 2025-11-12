import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Container, Section, Button } from '../common';
import { MemberCard } from '../members';
import { useMembers } from '../../hooks/useMembers';

/**
 * Portfolio Preview Section Component
 * Shows latest members on the home page
 */
export default function PortfolioPreview() {
  const allMembers = useMembers();
  const members = allMembers.slice(0, 6);

  if (!members || members.length === 0) {
    return null;
  }

  return (
    <Section id="portfolio-preview" padding="lg" bgColor="gray">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Our Members
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Meet some of our valued members from various business sectors
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {members.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="flex"
            >
              <MemberCard member={member} />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <Link to="/members">
            <Button variant="outline" size="lg">
              View All Members
            </Button>
          </Link>
        </motion.div>
      </Container>
    </Section>
  );
}

