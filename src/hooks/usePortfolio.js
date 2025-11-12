import { useMemo } from 'react';
import portfolioData from '../data/portfolio.json';

/**
 * Hook to get all portfolio items
 * @returns {Array} Array of all portfolio items
 */
export function usePortfolio() {
  return useMemo(() => portfolioData, []);
}

/**
 * Hook to get a single portfolio item by slug
 * @param {string} slug - Portfolio item slug
 * @returns {Object|null} Portfolio item or null if not found
 */
export function usePortfolioItem(slug) {
  const portfolio = usePortfolio();
  return useMemo(() => {
    return portfolio.find(item => item.slug === slug) || null;
  }, [portfolio, slug]);
}

/**
 * Hook to get portfolio items by category
 * @param {string} category - Category name
 * @returns {Array} Array of portfolio items in the category
 */
export function usePortfolioByCategory(category) {
  const portfolio = usePortfolio();
  return useMemo(() => {
    return portfolio.filter(item =>
      item.categories && item.categories.includes(category)
    );
  }, [portfolio, category]);
}

/**
 * Hook to get latest portfolio items
 * @param {number} limit - Number of items to return
 * @returns {Array} Array of latest portfolio items
 */
export function useLatestPortfolio(limit = 6) {
  const portfolio = usePortfolio();
  return useMemo(() => {
    return [...portfolio]
      .sort((a, b) => new Date(b.projectDate || b.date || 0) - new Date(a.projectDate || a.date || 0))
      .slice(0, limit);
  }, [portfolio, limit]);
}

/**
 * Hook to get all unique categories from portfolio
 * @returns {Array} Array of unique category names
 */
export function usePortfolioCategories() {
  const portfolio = usePortfolio();
  return useMemo(() => {
    const categories = new Set();
    portfolio.forEach(item => {
      if (item.categories) {
        item.categories.forEach(cat => categories.add(cat));
      }
    });
    return Array.from(categories).sort();
  }, [portfolio]);
}

/**
 * Hook to get related portfolio items
 * @param {Object} currentItem - Current portfolio item
 * @param {number} limit - Number of related items to return
 * @returns {Array} Array of related portfolio items
 */
export function useRelatedPortfolio(currentItem, limit = 3) {
  const portfolio = usePortfolio();
  return useMemo(() => {
    if (!currentItem) return [];
    
    const related = portfolio.filter(item => {
      if (item.id === currentItem.id) return false;
      
      // Match by category
      const categoryMatch = currentItem.categories?.some(cat =>
        item.categories?.includes(cat)
      );
      
      return categoryMatch;
    });
    
    return related
      .sort((a, b) => new Date(b.projectDate || b.date || 0) - new Date(a.projectDate || a.date || 0))
      .slice(0, limit);
  }, [portfolio, currentItem, limit]);
}

/**
 * Hook to filter portfolio items by multiple criteria
 * @param {Object} filters - Filter object with category, search, etc.
 * @returns {Array} Filtered portfolio items
 */
export function useFilteredPortfolio(filters = {}) {
  const portfolio = usePortfolio();
  return useMemo(() => {
    let filtered = [...portfolio];
    
    // Filter by category
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(item =>
        item.categories && item.categories.includes(filters.category)
      );
    }
    
    // Filter by search query
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      filtered = filtered.filter(item => {
        const titleMatch = item.title?.toLowerCase().includes(searchTerm);
        const descMatch = item.description?.toLowerCase().includes(searchTerm);
        const clientMatch = item.clientName?.toLowerCase().includes(searchTerm);
        const categoryMatch = item.categories?.some(cat =>
          cat.toLowerCase().includes(searchTerm)
        );
        
        return titleMatch || descMatch || clientMatch || categoryMatch;
      });
    }
    
    // Sort by date (newest first)
    return filtered.sort((a, b) => 
      new Date(b.projectDate || b.date || 0) - new Date(a.projectDate || a.date || 0)
    );
  }, [portfolio, filters]);
}

