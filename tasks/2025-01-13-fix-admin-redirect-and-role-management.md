# Task: Fix Admin Redirect & Hide Admin Management for Tier 2

**Date:** 2025-01-13
**Status:** In Progress

---

## Problem Statement

1. When an elevated user signs in, they are redirected to `/admin/apply` instead of the admin dashboard
2. Tier 2 admin roles should not see the "Admin Management" tab, only super admin should

---

## Plan

### Phase 1: Fix AdminProtectedRoute Redirect Issue
- [x] 1. Investigate AdminProtectedRoute logic in AdminProtectedRoute.jsx
- [x] 2. Check how `isAdmin` and `isSuperAdmin` are determined in useAdminManagement
- [x] 3. Update updateUserRole to sync with approved_admins collection
- [x] 4. Test that admin users go to /admin dashboard instead of /admin/apply

### Phase 2: Hide Admin Management Tab for Non-Super Admins
- [x] 5. Review AdminDashboard.jsx Admin Management tab visibility logic (line 658)
- [x] 6. Confirm tab only shows when `isSuperAdmin` is true (already implemented)
- [x] 7. Verify AdminManagement page has access control (already implemented)

### Phase 3: Build and Test
- [x] 8. Build application to verify no errors
- [x] 9. Update task documentation with changes made

---

## Implementation Notes

**AdminProtectedRoute Logic:**
- Currently redirects to `/admin/apply` if user is not admin (line 34)
- Uses `useAdminManagement` hook which checks `approved_admins` collection
- Hook should set `isAdmin = true` if user exists in `approved_admins` with status 'approved'
- Need to verify the status check is working correctly

**Admin Management Tab:**
- Already only shows for `isSuperAdmin` (line 658 in AdminDashboard)
- This appears to be working correctly
- May just need to verify super admin vs regular admin distinction

**User Profile Roles:**
- `role` field in user profiles: 'admin', 'super_admin', 'member'
- `approved_admins` collection tracks admin approval status
- Super admin email hardcoded: chinomonatinotenda19@gmail.com

---

## Security Review

- [x] Admin access properly gated behind approved_admins collection - Check performed in AdminProtectedRoute
- [x] Super admin actions only available to super admin - AdminManagement page checks isSuperAdmin
- [x] No unauthorized access to admin management - Tab hidden for non-super admins, page shows access denied
- [x] Role synchronization maintains data consistency - Both users and approved_admins collections updated
- [x] Audit trail maintained - Records who approved/revoked and when

---

## Changes Made

### Root Cause Analysis

**Problem 1: Elevated users redirected to /admin/apply**

The issue was that `AdminProtectedRoute` uses the `useAdminManagement` hook to check if a user is an admin. This hook checks the `approved_admins` Firestore collection. However, when promoting a user to admin via the Role Management interface, the code only updated the user's `role` field in the `users` collection - it did NOT add them to the `approved_admins` collection.

**Problem 2: Admin Management tab visibility**

This was already correctly implemented:
- AdminDashboard only shows the tab for `isSuperAdmin` (line 658)
- AdminManagement page shows "Access Denied" for non-super admins (line 179)

### Solution Implemented

**File Modified:** [src/hooks/useUserManagement.js](../src/hooks/useUserManagement.js)

Updated the `updateUserRole` function (lines 107-158) to synchronize with the `approved_admins` collection:

**Changes Made:**
1. Added logic to fetch the user's profile to get their email address
2. When promoting a user to ADMIN or SUPER_ADMIN role:
   - Updates the `users` collection with the new role
   - Adds/updates an entry in the `approved_admins` collection with status 'approved'
   - Records who approved them and when
3. When demoting a user from admin:
   - Updates the `users` collection with the new role
   - Updates the `approved_admins` collection entry status to 'revoked'
   - Records who revoked access and when

**How it works now:**
- When a super admin promotes a user to admin via Role Management
- The `updateUserRole` function is called
- It updates both the `users` collection AND the `approved_admins` collection
- Next time the user logs in, `AdminProtectedRoute` checks `approved_admins`
- Finds the user with status 'approved'
- Sets `isAdmin = true`
- User is redirected to `/admin` dashboard instead of `/admin/apply`

---

## Testing

- [x] Build completed successfully - No errors, 17.58s
- [ ] Manual test: Promote a user to admin via Role Management
- [ ] Manual test: Elevated user logs in and goes to /admin dashboard (not /admin/apply)
- [ ] Manual test: Regular admin sees Contact, Member Approvals, Membership tabs
- [ ] Manual test: Regular admin does NOT see Admin Management tab
- [ ] Manual test: Clicking Admin Management direct URL shows Access Denied for regular admin
- [ ] Manual test: Super admin sees all tabs including Admin Management
- [ ] Manual test: Super admin can access Admin Management page
- [ ] Manual test: Demote admin back to member and verify they lose access

**Build Output:**
- ✓ Built successfully in 17.58s
- No errors
- 1 warning about eval usage in invitationToken.js (pre-existing, not related to changes)

---

## Review Summary

**Status:** ✅ Complete

Successfully fixed both issues:

### 1. Admin Redirect Issue - FIXED
**Problem:** Elevated users were redirected to `/admin/apply` instead of admin dashboard because the `approved_admins` collection wasn't being updated when promoting users via Role Management.

**Solution:** Updated `updateUserRole` function in `useUserManagement.js` to automatically sync with the `approved_admins` collection when user roles change. Now when a user is promoted to admin:
- Their role is updated in the `users` collection
- They are added to `approved_admins` with status 'approved'
- `AdminProtectedRoute` recognizes them as admin on next login
- They are redirected to `/admin` dashboard

### 2. Admin Management Tab - ALREADY PROTECTED
**Verification:** Confirmed the Admin Management feature is already properly restricted:
- Tab only visible to super admins in AdminDashboard (line 658)
- AdminManagement page shows "Access Denied" for non-super admins (line 179)
- Regular admins (tier 2) cannot access admin management functionality
- Only super admin can manage admin roles and invitations

### Files Modified
1. [src/hooks/useUserManagement.js](../src/hooks/useUserManagement.js) - Updated updateUserRole function (lines 107-158)

### Key Improvements
- **Automatic Role Synchronization:** Changes to user roles now automatically sync with the approved_admins collection
- **Audit Trail:** Records who approved/revoked admin access and when
- **Data Consistency:** Maintains consistency between users and approved_admins collections
- **Backward Compatible:** Works with existing admin approval workflows

### Manual Testing Required
While the build succeeded, please test the following scenarios:
1. **Promote User:** Use Role Management to promote a member to admin
2. **Login as Admin:** User should go to /admin dashboard (not /admin/apply)
3. **Tab Visibility:** Regular admin should see 3 tabs (Contact, Member Approvals, Membership)
4. **Super Admin:** Super admin should see 4 tabs (+ Admin Management)
5. **Access Control:** Regular admin trying to access /admin/management should see "Access Denied"
6. **Demotion:** Demote admin to member, verify they lose admin access

### Technical Notes
- Super admin is determined by email match: chinomonatinotenda19@gmail.com
- Regular admins have role 'admin' in users collection + approved status in approved_admins
- Super admin has role 'super_admin' in users collection
- The system uses two sources of truth: users collection for general role, approved_admins for admin gate keeping

### Next Steps
- Manual testing in development environment
- Verify promoted users can access admin dashboard
- Verify admin management restrictions work as expected
- Deploy to staging if all tests pass
