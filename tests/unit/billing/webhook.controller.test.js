/**
 * Unit Tests for Stripe Webhook Controller
 * 
 * Tests the webhook handlers for various Stripe events
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const webhookController = require('../../../src/billing/controllers/webhook.controller');
const Subscription = require('../../../src/billing/models/subscription.model');
const PaymentMethod = require('../../../src/billing/models/payment-method.model');
const User = require('../../../src/auth/models/user.model');
const emailService = require('../../../src/notifications/services/email.service');
const stripe = require('../../../src/billing/config/stripe');

// Mock dependencies
jest.mock('../../../src/notifications/services/email.service');
jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn()
}));
jest.mock('../../../src/billing/config/stripe', () => ({
  webhooks: {
    constructEvent: jest.fn()
  }
}));

describe('Webhook Controller', () => {
  let mongoServer;
  let mockRequest;
  let mockResponse;
  
  // Setup in-memory MongoDB for testing
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });
  
  // Cleanup after tests
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });
  
  // Reset database and mocks before each test
  beforeEach(async () => {
    await Subscription.deleteMany({});
    await PaymentMethod.deleteMany({});
    await User.deleteMany({});
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock request and response
    mockRequest = {
      headers: { 'stripe-signature': 'test-signature' },
      rawBody: JSON.stringify({ id: 'evt_test' })
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });
  
  describe('handleWebhook', () => {
    it('should return 400 if webhook signature verification fails', async () => {
      // Setup
      const error = new Error('Invalid signature');
      stripe.webhooks.constructEvent.mockImplementation(() => {
        throw error;
      });
      
      // Execute
      await webhookController.handleWebhook(mockRequest, mockResponse);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: `Webhook error: ${error.message}`
      });
    });
    
    it('should return 200 for unhandled event types', async () => {
      // Setup
      stripe.webhooks.constructEvent.mockReturnValue({
        type: 'unknown.event',
        data: { object: {} }
      });
      
      // Execute
      await webhookController.handleWebhook(mockRequest, mockResponse);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ received: true });
    });
  });
  
  describe('handleInvoicePaymentSucceeded', () => {
    it('should update subscription and send email on successful payment', async () => {
      // Setup
      const testUser = new User({
        email: 'test@example.com',
        stripeCustomerId: 'cus_test123'
      });
      await testUser.save();
      
      const testSubscription = new Subscription({
        userId: testUser._id,
        stripeSubscriptionId: 'sub_test123',
        status: 'active',
        planName: 'Pro Plan',
        currentPeriodEnd: new Date()
      });
      await testSubscription.save();
      
      const invoiceEvent = {
        id: 'in_test123',
        subscription: 'sub_test123',
        amount_paid: 2999, // $29.99
        currency: 'usd',
        hosted_invoice_url: 'https://stripe.com/invoice/test',
        lines: {
          data: [{
            period: {
              end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60 // 30 days from now
            }
          }]
        }
      };
      
      stripe.webhooks.constructEvent.mockReturnValue({
        type: 'invoice.payment_succeeded',
        data: { object: invoiceEvent }
      });
      
      // Execute
      await webhookController.handleWebhook(mockRequest, mockResponse);
      
      // Assert
      const updatedSubscription = await Subscription.findById(testSubscription._id);
      expect(updatedSubscription.status).toBe('active');
      expect(updatedSubscription.lastInvoiceId).toBe('in_test123');
      expect(updatedSubscription.lastPaymentDate).toBeDefined();
      
      expect(emailService.sendPaymentSuccessEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({
          amount: 29.99,
          currency: 'usd'
        })
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
    
    it('should handle missing subscription gracefully', async () => {
      // Setup
      const invoiceEvent = {
        id: 'in_test123',
        subscription: 'sub_nonexistent',
        amount_paid: 2999,
        currency: 'usd',
        lines: {
          data: [{
            period: {
              end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
            }
          }]
        }
      };
      
      stripe.webhooks.constructEvent.mockReturnValue({
        type: 'invoice.payment_succeeded',
        data: { object: invoiceEvent }
      });
      
      // Execute
      await webhookController.handleWebhook(mockRequest, mockResponse);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });
  
  describe('handleInvoicePaymentFailed', () => {
    it('should update subscription status and set grace period on payment failure', async () => {
      // Setup
      const testUser = new User({
        email: 'test@example.com',
        stripeCustomerId: 'cus_test123'
      });
      await testUser.save();
      
      const testSubscription = new Subscription({
        userId: testUser._id,
        stripeSubscriptionId: 'sub_test123',
        status: 'active',
        planName: 'Pro Plan',
        currentPeriodEnd: new Date()
      });
      await testSubscription.save();
      
      const invoiceEvent = {
        id: 'in_test123',
        subscription: 'sub_test123',
        amount_due: 2999, // $29.99
        currency: 'usd'
      };
      
      stripe.webhooks.constructEvent.mockReturnValue({
        type: 'invoice.payment_failed',
        data: { object: invoiceEvent }
      });
      
      // Execute
      await webhookController.handleWebhook(mockRequest, mockResponse);
      
      // Assert
      const updatedSubscription = await Subscription.findById(testSubscription._id);
      expect(updatedSubscription.status).toBe('past_due');
      expect(updatedSubscription.lastFailedPaymentDate).toBeDefined();
      expect(updatedSubscription.gracePeriodEnd).toBeDefined();
      
      // Verify grace period is set to 7 days from now (within 1 minute tolerance)
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      const timeDiff = Math.abs(updatedSubscription.gracePeriodEnd - sevenDaysFromNow);
      expect(timeDiff).toBeLessThan(60000); // Less than 1 minute difference
      
      expect(emailService.sendPaymentFailedEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({
          amount: 29.99,
          currency: 'usd',
          gracePeriodEnd: expect.any(Date)
        })
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });
  
  describe('handleSubscriptionUpdated', () => {
    it('should update subscription details when subscription is updated', async () => {
      // Setup
      const testSubscription = new Subscription({
        stripeSubscriptionId: 'sub_test123',
        status: 'active',
        planName: 'Basic Plan',
        stripePriceId: 'price_old',
        currentPeriodEnd: new Date()
      });
      await testSubscription.save();
      
      const subscriptionEvent = {
        id: 'sub_test123',
        status: 'active',
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        items: {
          data: [{
            price: {
              id: 'price_new'
            }
          }]
        }
      };
      
      stripe.webhooks.constructEvent.mockReturnValue({
        type: 'customer.subscription.updated',
        data: { object: subscriptionEvent }
      });
      
      // Execute
      await webhookController.handleWebhook(mockRequest, mockResponse);
      
      // Assert
      const updatedSubscription = await Subscription.findById(testSubscription._id);
      expect(updatedSubscription.stripePriceId).toBe('price_new');
      expect(updatedSubscription.currentPeriodEnd).toBeDefined();
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });
  
  describe('handleSubscriptionDeleted', () => {
    it('should mark subscription as canceled when deleted in Stripe', async () => {
      // Setup
      const testUser = new User({
        email: 'test@example.com',
        stripeCustomerId: 'cus_test123'
      });
      await testUser.save();
      
      const testSubscription = new Subscription({
        userId: testUser._id,
        stripeSubscriptionId: 'sub_test123',
        status: 'active',
        planName: 'Pro Plan',
        currentPeriodEnd: new Date()
      });
      await testSubscription.save();
      
      const subscriptionEvent = {
        id: 'sub_test123',
        status: 'canceled'
      };
      
      stripe.webhooks.constructEvent.mockReturnValue({
        type: 'customer.subscription.deleted',
        data: { object: subscriptionEvent }
      });
      
      // Execute
      await webhookController.handleWebhook(mockRequest, mockResponse);
      
      // Assert
      const updatedSubscription = await Subscription.findById(testSubscription._id);
      expect(updatedSubscription.status).toBe('canceled');
      expect(updatedSubscription.canceledAt).toBeDefined();
      
      expect(emailService.sendSubscriptionCanceledEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({
          planName: 'Pro Plan'
        })
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });
  
  describe('handlePaymentMethodAttached', () => {
    it('should create new payment method record when attached', async () => {
      // Setup
      const testUser = new User({
        email: 'test@example.com',
        stripeCustomerId: 'cus_test123'
      });
      await testUser.save();
      
      const paymentMethodEvent = {
        id: 'pm_test123',
        customer: 'cus_test123',
        type: 'card',
        card: {
          last4: '4242',
          brand: 'visa',
          exp_month: 12,
          exp_year: 2025
        }
      };
      
      stripe.webhooks.constructEvent.mockReturnValue({
        type: 'payment_method.attached',
        data: { object: paymentMethodEvent }
      });
      
      // Execute
      await webhookController.handleWebhook(mockRequest, mockResponse);
      
      // Assert
      const paymentMethod = await PaymentMethod.findOne({ stripePaymentMethodId: 'pm_test123' });
      expect(paymentMethod).toBeDefined();
      expect(paymentMethod.userId.toString()).toBe(testUser._id.toString());
      expect(paymentMethod.last4).toBe('4242');
      expect(paymentMethod.brand).toBe('visa');
      expect(paymentMethod.isDefault).toBe(true); // First payment method should be default
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
    
    it('should not set as default if user already has payment methods', async () => {
      // Setup
      const testUser = new User({
        email: 'test@example.com',
        stripeCustomerId: 'cus_test123'
      });
      await testUser.save();
      
      // Create existing payment method
      const existingPaymentMethod = new PaymentMethod({
        userId: testUser._id,
        stripePaymentMethodId: 'pm_existing',
        type: 'card',
        last4: '1234',
        brand: 'mastercard',
        isDefault: true,
        isActive: true
      });
      await existingPaymentMethod.save();
      
      const paymentMethodEvent = {
        id: 'pm_test123',
        customer: 'cus_test123',
        type: 'card',
        card: {
          last4: '4242',
          brand: 'visa',
          exp_month: 12,
          exp_year: 2025
        }
      };
      
      stripe.webhooks.constructEvent.mockReturnValue({
        type: 'payment_method.attached',
        data: { object: paymentMethodEvent }
      });
      
      // Execute
      await webhookController.handleWebhook(mockRequest, mockResponse);
      
      // Assert
      const paymentMethod = await PaymentMethod.findOne({ stripePaymentMethodId: 'pm_test123' });
      expect(paymentMethod).toBeDefined();
      expect(paymentMethod.isDefault).toBe(false); // Should not be default as user already has one
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });
  
  describe('handlePaymentMethodDetached', () => {
    it('should mark payment method as inactive when detached', async () => {
      // Setup
      const testUser = new User({
        email: 'test@example.com',
        stripeCustomerId: 'cus_test123'
      });
      await testUser.save();
      
      const testPaymentMethod = new PaymentMethod({
        userId: testUser._id,
        stripePaymentMethodId: 'pm_test123',
        type: 'card',
        last4: '4242',
        brand: 'visa',
        isDefault: true,
        isActive: true
      });
      await testPaymentMethod.save();
      
      const paymentMethodEvent = {
        id: 'pm_test123'
      };
      
      stripe.webhooks.constructEvent.mockReturnValue({
        type: 'payment_method.detached',
        data: { object: paymentMethodEvent }
      });
      
      // Execute
      await webhookController.handleWebhook(mockRequest, mockResponse);
      
      // Assert
      const updatedPaymentMethod = await PaymentMethod.findById(testPaymentMethod._id);
      expect(updatedPaymentMethod.isActive).toBe(false);
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
    
    it('should set new default payment method when current default is detached', async () => {
      // Setup
      const testUser = new User({
        email: 'test@example.com',
        stripeCustomerId: 'cus_test123'
      });
      await testUser.save();
      
      // Create default payment method
      const defaultPaymentMethod = new PaymentMethod({
        userId: testUser._id,
        stripePaymentMethodId: 'pm_default',
        type: 'card',
        last4: '4242',
        brand: 'visa',
        isDefault: true,
        isActive: true
      });
      await defaultPaymentMethod.save();
      
      // Create alternative payment method
      const alternativePaymentMethod = new PaymentMethod({
        userId: testUser._id,
        stripePaymentMethodId: 'pm_alternative',
        type: 'card',
        last4: '5678',
        brand: 'mastercard',
        isDefault: false,
        isActive: true
      });
      await alternativePaymentMethod.save();
      
      const paymentMethodEvent = {
        id: 'pm_default'
      };
      
      stripe.webhooks.constructEvent.mockReturnValue({
        type: 'payment_method.detached',
        data: { object: paymentMethodEvent }
      });
      
      // Execute
      await webhookController.handleWebhook(mockRequest, mockResponse);
      
      // Assert
      const updatedDefaultMethod = await PaymentMethod.findById(defaultPaymentMethod._id);
      expect(updatedDefaultMethod.isActive).toBe(false);
      
      const updatedAlternativeMethod = await PaymentMethod.findById(alternativePaymentMethod._id);
      expect(updatedAlternativeMethod.isDefault).toBe(true);
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });
});
