/**
 * Subscription Lifecycle Routes
 * 
 * API routes for subscription lifecycle management including:
 * - Renewal
 * - Cancellation
 * - Plan changes
 * - Pause/Resume
 * - Grace period processing
 */

const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const subscriptionLifecycleController = require('../controllers/subscription-lifecycle.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const adminMiddleware = require('../../middleware/admin.middleware');

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/billing/subscriptions/:id
 * @desc    Get subscription details
 * @access  Private
 */
router.get(
  '/subscriptions/:id',
  [
    check('id', 'Valid subscription ID is required').isMongoId()
  ],
  subscriptionLifecycleController.getSubscription
);

/**
 * @route   POST /api/billing/subscriptions/:id/renew
 * @desc    Process subscription renewal
 * @access  Private
 */
router.post(
  '/subscriptions/:id/renew',
  [
    check('id', 'Valid subscription ID is required').isMongoId()
  ],
  subscriptionLifecycleController.renewSubscription
);

/**
 * @route   POST /api/billing/subscriptions/:id/cancel
 * @desc    Cancel subscription
 * @access  Private
 */
router.post(
  '/subscriptions/:id/cancel',
  [
    check('id', 'Valid subscription ID is required').isMongoId(),
    check('immediate', 'Immediate must be a boolean').optional().isBoolean()
  ],
  subscriptionLifecycleController.cancelSubscription
);

/**
 * @route   POST /api/billing/subscriptions/:id/change-plan
 * @desc    Change subscription plan
 * @access  Private
 */
router.post(
  '/subscriptions/:id/change-plan',
  [
    check('id', 'Valid subscription ID is required').isMongoId(),
    check('planId', 'Valid plan ID is required').isMongoId(),
    check('prorate', 'Prorate must be a boolean').optional().isBoolean()
  ],
  subscriptionLifecycleController.changePlan
);

/**
 * @route   POST /api/billing/subscriptions/:id/pause
 * @desc    Pause subscription
 * @access  Private
 */
router.post(
  '/subscriptions/:id/pause',
  [
    check('id', 'Valid subscription ID is required').isMongoId(),
    check('resumeDate', 'Resume date must be a valid date').optional().isISO8601()
  ],
  subscriptionLifecycleController.pauseSubscription
);

/**
 * @route   POST /api/billing/subscriptions/:id/resume
 * @desc    Resume subscription
 * @access  Private
 */
router.post(
  '/subscriptions/:id/resume',
  [
    check('id', 'Valid subscription ID is required').isMongoId()
  ],
  subscriptionLifecycleController.resumeSubscription
);

/**
 * @route   POST /api/billing/admin/subscriptions/process-grace-periods
 * @desc    Process grace periods (admin only)
 * @access  Admin
 */
router.post(
  '/admin/subscriptions/process-grace-periods',
  adminMiddleware,
  subscriptionLifecycleController.processGracePeriods
);

module.exports = router;
