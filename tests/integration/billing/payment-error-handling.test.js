/**
 * Integration Tests for Payment Error Handling
 * 
 * Tests the end-to-end payment error handling process including:
 * - Payment failure scenarios
 * - Error middleware responses
 * - Error recovery flows
 * - User notifications
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../../src/app');
const User = require('../../../src/auth/models/user.model');
const Tenant = require('../../../src/auth/models/tenant.model');
const PaymentMethod = require('../../../src/billing/models/payment-method.model');
const emailService = require('../../../src/notifications/services/email.service');

// Mock Stripe with error scenarios
jest.mock('../../../src/billing/config/stripe', () => {
  // Helper to create Stripe errors
  const createStripeError = (type, code, message) => {
    const error = new Error(message);
    error.type = type;
    error.code = code;
    error.raw = { type, code, message };
    return error;
  };

  return {
    paymentIntents: {
      create: jest.fn().mockImplementation(({ amount, currency, customer, payment_method }) => {
        // Simulate different error scenarios based on amount
        if (amount === 5000) {
          // Card declined error
          throw createStripeError('card_error', 'card_declined', 'Your card was declined');
        } else if (amount === 9900) {
          // Insufficient funds error
          throw createStripeError('card_error', 'insufficient_funds', 'Your card has insufficient funds');
        } else if (amount === 15000) {
          // Invalid card error
          throw createStripeError('card_error', 'invalid_card', 'Your card is invalid');
        } else if (amount === 20000) {
          // Processing error
          throw createStripeError('processing_error', 'processing_error', 'An error occurred while processing your card');
        } else {
          // Success case
          return Promise.resolve({
            id: 'pi_test123456',
            client_secret: 'pi_test_secret_123456',
            status: 'requires_payment_method'
          });
        }
      }),
      confirm: jest.fn().mockImplementation(({ id }) => {
        // Simulate confirmation errors based on payment intent ID
        if (id.includes('error')) {
          throw createStripeError('card_error', 'card_declined', 'Your card was declined');
        }
        return Promise.resolve({
          id,
          status: 'succeeded'
        });
      })
    },
    setupIntents: {
      create: jest.fn().mockImplementation(({ customer, payment_method_types }) => {
        // Simulate setup intent errors based on customer ID
        if (customer && customer.includes('error')) {
          throw createStripeError('setup_intent_error', 'setup_intent_failed', 'Setup intent failed');
        }
        return Promise.resolve({
          id: 'seti_test123456',
          client_secret: 'seti_test_secret_123456'
        });
      })
    },
    customers: {
      create: jest.fn().mockResolvedValue({
        id: 'cus_test123456'
      })
    },
    paymentMethods: {
      attach: jest.fn().mockImplementation(({ payment_method, customer }) => {
        // Simulate payment method attachment errors
        if (payment_method === 'pm_error') {
          throw createStripeError('invalid_request_error', 'payment_method_invalid', 'The payment method is invalid');
        }
        return Promise.resolve({
          id: payment_method
        });
      }),
      detach: jest.fn().mockResolvedValue({
        id: 'pm_test123456'
      })
    }
  };
});

// Mock email service
jest.mock('../../../src/notifications/services/email.service', () => ({
  sendEmail: jest.fn().mockResolvedValue(true)
}));

describe('Payment Error Handling Integration Tests', () => {
  let mongoServer;
  let token;
  let testUser;
  let testTenant;
  
  // Setup MongoDB Memory Server
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });
  
  // Clean up after tests
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });
  
  // Setup test data before each test
  beforeEach(async () => {
    // Clear collections
    await User.deleteMany({});
    await Tenant.deleteMany({});
    await PaymentMethod.deleteMany({});
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Create test tenant
    testTenant = await Tenant.create({
      name: 'Test Tenant',
      domain: 'test-tenant.com',
      settings: {
        allowedFeatures: ['basic_chat', 'templates']
      }
    });
    
    // Create test user
    testUser = await User.create({
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
      tenantId: testTenant._id,
      role: 'admin'
    });
    
    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Password123!'
      });
    
    token = loginResponse.body.token;
  });
  
  describe('Payment Intent Creation Errors', () => {
    it('should handle card declined errors', async () => {
      const response = await request(app)
        .post('/api/billing/payment-intents')
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 5000, // This amount triggers a card_declined error
          currency: 'usd'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.code).toBe('card_declined');
      expect(response.body.suggestion).toBeDefined();
    });
    
    it('should handle insufficient funds errors', async () => {
      const response = await request(app)
        .post('/api/billing/payment-intents')
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 9900, // This amount triggers an insufficient_funds error
          currency: 'usd'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.code).toBe('insufficient_funds');
      expect(response.body.suggestion).toBeDefined();
    });
    
    it('should handle invalid card errors', async () => {
      const response = await request(app)
        .post('/api/billing/payment-intents')
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 15000, // This amount triggers an invalid_card error
          currency: 'usd'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.code).toBe('invalid_card');
      expect(response.body.suggestion).toBeDefined();
    });
    
    it('should handle processing errors', async () => {
      const response = await request(app)
        .post('/api/billing/payment-intents')
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 20000, // This amount triggers a processing_error
          currency: 'usd'
        });
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.code).toBe('processing_error');
      expect(response.body.suggestion).toBeDefined();
    });
  });
  
  describe('Payment Method Errors', () => {
    it('should handle invalid payment method errors', async () => {
      const response = await request(app)
        .post('/api/billing/payment-methods')
        .set('Authorization', `Bearer ${token}`)
        .send({
          paymentMethodId: 'pm_error', // This ID triggers a payment_method_invalid error
          billingDetails: {
            name: 'Test User',
            email: 'test@example.com'
          }
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.code).toBe('payment_method_invalid');
      expect(response.body.suggestion).toBeDefined();
    });
  });
  
  describe('Setup Intent Errors', () => {
    it('should handle setup intent creation errors', async () => {
      // First create a customer with an error-triggering ID
      await mongoose.model('Customer').create({
        userId: testUser._id,
        tenantId: testTenant._id,
        stripeCustomerId: 'cus_error_123456',
        email: 'test@example.com',
        name: 'Test User'
      });
      
      const response = await request(app)
        .post('/api/billing/payment-methods/setup-intent')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.code).toBe('setup_intent_failed');
      expect(response.body.suggestion).toBeDefined();
    });
  });
  
  describe('Error Recovery Flows', () => {
    it('should allow adding a new payment method after a payment error', async () => {
      // Step 1: Trigger a payment error
      await request(app)
        .post('/api/billing/payment-intents')
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 5000, // This amount triggers a card_declined error
          currency: 'usd'
        });
      
      // Step 2: Add a new payment method
      const addPaymentMethodResponse = await request(app)
        .post('/api/billing/payment-methods')
        .set('Authorization', `Bearer ${token}`)
        .send({
          paymentMethodId: 'pm_test_valid_123456',
          billingDetails: {
            name: 'Test User',
            email: 'test@example.com'
          }
        });
      
      expect(addPaymentMethodResponse.status).toBe(201);
      expect(addPaymentMethodResponse.body.paymentMethod).toBeDefined();
      
      // Step 3: Try payment again with new payment method
      const retryPaymentResponse = await request(app)
        .post('/api/billing/payment-intents')
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 2000, // This amount should succeed
          currency: 'usd',
          paymentMethodId: 'pm_test_valid_123456'
        });
      
      expect(retryPaymentResponse.status).toBe(201);
      expect(retryPaymentResponse.body.clientSecret).toBeDefined();
    });
  });
  
  describe('User Notifications', () => {
    it('should send email notification on payment failure', async () => {
      // Trigger a payment error
      await request(app)
        .post('/api/billing/payment-intents')
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 5000, // This amount triggers a card_declined error
          currency: 'usd'
        });
      
      // Check that email service was called
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: testUser.email,
          template: 'payment-failed',
          data: expect.objectContaining({
            userName: expect.any(String),
            errorCode: 'card_declined',
            recoveryUrl: expect.any(String)
          })
        })
      );
    });
  });
  
  describe('Error Logging', () => {
    it('should log payment errors for monitoring', async () => {
      // Mock the logger
      const logger = require('../../../src/utils/logger');
      
      // Trigger a payment error
      await request(app)
        .post('/api/billing/payment-intents')
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 5000, // This amount triggers a card_declined error
          currency: 'usd'
        });
      
      // Check that logger was called
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Payment error'),
        expect.objectContaining({
          code: 'card_declined',
          userId: testUser._id.toString(),
          tenantId: testTenant._id.toString()
        })
      );
    });
  });
});
