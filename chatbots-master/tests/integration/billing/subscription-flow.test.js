/**
 * Integration Tests for Subscription Flow
 * 
 * Tests the end-to-end subscription process including:
 * - Plan selection
 * - Payment method addition
 * - Subscription creation
 * - Subscription management
 * - Feature access based on subscription tier
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../../src/app');
const User = require('../../../src/auth/models/user.model');
const Tenant = require('../../../src/auth/models/tenant.model');
const Subscription = require('../../../src/billing/models/subscription.model');
const PaymentMethod = require('../../../src/billing/models/payment-method.model');
const subscriptionService = require('../../../src/billing/services/subscription.service');
const featureAccessService = require('../../../src/billing/services/feature-access.service');

// Mock Stripe
jest.mock('../../../src/billing/config/stripe', () => ({
  paymentIntents: {
    create: jest.fn().mockResolvedValue({
      id: 'pi_test123456',
      client_secret: 'pi_test_secret_123456',
      status: 'requires_payment_method'
    }),
    confirm: jest.fn().mockResolvedValue({
      id: 'pi_test123456',
      status: 'succeeded'
    })
  },
  setupIntents: {
    create: jest.fn().mockResolvedValue({
      id: 'seti_test123456',
      client_secret: 'seti_test_secret_123456'
    })
  },
  subscriptions: {
    create: jest.fn().mockResolvedValue({
      id: 'sub_test123456',
      status: 'active',
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
    }),
    update: jest.fn().mockResolvedValue({
      id: 'sub_test123456',
      status: 'active'
    }),
    del: jest.fn().mockResolvedValue({
      id: 'sub_test123456',
      status: 'canceled'
    })
  },
  customers: {
    create: jest.fn().mockResolvedValue({
      id: 'cus_test123456'
    }),
    update: jest.fn().mockResolvedValue({
      id: 'cus_test123456'
    })
  },
  paymentMethods: {
    attach: jest.fn().mockResolvedValue({
      id: 'pm_test123456'
    }),
    detach: jest.fn().mockResolvedValue({
      id: 'pm_test123456'
    })
  }
}));

// Mock email service
jest.mock('../../../src/notifications/services/email.service', () => ({
  sendEmail: jest.fn().mockResolvedValue(true)
}));

describe('Subscription Flow Integration Tests', () => {
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
    await Subscription.deleteMany({});
    await PaymentMethod.deleteMany({});
    
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
  
  describe('End-to-End Subscription Flow', () => {
    it('should complete the full subscription lifecycle', async () => {
      // Step 1: Get available plans
      const plansResponse = await request(app)
        .get('/api/billing/plans')
        .set('Authorization', `Bearer ${token}`);
      
      expect(plansResponse.status).toBe(200);
      expect(plansResponse.body.plans).toBeDefined();
      expect(plansResponse.body.plans.length).toBeGreaterThan(0);
      
      const testPlanId = plansResponse.body.plans[0].id;
      
      // Step 2: Create setup intent for payment method
      const setupIntentResponse = await request(app)
        .post('/api/billing/payment-methods/setup-intent')
        .set('Authorization', `Bearer ${token}`);
      
      expect(setupIntentResponse.status).toBe(200);
      expect(setupIntentResponse.body.clientSecret).toBeDefined();
      
      // Step 3: Add payment method (simulate successful addition)
      const paymentMethodResponse = await request(app)
        .post('/api/billing/payment-methods')
        .set('Authorization', `Bearer ${token}`)
        .send({
          paymentMethodId: 'pm_test123456',
          billingDetails: {
            name: 'Test User',
            email: 'test@example.com'
          }
        });
      
      expect(paymentMethodResponse.status).toBe(201);
      expect(paymentMethodResponse.body.paymentMethod).toBeDefined();
      expect(paymentMethodResponse.body.paymentMethod.last4).toBeDefined();
      
      // Step 4: Create subscription
      const subscriptionResponse = await request(app)
        .post('/api/billing/subscriptions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          planId: testPlanId,
          paymentMethodId: paymentMethodResponse.body.paymentMethod.id
        });
      
      expect(subscriptionResponse.status).toBe(201);
      expect(subscriptionResponse.body.subscription).toBeDefined();
      expect(subscriptionResponse.body.subscription.status).toBe('active');
      
      const subscriptionId = subscriptionResponse.body.subscription.id;
      
      // Step 5: Verify subscription details
      const subscriptionDetailsResponse = await request(app)
        .get(`/api/billing/subscriptions/${subscriptionId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(subscriptionDetailsResponse.status).toBe(200);
      expect(subscriptionDetailsResponse.body.subscription).toBeDefined();
      expect(subscriptionDetailsResponse.body.subscription.id).toBe(subscriptionId);
      
      // Step 6: Verify feature access based on subscription tier
      const featureAccessResponse = await request(app)
        .get('/api/billing/feature-access/advanced_analytics')
        .set('Authorization', `Bearer ${token}`);
      
      // This should match the expected access level based on the subscription plan
      expect(featureAccessResponse.status).toBe(200);
      
      // Step 7: Update subscription (change plan)
      const plansForUpgrade = plansResponse.body.plans.filter(plan => 
        plan.id !== testPlanId && plan.price > plansResponse.body.plans[0].price
      );
      
      if (plansForUpgrade.length > 0) {
        const upgradePlanId = plansForUpgrade[0].id;
        
        const updateSubscriptionResponse = await request(app)
          .put(`/api/billing/subscriptions/${subscriptionId}`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            planId: upgradePlanId
          });
        
        expect(updateSubscriptionResponse.status).toBe(200);
        expect(updateSubscriptionResponse.body.subscription).toBeDefined();
        expect(updateSubscriptionResponse.body.subscription.planId).toBe(upgradePlanId);
      }
      
      // Step 8: Cancel subscription
      const cancelSubscriptionResponse = await request(app)
        .delete(`/api/billing/subscriptions/${subscriptionId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(cancelSubscriptionResponse.status).toBe(200);
      expect(cancelSubscriptionResponse.body.subscription).toBeDefined();
      expect(cancelSubscriptionResponse.body.subscription.status).toBe('canceled');
    });
  });
  
  describe('Free Trial Flow', () => {
    it('should complete the free trial lifecycle', async () => {
      // Step 1: Start free trial
      const startTrialResponse = await request(app)
        .post('/api/billing/trials')
        .set('Authorization', `Bearer ${token}`)
        .send({
          planId: 'pro_monthly' // Assuming this is a valid plan ID
        });
      
      expect(startTrialResponse.status).toBe(201);
      expect(startTrialResponse.body.trial).toBeDefined();
      expect(startTrialResponse.body.trial.status).toBe('active');
      expect(startTrialResponse.body.trial.expiresAt).toBeDefined();
      
      const trialId = startTrialResponse.body.trial.id;
      
      // Step 2: Check trial status
      const trialStatusResponse = await request(app)
        .get(`/api/billing/trials/${trialId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(trialStatusResponse.status).toBe(200);
      expect(trialStatusResponse.body.trial).toBeDefined();
      expect(trialStatusResponse.body.trial.status).toBe('active');
      
      // Step 3: Verify feature access during trial
      const featureAccessResponse = await request(app)
        .get('/api/billing/feature-access/pro_features')
        .set('Authorization', `Bearer ${token}`);
      
      expect(featureAccessResponse.status).toBe(200);
      expect(featureAccessResponse.body.hasAccess).toBe(true);
      
      // Step 4: Convert trial to paid subscription
      const convertTrialResponse = await request(app)
        .post(`/api/billing/trials/${trialId}/convert`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          paymentMethodId: 'pm_test123456'
        });
      
      expect(convertTrialResponse.status).toBe(200);
      expect(convertTrialResponse.body.subscription).toBeDefined();
      expect(convertTrialResponse.body.subscription.status).toBe('active');
      
      // Step 5: Verify trial is now converted
      const trialAfterConversionResponse = await request(app)
        .get(`/api/billing/trials/${trialId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(trialAfterConversionResponse.status).toBe(200);
      expect(trialAfterConversionResponse.body.trial).toBeDefined();
      expect(trialAfterConversionResponse.body.trial.status).toBe('converted');
    });
  });
  
  describe('Coupon Redemption Flow', () => {
    it('should apply coupon to subscription', async () => {
      // Step 1: Create a coupon (normally done by admin)
      const coupon = await mongoose.model('Coupon').create({
        code: 'TEST25OFF',
        type: 'percentage',
        value: 25,
        description: 'Test coupon for 25% off',
        duration: 'once',
        active: true,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
      
      // Step 2: Get available plans
      const plansResponse = await request(app)
        .get('/api/billing/plans')
        .set('Authorization', `Bearer ${token}`);
      
      const testPlanId = plansResponse.body.plans[0].id;
      
      // Step 3: Validate coupon
      const validateCouponResponse = await request(app)
        .post('/api/billing/coupons/validate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          code: 'TEST25OFF',
          planId: testPlanId
        });
      
      expect(validateCouponResponse.status).toBe(200);
      expect(validateCouponResponse.body.valid).toBe(true);
      expect(validateCouponResponse.body.discount).toBeDefined();
      
      // Step 4: Create subscription with coupon
      const subscriptionResponse = await request(app)
        .post('/api/billing/subscriptions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          planId: testPlanId,
          paymentMethodId: 'pm_test123456',
          couponCode: 'TEST25OFF'
        });
      
      expect(subscriptionResponse.status).toBe(201);
      expect(subscriptionResponse.body.subscription).toBeDefined();
      expect(subscriptionResponse.body.subscription.discount).toBeDefined();
      expect(subscriptionResponse.body.subscription.discount.percentage).toBe(25);
    });
  });
});
