import PostCard from './PostCard';

/**
 * PostGridStyle7 - Featured layout with large first post
 * First post is featured, rest in grid
 */
export default function PostGridStyle7({ posts }) {
  if (posts.length === 0) return null;
  
  const [featuredPost, ...remainingPosts] = posts;

  return (
    <div className="space-y-8">
      {/* Featured Post */}
      <div>
        <PostCard post={featuredPost} layout="featured" />
      </div>
      
      {/* Remaining Posts Grid */}
      {remainingPosts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {remainingPosts.map((post) => (
            <PostCard key={post.id} post={post} layout="default" />
          ))}
        </div>
      )}
    </div>
  );
}

