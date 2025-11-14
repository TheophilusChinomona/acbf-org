# ACBF.org.za Live Deployment Guide

**Date:** 2025-11-14
**Status:** Ready for Live Deployment
**Domain:** acbf.org.za
**Project:** ACBF RSA React Application with Firebase Backend

---

## Overview

This guide provides step-by-step instructions for deploying the ACBF RSA React application to the live production site at **acbf.org.za**. The application includes a public website, member portal, admin dashboard, and Firebase backend.

---

## Current Features

### Public Website
- Homepage with hero video and sections
- About page
- Portfolio showcase
- Blog with posts
- Awards page with nomination form (modal)
- Contact page with Formspree integration
- Search functionality
- Dynamic page routing

### Member Portal
- Member registration and authentication
- Member dashboard (Coming Soon - planned for future)
- Protected member routes
- Profile management

### Admin Dashboard
- Admin authentication
- Contact submissions management
- Membership applications management
- Awards nominations management
- User management (super admin)
- Submission detail views with status updates
- Delete functionality for all submission types
- Role management system

### Backend (Firebase)
- Firestore database with security rules
- Firebase Authentication
- Real-time data synchronization
- Collections: users, approved_admins, contact_submissions, membership_applications, awards_nominations

---

## Pre-Deployment Checklist

Before you start, ensure you have:

- [x] All features tested locally (`npm run dev`)
- [x] Production build works (`npm run build`)
- [x] All content migrated and verified
- [x] Images optimized and in place
- [x] Firebase project configured and deployed
- [x] Firestore security rules deployed
- [ ] cPanel access credentials for acbf.org.za
- [ ] Domain DNS pointing to hosting server
- [ ] Backup of existing site (if any)
- [ ] SSL certificate ready or AutoSSL available

---

## Step 1: Pre-Deployment Configuration

### 1.1 Update Sitemap Configuration

**File:** `scripts/generate-sitemap.js`

Find the line with `SITE_URL` and update to:
```javascript
const SITE_URL = 'https://acbf.org.za';
```

### 1.2 Update robots.txt

**File:** `public/robots.txt`

Update the sitemap URL:
```
User-agent: *
Allow: /

Sitemap: https://acbf.org.za/sitemap.xml
```

### 1.3 Verify Firebase Configuration

**File:** `src/config/firebase.js`

Ensure your Firebase configuration is correct:
- Project ID matches your Firebase project
- API keys are current and valid
- Auth domain is correct
- No hardcoded test/dev credentials

### 1.4 Verify Formspree Configuration

**File:** `src/components/forms/ContactForm.jsx`

Ensure your Formspree form ID is configured for production use.

---

## Step 2: Generate Production Build

### 2.1 Generate Sitemap

Open terminal in project directory:
```bash
npm run generate:sitemap
```

**Verify:** Check that `public/sitemap.xml` was created with acbf.org.za URLs.

### 2.2 Build for Production

```bash
npm run build:prod
```

This will:
- Generate sitemap.xml
- Build optimized production files
- Create `dist` folder with all static files
- Minify JavaScript and CSS
- Optimize images and assets

### 2.3 Verify Build Output

Check the `dist` folder contains:
- [x] `index.html`
- [x] `assets/` folder with CSS and JS files
- [x] All images from `public/assets/`
- [x] `sitemap.xml`
- [x] `robots.txt`
- [x] `.htaccess`

**Expected Bundle Size:** ~500-800 KB (gzipped)

---

## Step 3: Deploy to cPanel

### Method: Manual Upload via cPanel File Manager

#### 3.1 Access cPanel

1. Go to your hosting provider's cPanel login
2. Log in with your credentials
3. Locate and click **File Manager**
4. Navigate to `public_html` (or your domain's root directory)

#### 3.2 Backup Existing Site

**CRITICAL: Do not skip this step!**

1. In File Manager, go to `public_html`
2. Select all files and folders (Ctrl+A)
3. Click **Compress** button
4. Choose **Zip Archive**
5. Name it: `backup-acbf-org-za-2025-11-14.zip`
6. Click **Compress File(s)**
7. Once created, click **Download**
8. Save backup to a safe location on your computer
9. **Verify the backup file size is reasonable (should be several MB)**

#### 3.3 Clear Old Files

1. In `public_html`, select all files and folders
2. Click **Delete** button
3. Confirm deletion
4. Verify `public_html` is now empty

**Important:** If you have any `.htaccess` files with custom server configurations you want to keep, note them down before deleting.

#### 3.4 Upload React Build Files

1. In File Manager, ensure you're in `public_html` directory
2. Click **Upload** button at the top
3. In the upload interface, select files from your local `dist` folder:
   - Select **ALL files and folders** from `dist/`
   - This includes `index.html`, `assets/` folder, images, etc.
4. Upload method options:
   - **Drag and drop** all files from `dist/` folder
   - OR use **Select File** button to upload individually
5. Wait for upload to complete (may take 5-10 minutes depending on size)
6. Once complete, close upload interface

#### 3.5 Verify Upload

In File Manager, verify `public_html` now contains:
- [x] `index.html` at root level
- [x] `assets/` folder with JavaScript and CSS files
- [x] `sitemap.xml`
- [x] `robots.txt`
- [x] `.htaccess`
- [x] All image folders (if any)

#### 3.6 Set File Permissions

**IMPORTANT for security and functionality:**

1. Select all **files** in `public_html`
2. Click **Permissions** or **Change Permissions**
3. Set to: **644** (rw-r--r--)
4. Apply to files

5. Select all **folders**
6. Click **Permissions**
7. Set to: **755** (rwxr-xr-x)
8. Apply to folders

**Special files:**
- `.htaccess`: **644**
- `index.html`: **644**

---

## Step 4: Configure Domain and SSL

### 4.1 Verify Domain Configuration

1. In cPanel, go to **Domains** section
2. Verify `acbf.org.za` points to `public_html`
3. Check that there are no redirects or aliases interfering

### 4.2 Enable SSL Certificate (HTTPS)

**Option A: AutoSSL (Let's Encrypt) - Recommended**

1. In cPanel, navigate to **SSL/TLS Status**
2. Find `acbf.org.za` in the list
3. Click **Enable AutoSSL** or **Run AutoSSL**
4. Wait 5-10 minutes for certificate generation
5. Refresh page and verify certificate is active
6. Test: Visit `https://acbf.org.za` (should show secure padlock)

**Option B: Manual SSL Certificate**

If you have a purchased SSL certificate:
1. In cPanel, go to **SSL/TLS Manager**
2. Click **Manage SSL Sites**
3. Select your domain
4. Upload certificate, private key, and CA bundle
5. Click **Install Certificate**

### 4.3 Force HTTPS Redirect

The `.htaccess` file already includes HTTPS redirect rules. Verify by checking:

**File:** `public_html/.htaccess`

Should contain:
```apache
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

Test: Visit `http://acbf.org.za` (without https) - should redirect to `https://acbf.org.za`

---

## Step 5: Verify Firebase Configuration

### 5.1 Confirm Firebase Project is Live

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your ACBF project
3. Verify:
   - [x] Firebase Authentication is enabled
   - [x] Firestore Database is active
   - [x] Security rules are deployed
   - [x] Email/Password authentication is enabled

### 5.2 Check Authorized Domains

1. In Firebase Console → Authentication → Settings
2. Go to **Authorized domains** tab
3. Ensure `acbf.org.za` is in the list
4. If not, click **Add domain** and add:
   - `acbf.org.za`
   - `www.acbf.org.za` (if using www subdomain)

### 5.3 Verify Firestore Security Rules

1. In Firebase Console → Firestore Database → Rules
2. Verify rules are published
3. Check rules include:
   - Public access to website content
   - Protected admin routes
   - Member authentication requirements
   - Contact/membership/awards submission rules

**Important Collections:**
- `users` - User accounts
- `approved_admins` - Admin accounts
- `contact_submissions` - Contact form submissions
- `membership_applications` - Membership applications
- `awards_nominations` - Awards nominations

---

## Step 6: Post-Deployment Testing

### 6.1 Basic Functionality Tests

Visit the live site and test each page:

**Public Website:**
- [ ] Homepage loads at `https://acbf.org.za`
- [ ] Hero video plays automatically
- [ ] All navigation links work
- [ ] About page displays correctly
- [ ] Portfolio page loads with items
- [ ] Blog page shows posts
- [ ] Individual blog posts open correctly
- [ ] Awards page displays
- [ ] Awards nomination modal opens
- [ ] Contact page loads
- [ ] Contact form displays (test but don't submit yet)
- [ ] Search functionality works
- [ ] Footer links work

**React Router Tests:**
- [ ] Direct URL access works (e.g., `acbf.org.za/blog`)
- [ ] Refresh any page (should NOT show 404)
- [ ] Browser back/forward buttons work correctly
- [ ] All routes are accessible

**Forms Testing:**
- [ ] Contact form submission works (Formspree)
- [ ] Awards nomination form submission works (Firebase)
- [ ] Success messages display
- [ ] Form validation works
- [ ] Error handling works

**Member Features:**
- [ ] Registration page loads at `/register`
- [ ] Can create new member account
- [ ] Email verification works (if enabled)
- [ ] Login page loads at `/member/login`
- [ ] Can log in with credentials
- [ ] Member dashboard accessible after login
- [ ] Member can log out

**Admin Features:**
- [ ] Admin login page loads at `/admin/login`
- [ ] Can log in with admin credentials
- [ ] Admin dashboard displays submissions
- [ ] Can view contact submissions
- [ ] Can view membership applications
- [ ] Can view awards nominations
- [ ] Can update submission status
- [ ] Can delete submissions
- [ ] Super admin can access user management
- [ ] Can change user roles (super admin only)

### 6.2 Mobile Responsiveness Testing

Test on multiple devices:
- [ ] iPhone/iOS mobile view
- [ ] Android mobile view
- [ ] Tablet view (iPad, etc.)
- [ ] Desktop (1920px+)
- [ ] Desktop (1366px - standard laptop)

Check:
- [ ] Navigation menu (hamburger on mobile)
- [ ] Forms are usable on mobile
- [ ] Images scale properly
- [ ] Text is readable
- [ ] Buttons are touch-friendly
- [ ] Modals work on mobile
- [ ] No horizontal scrolling

### 6.3 Browser Compatibility Testing

Test in multiple browsers:
- [ ] Google Chrome (latest)
- [ ] Mozilla Firefox (latest)
- [ ] Safari (macOS/iOS)
- [ ] Microsoft Edge (latest)
- [ ] Mobile browsers (Chrome Mobile, Safari Mobile)

### 6.4 Performance Testing

**Google Lighthouse Audit:**
1. Open Chrome DevTools (F12)
2. Go to **Lighthouse** tab
3. Select:
   - Performance ✓
   - Accessibility ✓
   - Best Practices ✓
   - SEO ✓
4. Click **Analyze page load**
5. Review scores

**Target Scores:**
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

**Google PageSpeed Insights:**
1. Go to [PageSpeed Insights](https://pagespeed.web.dev/)
2. Enter: `https://acbf.org.za`
3. Click **Analyze**
4. Review both Mobile and Desktop scores

**Core Web Vitals Targets:**
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.5s
- Cumulative Layout Shift (CLS): < 0.1

### 6.5 SEO Verification

**Meta Tags:**
- [ ] View page source (Ctrl+U)
- [ ] Verify `<title>` tag is present
- [ ] Verify meta description exists
- [ ] Check Open Graph tags for social sharing
- [ ] Verify canonical URLs

**Sitemap and Robots:**
- [ ] Visit `https://acbf.org.za/sitemap.xml`
- [ ] Verify sitemap displays with all pages
- [ ] Visit `https://acbf.org.za/robots.txt`
- [ ] Verify robots.txt is accessible

**Structured Data:**
1. Go to [Google Rich Results Test](https://search.google.com/test/rich-results)
2. Enter: `https://acbf.org.za`
3. Verify structured data is detected
4. Check for errors

---

## Step 7: Search Engine Setup

### 7.1 Google Search Console

1. **Add Property:**
   - Go to [Google Search Console](https://search.google.com/search-console)
   - Click **Add Property**
   - Select **URL prefix**
   - Enter: `https://acbf.org.za`
   - Click **Continue**

2. **Verify Ownership:**
   - Method 1: HTML file upload
     - Download verification file
     - Upload to `public_html` via cPanel
     - Click **Verify**
   - Method 2: DNS verification (if you have DNS access)
     - Add TXT record to DNS
     - Wait for propagation
     - Click **Verify**

3. **Submit Sitemap:**
   - In Google Search Console, go to **Sitemaps**
   - Click **Add new sitemap**
   - Enter: `sitemap.xml`
   - Click **Submit**
   - Wait 24-48 hours for indexing

4. **Monitor:**
   - Check **Coverage** report for crawl errors
   - Review **Performance** for search analytics
   - Monitor **Core Web Vitals**

### 7.2 Bing Webmaster Tools

1. **Add Site:**
   - Go to [Bing Webmaster Tools](https://www.bing.com/webmasters)
   - Sign in or create account
   - Click **Add a site**
   - Enter: `https://acbf.org.za`

2. **Verify Ownership:**
   - Choose verification method (XML file or meta tag)
   - Complete verification

3. **Submit Sitemap:**
   - Go to **Sitemaps** section
   - Click **Submit sitemap**
   - Enter: `https://acbf.org.za/sitemap.xml`
   - Click **Submit**

### 7.3 Google Analytics (Optional)

If you want to track site analytics:

1. **Create Account:**
   - Go to [Google Analytics](https://analytics.google.com/)
   - Create account or property for acbf.org.za
   - Get your Measurement ID (starts with G-)

2. **Add Tracking Code:**
   - This requires rebuilding the site
   - Add GA4 script to `index.html` before `</head>`
   - Rebuild and redeploy

3. **Verify Installation:**
   - Use Google Analytics DebugView
   - Visit your site
   - Verify events are tracked

---

## Step 8: Final Verification Checklist

### Critical Checks

- [ ] Site loads at `https://acbf.org.za` (with HTTPS)
- [ ] HTTP redirects to HTTPS automatically
- [ ] All pages are accessible
- [ ] No 404 errors on any route
- [ ] React Router works (page refresh doesn't break)
- [ ] All images load correctly
- [ ] All forms submit successfully
- [ ] Admin login works
- [ ] Member registration/login works
- [ ] Firebase connection is working
- [ ] Firestore data is readable/writable
- [ ] Mobile responsive on all pages
- [ ] No console errors (F12 → Console tab)
- [ ] No console warnings about security issues
- [ ] SSL certificate is valid and active
- [ ] Sitemap is accessible
- [ ] robots.txt is accessible

### Security Checks

- [ ] HTTPS is enforced (HTTP redirects to HTTPS)
- [ ] Firebase API keys are not exposed in client code (this is normal for Firebase)
- [ ] Admin routes are protected (cannot access without login)
- [ ] Member routes are protected
- [ ] Firestore security rules are active
- [ ] No sensitive data in console logs
- [ ] CORS is properly configured
- [ ] XSS protection enabled (React default)

---

## Step 9: Monitor and Maintain

### First 24 Hours

Monitor for:
- Server errors (check cPanel error logs)
- Firebase quota usage (check Firebase Console)
- Form submissions working
- User registrations working
- Any reported issues from users

### First Week

- [ ] Check Google Search Console for crawl errors
- [ ] Monitor Firebase usage and costs
- [ ] Review Google Analytics data (if installed)
- [ ] Check for any 404 errors in logs
- [ ] Verify all forms are receiving submissions
- [ ] Test admin dashboard functionality

### Ongoing Maintenance

**Weekly:**
- Check form submissions in admin dashboard
- Review membership applications
- Monitor Firebase Firestore usage

**Monthly:**
- Review Google Search Console performance
- Check Core Web Vitals
- Update content (blog posts, portfolio)
- Backup Firestore database
- Review Firebase costs

**As Needed:**
- Update npm dependencies: `npm update`
- Rebuild and redeploy: `npm run build:prod`
- Monitor security advisories for dependencies

---

## Troubleshooting Common Issues

### Issue: Site Shows "Index of /" or Directory Listing

**Cause:** `index.html` not in the root directory

**Solution:**
1. Verify `index.html` is in `public_html` (not in a subdirectory)
2. Check file permissions: should be 644
3. Verify file is named `index.html` (not `Index.html` or other variation)

### Issue: Pages Show 404 on Refresh or Direct Access

**Cause:** `.htaccess` file missing or incorrect

**Solution:**
1. Verify `.htaccess` exists in `public_html`
2. Check `.htaccess` contains React Router rewrite rules:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>
```
3. Verify mod_rewrite is enabled in cPanel (contact host if needed)

### Issue: Images Not Loading (404 errors)

**Cause:** Incorrect image paths or missing files

**Solution:**
1. Open browser console (F12) and check exact 404 URLs
2. Verify images are in `public_html/assets/` directory
3. Check image paths in code (should be `/assets/images/...`)
4. Verify file names match exactly (case-sensitive)
5. Check file permissions: 644 for images

### Issue: CSS/JavaScript Not Loading

**Cause:** Incorrect asset paths or missing files

**Solution:**
1. Check browser console for 404 errors
2. Verify `assets/` folder uploaded correctly
3. Check file permissions: 644
4. Clear browser cache (Ctrl+Shift+R)
5. Check if server has gzip compression enabled (should be in `.htaccess`)

### Issue: Firebase Authentication Not Working

**Cause:** Domain not authorized in Firebase

**Solution:**
1. Go to Firebase Console → Authentication → Settings
2. Click **Authorized domains**
3. Add `acbf.org.za` to the list
4. Wait a few minutes for changes to propagate
5. Clear browser cache and try again

### Issue: Forms Not Submitting to Firestore

**Cause:** Firestore security rules or Firebase config

**Solution:**
1. Check browser console for error messages
2. Verify Firestore security rules are deployed
3. Check Firebase Console → Firestore → Rules
4. Verify rules allow public writes for contact/awards forms
5. Check that Firebase config in code matches your project

### Issue: Admin/Member Login Not Working

**Cause:** Firebase Authentication config or authorized domains

**Solution:**
1. Verify email/password authentication is enabled in Firebase Console
2. Check authorized domains include acbf.org.za
3. Verify admin user exists in Firestore `approved_admins` collection
4. Check browser console for specific error messages
5. Try creating a new admin user in Firebase Console

### Issue: Site Not Updating After New Deploy

**Cause:** Browser cache or CDN cache

**Solution:**
1. Hard refresh browser: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Clear browser cache completely
3. Try incognito/private browsing mode
4. Check cPanel File Manager - verify files have recent timestamps
5. Wait 5-10 minutes for server cache to clear

### Issue: Slow Performance

**Cause:** Build optimization or hosting server

**Solution:**
1. Verify you uploaded `dist` folder (production build), not `src` folder
2. Check `.htaccess` has gzip compression enabled
3. Run Lighthouse audit to identify specific issues
4. Consider enabling CDN (Cloudflare)
5. Optimize images further (use WebP format)
6. Enable browser caching in `.htaccess`

### Issue: HTTPS Not Working

**Cause:** SSL certificate not installed or not active

**Solution:**
1. Check cPanel → SSL/TLS Status
2. Verify certificate is valid and active for acbf.org.za
3. If using AutoSSL, wait up to 24 hours for issuance
4. Check `.htaccess` has HTTPS redirect rules
5. Contact hosting support if certificate won't install

### Issue: Contact Form Not Sending Emails

**Cause:** Formspree configuration

**Solution:**
1. Verify Formspree form ID in `ContactForm.jsx`
2. Check Formspree account is active
3. Verify domain is verified in Formspree
4. Test form submission manually
5. Check Formspree dashboard for submission logs

### Issue: Awards Nominations Not Saving

**Cause:** Firestore security rules

**Solution:**
1. Check browser console for "permission-denied" errors
2. Verify Firestore rules allow public writes to `awards_nominations`
3. Check Firebase Console → Firestore → Data
4. Verify collection name matches: `awards_nominations`
5. Test in Firebase Console by manually adding a document

---

## Updating the Live Site

### Content Updates (No Code Changes)

If you only need to update content (text, images):

1. Make changes locally
2. Test: `npm run dev`
3. Build: `npm run build:prod`
4. Upload new `dist` folder to cPanel
5. Clear browser cache
6. Verify changes live

### Code Updates (Feature Changes)

If you're adding features or fixing bugs:

1. Make changes locally
2. Test thoroughly: `npm run dev`
3. Run build: `npm run build:prod`
4. Verify build has no errors
5. **Backup current live site** (cPanel → Compress → Download)
6. Upload new `dist` folder to cPanel
7. Test all functionality on live site
8. Monitor for errors

### Firebase Updates (Rules/Collections)

If you need to update Firestore rules or structure:

1. Update rules in Firebase Console
2. Click **Publish** to deploy
3. Test immediately on live site
4. Have rollback plan (save previous rules)

---

## Rollback Plan

If something goes wrong after deployment:

### Quick Rollback

1. Go to cPanel → File Manager
2. Delete all files in `public_html`
3. Upload your backup ZIP file
4. Extract in `public_html`
5. Verify site is restored

### Firebase Rollback

1. Go to Firebase Console → Firestore → Rules
2. Click **View History**
3. Select previous version
4. Click **Restore**

---

## Support and Resources

### Documentation
- **React Router:** https://reactrouter.com/
- **Firebase:** https://firebase.google.com/docs
- **Formspree:** https://formspree.io/docs
- **Google Search Console:** https://support.google.com/webmasters

### Hosting Support
- Contact your cPanel hosting provider for:
  - SSL certificate issues
  - Server configuration (mod_rewrite, etc.)
  - File upload limits
  - Performance optimization

### Firebase Support
- Firebase Console: https://console.firebase.google.com/
- Firebase Status: https://status.firebase.google.com/
- Firebase Support: Available in Firebase Console

---

## Deployment Summary

**Pre-Deployment:**
- [x] Configuration files updated (sitemap, robots.txt)
- [x] Firebase configured and rules deployed
- [x] Production build created and verified

**Deployment:**
- [ ] Site backed up
- [ ] Files uploaded to cPanel
- [ ] Permissions set correctly
- [ ] SSL certificate active

**Post-Deployment:**
- [ ] All pages tested and working
- [ ] Forms submitting correctly
- [ ] Authentication working
- [ ] Mobile responsive verified
- [ ] Performance scores acceptable
- [ ] Search engines notified (sitemap submitted)

---

## Next Steps After Successful Deployment

1. **Announce Launch:**
   - Send email to existing members
   - Post on social media
   - Update any external links to new site

2. **Monitor Performance:**
   - Check Google Search Console weekly
   - Monitor Firebase usage and costs
   - Review form submissions daily

3. **Content Updates:**
   - Add new blog posts regularly
   - Update portfolio items
   - Keep awards categories current

4. **Future Enhancements:**
   - Implement member portal features (Phase 2)
   - Add Google Analytics
   - Consider CDN for faster global performance
   - Implement automated backups

---

**Deployment Status:** ⏳ Pending
**Last Updated:** 2025-11-14
**Domain:** https://acbf.org.za
**Deployed By:** [Your Name]
**Deployment Date:** [To be filled when deployed]

---

## Quick Reference Commands

```bash
# Generate sitemap
npm run generate:sitemap

# Build for production
npm run build:prod

# Test locally
npm run dev

# Update dependencies
npm update

# Check for security vulnerabilities
npm audit
```

## Important File Paths

- **Local build output:** `dist/`
- **Server root:** `public_html/`
- **Config files:** `public/.htaccess`, `public/robots.txt`
- **Firebase config:** `src/config/firebase.js`
- **Sitemap generator:** `scripts/generate-sitemap.js`

---

**Good luck with your deployment! 🚀**
