/**
 * Pages Data Index
 * 
 * This file aggregates all individual page JSON files into a single array
 * for backward compatibility with existing imports.
 * 
 * Individual pages are stored in separate JSON files for better maintainability:
 * - about.json
 * - contact.json
 * - privacy-policy.json
 * - terms-of-service.json
 */

import aboutPage from './about.json';
import contactPage from './contact.json';
import privacyPolicyPage from './privacy-policy.json';
import termsOfServicePage from './terms-of-service.json';

/**
 * Array of all pages, sorted by ID
 * Maintains the same structure as the original pages.json
 */
const pagesData = [
  aboutPage,
  contactPage,
  privacyPolicyPage,
  termsOfServicePage,
];

export default pagesData;

