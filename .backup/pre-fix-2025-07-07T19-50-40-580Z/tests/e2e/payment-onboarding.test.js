/**
 * End-to-End Test for Payment Onboarding Flow
 * 
 * Tests the complete payment onboarding flow from plan selection to subscription activation
 */

const puppeteer = require('puppeteer');
const { expect } = require('chai');
const mongoose = require('mongoose');
const config = require('../../src/core/config');
const User = require('../../src/auth/models/user.model');
const Tenant = require('../../src/tenancy/models/tenant.model');
const Subscription = require('../../src/billing/models/subscription.model');
const jwt = require('jsonwebtoken');

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
      })
    }
  }));
});

describe('Payment Onboarding Flow', () => {
  let browser;
  let page;
  let testUser;
  let testTenant;
  let authToken;
  
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
    
    // Create test user and tenant
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
    
    testUser = await User.create({
      email: 'test@test.com',
      password: 'hashedPassword123',
      firstName: 'Test',
      lastName: 'User',
      tenantId: testTenant._id,
      role: 'admin'
    });
    
    // Create auth token for testing
    authToken = jwt.sign(
      { userId: testUser._id, tenantId: testTenant._id },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // Create new page
    page = await browser.newPage();
    
    // Set viewport size
    await page.setViewport({ width: 1280, height: 800 });
    
    // Set auth token in local storage
    await page.evaluateOnNewDocument((token) => {
      localStorage.setItem('authToken', token);
    }, authToken);
  });
  
  after(async () => {
    // Close browser
    await browser.close();
    
    // Clear test data
    await User.deleteMany({});
    await Tenant.deleteMany({});
    await Subscription.deleteMany({});
    
    // Disconnect from test database
    await mongoose.connection.close();
  });
  
  it('should complete the full payment onboarding flow', async () => {
    // Step 1: Navigate to plans page
    await page.goto('http://localhost:3000/billing/plans');
    await page.waitForSelector('.card-header');
    
    // Verify plans are displayed
    const planCards = await page.$$('.card');
    expect(planCards.length).to.be.greaterThan(0);
    
    // Step 2: Select a plan
    await page.click('.card:nth-child(2)');
    await page.waitForTimeout(500);
    
    // Step 3: Select annual billing cycle
    await page.click('button:contains("Annual")');
    await page.waitForTimeout(500);
    
    // Step 4: Continue to payment
    await page.click('button:contains("Continue to Payment")');
    await page.waitForSelector('form.payment-form');
    
    // Verify subscription details are displayed
    const subscriptionDetails = await page.$eval('.card-body', el => el.textContent);
    expect(subscriptionDetails).to.include('Plan:');
    expect(subscriptionDetails).to.include('Billing Cycle:');
    expect(subscriptionDetails).to.include('Amount:');
    
    // Step 5: Fill payment form
    await page.type('#name', 'Test User');
    await page.type('#email', 'test@test.com');
    
    // Fill Stripe card element using iframe
    const cardElementIframe = await page.waitForSelector('iframe[name^="__privateStripeFrame"]');
    const cardElementFrame = await cardElementIframe.contentFrame();
    await cardElementFrame.waitForSelector('input[name="cardnumber"]');
    await cardElementFrame.type('input[name="cardnumber"]', '4242424242424242');
    await cardElementFrame.type('input[name="exp-date"]', '1225');
    await cardElementFrame.type('input[name="cvc"]', '123');
    await cardElementFrame.type('input[name="postal"]', '12345');
    
    // Step 6: Submit payment form
    await page.click('button:contains("Pay Now")');
    
    // Wait for payment processing and success message
    await page.waitForSelector('h2:contains("Payment Successful")');
    
    // Verify success message is displayed
    const successMessage = await page.$eval('h2', el => el.textContent);
    expect(successMessage).to.include('Payment Successful');
    
    // Step 7: Navigate to subscriptions page
    await page.click('button:contains("Go to Dashboard")');
    await page.goto('http://localhost:3000/billing/subscriptions');
    await page.waitForSelector('table');
    
    // Verify subscription is active
    const subscriptionStatus = await page.$eval('tbody tr:first-child td:nth-child(2)', el => el.textContent);
    expect(subscriptionStatus.trim()).to.include('Active');
    
    // Step 8: Navigate to add payment method page
    await page.click('a:contains("Add Payment Method")');
    await page.waitForSelector('form.payment-form');
    
    // Step 9: Fill payment method form
    await page.type('#name', 'Test User');
    await page.type('#email', 'test@test.com');
    
    // Fill Stripe card element using iframe
    const newCardElementIframe = await page.waitForSelector('iframe[name^="__privateStripeFrame"]');
    const newCardElementFrame = await newCardElementIframe.contentFrame();
    await newCardElementFrame.waitForSelector('input[name="cardnumber"]');
    await newCardElementFrame.type('input[name="cardnumber"]', '5555555555554444');
    await newCardElementFrame.type('input[name="exp-date"]', '1226');
    await newCardElementFrame.type('input[name="cvc"]', '456');
    await newCardElementFrame.type('input[name="postal"]', '54321');
    
    // Step 10: Submit payment method form
    await page.click('button:contains("Add Payment Method")');
    
    // Wait for redirect to subscriptions page
    await page.waitForSelector('table');
    
    // Verify new payment method is added
    const paymentMethods = await page.$$('table:nth-child(2) tbody tr');
    expect(paymentMethods.length).to.be.greaterThan(0);
    
    // Step 11: Set default payment method
    await page.click('button:contains("Set Default")');
    await page.waitForTimeout(500);
    
    // Verify default badge is displayed
    const defaultBadge = await page.$eval('table:nth-child(2) tbody tr:nth-child(2) td:nth-child(3)', el => el.textContent);
    expect(defaultBadge).to.include('Default');
    
    // Step 12: Remove payment method
    await page.click('button:contains("Remove")');
    await page.waitForTimeout(500);
    
    // Confirm removal
    await page.click('button:contains("OK")');
    await page.waitForTimeout(500);
    
    // Verify payment method is removed
    const remainingPaymentMethods = await page.$$('table:nth-child(2) tbody tr');
    expect(remainingPaymentMethods.length).to.be.equal(1);
  });
  
  it('should handle payment failure gracefully', async () => {
    // Mock Stripe to simulate payment failure
    jest.spyOn(window.Stripe.prototype, 'confirmCardPayment').mockResolvedValue({
      error: {
        message: 'Your card was declined.'
      }
    });
    
    // Step 1: Navigate to plans page
    await page.goto('http://localhost:3000/billing/plans');
    await page.waitForSelector('.card-header');
    
    // Step 2: Select a plan and continue to payment
    await page.click('.card:nth-child(1)');
    await page.click('button:contains("Continue to Payment")');
    await page.waitForSelector('form.payment-form');
    
    // Step 3: Fill payment form with invalid card
    await page.type('#name', 'Test User');
    await page.type('#email', 'test@test.com');
    
    const cardElementIframe = await page.waitForSelector('iframe[name^="__privateStripeFrame"]');
    const cardElementFrame = await cardElementIframe.contentFrame();
    await cardElementFrame.type('input[name="cardnumber"]', '4000000000000002'); // Decline code
    await cardElementFrame.type('input[name="exp-date"]', '1225');
    await cardElementFrame.type('input[name="cvc"]', '123');
    await cardElementFrame.type('input[name="postal"]', '12345');
    
    // Step 4: Submit payment form
    await page.click('button:contains("Pay Now")');
    
    // Wait for error message
    await page.waitForSelector('.alert-danger');
    
    // Verify error message is displayed
    const errorMessage = await page.$eval('.alert-danger', el => el.textContent);
    expect(errorMessage).to.include('Your card was declined');
    
    // Reset mock
    window.Stripe.prototype.confirmCardPayment.mockRestore();
  });
});
