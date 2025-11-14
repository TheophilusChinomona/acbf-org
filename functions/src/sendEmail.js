/**
 * Email Sending Utility using Nodemailer with Mailtrap SMTP
 *
 * This utility provides a simple interface for sending emails through Mailtrap's
 * SMTP service, which is perfect for testing email functionality without sending
 * real emails to actual recipients.
 */

const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Create and configure the Mailtrap SMTP transporter
 * Uses environment variables for secure credential management
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

/**
 * Send an email via Mailtrap SMTP
 *
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.html - HTML email body
 * @param {string} options.text - Plain text email body (fallback)
 * @returns {Promise<Object>} Result object with success status and message ID or error
 */
async function sendEmail({ to, subject, html, text }) {
  const transporter = createTransporter();

  try {
    const info = await transporter.sendMail({
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to,
      subject,
      html,
      text: text || stripHtml(html) // Generate text version from HTML if not provided
    });

    console.log('Email sent successfully:', {
      messageId: info.messageId,
      to,
      subject
    });

    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Error sending email:', {
      error: error.message,
      to,
      subject
    });

    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Simple HTML tag stripper for generating plain text from HTML
 * @param {string} html - HTML content
 * @returns {string} Plain text content
 */
function stripHtml(html) {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

module.exports = { sendEmail };
