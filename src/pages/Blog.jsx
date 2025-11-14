import { useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Container, Section, SEO } from '../components/common';
import { FiBook } from 'react-icons/fi';
import {
  PostGridStyle7,
  Pagination,
  BlogSidebar,
  SearchForm,
} from '../components/blog';
import {
  usePosts,
  useSearchPosts,
  usePostsByCategory,
  usePostsByTag,
  usePaginatedPosts,
} from '../hooks/usePosts';
import Button from '../components/common/Button';
import ContactSection from '../components/home/ContactSection';

export default function Blog() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Get filter values from URL
  const searchQuery = searchParams.get('search') || '';
  const categoryFilter = searchParams.get('category') || '';
  const tagFilter = searchParams.get('tag') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  // Get all posts
  const allPosts = usePosts();

  // Filter posts based on search, category, and tag
  const filteredPosts = useMemo(() => {
    let posts = allPosts;

    // Apply search filter
    if (searchQuery) {
      posts = posts.filter(post => {
        const query = searchQuery.toLowerCase();
        return (
          post.title?.toLowerCase().includes(query) ||
          post.excerpt?.toLowerCase().includes(query) ||
          post.content?.toLowerCase().includes(query) ||
          post.categories?.some(cat => cat.toLowerCase().includes(query)) ||
          post.tags?.some(tag => tag.toLowerCase().includes(query))
        );
      });
    }

    // Apply category filter
    if (categoryFilter) {
      posts = posts.filter(post =>
        post.categories?.includes(categoryFilter)
      );
    }

    // Apply tag filter
    if (tagFilter) {
      posts = posts.filter(post => post.tags?.includes(tagFilter));
    }

    // Sort by date (newest first)
    return [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [allPosts, searchQuery, categoryFilter, tagFilter]);

  // Paginate posts
  const { paginatedPosts, totalPages } = usePaginatedPosts(
    filteredPosts,
    currentPage,
    9
  );

  // Get active layout component - always use layout 7
  const LayoutComponent = PostGridStyle7;

  // Clear filters
  const clearFilters = () => {
    setSearchParams({});
  };

  const hasActiveFilters = searchQuery || categoryFilter || tagFilter;

  // SEO description
  const seoDescription = hasActiveFilters
    ? `Browse ${filteredPosts.length} blog post${filteredPosts.length !== 1 ? 's' : ''}${categoryFilter ? ` in ${categoryFilter}` : ''}${tagFilter ? ` tagged ${tagFilter}` : ''}`
    : 'Browse our latest blog posts, articles, and updates. Stay informed with our latest news and insights.';

  return (
    <>
      <SEO
        title={hasActiveFilters ? `Posts & Events${categoryFilter ? ` - ${categoryFilter}` : ''}${tagFilter ? ` - ${tagFilter}` : ''}` : 'Posts & Events'}
        description={seoDescription}
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
                <FiBook className="w-12 h-12 text-white" />
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
              >
                Posts & Events
              </motion.h1>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed"
              >
                {hasActiveFilters 
                  ? `${filteredPosts.length} post${filteredPosts.length !== 1 ? 's' : ''} found${categoryFilter ? ` in ${categoryFilter}` : ''}${tagFilter ? ` tagged ${tagFilter}` : ''}`
                  : 'Browse our latest blog posts, articles, and updates. Stay informed with our latest news and insights.'
                }
              </motion.p>
              
              {hasActiveFilters && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="mt-6"
                >
                  <Button
                    variant="outline"
                    size="md"
                    onClick={clearFilters}
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                  >
                    Clear Filters
                  </Button>
                </motion.div>
              )}
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

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Active Filters */}
            {(categoryFilter || tagFilter) && (
              <div className="mb-6 flex flex-wrap gap-2">
                {categoryFilter && (
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                    Category: {categoryFilter}
                  </span>
                )}
                {tagFilter && (
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                    Tag: {tagFilter}
                  </span>
                )}
              </div>
            )}

            {/* Posts Grid */}
            {paginatedPosts.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <LayoutComponent posts={paginatedPosts} />
              </motion.div>
            ) : (
              <div className="text-center py-16">
                <p className="text-xl text-gray-600 mb-4">No posts found</p>
                {hasActiveFilters && (
                  <Button onClick={clearFilters} variant="primary">
                    Clear Filters
                  </Button>
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                basePath="/blog"
              />
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:w-80 flex-shrink-0">
            <div className="sticky top-8">
              {/* Desktop Search */}
              <div className="hidden lg:block mb-6">
                <SearchForm />
              </div>
              <BlogSidebar />
            </div>
          </aside>
        </div>
      </Container>
    </Section>

      {/* Contact Section */}
      <ContactSection />
    </>
  );
}
