# Mailtrap Email Integration Setup Guide

This guide will walk you through setting up Firebase Cloud Functions with Mailtrap SMTP for automated email notifications.

## Overview

Your website now has Firebase Cloud Functions configured to automatically send email notifications via Mailtrap when forms are submitted. The functions trigger on two Firestore collections:

- **contact_submissions** - Contact form submissions
- **membership_applications** - Membership application submissions

## Prerequisites

- [x] Firebase project created (acbf-rsa-backend)
- [x] Firebase CLI installed (`npm install -g firebase-tools`)
- [ ] Mailtrap account (sign up at https://mailtrap.io)
- [ ] Mailtrap SMTP credentials

## Step-by-Step Setup

### 1. Get Mailtrap Credentials

1. Go to https://mailtrap.io and log in to your account
2. Navigate to **Email Testing** > **Inboxes**
3. Select your inbox (or create a new one)
4. Click on **SMTP Settings**
5. Under **Integrations**, select **Nodemailer**
6. Copy the following credentials:
   - **Username** (e.g., `a1b2c3d4e5f6g7`)
   - **Password** (e.g., `x1y2z3a4b5c6d7`)

### 2. Configure Environment Variables

1. Navigate to the `functions` directory:
   ```bash
   cd functions
   ```

2. Copy the `.env.example` file to create your `.env`:
   ```bash
   cp .env.example .env
   ```

3. Open `functions/.env` in your text editor and replace the placeholder values:
   ```env
   # Mailtrap SMTP Configuration
   SMTP_HOST=sandbox.smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_USER=your_actual_mailtrap_username
   SMTP_PASS=your_actual_mailtrap_password

   # Email Configuration
   ADMIN_EMAIL=your_admin_email@acbf.org.za
   FROM_EMAIL=noreply@acbf.org.za
   FROM_NAME=ACBF
   ORGANIZATION_NAME=African Community Business Federation
   ```

4. Save the file (it will automatically be ignored by Git)

### 3. Install Dependencies

From the `functions` directory, install the required npm packages:

```bash
npm install
```

This will install:
- `firebase-functions` - Firebase Cloud Functions SDK
- `firebase-admin` - Firebase Admin SDK
- `nodemailer` - Email sending library
- `dotenv` - Environment variable management

### 4. Firebase CLI Authentication

1. Log in to Firebase CLI (if not already logged in):
   ```bash
   firebase login
   ```

2. Verify the correct project is selected:
   ```bash
   firebase use
   ```

   Should show: `acbf-rsa-backend (current)`

### 5. Deploy Functions

From the project root directory, deploy the functions to Firebase:

```bash
firebase deploy --only functions
```

This will deploy two functions:
- `onContactSubmissionCreated` - Triggers on new contact form submissions
- `onMembershipApplicationCreated` - Triggers on new membership applications
- `testEmail` - Optional test endpoint (can be removed later)

The deployment process takes 2-5 minutes.

### 6. Test the Integration

#### Option A: Test via HTTP Endpoint

You can test the email functionality using the test endpoint:

```bash
# Get your Firebase project URL
firebase functions:config:get

# Call the test endpoint (replace with your project ID)
curl https://us-central1-acbf-rsa-backend.cloudfunctions.net/testEmail
```

Check your Mailtrap inbox for the test email.

#### Option B: Test via Form Submission

1. Go to your website
2. Submit a contact form or membership application
3. Check the Firebase Functions logs:
   ```bash
   firebase functions:log
   ```
4. Check your Mailtrap inbox for the notification email

### 7. Verify Deployment

Check the Firebase Console to confirm functions are deployed:

1. Go to https://console.firebase.google.com/
2. Select your project: `acbf-rsa-backend`
3. Navigate to **Functions** in the left sidebar
4. You should see three functions listed:
   - `onContactSubmissionCreated`
   - `onMembershipApplicationCreated`
   - `testEmail`

## How It Works

### Trigger Flow

1. User submits a form on the website (contact or membership)
2. Form data is saved to Firestore collection
3. Firestore trigger detects the new document
4. Cloud Function executes automatically
5. Email template is generated with form data
6. Email is sent via Mailtrap SMTP
7. Document is updated with email status

### Email Templates

The system includes professionally designed HTML email templates:

- **Contact Form Notification**
  - Purple gradient header
  - Contact details (name, email, subject)
  - Full message content
  - Timestamp and status

- **Membership Application Notification**
  - Pink gradient header
  - Applicant details (name, email, phone)
  - Business information
  - Additional message (if provided)
  - Timestamp and status

Both templates include:
- Responsive HTML design
- Plain text fallback
- Professional styling
- Clear call-to-action (reply to sender)

## Monitoring and Debugging

### View Function Logs

```bash
# View all logs
firebase functions:log

# View logs for specific function
firebase functions:log --only onContactSubmissionCreated

# Follow logs in real-time
firebase functions:log --tail
```

### Check Email Status in Firestore

Each document in Firestore will be updated with email status:

```javascript
{
  // ... original form data ...
  email_sent: true,              // or false if failed
  email_sent_at: Timestamp,      // when email was sent
  email_error: "error message"   // only if failed
}
```

### Common Issues

#### Issue: Function deployment fails
**Solution**: Make sure you're logged in to Firebase CLI and have the correct project selected.

```bash
firebase login
firebase use acbf-rsa-backend
```

#### Issue: Email not sending
**Solution**: Check environment variables are set correctly in `functions/.env`

```bash
cd functions
cat .env  # Verify credentials
```

#### Issue: "Permission denied" error
**Solution**: Ensure Firebase Admin is properly initialized. Check functions logs:

```bash
firebase functions:log
```

#### Issue: Emails going to spam
**Note**: Mailtrap is a testing environment - emails don't actually reach real inboxes. This is intentional for development.

## Production Deployment

When you're ready to send real emails in production:

### 1. Choose a Production Email Service

Replace Mailtrap with a production-grade service:

- **SendGrid** (12,000 free emails/month)
  - Website: https://sendgrid.com
  - Docs: https://docs.sendgrid.com/for-developers/sending-email/integrating-with-the-smtp-api

- **Mailgun** (5,000 free emails/month for 3 months)
  - Website: https://mailgun.com
  - Docs: https://documentation.mailgun.com/en/latest/user_manual.html#sending-via-smtp

- **AWS SES** (62,000 free emails/month)
  - Website: https://aws.amazon.com/ses/
  - Docs: https://docs.aws.amazon.com/ses/latest/dg/send-email-smtp.html

### 2. Update SMTP Configuration

In `functions/.env`, update the SMTP settings:

```env
# Example: SendGrid
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key

# Example: Mailgun
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@mg.yourdomain.com
SMTP_PASS=your_mailgun_password

# Example: AWS SES
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your_aws_access_key_id
SMTP_PASS=your_aws_secret_access_key
```

### 3. Verify Sender Domain

Most production email services require domain verification:

1. Add DNS records (SPF, DKIM, DMARC) to your domain
2. Verify domain ownership in your email service dashboard
3. Update `FROM_EMAIL` to use verified domain

### 4. Redeploy Functions

```bash
firebase deploy --only functions
```

**IMPORTANT**: The code doesn't change, only the SMTP credentials.

## Security Best Practices

- [x] `.env` file is in `.gitignore` (credentials never committed)
- [x] Environment variables used for sensitive data
- [x] Functions validate input data
- [x] Error messages don't expose sensitive information
- [x] Email templates escape user input (prevent XSS)
- [ ] Consider rate limiting for production (add if spam becomes an issue)
- [ ] Monitor usage and set up alerts

## Cost Considerations

### Firebase Functions Free Tier

- **Invocations**: 2 million/month
- **Compute Time**: 400,000 GB-seconds/month
- **Outbound Networking**: 5 GB/month

### Expected Usage

For a typical business website:
- **Contact Forms**: ~100/month
- **Membership Applications**: ~50/month
- **Total Invocations**: ~150/month

**Estimated Cost**: $0/month (well within free tier)

### Mailtrap Free Tier

- **Test Emails**: 500/month
- **Inboxes**: 1 inbox
- **Team Members**: 1 user

For development/testing, the free tier is sufficient.

## Maintenance

### Update Dependencies

Every few months, update the npm packages:

```bash
cd functions
npm update
npm audit fix
firebase deploy --only functions
```

### Review Logs

Regularly check function logs for errors:

```bash
firebase functions:log --since 7d  # Last 7 days
```

### Monitor Firestore

Check for any failed email sends:

```firebase
// Query documents where email failed
db.collection('contact_submissions')
  .where('email_sent', '==', false)
  .get()
```

## Troubleshooting Commands

```bash
# Check Firebase project info
firebase projects:list

# Check which project you're using
firebase use

# Check function status
firebase functions:list

# View function configuration
firebase functions:config:get

# Delete a function (if needed)
firebase functions:delete functionName

# Force redeploy all functions
firebase deploy --only functions --force
```

## Additional Resources

- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Nodemailer Documentation](https://nodemailer.com/about/)
- [Mailtrap Documentation](https://help.mailtrap.io/)
- [Firestore Triggers](https://firebase.google.com/docs/functions/firestore-events)

## Support

If you encounter issues:

1. Check the Firebase Functions logs: `firebase functions:log`
2. Review the [Firebase Status Dashboard](https://status.firebase.google.com/)
3. Check Mailtrap status at their dashboard
4. Review this guide's troubleshooting section

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Maintained by**: ACBF Development Team
