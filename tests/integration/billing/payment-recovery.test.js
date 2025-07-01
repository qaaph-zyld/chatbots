/**
 * Payment Recovery Integration Tests
 * 
 * Tests the complete payment recovery flow from failed payment to successful recovery
 * Includes webhook handling, retry scheduling, email notifications, and subscription reactivation
 */

const request = require('supertest');
const { expect } = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');
const { app } = require('../../../src/app');
const Subscription = require('../../../src/billing/models/subscription.model');
const PaymentAttempt = require('../../../src/billing/models/payment-attempt.model');
const User = require('../../../src/models/user.model');
const stripeService = require('../../../src/billing/services/stripe.service');
const emailService = require('../../../src/notifications/services/email.service');
const { connectDB, disconnectDB } = require('../../../src/data/connection');

describe('Payment Recovery Flow Integration', function() {
  // Increase timeout for integration tests
  this.timeout(10000);
  
  let testUser;
  let testSubscription;
  let testInvoiceId;
  let adminUser;
  let authToken;
  let adminToken;
  let stripeServiceStub;
  let emailServiceStub;
  
  before(async () => {
    // Connect to test database
    await connectDB(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/chatbots-test');
    
    // Clear relevant collections
    await Subscription.deleteMany({});
    await PaymentAttempt.deleteMany({});
    await User.deleteMany({});
    
    // Create test user
    testUser = await User.create({
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      role: 'user'
    });
    
    // Create admin user
    adminUser = await User.create({
      email: 'admin@example.com',
      password: 'adminpass123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    });
    
    // Create test subscription
    testSubscription = await Subscription.create({
      userId: testUser._id,
      planName: 'Premium Plan',
      planId: 'premium-monthly',
      status: 'active',
      stripeSubscriptionId: 'sub_123456',
      stripeCustomerId: 'cus_123456',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
    
    // Generate test invoice ID
    testInvoiceId = 'in_' + Math.random().toString(36).substring(2, 15);
    
    // Get auth tokens
    const userLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    authToken = userLoginResponse.body.token;
    
    const adminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'adminpass123'
      });
    
    adminToken = adminLoginResponse.body.token;
    
    // Stub external services
    stripeServiceStub = sinon.stub(stripeService);
    emailServiceStub = sinon.stub(emailService, 'sendEmail').resolves({ success: true });
  });
  
  after(async () => {
    // Restore stubs
    sinon.restore();
    
    // Disconnect from test database
    await disconnectDB();
  });
  
  it('should handle the complete payment recovery flow', async () => {
    // Step 1: Simulate a failed payment webhook
    const webhookPayload = {
      type: 'invoice.payment_failed',
      data: {
        object: {
          id: testInvoiceId,
          customer: 'cus_123456',
          subscription: 'sub_123456',
          status: 'open',
          amount_due: 1999,
          currency: 'usd',
          created: Math.floor(Date.now() / 1000),
          payment_intent: 'pi_123456'
        }
      }
    };
    
    // Mock Stripe webhook signature verification
    const verifyEndpointStub = sinon.stub(stripeService, 'constructWebhookEvent').returns(webhookPayload);
    
    // Send webhook event
    await request(app)
      .post('/api/billing/webhook')
      .set('Stripe-Signature', 'test_signature')
      .send(webhookPayload)
      .expect(200);
    
    // Verify webhook was processed
    expect(verifyEndpointStub.calledOnce).to.be.true;
    
    // Step 2: Schedule a payment retry
    const paymentError = {
      success: false,
      error: {
        type: 'card_error',
        code: 'card_declined',
        message: 'Your card was declined. Please try a different payment method.',
        technical: 'The card was declined',
        operation: 'create_invoice'
      }
    };
    
    const retryResponse = await request(app)
      .post('/api/billing/payment-recovery/retry')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        subscriptionId: testSubscription._id.toString(),
        invoiceId: testInvoiceId,
        paymentError
      })
      .expect(200);
    
    // Verify retry was scheduled
    expect(retryResponse.body).to.have.property('message');
    expect(retryResponse.body).to.have.property('retry');
    expect(retryResponse.body.retry).to.have.property('status', 'scheduled');
    
    // Verify email was sent
    expect(emailServiceStub.calledOnce).to.be.true;
    expect(emailServiceStub.firstCall.args[0]).to.equal(testUser.email);
    expect(emailServiceStub.firstCall.args[1]).to.include('Payment Retry');
    
    // Get the retry attempt ID
    const retryAttemptId = retryResponse.body.retry._id;
    
    // Step 3: Verify retry attempt was created in database
    const paymentAttempt = await PaymentAttempt.findById(retryAttemptId);
    expect(paymentAttempt).to.exist;
    expect(paymentAttempt.subscriptionId.toString()).to.equal(testSubscription._id.toString());
    expect(paymentAttempt.invoiceId).to.equal(testInvoiceId);
    expect(paymentAttempt.status).to.equal('scheduled');
    
    // Step 4: Process the retry (admin only)
    // Mock successful payment processing
    stripeServiceStub.retryInvoicePayment = sinon.stub().resolves({
      success: true,
      invoice: {
        id: testInvoiceId,
        status: 'paid'
      }
    });
    
    const processResponse = await request(app)
      .post('/api/billing/admin/payment-recovery/process-retries')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    
    // Verify processing response
    expect(processResponse.body).to.have.property('message');
    expect(processResponse.body).to.have.property('results');
    expect(processResponse.body.results).to.be.an('array');
    
    // Step 5: Verify payment attempt was updated
    const updatedAttempt = await PaymentAttempt.findById(retryAttemptId);
    expect(updatedAttempt.status).to.equal('succeeded');
    
    // Step 6: Verify subscription is still active
    const updatedSubscription = await Subscription.findById(testSubscription._id);
    expect(updatedSubscription.status).to.equal('active');
    
    // Step 7: Get recovery statistics
    const statsResponse = await request(app)
      .get(`/api/billing/payment-recovery/stats/${testSubscription._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    // Verify statistics
    expect(statsResponse.body).to.have.property('stats');
    expect(statsResponse.body.stats).to.have.property('subscriptionId', testSubscription._id.toString());
    expect(statsResponse.body.stats).to.have.property('totalAttempts').that.is.a('number');
    expect(statsResponse.body.stats).to.have.property('successfulAttempts').that.is.a('number');
  });
  
  it('should handle failed payment recovery correctly', async () => {
    // Create a new invoice ID for this test
    const failedInvoiceId = 'in_' + Math.random().toString(36).substring(2, 15);
    
    // Step 1: Schedule a payment retry
    const paymentError = {
      success: false,
      error: {
        type: 'card_error',
        code: 'insufficient_funds',
        message: 'Your card has insufficient funds.',
        technical: 'The card has insufficient funds to complete the purchase',
        operation: 'create_invoice'
      }
    };
    
    const retryResponse = await request(app)
      .post('/api/billing/payment-recovery/retry')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        subscriptionId: testSubscription._id.toString(),
        invoiceId: failedInvoiceId,
        paymentError
      })
      .expect(200);
    
    // Get the retry attempt ID
    const retryAttemptId = retryResponse.body.retry._id;
    
    // Step 2: Process the retry but mock a failure
    // Reset email service stub
    emailServiceStub.resetHistory();
    
    // Mock failed payment processing
    stripeServiceStub.retryInvoicePayment = sinon.stub().resolves({
      success: false,
      error: {
        type: 'card_error',
        code: 'insufficient_funds',
        message: 'Your card has insufficient funds.',
        technical: 'The card has insufficient funds to complete the purchase'
      }
    });
    
    await request(app)
      .post('/api/billing/admin/payment-recovery/process-retries')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    
    // Step 3: Verify payment attempt was updated as failed
    const updatedAttempt = await PaymentAttempt.findById(retryAttemptId);
    expect(updatedAttempt.status).to.equal('failed');
    
    // Step 4: Verify email notification was sent
    expect(emailServiceStub.calledOnce).to.be.true;
    expect(emailServiceStub.firstCall.args[1]).to.include('Payment Failed');
    
    // Step 5: After multiple failures, subscription should be marked as past_due
    // Update the subscription status to simulate multiple failures
    await Subscription.findByIdAndUpdate(testSubscription._id, { status: 'past_due' });
    
    // Step 6: Verify subscription status in recovery stats
    const statsResponse = await request(app)
      .get(`/api/billing/payment-recovery/stats/${testSubscription._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    // Verify statistics include failed attempts
    expect(statsResponse.body.stats).to.have.property('failedAttempts').that.is.at.least(1);
  });
});
