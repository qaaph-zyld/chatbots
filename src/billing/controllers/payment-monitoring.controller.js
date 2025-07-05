/**
 * Payment Monitoring Controller
 * 
 * Exposes payment monitoring and alerting functionality via API endpoints
 */

const paymentMonitoringService = require('../services/payment-monitoring.service');
const { asyncHandler } = require('../../utils/async-handler');
const { SecurityViolationError, TenantAccessError } = require('../../utils/errors');
const logger = require('../../utils/logger');

/**
 * Get system-wide payment health metrics
 * Restricted to system administrators only
 */
const getSystemPaymentHealth = asyncHandler(async (req, res) => {
  // Verify admin access
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    throw new SecurityViolationError('Unauthorized access to system payment health metrics');
  }
  
  const healthMetrics = await paymentMonitoringService.getSystemPaymentHealth();
  
  res.status(200).json({
    success: true,
    data: healthMetrics
  });
});

/**
 * Get tenant-specific payment health metrics
 * Restricted to tenant administrators and system administrators
 */
const getTenantPaymentHealth = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;
  
  // Verify tenant access
  if (req.user.tenantId !== tenantId && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    throw new TenantAccessError('Unauthorized access to tenant payment health metrics');
  }
  
  const healthMetrics = await paymentMonitoringService.getTenantPaymentHealth(tenantId);
  
  res.status(200).json({
    success: true,
    data: healthMetrics
  });
});

/**
 * Update alert thresholds for payment monitoring
 * Restricted to system administrators only
 */
const updateAlertThresholds = asyncHandler(async (req, res) => {
  // Verify admin access
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    throw new SecurityViolationError('Unauthorized access to update alert thresholds');
  }
  
  const { failureRate, consecutiveFailures, recoveryTimeout, criticalAmount } = req.body;
  
  // Update thresholds that are provided
  if (failureRate !== undefined) {
    paymentMonitoringService.alertThresholds.failureRate = Number(failureRate);
  }
  
  if (consecutiveFailures !== undefined) {
    paymentMonitoringService.alertThresholds.consecutiveFailures = Number(consecutiveFailures);
  }
  
  if (recoveryTimeout !== undefined) {
    paymentMonitoringService.alertThresholds.recoveryTimeout = Number(recoveryTimeout);
  }
  
  if (criticalAmount !== undefined) {
    paymentMonitoringService.alertThresholds.criticalAmount = Number(criticalAmount);
  }
  
  logger.info('Payment monitoring alert thresholds updated', {
    updatedBy: req.user.id,
    newThresholds: paymentMonitoringService.alertThresholds
  });
  
  res.status(200).json({
    success: true,
    message: 'Alert thresholds updated successfully',
    data: paymentMonitoringService.alertThresholds
  });
});

/**
 * Get payment failure history for a tenant
 * Restricted to tenant administrators and system administrators
 */
const getPaymentFailureHistory = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;
  const { startDate, endDate, limit = 20, page = 1 } = req.query;
  
  // Verify tenant access
  if (req.user.tenantId !== tenantId && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    throw new TenantAccessError('Unauthorized access to tenant payment failure history');
  }
  
  // Parse dates
  const parsedStartDate = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days
  const parsedEndDate = endDate ? new Date(endDate) : new Date();
  
  // Query database for payment attempts
  const PaymentAttempt = require('../models/payment-attempt.model');
  
  const query = {
    tenantId,
    success: false,
    timestamp: {
      $gte: parsedStartDate,
      $lte: parsedEndDate
    }
  };
  
  const skip = (page - 1) * limit;
  
  const [failures, total] = await Promise.all([
    PaymentAttempt.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    PaymentAttempt.countDocuments(query)
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      failures,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit)
      }
    }
  });
});

/**
 * Manually trigger a payment recovery attempt
 * Restricted to system administrators only
 */
const triggerPaymentRecovery = asyncHandler(async (req, res) => {
  // Verify admin access
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    throw new SecurityViolationError('Unauthorized access to trigger payment recovery');
  }
  
  const { tenantId, subscriptionId } = req.body;
  
  if (!tenantId || !subscriptionId) {
    return res.status(400).json({
      success: false,
      message: 'Missing required parameters: tenantId and subscriptionId'
    });
  }
  
  // Get payment recovery service
  const paymentRecoveryService = require('../services/payment-recovery.service');
  
  // Trigger recovery
  const result = await paymentRecoveryService.manuallyTriggerRecovery(tenantId, subscriptionId);
  
  logger.info('Manual payment recovery triggered', {
    tenantId,
    subscriptionId,
    triggeredBy: req.user.id,
    result
  });
  
  res.status(200).json({
    success: true,
    message: 'Payment recovery triggered successfully',
    data: result
  });
});

module.exports = {
  getSystemPaymentHealth,
  getTenantPaymentHealth,
  updateAlertThresholds,
  getPaymentFailureHistory,
  triggerPaymentRecovery
};
