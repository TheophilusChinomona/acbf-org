/**
 * Sitemap Generator Script
 * Generates sitemap.xml from your content data
 * Run with: node scripts/generate-sitemap.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration - Update with your actual domain
const SITE_URL = 'https://acbf.org.za'; // UPDATE THIS!
const OUTPUT_FILE = path.join(__dirname, '../public/sitemap.xml');

// Import data
const postsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../src/data/posts.json'), 'utf8')
);
const pagesData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../src/data/pages.json'), 'utf8')
);
const portfolioData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../src/data/portfolio.json'), 'utf8')
);

// Static routes
const staticRoutes = [
  { url: '', priority: '1.0', changefreq: 'daily' }, // Home
  { url: 'about', priority: '0.9', changefreq: 'monthly' },
  { url: 'blog', priority: '0.9', changefreq: 'daily' },
  { url: 'portfolio', priority: '0.9', changefreq: 'weekly' },
  { url: 'contact', priority: '0.8', changefreq: 'monthly' },
  { url: 'privacy-policy', priority: '0.5', changefreq: 'yearly' },
  { url: 'terms-of-service', priority: '0.5', changefreq: 'yearly' },
];

// Generate sitemap XML
function generateSitemap() {
  const urls = [];

  // Add static routes
  staticRoutes.forEach((route) => {
    urls.push({
      loc: `${SITE_URL}/${route.url}`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: route.changefreq,
      priority: route.priority,
    });
  });

  // Add blog posts
  postsData.forEach((post) => {
    urls.push({
      loc: `${SITE_URL}/blog/${post.slug}`,
      lastmod: post.date ? post.date.split('T')[0] : new Date().toISOString().split('T')[0],
      changefreq: 'monthly',
      priority: '0.8',
    });
  });

  // Add pages (excluding contact/about which are already in static routes)
  const excludedPages = ['about', 'contact'];
  pagesData.forEach((page) => {
    if (!excludedPages.includes(page.slug)) {
      urls.push({
        loc: `${SITE_URL}/${page.slug}`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'monthly',
        priority: '0.7',
      });
    }
  });

  // Add portfolio items
  portfolioData.forEach((item) => {
    urls.push({
      loc: `${SITE_URL}/portfolio/${item.slug}`,
      lastmod: item.projectDate
        ? item.projectDate.split('T')[0]
        : new Date().toISOString().split('T')[0],
      changefreq: 'monthly',
      priority: '0.8',
    });
  });

  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  // Write to file
  fs.writeFileSync(OUTPUT_FILE, xml, 'utf8');
  console.log(`✅ Sitemap generated successfully!`);
  console.log(`   Location: ${OUTPUT_FILE}`);
  console.log(`   Total URLs: ${urls.length}`);
}

// Run generator
try {
  generateSitemap();
} catch (error) {
  console.error('❌ Error generating sitemap:', error);
  process.exit(1);
}

