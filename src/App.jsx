import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SiteProvider } from './context/SiteContext';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Loading from './components/common/Loading';
import ErrorBoundary from './components/common/ErrorBoundary';
import ScrollToTop from './components/common/ScrollToTop';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminProtectedRoute from './components/auth/AdminProtectedRoute';

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

// Admin pages (outside Layout wrapper)
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminApply = lazy(() => import('./pages/admin/AdminApply'));
const AdminManagement = lazy(() => import('./pages/admin/AdminManagement'));
const SubmissionDetail = lazy(() => import('./pages/admin/SubmissionDetail'));

// Wrapper component for public routes with Layout
function PublicRoutes() {
  return (
    <Layout>
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
    </Layout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <ScrollToTop />
        <AuthProvider>
          <SiteProvider>
            <Suspense fallback={<Loading fullScreen text="Loading..." />}>
              <Routes>
                {/* Admin routes (outside Layout wrapper) */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                  path="/admin/apply"
                  element={
                    <ProtectedRoute>
                      <AdminApply />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <AdminProtectedRoute>
                      <AdminDashboard />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/management"
                  element={
                    <AdminProtectedRoute>
                      <AdminManagement />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/submissions/:type/:id"
                  element={
                    <AdminProtectedRoute>
                      <SubmissionDetail />
                    </AdminProtectedRoute>
                  }
                />

                {/* Public routes (inside Layout wrapper) */}
                <Route path="/*" element={<PublicRoutes />} />
              </Routes>
            </Suspense>
          </SiteProvider>
        </AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </Router>
    </ErrorBoundary>
  );
}

export default App
