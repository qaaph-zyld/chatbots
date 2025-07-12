/**
 * Subscription Service Unit Tests
 * 
 * Tests for the subscription service functionality
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const subscriptionService = require('../../../src/billing/services/subscription.service');
const Subscription = require('../../../src/billing/models/subscription.model');
const PaymentService = require('../../../src/billing/services/payment.service');
const TrialService = require('../../../src/billing/services/trial.service');
const CouponService = require('../../../src/billing/services/coupon.service');

// Mock dependencies
jest.mock('../../../src/billing/services/payment.service');
jest.mock('../../../src/billing/services/trial.service');
jest.mock('../../../src/billing/services/coupon.service');
jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));

// MongoDB Memory Server for testing
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Clear database collections
  await Subscription.deleteMany({});
  
  // Setup mock implementations
  PaymentService.prototype.createPaymentIntent = jest.fn().mockResolvedValue({
    id: 'pi_mock_123',
    status: 'succeeded'
  });
  
  TrialService.prototype.getActiveTrial = jest.fn().mockResolvedValue(null);
  TrialService.prototype.convertTrialToSubscription = jest.fn().mockResolvedValue({
    _id: 'sub_mock_123',
    status: 'active'
  });
  
  CouponService.prototype.validateCoupon = jest.fn().mockResolvedValue({
    valid: false
  });
  CouponService.prototype.calculateDiscountedPrice = jest.fn().mockImplementation(
    (price, coupon) => price * 0.9 // 10% discount
  );
});

describe('Subscription Service', () => {
  describe('createSubscription', () => {
    it('should create a new subscription successfully', async () => {
      // Arrange
      const subscriptionData = {
        userId: 'user_123',
        tenantId: 'tenant_123',
        planId: 'basic_monthly',
        paymentMethodId: 'pm_123',
        autoRenew: true
      };
      
      // Act
      const result = await subscriptionService.createSubscription(subscriptionData);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.userId).toBe(subscriptionData.userId);
      expect(result.tenantId).toBe(subscriptionData.tenantId);
      expect(result.planId).toBe(subscriptionData.planId);
      expect(result.status).toBe('active');
      expect(PaymentService.prototype.createPaymentIntent).toHaveBeenCalled();
    });
    
    it('should apply coupon discount when valid coupon is provided', async () => {
      // Arrange
      const subscriptionData = {
        userId: 'user_123',
        tenantId: 'tenant_123',
        planId: 'basic_monthly',
        paymentMethodId: 'pm_123',
        couponCode: 'VALID10',
        autoRenew: true
      };
      
      CouponService.prototype.validateCoupon = jest.fn().mockResolvedValue({
        valid: true,
        coupon: {
          code: 'VALID10',
          discountPercentage: 10
        }
      });
      
      // Act
      const result = await subscriptionService.createSubscription(subscriptionData);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.couponCode).toBe(subscriptionData.couponCode);
      expect(result.discountedPrice).toBeLessThan(result.price);
      expect(CouponService.prototype.validateCoupon).toHaveBeenCalledWith('VALID10');
      expect(CouponService.prototype.calculateDiscountedPrice).toHaveBeenCalled();
    });
    
    it('should convert trial to subscription when active trial exists', async () => {
      // Arrange
      const subscriptionData = {
        userId: 'user_123',
        tenantId: 'tenant_123',
        planId: 'basic_monthly',
        paymentMethodId: 'pm_123',
        autoRenew: true
      };
      
      TrialService.prototype.getActiveTrial = jest.fn().mockResolvedValue({
        _id: 'trial_123',
        planId: 'basic_monthly',
        status: 'active'
      });
      
      // Act
      const result = await subscriptionService.createSubscription(subscriptionData);
      
      // Assert
      expect(result).toBeDefined();
      expect(result._id).toBe('sub_mock_123');
      expect(TrialService.prototype.getActiveTrial).toHaveBeenCalledWith(subscriptionData.tenantId);
      expect(TrialService.prototype.convertTrialToSubscription).toHaveBeenCalledWith({
        trialId: 'trial_123',
        paymentMethodId: 'pm_123'
      });
    });
    
    it('should throw error when plan not found', async () => {
      // Arrange
      const subscriptionData = {
        userId: 'user_123',
        tenantId: 'tenant_123',
        planId: 'nonexistent_plan',
        paymentMethodId: 'pm_123',
        autoRenew: true
      };
      
      // Mock getPlan to return null for nonexistent plan
      const originalGetPlan = subscriptionService.getPlan;
      subscriptionService.getPlan = jest.fn().mockResolvedValue(null);
      
      // Act & Assert
      await expect(subscriptionService.createSubscription(subscriptionData))
        .rejects.toThrow('Plan nonexistent_plan not found');
      
      // Restore original method
      subscriptionService.getPlan = originalGetPlan;
    });
  });
  
  describe('getSubscription', () => {
    it('should return subscription by ID', async () => {
      // Arrange
      const subscription = new Subscription({
        userId: 'user_123',
        tenantId: 'tenant_123',
        planId: 'basic_monthly',
        planName: 'Basic Plan (Monthly)',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: true,
        price: 999,
        currency: 'usd',
        paymentMethodId: 'pm_123',
        paymentIntentId: 'pi_123',
        features: ['basic_chat', 'standard_templates']
      });
      
      await subscription.save();
      
      // Act
      const result = await subscriptionService.getSubscription(subscription._id);
      
      // Assert
      expect(result).toBeDefined();
      expect(result._id.toString()).toBe(subscription._id.toString());
      expect(result.planId).toBe(subscription.planId);
    });
    
    it('should return null when subscription not found', async () => {
      // Arrange
      const nonExistentId = new mongoose.Types.ObjectId();
      
      // Act
      const result = await subscriptionService.getSubscription(nonExistentId);
      
      // Assert
      expect(result).toBeNull();
    });
  });
  
  describe('getActiveSubscription', () => {
    it('should return active subscription for tenant', async () => {
      // Arrange
      const tenantId = 'tenant_123';
      const subscription = new Subscription({
        userId: 'user_123',
        tenantId,
        planId: 'basic_monthly',
        planName: 'Basic Plan (Monthly)',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: true,
        price: 999,
        currency: 'usd',
        paymentMethodId: 'pm_123',
        paymentIntentId: 'pi_123',
        features: ['basic_chat', 'standard_templates']
      });
      
      await subscription.save();
      
      // Act
      const result = await subscriptionService.getActiveSubscription(tenantId);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.tenantId).toBe(tenantId);
      expect(result.status).toBe('active');
    });
    
    it('should return null when no active subscription exists', async () => {
      // Arrange
      const tenantId = 'tenant_without_subscription';
      
      // Act
      const result = await subscriptionService.getActiveSubscription(tenantId);
      
      // Assert
      expect(result).toBeNull();
    });
  });
  
  describe('cancelSubscription', () => {
    it('should cancel subscription immediately', async () => {
      // Arrange
      const subscription = new Subscription({
        userId: 'user_123',
        tenantId: 'tenant_123',
        planId: 'basic_monthly',
        planName: 'Basic Plan (Monthly)',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: true,
        price: 999,
        currency: 'usd',
        paymentMethodId: 'pm_123',
        paymentIntentId: 'pi_123',
        features: ['basic_chat', 'standard_templates']
      });
      
      await subscription.save();
      
      // Act
      const result = await subscriptionService.cancelSubscription(subscription._id, {
        immediate: true,
        reason: 'Testing cancellation'
      });
      
      // Assert
      expect(result).toBeDefined();
      expect(result.status).toBe('canceled');
      expect(result.cancelReason).toBe('Testing cancellation');
      expect(result.canceledAt).toBeDefined();
    });
    
    it('should set subscription to not auto-renew when immediate is false', async () => {
      // Arrange
      const subscription = new Subscription({
        userId: 'user_123',
        tenantId: 'tenant_123',
        planId: 'basic_monthly',
        planName: 'Basic Plan (Monthly)',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: true,
        price: 999,
        currency: 'usd',
        paymentMethodId: 'pm_123',
        paymentIntentId: 'pi_123',
        features: ['basic_chat', 'standard_templates']
      });
      
      await subscription.save();
      
      // Act
      const result = await subscriptionService.cancelSubscription(subscription._id, {
        immediate: false,
        reason: 'Cancel at period end'
      });
      
      // Assert
      expect(result).toBeDefined();
      expect(result.status).toBe('active');
      expect(result.autoRenew).toBe(false);
      expect(result.cancelReason).toBe('Cancel at period end');
      expect(result.canceledAt).toBeDefined();
    });
    
    it('should throw error when subscription not found', async () => {
      // Arrange
      const nonExistentId = new mongoose.Types.ObjectId();
      
      // Act & Assert
      await expect(subscriptionService.cancelSubscription(nonExistentId))
        .rejects.toThrow(`Subscription ${nonExistentId} not found`);
    });
  });
  
  describe('changeSubscriptionPlan', () => {
    it('should change subscription plan successfully', async () => {
      // Arrange
      const subscription = new Subscription({
        userId: 'user_123',
        tenantId: 'tenant_123',
        planId: 'basic_monthly',
        planName: 'Basic Plan (Monthly)',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: true,
        price: 999,
        currency: 'usd',
        paymentMethodId: 'pm_123',
        paymentIntentId: 'pi_123',
        features: ['basic_chat', 'standard_templates']
      });
      
      await subscription.save();
      
      // Act
      const result = await subscriptionService.changeSubscriptionPlan(subscription._id, 'pro_monthly');
      
      // Assert
      expect(result).toBeDefined();
      expect(result.planId).toBe('pro_monthly');
      expect(result.planName).toBe('Pro Plan (Monthly)');
      expect(PaymentService.prototype.createPaymentIntent).toHaveBeenCalled();
    });
    
    it('should throw error when subscription not found', async () => {
      // Arrange
      const nonExistentId = new mongoose.Types.ObjectId();
      
      // Act & Assert
      await expect(subscriptionService.changeSubscriptionPlan(nonExistentId, 'pro_monthly'))
        .rejects.toThrow(`Subscription ${nonExistentId} not found`);
    });
    
    it('should throw error when new plan not found', async () => {
      // Arrange
      const subscription = new Subscription({
        userId: 'user_123',
        tenantId: 'tenant_123',
        planId: 'basic_monthly',
        planName: 'Basic Plan (Monthly)',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: true,
        price: 999,
        currency: 'usd',
        paymentMethodId: 'pm_123',
        paymentIntentId: 'pi_123',
        features: ['basic_chat', 'standard_templates']
      });
      
      await subscription.save();
      
      // Mock getPlan to return null for nonexistent plan
      const originalGetPlan = subscriptionService.getPlan;
      subscriptionService.getPlan = jest.fn()
        .mockImplementation(planId => {
          if (planId === 'basic_monthly') {
            return Promise.resolve({
              id: 'basic_monthly',
              name: 'Basic Plan (Monthly)',
              price: 999,
              currency: 'usd',
              interval: 'month',
              features: ['basic_chat', 'standard_templates']
            });
          }
          return Promise.resolve(null);
        });
      
      // Act & Assert
      await expect(subscriptionService.changeSubscriptionPlan(subscription._id, 'nonexistent_plan'))
        .rejects.toThrow('Plan nonexistent_plan not found');
      
      // Restore original method
      subscriptionService.getPlan = originalGetPlan;
    });
  });
  
  describe('hasFeatureAccess', () => {
    it('should return true when subscription has feature access', async () => {
      // Arrange
      const tenantId = 'tenant_123';
      const subscription = new Subscription({
        userId: 'user_123',
        tenantId,
        planId: 'pro_monthly',
        planName: 'Pro Plan (Monthly)',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: true,
        price: 2999,
        currency: 'usd',
        paymentMethodId: 'pm_123',
        paymentIntentId: 'pi_123',
        features: ['basic_chat', 'advanced_chat', 'standard_templates']
      });
      
      await subscription.save();
      
      // Act
      const result = await subscriptionService.hasFeatureAccess(tenantId, 'advanced_chat');
      
      // Assert
      expect(result).toBe(true);
    });
    
    it('should return false when subscription does not have feature access', async () => {
      // Arrange
      const tenantId = 'tenant_123';
      const subscription = new Subscription({
        userId: 'user_123',
        tenantId,
        planId: 'basic_monthly',
        planName: 'Basic Plan (Monthly)',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: true,
        price: 999,
        currency: 'usd',
        paymentMethodId: 'pm_123',
        paymentIntentId: 'pi_123',
        features: ['basic_chat', 'standard_templates']
      });
      
      await subscription.save();
      
      // Act
      const result = await subscriptionService.hasFeatureAccess(tenantId, 'advanced_chat');
      
      // Assert
      expect(result).toBe(false);
    });
    
    it('should check trial for feature access when no active subscription', async () => {
      // Arrange
      const tenantId = 'tenant_123';
      
      // Mock trial service to return active trial
      TrialService.prototype.getActiveTrial = jest.fn().mockResolvedValue({
        _id: 'trial_123',
        planId: 'pro_monthly',
        status: 'active'
      });
      
      // Act
      const result = await subscriptionService.hasFeatureAccess(tenantId, 'advanced_chat');
      
      // Assert
      expect(result).toBe(true);
      expect(TrialService.prototype.getActiveTrial).toHaveBeenCalledWith(tenantId);
    });
  });
  
  describe('renewSubscription', () => {
    it('should renew subscription successfully', async () => {
      // Arrange
      const subscription = new Subscription({
        userId: 'user_123',
        tenantId: 'tenant_123',
        planId: 'basic_monthly',
        planName: 'Basic Plan (Monthly)',
        status: 'active',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        autoRenew: true,
        price: 999,
        discountedPrice: 999,
        currency: 'usd',
        paymentMethodId: 'pm_123',
        paymentIntentId: 'pi_123',
        features: ['basic_chat', 'standard_templates']
      });
      
      await subscription.save();
      
      // Act
      const result = await subscriptionService.renewSubscription(subscription._id);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.renewedAt).toBeDefined();
      expect(new Date(result.endDate).getTime()).toBeGreaterThan(new Date().getTime());
      expect(PaymentService.prototype.createPaymentIntent).toHaveBeenCalled();
    });
    
    it('should mark subscription as expired when autoRenew is false', async () => {
      // Arrange
      const subscription = new Subscription({
        userId: 'user_123',
        tenantId: 'tenant_123',
        planId: 'basic_monthly',
        planName: 'Basic Plan (Monthly)',
        status: 'active',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        autoRenew: false,
        price: 999,
        currency: 'usd',
        paymentMethodId: 'pm_123',
        paymentIntentId: 'pi_123',
        features: ['basic_chat', 'standard_templates']
      });
      
      await subscription.save();
      
      // Act
      const result = await subscriptionService.renewSubscription(subscription._id);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.status).toBe('expired');
      expect(PaymentService.prototype.createPaymentIntent).not.toHaveBeenCalled();
    });
    
    it('should throw error when subscription not found', async () => {
      // Arrange
      const nonExistentId = new mongoose.Types.ObjectId();
      
      // Act & Assert
      await expect(subscriptionService.renewSubscription(nonExistentId))
        .rejects.toThrow(`Subscription ${nonExistentId} not found`);
    });
  });
});
