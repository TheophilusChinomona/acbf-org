import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatDate } from '../../utils/formatDate';
import Image from '../common/Image';
import Card from '../common/Card';

/**
 * Post Card Component - Reusable post preview card
 * @param {Object} props
 * @param {Object} props.post - Post object
 * @param {string} props.layout - Layout variant (default, featured, minimal)
 * @param {Function} props.onClick - Optional click handler
 */
export default function PostCard({ post, layout = 'default', onClick }) {
  if (!post) return null;

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // Featured layout - larger card with prominent image
  if (layout === 'featured') {
    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.5 }}
      >
        <Card hover shadow className="h-full bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 border-2 border-amber-200/50">
          <Link
            to={`/blog/${post.slug}`}
            onClick={onClick}
            className="block h-full"
          >
            {post.featuredImage && (
              <div className="relative h-64 md:h-80 overflow-hidden">
                <Image
                  src={post.featuredImage}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-amber-900/60 via-amber-800/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  {post.categories && post.categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {post.categories.slice(0, 2).map((category, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 text-xs font-medium bg-white/20 backdrop-blur-sm rounded"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  )}
                  <h3 className="text-2xl md:text-3xl font-bold mb-2 line-clamp-2">
                    {post.title}
                  </h3>
                  <div className="flex items-center gap-3 text-sm">
                    {post.author && (
                      <span className="font-medium">{post.author}</span>
                    )}
                    {post.date && (
                      <span className="text-white/80">
                        {formatDate(post.date)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
            {!post.featuredImage && (
              <div className="relative p-8 md:p-12 bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber-200/30 rounded-full blur-3xl"></div>
                  <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-yellow-200/30 rounded-full blur-3xl"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-300/20 rounded-full blur-3xl"></div>
                </div>
                
                {/* Content */}
                <div className="relative z-10">
                  {post.categories && post.categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.categories.slice(0, 2).map((category, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 text-xs font-semibold bg-amber-600/20 text-amber-900 rounded-full border border-amber-400/30 backdrop-blur-sm"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  )}
                  <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-amber-900 leading-tight">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-amber-800/90 mb-6 text-lg md:text-xl line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-amber-900/80 font-medium">
                    {post.author && (
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-amber-600 rounded-full"></span>
                        {post.author}
                      </span>
                    )}
                    {post.date && (
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-amber-600 rounded-full"></span>
                        {formatDate(post.date)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Link>
        </Card>
      </motion.div>
    );
  }

  // Minimal layout - text only
  if (layout === 'minimal') {
    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.5 }}
      >
        <Card hover={false} shadow={false} className="border-b border-gray-200 pb-6">
          <Link
            to={`/blog/${post.slug}`}
            onClick={onClick}
            className="block"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {post.categories && post.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {post.categories.slice(0, 1).map((category, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 text-xs font-medium text-primary"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2 hover:text-primary transition-colors">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="text-gray-600 mb-3 line-clamp-2">
                    {post.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  {post.author && <span>{post.author}</span>}
                  {post.date && <span>{formatDate(post.date)}</span>}
                </div>
              </div>
            </div>
          </Link>
        </Card>
      </motion.div>
    );
  }

  // Default layout - standard card with image
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.5 }}
    >
      <Card hover shadow className="h-full flex flex-col bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 border-2 border-amber-200/50">
        <Link
          to={`/blog/${post.slug}`}
          onClick={onClick}
          className="block h-full flex flex-col"
        >
          {post.featuredImage && (
            <div className="relative h-48 overflow-hidden">
              <Image
                src={post.featuredImage}
                alt={post.title}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-amber-900/20 to-transparent" />
            </div>
          )}
          {!post.featuredImage && (
            <div className="relative h-32 bg-gradient-to-br from-amber-100 via-yellow-100 to-amber-200 overflow-hidden">
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-300/40 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-yellow-300/40 rounded-full blur-2xl"></div>
              </div>
            </div>
          )}
          <div className="p-6 flex-1 flex flex-col bg-gradient-to-br from-amber-50/80 via-yellow-50/80 to-amber-100/80">
            {post.categories && post.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {post.categories.slice(0, 2).map((category, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded"
                  >
                    {category}
                  </span>
                ))}
              </div>
            )}
            <h3 className="text-xl font-bold mb-2 hover:text-primary transition-colors line-clamp-2">
              {post.title}
            </h3>
            {post.excerpt && (
              <p className="text-gray-600 mb-4 line-clamp-3 flex-1">
                {post.excerpt}
              </p>
            )}
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
              <div className="flex items-center gap-3 text-sm text-gray-500">
                {post.author && <span>{post.author}</span>}
                {post.date && <span>{formatDate(post.date)}</span>}
              </div>
              <span className="text-primary text-sm font-medium hover:underline">
                Read More →
              </span>
            </div>
          </div>
        </Link>
      </Card>
    </motion.div>
  );
}

