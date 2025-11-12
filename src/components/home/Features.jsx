import { motion } from 'framer-motion';
import { Container, Section, Card } from '../common';
import { HiLightBulb, HiUsers, HiGlobeAlt, HiHeart } from 'react-icons/hi';

/**
 * Features Section Component
 * Displays key features/services in a grid layout
 */
export default function Features() {
  const features = [
    {
      id: 1,
      icon: HiLightBulb,
      title: "Innovation",
      description: "We bring innovative solutions to address community challenges and create lasting impact."
    },
    {
      id: 2,
      icon: HiUsers,
      title: "Community Focus",
      description: "Our programs are designed with the community at the heart of everything we do."
    },
    {
      id: 3,
      icon: HiGlobeAlt,
      title: "Global Reach",
      description: "Connecting communities locally and globally to share knowledge and resources."
    },
    {
      id: 4,
      icon: HiHeart,
      title: "Dedication",
      description: "Committed to making a positive difference through dedicated service and support."
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6
      }
    }
  };

  return (
    <Section id="features" padding="lg" bgColor="gray">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            What We Do
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our core values and commitments that drive our mission forward
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div key={feature.id} variants={itemVariants}>
                <Card hover className="h-full text-center p-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </Container>
    </Section>
  );
}

