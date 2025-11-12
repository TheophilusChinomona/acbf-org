import PostCard from './PostCard';

/**
 * PostGridStyle1 - Standard list layout
 * Single column, full-width cards
 */
export default function PostGridStyle1({ posts }) {
  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} layout="default" />
      ))}
    </div>
  );
}

