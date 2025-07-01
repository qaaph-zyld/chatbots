/**
 * Trial Service Unit Tests
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const trialService = require('../../../src/billing/services/trial.service');
const Trial = require('../../../src/billing/models/trial.model');
const Subscription = require('../../../src/billing/models/subscription.model');
const Plan = require('../../../src/billing/models/plan.model');

// Mock dependencies
jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

// Mock notification service
jest.mock('../../../src/notifications/services/notification.service', () => ({
  sendTrialStartedNotification: jest.fn().mockResolvedValue(true),
  sendTrialEndingNotification: jest.fn().mockResolvedValue(true),
  sendTrialEndedNotification: jest.fn().mockResolvedValue(true),
  sendTrialConvertedNotification: jest.fn().mockResolvedValue(true)
}));

// Mock subscription service
jest.mock('../../../src/billing/services/subscription.service', () => ({
  createSubscription: jest.fn().mockImplementation(async (subscriptionData) => {
    return {
      _id: new mongoose.Types.ObjectId(),
      tenantId: subscriptionData.tenantId,
      planId: subscriptionData.planId,
      status: 'active',
      startDate: new Date(),
      endDate: null
    };
  })
}));

describe('Trial Service', () => {
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
    await Trial.deleteMany({});
    await Subscription.deleteMany({});
    await Plan.deleteMany({});
  });
  
  describe('createTrial', () => {
    it('should create a new trial', async () => {
      // Create a plan for the trial
      const plan = await Plan.create({
        name: 'Pro Plan',
        description: 'Professional plan with all features',
        price: 29.99,
        currency: 'USD',
        billingCycle: 'monthly',
        features: ['feature1', 'feature2', 'feature3']
      });
      
      const trialData = {
        tenantId: 'tenant123',
        planId: plan._id,
        durationDays: 14
      };
      
      const trial = await trialService.createTrial(trialData);
      
      expect(trial).toBeDefined();
      expect(trial.tenantId).toBe('tenant123');
      expect(trial.planId.toString()).toBe(plan._id.toString());
      expect(trial.durationDays).toBe(14);
      expect(trial.status).toBe('active');
      expect(trial.startDate).toBeDefined();
      expect(trial.endDate).toBeDefined();
      
      // End date should be 14 days after start date
      const expectedEndDate = new Date(trial.startDate);
      expectedEndDate.setDate(expectedEndDate.getDate() + 14);
      expect(trial.endDate.toDateString()).toBe(expectedEndDate.toDateString());
    });
    
    it('should throw an error if tenant already has an active trial', async () => {
      // Create a plan
      const plan = await Plan.create({
        name: 'Pro Plan',
        description: 'Professional plan with all features',
        price: 29.99,
        currency: 'USD',
        billingCycle: 'monthly',
        features: ['feature1', 'feature2', 'feature3']
      });
      
      // Create an active trial
      await Trial.create({
        tenantId: 'tenant123',
        planId: plan._id,
        durationDays: 14,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      });
      
      // Try to create another trial for the same tenant
      const trialData = {
        tenantId: 'tenant123',
        planId: plan._id,
        durationDays: 14
      };
      
      await expect(trialService.createTrial(trialData)).rejects.toThrow(
        'Tenant already has an active trial'
      );
    });
    
    it('should throw an error if tenant already has an active subscription', async () => {
      // Create a plan
      const plan = await Plan.create({
        name: 'Pro Plan',
        description: 'Professional plan with all features',
        price: 29.99,
        currency: 'USD',
        billingCycle: 'monthly',
        features: ['feature1', 'feature2', 'feature3']
      });
      
      // Create an active subscription
      await Subscription.create({
        tenantId: 'tenant123',
        planId: plan._id,
        status: 'active',
        startDate: new Date()
      });
      
      // Try to create a trial for the tenant with active subscription
      const trialData = {
        tenantId: 'tenant123',
        planId: plan._id,
        durationDays: 14
      };
      
      await expect(trialService.createTrial(trialData)).rejects.toThrow(
        'Tenant already has an active subscription'
      );
    });
  });
  
  describe('getTrialByTenant', () => {
    it('should get trial by tenant ID', async () => {
      // Create a plan
      const plan = await Plan.create({
        name: 'Pro Plan',
        description: 'Professional plan with all features',
        price: 29.99,
        currency: 'USD',
        billingCycle: 'monthly',
        features: ['feature1', 'feature2', 'feature3']
      });
      
      // Create a trial
      const createdTrial = await Trial.create({
        tenantId: 'tenant123',
        planId: plan._id,
        durationDays: 14,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      });
      
      const trial = await trialService.getTrialByTenant('tenant123');
      
      expect(trial).toBeDefined();
      expect(trial._id.toString()).toBe(createdTrial._id.toString());
      expect(trial.tenantId).toBe('tenant123');
    });
    
    it('should return null if no trial found for tenant', async () => {
      const trial = await trialService.getTrialByTenant('nonexistent');
      
      expect(trial).toBeNull();
    });
  });
  
  describe('checkTrialEligibility', () => {
    it('should return eligible if tenant has no trials or subscriptions', async () => {
      const eligibility = await trialService.checkTrialEligibility('tenant123');
      
      expect(eligibility).toBeDefined();
      expect(eligibility.eligible).toBe(true);
    });
    
    it('should return not eligible if tenant has an active trial', async () => {
      // Create a plan
      const plan = await Plan.create({
        name: 'Pro Plan',
        description: 'Professional plan with all features',
        price: 29.99,
        currency: 'USD',
        billingCycle: 'monthly',
        features: ['feature1', 'feature2', 'feature3']
      });
      
      // Create an active trial
      await Trial.create({
        tenantId: 'tenant123',
        planId: plan._id,
        durationDays: 14,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      });
      
      const eligibility = await trialService.checkTrialEligibility('tenant123');
      
      expect(eligibility).toBeDefined();
      expect(eligibility.eligible).toBe(false);
      expect(eligibility.reason).toBe('Tenant already has an active trial');
    });
    
    it('should return not eligible if tenant has an active subscription', async () => {
      // Create a plan
      const plan = await Plan.create({
        name: 'Pro Plan',
        description: 'Professional plan with all features',
        price: 29.99,
        currency: 'USD',
        billingCycle: 'monthly',
        features: ['feature1', 'feature2', 'feature3']
      });
      
      // Create an active subscription
      await Subscription.create({
        tenantId: 'tenant123',
        planId: plan._id,
        status: 'active',
        startDate: new Date()
      });
      
      const eligibility = await trialService.checkTrialEligibility('tenant123');
      
      expect(eligibility).toBeDefined();
      expect(eligibility.eligible).toBe(false);
      expect(eligibility.reason).toBe('Tenant already has an active subscription');
    });
    
    it('should return not eligible if tenant has used a trial before', async () => {
      // Create a plan
      const plan = await Plan.create({
        name: 'Pro Plan',
        description: 'Professional plan with all features',
        price: 29.99,
        currency: 'USD',
        billingCycle: 'monthly',
        features: ['feature1', 'feature2', 'feature3']
      });
      
      // Create a completed trial
      await Trial.create({
        tenantId: 'tenant123',
        planId: plan._id,
        durationDays: 14,
        status: 'completed',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000)
      });
      
      const eligibility = await trialService.checkTrialEligibility('tenant123');
      
      expect(eligibility).toBeDefined();
      expect(eligibility.eligible).toBe(false);
      expect(eligibility.reason).toBe('Tenant has already used a trial');
    });
  });
  
  describe('convertTrialToSubscription', () => {
    it('should convert trial to subscription', async () => {
      // Create a plan
      const plan = await Plan.create({
        name: 'Pro Plan',
        description: 'Professional plan with all features',
        price: 29.99,
        currency: 'USD',
        billingCycle: 'monthly',
        features: ['feature1', 'feature2', 'feature3']
      });
      
      // Create a trial
      const trial = await Trial.create({
        tenantId: 'tenant123',
        planId: plan._id,
        durationDays: 14,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      });
      
      // Payment method data
      const paymentMethodData = {
        type: 'card',
        token: 'pm_test_token'
      };
      
      // Convert trial to subscription
      const result = await trialService.convertTrialToSubscription(
        trial._id,
        paymentMethodData
      );
      
      expect(result).toBeDefined();
      expect(result.subscription).toBeDefined();
      expect(result.trial).toBeDefined();
      
      // Trial should be marked as converted
      expect(result.trial.status).toBe('converted');
      expect(result.trial.convertedAt).toBeDefined();
      
      // Subscription should be created with the same plan
      expect(result.subscription.tenantId).toBe('tenant123');
      expect(result.subscription.planId).toBe(plan._id);
      expect(result.subscription.status).toBe('active');
    });
    
    it('should throw an error if trial not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      await expect(trialService.convertTrialToSubscription(
        nonExistentId,
        { type: 'card', token: 'pm_test_token' }
      )).rejects.toThrow(`Trial not found: ${nonExistentId}`);
    });
    
    it('should throw an error if trial is not active', async () => {
      // Create a plan
      const plan = await Plan.create({
        name: 'Pro Plan',
        description: 'Professional plan with all features',
        price: 29.99,
        currency: 'USD',
        billingCycle: 'monthly',
        features: ['feature1', 'feature2', 'feature3']
      });
      
      // Create an expired trial
      const trial = await Trial.create({
        tenantId: 'tenant123',
        planId: plan._id,
        durationDays: 14,
        status: 'expired',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000)
      });
      
      await expect(trialService.convertTrialToSubscription(
        trial._id,
        { type: 'card', token: 'pm_test_token' }
      )).rejects.toThrow('Trial is not active');
    });
  });
  
  describe('processExpiredTrials', () => {
    it('should process expired trials', async () => {
      // Create a plan
      const plan = await Plan.create({
        name: 'Pro Plan',
        description: 'Professional plan with all features',
        price: 29.99,
        currency: 'USD',
        billingCycle: 'monthly',
        features: ['feature1', 'feature2', 'feature3']
      });
      
      // Create an expired trial (end date in the past)
      await Trial.create({
        tenantId: 'tenant1',
        planId: plan._id,
        durationDays: 14,
        status: 'active',
        startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
      });
      
      // Create another expired trial
      await Trial.create({
        tenantId: 'tenant2',
        planId: plan._id,
        durationDays: 14,
        status: 'active',
        startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      });
      
      // Create an active trial (end date in the future)
      await Trial.create({
        tenantId: 'tenant3',
        planId: plan._id,
        durationDays: 14,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      });
      
      // Process expired trials
      const result = await trialService.processExpiredTrials();
      
      expect(result).toBeDefined();
      expect(result.processed).toBe(2);
      
      // Check that expired trials were updated
      const expiredTrials = await Trial.find({ status: 'expired' });
      expect(expiredTrials.length).toBe(2);
      
      // Check that active trial is still active
      const activeTrials = await Trial.find({ status: 'active' });
      expect(activeTrials.length).toBe(1);
      expect(activeTrials[0].tenantId).toBe('tenant3');
    });
  });
  
  describe('sendTrialEndingNotifications', () => {
    it('should send notifications for trials ending soon', async () => {
      // Create a plan
      const plan = await Plan.create({
        name: 'Pro Plan',
        description: 'Professional plan with all features',
        price: 29.99,
        currency: 'USD',
        billingCycle: 'monthly',
        features: ['feature1', 'feature2', 'feature3']
      });
      
      // Create a trial ending in 2 days
      await Trial.create({
        tenantId: 'tenant1',
        planId: plan._id,
        durationDays: 14,
        status: 'active',
        startDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        notificationsSent: {
          trialStarted: true,
          trialEnding: false,
          trialEnded: false
        }
      });
      
      // Create a trial ending in 1 day
      await Trial.create({
        tenantId: 'tenant2',
        planId: plan._id,
        durationDays: 14,
        status: 'active',
        startDate: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        notificationsSent: {
          trialStarted: true,
          trialEnding: false,
          trialEnded: false
        }
      });
      
      // Create a trial ending in 5 days (not ending soon)
      await Trial.create({
        tenantId: 'tenant3',
        planId: plan._id,
        durationDays: 14,
        status: 'active',
        startDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        notificationsSent: {
          trialStarted: true,
          trialEnding: false,
          trialEnded: false
        }
      });
      
      // Send notifications
      const result = await trialService.sendTrialEndingNotifications();
      
      expect(result).toBeDefined();
      expect(result.sent).toBe(2);
      
      // Check that notifications were marked as sent
      const updatedTrials = await Trial.find({
        'notificationsSent.trialEnding': true
      });
      expect(updatedTrials.length).toBe(2);
    });
  });
});
