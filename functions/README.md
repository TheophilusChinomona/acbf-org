# ACBF Firebase Cloud Functions

Email notification system for the ACBF website using Firebase Cloud Functions and Mailtrap SMTP.

## Structure

```
functions/
├── index.js                    # Main entry point - Firestore triggers
├── package.json                # Dependencies and scripts
├── .env                        # Environment variables (not in git)
├── .env.example               # Environment template
├── .gitignore                 # Git ignore rules
├── README.md                  # This file
└── src/
    ├── sendEmail.js           # Email sending utility (Nodemailer)
    └── templates/
        └── adminNotification.js  # Email templates
```

## Functions

### 1. onContactSubmissionCreated
- **Trigger**: Firestore document created in `contact_submissions`
- **Action**: Sends admin notification email
- **Template**: Contact form template with purple gradient

### 2. onMembershipApplicationCreated
- **Trigger**: Firestore document created in `membership_applications`
- **Action**: Sends admin notification email
- **Template**: Membership application template with pink gradient

### 3. testEmail (optional)
- **Type**: HTTP endpoint
- **Purpose**: Test email functionality
- **URL**: `https://us-central1-acbf-rsa-backend.cloudfunctions.net/testEmail`

## Quick Start

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your Mailtrap credentials
   ```

3. Deploy to Firebase:
   ```bash
   cd ..
   firebase deploy --only functions
   ```

### Local Development

Run functions locally with the Firebase emulator:

```bash
npm run serve
```

This starts the Firebase Functions emulator on http://localhost:5001

### Testing

Test the email function:

```bash
# Deploy first
firebase deploy --only functions

# Then call the test endpoint
curl https://us-central1-acbf-rsa-backend.cloudfunctions.net/testEmail
```

## Environment Variables

Required variables in `.env`:

| Variable | Description | Example |
|----------|-------------|---------|
| `SMTP_HOST` | Mailtrap SMTP host | `sandbox.smtp.mailtrap.io` |
| `SMTP_PORT` | SMTP port | `2525` |
| `SMTP_USER` | Mailtrap username | `abc123def456` |
| `SMTP_PASS` | Mailtrap password | `xyz789uvw456` |
| `ADMIN_EMAIL` | Admin notification recipient | `admin@acbf.org.za` |
| `FROM_EMAIL` | Sender email address | `noreply@acbf.org.za` |
| `FROM_NAME` | Sender display name | `ACBF` |
| `ORGANIZATION_NAME` | Organization name | `African Community Business Federation` |

## Scripts

```bash
# Start local emulator
npm run serve

# Open Firebase Functions shell
npm run shell

# Deploy to Firebase
npm run deploy

# View logs
npm run logs
```

## Dependencies

- **firebase-functions** (^4.0.0) - Cloud Functions SDK
- **firebase-admin** (^12.0.0) - Admin SDK for Firestore access
- **nodemailer** (^6.9.0) - Email sending library
- **dotenv** (^16.0.0) - Environment variable management

## Logs

View function execution logs:

```bash
# All logs
firebase functions:log

# Specific function
firebase functions:log --only onContactSubmissionCreated

# Real-time logs
firebase functions:log --tail

# Last 7 days
firebase functions:log --since 7d
```

## Email Templates

### Contact Form Email
- Professional HTML design with purple gradient
- Includes: name, email, subject, message, timestamp
- Plain text fallback included

### Membership Application Email
- Professional HTML design with pink gradient
- Includes: name, email, phone, business details, timestamp
- Plain text fallback included

Both templates:
- Responsive design
- Clean typography
- Clear call-to-action
- HTML entities escaped

## Deployment

```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:onContactSubmissionCreated

# Force deploy (rebuild everything)
firebase deploy --only functions --force
```

## Monitoring

### Firebase Console
1. Go to https://console.firebase.google.com/
2. Select project: `acbf-rsa-backend`
3. Navigate to **Functions**
4. View execution logs, metrics, and errors

### Firestore Status
Each processed document gets updated with:
```javascript
{
  email_sent: true,           // or false
  email_sent_at: Timestamp,   // server timestamp
  email_error: "message"      // if failed
}
```

## Production Checklist

Before going to production:

- [ ] Replace Mailtrap with production SMTP (SendGrid, Mailgun, AWS SES)
- [ ] Verify sender domain (SPF, DKIM records)
- [ ] Update FROM_EMAIL to verified domain
- [ ] Test with real form submissions
- [ ] Set up monitoring alerts
- [ ] Review rate limiting needs
- [ ] Remove or secure testEmail endpoint
- [ ] Document admin email addresses
- [ ] Set up backup admin email

## Troubleshooting

### Function not triggering
- Check Firestore collection names match exactly
- Verify function is deployed: `firebase functions:list`
- Check logs: `firebase functions:log`

### Email not sending
- Verify `.env` credentials are correct
- Check Mailtrap dashboard for errors
- Review function logs for SMTP errors

### Permission errors
- Ensure Firebase Admin is initialized
- Check Firebase project permissions
- Verify service account has Firestore access

## Contributing

When modifying functions:

1. Test locally with emulator
2. Deploy to test environment first
3. Monitor logs for errors
4. Update documentation
5. Follow code style guidelines

## Support

For detailed setup instructions, see:
`../md files/MAILTRAP-SETUP-GUIDE.md`

---

**Version**: 1.0.0
**Node.js**: 18.x
**Firebase**: Functions v4, Admin v12
