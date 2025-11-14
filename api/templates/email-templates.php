<?php
/**
 * Email Templates
 *
 * Professional HTML email templates for admin notifications
 */

/**
 * Format a date for display
 */
function formatDate($timestamp) {
    return date('F j, Y \a\t g:i A', $timestamp);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml($text) {
    return htmlspecialchars($text, ENT_QUOTES, 'UTF-8');
}

/**
 * Generate contact form notification email
 *
 * @param array $data Contact form data
 * @return array ['html' => string, 'text' => string]
 */
function generateContactFormEmail($data) {
    $name = escapeHtml($data['name']);
    $email = escapeHtml($data['email']);
    $subject = escapeHtml($data['subject']);
    $message = escapeHtml($data['message']);
    $timestamp = formatDate(time());
    $status = isset($data['status']) ? escapeHtml($data['status']) : 'new';

    $html = <<<HTML
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
    a {
      color: #667eea;
      text-decoration: none;
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
      <div class="field-value"><strong>{$name}</strong></div>
    </div>

    <div class="field">
      <div class="field-label">Email Address</div>
      <div class="field-value"><a href="mailto:{$email}">{$email}</a></div>
    </div>

    <div class="field">
      <div class="field-label">Subject</div>
      <div class="field-value"><strong>{$subject}</strong></div>
    </div>

    <div class="field">
      <div class="field-label">Message</div>
      <div class="message-box">{$message}</div>
    </div>

    <div class="field">
      <div class="field-label">Submitted</div>
      <div class="field-value">{$timestamp}</div>
    </div>

    <div class="field">
      <div class="field-label">Status</div>
      <div class="field-value"><span class="status-badge">{$status}</span></div>
    </div>
  </div>

  <div class="footer">
    <p>This is an automated notification from the ACBF website contact form.</p>
    <p>Please respond to the sender at <a href="mailto:{$email}">{$email}</a></p>
  </div>
</body>
</html>
HTML;

    $text = <<<TEXT
NEW CONTACT FORM SUBMISSION
African Community Business Federation

From: {$name}
Email: {$email}
Subject: {$subject}

Message:
{$message}

Submitted: {$timestamp}
Status: {$status}

---
This is an automated notification from the ACBF website contact form.
Please respond to the sender at {$email}
TEXT;

    return ['html' => $html, 'text' => $text];
}

/**
 * Generate membership application notification email
 *
 * @param array $data Membership application data
 * @return array ['html' => string, 'text' => string]
 */
function generateMembershipApplicationEmail($data) {
    $name = escapeHtml($data['name']);
    $email = escapeHtml($data['email']);
    $phone = escapeHtml($data['phone']);
    $business_name = isset($data['business_name']) && !empty($data['business_name']) ? escapeHtml($data['business_name']) : null;
    $business_type = escapeHtml($data['business_type']);
    $message = isset($data['message']) && !empty($data['message']) ? escapeHtml($data['message']) : null;
    $timestamp = formatDate(time());
    $status = isset($data['status']) ? escapeHtml($data['status']) : 'pending';

    $business_name_html = $business_name ? <<<HTML
    <div class="field">
      <div class="field-label">Business Name</div>
      <div class="field-value"><strong>{$business_name}</strong></div>
    </div>
HTML : '';

    $message_html = $message ? <<<HTML
    <div class="field">
      <div class="field-label">Additional Information</div>
      <div class="message-box">{$message}</div>
    </div>
HTML : '';

    $html = <<<HTML
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
    a {
      color: #f5576c;
      text-decoration: none;
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
      <div class="field-value"><strong>{$name}</strong></div>
    </div>

    <div class="field">
      <div class="field-label">Email Address</div>
      <div class="field-value"><a href="mailto:{$email}">{$email}</a></div>
    </div>

    <div class="field">
      <div class="field-label">Phone Number</div>
      <div class="field-value"><a href="tel:{$phone}">{$phone}</a></div>
    </div>

    {$business_name_html}

    <div class="field">
      <div class="field-label">Business Type</div>
      <div class="field-value">{$business_type}</div>
    </div>

    {$message_html}

    <div class="field">
      <div class="field-label">Submitted</div>
      <div class="field-value">{$timestamp}</div>
    </div>

    <div class="field">
      <div class="field-label">Status</div>
      <div class="field-value"><span class="status-badge">{$status}</span></div>
    </div>
  </div>

  <div class="footer">
    <p>This is an automated notification from the ACBF membership application form.</p>
    <p>Please review and follow up with the applicant at <a href="mailto:{$email}">{$email}</a></p>
  </div>
</body>
</html>
HTML;

    $business_name_text = $business_name ? "Business Name: {$business_name}\n" : '';
    $message_text = $message ? "\nAdditional Information:\n{$message}\n" : '';

    $text = <<<TEXT
NEW MEMBERSHIP APPLICATION
African Community Business Federation

Applicant Name: {$name}
Email: {$email}
Phone: {$phone}
{$business_name_text}Business Type: {$business_type}
{$message_text}
Submitted: {$timestamp}
Status: {$status}

---
This is an automated notification from the ACBF membership application form.
Please review and follow up with the applicant at {$email}
TEXT;

    return ['html' => $html, 'text' => $text];
}
