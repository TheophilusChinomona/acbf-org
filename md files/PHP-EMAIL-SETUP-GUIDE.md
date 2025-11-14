# PHP Email Integration Setup Guide

This guide explains how to set up and use the PHP-based email notification system with Mailtrap SMTP for the ACBF website.

## Overview

Your website uses a **dual email system**:

1. **Firestore Database** - Saves all form submissions for admin review
2. **PHP Email API** - Sends email notifications via Mailtrap SMTP

When a user submits a form:
- Data is saved to Firestore (primary storage)
- Email notification is sent via PHP to admin (secondary notification)
- Both happen independently, so if email fails, data is still saved

## Architecture

```
User submits form
    ↓
React Component
    ↓
    ├─→ Save to Firestore ✓
    │   (contact_submissions or membership_applications)
    │
    └─→ POST to PHP API (/api/contact-email.php or /api/membership-email.php)
        ↓
        PHP processes request
        ↓
        Send via Mailtrap SMTP
        ↓
        Admin receives email
```

## File Structure

```
acbf-org/
├── api/                              # PHP email API (copied to dist/api on deployment)
│   ├── config.example.php            # Configuration template
│   ├── config.php                    # Your Mailtrap credentials (git-ignored)
│   ├── contact-email.php             # Contact form endpoint
│   ├── membership-email.php          # Membership application endpoint
│   ├── vendor/
│   │   └── SMTPMailer.php           # Custom SMTP mailer class
│   └── templates/
│       └── email-templates.php       # HTML email templates
│
├── src/components/forms/
│   ├── ContactForm.jsx               # Modified to call PHP API
│   └── SignupForm.jsx                # Modified to call PHP API
│
└── deploy.sh                         # Deployment script (copies api/ to dist/)
```

## Setup Instructions

### 1. Get Mailtrap Credentials

1. Go to https://mailtrap.io and log in
2. Navigate to **Email Testing** > **Inboxes**
3. Select your inbox (or create a new one)
4. Click **SMTP Settings**
5. Select **Show Credentials**
6. Copy your **Username** and **Password**

### 2. Create Configuration File

In the `api` directory, create your config file:

```bash
cd api
cp config.example.php config.php
```

Edit `config.php` and add your credentials:

```php
<?php
// Mailtrap SMTP Configuration
define('SMTP_HOST', 'sandbox.smtp.mailtrap.io');
define('SMTP_PORT', 2525);
define('SMTP_USER', 'your_mailtrap_username');  // Paste your username here
define('SMTP_PASS', 'your_mailtrap_password');  // Paste your password here

// Email Settings
define('ADMIN_EMAIL', 'your-email@acbf.org.za'); // Your actual email
define('FROM_EMAIL', 'noreply@acbf.org.za');
define('FROM_NAME', 'ACBF');
define('ORGANIZATION_NAME', 'African Community Business Federation');

// Security Settings
define('ALLOWED_ORIGINS', [
    'https://dev.acbf.org.za',
    'http://localhost:5173',
    'http://localhost:4173'
]);

// Debug mode (set to false in production)
define('DEBUG_MODE', true);
?>
```

**IMPORTANT**: Never commit `config.php` to Git (it's in `.gitignore`)

### 3. Deploy to Server

Run the deployment script:

```bash
./deploy.sh
```

This will:
1. Build the React app
2. Copy the `api/` directory to `dist/api/`
3. Commit changes to the `deploy` branch
4. Push to GitHub

### 4. Update cPanel

In your cPanel Git deployment:
1. Pull the latest changes from the `deploy` branch
2. The `api/` directory will be deployed to your web server

### 5. Upload config.php to Server

Since `config.php` is git-ignored, you need to manually upload it:

**Option A: Via cPanel File Manager**
1. Log in to cPanel
2. Navigate to File Manager
3. Go to your site directory → `api/`
4. Upload `config.php`

**Option B: Via FTP**
1. Connect via FTP
2. Navigate to `/public_html/api/` (or your site directory)
3. Upload `config.php`

**Option C: Create on Server**
1. SSH into your server
2. Navigate to the `api/` directory
3. Copy `config.example.php` to `config.php`
4. Edit with nano/vim and add your credentials

### 6. Test the Integration

#### Test Contact Form

1. Go to your website: https://dev.acbf.org.za
2. Navigate to the Contact page
3. Fill out and submit the form
4. Check your Mailtrap inbox for the email
5. Check Firestore for the saved document

#### Test Membership Application

1. Go to: https://dev.acbf.org.za/apply
2. Fill out the membership application
3. Submit the form
4. Check your Mailtrap inbox for the email
5. Check Firestore for the saved document

### 7. Verify Deployment

Check that the PHP API is accessible:

```bash
# Contact form endpoint
curl -X OPTIONS https://dev.acbf.org.za/api/contact-email.php

# Membership endpoint
curl -X OPTIONS https://dev.acbf.org.za/api/membership-email.php
```

Both should return `200 OK` status.

## How It Works

### Contact Form Flow

1. User fills out contact form
2. `ContactForm.jsx` submits data
3. Data saved to Firestore `contact_submissions` collection
4. Fetch POST to `/api/contact-email.php` with form data
5. PHP validates input
6. Email template generated with purple gradient design
7. Email sent via Mailtrap SMTP to admin
8. Success message shown to user

### Membership Application Flow

1. User fills out membership application
2. `SignupForm.jsx` submits data
3. Data saved to Firestore `membership_applications` collection
4. Fetch POST to `/api/membership-email.php` with form data
5. PHP validates input
6. Email template generated with pink gradient design
7. Email sent via Mailtrap SMTP to admin
8. Success message shown to user with "Create Account" button

### Error Handling

- If Firestore save fails → User sees error message, no email sent
- If Firestore succeeds but email fails → User sees success, error logged to console
- Email failures don't impact user experience (data is already saved)

## Email Templates

### Contact Form Email

- **Design**: Purple gradient header
- **Fields**: Name, Email, Subject, Message, Timestamp, Status
- **Subject Line**: "New Contact Form: [Subject]"

### Membership Application Email

- **Design**: Pink gradient header
- **Fields**: Name, Email, Phone, Business Name, Business Type, Message, Timestamp, Status
- **Subject Line**: "New Membership Application: [Name]"

Both templates include:
- Professional HTML design
- Responsive layout
- Plain text fallback
- Reply-to links
- ACBF branding

## Security Features

### CORS Protection

Only allows requests from:
- `https://dev.acbf.org.za` (production)
- `http://localhost:5173` (development)
- `http://localhost:4173` (preview)

Add more origins in `config.php` if needed.

### Input Validation

Both endpoints validate:
- Required fields present
- Email format valid
- Field length requirements
- Data types correct
- Phone number format (basic)

### XSS Prevention

- All user input is escaped with `htmlspecialchars()`
- HTML entities are converted
- Email templates sanitize data

### Error Disclosure

- Debug mode OFF in production (hides sensitive errors)
- Debug mode ON in development (shows detailed errors)
- Set `DEBUG_MODE` in `config.php`

## Troubleshooting

### Email Not Sending

**Check 1: Config file exists**
```bash
# On server via SSH
ls api/config.php
```

**Check 2: Credentials are correct**
- Verify SMTP_USER and SMTP_PASS in Mailtrap dashboard
- Check for typos or extra spaces

**Check 3: PHP has curl/sockets enabled**
```bash
php -i | grep -i curl
php -i | grep -i sockets
```

**Check 4: CORS error in browser**
- Open browser dev tools (F12)
- Check Console for CORS errors
- Add your domain to ALLOWED_ORIGINS in config.php

**Check 5: Check error logs**
```bash
# Check PHP error log
tail -f /path/to/php_error.log

# Or cPanel error log
tail -f ~/public_html/error_log
```

### Firestore Saving But No Email

This is expected behavior! Email failures don't block form submission.

Check:
1. Browser console for error messages
2. Network tab in dev tools - check `/api/contact-email.php` response
3. PHP error logs on server

### "Server configuration error"

The `config.php` file is missing on the server.

**Solution**: Upload `config.php` to `api/` directory on server

### CORS Error in Browser

```
Access to fetch at 'https://dev.acbf.org.za/api/contact-email.php'
from origin 'https://different-domain.com' has been blocked by CORS policy
```

**Solution**: Add your domain to `ALLOWED_ORIGINS` array in `config.php`

### 500 Internal Server Error

**Possible Causes**:
1. PHP syntax error in config.php or endpoints
2. Missing PHP extensions
3. File permissions issue

**Solution**:
```bash
# Check PHP error log
tail -20 ~/public_html/error_log

# Fix file permissions
chmod 644 api/*.php
chmod 755 api/
```

## Production Configuration

### When Ready for Production Emails

Replace Mailtrap with a production SMTP service:

**Option 1: SendGrid**
```php
define('SMTP_HOST', 'smtp.sendgrid.net');
define('SMTP_PORT', 587);
define('SMTP_USER', 'apikey');
define('SMTP_PASS', 'your_sendgrid_api_key');
```

**Option 2: Mailgun**
```php
define('SMTP_HOST', 'smtp.mailgun.org');
define('SMTP_PORT', 587);
define('SMTP_USER', 'postmaster@mg.yourdomain.com');
define('SMTP_PASS', 'your_mailgun_password');
```

**Option 3: cPanel SMTP** (if available)
```php
define('SMTP_HOST', 'mail.yourdomain.com');
define('SMTP_PORT', 587);
define('SMTP_USER', 'noreply@yourdomain.com');
define('SMTP_PASS', 'your_email_password');
```

### Production Checklist

- [ ] Update SMTP credentials for production service
- [ ] Set `DEBUG_MODE` to `false`
- [ ] Update `ALLOWED_ORIGINS` to production domain only
- [ ] Verify `FROM_EMAIL` uses domain you control
- [ ] Test email delivery to real inbox
- [ ] Set up SPF, DKIM, DMARC DNS records (for production SMTP)
- [ ] Monitor error logs regularly
- [ ] Consider rate limiting if needed

## Monitoring

### Check Email Status

**In Browser Console**:
```javascript
// You'll see:
// "Email sent successfully" (if email sent)
// "Email notification failed: [error]" (if failed)
```

**In PHP Error Log**:
```bash
tail -f ~/public_html/error_log
```

Look for:
- "Email sent successfully"
- "SMTP command failed"
- "Failed to connect to SMTP server"

### Firestore Verification

Check Firebase Console:
1. Go to https://console.firebase.google.com/
2. Select `acbf-rsa-backend` project
3. Navigate to Firestore Database
4. Check `contact_submissions` and `membership_applications` collections
5. Verify documents are being created

## Maintenance

### Update Email Templates

Edit `api/templates/email-templates.php`:

```php
function generateContactFormEmail($data) {
    // Modify HTML template here
    $html = <<<HTML
    <!-- Your custom HTML -->
HTML;
    return ['html' => $html, 'text' => $text];
}
```

Redeploy: `./deploy.sh`

### Change Admin Email

Edit `config.php`:

```php
define('ADMIN_EMAIL', 'new-admin@acbf.org.za');
```

Upload to server (config.php not in git).

### Add More Endpoints

1. Create new PHP file in `api/` (e.g., `api/newsletter-signup.php`)
2. Follow the same pattern as existing endpoints
3. Add email template in `api/templates/email-templates.php`
4. Update React component to call new endpoint
5. Deploy with `./deploy.sh`

## Cost Comparison

### Current Setup (PHP + Mailtrap)

- **Mailtrap**: Free (500 emails/month for testing)
- **PHP Execution**: Included with cPanel hosting (no extra cost)
- **Monthly Cost**: $0

### Alternative (Firebase Cloud Functions)

- **Firebase**: Requires Blaze plan ($50 deposit + pay-as-you-go)
- **Free Tier**: 2M invocations/month (likely free with typical usage)
- **Monthly Cost**: ~$0 (within free tier) but requires payment method on file

**Winner**: PHP for development/testing (no payment method required)

## Advantages of This Setup

✅ **No Firebase Cloud Functions needed** (saves $50 deposit)
✅ **Keeps Firestore database** (all your data is still saved)
✅ **Works with cPanel hosting** (included with your hosting plan)
✅ **Independent email system** (email failures don't break forms)
✅ **Easy to switch SMTP providers** (just update config.php)
✅ **Professional email templates** (purple/pink gradient designs)
✅ **CORS security** (only your domains can use the API)
✅ **Git-ignored credentials** (secrets never committed)
✅ **Lightweight** (no external dependencies)

## Support

If you encounter issues:

1. Check this guide's Troubleshooting section
2. Review browser console for errors
3. Check PHP error logs on server
4. Verify Mailtrap credentials are correct
5. Test with curl commands to isolate issue

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Maintained by**: ACBF Development Team
**Questions**: Check browser console and server logs first
