/**
 * Email Service
 * 
 * Handles email notifications for the application
 * Uses templates and supports various notification types
 */

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const logger = require('../../utils/logger');
const config = require('../../config');

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'user@example.com',
    pass: process.env.SMTP_PASS || 'password'
  }
});

/**
 * Load and compile an email template
 * @param {string} templateName - Name of the template file (without extension)
 * @returns {Function} Compiled template function
 */
const loadTemplate = (templateName) => {
  try {
    const templatePath = path.join(__dirname, '../templates', `${templateName}.html`);
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    return handlebars.compile(templateSource);
  } catch (error) {
    logger.error(`Failed to load email template: ${templateName}`, { error: error.message });
    throw new Error(`Email template not found: ${templateName}`);
  }
};

/**
 * Send an email using a template
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} templateName - Name of the template file (without extension)
 * @param {Object} data - Data to be used in the template
 * @returns {Promise<Object>} Nodemailer send mail result
 */
const sendTemplatedEmail = async (to, subject, templateName, data) => {
  try {
    // Add common template data
    const templateData = {
      ...data,
      currentYear: new Date().getFullYear(),
      logoUrl: process.env.LOGO_URL || 'https://example.com/logo.png',
      privacyUrl: process.env.PRIVACY_URL || 'https://example.com/privacy',
      termsUrl: process.env.TERMS_URL || 'https://example.com/terms',
      unsubscribeUrl: process.env.UNSUBSCRIBE_URL || 'https://example.com/unsubscribe',
      frontendUrl: process.env.FRONTEND_URL || 'https://example.com'
    };
    
    // Load and compile the template
    const template = loadTemplate(templateName);
    const html = template(templateData);
    
    // Send email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Company Name" <noreply@example.com>',
      to,
      subject,
      html
    });
    
    logger.info(`Email sent: ${info.messageId}`, { 
      template: templateName,
      recipient: to,
      subject
    });
    
    return info;
  } catch (error) {
    logger.error(`Failed to send email: ${error.message}`, {
      template: templateName,
      recipient: to,
      subject
    });
    throw error;
  }
};

/**
 * Send welcome email to new user
 * @param {string} to - User email address
 * @param {Object} data - User data
 * @returns {Promise<Object>} Email send result
 */
exports.sendWelcomeEmail = async (to, data) => {
  return sendTemplatedEmail(
    to,
    'Welcome to Our Platform!',
    'welcome',
    data
  );
};

/**
 * Send password reset email
 * @param {string} to - User email address
 * @param {Object} data - Reset token data
 * @returns {Promise<Object>} Email send result
 */
exports.sendPasswordResetEmail = async (to, data) => {
  return sendTemplatedEmail(
    to,
    'Password Reset Request',
    'password-reset',
    data
  );
};

/**
 * Send subscription confirmation email
 * @param {string} to - User email address
 * @param {Object} data - Subscription data
 * @returns {Promise<Object>} Email send result
 */
exports.sendSubscriptionConfirmationEmail = async (to, data) => {
  return sendTemplatedEmail(
    to,
    'Subscription Confirmation',
    'subscription-confirmation',
    data
  );
};

/**
 * Send subscription canceled email
 * @param {string} to - User email address
 * @param {Object} data - Subscription data
 * @returns {Promise<Object>} Email send result
 */
exports.sendSubscriptionCanceledEmail = async (to, data) => {
  return sendTemplatedEmail(
    to,
    'Subscription Canceled',
    'subscription-canceled',
    data
  );
};

/**
 * Send payment retry email
 * @param {string} to - User email address
 * @param {Object} data - Payment retry data
 * @returns {Promise<Object>} Email send result
 */
exports.sendPaymentRetryEmail = async (to, data) => {
  return sendTemplatedEmail(
    to,
    'Action Required: Payment Retry Notice',
    'payment-retry',
    data
  );
};

/**
 * Send payment recovered email
 * @param {string} to - User email address
 * @param {Object} data - Payment data
 * @returns {Promise<Object>} Email send result
 */
exports.sendPaymentRecoveredEmail = async (to, data) => {
  return sendTemplatedEmail(
    to,
    'Payment Successfully Processed',
    'payment-recovered',
    data
  );
};

/**
 * Send payment final notice email
 * @param {string} to - User email address
 * @param {Object} data - Payment and grace period data
 * @returns {Promise<Object>} Email send result
 */
exports.sendPaymentFinalNoticeEmail = async (to, data) => {
  return sendTemplatedEmail(
    to,
    'IMPORTANT: Final Payment Notice',
    'payment-final-notice',
    data
  );
};

/**
 * Send subscription reactivated email
 * @param {string} to - User email address
 * @param {Object} data - Subscription data
 * @returns {Promise<Object>} Email send result
 */
exports.sendSubscriptionReactivatedEmail = async (to, data) => {
  return sendTemplatedEmail(
    to,
    'Your Subscription Has Been Reactivated',
    'subscription-reactivated',
    data
  );
};

module.exports = {
  sendWelcomeEmail: exports.sendWelcomeEmail,
  sendPasswordResetEmail: exports.sendPasswordResetEmail,
  sendSubscriptionConfirmationEmail: exports.sendSubscriptionConfirmationEmail,
  sendSubscriptionCanceledEmail: exports.sendSubscriptionCanceledEmail,
  sendPaymentRetryEmail: exports.sendPaymentRetryEmail,
  sendPaymentRecoveredEmail: exports.sendPaymentRecoveredEmail,
  sendPaymentFinalNoticeEmail: exports.sendPaymentFinalNoticeEmail,
  sendSubscriptionReactivatedEmail: exports.sendSubscriptionReactivatedEmail
};
