import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Container, Section, SEO } from '../components/common';
import { MemberCard } from '../components/members';
import { FiUsers } from 'react-icons/fi';
import {
  useMembers,
  useMemberSectors,
  useFilteredMembers,
} from '../hooks/useMembers';
import Button from '../components/common/Button';
import ContactSection from '../components/home/ContactSection';

export default function Portfolio() {
  const allMembers = useMembers();
  const sectors = useMemberSectors();
  const [activeSector, setActiveSector] = useState('all');

  // Filter members by sector
  const filteredMembers = useFilteredMembers({
    sector: activeSector,
  });

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
      transition: {
        duration: 0.4,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.3,
      },
    },
  };

  return (
    <>
      <SEO
        title="Our Members"
        description={`Meet our ${filteredMembers.length} member${filteredMembers.length !== 1 ? 's' : ''} from various business sectors across South Africa.`}
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
                Our Members
              </motion.h1>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed"
              >
                Meet our diverse community of business professionals and entrepreneurs
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

      <Section className="py-12">
      <Container>

        {/* Sector Filter Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-3 mb-12"
        >
          <Button
            variant={activeSector === 'all' ? 'primary' : 'ghost'}
            size="md"
            onClick={() => setActiveSector('all')}
            className="transition-all"
          >
            All
          </Button>
          {sectors.map((sector) => (
            <Button
              key={sector}
              variant={activeSector === sector ? 'primary' : 'ghost'}
              size="md"
              onClick={() => setActiveSector(sector)}
              className="transition-all"
            >
              {sector}
            </Button>
          ))}
        </motion.div>

        {/* Results Count */}
        {filteredMembers.length > 0 && (
          <div className="text-center mb-8 text-gray-600">
            Showing {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
            {activeSector !== 'all' && ` in ${activeSector}`}
          </div>
        )}

        {/* Members Grid */}
        {filteredMembers.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="wait">
              {filteredMembers.map((member) => (
                <motion.div
                  key={member.id}
                  variants={itemVariants}
                  layout
                  exit="exit"
                  className="flex"
                >
                  <MemberCard member={member} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <p className="text-xl text-gray-600 mb-4">
              No members found{activeSector !== 'all' ? ` in ${activeSector}` : ''}
            </p>
            {activeSector !== 'all' && (
              <Button
                variant="outline"
                onClick={() => setActiveSector('all')}
              >
                Show All Members
              </Button>
            )}
          </motion.div>
        )}
      </Container>
    </Section>

      {/* Contact Section */}
      <ContactSection />
    </>
  );
}
