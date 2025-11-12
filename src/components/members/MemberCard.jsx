import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiBriefcase, FiMapPin } from 'react-icons/fi';
import Image from '../common/Image';
import Card from '../common/Card';

/**
 * Member Card Component
 * @param {Object} props
 * @param {Object} props.member - Member object
 * @param {Function} props.onClick - Optional click handler
 */
export default function MemberCard({ member, onClick }) {
  if (!member) return null;

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
        to={`/members/${member.slug}`}
        onClick={onClick}
        className="block h-full"
      >
        <Card hover shadow className="h-full overflow-hidden group flex flex-col">
        {/* Logo/Image Container */}
        <div className="relative h-64 overflow-hidden bg-gray-100 flex items-center justify-center p-4 flex-shrink-0">
          {member.logo || member.featuredImage ? (
            <>
              <div className="w-full h-full flex items-center justify-center">
                <img
                  src={member.logo || member.featuredImage}
                  alt={member.businessName || member.name}
                  className="object-contain transition-transform duration-500 group-hover:scale-105"
                  style={{ 
                    width: '210px',
                    height: '210px',
                    objectFit: 'contain'
                  }}
                  loading="lazy"
                />
              </div>
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-4 group-hover:translate-y-0">
                  <div className="bg-white rounded-full p-3">
                    <FiBriefcase className="w-6 h-6 text-gray-900" />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
              <FiBriefcase className="w-16 h-16" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 flex-1 flex flex-col">
          {/* Sector Badge */}
          {member.sector && (
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                {member.sector}
              </span>
            </div>
          )}

          {/* Business Name / Company Name */}
          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {member.businessName || member.name}
          </h3>

          {/* Description */}
          {member.description && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">
              {member.description}
            </p>
          )}

          {/* Meta Information */}
          <div className="space-y-2 text-sm text-gray-500 pt-4 border-t border-gray-100 mt-auto">
            {member.location && (
              <div className="flex items-center gap-2">
                <FiMapPin className="w-4 h-4 flex-shrink-0" />
                <span className="line-clamp-1">{member.location}</span>
              </div>
            )}
            {member.memberSince && (
              <div className="text-xs text-gray-400">
                Member since {new Date(member.memberSince).getFullYear()}
              </div>
            )}
          </div>
        </div>
        </Card>
      </Link>
    </motion.div>
  );
}

