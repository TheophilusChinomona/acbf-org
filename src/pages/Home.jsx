import { useEffect } from 'react';
import { SEO } from '../components/common';
import {
  Hero,
  Features,
  AboutPreview,
  PortfolioPreview,
  BlogPreview,
  ClientsPartners,
  CTA
} from '../components/home';

/**
 * Home Page Component
 * Main landing page with all sections
 */
export default function Home() {
  // Enable smooth scrolling for the entire page
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <>
      <SEO
        title="Home"
        description="Welcome to ACBF RSA - Your trusted partner for excellence and innovation."
        type="website"
      />
      <main className="min-h-screen">
        {/* Hero Section */}
        <Hero />

        {/* Features Section */}
        <Features />

        {/* About Preview Section */}
        <AboutPreview />

        {/* Portfolio Preview Section */}
        <PortfolioPreview />

        {/* Blog Preview Section */}
        <BlogPreview />

        {/* Clients/Partners Section */}
        <ClientsPartners />

        {/* CTA Section */}
        <CTA />
      </main>
    </>
  );
}
