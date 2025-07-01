/**
 * Stripe Webhook Middleware
 * 
 * Middleware to handle raw body parsing for Stripe webhook signature verification
 */

const express = require('express');
const logger = require('../utils/logger');

/**
 * Middleware to parse and save raw body for Stripe webhook verification
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const stripeWebhookMiddleware = (req, res, next) => {
  // Only process if this is the Stripe webhook route
  if (req.originalUrl === '/api/billing/payment/webhook') {
    // Create a buffer to store the raw body
    let rawBody = Buffer.from('');
    
    req.on('data', (chunk) => {
      rawBody = Buffer.concat([rawBody, chunk]);
    });
    
    req.on('end', () => {
      if (rawBody.length > 0) {
        req.rawBody = rawBody.toString('utf8');
        logger.debug('Raw body saved for Stripe webhook verification');
      }
      next();
    });
  } else {
    next();
  }
};

module.exports = stripeWebhookMiddleware;
