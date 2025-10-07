/**
 * Billing Routes
 * 
 * API routes for billing and subscription management
 */

const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billing.controller');
const authMiddleware = require('../middleware/auth.middleware');
const rateLimitMiddleware = require('../middleware/rate-limit.middleware');

// Apply authentication to all billing routes
router.use(authMiddleware.authenticate);

// Subscription management routes
router.post('/subscriptions', 
  rateLimitMiddleware.createSubscription,
  billingController.createSubscription
);

router.get('/subscriptions', 
  rateLimitMiddleware.standard,
  billingController.getSubscription
);

router.put('/subscriptions', 
  rateLimitMiddleware.updateSubscription,
  billingController.updateSubscription
);

router.delete('/subscriptions', 
  rateLimitMiddleware.standard,
  billingController.cancelSubscription
);

// Plan information routes
router.get('/plans', 
  rateLimitMiddleware.standard,
  billingController.getPlans
);

// Usage tracking routes
router.get('/usage', 
  rateLimitMiddleware.standard,
  billingController.getUsage
);

router.post('/usage', 
  rateLimitMiddleware.recordUsage,
  billingController.recordUsage
);

router.get('/usage/limits', 
  rateLimitMiddleware.standard,
  billingController.checkLimits
);

router.get('/usage/overages', 
  rateLimitMiddleware.standard,
  billingController.getOverages
);

// Billing history routes
router.get('/history', 
  rateLimitMiddleware.standard,
  billingController.getBillingHistory
);

// Webhook endpoint (no auth required)
router.post('/webhooks/stripe', 
  express.raw({ type: 'application/json' }),
  billingController.handleWebhook
);

module.exports = router;
