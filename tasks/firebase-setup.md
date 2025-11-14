# Firebase Console Setup Guide for Member & Admin Registration

**Date:** 2025-01-27
**Purpose:** Configure Firebase Console to enable the member and admin registration system
**Prerequisites:** Firebase project must be created and connected to your app

---

## Overview

This guide covers the Firebase Console configuration needed to make the signup and registration system work. You'll need to update Firestore Security Rules and enable Authentication features.

---

## Step 1: Enable Email/Password Authentication

### Actions in Firebase Console:

1. **Navigate to Authentication**
   - Open [Firebase Console](https://console.firebase.google.com/)
   - Select your project: **acbf-org**
   - Click **Authentication** in the left sidebar
   - Click **Get Started** (if first time)

2. **Enable Email/Password Sign-in Method**
   - Click the **Sign-in method** tab
   - Find **Email/Password** in the provider list
   - Click the **Edit** icon (pencil)
   - Toggle **Enable** to ON
   - Click **Save**

3. **Optional: Enable Email Link (Passwordless sign-in)**
   - In the same Email/Password provider settings
   - Toggle **Email link (passwordless sign-in)** to ON (optional)
   - Click **Save**

✅ **Verification:** The Email/Password provider should show as "Enabled" in the Sign-in method tab

---

## Step 2: Update Firestore Security Rules

### Current Issue:
Your current `firestore.rules` file doesn't have rules for the new collections:
- `users` (user profiles and roles)
- `admin_invitations` (admin invitation tokens)
- Updated `membership_applications` (to allow user linking)

### Actions in Firebase Console:

1. **Navigate to Firestore Database**
   - In Firebase Console, click **Firestore Database** in the left sidebar
   - Click the **Rules** tab at the top

2. **Update Security Rules**
   - Click **Edit rules**
   - Replace the entire rules file with the updated version below
   - Click **Publish**

### Updated Firestore Security Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Super Admin - Only this email can manage everything
    function isSuperAdmin() {
      return request.auth != null
        && request.auth.token.email == 'chinomonatinotenda19@gmail.com';
    }

    // Helper function to check if user is an approved admin
    function isAdmin() {
      return request.auth != null
        && exists(/databases/$(database)/documents/approved_admins/$(request.auth.token.email))
        && get(/databases/$(database)/documents/approved_admins/$(request.auth.token.email)).data.status == 'approved';
    }

    // Helper function to check if user has admin role in users collection
    function isAdminUser() {
      return request.auth != null
        && exists(/databases/$(database)/documents/users/$(request.auth.uid))
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'super_admin'];
    }

    // Helper function to check if it's the user's own profile
    function isOwnProfile() {
      return request.auth != null && request.auth.uid == resource.id;
    }

    // ========================================
    // Users Collection (NEW - Required for signup)
    // ========================================
    match /users/{userId} {
      // Allow any authenticated user to create their own profile during registration
      allow create: if request.auth != null
                   && request.auth.uid == userId
                   && request.resource.data.keys().hasAll(['email', 'name', 'role', 'status', 'created_at'])
                   && request.resource.data.email == request.auth.token.email
                   && request.resource.data.role in ['member', 'admin', 'super_admin']
                   && request.resource.data.status in ['pending', 'approved', 'rejected'];

      // Users can read their own profile
      allow read: if request.auth != null && request.auth.uid == userId;

      // Admins and super admin can read all user profiles
      allow read: if isAdmin() || isSuperAdmin() || isAdminUser();

      // Users can update their own profile (limited fields only)
      allow update: if request.auth != null
                   && request.auth.uid == userId
                   && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'status', 'approved_by', 'approved_at', 'rejected_by', 'rejected_at']);

      // Admins can update any user's role and status
      allow update: if isAdmin() || isSuperAdmin() || isAdminUser();

      // Only super admin can delete users
      allow delete: if isSuperAdmin();
    }

    // ========================================
    // Admin Invitations Collection (NEW - Required for admin invitations)
    // ========================================
    match /admin_invitations/{invitationId} {
      // Admins can create invitations
      allow create: if (isAdmin() || isSuperAdmin() || isAdminUser())
                   && request.resource.data.keys().hasAll(['email', 'invited_by', 'invited_by_name', 'token', 'status', 'expires_at', 'created_at'])
                   && request.resource.data.status == 'pending';

      // Anyone can read invitation by token (needed for acceptance page)
      allow read: if true;

      // Admins can read all invitations
      allow read: if isAdmin() || isSuperAdmin() || isAdminUser();

      // Invitee can update to accept (mark as accepted)
      allow update: if request.auth != null
                   && resource.data.email == request.auth.token.email
                   && resource.data.status == 'pending'
                   && request.resource.data.status == 'accepted';

      // Admins can update/delete invitations (cancel, etc.)
      allow update, delete: if isAdmin() || isSuperAdmin() || isAdminUser();
    }

    // ========================================
    // Membership Applications Collection (UPDATED)
    // ========================================
    match /membership_applications/{applicationId} {
      // Allow anyone to create applications
      allow create: if request.resource.data.keys().hasAll(['name', 'email', 'phone', 'business_type', 'created_at', 'status'])
                   && request.resource.data.name is string
                   && request.resource.data.email is string
                   && request.resource.data.phone is string
                   && request.resource.data.business_type is string
                   && request.resource.data.status == 'pending';

      // Users can read their own application (if authenticated and email matches)
      allow read: if request.auth != null
                 && resource.data.email == request.auth.token.email;

      // Users can update their own application to link user_id after registration
      allow update: if request.auth != null
                   && resource.data.email == request.auth.token.email
                   && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['user_id', 'account_created']);

      // Admins can read all applications
      allow read: if isAdmin() || isSuperAdmin() || isAdminUser();

      // Admins can update/delete applications (approve, reject, etc.)
      allow update, delete: if isAdmin() || isSuperAdmin() || isAdminUser();
    }

    // ========================================
    // Admin Applications Collection (EXISTING - Keep for backward compatibility)
    // ========================================
    match /admin_applications/{applicationId} {
      allow create: if request.auth != null
                   && request.resource.data.keys().hasAll(['email', 'name', 'reason', 'created_at', 'status'])
                   && request.resource.data.email == request.auth.token.email
                   && request.resource.data.status == 'pending';

      allow read: if request.auth != null
                && (resource.data.email == request.auth.token.email || isSuperAdmin());

      allow update, delete: if isSuperAdmin();
    }

    // ========================================
    // Approved Admins Collection (EXISTING)
    // ========================================
    match /approved_admins/{email} {
      allow read: if isSuperAdmin() || isAdminUser();

      allow create: if isSuperAdmin()
                 && request.resource.data.keys().hasAll(['email', 'name', 'approved_by', 'approved_at', 'status'])
                 && request.resource.data.email == email
                 && request.resource.data.status == 'approved';

      allow update, delete: if isSuperAdmin();
    }

    // ========================================
    // Contact Submissions Collection (EXISTING)
    // ========================================
    match /contact_submissions/{submissionId} {
      allow create: if request.resource.data.keys().hasAll(['name', 'email', 'subject', 'message', 'created_at', 'status'])
                   && request.resource.data.status == 'new';

      allow read: if isAdmin() || isSuperAdmin() || isAdminUser();
      allow update, delete: if isAdmin() || isSuperAdmin() || isAdminUser();
    }

    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. **Test the Rules**
   - Click the **Rules Playground** tab
   - Test scenarios:
     - **Create user profile:** Authenticated user creating their own profile
     - **Read user profile:** User reading their own profile
     - **Admin read users:** Admin reading all user profiles
     - **Create invitation:** Admin creating invitation

✅ **Verification:** Rules should publish without errors. Test in Rules Playground.

---

## Step 3: Create Initial Super Admin User (If Needed)

If you don't already have a super admin user created:

### Actions in Firebase Console:

1. **Navigate to Authentication**
   - Click **Authentication** in the left sidebar
   - Click the **Users** tab

2. **Add User Manually**
   - Click **Add user** button
   - Enter email: `chinomonatinotenda19@gmail.com` (or your super admin email)
   - Enter a strong password
   - Click **Add user**

3. **Create User Profile in Firestore**
   - Go to **Firestore Database**
   - Click **Start collection**
   - Collection ID: `users`
   - Document ID: Copy the **User UID** from Authentication > Users tab
   - Add fields:
     ```
     email: "chinomonatinotenda19@gmail.com"
     name: "Your Name"
     role: "super_admin"
     status: "approved"
     created_at: [Click "timestamp" and use current time]
     ```
   - Click **Save**

✅ **Verification:** You should be able to log in with this email and access admin features

---

## Step 4: Configure App Routes (Code Changes Required)

### What's Missing:

Your [App.jsx](../src/App.jsx) file is missing the new routes for:
- `/register` - Member registration page
- `/register/:applicationId` - Member registration with application link
- `/invite/:token` - Admin invitation acceptance page
- `/member/pending` - Pending approval page for members

### Action Required:

You need to update [App.jsx](../src/App.jsx) to add these routes. See **Phase 7, Step 7.1** in [member-admin-registration-plan.md](./member-admin-registration-plan.md).

---

## Step 5: Verify Firebase Configuration in Code

### Check Firebase Config:

1. **Verify [src/lib/firebase.js](../src/lib/firebase.js)**
   - Ensure `auth` is exported
   - Ensure `db` (Firestore) is exported
   - Check that Firebase is initialized correctly

2. **Verify [src/context/AuthContext.jsx](../src/context/AuthContext.jsx)**
   - ✅ Already implemented
   - Has `register` function
   - Has `login` function
   - Has `logout` function

✅ **Verification:** Both files exist and are properly configured

---

## Step 6: Test the Complete Flow

### Test Member Registration:

1. **Submit Membership Application**
   - Go to `/becoming-a-member`
   - Fill out and submit the membership application form
   - You should see success message with "Create Account" button

2. **Create Member Account**
   - Click "Create Account" button
   - Should redirect to `/register/:applicationId`
   - Fill in password and submit
   - Firebase Auth should create account
   - Firestore should create user profile with `role: "member"`, `status: "pending"`

3. **Check Member Pending Status**
   - After registration, user should see pending approval page
   - Check Firestore `users` collection for the new user document

### Test Admin Invitation:

1. **Create Admin Invitation**
   - Log in as super admin
   - Go to `/admin/management`
   - Use "Invite Admin" form to create invitation
   - Check Firestore `admin_invitations` collection for new invitation

2. **Accept Admin Invitation**
   - Copy the invitation token
   - Visit `/invite/:token` in browser
   - Fill in registration form
   - Submit to create admin account
   - Should redirect to admin dashboard

3. **Verify Admin Access**
   - New admin should have access to admin dashboard
   - Check Firestore `users` collection - role should be `"admin"`

---

## Step 7: Monitor and Debug

### Firebase Console Debugging Tools:

1. **Authentication Tab**
   - View all registered users
   - Check user emails and UIDs
   - Disable/delete test users

2. **Firestore Database Tab**
   - Browse collections: `users`, `admin_invitations`, `membership_applications`
   - View document contents
   - Manually edit documents if needed

3. **Rules Playground**
   - Test security rules before deploying
   - Simulate different authentication states
   - Test read/write operations

4. **Usage Tab**
   - Monitor authentication usage
   - Monitor database reads/writes
   - Check for unexpected spikes

### Common Issues and Solutions:

#### Issue: "Missing or insufficient permissions" error

**Solution:**
- Check Firestore Security Rules are published
- Verify user is authenticated (check `request.auth != null`)
- Verify user has correct role in `users` collection

#### Issue: User can't create profile during registration

**Solution:**
- Check that `users` collection rules allow `create` for authenticated users
- Verify `userId` in document path matches `request.auth.uid`
- Check that required fields are included in the document

#### Issue: Admin invitation link doesn't work

**Solution:**
- Verify `/invite/:token` route is added to App.jsx
- Check that `admin_invitations` collection rules allow anyone to read
- Verify token hasn't expired
- Check invitation status is `"pending"`

#### Issue: Member can't see their application

**Solution:**
- Verify `membership_applications` rules allow user to read their own application
- Check that `resource.data.email == request.auth.token.email`
- Make sure user is authenticated

---

## Security Checklist

Before going to production:

- [ ] Firestore Security Rules published and tested
- [ ] Email/Password authentication enabled
- [ ] Super admin user created
- [ ] Test user registration flow end-to-end
- [ ] Test admin invitation flow end-to-end
- [ ] Test member approval flow
- [ ] Verify role-based access control works
- [ ] Test that unauthorized users can't access protected data
- [ ] Monitor Firebase Usage tab for unexpected activity
- [ ] Review all security rules in Rules Playground
- [ ] Consider enabling email verification (optional but recommended)

---

## Next Steps

1. ✅ **Complete this Firebase setup guide**
2. [ ] **Complete Phase 7 (Routing & Integration)** - Add routes to App.jsx
3. [ ] **Complete Phase 9 (Testing & Polish)** - End-to-end testing
4. [ ] **Optional: Phase 8 (Email Notifications)** - Set up email service

---

## Additional Resources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firestore Security Rules Documentation](https://firebase.google.com/docs/firestore/security/overview)
- [Firebase Console](https://console.firebase.google.com/)

---

**Last Updated:** 2025-01-27
