import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCalendar, FiUser, FiBriefcase } from 'react-icons/fi';
import { Container, Section, SEO } from '../components/common';
import { motion } from 'framer-motion';
import {
  usePortfolioItem,
  useRelatedPortfolio,
  usePortfolio,
} from '../hooks/usePortfolio';
import { formatDate } from '../utils/formatDate';
import { PortfolioCard, PortfolioGallery } from '../components/portfolio';
import Button from '../components/common/Button';
import NotFound from './NotFound';

export default function PortfolioItem() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const item = usePortfolioItem(slug);
  const allItems = usePortfolio();
  const relatedItems = useRelatedPortfolio(item, 3);

  if (!item) {
    return <NotFound />;
  }

  // Get previous and next items
  const sortedItems = [...allItems].sort(
    (a, b) =>
      new Date(b.projectDate || b.date || 0) -
      new Date(a.projectDate || a.date || 0)
  );
  const currentIndex = sortedItems.findIndex((p) => p.id === item.id);
  const prevItem = currentIndex > 0 ? sortedItems[currentIndex - 1] : null;
  const nextItem =
    currentIndex < sortedItems.length - 1
      ? sortedItems[currentIndex + 1]
      : null;

  // Get gallery images (use gallery array or fallback to featuredImage)
  const galleryImages =
    item.gallery && item.gallery.length > 0
      ? item.gallery
      : item.featuredImage
      ? [item.featuredImage]
      : [];

  // SEO description
  const description = item.description
    ? item.description.replace(/<[^>]*>/g, '').substring(0, 160)
    : `View ${item.title} portfolio project${item.clientName ? ` by ${item.clientName}` : ''}.`;

  return (
    <>
      <SEO
        title={item.title}
        description={description}
        image={item.featuredImage}
        url={typeof window !== 'undefined' ? window.location.href : ''}
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
              {/* Back Button */}
              <div className="mb-6">
                <Button
                  variant="ghost"
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-2 mx-auto bg-white/10 border-white/30 text-white hover:bg-white/20"
                >
                  <FiArrowLeft />
                  Back to Portfolio
                </Button>
              </div>

              {/* Categories */}
              {item.categories && item.categories.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="flex flex-wrap gap-2 justify-center mb-6"
                >
                  {item.categories.map((category, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 text-sm font-medium bg-white/20 backdrop-blur-sm text-white rounded-full border border-white/30"
                    >
                      {category}
                    </span>
                  ))}
                </motion.div>
              )}

              {/* Icon */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full mb-8 border-2 border-white/30"
              >
                <FiBriefcase className="w-12 h-12 text-white" />
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
              >
                {item.title}
              </motion.h1>

              {/* Meta Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="flex flex-wrap items-center justify-center gap-6 text-white/90"
              >
                {item.clientName && (
                  <div className="flex items-center gap-2">
                    <FiUser className="w-5 h-5" />
                    <span className="font-medium">{item.clientName}</span>
                  </div>
                )}
                {item.projectDate && (
                  <div className="flex items-center gap-2">
                    <FiCalendar className="w-5 h-5" />
                    <time dateTime={item.projectDate}>
                      {formatDate(item.projectDate, 'MMMM dd, yyyy')}
                    </time>
                  </div>
                )}
              </motion.div>
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
        <article className="max-w-6xl mx-auto">
          {/* Gallery */}
          {galleryImages.length > 0 && (
            <div className="mb-12">
              <PortfolioGallery images={galleryImages} />
            </div>
          )}

          {/* Description */}
          {item.description && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Project Overview
              </h2>
              <div className="prose prose-lg max-w-none">
                {typeof item.description === 'string' &&
                item.description.includes('<') ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: item.description }}
                    className="portfolio-content"
                  />
                ) : (
                  <p className="text-gray-700 leading-relaxed text-lg">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Project Details */}
          {(item.clientName ||
            item.projectDate ||
            item.categories ||
            item.projectUrl) && (
            <div className="mb-12 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Project Details
              </h3>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {item.clientName && (
                  <>
                    <dt className="font-semibold text-gray-700">Client</dt>
                    <dd className="text-gray-600">{item.clientName}</dd>
                  </>
                )}
                {item.projectDate && (
                  <>
                    <dt className="font-semibold text-gray-700">Date</dt>
                    <dd className="text-gray-600">
                      {formatDate(item.projectDate, 'MMMM dd, yyyy')}
                    </dd>
                  </>
                )}
                {item.categories && item.categories.length > 0 && (
                  <>
                    <dt className="font-semibold text-gray-700">Categories</dt>
                    <dd className="text-gray-600">
                      {item.categories.join(', ')}
                    </dd>
                  </>
                )}
                {item.projectUrl && (
                  <>
                    <dt className="font-semibold text-gray-700">Project URL</dt>
                    <dd className="text-gray-600">
                      <a
                        href={item.projectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Visit Project
                      </a>
                    </dd>
                  </>
                )}
              </dl>
            </div>
          )}

          {/* Previous/Next Navigation */}
          {(prevItem || nextItem) && (
            <div className="mb-12 pb-8 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {prevItem && (
                  <Link
                    to={`/portfolio/${prevItem.slug}`}
                    className="group p-4 border border-gray-200 rounded-lg hover:border-primary hover:shadow-md transition-all"
                  >
                    <div className="text-sm text-gray-500 mb-2">
                      Previous Project
                    </div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                      {prevItem.title}
                    </h3>
                  </Link>
                )}
                {nextItem && (
                  <Link
                    to={`/portfolio/${nextItem.slug}`}
                    className="group p-4 border border-gray-200 rounded-lg hover:border-primary hover:shadow-md transition-all md:text-right"
                  >
                    <div className="text-sm text-gray-500 mb-2">
                      Next Project
                    </div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                      {nextItem.title}
                    </h3>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Related Projects */}
          {relatedItems.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Related Projects
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedItems.map((relatedItem) => (
                  <PortfolioCard key={relatedItem.id} item={relatedItem} />
                ))}
              </div>
            </div>
          )}

          {/* View More Work CTA */}
          <div className="text-center pt-8">
            <Link to="/portfolio">
              <Button variant="outline" size="lg">
                View All Portfolio
              </Button>
            </Link>
          </div>
        </article>
      </Container>
    </Section>
    </>
  );
}
