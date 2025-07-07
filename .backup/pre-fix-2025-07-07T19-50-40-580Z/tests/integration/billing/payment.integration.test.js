/**
 * Payment Integration Tests
 * 
 * Tests the end-to-end payment flow using Stripe
 */

const mongoose = require('mongoose');
const request = require('supertest');
const { app } = require('../../../src/app');
const Subscription = require('../../../src/billing/models/subscription.model');
const Tenant = require('../../../src/tenancy/models/tenant.model');
const paymentService = require('../../../src/billing/services/payment.service');
const jwt = require('jsonwebtoken');
const config = require('../../../src/core/config');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Mock Stripe API for testing
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        id: 'pi_test123',
        client_secret: 'pi_test123_secret_test456',
        amount: 9900,
        currency: 'usd',
        status: 'requires_payment_method'
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'pi_test123',
        metadata: {
          subscriptionId: 'subscription_test123',
          tenantId: 'tenant_test123'
        },
        status: 'succeeded',
        payment_method: 'pm_test123'
      })
    },
    setupIntents: {
      create: jest.fn().mockResolvedValue({
        id: 'seti_test123',
        client_secret: 'seti_test123_secret_test456',
        status: 'requires_payment_method'
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'seti_test123',
        metadata: {
          tenantId: 'tenant_test123'
        },
        status: 'succeeded',
        payment_method: 'pm_test123'
      })
    },
    paymentMethods: {
      retrieve: jest.fn().mockResolvedValue({
        id: 'pm_test123',
        type: 'card',
        card: {
          last4: '4242',
          brand: 'visa',
          exp_month: 12,
          exp_year: 2025
        }
      }),
      detach: jest.fn().mockResolvedValue({
        id: 'pm_test123',
        deleted: true
      })
    },
    webhooks: {
      constructEvent: jest.fn().mockImplementation((body, signature, secret) => {
        return {
          id: 'evt_test123',
          type: 'payment_intent.succeeded',
          data: {
            object: {
              id: 'pi_test123',
              metadata: {
                subscriptionId: 'subscription_test123',
                tenantId: 'tenant_test123'
              },
              status: 'succeeded',
              payment_method: 'pm_test123'
            }
          }
        };
      })
    }
  }));
});

// Mock the logger to prevent console output during tests
jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn()
}));

describe('Payment Integration Tests', () => {
  let testTenant;
  let testSubscription;
  let authToken;
  
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/chatbots_test', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    // Clear test data
    await Tenant.deleteMany({});
    await Subscription.deleteMany({});
  });
  
  afterAll(async () => {
    // Disconnect from test database
    await mongoose.connection.close();
  });
  
  beforeEach(async () => {
    // Create test tenant
    testTenant = await Tenant.create({
      name: 'Test Tenant',
      organizationDetails: {
        companyName: 'Test Company',
        website: 'https://test.com',
        industry: 'Technology'
      },
      contactDetails: {
        email: 'test@test.com',
        phone: '555-123-4567'
      },
      paymentMethods: []
    });
    
    // Create test subscription
    testSubscription = await Subscription.create({
      tenantId: testTenant._id,
      plan: {
        name: 'professional',
        price: 99,
        currency: 'usd',
        billingCycle: 'monthly'
      },
      status: 'pending_payment',
      createdAt: new Date(),
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
    
    // Create auth token for testing
    authToken = jwt.sign(
      { userId: 'user_test123', tenantId: testTenant._id },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
  });
  
  afterEach(async () => {
    // Clear test data
    await Tenant.deleteMany({});
    await Subscription.deleteMany({});
  });
  
  describe('Payment Intent API', () => {
    test('should create a payment intent successfully', async () => {
      const response = await request(app)
        .post('/api/billing/payment/intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ subscriptionId: testSubscription._id });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('paymentIntentId', 'pi_test123');
      expect(response.body).toHaveProperty('clientSecret', 'pi_test123_secret_test456');
      expect(response.body).toHaveProperty('amount', 9900);
      expect(response.body).toHaveProperty('currency', 'usd');
      
      // Verify subscription was updated
      const updatedSubscription = await Subscription.findById(testSubscription._id);
      expect(updatedSubscription.paymentDetails).toHaveProperty('paymentIntentId', 'pi_test123');
    });
    
    test('should return 400 if subscription ID is missing', async () => {
      const response = await request(app)
        .post('/api/billing/payment/intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Subscription ID is required');
    });
  });
  
  describe('Setup Intent API', () => {
    test('should create a setup intent successfully', async () => {
      const response = await request(app)
        .post('/api/billing/payment/setup')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('setupIntentId', 'seti_test123');
      expect(response.body).toHaveProperty('clientSecret', 'seti_test123_secret_test456');
      expect(response.body).toHaveProperty('status', 'requires_payment_method');
    });
  });
  
  describe('Payment Methods API', () => {
    test('should get payment methods successfully', async () => {
      // Add a payment method to the tenant
      testTenant.paymentMethods = [{
        paymentMethodId: 'pm_test123',
        type: 'card',
        isDefault: true,
        last4: '4242',
        brand: 'visa',
        expiryMonth: 12,
        expiryYear: 2025,
        createdAt: new Date()
      }];
      await testTenant.save();
      
      const response = await request(app)
        .get('/api/billing/payment/methods')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('paymentMethods');
      expect(response.body.paymentMethods).toHaveLength(1);
      expect(response.body.paymentMethods[0]).toHaveProperty('paymentMethodId', 'pm_test123');
      expect(response.body.paymentMethods[0]).toHaveProperty('isDefault', true);
    });
    
    test('should set default payment method successfully', async () => {
      // Add multiple payment methods to the tenant
      testTenant.paymentMethods = [
        {
          paymentMethodId: 'pm_test123',
          type: 'card',
          isDefault: true,
          last4: '4242',
          brand: 'visa',
          expiryMonth: 12,
          expiryYear: 2025,
          createdAt: new Date()
        },
        {
          paymentMethodId: 'pm_test456',
          type: 'card',
          isDefault: false,
          last4: '1234',
          brand: 'mastercard',
          expiryMonth: 11,
          expiryYear: 2024,
          createdAt: new Date()
        }
      ];
      await testTenant.save();
      
      const response = await request(app)
        .put('/api/billing/payment/methods/pm_test456/default')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('paymentMethods');
      
      // Verify the default payment method was updated
      const updatedTenant = await Tenant.findById(testTenant._id);
      const defaultMethod = updatedTenant.paymentMethods.find(pm => pm.isDefault);
      expect(defaultMethod).toHaveProperty('paymentMethodId', 'pm_test456');
      
      // Verify the previous default is no longer default
      const previousDefault = updatedTenant.paymentMethods.find(pm => pm.paymentMethodId === 'pm_test123');
      expect(previousDefault.isDefault).toBe(false);
    });
    
    test('should remove payment method successfully', async () => {
      // Add a payment method to the tenant
      testTenant.paymentMethods = [{
        paymentMethodId: 'pm_test123',
        type: 'card',
        isDefault: true,
        last4: '4242',
        brand: 'visa',
        expiryMonth: 12,
        expiryYear: 2025,
        createdAt: new Date()
      }];
      await testTenant.save();
      
      const response = await request(app)
        .delete('/api/billing/payment/methods/pm_test123')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('paymentMethods');
      expect(response.body.paymentMethods).toHaveLength(0);
      
      // Verify the payment method was removed
      const updatedTenant = await Tenant.findById(testTenant._id);
      expect(updatedTenant.paymentMethods).toHaveLength(0);
    });
  });
  
  describe('Webhook Handling', () => {
    test('should process payment intent succeeded webhook', async () => {
      // Mock the processSuccessfulPayment method
      const processSuccessfulPaymentSpy = jest.spyOn(paymentService, 'processSuccessfulPayment')
        .mockResolvedValue(testSubscription);
      
      const response = await request(app)
        .post('/api/billing/payment/webhook')
        .set('stripe-signature', 'test_signature')
        .send(JSON.stringify({
          id: 'evt_test123',
          type: 'payment_intent.succeeded',
          data: {
            object: {
              id: 'pi_test123',
              metadata: {
                subscriptionId: testSubscription._id.toString(),
                tenantId: testTenant._id.toString()
              },
              status: 'succeeded'
            }
          }
        }));
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('received', true);
      expect(response.body).toHaveProperty('processed', true);
      expect(response.body).toHaveProperty('event', 'payment_intent.succeeded');
      
      // Verify processSuccessfulPayment was called
      expect(processSuccessfulPaymentSpy).toHaveBeenCalledWith('pi_test123');
      
      // Restore the original method
      processSuccessfulPaymentSpy.mockRestore();
    });
    
    test('should return 400 if stripe signature is missing', async () => {
      const response = await request(app)
        .post('/api/billing/payment/webhook')
        .send(JSON.stringify({
          id: 'evt_test123',
          type: 'payment_intent.succeeded',
          data: {
            object: {
              id: 'pi_test123'
            }
          }
        }));
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Missing Stripe signature');
    });
  });
});
