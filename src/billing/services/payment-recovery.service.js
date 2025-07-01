/**
 * Payment Recovery Service
 * 
 * Handles payment recovery flows for failed payments:
 * - Retry scheduling with exponential backoff
 * - Customer communication for payment updates
 * - Grace period management
 * - Recovery tracking and analytics
 */

const stripe = require('../config/stripe');
const Subscription = require('../models/subscription.model');
const User = require('../../auth/models/user.model');
const PaymentAttempt = require('../models/payment-attempt.model');
const logger = require('../../utils/logger');
const emailService = require('../../notifications/services/email.service');
const paymentErrorHandler = require('../utils/payment-error-handler');
const analyticsService = require('../../analytics/services/analytics.service');

/**
 * Retry schedule configuration (in hours)
 * Follows an exponential backoff pattern
 */
const RETRY_SCHEDULE = [1, 24, 72, 168]; // 1 hour, 1 day, 3 days, 7 days

/**
 * Grace period duration in days
 */
const GRACE_PERIOD_DAYS = 7;

/**
 * Schedule payment retry for a failed payment
 * @param {string} subscriptionId - MongoDB ID of the subscription
 * @param {string} invoiceId - Stripe invoice ID
 * @param {Object} paymentError - Payment error details
 * @returns {Promise<Object>} - Recovery attempt details
 */
exports.scheduleRetry = async (subscriptionId, invoiceId, paymentError) => {
  try {
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      throw new Error(`Subscription not found: ${subscriptionId}`);
    }
    
    // Find existing payment attempts for this invoice
    const existingAttempts = await PaymentAttempt.find({ 
      subscriptionId, 
      invoiceId 
    }).sort({ attemptNumber: -1 });
    
    // Determine next attempt number
    const attemptNumber = existingAttempts.length > 0 
      ? existingAttempts[0].attemptNumber + 1 
      : 1;
    
    // If we've exceeded retry attempts, mark subscription for cancellation
    if (attemptNumber > RETRY_SCHEDULE.length) {
      logger.info(`Maximum retry attempts (${RETRY_SCHEDULE.length}) reached for subscription ${subscriptionId}`);
      
      // Set grace period end date
      const gracePeriodEnd = new Date();
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + GRACE_PERIOD_DAYS);
      
      // Update subscription status
      subscription.status = 'past_due';
      subscription.gracePeriodEnd = gracePeriodEnd;
      await subscription.save();
      
      // Send final notice email
      const user = await User.findById(subscription.userId);
      if (user) {
        await emailService.sendPaymentFinalNoticeEmail(
          user.email,
          {
            planName: subscription.planName,
            gracePeriodEnd: gracePeriodEnd,
            paymentUpdateUrl: `${process.env.FRONTEND_URL}/billing/payment-methods`
          }
        );
      }
      
      // Track event
      analyticsService.trackEvent('payment_recovery_final_notice', {
        userId: subscription.userId,
        subscriptionId: subscription._id,
        planName: subscription.planName,
        gracePeriodEnd: gracePeriodEnd,
        totalAttempts: attemptNumber - 1
      });
      
      return {
        subscriptionId,
        invoiceId,
        status: 'final_notice',
        gracePeriodEnd
      };
    }
    
    // Calculate next retry time based on retry schedule
    const retryHours = RETRY_SCHEDULE[attemptNumber - 1];
    const retryDate = new Date();
    retryDate.setHours(retryDate.getHours() + retryHours);
    
    // Create payment attempt record
    const paymentAttempt = new PaymentAttempt({
      subscriptionId,
      userId: subscription.userId,
      invoiceId,
      attemptNumber,
      scheduledAt: retryDate,
      status: 'scheduled',
      errorDetails: paymentError
    });
    
    await paymentAttempt.save();
    
    // Send notification email
    const user = await User.findById(subscription.userId);
    if (user) {
      await emailService.sendPaymentRetryEmail(
        user.email,
        {
          planName: subscription.planName,
          retryDate: retryDate,
          attemptNumber: attemptNumber,
          maxAttempts: RETRY_SCHEDULE.length,
          paymentUpdateUrl: `${process.env.FRONTEND_URL}/billing/payment-methods`
        }
      );
    }
    
    // Track event
    analyticsService.trackEvent('payment_recovery_scheduled', {
      userId: subscription.userId,
      subscriptionId: subscription._id,
      planName: subscription.planName,
      attemptNumber: attemptNumber,
      retryDate: retryDate
    });
    
    logger.info(`Scheduled payment retry #${attemptNumber} for subscription ${subscriptionId} at ${retryDate}`);
    
    return {
      subscriptionId,
      invoiceId,
      attemptNumber,
      retryDate,
      status: 'scheduled'
    };
  } catch (error) {
    logger.error(`Error scheduling payment retry: ${error.message}`);
    throw error;
  }
};

/**
 * Process pending payment retries that are due
 * @returns {Promise<Array>} - List of processed retries
 */
exports.processScheduledRetries = async () => {
  try {
    const now = new Date();
    
    // Find payment attempts scheduled for now or earlier
    const dueAttempts = await PaymentAttempt.find({
      status: 'scheduled',
      scheduledAt: { $lte: now }
    });
    
    const results = [];
    
    for (const attempt of dueAttempts) {
      try {
        // Get subscription
        const subscription = await Subscription.findById(attempt.subscriptionId);
        if (!subscription) {
          logger.warn(`Subscription not found for retry attempt: ${attempt._id}`);
          continue;
        }
        
        // Update attempt status
        attempt.status = 'processing';
        attempt.processedAt = now;
        await attempt.save();
        
        // Retry payment via Stripe
        const invoice = await stripe.invoices.pay(attempt.invoiceId, {
          expand: ['payment_intent']
        });
        
        // Payment succeeded
        if (invoice.status === 'paid') {
          attempt.status = 'succeeded';
          await attempt.save();
          
          // Update subscription status if needed
          if (subscription.status === 'past_due') {
            subscription.status = 'active';
            subscription.gracePeriodEnd = null;
            await subscription.save();
          }
          
          // Send success email
          const user = await User.findById(subscription.userId);
          if (user) {
            await emailService.sendPaymentRecoveredEmail(
              user.email,
              {
                planName: subscription.planName,
                amount: invoice.amount_paid / 100,
                currency: invoice.currency,
                invoiceUrl: invoice.hosted_invoice_url
              }
            );
          }
          
          // Track event
          analyticsService.trackEvent('payment_recovery_succeeded', {
            userId: subscription.userId,
            subscriptionId: subscription._id,
            planName: subscription.planName,
            attemptNumber: attempt.attemptNumber,
            invoiceId: invoice.id,
            amount: invoice.amount_paid / 100
          });
          
          results.push({
            attemptId: attempt._id,
            subscriptionId: attempt.subscriptionId,
            status: 'succeeded',
            invoiceId: invoice.id
          });
          
          logger.info(`Payment retry succeeded for subscription ${attempt.subscriptionId}`);
        }
      } catch (error) {
        // Payment failed again
        attempt.status = 'failed';
        attempt.errorDetails = paymentErrorHandler.handleStripeError(
          error, 
          'retry_payment',
          { subscriptionId: attempt.subscriptionId }
        );
        await attempt.save();
        
        // Schedule next retry
        try {
          await exports.scheduleRetry(
            attempt.subscriptionId,
            attempt.invoiceId,
            attempt.errorDetails
          );
        } catch (retryError) {
          logger.error(`Error scheduling next retry: ${retryError.message}`);
        }
        
        // Track event
        analyticsService.trackEvent('payment_recovery_failed', {
          userId: attempt.userId,
          subscriptionId: attempt.subscriptionId,
          attemptNumber: attempt.attemptNumber,
          errorType: attempt.errorDetails.error.type,
          errorCode: attempt.errorDetails.error.code
        });
        
        results.push({
          attemptId: attempt._id,
          subscriptionId: attempt.subscriptionId,
          status: 'failed',
          error: attempt.errorDetails.error.code
        });
        
        logger.info(`Payment retry failed for subscription ${attempt.subscriptionId}`);
      }
    }
    
    return results;
  } catch (error) {
    logger.error(`Error processing scheduled retries: ${error.message}`);
    throw error;
  }
};

/**
 * Handle a successful payment recovery
 * @param {string} subscriptionId - MongoDB ID of the subscription
 * @param {string} invoiceId - Stripe invoice ID
 * @returns {Promise<Object>} - Updated subscription
 */
exports.handleRecoveredPayment = async (subscriptionId, invoiceId) => {
  try {
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      throw new Error(`Subscription not found: ${subscriptionId}`);
    }
    
    // Update all pending attempts for this invoice
    await PaymentAttempt.updateMany(
      { 
        subscriptionId, 
        invoiceId, 
        status: 'scheduled' 
      },
      { 
        status: 'cancelled',
        updatedAt: new Date()
      }
    );
    
    // Update subscription status if needed
    if (subscription.status === 'past_due') {
      subscription.status = 'active';
      subscription.gracePeriodEnd = null;
      await subscription.save();
      
      // Send recovery email
      const user = await User.findById(subscription.userId);
      if (user) {
        await emailService.sendSubscriptionReactivatedEmail(
          user.email,
          {
            planName: subscription.planName,
            nextBillingDate: subscription.currentPeriodEnd
          }
        );
      }
      
      // Track event
      analyticsService.trackEvent('subscription_reactivated', {
        userId: subscription.userId,
        subscriptionId: subscription._id,
        planName: subscription.planName
      });
      
      logger.info(`Subscription ${subscriptionId} reactivated after payment recovery`);
    }
    
    return subscription;
  } catch (error) {
    logger.error(`Error handling recovered payment: ${error.message}`);
    throw error;
  }
};

/**
 * Get recovery statistics for a subscription
 * @param {string} subscriptionId - MongoDB ID of the subscription
 * @returns {Promise<Object>} - Recovery statistics
 */
exports.getRecoveryStats = async (subscriptionId) => {
  try {
    const attempts = await PaymentAttempt.find({ subscriptionId });
    
    // Group attempts by invoice
    const invoiceAttempts = {};
    attempts.forEach(attempt => {
      if (!invoiceAttempts[attempt.invoiceId]) {
        invoiceAttempts[attempt.invoiceId] = [];
      }
      invoiceAttempts[attempt.invoiceId].push(attempt);
    });
    
    // Calculate statistics
    const totalAttempts = attempts.length;
    const successfulAttempts = attempts.filter(a => a.status === 'succeeded').length;
    const failedAttempts = attempts.filter(a => a.status === 'failed').length;
    const pendingAttempts = attempts.filter(a => a.status === 'scheduled').length;
    const recoveryRate = totalAttempts > 0 ? (successfulAttempts / totalAttempts) * 100 : 0;
    
    // Get most common error types
    const errorTypes = {};
    attempts.filter(a => a.status === 'failed' && a.errorDetails?.error?.code)
      .forEach(attempt => {
        const errorCode = attempt.errorDetails.error.code;
        errorTypes[errorCode] = (errorTypes[errorCode] || 0) + 1;
      });
    
    const mostCommonErrors = Object.entries(errorTypes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([code, count]) => ({ code, count }));
    
    return {
      subscriptionId,
      totalAttempts,
      successfulAttempts,
      failedAttempts,
      pendingAttempts,
      recoveryRate: parseFloat(recoveryRate.toFixed(2)),
      invoiceCount: Object.keys(invoiceAttempts).length,
      mostCommonErrors,
      lastAttempt: attempts.length > 0 
        ? attempts.sort((a, b) => b.createdAt - a.createdAt)[0].createdAt 
        : null
    };
  } catch (error) {
    logger.error(`Error getting recovery stats: ${error.message}`);
    throw error;
  }
};
