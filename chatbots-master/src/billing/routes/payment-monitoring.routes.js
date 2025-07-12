/**
 * Payment Monitoring Routes
 * 
 * API routes for payment monitoring and alerting functionality
 */

const express = require('express');
const router = express.Router();
const paymentMonitoringController = require('../controllers/payment-monitoring.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { tenantIsolation } = require('../../middleware/tenant-isolation.middleware');
const { roleCheck } = require('../../middleware/role.middleware');

/**
 * @route   GET /api/billing/monitoring/system
 * @desc    Get system-wide payment health metrics
 * @access  Admin only
 */
router.get(
  '/system',
  authenticate,
  roleCheck(['admin', 'superadmin']),
  paymentMonitoringController.getSystemPaymentHealth
);

/**
 * @route   GET /api/billing/monitoring/tenant/:tenantId
 * @desc    Get tenant-specific payment health metrics
 * @access  Tenant admin, System admin
 */
router.get(
  '/tenant/:tenantId',
  authenticate,
  tenantIsolation(),
  paymentMonitoringController.getTenantPaymentHealth
);

/**
 * @route   GET /api/billing/monitoring/tenant/:tenantId/failures
 * @desc    Get payment failure history for a tenant
 * @access  Tenant admin, System admin
 */
router.get(
  '/tenant/:tenantId/failures',
  authenticate,
  tenantIsolation(),
  paymentMonitoringController.getPaymentFailureHistory
);

/**
 * @route   PUT /api/billing/monitoring/thresholds
 * @desc    Update alert thresholds for payment monitoring
 * @access  Admin only
 */
router.put(
  '/thresholds',
  authenticate,
  roleCheck(['admin', 'superadmin']),
  paymentMonitoringController.updateAlertThresholds
);

/**
 * @route   POST /api/billing/monitoring/recovery
 * @desc    Manually trigger a payment recovery attempt
 * @access  Admin only
 */
router.post(
  '/recovery',
  authenticate,
  roleCheck(['admin', 'superadmin']),
  paymentMonitoringController.triggerPaymentRecovery
);

module.exports = router;
