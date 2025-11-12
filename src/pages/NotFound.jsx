import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHome, FiSearch, FiArrowLeft } from 'react-icons/fi';
import { Container, Section, Button, SEO } from '../components/common';

export default function NotFound() {
  return (
    <>
      <SEO
        title="404 - Page Not Found"
        description="The page you are looking for does not exist or has been moved."
      />
      <Section padding="xl">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto"
          >
            {/* 404 Animation */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-8"
            >
              <h1 className="text-9xl font-bold text-primary mb-4">404</h1>
            </motion.div>

            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Page Not Found
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              The page you are looking for does not exist or has been moved.
              <br />
              Please check the URL or use the navigation menu to find what you're looking for.
            </p>

            {/* Quick Links */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link to="/">
                <Button variant="primary" size="lg" className="flex items-center justify-center gap-2 w-full sm:w-auto">
                  <FiHome />
                  Go Home
                </Button>
              </Link>
              <Link to="/blog">
                <Button variant="outline" size="lg" className="flex items-center justify-center gap-2 w-full sm:w-auto">
                  <FiSearch />
                  Browse Blog
                </Button>
              </Link>
              <button
                onClick={() => window.history.back()}
                className="flex items-center justify-center gap-2 px-6 py-3 text-gray-700 hover:text-primary transition-colors"
              >
                <FiArrowLeft />
                Go Back
              </button>
            </div>

            {/* Popular Links */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-4">Popular Pages:</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/about" className="text-primary hover:underline text-sm">
                  About Us
                </Link>
                <Link to="/members" className="text-primary hover:underline text-sm">
                  Members
                </Link>
                <Link to="/contact" className="text-primary hover:underline text-sm">
                  Contact
                </Link>
                <Link to="/search" className="text-primary hover:underline text-sm">
                  Search
                </Link>
              </div>
            </div>
          </motion.div>
        </Container>
      </Section>
    </>
  );
}

