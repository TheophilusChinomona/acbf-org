<?php
/**
 * Email Configuration Template
 *
 * Copy this file to config.php and update with your actual Mailtrap credentials
 * DO NOT commit config.php to version control (it's in .gitignore)
 */

// Mailtrap SMTP Configuration
define('SMTP_HOST', 'sandbox.smtp.mailtrap.io');
define('SMTP_PORT', 2525);
define('SMTP_USER', 'your_mailtrap_username_here');  // Get from Mailtrap dashboard
define('SMTP_PASS', 'your_mailtrap_password_here');  // Get from Mailtrap dashboard

// Email Settings
define('ADMIN_EMAIL', 'admin@acbf.org.za');          // Where to send notifications
define('FROM_EMAIL', 'noreply@acbf.org.za');         // Sender email address
define('FROM_NAME', 'ACBF');                         // Sender display name
define('ORGANIZATION_NAME', 'African Community Business Federation');

// Security Settings
define('ALLOWED_ORIGINS', [
    'https://dev.acbf.org.za',
    'http://localhost:5173',  // Vite dev server
    'http://localhost:4173'   // Vite preview
]);

// Enable error reporting for development (set to false in production)
define('DEBUG_MODE', true);

/**
 * SETUP INSTRUCTIONS:
 *
 * 1. Copy this file:
 *    cp config.example.php config.php
 *
 * 2. Log in to Mailtrap: https://mailtrap.io
 *
 * 3. Go to: Email Testing > Inboxes > Your Inbox > SMTP Settings
 *
 * 4. Select "Show Credentials"
 *
 * 5. Copy the Username and Password to SMTP_USER and SMTP_PASS above
 *
 * 6. Update ADMIN_EMAIL with your actual email address
 *
 * 7. Save config.php (DO NOT commit to git)
 *
 * 8. Test by submitting a form on your website
 */
