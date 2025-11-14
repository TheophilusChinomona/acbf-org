/**
 * Firebase Cloud Functions for ACBF Website
 *
 * This file contains Firestore triggers that automatically send email notifications
 * via Mailtrap SMTP when forms are submitted on the website.
 *
 * Triggers:
 * 1. onContactSubmissionCreated - Fires when a new document is added to contact_submissions
 * 2. onMembershipApplicationCreated - Fires when a new document is added to membership_applications
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { sendEmail } = require('./src/sendEmail');
const { generateAdminNotification } = require('./src/templates/adminNotification');

// Initialize Firebase Admin SDK
admin.initializeApp();

// Load environment variables
require('dotenv').config();

/**
 * Firestore Trigger: Contact Form Submission
 *
 * Triggers when a new document is created in the contact_submissions collection.
 * Sends an email notification to the admin with the contact form details.
 *
 * @trigger firestore.document('contact_submissions/{submissionId}').onCreate
 */
exports.onContactSubmissionCreated = functions.firestore
  .document('contact_submissions/{submissionId}')
  .onCreate(async (snap, context) => {
    const submissionId = context.params.submissionId;
    const data = snap.data();

    console.log('Contact form submission received:', {
      submissionId,
      name: data.name,
      email: data.email,
      subject: data.subject
    });

    try {
      // Generate email content from template
      const emailContent = generateAdminNotification('contact', data);

      // Send email via Mailtrap
      const result = await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: `New Contact Form: ${data.subject}`,
        html: emailContent.html,
        text: emailContent.text
      });

      if (result.success) {
        console.log('Contact form notification sent successfully:', {
          submissionId,
          messageId: result.messageId
        });

        // Optional: Update the document with email sent status
        await snap.ref.update({
          email_sent: true,
          email_sent_at: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        console.error('Failed to send contact form notification:', {
          submissionId,
          error: result.error
        });

        // Optional: Update the document with error status
        await snap.ref.update({
          email_sent: false,
          email_error: result.error
        });
      }

      return result;
    } catch (error) {
      console.error('Error processing contact form submission:', {
        submissionId,
        error: error.message,
        stack: error.stack
      });

      // Re-throw to mark the function as failed
      throw error;
    }
  });

/**
 * Firestore Trigger: Membership Application Submission
 *
 * Triggers when a new document is created in the membership_applications collection.
 * Sends an email notification to the admin with the application details.
 *
 * @trigger firestore.document('membership_applications/{applicationId}').onCreate
 */
exports.onMembershipApplicationCreated = functions.firestore
  .document('membership_applications/{applicationId}')
  .onCreate(async (snap, context) => {
    const applicationId = context.params.applicationId;
    const data = snap.data();

    console.log('Membership application received:', {
      applicationId,
      name: data.name,
      email: data.email,
      business_type: data.business_type
    });

    try {
      // Generate email content from template
      const emailContent = generateAdminNotification('membership', data);

      // Send email via Mailtrap
      const result = await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: `New Membership Application: ${data.name}`,
        html: emailContent.html,
        text: emailContent.text
      });

      if (result.success) {
        console.log('Membership application notification sent successfully:', {
          applicationId,
          messageId: result.messageId
        });

        // Optional: Update the document with email sent status
        await snap.ref.update({
          email_sent: true,
          email_sent_at: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        console.error('Failed to send membership application notification:', {
          applicationId,
          error: result.error
        });

        // Optional: Update the document with error status
        await snap.ref.update({
          email_sent: false,
          email_error: result.error
        });
      }

      return result;
    } catch (error) {
      console.error('Error processing membership application:', {
        applicationId,
        error: error.message,
        stack: error.stack
      });

      // Re-throw to mark the function as failed
      throw error;
    }
  });

/**
 * Optional: HTTP Endpoint for Testing Email Functionality
 *
 * This is a test endpoint that can be called to verify email sending works
 * without needing to submit a real form. Remove or comment out in production.
 *
 * @endpoint GET /testEmail
 */
exports.testEmail = functions.https.onRequest(async (req, res) => {
  try {
    const testData = {
      name: 'Test User',
      email: 'test@example.com',
      subject: 'Test Subject',
      message: 'This is a test message from the Firebase Functions email test endpoint.',
      created_at: admin.firestore.Timestamp.now(),
      status: 'new'
    };

    const emailContent = generateAdminNotification('contact', testData);

    const result = await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: 'Test Email from ACBF Firebase Functions',
      html: emailContent.html,
      text: emailContent.text
    });

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Test email sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send test email',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending test email',
      error: error.message
    });
  }
});
