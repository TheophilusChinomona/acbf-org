# ACBF RSA - Future Development Roadmap

## Current State Analysis

### Technology Stack
- **Frontend**: React 18+ with Vite, Tailwind CSS, React Router DOM v6
- **State Management**: React Context API (basic UI state only)
- **Data Storage**: Static JSON files (`members.json`, `posts.json`, `portfolio.json`, etc.)
- **Forms**: React Hook Form with Formspree placeholders
- **Deployment**: Static site on cPanel
- **Backend**: None currently (Supabase setup guide exists but not implemented)

### Current Features
- Public website with Home, About, Blog, Portfolio/Members pages
- Contact form and membership signup form (using Formspree placeholders)
- Member directory with profiles
- Search functionality
- Dynamic page system
- Responsive design with mobile menu

### Current Limitations
- No authentication system
- No database integration
- No user management
- No content management system
- Forms use placeholder endpoints
- All data is static JSON files
- No member-only content or features
- No admin capabilities

## Future Development Phases

### Phase 2: Backend Infrastructure & Authentication

#### 2.1 Supabase Integration
- **Files to create/modify**:
  - `src/lib/supabase.js` - Supabase client configuration
  - `.env` / `.env.local` - Environment variables for Supabase keys
  - `src/hooks/useAuth.js` - Authentication hook
  - `src/context/AuthContext.jsx` - Authentication context provider
  - Update `src/App.jsx` to include AuthProvider

- **Database Schema Setup**:
  - `users` table (extends Supabase auth.users)
  - `profiles` table (user profile data)
  - `members` table (member organization data)
  - `blog_posts` table
  - `portfolio_items` table
  - `contact_submissions` table
  - `membership_applications` table
  - `events` table (for future event management)
  - `user_roles` table (for role-based access control)

- **Authentication Features**:
  - Email/password authentication
  - Password reset functionality
  - Email verification
  - Social authentication (Google, optional)
  - Session management
  - Protected routes

#### 2.2 Data Migration
- **Files to create**:
  - `scripts/migrate-data-to-supabase.js` - Migration script
  - Update all data hooks (`useMembers.js`, `usePosts.js`, `usePortfolio.js`) to fetch from Supabase instead of JSON

- **Migration Tasks**:
  - Migrate `members.json` to `members` table
  - Migrate `posts.json` to `blog_posts` table
  - Migrate `portfolio.json` to `portfolio_items` table
  - Preserve existing slugs and relationships

### Phase 3: Member Portal

#### 3.1 Member Authentication & Registration
- **Files to create**:
  - `src/pages/auth/Login.jsx`
  - `src/pages/auth/Register.jsx`
  - `src/pages/auth/ForgotPassword.jsx`
  - `src/pages/auth/VerifyEmail.jsx`
  - `src/components/auth/AuthGuard.jsx` - Route protection component
  - `src/components/auth/ProtectedRoute.jsx` - Protected route wrapper

- **Features**:
  - Member login/registration
  - Email verification workflow
  - Password reset flow
  - Account activation (admin approval for new members)

#### 3.2 Member Dashboard
- **Files to create**:
  - `src/pages/member/Dashboard.jsx` - Main member dashboard
  - `src/pages/member/Profile.jsx` - Member profile management
  - `src/pages/member/EditProfile.jsx` - Profile editing
  - `src/pages/member/Documents.jsx` - Member documents library
  - `src/pages/member/Events.jsx` - Upcoming events for members
  - `src/pages/member/Networking.jsx` - Member directory/networking
  - `src/components/member/MemberStats.jsx` - Member statistics widget
  - `src/components/member/UpcomingEvents.jsx` - Events widget
  - `src/components/member/MemberDirectory.jsx` - Member directory component

- **Features**:
  - Personal dashboard with overview
  - Profile management (update contact info, business details)
  - Document library (access to member-only documents)
  - Event calendar and registration
  - Member directory (searchable, filterable)
  - Membership status and renewal tracking
  - Payment history (if membership fees apply)

#### 3.3 Member-Only Content
- **Files to modify**:
  - `src/pages/Blog.jsx` - Add member-only blog posts filter
  - `src/pages/Portfolio.jsx` - Add member-only portfolio items
  - `src/components/common/ProtectedContent.jsx` - Component to wrap member-only content

- **Features**:
  - Member-only blog posts
  - Exclusive resources and downloads
  - Member-only events
  - Private member forum/discussions (optional, Phase 4)

### Phase 4: Admin Dashboard

#### 4.1 Admin Authentication & Authorization
- **Files to create**:
  - `src/utils/roles.js` - Role definitions and permissions
  - `src/hooks/usePermissions.js` - Permission checking hook
  - `src/components/admin/AdminGuard.jsx` - Admin route protection
  - Update `src/context/AuthContext.jsx` to include role checking

- **Role System**:
  - `super_admin` - Full system access
  - `admin` - Content and user management
  - `editor` - Content management only
  - `member` - Regular member access

#### 4.2 Admin Dashboard Layout
- **Files to create**:
  - `src/pages/admin/Dashboard.jsx` - Admin dashboard home
  - `src/components/admin/AdminLayout.jsx` - Admin layout wrapper
  - `src/components/admin/AdminSidebar.jsx` - Admin navigation sidebar
  - `src/components/admin/AdminHeader.jsx` - Admin header with user menu

- **Dashboard Overview**:
  - Statistics widgets (total members, new applications, recent activity)
  - Quick actions
  - Recent submissions
  - System health indicators

#### 4.3 Content Management
- **Files to create**:
  - `src/pages/admin/content/BlogPosts.jsx` - Blog post management
  - `src/pages/admin/content/BlogPostEditor.jsx` - Create/edit blog posts
  - `src/pages/admin/content/Portfolio.jsx` - Portfolio item management
  - `src/pages/admin/content/PortfolioEditor.jsx` - Create/edit portfolio items
  - `src/pages/admin/content/Pages.jsx` - Dynamic page management
  - `src/pages/admin/content/PageEditor.jsx` - Create/edit dynamic pages
  - `src/components/admin/ContentEditor.jsx` - Rich text editor component (consider integrating TinyMCE or similar)
  - `src/components/admin/ImageUploader.jsx` - Image upload component for Supabase Storage

- **Features**:
  - Create, edit, delete blog posts
  - Rich text editor with image upload
  - SEO metadata management
  - Draft/publish workflow
  - Content scheduling (optional)
  - Media library management

#### 4.4 Member Management
- **Files to create**:
  - `src/pages/admin/members/Members.jsx` - Member list and management
  - `src/pages/admin/members/MemberDetail.jsx` - Individual member view/edit
  - `src/pages/admin/members/Applications.jsx` - Membership application review
  - `src/pages/admin/members/ApplicationDetail.jsx` - Application review detail
  - `src/components/admin/MemberTable.jsx` - Member data table with filters
  - `src/components/admin/ApplicationCard.jsx` - Application review card

- **Features**:
  - View all members with search/filter
  - Approve/reject membership applications
  - Edit member profiles
  - Manage member status (active, inactive, suspended)
  - Send emails to members
  - Export member data (CSV)
  - Member activity logs

#### 4.5 User Management
- **Files to create**:
  - `src/pages/admin/users/Users.jsx` - User list
  - `src/pages/admin/users/UserDetail.jsx` - User detail/edit
  - `src/pages/admin/users/Roles.jsx` - Role management
  - `src/components/admin/UserTable.jsx` - User data table
  - `src/components/admin/RoleSelector.jsx` - Role assignment component

- **Features**:
  - View all users (members and admins)
  - Assign roles and permissions
  - Activate/deactivate users
  - Reset passwords
  - View user activity

#### 4.6 Form Submissions Management
- **Files to create**:
  - `src/pages/admin/submissions/Contact.jsx` - Contact form submissions
  - `src/pages/admin/submissions/Applications.jsx` - Membership applications
  - `src/components/admin/SubmissionTable.jsx` - Submission data table

- **Features**:
  - View all contact form submissions
  - View membership applications
  - Mark as read/unread
  - Reply to submissions (email integration)
  - Export submissions
  - Delete submissions

#### 4.7 Analytics & Reporting
- **Files to create**:
  - `src/pages/admin/analytics/Overview.jsx` - Analytics dashboard
  - `src/components/admin/analytics/StatsCards.jsx` - Statistics cards
  - `src/components/admin/analytics/Charts.jsx` - Chart components (consider Chart.js or Recharts)

- **Features**:
  - Member growth statistics
  - Application trends
  - Popular content analytics
  - User engagement metrics
  - Export reports

### Phase 5: Enhanced Features

#### 5.1 Event Management
- **Files to create**:
  - `src/pages/Events.jsx` - Public events page
  - `src/pages/EventDetail.jsx` - Event detail page
  - `src/pages/admin/events/Events.jsx` - Admin event management
  - `src/pages/admin/events/EventEditor.jsx` - Create/edit events
  - `src/pages/member/MyEvents.jsx` - Member's registered events
  - `src/components/events/EventCard.jsx` - Event card component
  - `src/components/events/EventCalendar.jsx` - Calendar view
  - `src/hooks/useEvents.js` - Events data hook

- **Database Tables**:
  - `events` table
  - `event_registrations` table

- **Features**:
  - Create and manage events
  - Event registration for members
  - Event calendar view
  - Email notifications for events
  - Event capacity management
  - Waitlist functionality

#### 5.2 File Storage & Management
- **Files to create**:
  - `src/lib/storage.js` - Supabase Storage utilities
  - `src/components/admin/FileManager.jsx` - File browser/manager
  - `src/components/common/FileUpload.jsx` - Reusable file upload component

- **Features**:
  - Supabase Storage integration
  - Image uploads for blog posts, portfolio, profiles
  - Document storage for members
  - File organization (folders/buckets)
  - File access control

#### 5.3 Email System
- **Files to create**:
  - `src/lib/email.js` - Email utility functions
  - `src/pages/admin/emails/Templates.jsx` - Email template management
  - `src/pages/admin/emails/Send.jsx` - Send email interface

- **Features**:
  - Email templates
  - Automated emails (welcome, password reset, etc.)
  - Bulk email to members
  - Email logs

#### 5.4 Payment Integration (Optional)
- **Files to create**:
  - `src/pages/member/Payments.jsx` - Payment history
  - `src/pages/member/RenewMembership.jsx` - Membership renewal
  - `src/pages/admin/payments/Payments.jsx` - Payment management
  - `src/lib/payments.js` - Payment processing utilities

- **Features**:
  - Membership fee payment
  - Payment gateway integration (Stripe/PayPal)
  - Payment history
  - Invoice generation
  - Automatic renewal reminders

### Phase 6: Advanced Features

#### 6.1 Notifications System
- **Files to create**:
  - `src/context/NotificationContext.jsx` - Notification context
  - `src/components/common/NotificationCenter.jsx` - Notification UI
  - `src/hooks/useNotifications.js` - Notifications hook

- **Features**:
  - In-app notifications
  - Email notifications
  - Push notifications (optional)
  - Notification preferences

#### 6.2 Search Enhancement
- **Files to modify**:
  - `src/pages/Search.jsx` - Enhanced search
  - `src/hooks/useSearch.js` - Enhanced search hook

- **Features**:
  - Full-text search across all content
  - Advanced filters
  - Search history
  - Search analytics

#### 6.3 API Development
- **Files to create**:
  - `src/lib/api.js` - API client utilities
  - Supabase Edge Functions for custom API endpoints (if needed)

- **Features**:
  - RESTful API structure
  - API documentation
  - Rate limiting
  - API authentication

## Implementation Priority

### High Priority (Phase 2-3)
1. Supabase integration and database setup
2. Authentication system
3. Basic member portal (dashboard, profile)
4. Basic admin dashboard (content management, member management)

### Medium Priority (Phase 4)
1. Advanced admin features (analytics, reporting)
2. Event management
3. File storage integration
4. Email system

### Low Priority (Phase 5-6)
1. Payment integration
2. Advanced notifications
3. API development
4. Additional advanced features

## Technical Considerations

### Dependencies to Add
- `@supabase/supabase-js` - Supabase client
- `@supabase/auth-helpers-react` - React auth helpers (optional)
- `react-query` or `@tanstack/react-query` - Data fetching and caching
- `zod` - Schema validation
- `date-fns` - Already installed, continue using
- `react-hot-toast` or `react-toastify` - Toast notifications
- `recharts` or `chart.js` - Charts for analytics

### File Structure Updates
```
src/
  ├── lib/
  │   ├── supabase.js
  │   ├── storage.js
  │   └── email.js
  ├── context/
  │   ├── AuthContext.jsx (new)
  │   └── NotificationContext.jsx (new)
  ├── hooks/
  │   ├── useAuth.js (new)
  │   ├── usePermissions.js (new)
  │   └── useNotifications.js (new)
  ├── pages/
  │   ├── auth/ (new)
  │   ├── member/ (new)
  │   └── admin/ (new)
  └── components/
      ├── auth/ (new)
      ├── admin/ (new)
      └── member/ (new)
```

### Security Considerations
- Implement Row Level Security (RLS) policies in Supabase
- Validate all user inputs
- Sanitize content before storing
- Implement rate limiting
- Use environment variables for sensitive data
- Regular security audits
- HTTPS enforcement (already in .htaccess)

### Performance Considerations
- Implement code splitting for admin/member routes
- Use React Query for efficient data fetching and caching
- Optimize images (already have image optimization)
- Lazy load admin dashboard components
- Implement pagination for large data sets
- Use Supabase real-time subscriptions efficiently

## Migration Strategy

1. **Phase 2.1**: Set up Supabase project and database schema
2. **Phase 2.2**: Create migration scripts to move JSON data to Supabase
3. **Phase 2.3**: Update data hooks to fetch from Supabase (keep JSON as fallback during transition)
4. **Phase 2.4**: Implement authentication
5. **Phase 3**: Build member portal incrementally
6. **Phase 4**: Build admin dashboard incrementally
7. **Phase 5-6**: Add advanced features as needed

## Testing Strategy

- Unit tests for utilities and hooks
- Integration tests for authentication flows
- E2E tests for critical user journeys (member registration, admin content creation)
- Manual testing checklist for each phase

## Documentation Requirements

- API documentation
- Admin user guide
- Member portal user guide
- Developer setup guide
- Database schema documentation
- Deployment guide updates

