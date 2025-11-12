import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLatestPosts, useCategories, useTags } from '../../hooks/usePosts';
import PostCard from './PostCard';
import Card from '../common/Card';

/**
 * Blog Sidebar Component with widgets
 */
export default function BlogSidebar() {
  const latestPosts = useLatestPosts(3);
  const allCategories = useCategories();
  const tags = useTags();
  const [searchParams] = useSearchParams();

  // Filter categories to only show "Events" or categories containing "blog" (case-insensitive)
  const categories = useMemo(() => {
    return allCategories.filter(cat => {
      const lowerCat = cat.toLowerCase();
      return lowerCat === 'events' || lowerCat.includes('blog');
    });
  }, [allCategories]);

  const buildCategoryUrl = (category) => {
    const params = new URLSearchParams(searchParams);
    params.set('category', category);
    params.set('page', '1');
    return `/blog?${params.toString()}`;
  };

  const buildTagUrl = (tag) => {
    const params = new URLSearchParams(searchParams);
    params.set('tag', tag);
    params.set('page', '1');
    return `/blog?${params.toString()}`;
  };

  return (
    <aside className="space-y-8">
      {/* Recent Posts Widget */}
      {latestPosts.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">Recent Posts</h3>
          <div className="space-y-4">
            {latestPosts.map((post) => (
              <div key={post.id} className="flex gap-3">
                {post.featuredImage && (
                  <Link
                    to={`/blog/${post.slug}`}
                    className="flex-shrink-0 w-20 h-20 rounded overflow-hidden"
                  >
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                    />
                  </Link>
                )}
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/blog/${post.slug}`}
                    className="block"
                  >
                    <h4 className="text-sm font-semibold mb-1 line-clamp-2 hover:text-primary transition-colors">
                      {post.title}
                    </h4>
                  </Link>
                  {post.date && (
                    <p className="text-xs text-gray-500">
                      {new Date(post.date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Categories Widget */}
      {categories.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">Categories</h3>
          <ul className="space-y-2">
            {categories.map((category) => (
              <li key={category}>
                <Link
                  to={buildCategoryUrl(category)}
                  className="flex items-center justify-between text-gray-700 hover:text-primary transition-colors py-1"
                >
                  <span>{category}</span>
                  <span className="text-sm text-gray-400">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Tags Widget */}
      {tags.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link
                key={tag}
                to={buildTagUrl(tag)}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-primary hover:text-white transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        </Card>
      )}
    </aside>
  );
}

