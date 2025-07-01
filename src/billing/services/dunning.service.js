/**
 * Dunning Service
 * 
 * Handles dunning management for failed payments
 * Includes retry scheduling, notification management, and recovery tracking
 */

const Subscription = require('../models/subscription.model');
const Tenant = require('../../tenancy/models/tenant.model');
const paymentService = require('./payment.service');
const emailService = require('../../notifications/services/email.service');
const logger = require('../../utils/logger');
const config = require('../../core/config');

/**
 * Dunning Service class for handling failed payment recovery
 */
class DunningService {
  /**
   * Initialize dunning configuration
   */
  constructor() {
    // Default dunning configuration
    this.defaultConfig = {
      // Retry schedule in days after initial failure
      retrySchedule: [3, 7, 14],
      // Maximum number of retry attempts
      maxRetries: 3,
      // Whether to send notifications
      sendNotifications: true,
      // Whether to automatically cancel subscription after all retries fail
      autoCancel: true,
      // Grace period in days before cancellation after all retries fail
      gracePeriod: 3
    };
    
    // Load configuration from environment
    this.config = config.dunning || this.defaultConfig;
  }
  
  /**
   * Process a failed payment
   * @param {string} subscriptionId - Subscription ID
   * @param {string} paymentIntentId - Payment intent ID
   * @param {string} errorMessage - Error message
   * @returns {Promise<Object>} - Dunning record
   */
  async processFailedPayment(subscriptionId, paymentIntentId, errorMessage) {
    try {
      // Get subscription
      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        throw new Error(`Subscription not found: ${subscriptionId}`);
      }
      
      // Get tenant
      const tenant = await Tenant.findById(subscription.tenantId);
      if (!tenant) {
        throw new Error(`Tenant not found: ${subscription.tenantId}`);
      }
      
      // Create or update dunning record
      if (!subscription.dunning) {
        subscription.dunning = {
          status: 'active',
          attempts: [],
          startedAt: new Date(),
          nextRetryAt: this.calculateNextRetryDate(0),
          remainingRetries: this.config.maxRetries
        };
      }
      
      // Add failed attempt
      subscription.dunning.attempts.push({
        date: new Date(),
        paymentIntentId,
        errorMessage,
        success: false
      });
      
      // Update dunning status
      subscription.dunning.lastAttemptAt = new Date();
      subscription.dunning.remainingRetries = Math.max(0, subscription.dunning.remainingRetries - 1);
      
      // Check if we have retries remaining
      if (subscription.dunning.remainingRetries > 0) {
        // Schedule next retry
        const attemptNumber = this.config.maxRetries - subscription.dunning.remainingRetries;
        subscription.dunning.nextRetryAt = this.calculateNextRetryDate(attemptNumber);
        subscription.dunning.status = 'scheduled';
      } else {
        // No more retries, set grace period before cancellation
        if (this.config.autoCancel) {
          subscription.dunning.status = 'grace_period';
          subscription.dunning.gracePeriodEndsAt = this.calculateGracePeriodEnd();
        } else {
          subscription.dunning.status = 'failed';
        }
      }
      
      // Update subscription status
      subscription.status = 'past_due';
      
      // Save subscription
      await subscription.save();
      
      // Send notification
      if (this.config.sendNotifications) {
        await this.sendFailedPaymentNotification(subscription, tenant, errorMessage);
      }
      
      return subscription.dunning;
    } catch (error) {
      logger.error(`Error processing failed payment for dunning: ${error.message}`, { error });
      throw error;
    }
  }
  
  /**
   * Retry a failed payment
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<Object>} - Retry result
   */
  async retryPayment(subscriptionId) {
    try {
      // Get subscription
      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        throw new Error(`Subscription not found: ${subscriptionId}`);
      }
      
      // Check if dunning is active
      if (!subscription.dunning || !['active', 'scheduled'].includes(subscription.dunning.status)) {
        throw new Error(`Subscription is not in dunning or not scheduled for retry: ${subscriptionId}`);
      }
      
      // Get tenant
      const tenant = await Tenant.findById(subscription.tenantId);
      if (!tenant) {
        throw new Error(`Tenant not found: ${subscription.tenantId}`);
      }
      
      // Check if tenant has a default payment method
      const defaultPaymentMethod = tenant.paymentMethods?.find(pm => pm.isDefault);
      if (!defaultPaymentMethod) {
        throw new Error('No default payment method found');
      }
      
      // Create new payment intent
      const paymentIntent = await paymentService.createPaymentIntent(subscriptionId, {
        paymentMethod: defaultPaymentMethod.paymentMethodId,
        confirmPayment: true
      });
      
      // Record attempt
      subscription.dunning.attempts.push({
        date: new Date(),
        paymentIntentId: paymentIntent.id,
        success: paymentIntent.status === 'succeeded'
      });
      
      subscription.dunning.lastAttemptAt = new Date();
      
      // Check if payment succeeded
      if (paymentIntent.status === 'succeeded') {
        // Payment succeeded, reset dunning
        subscription.dunning.status = 'recovered';
        subscription.status = 'active';
        
        // Send recovery notification
        if (this.config.sendNotifications) {
          await this.sendPaymentRecoveredNotification(subscription, tenant);
        }
      } else {
        // Payment failed again, update dunning status
        subscription.dunning.remainingRetries = Math.max(0, subscription.dunning.remainingRetries - 1);
        
        // Check if we have retries remaining
        if (subscription.dunning.remainingRetries > 0) {
          // Schedule next retry
          const attemptNumber = this.config.maxRetries - subscription.dunning.remainingRetries;
          subscription.dunning.nextRetryAt = this.calculateNextRetryDate(attemptNumber);
          subscription.dunning.status = 'scheduled';
        } else {
          // No more retries, set grace period before cancellation
          if (this.config.autoCancel) {
            subscription.dunning.status = 'grace_period';
            subscription.dunning.gracePeriodEndsAt = this.calculateGracePeriodEnd();
          } else {
            subscription.dunning.status = 'failed';
          }
        }
      }
      
      // Save subscription
      await subscription.save();
      
      return {
        success: paymentIntent.status === 'succeeded',
        paymentIntent: paymentIntent.id,
        dunningStatus: subscription.dunning.status,
        subscriptionStatus: subscription.status,
        nextRetryAt: subscription.dunning.nextRetryAt
      };
    } catch (error) {
      logger.error(`Error retrying payment: ${error.message}`, { error });
      throw error;
    }
  }
  
  /**
   * Process subscriptions that need dunning action
   * @returns {Promise<Object>} - Processing results
   */
  async processDunningQueue() {
    try {
      const now = new Date();
      const results = {
        processed: 0,
        retried: 0,
        recovered: 0,
        failed: 0,
        canceled: 0,
        errors: 0
      };
      
      // Find subscriptions scheduled for retry
      const scheduledSubscriptions = await Subscription.find({
        'dunning.status': 'scheduled',
        'dunning.nextRetryAt': { $lte: now }
      });
      
      // Process scheduled retries
      for (const subscription of scheduledSubscriptions) {
        try {
          results.processed++;
          
          // Retry payment
          const retryResult = await this.retryPayment(subscription._id);
          results.retried++;
          
          if (retryResult.success) {
            results.recovered++;
          } else {
            results.failed++;
          }
        } catch (error) {
          logger.error(`Error processing dunning for subscription ${subscription._id}: ${error.message}`, { error });
          results.errors++;
        }
      }
      
      // Find subscriptions in grace period that need cancellation
      const graceEndedSubscriptions = await Subscription.find({
        'dunning.status': 'grace_period',
        'dunning.gracePeriodEndsAt': { $lte: now }
      });
      
      // Process cancellations
      for (const subscription of graceEndedSubscriptions) {
        try {
          results.processed++;
          
          // Cancel subscription
          subscription.status = 'canceled';
          subscription.dunning.status = 'canceled';
          subscription.canceledAt = now;
          
          // Save subscription
          await subscription.save();
          
          // Get tenant
          const tenant = await Tenant.findById(subscription.tenantId);
          
          // Send cancellation notification
          if (tenant && this.config.sendNotifications) {
            await this.sendSubscriptionCanceledNotification(subscription, tenant);
          }
          
          results.canceled++;
        } catch (error) {
          logger.error(`Error canceling subscription ${subscription._id}: ${error.message}`, { error });
          results.errors++;
        }
      }
      
      return results;
    } catch (error) {
      logger.error(`Error processing dunning queue: ${error.message}`, { error });
      throw error;
    }
  }
  
  /**
   * Calculate next retry date based on retry schedule
   * @param {number} attemptNumber - Current attempt number (0-based)
   * @returns {Date} - Next retry date
   */
  calculateNextRetryDate(attemptNumber) {
    const now = new Date();
    const retryDays = this.config.retrySchedule[attemptNumber] || this.config.retrySchedule[this.config.retrySchedule.length - 1];
    
    // Add days to current date
    now.setDate(now.getDate() + retryDays);
    
    return now;
  }
  
  /**
   * Calculate grace period end date
   * @returns {Date} - Grace period end date
   */
  calculateGracePeriodEnd() {
    const now = new Date();
    
    // Add grace period days to current date
    now.setDate(now.getDate() + this.config.gracePeriod);
    
    return now;
  }
  
  /**
   * Send failed payment notification
   * @param {Object} subscription - Subscription object
   * @param {Object} tenant - Tenant object
   * @param {string} errorMessage - Error message
   * @returns {Promise<void>}
   */
  async sendFailedPaymentNotification(subscription, tenant, errorMessage) {
    try {
      const attemptNumber = this.config.maxRetries - subscription.dunning.remainingRetries;
      const nextRetryDate = subscription.dunning.nextRetryAt;
      
      // Format retry date
      const formattedRetryDate = nextRetryDate ? 
        nextRetryDate.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }) : 'N/A';
      
      // Send email notification
      await emailService.sendEmail({
        to: tenant.contactDetails.email,
        subject: `Payment Failed for Your ${subscription.plan.name} Subscription`,
        template: 'payment-failed',
        data: {
          companyName: tenant.organizationDetails.companyName,
          planName: subscription.plan.name,
          amount: `${subscription.plan.currency?.toUpperCase() || 'USD'} ${subscription.totalAmount || subscription.plan.price}`,
          errorMessage: errorMessage || 'Your payment could not be processed',
          attemptNumber: attemptNumber,
          maxAttempts: this.config.maxRetries,
          nextRetryDate: formattedRetryDate,
          updatePaymentUrl: `${config.frontendUrl}/billing/payment-methods`
        }
      });
    } catch (error) {
      logger.error(`Error sending failed payment notification: ${error.message}`, { error });
      // Don't throw error to prevent blocking the dunning process
    }
  }
  
  /**
   * Send payment recovered notification
   * @param {Object} subscription - Subscription object
   * @param {Object} tenant - Tenant object
   * @returns {Promise<void>}
   */
  async sendPaymentRecoveredNotification(subscription, tenant) {
    try {
      // Send email notification
      await emailService.sendEmail({
        to: tenant.contactDetails.email,
        subject: `Payment Recovered for Your ${subscription.plan.name} Subscription`,
        template: 'payment-recovered',
        data: {
          companyName: tenant.organizationDetails.companyName,
          planName: subscription.plan.name,
          amount: `${subscription.plan.currency?.toUpperCase() || 'USD'} ${subscription.totalAmount || subscription.plan.price}`,
          subscriptionUrl: `${config.frontendUrl}/billing/subscriptions`
        }
      });
    } catch (error) {
      logger.error(`Error sending payment recovered notification: ${error.message}`, { error });
      // Don't throw error to prevent blocking the dunning process
    }
  }
  
  /**
   * Send subscription canceled notification
   * @param {Object} subscription - Subscription object
   * @param {Object} tenant - Tenant object
   * @returns {Promise<void>}
   */
  async sendSubscriptionCanceledNotification(subscription, tenant) {
    try {
      // Send email notification
      await emailService.sendEmail({
        to: tenant.contactDetails.email,
        subject: `Your ${subscription.plan.name} Subscription Has Been Canceled`,
        template: 'subscription-canceled',
        data: {
          companyName: tenant.organizationDetails.companyName,
          planName: subscription.plan.name,
          canceledDate: new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          reactivateUrl: `${config.frontendUrl}/billing/plans`
        }
      });
    } catch (error) {
      logger.error(`Error sending subscription canceled notification: ${error.message}`, { error });
      // Don't throw error to prevent blocking the dunning process
    }
  }
  
  /**
   * Get dunning statistics
   * @returns {Promise<Object>} - Dunning statistics
   */
  async getDunningStats() {
    try {
      // Get counts by status
      const [
        activeCount,
        scheduledCount,
        gracePeriodCount,
        recoveredCount,
        failedCount,
        canceledCount
      ] = await Promise.all([
        Subscription.countDocuments({ 'dunning.status': 'active' }),
        Subscription.countDocuments({ 'dunning.status': 'scheduled' }),
        Subscription.countDocuments({ 'dunning.status': 'grace_period' }),
        Subscription.countDocuments({ 'dunning.status': 'recovered' }),
        Subscription.countDocuments({ 'dunning.status': 'failed' }),
        Subscription.countDocuments({ 'dunning.status': 'canceled' })
      ]);
      
      // Calculate recovery rate
      const totalAttempted = recoveredCount + failedCount + canceledCount;
      const recoveryRate = totalAttempted > 0 ? (recoveredCount / totalAttempted) * 100 : 0;
      
      return {
        active: activeCount,
        scheduled: scheduledCount,
        gracePeriod: gracePeriodCount,
        recovered: recoveredCount,
        failed: failedCount,
        canceled: canceledCount,
        total: activeCount + scheduledCount + gracePeriodCount + recoveredCount + failedCount + canceledCount,
        recoveryRate: Math.round(recoveryRate * 100) / 100 // Round to 2 decimal places
      };
    } catch (error) {
      logger.error(`Error getting dunning statistics: ${error.message}`, { error });
      throw error;
    }
  }
}

module.exports = new DunningService();
