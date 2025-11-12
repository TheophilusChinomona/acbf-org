import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Container, Section, Button } from '../common';
import { openContactModal } from '../modals';

/**
 * CTA (Call-to-Action) Section Component
 * Prominent call-to-action section
 */
export default function CTA() {
  return (
    <Section id="cta" padding="xl" bgColor="primary">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Make a Difference?
          </h2>
          <p className="text-lg md:text-xl text-white/90 mb-8">
            Join us in our mission to create positive change. Whether you want to volunteer, 
            partner with us, or learn more about our programs, we'd love to hear from you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="ghost" 
              size="lg" 
              className="!bg-white !text-primary hover:!bg-gray-100"
              onClick={openContactModal}
            >
              Get In Touch
            </Button>
            <Link to="/about">
              <Button variant="ghost" size="lg" className="!border-2 !border-white !text-white hover:!bg-white hover:!text-primary">
                Learn More
              </Button>
            </Link>
          </div>
        </motion.div>
      </Container>
    </Section>
  );
}

