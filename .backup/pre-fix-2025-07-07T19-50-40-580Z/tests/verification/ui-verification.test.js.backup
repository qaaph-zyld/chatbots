/**
 * UI Verification Tests
 * 
 * These tests verify that the UI components are functioning correctly
 * after deployment. They are run as part of the deployment verification
 * process before switching traffic to the new deployment.
 */

const { test, expect } = require('@playwright/test');

// Test data
const TEST_USER = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!';
const BASE_URL = process.env.TEST_URL || 'https://chatbot-platform.example.com';

test.describe('UI Verification Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set default timeout
    test.setTimeout(30000);
  });

  test('should load the landing page correctly', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Verify page title
    await expect(page).toHaveTitle(/Chatbot Platform/);
    
    // Verify key elements
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
    
    // Verify hero section
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('a:text("Get Started")')).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Click login button
    await page.click('a:text("Login")');
    
    // Verify we're on login page
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('button:text("Sign In")')).toBeVisible();
  });

  test('should login successfully', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Fill login form
    await page.fill('input[name="email"]', TEST_USER);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    
    // Submit form
    await page.click('button:text("Sign In")');
    
    // Verify successful login
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator('h1:text("Dashboard")')).toBeVisible();
  });

  test('should display chatbot list', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', TEST_USER);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button:text("Sign In")');
    
    // Navigate to chatbots page
    await page.click('a:text("My Chatbots")');
    
    // Verify chatbot list is displayed
    await expect(page).toHaveURL(/.*\/chatbots/);
    await expect(page.locator('h1:text("My Chatbots")')).toBeVisible();
    
    // Verify create button is present
    await expect(page.locator('button:text("Create New")')).toBeVisible();
  });

  test('should open chatbot creation form', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', TEST_USER);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button:text("Sign In")');
    
    // Navigate to chatbots page
    await page.click('a:text("My Chatbots")');
    
    // Click create button
    await page.click('button:text("Create New")');
    
    // Verify form is displayed
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('textarea[name="description"]')).toBeVisible();
    await expect(page.locator('button:text("Create")')).toBeVisible();
  });

  test('should display subscription information', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', TEST_USER);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button:text("Sign In")');
    
    // Navigate to subscription page
    await page.click('a:text("Subscription")');
    
    // Verify subscription info is displayed
    await expect(page).toHaveURL(/.*\/subscription/);
    await expect(page.locator('h1:text("Subscription")')).toBeVisible();
    
    // Verify current plan is displayed
    await expect(page.locator('text="Current Plan"')).toBeVisible();
  });

  test('should display analytics dashboard', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', TEST_USER);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button:text("Sign In")');
    
    // Navigate to analytics page
    await page.click('a:text("Analytics")');
    
    // Verify analytics dashboard is displayed
    await expect(page).toHaveURL(/.*\/analytics/);
    await expect(page.locator('h1:text("Analytics Dashboard")')).toBeVisible();
    
    // Verify charts are present
    await expect(page.locator('.chart-container')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', TEST_USER);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button:text("Sign In")');
    
    // Click logout button
    await page.click('button:text("Logout")');
    
    // Verify we're logged out and redirected to home
    await expect(page).toHaveURL(BASE_URL);
    await expect(page.locator('a:text("Login")')).toBeVisible();
  });
});
