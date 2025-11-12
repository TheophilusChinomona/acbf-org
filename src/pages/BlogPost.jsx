import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiFacebook, FiTwitter, FiLinkedin, FiFileText } from 'react-icons/fi';
import { Container, Section, SEO, StructuredData } from '../components/common';
import { usePost, useRelatedPosts, usePosts } from '../hooks/usePosts';
import { formatDate } from '../utils/formatDate';
import Image from '../components/common/Image';
import PostCard from '../components/blog/PostCard';
import Button from '../components/common/Button';
import NotFound from './NotFound';
import settingsData from '../data/settings.json';

export default function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const post = usePost(slug);
  const allPosts = usePosts();
  const relatedPosts = useRelatedPosts(post, 3);

  if (!post) {
    return <NotFound />;
  }

  // Get previous and next posts
  const sortedPosts = [...allPosts].sort((a, b) => new Date(b.date) - new Date(a.date));
  const currentIndex = sortedPosts.findIndex(p => p.id === post.id);
  const prevPost = currentIndex > 0 ? sortedPosts[currentIndex - 1] : null;
  const nextPost = currentIndex < sortedPosts.length - 1 ? sortedPosts[currentIndex + 1] : null;

  // Social sharing URLs
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = post.title;
  const shareText = post.excerpt || '';

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
  };

  const handleShare = (platform) => {
    if (typeof window !== 'undefined') {
      window.open(shareLinks[platform], '_blank', 'width=600,height=400');
    }
  };

  // Extract text from HTML for description
  const description = post.excerpt || (post.content ? post.content.replace(/<[^>]*>/g, '').substring(0, 160) : '');
  const keywords = post.tags ? post.tags.join(', ') : post.categories?.join(', ');

  // Structured Data (JSON-LD) for Article
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const articleStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: description,
    image: post.featuredImage ? `${siteUrl}${post.featuredImage}` : undefined,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      '@type': 'Person',
      name: post.author || settingsData.siteName,
    },
    publisher: {
      '@type': 'Organization',
      name: settingsData.siteName,
      logo: {
        '@type': 'ImageObject',
        url: settingsData.logo ? `${siteUrl}${settingsData.logo}` : undefined,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': shareUrl,
    },
    articleSection: post.categories?.[0] || 'General',
    keywords: keywords,
  };

  return (
    <>
      <SEO
        title={post.title}
        description={description}
        image={post.featuredImage}
        url={shareUrl}
        type="article"
        keywords={keywords}
      />
      <StructuredData data={articleStructuredData} />
      
      {/* Hero Section with Gradient Background */}
      {post.categories?.includes('Events') ? (
        <section className="relative w-full overflow-hidden bg-gradient-to-br from-amber-600 via-amber-500 to-yellow-600 py-12 md:py-16 lg:py-20">
          {/* Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-300/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300/20 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-400/15 rounded-full blur-3xl"></div>
          </div>

          <Container>
            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center max-w-4xl mx-auto"
              >
                {/* Back Button */}
                <div className="mb-6">
                  <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 mx-auto bg-amber-900/20 border-amber-300/30 text-amber-50 hover:bg-amber-900/30"
                  >
                    <FiArrowLeft />
                    Back to Blog
                  </Button>
                </div>

                {/* Categories */}
                {post.categories && post.categories.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="flex flex-wrap gap-2 justify-center mb-6"
                  >
                    {post.categories.map((category, idx) => (
                      <Link
                        key={idx}
                        to={`/blog?category=${encodeURIComponent(category)}`}
                        className="px-3 py-1 text-sm font-medium bg-amber-900/30 backdrop-blur-sm text-amber-50 rounded-full hover:bg-amber-900/40 transition-colors border border-amber-300/30"
                      >
                        {category}
                      </Link>
                    ))}
                  </motion.div>
                )}

                {/* Icon */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="inline-flex items-center justify-center w-24 h-24 bg-amber-900/30 backdrop-blur-sm rounded-full mb-8 border-2 border-amber-300/30"
                >
                  <svg className="w-12 h-12 text-amber-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </motion.div>

                {/* Title */}
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="text-4xl md:text-5xl lg:text-6xl font-bold text-amber-50 mb-6 leading-tight"
                >
                  {post.title}
                </motion.h1>

                {/* Meta Information */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="flex flex-wrap items-center justify-center gap-4 text-amber-100"
                >
                  {post.author && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{post.author}</span>
                    </div>
                  )}
                  {post.date && (
                    <time dateTime={post.date} className="flex items-center gap-2">
                      {formatDate(post.date, 'MMMM dd, yyyy')}
                    </time>
                  )}
                </motion.div>
              </motion.div>
            </div>
          </Container>

          {/* Bottom Wave Decoration */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg className="w-full h-12 text-white" viewBox="0 0 1200 120" preserveAspectRatio="none" fill="none">
              <path d="M0,0 C300,120 900,0 1200,120 L1200,120 L0,120 Z" fill="white"></path>
            </svg>
          </div>
        </section>
      ) : (
        <section className="relative w-full overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 py-12 md:py-16 lg:py-20">
          {/* Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          </div>

          <Container>
            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center max-w-4xl mx-auto"
              >
                {/* Back Button */}
                <div className="mb-6">
                  <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 mx-auto bg-white/10 border-white/30 text-white hover:bg-white/20"
                  >
                    <FiArrowLeft />
                    Back to Blog
                  </Button>
                </div>

                {/* Categories */}
                {post.categories && post.categories.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="flex flex-wrap gap-2 justify-center mb-6"
                  >
                    {post.categories.map((category, idx) => (
                      <Link
                        key={idx}
                        to={`/blog?category=${encodeURIComponent(category)}`}
                        className="px-3 py-1 text-sm font-medium bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 transition-colors border border-white/30"
                      >
                        {category}
                      </Link>
                    ))}
                  </motion.div>
                )}

                {/* Icon */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full mb-8 border-2 border-white/30"
                >
                  <FiFileText className="w-12 h-12 text-white" />
                </motion.div>

                {/* Title */}
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
                >
                  {post.title}
                </motion.h1>

                {/* Meta Information */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="flex flex-wrap items-center justify-center gap-4 text-white/90"
                >
                  {post.author && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{post.author}</span>
                    </div>
                  )}
                  {post.date && (
                    <time dateTime={post.date} className="flex items-center gap-2">
                      {formatDate(post.date, 'MMMM dd, yyyy')}
                    </time>
                  )}
                </motion.div>
              </motion.div>
            </div>
          </Container>

          {/* Bottom Wave Decoration */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg className="w-full h-12 text-white" viewBox="0 0 1200 120" preserveAspectRatio="none" fill="none">
              <path d="M0,0 C300,120 900,0 1200,120 L1200,120 L0,120 Z" fill="white"></path>
            </svg>
          </div>
        </section>
      )}

      <Section className="py-12">
        <Container>
          <article className="max-w-4xl mx-auto">
            {/* Featured Image or Event Design */}
            {post.featuredImage ? (
              <div className="mb-8 rounded-lg overflow-hidden">
                <Image
                  src={post.featuredImage}
                  alt={post.title}
                  className="w-full h-auto"
                  lazy={false}
                />
              </div>
            ) : (
              <div className="relative mb-8 rounded-lg overflow-hidden bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 border-2 border-amber-200/50">
                {/* Decorative Elements */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-200/40 rounded-full blur-3xl"></div>
                  <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-yellow-200/40 rounded-full blur-3xl"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-300/30 rounded-full blur-3xl"></div>
                </div>
                
                {/* Content Overlay */}
                <div className="relative z-10 p-12 md:p-16 text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-600/20 backdrop-blur-sm rounded-full mb-6 border-2 border-amber-400/30">
                    <svg className="w-10 h-10 text-amber-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-amber-900 mb-4">
                    {post.categories?.includes('Events') ? 'Special Event' : 'Featured Post'}
                  </h2>
                  <p className="text-amber-800/80 text-lg">
                    Join us for an evening of celebration and recognition
                  </p>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="prose prose-lg max-w-none mb-12">
              <div
                dangerouslySetInnerHTML={{ __html: post.content }}
                className="blog-content"
              />
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mb-8 pb-8 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Tags:</h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag, idx) => (
                    <Link
                      key={idx}
                      to={`/blog?tag=${encodeURIComponent(tag)}`}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-primary hover:text-white transition-colors"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Social Sharing */}
            <div className="mb-12 pb-8 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Share this post:</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleShare('facebook')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  aria-label="Share on Facebook"
                >
                  <FiFacebook />
                  Facebook
                </button>
                <button
                  onClick={() => handleShare('twitter')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors"
                  aria-label="Share on Twitter"
                >
                  <FiTwitter />
                  Twitter
                </button>
                <button
                  onClick={() => handleShare('linkedin')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
                  aria-label="Share on LinkedIn"
                >
                  <FiLinkedin />
                  LinkedIn
                </button>
              </div>
            </div>

            {/* Previous/Next Navigation */}
            {(prevPost || nextPost) && (
              <div className="mb-12 pb-8 border-b border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {prevPost && (
                    <Link
                      to={`/blog/${prevPost.slug}`}
                      className="group p-4 border border-gray-200 rounded-lg hover:border-primary hover:shadow-md transition-all"
                    >
                      <div className="text-sm text-gray-500 mb-2">Previous Post</div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                        {prevPost.title}
                      </h3>
                    </Link>
                  )}
                  {nextPost && (
                    <Link
                      to={`/blog/${nextPost.slug}`}
                      className="group p-4 border border-gray-200 rounded-lg hover:border-primary hover:shadow-md transition-all md:text-right"
                    >
                      <div className="text-sm text-gray-500 mb-2">Next Post</div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                        {nextPost.title}
                      </h3>
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Posts</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {relatedPosts.map((relatedPost) => (
                    <PostCard key={relatedPost.id} post={relatedPost} layout="default" />
                  ))}
                </div>
              </div>
            )}
          </article>
        </Container>
      </Section>
    </>
  );
}
