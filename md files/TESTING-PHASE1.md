# Phase 1 Testing Guide - Firebase Authentication Setup

**Date:** 2025-01-27  
**Phase:** Phase 1 - Firebase Authentication Setup  
**Status:** Ready for Testing

---

## ✅ Completed Steps

- [x] Step 1.1: Enable Firebase Authentication in Console
- [x] Step 1.2: Update Firebase Configuration
- [x] Step 1.3: Create AuthContext
- [x] Step 1.4: Create useAuth Hook

---

## 🧪 Testing Steps

### Prerequisites

1. **Firebase Console Setup:**
   - ✅ Email/Password authentication enabled
   - ✅ Admin user created (you should have the email and password)

2. **Environment Variables:**
   - Verify `.env` file has all Firebase config variables
   - Check that `VITE_FIREBASE_AUTH_DOMAIN` is set correctly

3. **Development Server:**
   - Make sure the app is running (`npm run dev`)

---

## Test 1: Verify App Loads Without Errors

**Steps:**
1. Start the development server: `npm run dev`
2. Open browser to `http://localhost:5173` (or your dev port)
3. Open browser DevTools Console (F12)

**Expected Results:**
- ✅ App loads successfully
- ✅ No console errors related to Firebase
- ✅ No errors about missing AuthProvider
- ✅ Homepage displays normally

**If errors occur:**
- Check Firebase environment variables
- Verify Firebase project configuration
- Check browser console for specific error messages

---

## Test 2: Access Test Auth Page

**Steps:**
1. Navigate to: `http://localhost:5173/test-auth`
2. Observe the page

**Expected Results:**
- ✅ Page loads without errors
- ✅ Shows "Auth Test Page" heading
- ✅ Displays login form (email and password fields)
- ✅ Shows "Loading authentication..." briefly, then login form
- ✅ No console errors

**If errors occur:**
- Check that AuthProvider is properly wrapping the app
- Verify TestAuth component imports are correct
- Check browser console for specific errors

---

## Test 3: Test Authentication State (Not Logged In)

**Steps:**
1. On `/test-auth` page, verify you're not logged in
2. Check browser console

**Expected Results:**
- ✅ Login form is visible
- ✅ No user information displayed
- ✅ No error messages (unless there's a Firebase config issue)
- ✅ Console shows no authentication errors

---

## Test 4: Test Login with Valid Credentials

**Steps:**
1. On `/test-auth` page
2. Enter the admin email (from Firebase Console)
3. Enter the admin password
4. Click "Login" button
5. Wait for response

**Expected Results:**
- ✅ Loading state appears briefly
- ✅ Success: Green box appears showing:
  - "✅ Authenticated!"
  - Email address
  - User UID
- ✅ Login form disappears
- ✅ Logout button appears
- ✅ No error messages

**If login fails:**
- Verify email/password are correct in Firebase Console
- Check Firebase Console → Authentication → Users
- Verify Email/Password provider is enabled
- Check browser console for specific error messages

---

## Test 5: Test Login with Invalid Credentials

**Steps:**
1. On `/test-auth` page (logout first if logged in)
2. Enter invalid email: `wrong@example.com`
3. Enter invalid password: `wrongpassword`
4. Click "Login"

**Expected Results:**
- ✅ Error message appears in red box
- ✅ Error message is user-friendly (e.g., "Firebase: Error (auth/invalid-credential)")
- ✅ Login form remains visible
- ✅ User is NOT authenticated

---

## Test 6: Test Logout Functionality

**Steps:**
1. While logged in on `/test-auth` page
2. Click "Logout" button
3. Observe the page

**Expected Results:**
- ✅ User is logged out
- ✅ Login form reappears
- ✅ User information disappears
- ✅ No error messages
- ✅ Can log in again

---

## Test 7: Test Auth State Persistence

**Steps:**
1. Log in successfully on `/test-auth` page
2. Navigate to homepage: `http://localhost:5173`
3. Navigate back to `/test-auth`
4. Refresh the page (F5)
5. Close and reopen the browser tab

**Expected Results:**
- ✅ User remains logged in after navigation
- ✅ User remains logged in after page refresh
- ✅ User remains logged in after closing/reopening tab (Firebase Auth persistence)
- ✅ No need to log in again

**Note:** Firebase Auth persists by default. If you want to test logout, use the logout button.

---

## Test 8: Test useAuth Hook in Console

**Steps:**
1. Open browser DevTools Console (F12)
2. While on `/test-auth` page, try to access auth state programmatically
3. You can test by temporarily adding console.log in TestAuth component

**Expected Results:**
- ✅ Auth context provides:
  - `currentUser` (null or user object)
  - `login` function
  - `logout` function
  - `loading` boolean
  - `error` string or null

---

## Test 9: Verify No Breaking Changes

**Steps:**
1. Navigate through existing pages:
   - Homepage (`/`)
   - About (`/about`)
   - Contact (`/contact`)
   - Members (`/members`)
2. Test existing forms (Contact form, Membership form)
3. Check that everything works as before

**Expected Results:**
- ✅ All existing pages load correctly
- ✅ Existing forms still work
- ✅ No new errors in console
- ✅ Site functionality unchanged
- ✅ AuthProvider doesn't interfere with existing features

---

## Test 10: Check Browser Network Tab

**Steps:**
1. Open DevTools → Network tab
2. Navigate to `/test-auth`
3. Log in
4. Observe network requests

**Expected Results:**
- ✅ Firebase Auth API calls visible
- ✅ Requests to Firebase Authentication endpoints
- ✅ No failed requests
- ✅ Successful authentication requests

---

## ✅ Success Criteria

All tests should pass:
- [ ] App loads without errors
- [ ] Test auth page accessible
- [ ] Login with valid credentials works
- [ ] Login with invalid credentials shows error
- [ ] Logout works correctly
- [ ] Auth state persists across navigation/refresh
- [ ] No breaking changes to existing functionality
- [ ] No console errors

---

## 🐛 Troubleshooting

### Common Issues:

**1. "Firebase: Error (auth/configuration-not-found)"**
- Check Firebase config in `.env` file
- Verify `VITE_FIREBASE_AUTH_DOMAIN` matches Firebase Console

**2. "Firebase: Error (auth/invalid-api-key)"**
- Verify `VITE_FIREBASE_API_KEY` in `.env`
- Check Firebase Console → Project Settings → General

**3. "useAuth must be used within an AuthProvider"**
- Verify AuthProvider wraps the app in `App.jsx`
- Check component hierarchy

**4. Login fails with "auth/user-not-found" or "auth/wrong-password"**
- Verify user exists in Firebase Console → Authentication → Users
- Check email/password are correct
- Ensure Email/Password provider is enabled

**5. Auth state not persisting**
- This is normal if you clear browser data
- Firebase Auth uses localStorage by default
- Check browser DevTools → Application → Local Storage

---

## 📝 Test Results Template

```
Date: ___________
Tester: ___________

Test 1: App Loads - [ ] Pass [ ] Fail
Test 2: Test Auth Page - [ ] Pass [ ] Fail
Test 3: Not Logged In State - [ ] Pass [ ] Fail
Test 4: Valid Login - [ ] Pass [ ] Fail
Test 5: Invalid Login - [ ] Pass [ ] Fail
Test 6: Logout - [ ] Pass [ ] Fail
Test 7: Auth Persistence - [ ] Pass [ ] Fail
Test 8: useAuth Hook - [ ] Pass [ ] Fail
Test 9: No Breaking Changes - [ ] Pass [ ] Fail
Test 10: Network Requests - [ ] Pass [ ] Fail

Notes:
_____________________________________________
_____________________________________________
_____________________________________________
```

---

## 🎯 Next Steps After Testing

Once all tests pass:

1. **Remove Test Route** (optional):
   - Remove `/test-auth` route from `App.jsx`
   - Delete `src/pages/TestAuth.jsx` (or keep for future testing)

2. **Proceed to Phase 2:**
   - Step 2.1: Create LoginForm component
   - Step 2.2: Create ProtectedRoute component
   - Step 2.3: Create AdminLogin page

---

## 📚 Files Created/Modified

**New Files:**
- `src/context/AuthContext.jsx` - Authentication context provider
- `src/hooks/useAuth.js` - Authentication hook
- `src/pages/TestAuth.jsx` - Test page (temporary)

**Modified Files:**
- `src/lib/firebase.js` - Added Firebase Auth initialization
- `src/App.jsx` - Added AuthProvider wrapper and test route

---

**Ready to test?** Follow the steps above and document any issues you encounter.

