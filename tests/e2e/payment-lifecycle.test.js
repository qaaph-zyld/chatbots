/**
 * End-to-End Payment Lifecycle Tests
 * 
 * Tests the complete payment lifecycle including:
 * - Initial subscription creation
 * - Payment method management
 * - Recurring billing
 * - Payment failure and recovery
 * - Subscription cancellation and reactivation
 */

const puppeteer = require('puppeteer');
const { expect } = require('chai');
const mongoose = require('mongoose');
const config = require('../../src/core/config');
const User = require('../../src/auth/models/user.model');
const Tenant = require('../../src/tenancy/models/tenant.model');
const Subscription = require('../../src/billing/models/subscription.model');
const PaymentAttempt = require('../../src/billing/models/payment-attempt.model');
const jwt = require('jsonwebtoken');
const sinon = require('sinon');
const stripeService = require('../../src/billing/services/stripe.service');
const emailService = require('../../src/notifications/services/email.service');

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
      retrieve: jest.fn().mockResolvedValue({
        id: 'pi_test123',
        metadata: {
          subscriptionId: 'subscription_test123',
          tenantId: 'tenant_test123'
        },
        status: 'succeeded',
        payment_method: 'pm_test123'
      }),
      update: jest.fn().mockResolvedValue({
        id: 'pi_test123',
        status: 'requires_payment_method'
      })
    },
    setupIntents: {
      create: jest.fn().mockResolvedValue({
        id: 'seti_test123',
        client_secret: 'seti_test123_secret_test456',
        status: 'requires_payment_method'
      })
    },
    paymentMethods: {
      retrieve: jest.fn().mockResolvedValue({
        id: 'pm_test123',
        type: 'card',
        card: {
          last4: '4242',
          brand: 'visa',
          exp_month: 12,
          exp_year: 2025
        }
      }),
      list: jest.fn().mockResolvedValue({
        data: [
          {
            id: 'pm_test123',
            type: 'card',
            card: {
              last4: '4242',
              brand: 'visa',
              exp_month: 12,
              exp_year: 2025
            }
          }
        ]
      }),
      attach: jest.fn().mockResolvedValue({
        id: 'pm_test123'
      }),
      detach: jest.fn().mockResolvedValue({
        id: 'pm_test123',
        deleted: true
      })
    },
    subscriptions: {
      create: jest.fn().mockResolvedValue({
        id: 'sub_test123',
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
      }),
      update: jest.fn().mockResolvedValue({
        id: 'sub_test123',
        status: 'active'
      }),
      cancel: jest.fn().mockResolvedValue({
        id: 'sub_test123',
        status: 'canceled'
      })
    },
    invoices: {
      retrieve: jest.fn().mockResolvedValue({
        id: 'in_test123',
        subscription: 'sub_test123',
        status: 'paid',
        payment_intent: 'pi_test123'
      }),
      pay: jest.fn().mockResolvedValue({
        id: 'in_test123',
        status: 'paid'
      })
    },
    webhooks: {
      constructEvent: jest.fn().mockImplementation((body, signature, secret) => {
        return {
          id: 'evt_test123',
          type: 'payment_intent.succeeded',
          data: {
            object: {
              id: 'pi_test123',
              metadata: {
                subscriptionId: 'subscription_test123',
                tenantId: 'tenant_test123'
              },
              status: 'succeeded',
              payment_method: 'pm_test123'
            }
          }
        };
      })
    }
  }));
});

describe('Payment Lifecycle End-to-End Tests', () => {
  let browser;
  let page;
  let testUser;
  let testTenant;
  let authToken;
  let stripeServiceStub;
  let emailServiceStub;
  
  before(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/chatbots_test', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    // Clear test data
    await User.deleteMany({});
    await Tenant.deleteMany({});
    await Subscription.deleteMany({});
    await PaymentAttempt.deleteMany({});
    
    // Create test tenant
    testTenant = await Tenant.create({
      name: 'Test Tenant',
      organizationDetails: {
        companyName: 'Test Company',
        website: 'https://test.com',
        industry: 'Technology'
      },
      contactDetails: {
        email: 'test@test.com',
        phone: '555-123-4567'
      }
    });
    
    // Create test user
    testUser = await User.create({
      email: 'test@test.com',
      password: 'hashedPassword123',
      firstName: 'Test',
      lastName: 'User',
      tenantId: testTenant._id,
      role: 'admin'
    });
    
    // Generate auth token
    authToken = jwt.sign(
      { userId: testUser._id, tenantId: testTenant._id, role: 'admin' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
    
    // Launch browser for E2E tests
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // Create new page
    page = await browser.newPage();
    
    // Set auth token in local storage
    await page.evaluateOnNewDocument((token) => {
      localStorage.setItem('authToken', token);
    }, authToken);
    
    // Stub external services
    stripeServiceStub = sinon.stub(stripeService);
    emailServiceStub = sinon.stub(emailService, 'sendEmail').resolves({ success: true });
  });
  
  after(async () => {
    // Close browser
    if (browser) {
      await browser.close();
    }
    
    // Restore stubs
    if (stripeServiceStub) {
      stripeServiceStub.restore();
    }
    
    if (emailServiceStub) {
      emailServiceStub.restore();
    }
    
    // Disconnect from database
    await mongoose.disconnect();
  });
  
  describe('Initial Subscription Creation', () => {
    it('should complete the initial subscription flow', async () => {
      // Navigate to plans page
      await page.goto('http://localhost:3000/billing/plans');
      await page.waitForSelector('.pricing-plan');
      
      // Select premium plan
      await page.click('.pricing-plan[data-plan-id="premium"]');
      await page.waitForSelector('#payment-form');
      
      // Fill payment form
      await page.type('#card-number', '4242424242424242');
      await page.type('#card-expiry', '1225');
      await page.type('#card-cvc', '123');
      await page.type('#billing-name', 'Test User');
      
      // Submit payment form
      await page.click('#submit-payment');
      await page.waitForSelector('.subscription-success', { timeout: 5000 });
      
      // Verify success message
      const successText = await page.$eval('.subscription-success', el => el.textContent);
      expect(successText).to.include('Subscription activated');
      
      // Verify subscription in database
      const subscription = await Subscription.findOne({ userId: testUser._id });
      expect(subscription).to.exist;
      expect(subscription.status).to.equal('active');
    });
  });
  
  describe('Payment Method Management', () => {
    it('should add a new payment method', async () => {
      // Navigate to payment methods page
      await page.goto('http://localhost:3000/billing/payment-methods');
      await page.waitForSelector('.payment-methods');
      
      // Click add new payment method
      await page.click('#add-payment-method');
      await page.waitForSelector('#payment-form');
      
      // Fill payment form
      await page.type('#card-number', '5555555555554444');
      await page.type('#card-expiry', '1226');
      await page.type('#card-cvc', '456');
      await page.type('#billing-name', 'Test User Alt');
      
      // Submit payment form
      await page.click('#submit-payment');
      await page.waitForSelector('.payment-method-success', { timeout: 5000 });
      
      // Verify success message
      const successText = await page.$eval('.payment-method-success', el => el.textContent);
      expect(successText).to.include('Payment method added');
      
      // Verify payment method in database
      const tenant = await Tenant.findById(testTenant._id);
      expect(tenant.paymentMethods).to.have.lengthOf(2); // Default + new one
    });
    
    it('should set a payment method as default', async () => {
      // Navigate to payment methods page
      await page.goto('http://localhost:3000/billing/payment-methods');
      await page.waitForSelector('.payment-methods');
      
      // Set second payment method as default
      await page.click('.payment-method:nth-child(2) .set-default');
      await page.waitForSelector('.payment-method:nth-child(2) .default-badge', { timeout: 5000 });
      
      // Verify default badge is visible
      const isDefaultVisible = await page.$eval('.payment-method:nth-child(2) .default-badge', el => el.style.display !== 'none');
      expect(isDefaultVisible).to.be.true;
      
      // Verify in database
      const tenant = await Tenant.findById(testTenant._id);
      expect(tenant.defaultPaymentMethod).to.equal(tenant.paymentMethods[1].paymentMethodId);
    });
    
    it('should delete a payment method', async () => {
      // Navigate to payment methods page
      await page.goto('http://localhost:3000/billing/payment-methods');
      await page.waitForSelector('.payment-methods');
      
      // Get initial count of payment methods
      const initialCount = await page.$$eval('.payment-method', methods => methods.length);
      
      // Delete first payment method
      await page.click('.payment-method:nth-child(1) .delete-payment-method');
      await page.waitForSelector('.confirm-delete');
      await page.click('.confirm-delete-button');
      
      // Wait for deletion to complete
      await page.waitForFunction(
        initialCount => document.querySelectorAll('.payment-method').length === initialCount - 1,
        { timeout: 5000 },
        initialCount
      );
      
      // Verify payment method count
      const finalCount = await page.$$eval('.payment-method', methods => methods.length);
      expect(finalCount).to.equal(initialCount - 1);
      
      // Verify in database
      const tenant = await Tenant.findById(testTenant._id);
      expect(tenant.paymentMethods).to.have.lengthOf(1);
    });
  });
  
  describe('Payment Failure and Recovery', () => {
    it('should handle payment failure gracefully', async () => {
      // Mock Stripe to simulate payment failure
      const stripeInstance = require('stripe')();
      stripeInstance.paymentIntents.update.mockResolvedValueOnce({
        id: 'pi_test123',
        status: 'requires_payment_method',
        last_payment_error: {
          message: 'Your card was declined.'
        }
      });
      
      // Navigate to subscription page
      await page.goto('http://localhost:3000/billing/subscription');
      await page.waitForSelector('.subscription-details');
      
      // Simulate failed payment (trigger manual payment)
      await page.click('#trigger-payment');
      await page.waitForSelector('.payment-error', { timeout: 5000 });
      
      // Verify error message
      const errorText = await page.$eval('.payment-error', el => el.textContent);
      expect(errorText).to.include('Your card was declined');
      
      // Verify recovery options are shown
      const recoveryVisible = await page.$eval('.payment-recovery-options', el => el.style.display !== 'none');
      expect(recoveryVisible).to.be.true;
      
      // Update payment method to recover
      await page.click('#update-payment-method');
      await page.waitForSelector('#payment-form');
      
      // Fill payment form with new card
      await page.type('#card-number', '4242424242424242');
      await page.type('#card-expiry', '1225');
      await page.type('#card-cvc', '123');
      
      // Submit payment form
      await page.click('#submit-payment');
      await page.waitForSelector('.payment-success', { timeout: 5000 });
      
      // Verify success message
      const successText = await page.$eval('.payment-success', el => el.textContent);
      expect(successText).to.include('Payment successful');
      
      // Verify subscription is active
      const subscription = await Subscription.findOne({ userId: testUser._id });
      expect(subscription.status).to.equal('active');
    });
  });
  
  describe('Subscription Management', () => {
    it('should cancel subscription', async () => {
      // Navigate to subscription page
      await page.goto('http://localhost:3000/billing/subscription');
      await page.waitForSelector('.subscription-details');
      
      // Cancel subscription
      await page.click('#cancel-subscription');
      await page.waitForSelector('.confirm-cancel');
      await page.click('.confirm-cancel-button');
      
      // Wait for cancellation to complete
      await page.waitForSelector('.subscription-canceled', { timeout: 5000 });
      
      // Verify cancellation message
      const cancelText = await page.$eval('.subscription-canceled', el => el.textContent);
      expect(cancelText).to.include('Subscription canceled');
      
      // Verify subscription status in database
      const subscription = await Subscription.findOne({ userId: testUser._id });
      expect(subscription.status).to.equal('canceled');
    });
    
    it('should reactivate subscription', async () => {
      // Navigate to subscription page
      await page.goto('http://localhost:3000/billing/subscription');
      await page.waitForSelector('.subscription-details');
      
      // Reactivate subscription
      await page.click('#reactivate-subscription');
      await page.waitForSelector('.confirm-reactivate');
      await page.click('.confirm-reactivate-button');
      
      // Wait for reactivation to complete
      await page.waitForSelector('.subscription-active', { timeout: 5000 });
      
      // Verify reactivation message
      const activeText = await page.$eval('.subscription-active', el => el.textContent);
      expect(activeText).to.include('Subscription active');
      
      // Verify subscription status in database
      const subscription = await Subscription.findOne({ userId: testUser._id });
      expect(subscription.status).to.equal('active');
    });
  });
});
