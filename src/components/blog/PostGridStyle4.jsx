import { Link } from 'react-router-dom';
import PostCard from './PostCard';

/**
 * PostGridStyle4 - Card-based layout
 * Compact cards with horizontal image layout
 */
export default function PostGridStyle4({ posts }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {posts.map((post) => (
        <div key={post.id} className="flex flex-col md:flex-row gap-4 bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
          {post.featuredImage && (
            <Link to={`/blog/${post.slug}`} className="md:w-1/3 h-48 md:h-auto overflow-hidden">
              <img
                src={post.featuredImage}
                alt={post.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </Link>
          )}
          <div className={`flex-1 p-4 ${post.featuredImage ? 'md:p-6' : 'p-6'}`}>
            {post.categories && post.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {post.categories.slice(0, 1).map((category, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded"
                  >
                    {category}
                  </span>
                ))}
              </div>
            )}
            <Link to={`/blog/${post.slug}`}>
              <h3 className="text-lg font-bold mb-2 hover:text-primary transition-colors line-clamp-2">
                {post.title}
              </h3>
            </Link>
            {post.excerpt && (
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {post.excerpt}
              </p>
            )}
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {post.author && <span>{post.author}</span>}
              {post.date && <span>{new Date(post.date).toLocaleDateString()}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

