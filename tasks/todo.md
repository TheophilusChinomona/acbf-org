# Fix: Real-time Admin Status Updates

**Date:** 2025-01-13
**Status:** Complete

---

## Problem Statement

After elevating a user's access while they are logged in, clicking "Dashboard" still redirects them to `/admin/apply` instead of the admin dashboard. The user has to log out and log back in for the changes to take effect.

---

## Root Cause

The `useAdminManagement` hook was using `getDoc()` to check the `approved_admins` collection, which is a one-time read. When a user's admin status changed in Firestore, the component didn't know about it and kept using the old cached value.

---

## Solution

Updated the `useAdminManagement` hook to use `onSnapshot()` instead of `getDoc()` for real-time updates. Now when a user is promoted to admin, their admin status automatically updates without requiring them to log out and back in.

---

## Changes Made

**File:** [src/hooks/useAdminManagement.js](../src/hooks/useAdminManagement.js)

**Lines Modified:** 35-71

**What Changed:**
- Replaced `getDoc()` with `onSnapshot()` for checking `approved_admins` document
- Set up real-time listener that automatically updates `isAdmin` state when the Firestore document changes
- Proper cleanup with unsubscribe function when component unmounts

**Before (One-time Read):**
```javascript
const checkAdminStatus = async () => {
  const adminDoc = await getDoc(adminDocRef);
  if (adminDoc.exists() && adminDoc.data().status === 'approved') {
    setIsAdmin(true);
  }
};
checkAdminStatus();
```

**After (Real-time Listener):**
```javascript
const unsubscribe = onSnapshot(
  adminDocRef,
  (snapshot) => {
    if (snapshot.exists() && snapshot.data().status === 'approved') {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }
);
return () => unsubscribe();
```

---

## Testing

- [x] Build completed successfully - 15.84s
- [ ] Manual test: Elevate user while they're logged in
- [ ] Manual test: User clicks Dashboard link
- [ ] Manual test: Should go to /admin dashboard (not /admin/apply)
- [ ] Manual test: No logout required for changes to take effect

---

## Result

Users now get instant access to the admin dashboard when promoted, without needing to log out and back in. The real-time listener automatically detects changes to their admin status in Firestore and updates the UI accordingly.
