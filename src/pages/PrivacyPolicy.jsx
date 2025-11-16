import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Container, Section, SEO } from '../components/common';
import { FiShield, FiMenu, FiX } from 'react-icons/fi';
import pagesData from '../data/pages.js';

/**
 * Privacy Policy Page
 * Loads content from pages data based on slug
 */
export default function PrivacyPolicy() {
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [sections, setSections] = useState([]);

  const page = useMemo(() => {
    return pagesData.find(p => p.slug === 'privacy-policy') || null;
  }, []);

  // Extract sections from content when page loads
  useEffect(() => {
    if (page?.content) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(page.content, 'text/html');
      const headings = Array.from(doc.querySelectorAll('h2'));
      const extractedSections = headings.map((h, idx) => ({
        id: `section-${idx}`,
        title: h.textContent,
        index: idx
      }));
      setSections(extractedSections);
    }
  }, [page]);

  if (!page) {
    return (
      <>
        <SEO title="Privacy Policy" description="Read our privacy policy to understand how we collect, use, and protect your personal information." />
        <Section>
          <Container>
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
              <p className="text-lg text-gray-600">
                Privacy Policy content will be added here.
              </p>
            </div>
          </Container>
        </Section>
      </>
    );
  }

  const description = page.content
    ? page.content.replace(/<[^>]*>/g, '').substring(0, 160)
    : 'Read our privacy policy to understand how we collect, use, and protect your personal information.';

  return (
    <>
      <SEO
        title={page.title}
        description={description}
        image={page.featuredImage}
        url={`${typeof window !== 'undefined' ? window.location.origin : ''}/privacy-policy`}
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
                <FiShield className="w-12 h-12 text-white" />
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

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed"
              >
                Read our privacy policy to understand how we collect, use, and protect your personal information.
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

      <Section>
        <Container>
          <div className="max-w-4xl mx-auto">
            {/* Mobile TOC Toggle Button */}
            <div className="md:hidden mb-6">
              <button
                onClick={() => setIsTocOpen(!isTocOpen)}
                className="flex items-center gap-2 px-4 py-3 bg-primary/10 border-2 border-primary text-primary rounded-lg font-semibold hover:bg-primary/20 transition-colors w-full justify-center"
              >
                {isTocOpen ? (
                  <>
                    <FiX className="w-5 h-5" />
                    Close Contents
                  </>
                ) : (
                  <>
                    <FiMenu className="w-5 h-5" />
                    Table of Contents
                  </>
                )}
              </button>

              {/* Mobile TOC Menu */}
              {isTocOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <nav className="space-y-2">
                    {sections.map((section) => (
                      <a
                        key={section.id}
                        href={`#${section.id}`}
                        onClick={() => setIsTocOpen(false)}
                        className="block px-3 py-2 text-gray-700 hover:text-primary hover:bg-primary/5 rounded transition-colors text-sm"
                      >
                        {section.title}
                      </a>
                    ))}
                  </nav>
                </motion.div>
              )}
            </div>

            {/* Main Content */}
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div
                className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-headings:font-bold prose-headings:mt-8 prose-headings:mb-4 prose-headings:pb-3 prose-headings:border-b-2 prose-headings:border-primary/20 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-strong:font-semibold prose-ul:text-gray-700 prose-ul:space-y-2 prose-ol:text-gray-700 prose-ol:space-y-2 prose-li:text-gray-700 prose-img:rounded-lg prose-img:shadow-lg"
                dangerouslySetInnerHTML={{ __html: page.content }}
              />
            </motion.article>

            {/* Back to Top Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-12 pt-8 border-t border-gray-200 text-center"
            >
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-semibold transition-colors"
              >
                ↑ Back to Top
              </a>
            </motion.div>
          </div>
        </Container>
      </Section>
    </>
  );
}

