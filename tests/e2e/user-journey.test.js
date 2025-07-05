/**
 * End-to-End Test for Critical User Journeys
 * 
 * Tests the complete user flow from registration to subscription management
 */

const { chromium } = require('playwright');
const { expect } = require('@playwright/test');
const config = require('../../src/core/config');

let browser;
let page;

const TEST_USER = {
  email: 'e2e-test-user@example.com',
  password: 'TestPassword123!',
  firstName: 'E2E',
  lastName: 'Tester'
};

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

beforeAll(async () => {
  browser = await chromium.launch({ headless: true });
});

afterAll(async () => {
  await browser.close();
});

beforeEach(async () => {
  page = await browser.newPage();
  await page.goto(BASE_URL);
});

afterEach(async () => {
  await page.close();
});

describe('User Registration and Onboarding', () => {
  test('New user can register successfully', async () => {
    // Navigate to registration page
    await page.click('text=Sign Up');
    
    // Fill registration form
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.fill('input[name="firstName"]', TEST_USER.firstName);
    await page.fill('input[name="lastName"]', TEST_USER.lastName);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Check for successful registration
    await page.waitForSelector('text=Welcome to Chatbot Platform');
    
    // Verify redirect to onboarding
    expect(page.url()).toContain('/onboarding');
  });
  
  test('User can complete onboarding flow', async () => {
    // Login first
    await page.click('text=Log In');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // Navigate to onboarding if not already there
    if (!page.url().includes('/onboarding')) {
      await page.goto(`${BASE_URL}/onboarding`);
    }
    
    // Step 1: Select use case
    await page.click('text=Customer Support');
    await page.click('text=Next');
    
    // Step 2: Configure chatbot
    await page.fill('input[name="botName"]', 'E2E Test Bot');
    await page.selectOption('select[name="language"]', 'English');
    await page.click('text=Next');
    
    // Step 3: Choose subscription plan
    await page.click('text=Free Trial');
    await page.click('text=Complete Setup');
    
    // Verify redirect to dashboard
    await page.waitForSelector('text=Dashboard');
    expect(page.url()).toContain('/dashboard');
  });
});

describe('Chatbot Management', () => {
  test('User can create a new chatbot', async () => {
    // Login first
    await page.click('text=Log In');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // Navigate to chatbot creation
    await page.click('text=Create New Chatbot');
    
    // Fill chatbot details
    await page.fill('input[name="name"]', 'E2E Test Bot 2');
    await page.fill('textarea[name="description"]', 'A bot created during E2E testing');
    await page.selectOption('select[name="template"]', 'customer-support');
    
    // Create chatbot
    await page.click('button:has-text("Create")'); 
    
    // Verify success
    await page.waitForSelector('text=Chatbot created successfully');
    
    // Verify chatbot appears in list
    await page.click('text=My Chatbots');
    await page.waitForSelector('text=E2E Test Bot 2');
  });
  
  test('User can configure chatbot settings', async () => {
    // Login first
    await page.click('text=Log In');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // Navigate to chatbot list
    await page.click('text=My Chatbots');
    
    // Select the test chatbot
    await page.click('text=E2E Test Bot 2');
    
    // Go to settings
    await page.click('text=Settings');
    
    // Update settings
    await page.fill('input[name="welcomeMessage"]', 'Welcome to the E2E test bot!');
    await page.click('button:has-text("Save Changes")');
    
    // Verify success
    await page.waitForSelector('text=Settings updated successfully');
  });
});

describe('Subscription Management', () => {
  test('User can view subscription details', async () => {
    // Login first
    await page.click('text=Log In');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // Navigate to subscription page
    await page.click('text=Account');
    await page.click('text=Subscription');
    
    // Verify subscription details are visible
    await page.waitForSelector('text=Current Plan');
    await page.waitForSelector('text=Free Trial');
  });
  
  test('User can view available plans', async () => {
    // Login first
    await page.click('text=Log In');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // Navigate to plans page
    await page.click('text=Account');
    await page.click('text=Subscription');
    await page.click('text=View Plans');
    
    // Verify plans are visible
    await page.waitForSelector('text=Basic');
    await page.waitForSelector('text=Professional');
    await page.waitForSelector('text=Enterprise');
  });
});

describe('Analytics Dashboard', () => {
  test('User can view analytics dashboard', async () => {
    // Login first
    await page.click('text=Log In');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // Navigate to analytics
    await page.click('text=Analytics');
    
    // Verify analytics components are visible
    await page.waitForSelector('text=Conversation Metrics');
    await page.waitForSelector('text=User Engagement');
    await page.waitForSelector('text=Response Times');
  });
});

describe('User Cleanup', () => {
  test('Clean up test user data', async () => {
    // This would typically call an API endpoint specifically for testing
    // that cleans up test user data
    
    // For this example, we'll just verify we can logout
    await page.click('text=Account');
    await page.click('text=Logout');
    
    // Verify redirect to login page
    await page.waitForSelector('text=Log In');
    expect(page.url()).toContain('/login');
  });
});
