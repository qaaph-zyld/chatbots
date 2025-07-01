/**
 * Stripe Webhook Routes
 * 
 * Defines routes for handling Stripe webhook events
 */

const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');
const rawBodyMiddleware = require('../../middleware/raw-body.middleware');

// Stripe requires the raw request body for webhook signature verification
router.post(
  '/', 
  rawBodyMiddleware,
  webhookController.handleWebhook
);

module.exports = router;
