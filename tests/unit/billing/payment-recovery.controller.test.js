/**
 * Payment Recovery Controller Unit Tests
 * 
 * Tests for payment recovery controller functionality including:
 * - Retry scheduling endpoint
 * - Retry processing endpoint
 * - Recovery statistics endpoint
 */

const sinon = require('sinon');
const { expect } = require('chai');
const mongoose = require('mongoose');
const paymentRecoveryController = require('../../../src/billing/controllers/payment-recovery.controller');
const paymentRecoveryService = require('../../../src/billing/services/payment-recovery.service');
const Subscription = require('../../../src/billing/models/subscription.model');
const logger = require('../../../src/utils/logger');

describe('Payment Recovery Controller', () => {
  let req, res, next;
  let paymentRecoveryServiceStub;
  let subscriptionStub;
  let loggerStub;
  
  const mockSubscriptionId = new mongoose.Types.ObjectId().toString();
  const mockInvoiceId = 'in_1234567890';
  const mockUserId = new mongoose.Types.ObjectId().toString();
  const mockAdminId = new mongoose.Types.ObjectId().toString();
  
  const mockPaymentError = {
    success: false,
    error: {
      type: 'card_error',
      code: 'card_declined',
      message: 'Your card was declined. Please try a different payment method.',
      technical: 'The card was declined',
      operation: 'create_invoice'
    }
  };
  
  const mockSubscription = {
    _id: mockSubscriptionId,
    userId: mockUserId,
    planName: 'Premium Plan',
    status: 'active',
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  };
  
  beforeEach(() => {
    // Mock request, response, next
    req = {
      body: {},
      params: {},
      user: {
        id: mockUserId,
        role: 'user'
      }
    };
    
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis()
    };
    
    next = sinon.spy();
    
    // Stub services
    paymentRecoveryServiceStub = {
      scheduleRetry: sinon.stub(paymentRecoveryService, 'scheduleRetry'),
      processScheduledRetries: sinon.stub(paymentRecoveryService, 'processScheduledRetries'),
      handleRecoveredPayment: sinon.stub(paymentRecoveryService, 'handleRecoveredPayment'),
      getRecoveryStats: sinon.stub(paymentRecoveryService, 'getRecoveryStats')
    };
    
    subscriptionStub = sinon.stub(Subscription, 'findById');
    loggerStub = sinon.stub(logger, 'error');
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  describe('scheduleRetry', () => {
    it('should schedule a retry successfully for subscription owner', async () => {
      // Setup request
      req.body = {
        subscriptionId: mockSubscriptionId,
        invoiceId: mockInvoiceId,
        paymentError: mockPaymentError
      };
      
      // Mock validation result
      req.validationResult = {
        isEmpty: sinon.stub().returns(true)
      };
      
      // Mock subscription lookup
      subscriptionStub.resolves(mockSubscription);
      
      // Mock service response
      const mockRetryResult = {
        subscriptionId: mockSubscriptionId,
        invoiceId: mockInvoiceId,
        attemptNumber: 1,
        retryDate: new Date(),
        status: 'scheduled'
      };
      paymentRecoveryServiceStub.scheduleRetry.resolves(mockRetryResult);
      
      // Call controller
      await paymentRecoveryController.scheduleRetry(req, res);
      
      // Assertions
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('message');
      expect(res.json.firstCall.args[0]).to.have.property('retry');
      expect(paymentRecoveryServiceStub.scheduleRetry.calledOnce).to.be.true;
    });
    
    it('should return 404 if subscription not found', async () => {
      // Setup request
      req.body = {
        subscriptionId: mockSubscriptionId,
        invoiceId: mockInvoiceId,
        paymentError: mockPaymentError
      };
      
      // Mock validation result
      req.validationResult = {
        isEmpty: sinon.stub().returns(true)
      };
      
      // Mock subscription lookup - not found
      subscriptionStub.resolves(null);
      
      // Call controller
      await paymentRecoveryController.scheduleRetry(req, res);
      
      // Assertions
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('error', 'Subscription not found');
      expect(paymentRecoveryServiceStub.scheduleRetry.called).to.be.false;
    });
    
    it('should return 403 if user is not subscription owner or admin', async () => {
      // Setup request with different user
      req.body = {
        subscriptionId: mockSubscriptionId,
        invoiceId: mockInvoiceId,
        paymentError: mockPaymentError
      };
      req.user.id = new mongoose.Types.ObjectId().toString(); // Different user
      
      // Mock validation result
      req.validationResult = {
        isEmpty: sinon.stub().returns(true)
      };
      
      // Mock subscription lookup
      subscriptionStub.resolves(mockSubscription);
      
      // Call controller
      await paymentRecoveryController.scheduleRetry(req, res);
      
      // Assertions
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('error', 'Unauthorized access to subscription');
      expect(paymentRecoveryServiceStub.scheduleRetry.called).to.be.false;
    });
    
    it('should handle service errors gracefully', async () => {
      // Setup request
      req.body = {
        subscriptionId: mockSubscriptionId,
        invoiceId: mockInvoiceId,
        paymentError: mockPaymentError
      };
      
      // Mock validation result
      req.validationResult = {
        isEmpty: sinon.stub().returns(true)
      };
      
      // Mock subscription lookup
      subscriptionStub.resolves(mockSubscription);
      
      // Mock service error
      const error = new Error('Service error');
      paymentRecoveryServiceStub.scheduleRetry.rejects(error);
      
      // Call controller
      await paymentRecoveryController.scheduleRetry(req, res);
      
      // Assertions
      expect(loggerStub.calledOnce).to.be.true;
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('error', 'Failed to schedule payment retry');
    });
  });
  
  describe('processScheduledRetries', () => {
    it('should process scheduled retries successfully for admin', async () => {
      // Setup admin user
      req.user.role = 'admin';
      
      // Mock service response
      const mockResults = [
        {
          attemptId: new mongoose.Types.ObjectId().toString(),
          subscriptionId: mockSubscriptionId,
          status: 'succeeded',
          invoiceId: mockInvoiceId
        }
      ];
      paymentRecoveryServiceStub.processScheduledRetries.resolves(mockResults);
      
      // Call controller
      await paymentRecoveryController.processScheduledRetries(req, res);
      
      // Assertions
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('message');
      expect(res.json.firstCall.args[0]).to.have.property('results');
      expect(paymentRecoveryServiceStub.processScheduledRetries.calledOnce).to.be.true;
    });
    
    it('should return 403 if user is not admin', async () => {
      // Setup non-admin user
      req.user.role = 'user';
      
      // Call controller
      await paymentRecoveryController.processScheduledRetries(req, res);
      
      // Assertions
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('error', 'Unauthorized access');
      expect(paymentRecoveryServiceStub.processScheduledRetries.called).to.be.false;
    });
    
    it('should handle service errors gracefully', async () => {
      // Setup admin user
      req.user.role = 'admin';
      
      // Mock service error
      const error = new Error('Service error');
      paymentRecoveryServiceStub.processScheduledRetries.rejects(error);
      
      // Call controller
      await paymentRecoveryController.processScheduledRetries(req, res);
      
      // Assertions
      expect(loggerStub.calledOnce).to.be.true;
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('error', 'Failed to process scheduled retries');
    });
  });
  
  describe('handleRecoveredPayment', () => {
    it('should handle recovered payment successfully for admin', async () => {
      // Setup admin user and request
      req.user.role = 'admin';
      req.body = {
        subscriptionId: mockSubscriptionId,
        invoiceId: mockInvoiceId
      };
      
      // Mock validation result
      req.validationResult = {
        isEmpty: sinon.stub().returns(true)
      };
      
      // Mock service response
      paymentRecoveryServiceStub.handleRecoveredPayment.resolves(mockSubscription);
      
      // Call controller
      await paymentRecoveryController.handleRecoveredPayment(req, res);
      
      // Assertions
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('message');
      expect(res.json.firstCall.args[0]).to.have.property('subscription');
      expect(paymentRecoveryServiceStub.handleRecoveredPayment.calledOnce).to.be.true;
    });
    
    it('should return 403 if user is not admin', async () => {
      // Setup non-admin user and request
      req.user.role = 'user';
      req.body = {
        subscriptionId: mockSubscriptionId,
        invoiceId: mockInvoiceId
      };
      
      // Mock validation result
      req.validationResult = {
        isEmpty: sinon.stub().returns(true)
      };
      
      // Call controller
      await paymentRecoveryController.handleRecoveredPayment(req, res);
      
      // Assertions
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('error', 'Unauthorized access');
      expect(paymentRecoveryServiceStub.handleRecoveredPayment.called).to.be.false;
    });
  });
  
  describe('getRecoveryStats', () => {
    it('should get recovery stats successfully for subscription owner', async () => {
      // Setup request
      req.params = {
        subscriptionId: mockSubscriptionId
      };
      
      // Mock subscription lookup
      subscriptionStub.resolves(mockSubscription);
      
      // Mock service response
      const mockStats = {
        subscriptionId: mockSubscriptionId,
        totalAttempts: 3,
        successfulAttempts: 1,
        failedAttempts: 1,
        pendingAttempts: 1,
        recoveryRate: 33.33,
        invoiceCount: 2,
        mostCommonErrors: [
          { code: 'card_declined', count: 1 }
        ]
      };
      paymentRecoveryServiceStub.getRecoveryStats.resolves(mockStats);
      
      // Call controller
      await paymentRecoveryController.getRecoveryStats(req, res);
      
      // Assertions
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('stats');
      expect(paymentRecoveryServiceStub.getRecoveryStats.calledOnce).to.be.true;
    });
    
    it('should get recovery stats successfully for admin', async () => {
      // Setup admin user and request
      req.user.role = 'admin';
      req.user.id = mockAdminId; // Different from subscription owner
      req.params = {
        subscriptionId: mockSubscriptionId
      };
      
      // Mock subscription lookup
      subscriptionStub.resolves(mockSubscription);
      
      // Mock service response
      const mockStats = {
        subscriptionId: mockSubscriptionId,
        totalAttempts: 3,
        successfulAttempts: 1,
        failedAttempts: 1,
        pendingAttempts: 1,
        recoveryRate: 33.33,
        invoiceCount: 2,
        mostCommonErrors: [
          { code: 'card_declined', count: 1 }
        ]
      };
      paymentRecoveryServiceStub.getRecoveryStats.resolves(mockStats);
      
      // Call controller
      await paymentRecoveryController.getRecoveryStats(req, res);
      
      // Assertions
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('stats');
      expect(paymentRecoveryServiceStub.getRecoveryStats.calledOnce).to.be.true;
    });
    
    it('should return 404 if subscription not found', async () => {
      // Setup request
      req.params = {
        subscriptionId: mockSubscriptionId
      };
      
      // Mock subscription lookup - not found
      subscriptionStub.resolves(null);
      
      // Call controller
      await paymentRecoveryController.getRecoveryStats(req, res);
      
      // Assertions
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('error', 'Subscription not found');
      expect(paymentRecoveryServiceStub.getRecoveryStats.called).to.be.false;
    });
    
    it('should return 403 if user is not subscription owner or admin', async () => {
      // Setup request with different user
      req.params = {
        subscriptionId: mockSubscriptionId
      };
      req.user.id = new mongoose.Types.ObjectId().toString(); // Different user
      req.user.role = 'user'; // Not admin
      
      // Mock subscription lookup
      subscriptionStub.resolves(mockSubscription);
      
      // Call controller
      await paymentRecoveryController.getRecoveryStats(req, res);
      
      // Assertions
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('error', 'Unauthorized access to subscription');
      expect(paymentRecoveryServiceStub.getRecoveryStats.called).to.be.false;
    });
  });
});
