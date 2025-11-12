import { Helmet } from 'react-helmet-async';
import settingsData from '../../data/settings.json';

/**
 * SEO Component
 * Manages meta tags, Open Graph, and Twitter Card tags for SEO
 * @param {Object} props
 * @param {string} props.title - Page title (will be appended to site name)
 * @param {string} props.description - Meta description
 * @param {string} props.image - Open Graph image URL
 * @param {string} props.url - Canonical URL
 * @param {string} props.type - Open Graph type (website, article, etc.)
 * @param {string} props.keywords - Meta keywords (optional)
 */
export default function SEO({
  title,
  description,
  image,
  url,
  type = 'website',
  keywords,
}) {
  const siteName = settingsData.siteName || 'ACBF RSA';
  const siteDescription = settingsData.siteDescription || 'ACBF RSA Website';
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const metaDescription = description || siteDescription;
  const ogImage = image || `${siteUrl}/assets/images/og-image.jpg`;
  const canonicalUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={ogImage} />

      {/* Additional Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
    </Helmet>
  );
}

