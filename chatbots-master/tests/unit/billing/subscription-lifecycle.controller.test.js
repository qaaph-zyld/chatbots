/**
 * Unit Tests for Subscription Lifecycle Controller
 * 
 * Tests API endpoints for subscription lifecycle management including:
 * - Renewal
 * - Cancellation
 * - Plan changes
 * - Pause/Resume
 * - Grace period processing
 */

const { expect } = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');
const { mockRequest, mockResponse } = require('../../test-utils/express-mock');
const subscriptionLifecycleController = require('../../../src/billing/controllers/subscription-lifecycle.controller');
const subscriptionLifecycleService = require('../../../src/billing/services/subscription-lifecycle.service');
const Subscription = require('../../../src/billing/models/subscription.model');

describe('Subscription Lifecycle Controller', () => {
  let req, res, sandbox;
  const userId = new mongoose.Types.ObjectId();
  const subscriptionId = new mongoose.Types.ObjectId();
  const planId = new mongoose.Types.ObjectId();
  
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    req = mockRequest();
    res = mockResponse();
    req.user = { id: userId.toString(), role: 'user' };
    req.params = { id: subscriptionId.toString() };
  });
  
  afterEach(() => {
    sandbox.restore();
  });
  
  describe('getSubscription', () => {
    it('should return subscription if it belongs to the user', async () => {
      const subscription = {
        _id: subscriptionId,
        userId: userId,
        planName: 'Pro',
        status: 'active'
      };
      
      const findByIdStub = sandbox.stub(Subscription, 'findById').resolves(subscription);
      
      await subscriptionLifecycleController.getSubscription(req, res);
      
      expect(findByIdStub.calledOnceWith(subscriptionId.toString())).to.be.true;
      expect(res.status.calledOnceWith(200)).to.be.true;
      expect(res.json.calledOnceWith({ subscription })).to.be.true;
    });
    
    it('should return 404 if subscription not found', async () => {
      sandbox.stub(Subscription, 'findById').resolves(null);
      
      await subscriptionLifecycleController.getSubscription(req, res);
      
      expect(res.status.calledOnceWith(404)).to.be.true;
      expect(res.json.calledOnceWith({ error: 'Subscription not found' })).to.be.true;
    });
    
    it('should return 403 if subscription belongs to another user', async () => {
      const anotherUserId = new mongoose.Types.ObjectId();
      const subscription = {
        _id: subscriptionId,
        userId: anotherUserId,
        planName: 'Pro',
        status: 'active'
      };
      
      sandbox.stub(Subscription, 'findById').resolves(subscription);
      
      await subscriptionLifecycleController.getSubscription(req, res);
      
      expect(res.status.calledOnceWith(403)).to.be.true;
      expect(res.json.calledOnceWith({ error: 'Unauthorized access to subscription' })).to.be.true;
    });
    
    it('should allow admin to access any subscription', async () => {
      const anotherUserId = new mongoose.Types.ObjectId();
      const subscription = {
        _id: subscriptionId,
        userId: anotherUserId,
        planName: 'Pro',
        status: 'active'
      };
      
      req.user.role = 'admin';
      sandbox.stub(Subscription, 'findById').resolves(subscription);
      
      await subscriptionLifecycleController.getSubscription(req, res);
      
      expect(res.status.calledOnceWith(200)).to.be.true;
      expect(res.json.calledOnceWith({ subscription })).to.be.true;
    });
  });
  
  describe('renewSubscription', () => {
    it('should renew subscription successfully', async () => {
      const subscription = {
        _id: subscriptionId,
        userId: userId,
        planName: 'Pro',
        status: 'active'
      };
      
      const updatedSubscription = {
        ...subscription,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };
      
      sandbox.stub(Subscription, 'findById').resolves(subscription);
      const processRenewalStub = sandbox.stub(subscriptionLifecycleService, 'processRenewal').resolves(updatedSubscription);
      
      await subscriptionLifecycleController.renewSubscription(req, res);
      
      expect(processRenewalStub.calledOnceWith(subscriptionId.toString())).to.be.true;
      expect(res.status.calledOnceWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0].message).to.include('renewed successfully');
      expect(res.json.firstCall.args[0].subscription).to.equal(updatedSubscription);
    });
    
    it('should handle service errors', async () => {
      const subscription = {
        _id: subscriptionId,
        userId: userId,
        planName: 'Pro',
        status: 'active'
      };
      
      sandbox.stub(Subscription, 'findById').resolves(subscription);
      sandbox.stub(subscriptionLifecycleService, 'processRenewal').rejects(new Error('Service error'));
      
      await subscriptionLifecycleController.renewSubscription(req, res);
      
      expect(res.status.calledOnceWith(500)).to.be.true;
      expect(res.json.calledOnceWith({ error: 'Failed to renew subscription' })).to.be.true;
    });
  });
  
  describe('cancelSubscription', () => {
    beforeEach(() => {
      req.body = { immediate: false };
    });
    
    it('should cancel subscription at period end', async () => {
      const subscription = {
        _id: subscriptionId,
        userId: userId,
        planName: 'Pro',
        status: 'active'
      };
      
      const updatedSubscription = {
        ...subscription,
        status: 'active',
        cancelAtPeriodEnd: true
      };
      
      sandbox.stub(Subscription, 'findById').resolves(subscription);
      const cancelSubscriptionStub = sandbox.stub(subscriptionLifecycleService, 'cancelSubscription').resolves(updatedSubscription);
      
      await subscriptionLifecycleController.cancelSubscription(req, res);
      
      expect(cancelSubscriptionStub.calledOnceWith(subscriptionId.toString(), false)).to.be.true;
      expect(res.status.calledOnceWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0].message).to.include('canceled at the end');
      expect(res.json.firstCall.args[0].subscription).to.equal(updatedSubscription);
    });
    
    it('should cancel subscription immediately', async () => {
      req.body.immediate = true;
      
      const subscription = {
        _id: subscriptionId,
        userId: userId,
        planName: 'Pro',
        status: 'active'
      };
      
      const updatedSubscription = {
        ...subscription,
        status: 'canceled',
        canceledAt: new Date()
      };
      
      sandbox.stub(Subscription, 'findById').resolves(subscription);
      const cancelSubscriptionStub = sandbox.stub(subscriptionLifecycleService, 'cancelSubscription').resolves(updatedSubscription);
      
      await subscriptionLifecycleController.cancelSubscription(req, res);
      
      expect(cancelSubscriptionStub.calledOnceWith(subscriptionId.toString(), true)).to.be.true;
      expect(res.status.calledOnceWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0].message).to.include('canceled immediately');
      expect(res.json.firstCall.args[0].subscription).to.equal(updatedSubscription);
    });
  });
  
  describe('changePlan', () => {
    beforeEach(() => {
      req.body = { planId: planId.toString(), prorate: true };
    });
    
    it('should change subscription plan with prorating', async () => {
      const subscription = {
        _id: subscriptionId,
        userId: userId,
        planName: 'Basic',
        status: 'active'
      };
      
      const updatedSubscription = {
        ...subscription,
        planName: 'Pro',
        planId: planId
      };
      
      sandbox.stub(Subscription, 'findById').resolves(subscription);
      const changePlanStub = sandbox.stub(subscriptionLifecycleService, 'changePlan').resolves(updatedSubscription);
      
      await subscriptionLifecycleController.changePlan(req, res);
      
      expect(changePlanStub.calledOnceWith(subscriptionId.toString(), planId.toString(), true)).to.be.true;
      expect(res.status.calledOnceWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0].message).to.include('plan changed successfully');
      expect(res.json.firstCall.args[0].subscription).to.equal(updatedSubscription);
    });
    
    it('should return 400 if plan ID is missing', async () => {
      req.body = { prorate: true }; // Missing planId
      
      await subscriptionLifecycleController.changePlan(req, res);
      
      expect(res.status.calledOnceWith(400)).to.be.true;
      expect(res.json.calledOnceWith({ error: 'Plan ID is required' })).to.be.true;
    });
  });
  
  describe('pauseSubscription', () => {
    beforeEach(() => {
      req.body = {};
    });
    
    it('should pause subscription without resume date', async () => {
      const subscription = {
        _id: subscriptionId,
        userId: userId,
        planName: 'Pro',
        status: 'active'
      };
      
      const updatedSubscription = {
        ...subscription,
        status: 'paused',
        pausedAt: new Date()
      };
      
      sandbox.stub(Subscription, 'findById').resolves(subscription);
      const pauseSubscriptionStub = sandbox.stub(subscriptionLifecycleService, 'pauseSubscription').resolves(updatedSubscription);
      
      await subscriptionLifecycleController.pauseSubscription(req, res);
      
      expect(pauseSubscriptionStub.calledOnceWith(subscriptionId.toString(), null)).to.be.true;
      expect(res.status.calledOnceWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0].message).to.include('paused successfully');
      expect(res.json.firstCall.args[0].subscription).to.equal(updatedSubscription);
    });
    
    it('should pause subscription with resume date', async () => {
      const resumeDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      req.body.resumeDate = resumeDate.toISOString();
      
      const subscription = {
        _id: subscriptionId,
        userId: userId,
        planName: 'Pro',
        status: 'active'
      };
      
      const updatedSubscription = {
        ...subscription,
        status: 'paused',
        pausedAt: new Date(),
        resumeAt: resumeDate
      };
      
      sandbox.stub(Subscription, 'findById').resolves(subscription);
      const pauseSubscriptionStub = sandbox.stub(subscriptionLifecycleService, 'pauseSubscription').resolves(updatedSubscription);
      
      await subscriptionLifecycleController.pauseSubscription(req, res);
      
      expect(pauseSubscriptionStub.calledOnce).to.be.true;
      expect(pauseSubscriptionStub.firstCall.args[0]).to.equal(subscriptionId.toString());
      expect(pauseSubscriptionStub.firstCall.args[1].getTime()).to.equal(resumeDate.getTime());
      expect(res.status.calledOnceWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0].message).to.include('paused successfully');
      expect(res.json.firstCall.args[0].subscription).to.equal(updatedSubscription);
    });
    
    it('should return 400 if resume date is invalid', async () => {
      req.body.resumeDate = 'invalid-date';
      
      await subscriptionLifecycleController.pauseSubscription(req, res);
      
      expect(res.status.calledOnceWith(400)).to.be.true;
      expect(res.json.calledOnceWith({ error: 'Invalid resume date format' })).to.be.true;
    });
  });
  
  describe('resumeSubscription', () => {
    it('should resume paused subscription', async () => {
      const subscription = {
        _id: subscriptionId,
        userId: userId,
        planName: 'Pro',
        status: 'paused'
      };
      
      const updatedSubscription = {
        ...subscription,
        status: 'active',
        resumedAt: new Date()
      };
      
      sandbox.stub(Subscription, 'findById').resolves(subscription);
      const resumeSubscriptionStub = sandbox.stub(subscriptionLifecycleService, 'resumeSubscription').resolves(updatedSubscription);
      
      await subscriptionLifecycleController.resumeSubscription(req, res);
      
      expect(resumeSubscriptionStub.calledOnceWith(subscriptionId.toString())).to.be.true;
      expect(res.status.calledOnceWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0].message).to.include('resumed successfully');
      expect(res.json.firstCall.args[0].subscription).to.equal(updatedSubscription);
    });
  });
  
  describe('processGracePeriods', () => {
    it('should process grace periods for admin users', async () => {
      req.user.role = 'admin';
      
      const results = [
        { subscriptionId: subscriptionId.toString(), action: 'canceled', reason: 'grace_period_expired' }
      ];
      
      const processGracePeriodsStub = sandbox.stub(subscriptionLifecycleService, 'processGracePeriods').resolves(results);
      
      await subscriptionLifecycleController.processGracePeriods(req, res);
      
      expect(processGracePeriodsStub.calledOnce).to.be.true;
      expect(res.status.calledOnceWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0].message).to.include('Processed 1 subscriptions');
      expect(res.json.firstCall.args[0].results).to.equal(results);
    });
    
    it('should return 403 for non-admin users', async () => {
      req.user.role = 'user';
      
      await subscriptionLifecycleController.processGracePeriods(req, res);
      
      expect(res.status.calledOnceWith(403)).to.be.true;
      expect(res.json.calledOnceWith({ error: 'Unauthorized access' })).to.be.true;
    });
  });
});
