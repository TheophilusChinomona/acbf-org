import { useState } from 'react';
import PostCard from './PostCard';

/**
 * PostGridStyle3 - Masonry layout
 * CSS Grid with auto-rows for masonry effect
 */
export default function PostGridStyle3({ posts }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
      {posts.map((post, index) => {
        // Alternate card heights for masonry effect
        const isTall = index % 4 === 0 || index % 4 === 2;
        
        return (
          <div
            key={post.id}
            className={isTall ? 'lg:row-span-2' : ''}
          >
            <PostCard post={post} layout="default" />
          </div>
        );
      })}
    </div>
  );
}

