import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSearch, FiFileText, FiBriefcase } from 'react-icons/fi';
import { Container, Section, SEO } from '../components/common';
import { useSearch, highlightSearchTerm, getHighlightedExcerpt } from '../hooks/useSearch';
import { formatDate } from '../utils/formatDate';

/**
 * Search Page Component
 * Displays search results across posts, pages, and portfolio
 */
export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { posts, pages, portfolio, total } = useSearch(query);

  return (
    <>
      <SEO
        title={query ? `Search Results for "${query}"` : 'Search'}
        description={query ? `Found ${total} result${total !== 1 ? 's' : ''} for "${query}"` : 'Search across our blog posts, pages, and portfolio items.'}
      />
      <Section>
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Search Results
            </h1>
            {query ? (
              <p className="text-lg text-gray-600">
                Found <strong>{total}</strong> result{total !== 1 ? 's' : ''} for "
                <strong>{query}</strong>"
              </p>
            ) : (
              <p className="text-lg text-gray-600">
                Enter a search term to find content across the site.
              </p>
            )}
          </div>

          {/* Search Form */}
          <div className="mb-8">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const searchQuery = formData.get('search');
                setSearchParams({ q: searchQuery });
              }}
              className="relative"
            >
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
              <input
                type="text"
                name="search"
                defaultValue={query}
                placeholder="Search posts, pages, and portfolio..."
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Search
              </button>
            </form>
          </div>

          {/* Results */}
          {!query ? (
            <div className="text-center py-12">
              <FiSearch className="mx-auto text-gray-400 text-6xl mb-4" />
              <p className="text-gray-600">Enter a search term above to get started.</p>
            </div>
          ) : total === 0 ? (
            <div className="text-center py-12">
              <FiSearch className="mx-auto text-gray-400 text-6xl mb-4" />
              <p className="text-gray-600 mb-2">No results found for "{query}"</p>
              <p className="text-sm text-gray-500">Try different keywords or check your spelling.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Posts Results */}
              {posts.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FiFileText className="text-primary" />
                    Blog Posts ({posts.length})
                  </h2>
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <Link
                        key={post.id}
                        to={post.url}
                        className="block p-6 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-shadow"
                      >
                        <h3
                          className="text-xl font-semibold text-gray-900 mb-2"
                          dangerouslySetInnerHTML={{
                            __html: highlightSearchTerm(post.title, query),
                          }}
                        />
                        {post.excerpt && (
                          <p
                            className="text-gray-600 mb-3"
                            dangerouslySetInnerHTML={{
                              __html: getHighlightedExcerpt(post.excerpt, query),
                            }}
                          />
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          {post.date && <span>{formatDate(post.date)}</span>}
                          {post.author && <span>by {post.author}</span>}
                        </div>
                      </Link>
                    ))}
                  </div>
                </motion.section>
              )}

              {/* Pages Results */}
              {pages.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FiFileText className="text-primary" />
                    Pages ({pages.length})
                  </h2>
                  <div className="space-y-4">
                    {pages.map((page) => (
                      <Link
                        key={page.id}
                        to={page.url}
                        className="block p-6 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-shadow"
                      >
                        <h3
                          className="text-xl font-semibold text-gray-900 mb-2"
                          dangerouslySetInnerHTML={{
                            __html: highlightSearchTerm(page.title, query),
                          }}
                        />
                        {page.content && (
                          <p
                            className="text-gray-600"
                            dangerouslySetInnerHTML={{
                              __html: getHighlightedExcerpt(page.content, query, 150),
                            }}
                          />
                        )}
                      </Link>
                    ))}
                  </div>
                </motion.section>
              )}

              {/* Portfolio Results */}
              {portfolio.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FiBriefcase className="text-primary" />
                    Portfolio ({portfolio.length})
                  </h2>
                  <div className="space-y-4">
                    {portfolio.map((item) => (
                      <Link
                        key={item.id}
                        to={item.url}
                        className="block p-6 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-shadow"
                      >
                        <div className="flex gap-4">
                          {item.featuredImage && (
                            <img
                              src={item.featuredImage}
                              alt={item.title}
                              className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                            />
                          )}
                          <div className="flex-1">
                            <h3
                              className="text-xl font-semibold text-gray-900 mb-2"
                              dangerouslySetInnerHTML={{
                                __html: highlightSearchTerm(item.title, query),
                              }}
                            />
                            {item.description && (
                              <p
                                className="text-gray-600 mb-2"
                                dangerouslySetInnerHTML={{
                                  __html: getHighlightedExcerpt(item.description, query, 150),
                                }}
                              />
                            )}
                            {item.clientName && (
                              <p className="text-sm text-gray-500">Client: {item.clientName}</p>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </motion.section>
              )}
            </div>
          )}
        </motion.div>
      </Container>
    </Section>
    </>
  );
}

