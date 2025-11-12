import { useMemo } from 'react';
import membersData from '../data/members.json';

/**
 * Hook to get all members
 * @returns {Array} Array of all members
 */
export function useMembers() {
  return useMemo(() => membersData, []);
}

/**
 * Hook to get a single member by slug
 * @param {string} slug - Member slug
 * @returns {Object|null} Member or null if not found
 */
export function useMember(slug) {
  const members = useMembers();
  return useMemo(() => {
    return members.find(member => member.slug === slug) || null;
  }, [members, slug]);
}

/**
 * Hook to get all unique sectors from members
 * @returns {Array} Array of unique sector names
 */
export function useMemberSectors() {
  const members = useMembers();
  return useMemo(() => {
    const sectors = new Set();
    members.forEach(member => {
      if (member.sector) {
        sectors.add(member.sector);
      }
    });
    return Array.from(sectors).sort();
  }, [members]);
}

/**
 * Hook to filter members by sector
 * @param {Object} filters - Filter object with sector
 * @returns {Array} Filtered members
 */
export function useFilteredMembers(filters = {}) {
  const members = useMembers();
  return useMemo(() => {
    let filtered = [...members];
    
    // Filter by sector
    if (filters.sector && filters.sector !== 'all') {
      filtered = filtered.filter(member =>
        member.sector === filters.sector
      );
    }
    
    // Filter by search query
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      filtered = filtered.filter(member => {
        const nameMatch = member.name?.toLowerCase().includes(searchTerm);
        const businessMatch = member.businessName?.toLowerCase().includes(searchTerm);
        const descMatch = member.description?.toLowerCase().includes(searchTerm);
        const sectorMatch = member.sector?.toLowerCase().includes(searchTerm);
        
        return nameMatch || businessMatch || descMatch || sectorMatch;
      });
    }
    
    // Sort by member since date (newest first)
    return filtered.sort((a, b) => 
      new Date(b.memberSince || 0) - new Date(a.memberSince || 0)
    );
  }, [members, filters]);
}

/**
 * Hook to get members by sector
 * @param {string} sector - Sector name
 * @returns {Array} Array of members in the sector
 */
export function useMembersBySector(sector) {
  const members = useMembers();
  return useMemo(() => {
    return members.filter(member =>
      member.sector === sector
    );
  }, [members, sector]);
}

