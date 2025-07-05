/**
 * Payment Monitoring Service
 * 
 * Monitors payment processing, tracks failures, and sends alerts for critical payment issues
 */

const monitoringService = require('../../monitoring/services/monitoring.service');
const emailService = require('../../notifications/services/email.service');
const PaymentAttempt = require('../models/payment-attempt.model');
const Subscription = require('../models/subscription.model');
const Tenant = require('../../tenancy/models/tenant.model');
const logger = require('../../utils/logger');
const config = require('../../core/config');
const client = require('prom-client');

// Custom metrics for payment monitoring
const paymentFailureCounter = new client.Counter({
  name: 'payment_failures_total',
  help: 'Total number of payment failures',
  labelNames: ['tenant_id', 'error_type', 'payment_method']
});

const paymentRecoveryCounter = new client.Counter({
  name: 'payment_recoveries_total',
  help: 'Total number of successful payment recoveries',
  labelNames: ['tenant_id', 'retry_count']
});

const paymentLatencyHistogram = new client.Histogram({
  name: 'payment_processing_duration_ms',
  help: 'Payment processing duration in ms',
  labelNames: ['tenant_id', 'payment_type'],
  buckets: [50, 100, 250, 500, 1000, 2500, 5000, 10000]
});

const subscriptionStatusGauge = new client.Gauge({
  name: 'subscription_status',
  help: 'Current subscription status (1=active, 0=inactive)',
  labelNames: ['tenant_id', 'plan_id']
});

// Register metrics with the global registry
monitoringService.register.registerMetric(paymentFailureCounter);
monitoringService.register.registerMetric(paymentRecoveryCounter);
monitoringService.register.registerMetric(paymentLatencyHistogram);
monitoringService.register.registerMetric(subscriptionStatusGauge);

/**
 * Service for monitoring payment processing and alerting on failures
 */
class PaymentMonitoringService {
  constructor() {
    this.alertThresholds = {
      failureRate: 10, // Alert if failure rate exceeds 10%
      consecutiveFailures: 3, // Alert after 3 consecutive failures for same tenant
      recoveryTimeout: 24 * 60 * 60 * 1000, // 24 hours
      criticalAmount: 1000 // Alert for failures above $1000
    };
    
    this.alertCooldowns = new Map();
    this.cooldownPeriod = 60 * 60 * 1000; // 1 hour
    
    // Tenant-specific failure tracking
    this.tenantFailures = new Map();
  }
  
  /**
   * Record a payment attempt (success or failure)
   * @param {Object} paymentData Payment data
   * @param {string} paymentData.tenantId Tenant ID
   * @param {string} paymentData.paymentMethodId Payment method ID
   * @param {number} paymentData.amount Amount in cents
   * @param {string} paymentData.currency Currency code
   * @param {boolean} paymentData.success Whether payment was successful
   * @param {string} paymentData.errorType Error type if failure
   * @param {string} paymentData.errorMessage Error message if failure
   * @param {string} paymentData.paymentType Type of payment (subscription, one-time, etc.)
   * @returns {Promise<void>}
   */
  async recordPaymentAttempt(paymentData) {
    const startTime = Date.now();
    
    try {
      // Record metrics
      if (!paymentData.success) {
        paymentFailureCounter.inc({
          tenant_id: paymentData.tenantId,
          error_type: paymentData.errorType || 'unknown',
          payment_method: paymentData.paymentMethodId || 'unknown'
        });
        
        // Track consecutive failures for this tenant
        if (!this.tenantFailures.has(paymentData.tenantId)) {
          this.tenantFailures.set(paymentData.tenantId, {
            count: 1,
            firstFailure: new Date(),
            latestFailure: new Date(),
            totalAmount: paymentData.amount
          });
        } else {
          const failures = this.tenantFailures.get(paymentData.tenantId);
          failures.count += 1;
          failures.latestFailure = new Date();
          failures.totalAmount += paymentData.amount;
          this.tenantFailures.set(paymentData.tenantId, failures);
        }
        
        // Check if we need to send alerts
        await this.checkAlertThresholds(paymentData.tenantId);
      } else {
        // Reset failure count on success
        if (this.tenantFailures.has(paymentData.tenantId)) {
          const failures = this.tenantFailures.get(paymentData.tenantId);
          if (failures.count > 0) {
            paymentRecoveryCounter.inc({
              tenant_id: paymentData.tenantId,
              retry_count: failures.count
            });
          }
          this.tenantFailures.delete(paymentData.tenantId);
        }
      }
      
      // Record payment processing latency
      const duration = Date.now() - startTime;
      paymentLatencyHistogram.observe(
        {
          tenant_id: paymentData.tenantId,
          payment_type: paymentData.paymentType || 'unknown'
        },
        duration
      );
      
      // Log the payment attempt
      logger.info(`Payment attempt ${paymentData.success ? 'succeeded' : 'failed'} for tenant ${paymentData.tenantId}`, {
        tenantId: paymentData.tenantId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        success: paymentData.success,
        errorType: paymentData.errorType,
        paymentMethodId: paymentData.paymentMethodId
      });
      
      // Store payment attempt in database
      await PaymentAttempt.create({
        tenantId: paymentData.tenantId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        paymentMethodId: paymentData.paymentMethodId,
        success: paymentData.success,
        errorType: paymentData.errorType,
        errorMessage: paymentData.errorMessage,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Error recording payment attempt', {
        error: error.message,
        stack: error.stack,
        paymentData
      });
    }
  }
  
  /**
   * Check if alert thresholds have been exceeded
   * @param {string} tenantId Tenant ID
   * @returns {Promise<void>}
   */
  async checkAlertThresholds(tenantId) {
    if (!this.tenantFailures.has(tenantId)) {
      return;
    }
    
    const failures = this.tenantFailures.get(tenantId);
    const alertKey = `payment_failure_${tenantId}`;
    
    // Don't send alerts if we're in cooldown period
    if (this.alertCooldowns.has(alertKey)) {
      const cooldownUntil = this.alertCooldowns.get(alertKey);
      if (Date.now() < cooldownUntil) {
        return;
      }
    }
    
    let shouldAlert = false;
    let alertReason = '';
    
    // Check consecutive failures threshold
    if (failures.count >= this.alertThresholds.consecutiveFailures) {
      shouldAlert = true;
      alertReason = `${failures.count} consecutive payment failures`;
    }
    
    // Check total amount threshold
    if (failures.totalAmount >= this.alertThresholds.criticalAmount * 100) { // Convert dollars to cents
      shouldAlert = true;
      alertReason = `Failed payments totaling ${(failures.totalAmount / 100).toFixed(2)} USD`;
    }
    
    // Check failure rate threshold (requires database query)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const totalAttempts = await PaymentAttempt.countDocuments({
      tenantId,
      timestamp: { $gte: oneDayAgo }
    });
    
    const failedAttempts = await PaymentAttempt.countDocuments({
      tenantId,
      success: false,
      timestamp: { $gte: oneDayAgo }
    });
    
    if (totalAttempts > 0) {
      const failureRate = (failedAttempts / totalAttempts) * 100;
      if (failureRate >= this.alertThresholds.failureRate) {
        shouldAlert = true;
        alertReason = `Payment failure rate of ${failureRate.toFixed(1)}%`;
      }
    }
    
    if (shouldAlert) {
      await this.sendPaymentFailureAlert(tenantId, alertReason);
      
      // Set cooldown period
      this.alertCooldowns.set(alertKey, Date.now() + this.cooldownPeriod);
    }
  }
  
  /**
   * Send payment failure alert to administrators
   * @param {string} tenantId Tenant ID
   * @param {string} reason Alert reason
   * @returns {Promise<void>}
   */
  async sendPaymentFailureAlert(tenantId, reason) {
    try {
      // Get tenant details
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        logger.error(`Cannot send payment alert: Tenant ${tenantId} not found`);
        return;
      }
      
      // Get subscription details
      const subscription = await Subscription.findOne({ tenantId });
      
      // Send email alert to system administrators
      await emailService.sendEmail({
        to: config.alerts.paymentFailureRecipients,
        subject: `ALERT: Payment Failures for ${tenant.name}`,
        template: 'payment-failure-alert',
        data: {
          tenantName: tenant.name,
          tenantId: tenantId,
          reason: reason,
          failures: this.tenantFailures.get(tenantId),
          subscription: subscription ? {
            planName: subscription.planName,
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd
          } : null,
          dashboardUrl: `${config.adminDashboard.url}/tenants/${tenantId}/billing`
        }
      });
      
      // Log the alert
      logger.warn(`Payment failure alert sent for tenant ${tenantId}: ${reason}`, {
        tenantId,
        tenantName: tenant.name,
        reason,
        failures: this.tenantFailures.get(tenantId)
      });
      
      // Record alert in monitoring service
      monitoringService.recordAlert({
        type: 'payment_failure',
        severity: 'high',
        message: `Payment failures for tenant ${tenant.name}: ${reason}`,
        metadata: {
          tenantId,
          tenantName: tenant.name,
          reason,
          failures: this.tenantFailures.get(tenantId)
        }
      });
    } catch (error) {
      logger.error('Error sending payment failure alert', {
        error: error.message,
        stack: error.stack,
        tenantId
      });
    }
  }
  
  /**
   * Update subscription status metrics
   * @returns {Promise<void>}
   */
  async updateSubscriptionMetrics() {
    try {
      // Get all active subscriptions
      const subscriptions = await Subscription.find({});
      
      // Reset all metrics (set to 0)
      const tenantPlans = new Map();
      
      // Update metrics for each subscription
      for (const subscription of subscriptions) {
        const status = subscription.status === 'active' ? 1 : 0;
        subscriptionStatusGauge.set(
          {
            tenant_id: subscription.tenantId,
            plan_id: subscription.planId
          },
          status
        );
        
        // Track tenant-plan combinations
        tenantPlans.set(`${subscription.tenantId}-${subscription.planId}`, status);
      }
    } catch (error) {
      logger.error('Error updating subscription metrics', {
        error: error.message,
        stack: error.stack
      });
    }
  }
  
  /**
   * Get payment health metrics for a tenant
   * @param {string} tenantId Tenant ID
   * @returns {Promise<Object>} Health metrics
   */
  async getTenantPaymentHealth(tenantId) {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      // Get payment attempts for the last day
      const dailyAttempts = await PaymentAttempt.countDocuments({
        tenantId,
        timestamp: { $gte: oneDayAgo }
      });
      
      const dailyFailures = await PaymentAttempt.countDocuments({
        tenantId,
        success: false,
        timestamp: { $gte: oneDayAgo }
      });
      
      // Get payment attempts for the last week
      const weeklyAttempts = await PaymentAttempt.countDocuments({
        tenantId,
        timestamp: { $gte: oneWeekAgo }
      });
      
      const weeklyFailures = await PaymentAttempt.countDocuments({
        tenantId,
        success: false,
        timestamp: { $gte: oneWeekAgo }
      });
      
      // Calculate failure rates
      const dailyFailureRate = dailyAttempts > 0 ? (dailyFailures / dailyAttempts) * 100 : 0;
      const weeklyFailureRate = weeklyAttempts > 0 ? (weeklyFailures / weeklyAttempts) * 100 : 0;
      
      // Get current subscription status
      const subscription = await Subscription.findOne({ tenantId });
      
      return {
        dailyAttempts,
        dailyFailures,
        dailyFailureRate,
        weeklyAttempts,
        weeklyFailures,
        weeklyFailureRate,
        currentFailures: this.tenantFailures.has(tenantId) ? this.tenantFailures.get(tenantId) : null,
        subscriptionStatus: subscription ? subscription.status : 'none'
      };
    } catch (error) {
      logger.error('Error getting tenant payment health', {
        error: error.message,
        stack: error.stack,
        tenantId
      });
      throw error;
    }
  }
  
  /**
   * Get overall payment system health metrics
   * @returns {Promise<Object>} Health metrics
   */
  async getSystemPaymentHealth() {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // Get payment attempts for the last day
      const dailyAttempts = await PaymentAttempt.countDocuments({
        timestamp: { $gte: oneDayAgo }
      });
      
      const dailyFailures = await PaymentAttempt.countDocuments({
        success: false,
        timestamp: { $gte: oneDayAgo }
      });
      
      // Calculate failure rate
      const dailyFailureRate = dailyAttempts > 0 ? (dailyFailures / dailyAttempts) * 100 : 0;
      
      // Get tenants with active failures
      const tenantsWithFailures = Array.from(this.tenantFailures.entries()).map(([tenantId, failures]) => ({
        tenantId,
        ...failures
      }));
      
      // Get active subscriptions count
      const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });
      
      return {
        dailyAttempts,
        dailyFailures,
        dailyFailureRate,
        activeSubscriptions,
        tenantsWithFailures,
        systemHealth: dailyFailureRate < this.alertThresholds.failureRate ? 'healthy' : 'degraded'
      };
    } catch (error) {
      logger.error('Error getting system payment health', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}

module.exports = new PaymentMonitoringService();
