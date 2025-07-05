/**
 * Integration Tests for Payment Multi-Tenant Isolation
 * 
 * Tests the end-to-end multi-tenant isolation for payment processing including:
 * - Tenant-specific payment method isolation
 * - Cross-tenant access prevention
 * - Tenant data segregation in payment operations
 * - Enhanced security features for payment data
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../../src/app');
const User = require('../../../src/auth/models/user.model');
const Tenant = require('../../../src/tenancy/models/tenant.model');
const PaymentMethod = require('../../../src/billing/models/payment-method.model');
const Subscription = require('../../../src/billing/models/subscription.model');
const jwt = require('jsonwebtoken');
const config = require('../../../src/core/config');

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
      retrieve: jest.fn().mockImplementation((id) => {
        return Promise.resolve({
          id,
          status: 'succeeded',
          metadata: {
            tenantId: id.includes('tenant1') ? 'tenant1_id' : 'tenant2_id'
          }
        });
      })
    },
    paymentMethods: {
      list: jest.fn().mockImplementation(({ customer }) => {
        // Return different payment methods based on customer ID
        if (customer.includes('tenant1')) {
          return Promise.resolve({
            data: [
              {
                id: 'pm_tenant1_card1',
                type: 'card',
                card: { last4: '4242', brand: 'visa' }
              }
            ]
          });
        } else {
          return Promise.resolve({
            data: [
              {
                id: 'pm_tenant2_card1',
                type: 'card',
                card: { last4: '1234', brand: 'mastercard' }
              }
            ]
          });
        }
      }),
      retrieve: jest.fn().mockImplementation((id) => {
        return Promise.resolve({
          id,
          type: 'card',
          card: {
            last4: id.includes('tenant1') ? '4242' : '1234',
            brand: id.includes('tenant1') ? 'visa' : 'mastercard'
          }
        });
      })
    },
    customers: {
      retrieve: jest.fn().mockImplementation((id) => {
        return Promise.resolve({
          id,
          name: id.includes('tenant1') ? 'Tenant 1 Customer' : 'Tenant 2 Customer'
        });
      })
    }
  }));
});

describe('Payment Multi-Tenant Isolation Tests', () => {
  let mongoServer;
  let tenant1Token;
  let tenant2Token;
  let adminToken;
  let tenant1User;
  let tenant2User;
  let adminUser;
  let tenant1;
  let tenant2;
  
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    
    // Create test tenants
    tenant1 = await Tenant.create({
      name: 'Tenant 1',
      status: 'active',
      stripeCustomerId: 'cus_tenant1_id',
      subscription: {
        plan: 'premium',
        status: 'active'
      }
    });
    
    tenant2 = await Tenant.create({
      name: 'Tenant 2',
      status: 'active',
      stripeCustomerId: 'cus_tenant2_id',
      subscription: {
        plan: 'basic',
        status: 'active'
      }
    });
    
    // Create test users
    tenant1User = await User.create({
      email: 'user1@tenant1.com',
      password: 'Password123!',
      firstName: 'Tenant1',
      lastName: 'User',
      role: 'user',
      tenantId: tenant1._id
    });
    
    tenant2User = await User.create({
      email: 'user1@tenant2.com',
      password: 'Password123!',
      firstName: 'Tenant2',
      lastName: 'User',
      role: 'user',
      tenantId: tenant2._id
    });
    
    adminUser = await User.create({
      email: 'admin@example.com',
      password: 'Password123!',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    });
    
    // Generate tokens
    tenant1Token = jwt.sign(
      { id: tenant1User._id, email: tenant1User.email, role: tenant1User.role, tenantId: tenant1User.tenantId },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
    
    tenant2Token = jwt.sign(
      { id: tenant2User._id, email: tenant2User.email, role: tenant2User.role, tenantId: tenant2User.tenantId },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
    
    adminToken = jwt.sign(
      { id: adminUser._id, email: adminUser.email, role: adminUser.role },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
    
    // Create payment methods for each tenant
    await PaymentMethod.create({
      tenantId: tenant1._id,
      paymentMethodId: 'pm_tenant1_card1',
      type: 'card',
      last4: '4242',
      brand: 'visa',
      isDefault: true
    });
    
    await PaymentMethod.create({
      tenantId: tenant2._id,
      paymentMethodId: 'pm_tenant2_card1',
      type: 'card',
      last4: '1234',
      brand: 'mastercard',
      isDefault: true
    });
    
    // Create subscriptions for each tenant
    await Subscription.create({
      tenantId: tenant1._id,
      stripeSubscriptionId: 'sub_tenant1_id',
      plan: 'premium',
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
    
    await Subscription.create({
      tenantId: tenant2._id,
      stripeSubscriptionId: 'sub_tenant2_id',
      plan: 'basic',
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
  });
  
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });
  
  describe('Payment Method Isolation', () => {
    test('should only return payment methods for tenant1', async () => {
      const response = await request(app)
        .get('/api/billing/payment-methods')
        .set('Authorization', `Bearer ${tenant1Token}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].paymentMethodId).toBe('pm_tenant1_card1');
    });
    
    test('should only return payment methods for tenant2', async () => {
      const response = await request(app)
        .get('/api/billing/payment-methods')
        .set('Authorization', `Bearer ${tenant2Token}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].paymentMethodId).toBe('pm_tenant2_card1');
    });
    
    test('should prevent tenant1 from accessing tenant2 payment methods', async () => {
      const response = await request(app)
        .get(`/api/billing/payment-methods/${tenant2._id}`)
        .set('Authorization', `Bearer ${tenant1Token}`);
      
      expect(response.status).toBe(403);
    });
  });
  
  describe('Subscription Isolation', () => {
    test('should only return subscription for tenant1', async () => {
      const response = await request(app)
        .get('/api/billing/subscriptions/current')
        .set('Authorization', `Bearer ${tenant1Token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.stripeSubscriptionId).toBe('sub_tenant1_id');
      expect(response.body.plan).toBe('premium');
    });
    
    test('should only return subscription for tenant2', async () => {
      const response = await request(app)
        .get('/api/billing/subscriptions/current')
        .set('Authorization', `Bearer ${tenant2Token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.stripeSubscriptionId).toBe('sub_tenant2_id');
      expect(response.body.plan).toBe('basic');
    });
    
    test('should prevent tenant1 from accessing tenant2 subscription', async () => {
      const response = await request(app)
        .get(`/api/billing/subscriptions/${tenant2._id}`)
        .set('Authorization', `Bearer ${tenant1Token}`);
      
      expect(response.status).toBe(403);
    });
  });
  
  describe('Payment Intent Isolation', () => {
    test('should create payment intent with tenant1 metadata', async () => {
      const response = await request(app)
        .post('/api/billing/payment-intents')
        .send({ amount: 9900, currency: 'usd' })
        .set('Authorization', `Bearer ${tenant1Token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.clientSecret).toBeDefined();
      
      // Verify tenant isolation middleware added tenant metadata
      const stripeService = require('stripe')();
      expect(stripeService.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            tenantId: tenant1._id.toString()
          })
        })
      );
    });
    
    test('should prevent access to another tenant\'s payment intent', async () => {
      // Create a payment intent for tenant1
      const createResponse = await request(app)
        .post('/api/billing/payment-intents')
        .send({ amount: 9900, currency: 'usd' })
        .set('Authorization', `Bearer ${tenant1Token}`);
      
      const paymentIntentId = createResponse.body.paymentIntentId;
      
      // Tenant2 tries to access tenant1's payment intent
      const response = await request(app)
        .get(`/api/billing/payment-intents/${paymentIntentId}`)
        .set('Authorization', `Bearer ${tenant2Token}`);
      
      expect(response.status).toBe(403);
    });
  });
  
  describe('Admin Access Controls', () => {
    test('should allow admin to access tenant1 payment methods', async () => {
      const response = await request(app)
        .get(`/api/billing/admin/tenants/${tenant1._id}/payment-methods`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].paymentMethodId).toBe('pm_tenant1_card1');
    });
    
    test('should allow admin to access tenant2 payment methods', async () => {
      const response = await request(app)
        .get(`/api/billing/admin/tenants/${tenant2._id}/payment-methods`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].paymentMethodId).toBe('pm_tenant2_card1');
    });
    
    test('should prevent non-admin from accessing admin endpoints', async () => {
      const response = await request(app)
        .get(`/api/billing/admin/tenants/${tenant2._id}/payment-methods`)
        .set('Authorization', `Bearer ${tenant1Token}`);
      
      expect(response.status).toBe(403);
    });
  });
  
  describe('Enhanced Security Features', () => {
    test('should validate tenant status before allowing payment operations', async () => {
      // Update tenant1 status to inactive
      await Tenant.findByIdAndUpdate(tenant1._id, { status: 'suspended' });
      
      // Attempt payment operation with suspended tenant
      const response = await request(app)
        .post('/api/billing/payment-intents')
        .send({ amount: 9900, currency: 'usd' })
        .set('Authorization', `Bearer ${tenant1Token}`);
      
      expect(response.status).toBe(403);
      expect(response.body.message).toContain('suspended');
      
      // Restore tenant status for other tests
      await Tenant.findByIdAndUpdate(tenant1._id, { status: 'active' });
    });
    
    test('should enforce strict tenant isolation with cache bypass', async () => {
      // First request - normal request with caching
      const firstResponse = await request(app)
        .get('/api/billing/payment-methods')
        .set('Authorization', `Bearer ${tenant1Token}`);
      
      expect(firstResponse.status).toBe(200);
      
      // Add a new payment method directly to DB
      await PaymentMethod.create({
        tenantId: tenant1._id,
        paymentMethodId: 'pm_tenant1_card2',
        type: 'card',
        last4: '9999',
        brand: 'amex',
        isDefault: false
      });
      
      // Second request with cache bypass should see the new payment method
      const secondResponse = await request(app)
        .get('/api/billing/payment-methods')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .set('x-bypass-cache', 'true');
      
      expect(secondResponse.status).toBe(200);
      expect(secondResponse.body.length).toBe(2);
      expect(secondResponse.body.some(pm => pm.paymentMethodId === 'pm_tenant1_card2')).toBe(true);
    });
  });
});
