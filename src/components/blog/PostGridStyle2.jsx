import PostCard from './PostCard';

/**
 * PostGridStyle2 - Grid layout (2-3 columns)
 * Responsive grid with equal-height cards
 */
export default function PostGridStyle2({ posts }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} layout="default" />
      ))}
    </div>
  );
}

