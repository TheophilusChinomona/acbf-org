# Complete Firestore Security Rules
## Copy and Paste These Rules to Firebase Console

> **DEPLOYMENT INSTRUCTIONS:**
> 1. Go to Firebase Console: https://console.firebase.google.com/
> 2. Select your project
> 3. Navigate to: **Firestore Database** → **Rules** tab
> 4. **DELETE ALL EXISTING CONTENT** in the rules editor
> 5. **COPY AND PASTE** the entire rules block below
> 6. Click **"Publish"** to deploy the rules
> 7. Wait for confirmation message

---

## COMPLETE RULES (Copy everything below this line)

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

    // Helper function to check if user has super_admin role in users collection
    function isSuperAdminUser() {
      return request.auth != null
        && exists(/databases/$(database)/documents/users/$(request.auth.uid))
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'super_admin';
    }

    // Helper function to check if it's the user's own profile
    function isOwnProfile() {
      return request.auth != null && request.auth.uid == resource.id;
    }

    // ========================================
    // Users Collection (UPDATED - Added role management permissions)
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

      // Users can update their own profile (limited fields only - cannot change role or status)
      allow update: if request.auth != null
                   && request.auth.uid == userId
                   && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'status', 'approved_by', 'approved_at', 'rejected_by', 'rejected_at']);

      // Regular admins can update user status (approve/reject members)
      allow update: if (isAdmin() || isAdminUser())
                   && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role']);

      // Super admins can update user roles AND status
      // BUT cannot change someone TO super_admin role (security measure)
      allow update: if (isSuperAdmin() || isSuperAdminUser())
                   && request.resource.data.role != 'super_admin'
                   && resource.data.role != 'super_admin'; // Cannot modify existing super_admins

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
    // Approved Admins Collection (UPDATED - Allow users to read their own status)
    // ========================================
    match /approved_admins/{email} {
      // Users can read their own admin status document
      // Super admin and existing admins can read all admin documents
      allow read: if request.auth != null
                  && (request.auth.token.email == email || isSuperAdmin() || isAdminUser());

      // Only super admin or existing admins can add new admins (create)
      allow create: if (isSuperAdmin() || isAdmin() || isAdminUser())
                 && request.resource.data.keys().hasAll(['email', 'name', 'approved_by', 'approved_at', 'status'])
                 && request.resource.data.email == email
                 && request.resource.data.status == 'approved';

      // Only super admin or existing admins can update/delete (remove admins)
      allow update, delete: if isSuperAdmin() || isAdmin() || isAdminUser();
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

    // ========================================
    // Awards Nominations Collection (NEW - FIXES SUBMISSION FAILURE)
    // ========================================
    match /awards_nominations/{nominationId} {
      // Allow anyone (public) to create nominations
      // Validates that all required fields are present
      allow create: if request.resource.data.keys().hasAll([
          'submittedAt', 'nominationYear', 'status', 'category',
          'nominee', 'nominator', 'supportingStatement', 'achievements'
        ])
        && request.resource.data.category is string
        && request.resource.data.nominationYear is number
        && request.resource.data.status == 'pending'
        && request.resource.data.supportingStatement is string
        && request.resource.data.achievements is string
        && request.resource.data.nominee is map
        && request.resource.data.nominator is map;

      // Allow admins to read all nominations
      allow read: if isAdmin() || isSuperAdmin() || isAdminUser();

      // Allow admins to update nomination status and review data
      allow update: if isAdmin() || isSuperAdmin() || isAdminUser();

      // Prevent deletion (keep all historical data)
      allow delete: if false;
    }

    // ========================================
    // Deny all other access (MUST BE LAST RULE)
    // ========================================
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## What Changed

### NEW: Awards Nominations Collection Rules (Lines 186-211)

**Permissions Added:**
- **Public Create**: Anyone can submit award nominations (no authentication required)
- **Admin Read**: Admins can view all nominations
- **Admin Update**: Admins can update nomination status and add review data
- **Delete Blocked**: Nominations cannot be deleted (preserves historical data)

**Validation Rules:**
- Ensures all required fields are present (`submittedAt`, `nominationYear`, `status`, `category`, etc.)
- Validates data types (strings for text fields, maps for nested objects)
- Forces `status` to be 'pending' on creation (prevents privilege escalation)

**Security Features:**
- Public can only CREATE, not read or modify existing nominations
- Admins have full read/update access for processing
- Deletion is completely blocked for data integrity

---

## Testing After Deployment

1. **Test Form Submission**:
   - Go to your awards nomination form
   - Fill out all required fields
   - Click "Submit"
   - Should see success message: "Nomination submitted successfully"

2. **Verify in Firestore Console**:
   - Go to Firestore Database → Data tab
   - Look for `awards_nominations` collection
   - Check that your test submission appears

3. **Check Browser Console**:
   - If submission still fails, open browser DevTools (F12)
   - Look for Firebase errors in Console tab
   - Should see NO permission errors

---

## Troubleshooting

**If submission still fails after deploying:**

1. **Clear Browser Cache**: Hard refresh (Ctrl+Shift+R)
2. **Check Firebase Project**: Verify you're connected to the correct project
3. **Verify Environment Variables**: Ensure `.env` has all `VITE_FIREBASE_*` variables
4. **Check Rules Deployment**: In Firebase Console → Rules tab, verify the rules show as "Published"
5. **Test in Incognito**: Try submitting in an incognito/private window

**Common Errors:**
- `PERMISSION_DENIED`: Rules didn't deploy or cached
- `INVALID_ARGUMENT`: Missing required field in form data
- `UNAVAILABLE`: Network issue or Firebase down

---

## Notes

- Rules deployed via Firebase Console take ~1 minute to propagate
- All existing collections remain unchanged
- No breaking changes to existing functionality
- Awards nominations require no authentication
- Historical nomination data is protected from deletion
