/**
 * Subscription Lifecycle Service
 * 
 * Handles the complete lifecycle of subscriptions including:
 * - Renewal processing
 * - Cancellation with end-of-period access
 * - Upgrade/downgrade with prorated billing
 * - Grace period handling for failed payments
 * - Subscription pause/resume functionality
 */

const stripe = require('../config/stripe');
const Subscription = require('../models/subscription.model');
const User = require('../../auth/models/user.model');
const Plan = require('../models/plan.model');
const logger = require('../../utils/logger');
const emailService = require('../../notifications/services/email.service');

/**
 * Process subscription renewal
 * @param {string} subscriptionId - MongoDB ID of the subscription
 * @returns {Promise<Object>} - Updated subscription object
 */
exports.processRenewal = async (subscriptionId) => {
  try {
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      throw new Error(`Subscription not found: ${subscriptionId}`);
    }
    
    // Check if subscription is active and due for renewal
    if (subscription.status !== 'active') {
      logger.info(`Skipping renewal for non-active subscription: ${subscriptionId}`);
      return subscription;
    }
    
    const now = new Date();
    if (subscription.currentPeriodEnd > now) {
      logger.info(`Subscription ${subscriptionId} not yet due for renewal`);
      return subscription;
    }
    
    // Subscription is due for renewal, update via Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId
    );
    
    // If subscription is still active in Stripe, update our records
    if (stripeSubscription.status === 'active') {
      subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
      subscription.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
      await subscription.save();
      
      logger.info(`Subscription ${subscriptionId} renewed successfully`);
      
      // Send renewal confirmation email
      const user = await User.findById(subscription.userId);
      if (user) {
        await emailService.sendSubscriptionRenewalEmail(
          user.email,
          {
            planName: subscription.planName,
            nextBillingDate: subscription.currentPeriodEnd,
            amount: stripeSubscription.items.data[0].price.unit_amount / 100,
            currency: stripeSubscription.currency
          }
        );
      }
    } else {
      // Subscription is no longer active in Stripe
      subscription.status = stripeSubscription.status;
      await subscription.save();
      
      logger.info(`Subscription ${subscriptionId} status updated to: ${stripeSubscription.status}`);
    }
    
    return subscription;
  } catch (error) {
    logger.error(`Error processing subscription renewal: ${error.message}`);
    throw error;
  }
};

/**
 * Cancel subscription with end-of-period access
 * @param {string} subscriptionId - MongoDB ID of the subscription
 * @param {boolean} immediate - Whether to cancel immediately or at period end
 * @returns {Promise<Object>} - Updated subscription object
 */
exports.cancelSubscription = async (subscriptionId, immediate = false) => {
  try {
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      throw new Error(`Subscription not found: ${subscriptionId}`);
    }
    
    // Cancel in Stripe
    const updatedStripeSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        cancel_at_period_end: !immediate
      }
    );
    
    if (immediate) {
      // Cancel immediately
      await stripe.subscriptions.del(subscription.stripeSubscriptionId);
      
      subscription.status = 'canceled';
      subscription.canceledAt = new Date();
    } else {
      // Cancel at period end
      subscription.status = 'active';
      subscription.cancelAtPeriodEnd = true;
    }
    
    await subscription.save();
    
    // Send cancellation email
    const user = await User.findById(subscription.userId);
    if (user) {
      await emailService.sendSubscriptionCanceledEmail(
        user.email,
        {
          planName: subscription.planName,
          endDate: immediate ? new Date() : subscription.currentPeriodEnd,
          immediate: immediate
        }
      );
    }
    
    logger.info(`Subscription ${subscriptionId} canceled: immediate=${immediate}`);
    return subscription;
  } catch (error) {
    logger.error(`Error canceling subscription: ${error.message}`);
    throw error;
  }
};

/**
 * Change subscription plan (upgrade or downgrade)
 * @param {string} subscriptionId - MongoDB ID of the subscription
 * @param {string} newPlanId - MongoDB ID of the new plan
 * @param {boolean} prorate - Whether to prorate charges for the remainder of the billing period
 * @returns {Promise<Object>} - Updated subscription object
 */
exports.changePlan = async (subscriptionId, newPlanId, prorate = true) => {
  try {
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      throw new Error(`Subscription not found: ${subscriptionId}`);
    }
    
    const newPlan = await Plan.findById(newPlanId);
    if (!newPlan) {
      throw new Error(`Plan not found: ${newPlanId}`);
    }
    
    // Update subscription in Stripe
    const updatedStripeSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        items: [{
          id: subscription.stripeSubscriptionItemId, // Assuming this is stored
          price: newPlan.stripePriceId
        }],
        proration_behavior: prorate ? 'create_prorations' : 'none'
      }
    );
    
    // Update local subscription
    subscription.planId = newPlanId;
    subscription.planName = newPlan.name;
    subscription.stripePriceId = newPlan.stripePriceId;
    subscription.currentPeriodEnd = new Date(updatedStripeSubscription.current_period_end * 1000);
    
    // If this was a downgrade and cancellation was pending, remove cancellation flag
    if (subscription.cancelAtPeriodEnd) {
      await stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        { cancel_at_period_end: false }
      );
      subscription.cancelAtPeriodEnd = false;
    }
    
    await subscription.save();
    
    // Send plan change email
    const user = await User.findById(subscription.userId);
    if (user) {
      const isUpgrade = newPlan.price > subscription.price;
      
      await emailService.sendPlanChangedEmail(
        user.email,
        {
          oldPlanName: subscription.planName,
          newPlanName: newPlan.name,
          isUpgrade: isUpgrade,
          effectiveDate: new Date(),
          nextBillingDate: subscription.currentPeriodEnd,
          prorated: prorate
        }
      );
    }
    
    logger.info(`Subscription ${subscriptionId} changed to plan: ${newPlanId}`);
    return subscription;
  } catch (error) {
    logger.error(`Error changing subscription plan: ${error.message}`);
    throw error;
  }
};

/**
 * Handle grace period for failed payments
 * Checks subscriptions with failed payments and handles them based on grace period
 * @returns {Promise<Array>} - List of processed subscriptions
 */
exports.processGracePeriods = async () => {
  try {
    const now = new Date();
    
    // Find subscriptions in past_due status with expired grace periods
    const expiredGraceSubscriptions = await Subscription.find({
      status: 'past_due',
      gracePeriodEnd: { $lt: now }
    });
    
    const results = [];
    
    for (const subscription of expiredGraceSubscriptions) {
      // Grace period expired, cancel subscription
      await stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        { cancel_at_period_end: true }
      );
      
      subscription.status = 'canceled';
      subscription.canceledAt = now;
      await subscription.save();
      
      // Send grace period expired email
      const user = await User.findById(subscription.userId);
      if (user) {
        await emailService.sendGracePeriodExpiredEmail(
          user.email,
          {
            planName: subscription.planName,
            cancelDate: now
          }
        );
      }
      
      results.push({
        subscriptionId: subscription._id,
        action: 'canceled',
        reason: 'grace_period_expired'
      });
      
      logger.info(`Subscription ${subscription._id} canceled due to expired grace period`);
    }
    
    return results;
  } catch (error) {
    logger.error(`Error processing grace periods: ${error.message}`);
    throw error;
  }
};

/**
 * Pause subscription
 * @param {string} subscriptionId - MongoDB ID of the subscription
 * @param {Date} resumeDate - Date to automatically resume the subscription (optional)
 * @returns {Promise<Object>} - Updated subscription object
 */
exports.pauseSubscription = async (subscriptionId, resumeDate = null) => {
  try {
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      throw new Error(`Subscription not found: ${subscriptionId}`);
    }
    
    // Calculate resume timestamp if provided
    let resumeTimestamp = null;
    if (resumeDate) {
      resumeTimestamp = Math.floor(resumeDate.getTime() / 1000);
    }
    
    // Pause subscription in Stripe
    const updatedStripeSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        pause_collection: {
          behavior: 'void',
          resumes_at: resumeTimestamp
        }
      }
    );
    
    // Update local subscription
    subscription.status = 'paused';
    subscription.pausedAt = new Date();
    subscription.resumeAt = resumeDate;
    await subscription.save();
    
    // Send pause confirmation email
    const user = await User.findById(subscription.userId);
    if (user) {
      await emailService.sendSubscriptionPausedEmail(
        user.email,
        {
          planName: subscription.planName,
          pauseDate: new Date(),
          resumeDate: resumeDate
        }
      );
    }
    
    logger.info(`Subscription ${subscriptionId} paused, resume date: ${resumeDate}`);
    return subscription;
  } catch (error) {
    logger.error(`Error pausing subscription: ${error.message}`);
    throw error;
  }
};

/**
 * Resume paused subscription
 * @param {string} subscriptionId - MongoDB ID of the subscription
 * @returns {Promise<Object>} - Updated subscription object
 */
exports.resumeSubscription = async (subscriptionId) => {
  try {
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      throw new Error(`Subscription not found: ${subscriptionId}`);
    }
    
    if (subscription.status !== 'paused') {
      throw new Error(`Subscription ${subscriptionId} is not paused`);
    }
    
    // Resume subscription in Stripe
    const updatedStripeSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        pause_collection: null
      }
    );
    
    // Update local subscription
    subscription.status = 'active';
    subscription.resumedAt = new Date();
    subscription.resumeAt = null;
    await subscription.save();
    
    // Send resume confirmation email
    const user = await User.findById(subscription.userId);
    if (user) {
      await emailService.sendSubscriptionResumedEmail(
        user.email,
        {
          planName: subscription.planName,
          resumeDate: new Date(),
          nextBillingDate: new Date(updatedStripeSubscription.current_period_end * 1000)
        }
      );
    }
    
    logger.info(`Subscription ${subscriptionId} resumed`);
    return subscription;
  } catch (error) {
    logger.error(`Error resuming subscription: ${error.message}`);
    throw error;
  }
};
