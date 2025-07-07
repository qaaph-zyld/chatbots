/**
 * Payment Recovery Routes
 * 
 * API routes for payment recovery management including:
 * - Retry scheduling
 * - Retry processing
 * - Recovery statistics
 */

const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const paymentRecoveryController = require('../controllers/payment-recovery.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const adminMiddleware = require('../../middleware/admin.middleware');

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   POST /api/billing/payment-recovery/retry
 * @desc    Schedule a payment retry
 * @access  Private
 */
router.post(
  '/payment-recovery/retry',
  [
    check('subscriptionId', 'Valid subscription ID is required').isMongoId(),
    check('invoiceId', 'Valid invoice ID is required').notEmpty(),
    check('paymentError', 'Payment error details are required').isObject()
  ],
  paymentRecoveryController.scheduleRetry
);

/**
 * @route   POST /api/billing/admin/payment-recovery/process-retries
 * @desc    Process scheduled retries (admin only)
 * @access  Admin
 */
router.post(
  '/admin/payment-recovery/process-retries',
  adminMiddleware,
  paymentRecoveryController.processScheduledRetries
);

/**
 * @route   POST /api/billing/payment-recovery/recovered
 * @desc    Handle a recovered payment
 * @access  Admin
 */
router.post(
  '/admin/payment-recovery/recovered',
  adminMiddleware,
  [
    check('subscriptionId', 'Valid subscription ID is required').isMongoId(),
    check('invoiceId', 'Valid invoice ID is required').notEmpty()
  ],
  paymentRecoveryController.handleRecoveredPayment
);

/**
 * @route   GET /api/billing/payment-recovery/stats/:subscriptionId
 * @desc    Get recovery statistics for a subscription
 * @access  Private
 */
router.get(
  '/payment-recovery/stats/:subscriptionId',
  [
    check('subscriptionId', 'Valid subscription ID is required').isMongoId()
  ],
  paymentRecoveryController.getRecoveryStats
);

module.exports = router;
