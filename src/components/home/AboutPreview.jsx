import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Container, Section, Button, Image } from '../common';

/**
 * About Preview Section Component
 * Brief introduction about the organization
 */
export default function AboutPreview() {
  const navigate = useNavigate();

  const handleReadMore = () => {
    navigate('/about');
  };

  return (
    <Section id="about-preview" padding="lg">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="order-2 lg:order-1"
          >
            <div className="relative rounded-lg overflow-hidden shadow-xl">
              <Image
                src="/assets/images/about-preview.svg"
                alt="About ACBF RSA"
                className="w-full h-[400px] object-cover"
              />
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="order-1 lg:order-2"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              About ACBF RSA
            </h2>
            <div className="prose prose-lg max-w-none mb-6 text-gray-600">
              <p className="text-lg mb-4">
                Started in 1994 by Archbishop Dr Ezekiel H. Guti out of a burden after observing many Christian business people struggling and failing to run their businesses and losing properties including houses after failing to pay back loans. Many Christian business people were going to him seeking counselling on family relationships that were being negatively affected by failing businesses.
              </p>
            </div>
            <Button variant="primary" size="lg" onClick={handleReadMore}>
              Read More
            </Button>
          </motion.div>
        </div>
      </Container>
    </Section>
  );
}

