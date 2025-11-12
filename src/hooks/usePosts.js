import { useMemo } from 'react';
import postsData from '../data/posts.json';

/**
 * Hook to get all posts
 * @returns {Array} Array of all posts
 */
export function usePosts() {
  return useMemo(() => postsData, []);
}

/**
 * Hook to get a single post by slug
 * @param {string} slug - Post slug
 * @returns {Object|null} Post object or null if not found
 */
export function usePost(slug) {
  const posts = usePosts();
  return useMemo(() => {
    return posts.find(post => post.slug === slug) || null;
  }, [posts, slug]);
}

/**
 * Hook to get posts by category
 * @param {string} category - Category name
 * @returns {Array} Array of posts in the category
 */
export function usePostsByCategory(category) {
  const posts = usePosts();
  return useMemo(() => {
    return posts.filter(post =>
      post.categories && post.categories.includes(category)
    );
  }, [posts, category]);
}

/**
 * Hook to get posts by tag
 * @param {string} tag - Tag name
 * @returns {Array} Array of posts with the tag
 */
export function usePostsByTag(tag) {
  const posts = usePosts();
  return useMemo(() => {
    return posts.filter(post =>
      post.tags && post.tags.includes(tag)
    );
  }, [posts, tag]);
}

/**
 * Hook to get posts by author
 * @param {string} author - Author name
 * @returns {Array} Array of posts by the author
 */
export function usePostsByAuthor(author) {
  const posts = usePosts();
  return useMemo(() => {
    return posts.filter(post => post.author === author);
  }, [posts, author]);
}

/**
 * Hook to search posts by query
 * @param {string} query - Search query
 * @returns {Array} Array of matching posts
 */
export function useSearchPosts(query) {
  const posts = usePosts();
  return useMemo(() => {
    if (!query || query.trim() === '') return posts;
    
    const searchTerm = query.toLowerCase().trim();
    return posts.filter(post => {
      const titleMatch = post.title?.toLowerCase().includes(searchTerm);
      const excerptMatch = post.excerpt?.toLowerCase().includes(searchTerm);
      const contentMatch = post.content?.toLowerCase().includes(searchTerm);
      const categoryMatch = post.categories?.some(cat => 
        cat.toLowerCase().includes(searchTerm)
      );
      const tagMatch = post.tags?.some(tag => 
        tag.toLowerCase().includes(searchTerm)
      );
      
      return titleMatch || excerptMatch || contentMatch || categoryMatch || tagMatch;
    });
  }, [posts, query]);
}

/**
 * Hook to get latest posts
 * @param {number} limit - Number of posts to return
 * @returns {Array} Array of latest posts
 */
export function useLatestPosts(limit = 3) {
  const posts = usePosts();
  return useMemo(() => {
    return [...posts]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);
  }, [posts, limit]);
}

/**
 * Hook to get related posts
 * @param {Object} currentPost - Current post object
 * @param {number} limit - Number of related posts to return
 * @returns {Array} Array of related posts
 */
export function useRelatedPosts(currentPost, limit = 3) {
  const posts = usePosts();
  return useMemo(() => {
    if (!currentPost) return [];
    
    const related = posts.filter(post => {
      if (post.id === currentPost.id) return false;
      
      // Match by category
      const categoryMatch = currentPost.categories?.some(cat =>
        post.categories?.includes(cat)
      );
      
      // Match by tag
      const tagMatch = currentPost.tags?.some(tag =>
        post.tags?.includes(tag)
      );
      
      return categoryMatch || tagMatch;
    });
    
    return related
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);
  }, [posts, currentPost, limit]);
}

/**
 * Hook to get all unique categories
 * @returns {Array} Array of unique category names
 */
export function useCategories() {
  const posts = usePosts();
  return useMemo(() => {
    const categories = new Set();
    posts.forEach(post => {
      if (post.categories) {
        post.categories.forEach(cat => categories.add(cat));
      }
    });
    return Array.from(categories).sort();
  }, [posts]);
}

/**
 * Hook to get all unique tags
 * @returns {Array} Array of unique tag names
 */
export function useTags() {
  const posts = usePosts();
  return useMemo(() => {
    const tags = new Set();
    posts.forEach(post => {
      if (post.tags) {
        post.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [posts]);
}

/**
 * Hook to get all unique authors
 * @returns {Array} Array of unique author names
 */
export function useAuthors() {
  const posts = usePosts();
  return useMemo(() => {
    const authors = new Set();
    posts.forEach(post => {
      if (post.author) {
        authors.add(post.author);
      }
    });
    return Array.from(authors).sort();
  }, [posts]);
}

/**
 * Hook to get paginated posts
 * @param {Array} posts - Array of posts to paginate
 * @param {number} currentPage - Current page number (1-indexed)
 * @param {number} postsPerPage - Number of posts per page
 * @returns {Object} Object with paginatedPosts, totalPages, hasNextPage, hasPrevPage
 */
export function usePaginatedPosts(posts, currentPage = 1, postsPerPage = 9) {
  return useMemo(() => {
    const totalPosts = posts.length;
    const totalPages = Math.ceil(totalPosts / postsPerPage);
    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const paginatedPosts = posts.slice(startIndex, endIndex);
    
    return {
      paginatedPosts,
      totalPages,
      currentPage,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
      totalPosts,
    };
  }, [posts, currentPage, postsPerPage]);
}

