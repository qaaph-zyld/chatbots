/**
 * Integration Tests for Payment Monitoring
 * 
 * Tests the end-to-end payment monitoring functionality including:
 * - Alert generation for payment failures
 * - Payment status tracking
 * - Multi-tenant isolation for payment data
 * - Performance monitoring for payment operations
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../../src/app');
const User = require('../../../src/auth/models/user.model');
const Tenant = require('../../../src/tenancy/models/tenant.model');
const PaymentAttempt = require('../../../src/billing/models/payment-attempt.model');
const PaymentAlert = require('../../../src/billing/models/payment-alert.model');
const jwt = require('jsonwebtoken');
const config = require('../../../src/core/config');
const paymentMonitoringService = require('../../../src/billing/services/payment-monitoring.service');
const notificationService = require('../../../src/notifications/services/notification.service');

// Mock notification service
jest.mock('../../../src/notifications/services/notification.service', () => ({
  sendAlert: jest.fn().mockResolvedValue(true),
  sendNotification: jest.fn().mockResolvedValue(true)
}));

// Mock Stripe with various payment scenarios
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
        // Simulate different payment statuses based on ID
        if (id.includes('failed')) {
          return Promise.resolve({
            id,
            status: 'failed',
            last_payment_error: {
              code: 'card_declined',
              message: 'Your card was declined'
            }
          });
        } else if (id.includes('pending')) {
          return Promise.resolve({
            id,
            status: 'processing'
          });
        } else {
          return Promise.resolve({
            id,
            status: 'succeeded'
          });
        }
      })
    },
    webhooks: {
      constructEvent: jest.fn().mockImplementation((body, signature, secret) => {
        const payload = JSON.parse(body);
        return {
          id: 'evt_test123',
          type: payload.type || 'payment_intent.succeeded',
          data: {
            object: payload.data || {
              id: 'pi_test123',
              status: payload.status || 'succeeded'
            }
          }
        };
      })
    }
  }));
});

describe('Payment Monitoring Integration Tests', () => {
  let mongoServer;
  let adminToken;
  let userToken;
  let testAdmin;
  let testUser;
  let testTenant;
  let secondTenant;
  
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    
    // Create test tenants
    testTenant = await Tenant.create({
      name: 'Test Tenant',
      status: 'active',
      subscription: {
        plan: 'premium',
        status: 'active'
      }
    });
    
    secondTenant = await Tenant.create({
      name: 'Second Tenant',
      status: 'active',
      subscription: {
        plan: 'basic',
        status: 'active'
      }
    });
    
    // Create test users
    testAdmin = await User.create({
      email: 'admin@example.com',
      password: 'Password123!',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      tenantId: testTenant._id
    });
    
    testUser = await User.create({
      email: 'user@example.com',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
      tenantId: secondTenant._id
    });
    
    // Generate tokens
    adminToken = jwt.sign(
      { id: testAdmin._id, email: testAdmin.email, role: testAdmin.role, tenantId: testAdmin.tenantId },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
    
    userToken = jwt.sign(
      { id: testUser._id, email: testUser.email, role: testUser.role, tenantId: testUser.tenantId },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
    
    // Create test payment attempts
    await PaymentAttempt.create({
      tenantId: testTenant._id,
      paymentIntentId: 'pi_success_test123',
      amount: 9900,
      currency: 'usd',
      status: 'succeeded',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await PaymentAttempt.create({
      tenantId: testTenant._id,
      paymentIntentId: 'pi_failed_test123',
      amount: 9900,
      currency: 'usd',
      status: 'failed',
      errorCode: 'card_declined',
      errorMessage: 'Your card was declined',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await PaymentAttempt.create({
      tenantId: secondTenant._id,
      paymentIntentId: 'pi_success_second123',
      amount: 4900,
      currency: 'usd',
      status: 'succeeded',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });
  
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });
  
  describe('Payment Status Monitoring', () => {
    test('should retrieve payment status correctly', async () => {
      const response = await request(app)
        .get('/api/billing/payments/pi_success_test123/status')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('succeeded');
    });
    
    test('should handle failed payment status', async () => {
      const response = await request(app)
        .get('/api/billing/payments/pi_failed_test123/status')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('failed');
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('card_declined');
    });
  });
  
  describe('Payment Alerts', () => {
    test('should generate alert for failed payment', async () => {
      // Mock webhook event for failed payment
      const webhookPayload = {
        type: 'payment_intent.payment_failed',
        data: {
          id: 'pi_webhook_failed',
          status: 'failed',
          last_payment_error: {
            code: 'insufficient_funds',
            message: 'Your card has insufficient funds'
          },
          metadata: {
            tenantId: testTenant._id.toString()
          }
        }
      };
      
      const response = await request(app)
        .post('/api/billing/webhook')
        .send(webhookPayload)
        .set('Stripe-Signature', 'test_signature');
      
      expect(response.status).toBe(200);
      
      // Verify alert was created
      const alerts = await PaymentAlert.find({ tenantId: testTenant._id });
      expect(alerts.length).toBeGreaterThan(0);
      
      // Verify notification was sent
      expect(notificationService.sendAlert).toHaveBeenCalled();
    });
    
    test('should list payment alerts for tenant', async () => {
      const response = await request(app)
        .get('/api/billing/payment-alerts')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      // All alerts should belong to the admin's tenant
      response.body.forEach(alert => {
        expect(alert.tenantId).toBe(testTenant._id.toString());
      });
    });
  });
  
  describe('Multi-Tenant Isolation', () => {
    test('should enforce tenant isolation for payment data', async () => {
      // User from second tenant should not see first tenant's payment attempts
      const response = await request(app)
        .get('/api/billing/payment-attempts')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      // Should only see payment attempts for their own tenant
      response.body.forEach(attempt => {
        expect(attempt.tenantId).toBe(secondTenant._id.toString());
      });
      
      // Verify no cross-tenant data leakage
      const hasFirstTenantData = response.body.some(
        attempt => attempt.tenantId === testTenant._id.toString()
      );
      expect(hasFirstTenantData).toBe(false);
    });
    
    test('should prevent access to another tenant\'s payment details', async () => {
      // User from second tenant tries to access first tenant's payment
      const response = await request(app)
        .get(`/api/billing/payments/pi_success_test123/status`)
        .set('Authorization', `Bearer ${userToken}`);
      
      // Should be forbidden
      expect(response.status).toBe(403);
    });
  });
  
  describe('Performance Monitoring', () => {
    test('should track payment operation performance', async () => {
      // Create a spy on the performance monitoring method
      const perfMonitorSpy = jest.spyOn(paymentMonitoringService, 'recordPerformanceMetric');
      
      // Make a payment-related request
      await request(app)
        .get('/api/billing/payment-methods')
        .set('Authorization', `Bearer ${adminToken}`);
      
      // Verify performance was recorded
      expect(perfMonitorSpy).toHaveBeenCalled();
    });
  });
});
