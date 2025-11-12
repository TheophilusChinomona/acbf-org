import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Container, Section, SEO } from '../components/common';
import { FiFileText } from 'react-icons/fi';
import NotFound from './NotFound';
import pagesData from '../data/pages.js';

/**
 * Dynamic Page Component
 * Renders pages from JSON data based on slug parameter
 */
export default function DynamicPage() {
  const { slug } = useParams();
  const page = pagesData.find(p => p.slug === slug);

  if (!page) {
    return <NotFound />;
  }

  const description = page.content
    ? page.content.replace(/<[^>]*>/g, '').substring(0, 160)
    : `Read about ${page.title}`;

  return (
    <>
      <SEO
        title={page.title}
        description={description}
        image={page.featuredImage}
        url={`${typeof window !== 'undefined' ? window.location.origin : ''}/page/${page.slug}`}
      />
      
      {/* Hero Section with Gradient Background */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 py-12 md:py-16 lg:py-20">
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
                <FiFileText className="w-12 h-12 text-white" />
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
              >
                {page.title}
              </motion.h1>
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

      <Section>
        <Container>
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            {/* Page Content */}
            <div
              className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-ul:text-gray-700 prose-ol:text-gray-700 prose-li:text-gray-700 prose-img:rounded-lg prose-img:shadow-lg"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          </motion.article>
        </Container>
      </Section>
    </>
  );
}

