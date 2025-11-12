import { Helmet } from 'react-helmet-async';

/**
 * Structured Data Component (JSON-LD)
 * Adds structured data for SEO (Article, Organization, etc.)
 * @param {Object} props
 * @param {Object} props.data - Structured data object
 */
export default function StructuredData({ data }) {
  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(data)}
      </script>
    </Helmet>
  );
}

