/**
 * Payment Recovery Service Unit Tests
 * 
 * Tests for payment recovery service functionality including:
 * - Retry scheduling
 * - Processing scheduled retries
 * - Recovery statistics
 */

const mongoose = require('mongoose');
const sinon = require('sinon');
const { expect } = require('chai');
const paymentRecoveryService = require('../../../src/billing/services/payment-recovery.service');
const Subscription = require('../../../src/billing/models/subscription.model');
const PaymentAttempt = require('../../../src/billing/models/payment-attempt.model');
const User = require('../../../src/auth/models/user.model');
const emailService = require('../../../src/notifications/services/email.service');
const analyticsService = require('../../../src/analytics/services/analytics.service');
const stripe = require('../../../src/billing/config/stripe');

describe('Payment Recovery Service', () => {
  let subscriptionStub;
  let paymentAttemptStub;
  let userStub;
  let emailServiceStub;
  let analyticsServiceStub;
  let stripeStub;
  
  const mockSubscription = {
    _id: new mongoose.Types.ObjectId(),
    userId: new mongoose.Types.ObjectId(),
    planName: 'Premium Plan',
    status: 'active',
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    save: sinon.stub().resolves(true)
  };
  
  const mockUser = {
    _id: mockSubscription.userId,
    email: 'user@example.com',
    firstName: 'Test',
    lastName: 'User'
  };
  
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
  
  const mockInvoiceId = 'in_1234567890';
  
  beforeEach(() => {
    // Reset all stubs
    subscriptionStub = sinon.stub(Subscription, 'findById');
    paymentAttemptStub = {
      find: sinon.stub(PaymentAttempt, 'find'),
      updateMany: sinon.stub(PaymentAttempt, 'updateMany')
    };
    userStub = sinon.stub(User, 'findById');
    emailServiceStub = {
      sendPaymentRetryEmail: sinon.stub(emailService, 'sendPaymentRetryEmail').resolves(true),
      sendPaymentFinalNoticeEmail: sinon.stub(emailService, 'sendPaymentFinalNoticeEmail').resolves(true),
      sendPaymentRecoveredEmail: sinon.stub(emailService, 'sendPaymentRecoveredEmail').resolves(true),
      sendSubscriptionReactivatedEmail: sinon.stub(emailService, 'sendSubscriptionReactivatedEmail').resolves(true)
    };
    analyticsServiceStub = sinon.stub(analyticsService, 'trackEvent').resolves(true);
    stripeStub = {
      invoices: {
        pay: sinon.stub(stripe.invoices, 'pay')
      }
    };
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  describe('scheduleRetry', () => {
    it('should schedule first retry attempt correctly', async () => {
      // Setup mocks
      subscriptionStub.resolves(mockSubscription);
      paymentAttemptStub.find.resolves([]);
      userStub.resolves(mockUser);
      
      // Create a stub for PaymentAttempt constructor
      const paymentAttemptSaveStub = sinon.stub().resolves(true);
      const PaymentAttemptConstructorStub = sinon.stub(mongoose.model('PaymentAttempt'), 'prototype').returns({
        save: paymentAttemptSaveStub
      });
      
      // Call the function
      const result = await paymentRecoveryService.scheduleRetry(
        mockSubscription._id.toString(),
        mockInvoiceId,
        mockPaymentError
      );
      
      // Assertions
      expect(result).to.have.property('status', 'scheduled');
      expect(result).to.have.property('attemptNumber', 1);
      expect(result).to.have.property('subscriptionId', mockSubscription._id.toString());
      expect(result).to.have.property('invoiceId', mockInvoiceId);
      expect(result).to.have.property('retryDate');
      
      // Verify stubs were called correctly
      expect(subscriptionStub.calledOnce).to.be.true;
      expect(paymentAttemptStub.find.calledOnce).to.be.true;
      expect(userStub.calledOnce).to.be.true;
      expect(emailServiceStub.sendPaymentRetryEmail.calledOnce).to.be.true;
      expect(analyticsServiceStub.calledOnce).to.be.true;
      expect(paymentAttemptSaveStub.calledOnce).to.be.true;
      
      // Restore constructor stub
      PaymentAttemptConstructorStub.restore();
    });
    
    it('should schedule subsequent retry attempt correctly', async () => {
      // Setup mocks for a second attempt
      subscriptionStub.resolves(mockSubscription);
      const previousAttempt = {
        _id: new mongoose.Types.ObjectId(),
        subscriptionId: mockSubscription._id,
        userId: mockSubscription.userId,
        invoiceId: mockInvoiceId,
        attemptNumber: 1,
        scheduledAt: new Date(),
        status: 'failed'
      };
      paymentAttemptStub.find.resolves([previousAttempt]);
      userStub.resolves(mockUser);
      
      // Create a stub for PaymentAttempt constructor
      const paymentAttemptSaveStub = sinon.stub().resolves(true);
      const PaymentAttemptConstructorStub = sinon.stub(mongoose.model('PaymentAttempt'), 'prototype').returns({
        save: paymentAttemptSaveStub
      });
      
      // Call the function
      const result = await paymentRecoveryService.scheduleRetry(
        mockSubscription._id.toString(),
        mockInvoiceId,
        mockPaymentError
      );
      
      // Assertions
      expect(result).to.have.property('status', 'scheduled');
      expect(result).to.have.property('attemptNumber', 2);
      
      // Restore constructor stub
      PaymentAttemptConstructorStub.restore();
    });
    
    it('should set grace period when max attempts reached', async () => {
      // Setup mocks for final attempt
      subscriptionStub.resolves({
        ...mockSubscription,
        save: sinon.stub().resolves(true)
      });
      
      // Create previous attempts (max attempts already reached)
      const previousAttempts = [];
      for (let i = 0; i < 4; i++) {
        previousAttempts.push({
          _id: new mongoose.Types.ObjectId(),
          subscriptionId: mockSubscription._id,
          userId: mockSubscription.userId,
          invoiceId: mockInvoiceId,
          attemptNumber: i + 1,
          scheduledAt: new Date(),
          status: 'failed'
        });
      }
      
      paymentAttemptStub.find.resolves(previousAttempts);
      userStub.resolves(mockUser);
      
      // Call the function
      const result = await paymentRecoveryService.scheduleRetry(
        mockSubscription._id.toString(),
        mockInvoiceId,
        mockPaymentError
      );
      
      // Assertions
      expect(result).to.have.property('status', 'final_notice');
      expect(result).to.have.property('gracePeriodEnd');
      expect(emailServiceStub.sendPaymentFinalNoticeEmail.calledOnce).to.be.true;
      expect(analyticsServiceStub.calledOnce).to.be.true;
    });
  });
  
  describe('processScheduledRetries', () => {
    it('should process due payment attempts successfully', async () => {
      // Setup mocks
      const dueAttempt = {
        _id: new mongoose.Types.ObjectId(),
        subscriptionId: mockSubscription._id,
        userId: mockSubscription.userId,
        invoiceId: mockInvoiceId,
        attemptNumber: 1,
        scheduledAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        status: 'scheduled',
        save: sinon.stub().resolves(true),
        errorDetails: null
      };
      
      paymentAttemptStub.find.resolves([dueAttempt]);
      subscriptionStub.resolves(mockSubscription);
      userStub.resolves(mockUser);
      
      // Mock successful payment
      stripeStub.invoices.pay.resolves({
        id: mockInvoiceId,
        status: 'paid',
        amount_paid: 2000,
        currency: 'usd',
        hosted_invoice_url: 'https://example.com/invoice'
      });
      
      // Call the function
      const results = await paymentRecoveryService.processScheduledRetries();
      
      // Assertions
      expect(results).to.be.an('array').with.lengthOf(1);
      expect(results[0]).to.have.property('status', 'succeeded');
      expect(emailServiceStub.sendPaymentRecoveredEmail.calledOnce).to.be.true;
      expect(analyticsServiceStub.calledOnce).to.be.true;
    });
    
    it('should handle failed payment attempts correctly', async () => {
      // Setup mocks
      const dueAttempt = {
        _id: new mongoose.Types.ObjectId(),
        subscriptionId: mockSubscription._id,
        userId: mockSubscription.userId,
        invoiceId: mockInvoiceId,
        attemptNumber: 1,
        scheduledAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        status: 'scheduled',
        save: sinon.stub().resolves(true),
        errorDetails: null
      };
      
      paymentAttemptStub.find.resolves([dueAttempt]);
      subscriptionStub.resolves(mockSubscription);
      
      // Mock failed payment
      const paymentError = new Error('Payment failed');
      paymentError.raw = {
        type: 'card_error',
        code: 'card_declined'
      };
      stripeStub.invoices.pay.rejects(paymentError);
      
      // Mock scheduleRetry for next attempt
      const scheduleRetryStub = sinon.stub(paymentRecoveryService, 'scheduleRetry').resolves({
        status: 'scheduled',
        attemptNumber: 2
      });
      
      // Call the function
      const results = await paymentRecoveryService.processScheduledRetries();
      
      // Assertions
      expect(results).to.be.an('array').with.lengthOf(1);
      expect(results[0]).to.have.property('status', 'failed');
      expect(scheduleRetryStub.calledOnce).to.be.true;
      expect(analyticsServiceStub.calledOnce).to.be.true;
    });
  });
  
  describe('handleRecoveredPayment', () => {
    it('should handle recovered payment correctly', async () => {
      // Setup mocks
      const pastDueSubscription = {
        ...mockSubscription,
        status: 'past_due',
        gracePeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        save: sinon.stub().resolves(true)
      };
      
      subscriptionStub.resolves(pastDueSubscription);
      paymentAttemptStub.updateMany.resolves({ modifiedCount: 2 });
      userStub.resolves(mockUser);
      
      // Call the function
      const result = await paymentRecoveryService.handleRecoveredPayment(
        mockSubscription._id.toString(),
        mockInvoiceId
      );
      
      // Assertions
      expect(result).to.have.property('status', 'active');
      expect(result.gracePeriodEnd).to.be.null;
      expect(paymentAttemptStub.updateMany.calledOnce).to.be.true;
      expect(emailServiceStub.sendSubscriptionReactivatedEmail.calledOnce).to.be.true;
      expect(analyticsServiceStub.calledOnce).to.be.true;
    });
  });
  
  describe('getRecoveryStats', () => {
    it('should return correct recovery statistics', async () => {
      // Setup mocks
      const attempts = [
        {
          _id: new mongoose.Types.ObjectId(),
          subscriptionId: mockSubscription._id,
          invoiceId: mockInvoiceId,
          attemptNumber: 1,
          status: 'succeeded',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        },
        {
          _id: new mongoose.Types.ObjectId(),
          subscriptionId: mockSubscription._id,
          invoiceId: 'in_0987654321',
          attemptNumber: 1,
          status: 'failed',
          errorDetails: {
            error: {
              code: 'card_declined'
            }
          },
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        },
        {
          _id: new mongoose.Types.ObjectId(),
          subscriptionId: mockSubscription._id,
          invoiceId: 'in_0987654321',
          attemptNumber: 2,
          status: 'scheduled',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        }
      ];
      
      paymentAttemptStub.find.resolves(attempts);
      
      // Call the function
      const stats = await paymentRecoveryService.getRecoveryStats(
        mockSubscription._id.toString()
      );
      
      // Assertions
      expect(stats).to.have.property('totalAttempts', 3);
      expect(stats).to.have.property('successfulAttempts', 1);
      expect(stats).to.have.property('failedAttempts', 1);
      expect(stats).to.have.property('pendingAttempts', 1);
      expect(stats).to.have.property('recoveryRate', 33.33);
      expect(stats).to.have.property('invoiceCount', 2);
      expect(stats).to.have.property('mostCommonErrors').that.is.an('array');
      expect(stats.mostCommonErrors[0]).to.have.property('code', 'card_declined');
    });
  });
});
