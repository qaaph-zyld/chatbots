/**
 * Billing Service
 * 
 * Handles subscription management, payment processing, and usage tracking
 */

const Subscription = require('../models/subscription.model');
const mongoose = require('mongoose');
const logger = require('../../utils/logger');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

/**
 * Billing Service for managing subscriptions and payments
 */
class BillingService {
  /**
   * Create a new subscription for a tenant
   * @param {Object} subscriptionData - Subscription data
   * @returns {Promise<Object>} Created subscription
   */
  async createSubscription(subscriptionData) {
    try {
      // Validate tenant exists
      if (!subscriptionData.tenantId) {
        throw new Error('Tenant ID is required');
      }

      // Check if tenant already has an active subscription
      const existingSubscription = await Subscription.findOne({
        tenantId: subscriptionData.tenantId,
        status: { $in: ['active', 'trialing'] }
      });

      if (existingSubscription) {
        throw new Error('Tenant already has an active subscription');
      }

      // Create subscription in database
      const subscription = new Subscription({
        tenantId: subscriptionData.tenantId,
        plan: subscriptionData.plan,
        status: subscriptionData.status || 'active',
        customerId: subscriptionData.customerId,
        paymentMethodId: subscriptionData.paymentMethodId,
        subscriptionId: subscriptionData.subscriptionId,
        currentPeriodStart: subscriptionData.currentPeriodStart || new Date(),
        currentPeriodEnd: subscriptionData.currentPeriodEnd,
        trialStart: subscriptionData.trialStart,
        trialEnd: subscriptionData.trialEnd,
        billingDetails: subscriptionData.billingDetails
      });

      await subscription.save();
      
      logger.info('Subscription created', { 
        tenantId: subscription.tenantId, 
        plan: subscription.plan.name 
      });
      
      return subscription;
    } catch (error) {
      logger.error('Error creating subscription', { error: error.message });
      throw error;
    }
  }

  /**
   * Get subscription by ID
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<Object>} Subscription
   */
  async getSubscription(subscriptionId) {
    try {
      const subscription = await Subscription.findById(subscriptionId);
      
      if (!subscription) {
        throw new Error('Subscription not found');
      }
      
      return subscription;
    } catch (error) {
      logger.error('Error getting subscription', { 
        error: error.message,
        subscriptionId 
      });
      throw error;
    }
  }

  /**
   * Get subscription by tenant ID
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Object>} Subscription
   */
  async getSubscriptionByTenant(tenantId) {
    try {
      const subscription = await Subscription.findOne({ 
        tenantId,
        status: { $in: ['active', 'trialing', 'past_due'] }
      });
      
      if (!subscription) {
        return null;
      }
      
      return subscription;
    } catch (error) {
      logger.error('Error getting subscription by tenant', { 
        error: error.message,
        tenantId 
      });
      throw error;
    }
  }

  /**
   * Update subscription
   * @param {string} subscriptionId - Subscription ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated subscription
   */
  async updateSubscription(subscriptionId, updateData) {
    try {
      const subscription = await Subscription.findById(subscriptionId);
      
      if (!subscription) {
        throw new Error('Subscription not found');
      }
      
      // Update allowed fields
      if (updateData.plan) subscription.plan = updateData.plan;
      if (updateData.status) subscription.status = updateData.status;
      if (updateData.paymentMethodId) subscription.paymentMethodId = updateData.paymentMethodId;
      if (updateData.currentPeriodStart) subscription.currentPeriodStart = updateData.currentPeriodStart;
      if (updateData.currentPeriodEnd) subscription.currentPeriodEnd = updateData.currentPeriodEnd;
      if (updateData.cancelAtPeriodEnd !== undefined) subscription.cancelAtPeriodEnd = updateData.cancelAtPeriodEnd;
      if (updateData.billingDetails) subscription.billingDetails = updateData.billingDetails;
      
      await subscription.save();
      
      logger.info('Subscription updated', { 
        subscriptionId,
        status: subscription.status 
      });
      
      return subscription;
    } catch (error) {
      logger.error('Error updating subscription', { 
        error: error.message,
        subscriptionId 
      });
      throw error;
    }
  }

  /**
   * Cancel subscription
   * @param {string} subscriptionId - Subscription ID
   * @param {boolean} cancelAtPeriodEnd - Whether to cancel at period end
   * @returns {Promise<Object>} Canceled subscription
   */
  async cancelSubscription(subscriptionId, cancelAtPeriodEnd = true) {
    try {
      const subscription = await Subscription.findById(subscriptionId);
      
      if (!subscription) {
        throw new Error('Subscription not found');
      }
      
      if (cancelAtPeriodEnd) {
        subscription.cancelAtPeriodEnd = true;
      } else {
        subscription.status = 'canceled';
      }
      
      await subscription.save();
      
      // If subscription has a Stripe ID, cancel it there too
      if (subscription.subscriptionId && process.env.STRIPE_SECRET_KEY) {
        try {
          await stripe.subscriptions.update(subscription.subscriptionId, {
            cancel_at_period_end: cancelAtPeriodEnd
          });
        } catch (stripeError) {
          logger.error('Error canceling Stripe subscription', { 
            error: stripeError.message,
            subscriptionId: subscription.subscriptionId
          });
        }
      }
      
      logger.info('Subscription canceled', { 
        subscriptionId,
        cancelAtPeriodEnd 
      });
      
      return subscription;
    } catch (error) {
      logger.error('Error canceling subscription', { 
        error: error.message,
        subscriptionId 
      });
      throw error;
    }
  }

  /**
   * Track usage for a tenant
   * @param {string} tenantId - Tenant ID
   * @param {string} usageType - Type of usage (conversations, storage, apiCalls)
   * @param {number} amount - Amount to increment
   * @returns {Promise<Object>} Updated subscription
   */
  async trackUsage(tenantId, usageType, amount = 1) {
    try {
      const subscription = await Subscription.findOne({ 
        tenantId,
        status: { $in: ['active', 'trialing', 'past_due'] }
      });
      
      if (!subscription) {
        logger.warn('No active subscription found for usage tracking', { tenantId });
        return null;
      }
      
      // Increment usage
      if (usageType === 'conversations') {
        subscription.usage.conversations += amount;
      } else if (usageType === 'storage') {
        subscription.usage.storage += amount;
      } else if (usageType === 'apiCalls') {
        subscription.usage.apiCalls += amount;
      }
      
      await subscription.save();
      
      // Check if usage exceeds limits
      if (subscription.hasExceededLimits()) {
        logger.warn('Subscription usage exceeds limits', { 
          tenantId,
          usageType,
          currentUsage: subscription.usage[usageType],
          limit: subscription.plan.features.conversationsPerMonth
        });
      }
      
      return subscription;
    } catch (error) {
      logger.error('Error tracking usage', { 
        error: error.message,
        tenantId,
        usageType 
      });
      throw error;
    }
  }

  /**
   * Create a customer in the payment provider
   * @param {Object} customerData - Customer data
   * @returns {Promise<Object>} Created customer
   */
  async createCustomer(customerData) {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        return { id: `mock_customer_${Date.now()}` };
      }
      
      const customer = await stripe.customers.create({
        email: customerData.email,
        name: customerData.name,
        metadata: {
          tenantId: customerData.tenantId
        },
        address: customerData.address
      });
      
      return customer;
    } catch (error) {
      logger.error('Error creating customer', { error: error.message });
      throw error;
    }
  }

  /**
   * Create a payment method in the payment provider
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Created payment method
   */
  async createPaymentMethod(paymentData) {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        return { id: `mock_payment_${Date.now()}` };
      }
      
      const paymentMethod = await stripe.paymentMethods.create({
        type: 'card',
        card: {
          number: paymentData.cardNumber,
          exp_month: paymentData.expMonth,
          exp_year: paymentData.expYear,
          cvc: paymentData.cvc
        },
        billing_details: {
          name: paymentData.name,
          email: paymentData.email,
          address: paymentData.address
        }
      });
      
      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethod.id, {
        customer: paymentData.customerId
      });
      
      return paymentMethod;
    } catch (error) {
      logger.error('Error creating payment method', { error: error.message });
      throw error;
    }
  }

  /**
   * Create a subscription in the payment provider
   * @param {Object} subscriptionData - Subscription data
   * @returns {Promise<Object>} Created subscription
   */
  async createPaymentProviderSubscription(subscriptionData) {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        return { 
          id: `mock_subscription_${Date.now()}`,
          current_period_start: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
        };
      }
      
      // Get or create price
      let price;
      try {
        price = await stripe.prices.retrieve(subscriptionData.priceId);
      } catch (error) {
        // Create price if it doesn't exist
        price = await stripe.prices.create({
          unit_amount: subscriptionData.plan.price * 100, // in cents
          currency: 'usd',
          recurring: {
            interval: subscriptionData.plan.billingCycle === 'annual' ? 'year' : 'month'
          },
          product_data: {
            name: `${subscriptionData.plan.name} Plan`
          }
        });
      }
      
      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: subscriptionData.customerId,
        items: [{ price: price.id }],
        default_payment_method: subscriptionData.paymentMethodId,
        trial_period_days: subscriptionData.trialDays || undefined,
        metadata: {
          tenantId: subscriptionData.tenantId
        }
      });
      
      return subscription;
    } catch (error) {
      logger.error('Error creating payment provider subscription', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate invoice for a subscription
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<Object>} Generated invoice
   */
  async generateInvoice(subscriptionId) {
    try {
      const subscription = await Subscription.findById(subscriptionId);
      
      if (!subscription) {
        throw new Error('Subscription not found');
      }
      
      // Calculate overage charges
      const overageAmount = subscription.calculateOverage();
      
      if (!process.env.STRIPE_SECRET_KEY) {
        // Mock invoice
        const invoiceId = `mock_invoice_${Date.now()}`;
        const invoice = {
          id: invoiceId,
          amount: subscription.plan.price + overageAmount,
          currency: 'usd',
          status: 'draft',
          date: new Date(),
          pdfUrl: `https://example.com/invoices/${invoiceId}.pdf`
        };
        
        // Add to subscription
        subscription.invoices.push(invoice);
        await subscription.save();
        
        return invoice;
      }
      
      // Create invoice in Stripe
      const invoice = await stripe.invoices.create({
        customer: subscription.customerId,
        subscription: subscription.subscriptionId,
        auto_advance: false, // Draft invoice
        metadata: {
          tenantId: subscription.tenantId.toString()
        }
      });
      
      // Add line items for overage charges if any
      if (overageAmount > 0) {
        await stripe.invoiceItems.create({
          customer: subscription.customerId,
          invoice: invoice.id,
          amount: Math.round(overageAmount * 100), // in cents
          currency: 'usd',
          description: `Overage charges for ${subscription.usage.conversations - subscription.plan.features.conversationsPerMonth} conversations`
        });
      }
      
      // Finalize invoice
      const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
      
      // Add to subscription
      subscription.invoices.push({
        invoiceId: finalizedInvoice.id,
        amount: finalizedInvoice.amount_due / 100, // convert from cents
        currency: finalizedInvoice.currency,
        status: finalizedInvoice.status,
        date: new Date(finalizedInvoice.created * 1000),
        pdfUrl: finalizedInvoice.invoice_pdf
      });
      
      await subscription.save();
      
      return finalizedInvoice;
    } catch (error) {
      logger.error('Error generating invoice', { 
        error: error.message,
        subscriptionId 
      });
      throw error;
    }
  }

  /**
   * Get all subscriptions with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Subscriptions with pagination info
   */
  async getAllSubscriptions(options = {}) {
    try {
      const page = options.page || 1;
      const limit = options.limit || 10;
      const skip = (page - 1) * limit;
      
      const query = {};
      if (options.status) query.status = options.status;
      
      const [subscriptions, total] = await Promise.all([
        Subscription.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Subscription.countDocuments(query)
      ]);
      
      return {
        subscriptions,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting all subscriptions', { error: error.message });
      throw error;
    }
  }

  /**
   * Get usage report for a tenant
   * @param {string} tenantId - Tenant ID
   * @param {Object} options - Report options
   * @returns {Promise<Object>} Usage report
   */
  async getUsageReport(tenantId, options = {}) {
    try {
      const subscription = await Subscription.findOne({ tenantId });
      
      if (!subscription) {
        throw new Error('Subscription not found');
      }
      
      // Calculate percentage of limits used
      const conversationsPercentage = subscription.plan.features.conversationsPerMonth > 0 
        ? (subscription.usage.conversations / subscription.plan.features.conversationsPerMonth) * 100
        : 0;
      
      const report = {
        tenantId,
        plan: subscription.plan.name,
        billingPeriod: {
          start: subscription.currentPeriodStart,
          end: subscription.currentPeriodEnd
        },
        usage: {
          conversations: {
            used: subscription.usage.conversations,
            limit: subscription.plan.features.conversationsPerMonth,
            percentage: conversationsPercentage
          },
          storage: {
            used: subscription.usage.storage,
            limit: subscription.plan.features.knowledgeBaseSize * 1024 * 1024, // convert MB to bytes
            percentage: (subscription.usage.storage / (subscription.plan.features.knowledgeBaseSize * 1024 * 1024)) * 100
          },
          apiCalls: {
            used: subscription.usage.apiCalls
          }
        },
        overages: {
          amount: subscription.calculateOverage(),
          details: subscription.hasExceededLimits() ? 
            `${subscription.usage.conversations - subscription.plan.features.conversationsPerMonth} conversations over limit` : 
            null
        }
      };
      
      return report;
    } catch (error) {
      logger.error('Error getting usage report', { 
        error: error.message,
        tenantId 
      });
      throw error;
    }
  }

  /**
   * Reset usage counters for a billing period
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<Object>} Updated subscription
   */
  async resetUsageCounters(subscriptionId) {
    try {
      const subscription = await Subscription.findById(subscriptionId);
      
      if (!subscription) {
        throw new Error('Subscription not found');
      }
      
      // Reset usage
      subscription.usage = {
        conversations: 0,
        storage: subscription.usage.storage, // Keep storage as it's cumulative
        apiCalls: 0
      };
      
      await subscription.save();
      
      logger.info('Usage counters reset', { subscriptionId });
      
      return subscription;
    } catch (error) {
      logger.error('Error resetting usage counters', { 
        error: error.message,
        subscriptionId 
      });
      throw error;
    }
  }
}

module.exports = new BillingService();
