# Firebase Backend Setup Guide - ACBF RSA React

**Date:** 2025-01-27  
**Status:** 📋 Complete Setup Guide  
**Architecture:** Frontend (cPanel) + Backend (Firebase)

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Step 1: Create Firebase Account & Project](#step-1-create-firebase-account--project)
4. [Step 2: Set Up Firestore Database](#step-2-set-up-firestore-database)
5. [Step 3: Configure Firestore Security Rules](#step-3-configure-firestore-security-rules)
6. [Step 4: Install Firebase SDK](#step-4-install-firebase-sdk)
7. [Step 5: Environment Configuration](#step-5-environment-configuration)
8. [Step 6: Create Firebase Client Utility](#step-6-create-firebase-client-utility)
9. [Step 7: Update Forms to Use Firebase](#step-7-update-forms-to-use-firebase)
10. [Step 8: Test Locally](#step-8-test-locally)
11. [Step 9: Build for Production](#step-9-build-for-production)
12. [Step 10: Deploy to cPanel](#step-10-deploy-to-cpanel)
13. [Step 11: Verify Deployment](#step-11-verify-deployment)
14. [Troubleshooting](#troubleshooting)
15. [Security Best Practices](#security-best-practices)
16. [Next Steps & Advanced Features](#next-steps--advanced-features)

---

## Overview

This guide will help you set up Firebase as your backend service while hosting your React frontend on cPanel. This architecture provides:

- ✅ **Scalable Backend**: Firebase handles database, authentication, and storage
- ✅ **Cost-Effective Frontend**: Static hosting on cPanel
- ✅ **Real-time Capabilities**: Firestore real-time listeners
- ✅ **Built-in Security**: Firestore Security Rules
- ✅ **Easy Management**: Firebase Console for data management

### Architecture Diagram

```
┌─────────────────┐         HTTPS         ┌──────────────────┐
│                 │ ────────────────────> │                  │
│  React Frontend │                        │   Firebase API   │
│   (cPanel)      │ <──────────────────── │   (Backend)      │
│                 │         HTTPS         │                  │
└─────────────────┘                        └──────────────────┘
     Static Files                            Firestore DB
     (HTML/CSS/JS)                          Authentication
                                              Storage
```

---

## Prerequisites

Before starting, ensure you have:

- [ ] Node.js 18+ installed
- [ ] npm or yarn package manager
- [ ] A Google account (for Firebase)
- [ ] cPanel hosting account with domain
- [ ] Git repository (optional, for version control)
- [ ] Basic knowledge of NoSQL/document databases (helpful but not required)

---

## Step 1: Create Firebase Account & Project

### 1.1 Sign Up for Firebase

1. Go to [https://firebase.google.com](https://firebase.google.com)
2. Click **"Get started"** or **"Go to console"**
3. Sign in with your Google account
4. If this is your first project, you'll see the Firebase console

### 1.2 Create a New Project

1. In Firebase Console, click **"Add project"** or **"Create a project"**
2. Fill in the project details:
   - **Project name**: `acbf-rsa-backend` (or your preferred name)
   - **Project ID**: Auto-generated (or customize it)
   - Click **"Continue"**
3. **Google Analytics** (optional):
   - Choose whether to enable Google Analytics
   - For form submissions, Analytics is optional
   - Click **"Continue"** (or skip if not using Analytics)
4. Click **"Create project"**
5. Wait 1-2 minutes for project initialization
6. Click **"Continue"** when ready

### 1.3 Get Your Project Credentials

1. In Firebase Console, click the gear icon ⚙️ next to **Project Overview**
2. Select **"Project settings"**
3. Scroll down to **"Your apps"** section
4. Click the **Web icon** (`</>`) to add a web app
5. Register your app:
   - **App nickname**: `ACBF RSA Website` (optional)
   - **Firebase Hosting**: Not needed (we're using cPanel)
   - Click **"Register app"**
6. Copy the Firebase configuration object (you'll need this):

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnop"
};
```

> ⚠️ **Important**: The `apiKey` is safe to expose in frontend code when Security Rules are properly configured.

---

## Step 2: Set Up Firestore Database

### 2.1 Create Firestore Database

1. In Firebase Console, click **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. **Security Rules**:
   - Select **"Start in test mode"** (we'll update rules in Step 3)
   - Click **"Next"**
4. **Location**:
   - Choose a location closest to your users
   - For South Africa, choose `europe-west` or `us-central`
   - Click **"Enable"**
5. Wait 1-2 minutes for database creation

### 2.2 Create Collections

Firestore uses **collections** (like tables) and **documents** (like rows). We'll create collections for our forms.

#### Create `contact_submissions` Collection

1. In Firestore Database, click **"Start collection"**
2. **Collection ID**: `contact_submissions`
3. **Document ID**: Click **"Auto-ID"** (Firebase will generate IDs)
4. Add the first field (we'll add a test document, then delete it):
   - **Field**: `name`
   - **Type**: `string`
   - **Value**: `Test`
   - Click **"Add field"**
   - **Field**: `email`
   - **Type**: `string`
   - **Value**: `test@example.com`
   - Click **"Add field"**
   - **Field**: `subject`
   - **Type**: `string`
   - **Value**: `Test Subject`
   - Click **"Add field"**
   - **Field**: `message`
   - **Type**: `string`
   - **Value**: `Test Message`
   - Click **"Add field"**
   - **Field**: `created_at`
   - **Type**: `timestamp`
   - **Value**: Click timestamp icon (current time)
   - Click **"Add field"**
   - **Field**: `status`
   - **Type**: `string`
   - **Value**: `new`
5. Click **"Save"**
6. Delete this test document (click the document, then click delete)

#### Create `membership_applications` Collection

1. Click **"Start collection"** again
2. **Collection ID**: `membership_applications`
3. **Document ID**: Click **"Auto-ID"**
4. Add fields:
   - `name` (string)
   - `email` (string)
   - `phone` (string)
   - `business_name` (string, optional)
   - `business_type` (string)
   - `message` (string, optional)
   - `created_at` (timestamp)
   - `status` (string) - default: `pending`
5. Click **"Save"**
6. Delete the test document

### 2.3 Verify Collections Created

1. In Firestore Database, you should see:
   - `contact_submissions` collection
   - `membership_applications` collection
2. Both collections should be empty (we deleted the test documents)

> **Note**: In Firestore, you don't need to define schema upfront. Documents can have different fields, but we'll keep them consistent for our forms.

---

## Step 3: Configure Firestore Security Rules

### 3.1 Access Security Rules

1. In Firebase Console, go to **Firestore Database**
2. Click the **"Rules"** tab at the top
3. You'll see the default test mode rules (which allow all reads/writes)

### 3.2 Set Up Security Rules

Replace the default rules with these secure rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Contact Submissions Collection
    match /contact_submissions/{submissionId} {
      // Allow anyone to create (insert) submissions
      allow create: if request.resource.data.keys().hasAll(['name', 'email', 'subject', 'message', 'created_at', 'status'])
                   && request.resource.data.name is string
                   && request.resource.data.email is string
                   && request.resource.data.subject is string
                   && request.resource.data.message is string
                   && request.resource.data.status == 'new';
      
      // Only authenticated users can read (for admin dashboard later)
      allow read: if request.auth != null;
      
      // Only authenticated users can update/delete
      allow update, delete: if request.auth != null;
    }
    
    // Membership Applications Collection
    match /membership_applications/{applicationId} {
      // Allow anyone to create (insert) applications
      allow create: if request.resource.data.keys().hasAll(['name', 'email', 'phone', 'business_type', 'created_at', 'status'])
                   && request.resource.data.name is string
                   && request.resource.data.email is string
                   && request.resource.data.phone is string
                   && request.resource.data.business_type is string
                   && request.resource.data.status == 'pending';
      
      // Only authenticated users can read (for admin dashboard later)
      allow read: if request.auth != null;
      
      // Only authenticated users can update/delete
      allow update, delete: if request.auth != null;
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 3.3 Publish Security Rules

1. Click **"Publish"** button
2. Wait a few seconds for rules to deploy
3. Rules are now active

### 3.4 Verify Rules

The rules ensure:
- ✅ Anyone can create (insert) form submissions
- ✅ Only authenticated users can read submissions
- ✅ Data validation on create
- ✅ All other access is denied

---

## Step 4: Install Firebase SDK

### 4.1 Install Firebase Package

Open your terminal in the project root and run:

```bash
npm install firebase
```

### 4.2 Verify Installation

Check `package.json` to confirm the package was added:

```bash
npm list firebase
```

---

## Step 5: Environment Configuration

### 5.1 Create Environment File

Create a `.env` file in the project root:

```bash
# .env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 5.2 Get Your Firebase Credentials

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll to **"Your apps"** section
3. Find your web app configuration
4. Copy each value to your `.env` file:
   - `apiKey` → `VITE_FIREBASE_API_KEY`
   - `authDomain` → `VITE_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `VITE_FIREBASE_PROJECT_ID`
   - `storageBucket` → `VITE_FIREBASE_STORAGE_BUCKET`
   - `messagingSenderId` → `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` → `VITE_FIREBASE_APP_ID`

### 5.3 Update .env File

Replace the placeholder values with your actual credentials:

```env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=acbf-rsa-backend.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=acbf-rsa-backend
VITE_FIREBASE_STORAGE_BUCKET=acbf-rsa-backend.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdefghijklmnop
```

### 5.4 Add .env to .gitignore

Ensure `.env` is in your `.gitignore` file:

```bash
# .gitignore
.env
.env.local
.env.*.local
```

> ⚠️ **Important**: Never commit `.env` files to version control!

### 5.5 Create .env.example (Optional but Recommended)

Create `.env.example` as a template:

```env
# .env.example
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

---

## Step 6: Create Firebase Client Utility

### 6.1 Create lib Directory

Create the directory structure:

```bash
mkdir -p src/lib
```

### 6.2 Create Firebase Client File

Create `src/lib/firebase.js`:

```javascript
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// Get environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Validate environment variables
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]

for (const envVar of requiredEnvVars) {
  if (!import.meta.env[envVar]) {
    throw new Error(`Missing env.${envVar}`)
  }
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firestore
export const db = getFirestore(app)

// Export app for other Firebase services if needed
export default app
```

### 6.3 Verify File Structure

Your project structure should now include:

```
src/
  lib/
    firebase.js
```

---

## Step 7: Update Forms to Use Firebase

### 7.1 Update ContactForm Component

Update `src/components/forms/ContactForm.jsx`:

**Add import at the top of the file:**

```javascript
import { db } from '../../lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
```

**Find this section (around line 25-42):**

```javascript
const onSubmit = async (data) => {
  setIsSubmitting(true);
  setSubmitStatus(null);

  try {
    // Phase 1: Use Formspree or similar service
    // Replace YOUR_FORMSPREE_ID with your actual Formspree form ID
    // You can get one at https://formspree.io/
    const FORMSPREE_ENDPOINT = 'https://formspree.io/f/YOUR_FORMSPREE_ID';
    
    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
      }),
    });

    if (response.ok) {
      setSubmitStatus('success');
      reset(); // Clear form on success
    } else {
      throw new Error('Failed to send message');
    }
  } catch (error) {
    console.error('Form submission error:', error);
    setSubmitStatus('error');
  } finally {
    setIsSubmitting(false);
  }
};
```

**Replace with:**

```javascript
const onSubmit = async (data) => {
  setIsSubmitting(true);
  setSubmitStatus(null);

  try {
    // Add document to Firestore
    const docRef = await addDoc(collection(db, 'contact_submissions'), {
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
      status: 'new',
      created_at: serverTimestamp(),
    });

    if (docRef.id) {
      setSubmitStatus('success');
      reset(); // Clear form on success
    }
  } catch (error) {
    console.error('Form submission error:', error);
    setSubmitStatus('error');
  } finally {
    setIsSubmitting(false);
  }
};
```

### 7.2 Update SignupForm Component

Update `src/components/forms/SignupForm.jsx`:

**Add import at the top of the file:**

```javascript
import { db } from '../../lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
```

**Find this section (around line 25-48):**

```javascript
const onSubmit = async (data) => {
  setIsSubmitting(true);
  setSubmitStatus(null);

  try {
    // Phase 1: Use Formspree or similar service
    // Replace YOUR_FORMSPREE_ID with your actual Formspree form ID for signup
    const FORMSPREE_ENDPOINT = 'https://formspree.io/f/YOUR_FORMSPREE_ID';
    
    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        formType: 'membership-signup',
        name: data.name,
        email: data.email,
        phone: data.phone,
        businessName: data.businessName,
        businessType: data.businessType === 'other' ? data.otherBusinessType : data.businessType,
        message: data.message,
      }),
    });

    if (response.ok) {
      setSubmitStatus('success');
      reset(); // Clear form on success
    } else {
      throw new Error('Failed to submit application');
    }
  } catch (error) {
    console.error('Form submission error:', error);
    setSubmitStatus('error');
  } finally {
    setIsSubmitting(false);
  }
};
```

**Replace with:**

```javascript
const onSubmit = async (data) => {
  setIsSubmitting(true);
  setSubmitStatus(null);

  try {
    // Add document to Firestore
    const docRef = await addDoc(collection(db, 'membership_applications'), {
      name: data.name,
      email: data.email,
      phone: data.phone,
      business_name: data.businessName || null,
      business_type: data.businessType === 'other' ? data.otherBusinessType : data.businessType,
      message: data.message || null,
      status: 'pending',
      created_at: serverTimestamp(),
    });

    if (docRef.id) {
      setSubmitStatus('success');
      reset(); // Clear form on success
    }
  } catch (error) {
    console.error('Form submission error:', error);
    setSubmitStatus('error');
  } finally {
    setIsSubmitting(false);
  }
};
```

---

## Step 8: Test Locally

### 8.1 Start Development Server

```bash
npm run dev
```

### 8.2 Test Contact Form

1. Navigate to `http://localhost:5173/contact` (or your dev port)
2. Fill out the contact form
3. Submit the form
4. Check browser console for errors
5. Go to Firebase Console → **Firestore Database** → `contact_submissions`
6. Verify the submission appears in the collection

### 8.3 Test Membership Form

1. Navigate to the membership signup page
2. Fill out the membership application form
3. Submit the form
4. Check browser console for errors
5. Go to Firebase Console → **Firestore Database** → `membership_applications`
6. Verify the application appears in the collection

### 8.4 Common Issues to Check

- ✅ Environment variables are loaded (check browser console)
- ✅ No CORS errors in console
- ✅ Firebase client is initialized correctly
- ✅ Security Rules allow creates
- ✅ Data appears in Firestore collections

---

## Step 9: Build for Production

### 9.1 Update Environment Variables for Production

**Option A: Build-time Environment Variables (Recommended)**

Environment variables are embedded at build time. Update your `.env` file with production values:

```env
VITE_FIREBASE_API_KEY=your-production-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-production-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-production-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-production-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-production-sender-id
VITE_FIREBASE_APP_ID=your-production-app-id
```

**Option B: Runtime Configuration (Advanced)**

If you need different environments, create a config file that's loaded at runtime. This is more complex but allows changing configs without rebuilding.

### 9.2 Build the Application

```bash
npm run build:prod
```

This will:
- Generate sitemap
- Build optimized production files
- Create `dist` folder with all static files

### 9.3 Verify Build Output

Check the `dist` folder contains:
- `index.html`
- `assets/` folder with CSS and JS files
- All images from `public/assets/`

### 9.4 Test Production Build Locally

```bash
npm run preview
```

Test forms in preview mode to ensure everything works.

---

## Step 10: Deploy to cPanel

### 10.1 Prepare Files for Upload

1. Ensure `.env` file has production Firebase credentials
2. Build the application: `npm run build:prod`
3. Verify `dist` folder contains all files

### 10.2 Upload to cPanel

Follow the deployment steps from `DEPLOYMENT-GUIDE.md`:

1. **Access cPanel File Manager**
   - Log into cPanel
   - Navigate to **File Manager**
   - Open `public_html` folder

2. **Backup Existing Site**
   - Select all files
   - Create ZIP backup
   - Download backup

3. **Upload React Build**
   - Upload all files from `dist` folder to `public_html`
   - Upload `.htaccess` file
   - Upload `robots.txt` and `sitemap.xml`

4. **Set File Permissions**
   - Files: `644`
   - Folders: `755`

### 10.3 Verify Environment Variables

Since Vite embeds environment variables at build time, ensure you built with the correct production values. The built JavaScript files will contain your Firebase credentials.

> ⚠️ **Note**: The API key is safe to expose in frontend code when Security Rules are properly configured.

---

## Step 11: Verify Deployment

### 11.1 Test Live Forms

1. Visit your live website
2. Test contact form submission
3. Test membership application form
4. Check browser console for errors

### 11.2 Verify Data in Firebase

1. Go to Firebase Console
2. Check **Firestore Database** → `contact_submissions`
3. Check **Firestore Database** → `membership_applications`
4. Verify new submissions appear

### 11.3 Check Security Rules

1. Go to Firebase Console → **Firestore Database** → **Rules**
2. Verify rules are published and active
3. Test that anonymous users can create but not read

### 11.4 Monitor Submissions

Set up monitoring:
- Check Firebase Console regularly
- Set up email notifications (Cloud Functions - advanced)
- Consider creating an admin dashboard (future enhancement)

---

## Troubleshooting

### Issue: "Missing env.VITE_FIREBASE_API_KEY" Error

**Solution:**
- Verify `.env` file exists in project root
- Check environment variable names (must start with `VITE_`)
- Restart development server after creating/updating `.env`
- For production, ensure you built with correct environment variables

### Issue: CORS Errors

**Solution:**
- Firebase handles CORS automatically for Firestore
- If you see CORS errors, check:
  - Firebase project is active
  - API key is correct
  - Security Rules allow the operation

### Issue: "Missing or insufficient permissions"

**Solution:**
- Verify Security Rules are published (Step 3)
- Check rules allow `create` for anonymous users
- Review Security Rules in Firebase Console
- Check browser console for specific error message

### Issue: Form Submits but Data Doesn't Appear

**Solution:**
- Check Firebase Console → **Firestore Database**
- Verify collection names match exactly (case-sensitive)
- Check Security Rules allow creates
- Review browser console for specific error messages
- Verify `serverTimestamp()` is used for `created_at`

### Issue: Environment Variables Not Working in Production

**Solution:**
- Remember: Vite embeds env vars at build time
- Rebuild with correct production values
- Check built JavaScript files contain the values (search for your Firebase project ID)
- Never commit `.env` files to version control

### Issue: "Failed to fetch" or Network Errors

**Solution:**
- Check Firebase project is active (not deleted)
- Verify Firebase configuration is correct
- Check internet connection
- Verify API key is valid
- Check browser console for specific error

### Issue: Timestamp Shows as null

**Solution:**
- Ensure you're using `serverTimestamp()` from `firebase/firestore`
- Don't use `new Date()` - use `serverTimestamp()` for Firestore
- Timestamps will show as null until the document is synced

---

## Security Best Practices

### 1. Firestore Security Rules

✅ **Always configure Security Rules** before going to production
✅ **Restrict reads** to authenticated users only
✅ **Allow public creates** only for forms (if needed)
✅ **Validate data** in Security Rules

### 2. API Keys

✅ **API key is safe** to expose in frontend (when Security Rules are configured)
❌ **Never expose service account keys** in frontend code
✅ **Rotate API keys** if compromised (in Project Settings)

### 3. Environment Variables

✅ **Use `.env` files** for local development
✅ **Add `.env` to `.gitignore`**
✅ **Use different projects** for development and production
✅ **Never commit secrets** to version control

### 4. Data Validation

✅ **Validate on frontend** (React Hook Form)
✅ **Validate in Security Rules** (Firestore Rules)
✅ **Sanitize user input** before storing

### 5. Rate Limiting

Consider implementing rate limiting for forms:
- Use Cloud Functions with rate limiting
- Implement client-side throttling
- Monitor for spam submissions in Firebase Console

---

## Next Steps & Advanced Features

### 1. Email Notifications

Set up email notifications when forms are submitted:
- Use Firebase Cloud Functions
- Integrate with SendGrid, Mailgun, or similar
- Trigger on document creation

### 2. Admin Dashboard

Create an admin dashboard to:
- View all submissions
- Update submission status
- Export data
- Manage applications
- Use Firebase Authentication for admin access

### 3. Authentication

Add user authentication for:
- Admin access
- Member portals
- Protected content
- Use Firebase Authentication (multiple providers)

### 4. File Uploads

Use Firebase Storage for:
- Document uploads
- Profile pictures
- Application attachments

### 5. Real-time Updates

Use Firestore real-time listeners for:
- Live submission notifications
- Real-time dashboard updates
- Chat features

### 6. Cloud Functions

Create Cloud Functions for:
- Email notifications
- Data processing
- Automated workflows
- Server-side validation

### 7. Backup & Recovery

- Set up automated backups (Firestore export)
- Export data regularly
- Test recovery procedures

---

## Checklist Summary

### Pre-Setup
- [ ] Firebase account created
- [ ] Project created in Firebase
- [ ] Credentials saved securely

### Database Setup
- [ ] Firestore Database created
- [ ] Collections created (`contact_submissions`, `membership_applications`)
- [ ] Security Rules configured and published
- [ ] Test documents created and deleted

### Code Setup
- [ ] Firebase SDK installed
- [ ] `.env` file created with credentials
- [ ] Firebase client utility created (`src/lib/firebase.js`)
- [ ] ContactForm updated to use Firebase
- [ ] SignupForm updated to use Firebase

### Testing
- [ ] Forms tested locally
- [ ] Data appears in Firestore collections
- [ ] No console errors
- [ ] Production build tested

### Deployment
- [ ] Production build created
- [ ] Files uploaded to cPanel
- [ ] Live forms tested
- [ ] Data verified in Firebase
- [ ] Security Rules verified

### Security
- [ ] Security Rules published
- [ ] `.env` in `.gitignore`
- [ ] No secrets committed to Git
- [ ] Production credentials configured

---

## Support Resources

- **Firebase Documentation**: https://firebase.google.com/docs
- **Firestore Documentation**: https://firebase.google.com/docs/firestore
- **Firebase Console**: https://console.firebase.google.com
- **Firebase Community**: https://firebase.google.com/community
- **React + Firebase Tutorial**: https://firebase.google.com/docs/web/setup

---

**Setup Status:** ✅ Complete  
**Last Updated:** 2025-01-27  
**Version:** 1.0.0

---

## Quick Reference

### Firebase Console URLs

- **Project Dashboard**: `https://console.firebase.google.com/project/[project-id]`
- **Firestore Database**: Dashboard → Firestore Database
- **Security Rules**: Dashboard → Firestore Database → Rules
- **Project Settings**: Dashboard → Project Settings (gear icon)

### Important Commands

```bash
# Install Firebase SDK
npm install firebase

# Development
npm run dev

# Production build
npm run build:prod

# Preview production build
npm run preview
```

### Environment Variables Template

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### Firebase Imports Reference

```javascript
// Firestore
import { db } from './lib/firebase'
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore'

// Authentication (for future use)
import { getAuth } from 'firebase/auth'

// Storage (for future use)
import { getStorage } from 'firebase/storage'
```

---

**Need Help?** Review the troubleshooting section or check Firebase documentation for specific issues.
