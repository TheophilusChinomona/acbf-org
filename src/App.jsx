import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SiteProvider } from './context/SiteContext';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Loading from './components/common/Loading';
import ErrorBoundary from './components/common/ErrorBoundary';
import ScrollToTop from './components/common/ScrollToTop';

// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const PortfolioItem = lazy(() => import('./pages/PortfolioItem'));
const MemberItem = lazy(() => import('./pages/MemberItem'));
const Contact = lazy(() => import('./pages/Contact'));
const Search = lazy(() => import('./pages/Search'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const BecomingAMember = lazy(() => import('./pages/BecomingAMember'));
const DynamicPage = lazy(() => import('./pages/DynamicPage'));
const NotFound = lazy(() => import('./pages/NotFound'));
const TestAuth = lazy(() => import('./pages/TestAuth'));

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <ScrollToTop />
        <AuthProvider>
          <SiteProvider>
            <Layout>
              <Suspense fallback={<Loading fullScreen text="Loading..." />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:slug" element={<BlogPost />} />
                  <Route path="/members" element={<Portfolio />} />
                  <Route path="/members/:slug" element={<MemberItem />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms-of-service" element={<TermsOfService />} />
                  <Route path="/becoming-a-member" element={<BecomingAMember />} />
                  <Route path="/page/:slug" element={<DynamicPage />} />
                  <Route path="/test-auth" element={<TestAuth />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </Layout>
          </SiteProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App
