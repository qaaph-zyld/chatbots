/**
 * Coupon Service Unit Tests
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const couponService = require('../../../src/billing/services/coupon.service');
const Coupon = require('../../../src/billing/models/coupon.model');
const Subscription = require('../../../src/billing/models/subscription.model');

// Mock dependencies
jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

// Mock Stripe
jest.mock('../../../src/billing/config/stripe', () => ({
  coupons: {
    create: jest.fn().mockResolvedValue({ id: 'stripe_coupon_id' }),
    update: jest.fn().mockResolvedValue({}),
    del: jest.fn().mockResolvedValue({})
  }
}));

describe('Coupon Service', () => {
  let mongoServer;
  
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
  
  // Clear database between tests
  beforeEach(async () => {
    await Coupon.deleteMany({});
    await Subscription.deleteMany({});
  });
  
  describe('createCoupon', () => {
    it('should create a new coupon', async () => {
      const couponData = {
        code: 'TEST10',
        type: 'percentage',
        value: 10,
        description: 'Test coupon',
        duration: 'once'
      };
      
      const coupon = await couponService.createCoupon(couponData);
      
      expect(coupon).toBeDefined();
      expect(coupon.code).toBe('TEST10');
      expect(coupon.type).toBe('percentage');
      expect(coupon.value).toBe(10);
      expect(coupon.description).toBe('Test coupon');
      expect(coupon.duration).toBe('once');
      expect(coupon.active).toBe(true);
    });
    
    it('should throw an error if coupon code already exists', async () => {
      const couponData = {
        code: 'TEST10',
        type: 'percentage',
        value: 10,
        description: 'Test coupon',
        duration: 'once'
      };
      
      await couponService.createCoupon(couponData);
      
      await expect(couponService.createCoupon(couponData)).rejects.toThrow(
        'Coupon code TEST10 already exists'
      );
    });
  });
  
  describe('getCouponByCode', () => {
    it('should get a coupon by code', async () => {
      const couponData = {
        code: 'TEST10',
        type: 'percentage',
        value: 10,
        description: 'Test coupon',
        duration: 'once'
      };
      
      await couponService.createCoupon(couponData);
      
      const coupon = await couponService.getCouponByCode('TEST10');
      
      expect(coupon).toBeDefined();
      expect(coupon.code).toBe('TEST10');
    });
    
    it('should throw an error if coupon not found', async () => {
      await expect(couponService.getCouponByCode('NONEXISTENT')).rejects.toThrow(
        'Coupon not found: NONEXISTENT'
      );
    });
  });
  
  describe('validateCoupon', () => {
    it('should validate a valid coupon', async () => {
      const couponData = {
        code: 'TEST10',
        type: 'percentage',
        value: 10,
        description: 'Test coupon',
        duration: 'once',
        active: true
      };
      
      await couponService.createCoupon(couponData);
      
      const result = await couponService.validateCoupon('TEST10', 'tenant123', null);
      
      expect(result.valid).toBe(true);
      expect(result.coupon).toBeDefined();
      expect(result.coupon.code).toBe('TEST10');
    });
    
    it('should invalidate an expired coupon', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const couponData = {
        code: 'EXPIRED',
        type: 'percentage',
        value: 10,
        description: 'Expired coupon',
        duration: 'once',
        active: true,
        expiresAt: yesterday
      };
      
      await couponService.createCoupon(couponData);
      
      const result = await couponService.validateCoupon('EXPIRED', 'tenant123', null);
      
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Coupon has expired');
    });
    
    it('should invalidate an inactive coupon', async () => {
      const couponData = {
        code: 'INACTIVE',
        type: 'percentage',
        value: 10,
        description: 'Inactive coupon',
        duration: 'once',
        active: false
      };
      
      await couponService.createCoupon(couponData);
      
      const result = await couponService.validateCoupon('INACTIVE', 'tenant123', null);
      
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Coupon is not active');
    });
    
    it('should invalidate a coupon that reached max redemptions', async () => {
      const couponData = {
        code: 'MAXED',
        type: 'percentage',
        value: 10,
        description: 'Maxed out coupon',
        duration: 'once',
        active: true,
        maxRedemptions: 2,
        redemptionCount: 2
      };
      
      await couponService.createCoupon(couponData);
      
      const result = await couponService.validateCoupon('MAXED', 'tenant123', null);
      
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Coupon has reached maximum redemptions');
    });
    
    it('should invalidate a coupon not applicable to the plan', async () => {
      const planId = new mongoose.Types.ObjectId();
      const otherPlanId = new mongoose.Types.ObjectId();
      
      const couponData = {
        code: 'PLANSPECIFIC',
        type: 'percentage',
        value: 10,
        description: 'Plan specific coupon',
        duration: 'once',
        active: true,
        applicablePlans: [planId]
      };
      
      await couponService.createCoupon(couponData);
      
      const result = await couponService.validateCoupon('PLANSPECIFIC', 'tenant123', otherPlanId);
      
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Coupon is not applicable to the selected plan');
    });
  });
  
  describe('applyCoupon', () => {
    it('should apply a coupon to a subscription', async () => {
      // Create a coupon
      const couponData = {
        code: 'TEST10',
        type: 'percentage',
        value: 10,
        description: 'Test coupon',
        duration: 'once',
        active: true
      };
      
      await couponService.createCoupon(couponData);
      
      // Create a subscription
      const subscription = await Subscription.create({
        tenantId: 'tenant123',
        planId: 'plan123',
        status: 'active'
      });
      
      // Apply coupon
      const updatedSubscription = await couponService.applyCoupon('TEST10', subscription._id);
      
      expect(updatedSubscription).toBeDefined();
      expect(updatedSubscription.couponCode).toBe('TEST10');
      expect(updatedSubscription.couponData).toBeDefined();
      expect(updatedSubscription.couponData.type).toBe('percentage');
      expect(updatedSubscription.couponData.value).toBe(10);
      
      // Check if redemption count was incremented
      const coupon = await Coupon.findOne({ code: 'TEST10' });
      expect(coupon.redemptionCount).toBe(1);
    });
    
    it('should throw an error if coupon not found', async () => {
      const subscription = await Subscription.create({
        tenantId: 'tenant123',
        planId: 'plan123',
        status: 'active'
      });
      
      await expect(couponService.applyCoupon('NONEXISTENT', subscription._id)).rejects.toThrow(
        'Coupon not found: NONEXISTENT'
      );
    });
    
    it('should throw an error if subscription not found', async () => {
      const couponData = {
        code: 'TEST10',
        type: 'percentage',
        value: 10,
        description: 'Test coupon',
        duration: 'once',
        active: true
      };
      
      await couponService.createCoupon(couponData);
      
      const nonExistentId = new mongoose.Types.ObjectId();
      
      await expect(couponService.applyCoupon('TEST10', nonExistentId)).rejects.toThrow(
        `Subscription not found: ${nonExistentId}`
      );
    });
  });
  
  describe('removeCoupon', () => {
    it('should remove a coupon from a subscription', async () => {
      // Create a coupon
      const coupon = await Coupon.create({
        code: 'TEST10',
        type: 'percentage',
        value: 10,
        description: 'Test coupon',
        duration: 'once',
        active: true
      });
      
      // Create a subscription with coupon
      const subscription = await Subscription.create({
        tenantId: 'tenant123',
        planId: 'plan123',
        status: 'active',
        couponId: coupon._id,
        couponCode: 'TEST10',
        couponData: {
          type: 'percentage',
          value: 10,
          duration: 'once',
          appliedAt: new Date()
        }
      });
      
      // Remove coupon
      const updatedSubscription = await couponService.removeCoupon(subscription._id);
      
      expect(updatedSubscription).toBeDefined();
      expect(updatedSubscription.couponId).toBeUndefined();
      expect(updatedSubscription.couponCode).toBeUndefined();
      expect(updatedSubscription.couponData).toBeUndefined();
    });
    
    it('should throw an error if subscription not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      await expect(couponService.removeCoupon(nonExistentId)).rejects.toThrow(
        `Subscription not found: ${nonExistentId}`
      );
    });
    
    it('should throw an error if subscription has no coupon', async () => {
      const subscription = await Subscription.create({
        tenantId: 'tenant123',
        planId: 'plan123',
        status: 'active'
      });
      
      await expect(couponService.removeCoupon(subscription._id)).rejects.toThrow(
        'Subscription does not have a coupon applied'
      );
    });
  });
  
  describe('listCoupons', () => {
    it('should list active coupons', async () => {
      // Create active coupon
      await Coupon.create({
        code: 'ACTIVE1',
        type: 'percentage',
        value: 10,
        description: 'Active coupon 1',
        duration: 'once',
        active: true
      });
      
      // Create another active coupon
      await Coupon.create({
        code: 'ACTIVE2',
        type: 'fixed_amount',
        value: 20,
        description: 'Active coupon 2',
        duration: 'once',
        active: true
      });
      
      // Create inactive coupon
      await Coupon.create({
        code: 'INACTIVE',
        type: 'percentage',
        value: 15,
        description: 'Inactive coupon',
        duration: 'once',
        active: false
      });
      
      const coupons = await couponService.listCoupons();
      
      expect(coupons).toBeDefined();
      expect(coupons.length).toBe(2);
      expect(coupons.some(c => c.code === 'ACTIVE1')).toBe(true);
      expect(coupons.some(c => c.code === 'ACTIVE2')).toBe(true);
      expect(coupons.some(c => c.code === 'INACTIVE')).toBe(false);
    });
    
    it('should include inactive coupons when specified', async () => {
      // Create active coupon
      await Coupon.create({
        code: 'ACTIVE',
        type: 'percentage',
        value: 10,
        description: 'Active coupon',
        duration: 'once',
        active: true
      });
      
      // Create inactive coupon
      await Coupon.create({
        code: 'INACTIVE',
        type: 'percentage',
        value: 15,
        description: 'Inactive coupon',
        duration: 'once',
        active: false
      });
      
      const coupons = await couponService.listCoupons({ active: null });
      
      expect(coupons).toBeDefined();
      expect(coupons.length).toBe(1);
      expect(coupons[0].code).toBe('ACTIVE');
    });
  });
});
