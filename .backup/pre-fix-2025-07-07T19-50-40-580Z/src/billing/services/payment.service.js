/**
 * Payment Service
 * 
 * Provides business logic for payment processing using Stripe
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Subscription = require('../models/subscription.model');
const Tenant = require('../../tenancy/models/tenant.model');
const logger = require('../../utils/logger');
const taxService = require('./tax.service');
const PaymentAttempt = require('../models/payment-attempt.model');
const { handleStripeError, handlePaymentError, isRecoverableError, formatErrorResponse } = require('../utils/payment-error-handler');
const { v4: uuidv4 } = require('uuid');

// Constants
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000 * 60 * 5; // 5 minutes between retries
const IDEMPOTENCY_KEY_EXPIRY_HOURS = 24; // Idempotency key expiry in hours

/**
 * Service for payment processing
 */
class PaymentService {
  /**
   * Create a payment intent for a subscription
   * @param {string} subscriptionId - Subscription ID
   * @param {Object} options - Payment options
   * @returns {Promise<Object>} Payment intent
   */
  /**
   * Creates a payment intent with retry logic and comprehensive error handling
   * @param {string} subscriptionId - Subscription ID
   * @param {Object} options - Payment options
   * @param {number} [attempt=1] - Current retry attempt
   * @returns {Promise<Object>} Payment intent or error
   */
  async createPaymentIntent(subscriptionId, options = {}, attempt = 1) {
    const idempotencyKey = options.idempotencyKey || `pi_${uuidv4()}`;
    const operation = 'create_payment_intent';
    const metadata = { subscriptionId, attempt };

    try {
      // Check if this is a retry and get previous attempt
      const previousAttempt = await PaymentAttempt.findOne({ idempotencyKey });
      if (previousAttempt && previousAttempt.status === 'succeeded') {
        logger.info(`Reusing successful payment intent for idempotency key: ${idempotencyKey}`);
        return previousAttempt.result;
      }

      // Create a new payment attempt record
      const paymentAttempt = new PaymentAttempt({
        idempotencyKey,
        operation,
        status: 'processing',
        metadata: { ...metadata, ...options },
        startedAt: new Date()
      });

      await paymentAttempt.save();

      // Get subscription with tenant population
      const subscription = await Subscription.findById(subscriptionId)
        .populate('tenantId', 'billingSettings contactDetails');
      
      if (!subscription) {
        throw new Error('Subscription not found');
      }
      
      // Get tenant
      const tenant = await Tenant.findById(subscription.tenantId);
      
      if (!tenant) {
        throw new Error('Tenant not found');
      }
      
      // Calculate tax if enabled
      let taxAmount = 0;
      let taxDetails = null;
      
      if (options.includeTax !== false) {
        try {
          // Apply tax to subscription
          const updatedSubscription = await taxService.applyTax(subscriptionId);
          
          // Get tax details
          taxAmount = updatedSubscription.taxDetails?.taxAmount || 0;
          taxDetails = updatedSubscription.taxDetails;
          
          // Use updated subscription
          subscription.taxDetails = taxDetails;
          subscription.totalAmount = updatedSubscription.totalAmount;
        } catch (taxError) {
          logger.error(`Error calculating tax: ${taxError.message}`, { error: taxError });
          // Continue without tax if calculation fails
        }
      }
      
      // Calculate total amount (base price + tax)
      const baseAmount = subscription.plan.price * 100; // Convert to cents for Stripe
      const totalAmount = Math.round((subscription.totalAmount || subscription.plan.price) * 100);
      
      // Prepare payment intent data with idempotency key
      const paymentIntentData = {
        amount: totalAmount,
        currency: subscription.plan.currency || 'usd',
        description: `Subscription: ${subscription.plan.name} (${subscription.plan.billingCycle})`,
        metadata: {
          subscriptionId: subscription._id.toString(),
          tenantId: subscription.tenantId._id.toString(),
          planName: subscription.plan.name,
          taxAmount: taxAmount ? (taxAmount * 100).toString() : '0',
          billingCycle: subscription.plan.billingCycle,
          attempt,
          idempotencyKey
        },
        receipt_email: subscription.tenantId.contactDetails?.email,
        ...options,
        idempotency_key: idempotencyKey
      };

      // Log payment attempt
      logger.info(`Creating payment intent for subscription ${subscriptionId}`, {
        operation,
        amount: totalAmount,
        currency: paymentIntentData.currency,
        attempt,
        idempotencyKey
      });

      // Create payment intent with Stripe
      const paymentIntent = await stripe.paymentIntents.create(paymentIntentData, {
        idempotencyKey
      });
      
      // Prepare successful response
      const result = {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        requiresAction: paymentIntent.status === 'requires_action' || 
                       paymentIntent.status === 'requires_payment_method'
      };

      // Update subscription with payment intent details
      subscription.paymentDetails = {
        ...subscription.paymentDetails,
        paymentIntentId: paymentIntent.id,
        paymentIntentStatus: paymentIntent.status,
        lastPaymentAttempt: new Date(),
        lastError: null,
        retryCount: 0
      };
      
      await subscription.save();
      
      // Update payment attempt as successful
      paymentAttempt.status = 'succeeded';
      paymentAttempt.endedAt = new Date();
      paymentAttempt.result = result;
      await paymentAttempt.save();
      
      logger.info(`Successfully created payment intent ${paymentIntent.id} for subscription ${subscription._id}`, {
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency
      });
      
      return result;
    } catch (error) {
      // Log the error
      logger.error(`Error in createPaymentIntent (attempt ${attempt}): ${error.message}`, {
        error,
        stack: error.stack,
        subscriptionId,
        attempt,
        idempotencyKey
      });

      // Handle Stripe-specific errors
      if (error.type === 'StripeInvalidRequestError' || 
          error.type === 'StripeCardError' ||
          error.type === 'StripeAPIError') {
        const errorResponse = handleStripeError(error, 'create_payment_intent', { subscriptionId, attempt });
        
        // Check if this is a retryable error
        if (isRecoverableError(errorResponse) && attempt < MAX_RETRY_ATTEMPTS) {
          logger.info(`Scheduling retry ${attempt + 1}/${MAX_RETRY_ATTEMPTS} for subscription ${subscriptionId}`, {
            error: errorResponse.code,
            delayMs: RETRY_DELAY_MS
          });
          
          // Schedule retry
          setTimeout(async () => {
            try {
              await this.createPaymentIntent(subscriptionId, {
                ...options,
                idempotencyKey: idempotencyKey // Reuse the same idempotency key
              }, attempt + 1);
            } catch (retryError) {
              logger.error(`Retry ${attempt + 1} failed for subscription ${subscriptionId}: ${retryError.message}`, {
                error: retryError,
                subscriptionId,
                attempt: attempt + 1
              });
            }
          }, RETRY_DELAY_MS);
        }
        
        // Update subscription with error details
        if (subscription) {
          subscription.paymentDetails = {
            ...subscription.paymentDetails,
            lastError: errorResponse,
            lastPaymentAttempt: new Date(),
            retryCount: attempt,
            nextRetryAt: isRecoverableError(errorResponse) && attempt < MAX_RETRY_ATTEMPTS 
              ? new Date(Date.now() + RETRY_DELAY_MS)
              : null
          };
          await subscription.save();
        }
        
        // Update payment attempt with error
        if (paymentAttempt) {
          paymentAttempt.status = 'failed';
          paymentAttempt.endedAt = new Date();
          paymentAttempt.error = formatErrorResponse(errorResponse, true);
          await paymentAttempt.save();
        }
        
        throw formatErrorResponse(errorResponse);
      }
      
      // Handle generic errors
      const errorResponse = handlePaymentError(error, 'create_payment_intent', { subscriptionId, attempt });
      
      // Update subscription with error details
      if (subscription) {
        subscription.paymentDetails = {
          ...subscription.paymentDetails,
          lastError: errorResponse,
          lastPaymentAttempt: new Date(),
          retryCount: attempt,
          nextRetryAt: isRecoverableError(errorResponse) && attempt < MAX_RETRY_ATTEMPTS 
            ? new Date(Date.now() + RETRY_DELAY_MS)
            : null
        };
        await subscription.save();
      }
      
      // Update payment attempt with error
      if (paymentAttempt) {
        paymentAttempt.status = 'failed';
        paymentAttempt.endedAt = new Date();
        paymentAttempt.error = formatErrorResponse(errorResponse, true);
        await paymentAttempt.save();
      }
      
      throw formatErrorResponse(errorResponse);
    }
      logger.error(`Error creating payment intent: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a setup intent for saving payment method
   * @param {string} tenantId - Tenant ID
   * @param {Object} options - Setup options
   * @returns {Promise<Object>} Setup intent
   */
  async createSetupIntent(tenantId, options = {}) {
    try {
      // Get tenant
      const tenant = await Tenant.findById(tenantId);
      
      if (!tenant) {
        throw new Error('Tenant not found');
      }
      
      // Create setup intent
      const setupIntent = await stripe.setupIntents.create({
        usage: 'off_session',
        metadata: {
          tenantId: tenant._id.toString()
        },
        ...options
      });
      
      logger.info(`Created setup intent ${setupIntent.id} for tenant ${tenant._id}`);
      
      return {
        setupIntentId: setupIntent.id,
        clientSecret: setupIntent.client_secret,
        status: setupIntent.status
      };
    } catch (error) {
      logger.error(`Error creating setup intent: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process a successful payment
   * @param {string} paymentIntentId - Payment intent ID
   * @returns {Promise<Object>} Updated subscription
   */
  async processSuccessfulPayment(paymentIntentId) {
    try {
      // Get payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      // Get subscription from metadata
      const subscriptionId = paymentIntent.metadata.subscriptionId;
      
      if (!subscriptionId) {
        throw new Error('Subscription ID not found in payment intent metadata');
      }
      
      const subscription = await Subscription.findById(subscriptionId);
      
      if (!subscription) {
        throw new Error(`Subscription ${subscriptionId} not found`);
      }
      
      // Update subscription payment status
      subscription.paymentDetails = {
        ...subscription.paymentDetails,
        paymentIntentStatus: paymentIntent.status,
        lastPaymentSuccess: true,
        lastPaymentDate: new Date(),
        paymentMethodId: paymentIntent.payment_method
      };
      
      // If subscription was pending payment, activate it
      if (subscription.status === 'pending_payment') {
        subscription.status = 'active';
        subscription.activatedAt = new Date();
      }
      
      // Update next billing date
      if (subscription.plan.billingCycle === 'monthly') {
        subscription.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      } else if (subscription.plan.billingCycle === 'annual') {
        subscription.currentPeriodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      }
      
      await subscription.save();
      
      logger.info(`Processed successful payment for subscription ${subscription._id}`);
      
      return subscription;
    } catch (error) {
      logger.error(`Error processing successful payment: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process a failed payment
   * @param {string} paymentIntentId - Payment intent ID
   * @param {string} errorMessage - Error message
   * @returns {Promise<Object>} Updated subscription
   */
  async processFailedPayment(paymentIntentId, errorMessage) {
    try {
      // Get payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      // Get subscription from metadata
      const subscriptionId = paymentIntent.metadata.subscriptionId;
      
      if (!subscriptionId) {
        throw new Error('Subscription ID not found in payment intent metadata');
      }
      
      const subscription = await Subscription.findById(subscriptionId);
      
      if (!subscription) {
        throw new Error(`Subscription ${subscriptionId} not found`);
      }
      
      // Update subscription payment status
      subscription.paymentDetails = {
        ...subscription.paymentDetails,
        paymentIntentStatus: paymentIntent.status,
        lastPaymentSuccess: false,
        lastPaymentError: errorMessage,
        lastPaymentAttempt: new Date(),
        failedPaymentCount: (subscription.paymentDetails?.failedPaymentCount || 0) + 1
      };
      
      // If too many failed attempts, mark subscription as past_due
      if (subscription.paymentDetails?.failedPaymentCount >= 3) {
        subscription.status = 'past_due';
      }
      
      await subscription.save();
      
      logger.info(`Processed failed payment for subscription ${subscription._id}`);
      
      return subscription;
    } catch (error) {
      logger.error(`Error processing failed payment: ${error.message}`);
      throw error;
    }
  }

  /**
   * Save payment method for tenant
   * @param {string} tenantId - Tenant ID
   * @param {string} paymentMethodId - Payment method ID
   * @returns {Promise<Object>} Updated tenant
   */
  async savePaymentMethod(tenantId, paymentMethodId) {
    try {
      // Get tenant
      const tenant = await Tenant.findById(tenantId);
      
      if (!tenant) {
        throw new Error('Tenant not found');
      }
      
      // Get payment method details from Stripe
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      
      // Update tenant with payment method
      tenant.paymentMethods = tenant.paymentMethods || [];
      
      // Check if payment method already exists
      const existingIndex = tenant.paymentMethods.findIndex(
        pm => pm.paymentMethodId === paymentMethodId
      );
      
      const paymentMethodData = {
        paymentMethodId,
        type: paymentMethod.type,
        isDefault: tenant.paymentMethods.length === 0, // Make default if first payment method
        last4: paymentMethod.card?.last4,
        brand: paymentMethod.card?.brand,
        expiryMonth: paymentMethod.card?.exp_month,
        expiryYear: paymentMethod.card?.exp_year,
        createdAt: new Date()
      };
      
      if (existingIndex >= 0) {
        tenant.paymentMethods[existingIndex] = paymentMethodData;
      } else {
        tenant.paymentMethods.push(paymentMethodData);
      }
      
      await tenant.save();
      
      logger.info(`Saved payment method ${paymentMethodId} for tenant ${tenant._id}`);
      
      return tenant;
    } catch (error) {
      logger.error(`Error saving payment method: ${error.message}`);
      throw error;
    }
  }

  /**
   * Set default payment method for tenant
   * @param {string} tenantId - Tenant ID
   * @param {string} paymentMethodId - Payment method ID
   * @returns {Promise<Object>} Updated tenant
   */
  async setDefaultPaymentMethod(tenantId, paymentMethodId) {
    try {
      // Get tenant
      const tenant = await Tenant.findById(tenantId);
      
      if (!tenant) {
        throw new Error('Tenant not found');
      }
      
      // Check if payment method exists
      if (!tenant.paymentMethods || !tenant.paymentMethods.length) {
        throw new Error('No payment methods found for tenant');
      }
      
      const methodIndex = tenant.paymentMethods.findIndex(
        pm => pm.paymentMethodId === paymentMethodId
      );
      
      if (methodIndex === -1) {
        throw new Error('Payment method not found');
      }
      
      // Update default status
      tenant.paymentMethods.forEach((pm, index) => {
        pm.isDefault = index === methodIndex;
      });
      
      await tenant.save();
      
      logger.info(`Set default payment method ${paymentMethodId} for tenant ${tenant._id}`);
      
      return tenant;
    } catch (error) {
      logger.error(`Error setting default payment method: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove payment method
   * @param {string} tenantId - Tenant ID
   * @param {string} paymentMethodId - Payment method ID
   * @returns {Promise<Object>} Updated tenant
   */
  async removePaymentMethod(tenantId, paymentMethodId) {
    try {
      // Get tenant
      const tenant = await Tenant.findById(tenantId);
      
      if (!tenant) {
        throw new Error('Tenant not found');
      }
      
      // Check if payment method exists
      if (!tenant.paymentMethods || !tenant.paymentMethods.length) {
        throw new Error('No payment methods found for tenant');
      }
      
      const methodIndex = tenant.paymentMethods.findIndex(
        pm => pm.paymentMethodId === paymentMethodId
      );
      
      if (methodIndex === -1) {
        throw new Error('Payment method not found');
      }
      
      // Check if it's the default payment method
      const isDefault = tenant.paymentMethods[methodIndex].isDefault;
      
      // Remove payment method
      tenant.paymentMethods.splice(methodIndex, 1);
      
      // If it was the default and we have other payment methods, set a new default
      if (isDefault && tenant.paymentMethods.length > 0) {
        tenant.paymentMethods[0].isDefault = true;
      }
      
      await tenant.save();
      
      // Also detach from Stripe
      await stripe.paymentMethods.detach(paymentMethodId);
      
      logger.info(`Removed payment method ${paymentMethodId} for tenant ${tenant._id}`);
      
      return tenant;
    } catch (error) {
      logger.error(`Error removing payment method: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process webhook event from Stripe
   * @param {Object} event - Stripe event
   * @returns {Promise<Object>} Processing result
   */
  async processWebhookEvent(event) {
    try {
      let result = null;
      
      switch (event.type) {
        case 'payment_intent.succeeded':
          result = await this.processSuccessfulPayment(event.data.object.id);
          break;
          
        case 'payment_intent.payment_failed':
          result = await this.processFailedPayment(
            event.data.object.id,
            event.data.object.last_payment_error?.message || 'Payment failed'
          );
          break;
          
        case 'setup_intent.succeeded':
          // Handle successful setup intent (payment method saved)
          const setupIntent = event.data.object;
          const tenantId = setupIntent.metadata.tenantId;
          
          if (tenantId && setupIntent.payment_method) {
            result = await this.savePaymentMethod(tenantId, setupIntent.payment_method);
          }
          break;
          
        // Add more event handlers as needed
      }
      
      logger.info(`Processed webhook event ${event.id} of type ${event.type}`);
      
      return {
        processed: true,
        eventType: event.type,
        result
      };
    } catch (error) {
      logger.error(`Error processing webhook event: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new PaymentService();
