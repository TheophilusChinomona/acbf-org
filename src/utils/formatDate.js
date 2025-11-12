import { format } from 'date-fns';

/**
 * Format a date string to a readable format
 * @param {string} dateString - Date string in format YYYY-MM-DD
 * @param {string} formatString - Format string (default: 'MMMM dd, yyyy')
 * @returns {string} Formatted date string
 */
export function formatDate(dateString, formatString = 'MMMM dd, yyyy') {
  try {
    const date = new Date(dateString);
    return format(date, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
}

