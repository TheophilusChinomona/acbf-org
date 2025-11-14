/**
 * Email Templates for Admin Notifications
 *
 * Generates formatted email content for different types of form submissions
 */

/**
 * Format a timestamp for display
 * @param {Object} timestamp - Firestore timestamp
 * @returns {string} Formatted date string
 */
function formatDate(timestamp) {
  if (!timestamp) return 'N/A';

  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-ZA', {
      timeZone: 'Africa/Johannesburg',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Invalid date';
  }
}

/**
 * Generate admin notification email for contact form submissions
 * @param {Object} data - Contact form submission data
 * @returns {Object} Email content with html and text versions
 */
function generateContactFormNotification(data) {
  const {
    name,
    email,
    subject,
    message,
    created_at,
    status
  } = data;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px 10px 0 0;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      background: #f9f9f9;
      padding: 30px;
      border: 1px solid #e0e0e0;
      border-top: none;
      border-radius: 0 0 10px 10px;
    }
    .field {
      margin-bottom: 20px;
      padding: 15px;
      background: white;
      border-radius: 5px;
      border-left: 4px solid #667eea;
    }
    .field-label {
      font-weight: bold;
      color: #667eea;
      margin-bottom: 5px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .field-value {
      color: #333;
      font-size: 14px;
    }
    .message-box {
      background: white;
      padding: 15px;
      border-radius: 5px;
      border: 1px solid #e0e0e0;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #e0e0e0;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    .status-badge {
      display: inline-block;
      padding: 5px 15px;
      background: #4CAF50;
      color: white;
      border-radius: 20px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📧 New Contact Form Submission</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">African Community Business Federation</p>
  </div>

  <div class="content">
    <div class="field">
      <div class="field-label">From</div>
      <div class="field-value"><strong>${name}</strong></div>
    </div>

    <div class="field">
      <div class="field-label">Email Address</div>
      <div class="field-value"><a href="mailto:${email}" style="color: #667eea; text-decoration: none;">${email}</a></div>
    </div>

    <div class="field">
      <div class="field-label">Subject</div>
      <div class="field-value"><strong>${subject}</strong></div>
    </div>

    <div class="field">
      <div class="field-label">Message</div>
      <div class="message-box">${message}</div>
    </div>

    <div class="field">
      <div class="field-label">Submitted</div>
      <div class="field-value">${formatDate(created_at)}</div>
    </div>

    <div class="field">
      <div class="field-label">Status</div>
      <div class="field-value"><span class="status-badge">${status || 'new'}</span></div>
    </div>
  </div>

  <div class="footer">
    <p>This is an automated notification from the ACBF website contact form.</p>
    <p>Please respond to the sender at <a href="mailto:${email}" style="color: #667eea;">${email}</a></p>
  </div>
</body>
</html>
  `;

  const text = `
NEW CONTACT FORM SUBMISSION
African Community Business Federation

From: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}

Submitted: ${formatDate(created_at)}
Status: ${status || 'new'}

---
This is an automated notification from the ACBF website contact form.
Please respond to the sender at ${email}
  `;

  return { html, text };
}

/**
 * Generate admin notification email for membership application submissions
 * @param {Object} data - Membership application data
 * @returns {Object} Email content with html and text versions
 */
function generateMembershipApplicationNotification(data) {
  const {
    name,
    email,
    phone,
    business_name,
    business_type,
    message,
    created_at,
    status
  } = data;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
      padding: 30px;
      border-radius: 10px 10px 0 0;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      background: #f9f9f9;
      padding: 30px;
      border: 1px solid #e0e0e0;
      border-top: none;
      border-radius: 0 0 10px 10px;
    }
    .field {
      margin-bottom: 20px;
      padding: 15px;
      background: white;
      border-radius: 5px;
      border-left: 4px solid #f5576c;
    }
    .field-label {
      font-weight: bold;
      color: #f5576c;
      margin-bottom: 5px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .field-value {
      color: #333;
      font-size: 14px;
    }
    .message-box {
      background: white;
      padding: 15px;
      border-radius: 5px;
      border: 1px solid #e0e0e0;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #e0e0e0;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    .status-badge {
      display: inline-block;
      padding: 5px 15px;
      background: #FF9800;
      color: white;
      border-radius: 20px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎯 New Membership Application</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">African Community Business Federation</p>
  </div>

  <div class="content">
    <div class="field">
      <div class="field-label">Applicant Name</div>
      <div class="field-value"><strong>${name}</strong></div>
    </div>

    <div class="field">
      <div class="field-label">Email Address</div>
      <div class="field-value"><a href="mailto:${email}" style="color: #f5576c; text-decoration: none;">${email}</a></div>
    </div>

    <div class="field">
      <div class="field-label">Phone Number</div>
      <div class="field-value"><a href="tel:${phone}" style="color: #f5576c; text-decoration: none;">${phone}</a></div>
    </div>

    ${business_name ? `
    <div class="field">
      <div class="field-label">Business Name</div>
      <div class="field-value"><strong>${business_name}</strong></div>
    </div>
    ` : ''}

    <div class="field">
      <div class="field-label">Business Type</div>
      <div class="field-value">${business_type}</div>
    </div>

    ${message ? `
    <div class="field">
      <div class="field-label">Additional Information</div>
      <div class="message-box">${message}</div>
    </div>
    ` : ''}

    <div class="field">
      <div class="field-label">Submitted</div>
      <div class="field-value">${formatDate(created_at)}</div>
    </div>

    <div class="field">
      <div class="field-label">Status</div>
      <div class="field-value"><span class="status-badge">${status || 'pending'}</span></div>
    </div>
  </div>

  <div class="footer">
    <p>This is an automated notification from the ACBF membership application form.</p>
    <p>Please review and follow up with the applicant at <a href="mailto:${email}" style="color: #f5576c;">${email}</a></p>
  </div>
</body>
</html>
  `;

  const text = `
NEW MEMBERSHIP APPLICATION
African Community Business Federation

Applicant Name: ${name}
Email: ${email}
Phone: ${phone}
${business_name ? `Business Name: ${business_name}` : ''}
Business Type: ${business_type}

${message ? `Additional Information:\n${message}\n` : ''}
Submitted: ${formatDate(created_at)}
Status: ${status || 'pending'}

---
This is an automated notification from the ACBF membership application form.
Please review and follow up with the applicant at ${email}
  `;

  return { html, text };
}

/**
 * Main function to generate admin notification based on type
 * @param {string} type - Type of notification ('contact' or 'membership')
 * @param {Object} data - Form submission data
 * @returns {Object} Email content with html and text versions
 */
function generateAdminNotification(type, data) {
  switch (type) {
    case 'contact':
      return generateContactFormNotification(data);
    case 'membership':
      return generateMembershipApplicationNotification(data);
    default:
      throw new Error(`Unknown notification type: ${type}`);
  }
}

module.exports = {
  generateAdminNotification,
  generateContactFormNotification,
  generateMembershipApplicationNotification
};
