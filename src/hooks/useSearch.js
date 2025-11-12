import { useMemo } from 'react';
import postsData from '../data/posts.json';
import pagesData from '../data/pages.js';
import portfolioData from '../data/portfolio.json';

/**
 * Comprehensive Search Hook
 * Searches across posts, pages, and portfolio items
 * @param {string} query - Search query
 * @returns {Object} Object with search results for each content type
 */
export function useSearch(query) {
  return useMemo(() => {
    if (!query || query.trim() === '') {
      return {
        posts: [],
        pages: [],
        portfolio: [],
        total: 0,
      };
    }

    const searchTerm = query.toLowerCase().trim();

    // Search Posts
    const matchingPosts = postsData.filter(post => {
      const titleMatch = post.title?.toLowerCase().includes(searchTerm);
      const excerptMatch = post.excerpt?.toLowerCase().includes(searchTerm);
      const contentMatch = post.content?.toLowerCase().includes(searchTerm);
      const categoryMatch = post.categories?.some(cat =>
        cat.toLowerCase().includes(searchTerm)
      );
      const tagMatch = post.tags?.some(tag =>
        tag.toLowerCase().includes(searchTerm)
      );
      const authorMatch = post.author?.toLowerCase().includes(searchTerm);

      return titleMatch || excerptMatch || contentMatch || categoryMatch || tagMatch || authorMatch;
    }).map(post => ({
      ...post,
      type: 'post',
      url: `/blog/${post.slug}`,
    }));

    // Search Pages
    const matchingPages = pagesData.filter(page => {
      const titleMatch = page.title?.toLowerCase().includes(searchTerm);
      const contentMatch = page.content?.toLowerCase().includes(searchTerm);
      return titleMatch || contentMatch;
    }).map(page => ({
      ...page,
      type: 'page',
      url: `/${page.slug}`,
    }));

    // Search Portfolio
    const matchingPortfolio = portfolioData.filter(item => {
      const titleMatch = item.title?.toLowerCase().includes(searchTerm);
      const descriptionMatch = item.description?.toLowerCase().includes(searchTerm);
      const clientMatch = item.clientName?.toLowerCase().includes(searchTerm);
      const categoryMatch = item.categories?.some(cat =>
        cat.toLowerCase().includes(searchTerm)
      );

      return titleMatch || descriptionMatch || clientMatch || categoryMatch;
    }).map(item => ({
      ...item,
      type: 'portfolio',
      url: `/portfolio/${item.slug}`,
    }));

    return {
      posts: matchingPosts,
      pages: matchingPages,
      portfolio: matchingPortfolio,
      total: matchingPosts.length + matchingPages.length + matchingPortfolio.length,
    };
  }, [query]);
}

/**
 * Highlight search term in text
 * @param {string} text - Text to highlight
 * @param {string} query - Search query
 * @returns {string} HTML string with highlighted terms
 */
export function highlightSearchTerm(text, query) {
  if (!text || !query) return text;

  const searchTerm = query.trim();
  if (!searchTerm) return text;

  // Escape special regex characters
  const escapedQuery = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');

  // Convert to string if needed
  const textStr = typeof text === 'string' ? text : String(text);

  return textStr.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
}

/**
 * Get excerpt with highlighted search term
 * @param {string} text - Full text
 * @param {string} query - Search query
 * @param {number} maxLength - Maximum length of excerpt
 * @returns {string} HTML string with highlighted excerpt
 */
export function getHighlightedExcerpt(text, query, maxLength = 200) {
  if (!text) return '';

  const textStr = typeof text === 'string' ? text : String(text);
  const searchTerm = query.trim().toLowerCase();

  if (!searchTerm) {
    return textStr.length > maxLength
      ? textStr.substring(0, maxLength) + '...'
      : textStr;
  }

  // Find the position of the search term
  const index = textStr.toLowerCase().indexOf(searchTerm);

  if (index === -1) {
    return textStr.length > maxLength
      ? textStr.substring(0, maxLength) + '...'
      : textStr;
  }

  // Get context around the search term
  const start = Math.max(0, index - maxLength / 2);
  const end = Math.min(textStr.length, index + searchTerm.length + maxLength / 2);
  let excerpt = textStr.substring(start, end);

  if (start > 0) excerpt = '...' + excerpt;
  if (end < textStr.length) excerpt = excerpt + '...';

  return highlightSearchTerm(excerpt, query);
}

