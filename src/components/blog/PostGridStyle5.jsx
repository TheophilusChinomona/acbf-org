import PostCard from './PostCard';

/**
 * PostGridStyle5 - Minimal layout
 * Clean, text-focused design
 */
export default function PostGridStyle5({ posts }) {
  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} layout="minimal" />
      ))}
    </div>
  );
}

