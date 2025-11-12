import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiExternalLink } from 'react-icons/fi';
import Image from '../common/Image';
import Card from '../common/Card';

/**
 * Portfolio Card Component
 * @param {Object} props
 * @param {Object} props.item - Portfolio item object
 * @param {Function} props.onClick - Optional click handler
 */
export default function PortfolioCard({ item, onClick }) {
  if (!item) return null;

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.4 }}
      layout
    >
      <Link
        to={`/portfolio/${item.slug}`}
        onClick={onClick}
        className="block h-full"
      >
        <Card hover shadow className="h-full overflow-hidden group">
          {/* Image Container */}
          <div className="relative h-64 overflow-hidden bg-gray-200">
            {item.featuredImage ? (
              <>
                <Image
                  src={item.featuredImage}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  lazy={true}
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-4 group-hover:translate-y-0">
                    <div className="bg-white rounded-full p-3">
                      <FiExternalLink className="w-6 h-6 text-gray-900" />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <span>No Image</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Categories */}
            {item.categories && item.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {item.categories.slice(0, 2).map((category, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full"
                  >
                    {category}
                  </span>
                ))}
              </div>
            )}

            {/* Title */}
            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors line-clamp-2">
              {item.title}
            </h3>

            {/* Description */}
            {item.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {item.description}
              </p>
            )}

            {/* Meta Information */}
            <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
              {item.clientName && (
                <span className="font-medium">{item.clientName}</span>
              )}
              {item.projectDate && (
                <time dateTime={item.projectDate}>
                  {new Date(item.projectDate).getFullYear()}
                </time>
              )}
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

