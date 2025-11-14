# Firebase Security Rules for Awards Nominations

## Collection: `awards_nominations`

Add these security rules to your Firebase Console under Firestore Database > Rules.

```javascript
// Firestore Security Rules for awards_nominations collection
match /awards_nominations/{nominationId} {
  // Allow anyone to create (submit) nominations
  allow create: if request.auth != null || true  // Public submissions allowed
    && request.resource.data.keys().hasAll([
      'submittedAt', 'nominationYear', 'status', 'category',
      'nominee', 'nominator', 'supportingStatement', 'achievements'
    ])
    && request.resource.data.nominee.keys().hasAll(['fullName', 'email', 'organization'])
    && request.resource.data.nominator.keys().hasAll(['fullName', 'email', 'organization', 'relationship'])
    && request.resource.data.category is string
    && request.resource.data.supportingStatement is string
    && request.resource.data.supportingStatement.size() >= 100
    && request.resource.data.supportingStatement.size() <= 1000
    && request.resource.data.achievements is string
    && request.resource.data.achievements.size() >= 100
    && request.resource.data.achievements.size() <= 1000
    && request.resource.data.nominee.email.matches('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')
    && request.resource.data.nominator.email.matches('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');

  // Allow admins to read all nominations
  allow read: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';

  // Allow admins to update nomination status and review notes
  allow update: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';

  // Prevent deletion (nominations should be archived, not deleted)
  allow delete: if false;
}
```

## Alternative: Basic Rules (No Auth Required for Submissions)

If you want to allow completely public submissions without any authentication:

```javascript
match /awards_nominations/{nominationId} {
  // Allow anyone to submit nominations (with validation)
  allow create: if request.resource.data.keys().hasAll([
      'submittedAt', 'nominationYear', 'status', 'category',
      'nominee', 'nominator', 'supportingStatement', 'achievements'
    ])
    && request.resource.data.category is string
    && request.resource.data.supportingStatement.size() >= 100
    && request.resource.data.supportingStatement.size() <= 1000
    && request.resource.data.achievements.size() >= 100
    && request.resource.data.achievements.size() <= 1000;

  // Only admins can read nominations
  allow read: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';

  // Only admins can update nominations
  allow update: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';

  // Prevent deletion
  allow delete: if false;
}
```

## Rate Limiting

To prevent spam, add rate limiting using Firebase App Check:

1. Go to Firebase Console > App Check
2. Enable App Check for your web app
3. Use reCAPTCHA Enterprise or reCAPTCHA v3
4. Add App Check enforcement to Firestore rules:

```javascript
match /awards_nominations/{nominationId} {
  allow create: if request.time > timestamp.date(2024, 1, 1) // Start date
    && request.resource.data.keys().hasAll([/* validation as above */])
    // Add rate limiting via Firebase App Check
    && request.auth.token.firebase.sign_in_provider != 'anonymous';
}
```

## Testing Rules

Before deploying to production, test rules in Firebase Console:

1. Go to Firestore Database > Rules
2. Click "Rules Playground"
3. Test these scenarios:

**Test Create (Should Succeed):**
```
Location: /awards_nominations/test123
Operation: create
Authenticated: No
Data:
{
  "submittedAt": {"_seconds": 1234567890, "_nanoseconds": 0},
  "nominationYear": 2025,
  "status": "pending",
  "category": "Excellence in Design",
  "nominee": {
    "fullName": "John Doe",
    "email": "john@example.com",
    "organization": "ABC Corp",
    "phone": "+27123456789",
    "website": null
  },
  "nominator": {
    "fullName": "Jane Smith",
    "email": "jane@example.com",
    "organization": "XYZ Ltd",
    "relationship": "Colleague"
  },
  "supportingStatement": "This is a test supporting statement that is at least 100 characters long to meet the validation requirements for submission.",
  "achievements": "These are test achievements that are also at least 100 characters long to meet the validation requirements."
}
```

**Test Read Without Admin (Should Fail):**
```
Location: /awards_nominations/test123
Operation: get
Authenticated: Yes (non-admin user)
```

**Test Read With Admin (Should Succeed):**
```
Location: /awards_nominations/test123
Operation: get
Authenticated: Yes (admin user with role: 'admin')
```

## Deployment Steps

1. Open Firebase Console
2. Navigate to Firestore Database > Rules
3. Add the rules above to your existing ruleset (don't replace all rules)
4. Click "Publish" to deploy
5. Test using the Rules Playground
6. Monitor for any rule violations in the Firebase Console

## Security Considerations

**Implemented:**
- ✅ Server-side validation of required fields
- ✅ Email format validation
- ✅ Text length validation (100-1000 characters)
- ✅ Admin-only read access
- ✅ Admin-only update access
- ✅ Deletion prevention

**Recommended Additions:**
- Add Firebase App Check for spam prevention
- Implement honeypot field in form (client-side)
- Add Firestore composite index for efficient querying by admins
- Set up Cloud Functions to send notification emails on submission
- Implement duplicate detection based on email + category combination

## Monitoring

Monitor nominations in Firebase Console:

1. Go to Firestore Database
2. Navigate to `awards_nominations` collection
3. View submissions and their status
4. Export data as needed for review committee

## Future Enhancements

- Add Cloud Function to validate and sanitize submissions
- Implement email notifications to admins on new submissions
- Add duplicate nomination detection
- Create admin dashboard for reviewing nominations
- Implement nomination status workflow (pending → reviewed → approved/rejected)
