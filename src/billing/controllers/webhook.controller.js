/**
 * Stripe Webhook Controller
 * 
 * Handles incoming webhook events from Stripe for subscription and payment processing
 * Implements handlers for critical events in the payment and subscription lifecycle
 */

const stripe = require('../config/stripe');
const Subscription = require('../models/subscription.model');
const PaymentMethod = require('../models/payment-method.model');
const User = require('../../auth/models/user.model');
const logger = require('../../utils/logger');
const emailService = require('../../notifications/services/email.service');

// Webhook signing secret from environment variables
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Process Stripe webhook events
 * Verifies webhook signature and routes to appropriate handler
 */
exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  let event;
  
  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.rawBody, // Raw request body (must be available via middleware)
      sig,
      WEBHOOK_SECRET
    );
    
    logger.info(`Webhook received: ${event.type}`);
    
    // Route event to appropriate handler
    switch (event.type) {
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      case 'payment_method.attached':
        await handlePaymentMethodAttached(event.data.object);
        break;
      case 'payment_method.detached':
        await handlePaymentMethodDetached(event.data.object);
        break;
      default:
        logger.info(`Unhandled webhook event: ${event.type}`);
    }
    
    return res.status(200).json({ received: true });
  } catch (err) {
    logger.error(`Webhook error: ${err.message}`);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }
};

/**
 * Handle successful payment of an invoice
 * Updates subscription status and sends confirmation email
 */
async function handleInvoicePaymentSucceeded(invoice) {
  try {
    if (invoice.subscription) {
      // Find subscription in our database
      const subscription = await Subscription.findOne({ 
        stripeSubscriptionId: invoice.subscription 
      });
      
      if (!subscription) {
        logger.error(`Subscription not found for invoice: ${invoice.id}`);
        return;
      }
      
      // Update subscription with new period end
      subscription.currentPeriodEnd = new Date(invoice.lines.data[0].period.end * 1000);
      subscription.status = 'active';
      subscription.lastInvoiceId = invoice.id;
      subscription.lastPaymentDate = new Date();
      
      await subscription.save();
      
      // Send confirmation email
      const user = await User.findById(subscription.userId);
      if (user) {
        await emailService.sendPaymentSuccessEmail(
          user.email,
          {
            amount: invoice.amount_paid / 100, // Convert from cents
            currency: invoice.currency,
            date: new Date(),
            invoiceUrl: invoice.hosted_invoice_url
          }
        );
      }
      
      logger.info(`Payment succeeded for subscription: ${subscription._id}`);
    }
  } catch (error) {
    logger.error(`Error handling invoice.payment_succeeded: ${error.message}`);
  }
}

/**
 * Handle failed payment of an invoice
 * Updates subscription status and sends notification email
 */
async function handleInvoicePaymentFailed(invoice) {
  try {
    if (invoice.subscription) {
      // Find subscription in our database
      const subscription = await Subscription.findOne({ 
        stripeSubscriptionId: invoice.subscription 
      });
      
      if (!subscription) {
        logger.error(`Subscription not found for invoice: ${invoice.id}`);
        return;
      }
      
      // Update subscription status
      subscription.status = 'past_due';
      subscription.lastFailedPaymentDate = new Date();
      
      // If this is the first payment failure, set grace period
      if (!subscription.gracePeriodEnd) {
        const GRACE_PERIOD_DAYS = 7;
        const gracePeriodEnd = new Date();
        gracePeriodEnd.setDate(gracePeriodEnd.getDate() + GRACE_PERIOD_DAYS);
        subscription.gracePeriodEnd = gracePeriodEnd;
      }
      
      await subscription.save();
      
      // Send notification email
      const user = await User.findById(subscription.userId);
      if (user) {
        await emailService.sendPaymentFailedEmail(
          user.email,
          {
            amount: invoice.amount_due / 100, // Convert from cents
            currency: invoice.currency,
            date: new Date(),
            updatePaymentUrl: `${process.env.FRONTEND_URL}/billing/payment-methods`,
            gracePeriodEnd: subscription.gracePeriodEnd
          }
        );
      }
      
      logger.info(`Payment failed for subscription: ${subscription._id}`);
    }
  } catch (error) {
    logger.error(`Error handling invoice.payment_failed: ${error.message}`);
  }
}

/**
 * Handle subscription updates from Stripe
 * Updates local subscription record with latest status and details
 */
async function handleSubscriptionUpdated(subscription) {
  try {
    // Find subscription in our database
    const localSubscription = await Subscription.findOne({ 
      stripeSubscriptionId: subscription.id 
    });
    
    if (!localSubscription) {
      logger.error(`Subscription not found: ${subscription.id}`);
      return;
    }
    
    // Update subscription details
    localSubscription.status = subscription.status;
    localSubscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    
    if (subscription.canceled_at) {
      localSubscription.canceledAt = new Date(subscription.canceled_at * 1000);
    }
    
    // Handle plan changes
    if (subscription.items && subscription.items.data.length > 0) {
      const item = subscription.items.data[0];
      localSubscription.stripePriceId = item.price.id;
      
      // Update plan details if needed
      if (localSubscription.planId) {
        // Here you would update the plan details if they've changed
        // This depends on your plan model structure
      }
    }
    
    await localSubscription.save();
    
    logger.info(`Subscription updated: ${localSubscription._id}`);
  } catch (error) {
    logger.error(`Error handling customer.subscription.updated: ${error.message}`);
  }
}

/**
 * Handle subscription deletion from Stripe
 * Updates local subscription record to canceled status
 */
async function handleSubscriptionDeleted(subscription) {
  try {
    // Find subscription in our database
    const localSubscription = await Subscription.findOne({ 
      stripeSubscriptionId: subscription.id 
    });
    
    if (!localSubscription) {
      logger.error(`Subscription not found: ${subscription.id}`);
      return;
    }
    
    // Update subscription status
    localSubscription.status = 'canceled';
    localSubscription.canceledAt = new Date();
    
    await localSubscription.save();
    
    // Send cancellation email
    const user = await User.findById(localSubscription.userId);
    if (user) {
      await emailService.sendSubscriptionCanceledEmail(
        user.email,
        {
          planName: localSubscription.planName,
          endDate: localSubscription.currentPeriodEnd
        }
      );
    }
    
    logger.info(`Subscription canceled: ${localSubscription._id}`);
  } catch (error) {
    logger.error(`Error handling customer.subscription.deleted: ${error.message}`);
  }
}

/**
 * Handle payment method attachment in Stripe
 * Updates or creates local payment method record
 */
async function handlePaymentMethodAttached(paymentMethod) {
  try {
    // Find user by Stripe customer ID
    const user = await User.findOne({ stripeCustomerId: paymentMethod.customer });
    
    if (!user) {
      logger.error(`User not found for customer: ${paymentMethod.customer}`);
      return;
    }
    
    // Check if payment method already exists
    let localPaymentMethod = await PaymentMethod.findOne({
      stripePaymentMethodId: paymentMethod.id
    });
    
    if (!localPaymentMethod) {
      // Create new payment method record
      localPaymentMethod = new PaymentMethod({
        userId: user._id,
        stripePaymentMethodId: paymentMethod.id,
        type: paymentMethod.type,
        last4: paymentMethod.card ? paymentMethod.card.last4 : null,
        brand: paymentMethod.card ? paymentMethod.card.brand : null,
        expiryMonth: paymentMethod.card ? paymentMethod.card.exp_month : null,
        expiryYear: paymentMethod.card ? paymentMethod.card.exp_year : null,
        isDefault: false // Will be set as default if it's the only one
      });
      
      // Check if this is the user's first payment method
      const paymentMethodCount = await PaymentMethod.countDocuments({ userId: user._id });
      if (paymentMethodCount === 0) {
        localPaymentMethod.isDefault = true;
      }
      
      await localPaymentMethod.save();
      
      logger.info(`Payment method added: ${localPaymentMethod._id}`);
    }
  } catch (error) {
    logger.error(`Error handling payment_method.attached: ${error.message}`);
  }
}

/**
 * Handle payment method detachment in Stripe
 * Updates local payment method record to inactive status
 */
async function handlePaymentMethodDetached(paymentMethod) {
  try {
    // Find payment method in our database
    const localPaymentMethod = await PaymentMethod.findOne({
      stripePaymentMethodId: paymentMethod.id
    });
    
    if (!localPaymentMethod) {
      logger.error(`Payment method not found: ${paymentMethod.id}`);
      return;
    }
    
    // If this was the default payment method, we need to find a new default
    if (localPaymentMethod.isDefault) {
      // Find another payment method for this user
      const alternativePaymentMethod = await PaymentMethod.findOne({
        userId: localPaymentMethod.userId,
        _id: { $ne: localPaymentMethod._id },
        isActive: true
      });
      
      if (alternativePaymentMethod) {
        alternativePaymentMethod.isDefault = true;
        await alternativePaymentMethod.save();
      }
    }
    
    // Mark payment method as inactive
    localPaymentMethod.isActive = false;
    await localPaymentMethod.save();
    
    logger.info(`Payment method removed: ${localPaymentMethod._id}`);
  } catch (error) {
    logger.error(`Error handling payment_method.detached: ${error.message}`);
  }
}
