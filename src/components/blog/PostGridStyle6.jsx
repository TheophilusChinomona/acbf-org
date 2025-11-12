import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/formatDate';
import Image from '../common/Image';

/**
 * PostGridStyle6 - Timeline layout
 * Vertical timeline with posts
 */
export default function PostGridStyle6({ posts }) {
  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 hidden md:block" />
      
      <div className="space-y-8">
        {posts.map((post, index) => (
          <div key={post.id} className="relative flex gap-6">
            {/* Timeline dot */}
            <div className="hidden md:block flex-shrink-0 w-16">
              <div className="w-4 h-4 bg-primary rounded-full border-4 border-white shadow-md relative z-10" />
            </div>
            
            {/* Content */}
            <div className="flex-1 bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              {post.featuredImage && (
                <div className="mb-4 rounded-lg overflow-hidden">
                  <Image
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-full h-64 object-cover"
                  />
                </div>
              )}
              
              <div className="flex items-center gap-4 mb-3 text-sm text-gray-500">
                {post.date && (
                  <time dateTime={post.date}>
                    {formatDate(post.date, 'MMMM dd, yyyy')}
                  </time>
                )}
                {post.categories && post.categories.length > 0 && (
                  <span className="text-primary font-medium">
                    {post.categories[0]}
                  </span>
                )}
              </div>
              
              <Link to={`/blog/${post.slug}`}>
                <h3 className="text-2xl font-bold mb-3 hover:text-primary transition-colors">
                  {post.title}
                </h3>
              </Link>
              
              {post.excerpt && (
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
              )}
              
              <div className="flex items-center justify-between">
                {post.author && (
                  <span className="text-sm text-gray-500">By {post.author}</span>
                )}
                <Link
                  to={`/blog/${post.slug}`}
                  className="text-primary text-sm font-medium hover:underline"
                >
                  Read More →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

