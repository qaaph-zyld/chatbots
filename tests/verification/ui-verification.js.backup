/**
 * UI Verification Tests
 * 
 * These tests verify the user interface after deployment.
 * They are run as part of the deployment verification process
 * to ensure the UI is functioning correctly before switching traffic.
 */

const { test, expect } = require('@playwright/test');

// Get the base URL from environment or use default
const BASE_URL = process.env.TEST_URL || 'https://chatbot-platform.example.com';

// Test credentials
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

test.describe('UI Verification Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the application
    await page.goto(BASE_URL);
  });

  test('should load the landing page', async ({ page }) => {
    // Check that the page loaded successfully
    await expect(page).toHaveTitle(/Chatbot Platform/);
    
    // Check for key elements
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
    
    // Check for hero section
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Chatbot Platform');
  });

  test('should navigate to login page', async ({ page }) => {
    // Click the login button
    await page.locator('text=Login').click();
    
    // Check that we're on the login page
    await expect(page).toHaveURL(/.*login/);
    
    // Check for login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should navigate to signup page', async ({ page }) => {
    // Click the signup button
    await page.locator('text=Sign Up').click();
    
    // Check that we're on the signup page
    await expect(page).toHaveURL(/.*signup/);
    
    // Check for signup form elements
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should login successfully', async ({ page }) => {
    // Go to the login page
    await page.goto(`${BASE_URL}/login`);
    
    // Fill in the login form
    await page.locator('input[type="email"]').fill(TEST_USER_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_USER_PASSWORD);
    
    // Submit the form
    await page.locator('button[type="submit"]').click();
    
    // Check that we're redirected to the dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Check for dashboard elements
    await expect(page.locator('h1')).toContainText('Dashboard');
    await expect(page.locator('text=My Chatbots')).toBeVisible();
  });

  test('should display chatbot list', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.locator('input[type="email"]').fill(TEST_USER_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_USER_PASSWORD);
    await page.locator('button[type="submit"]').click();
    
    // Go to the chatbots page
    await page.locator('text=My Chatbots').click();
    
    // Check that we're on the chatbots page
    await expect(page).toHaveURL(/.*chatbots/);
    
    // Check for chatbot list elements
    await expect(page.locator('h1')).toContainText('My Chatbots');
    await expect(page.locator('button:has-text("Create Chatbot")')).toBeVisible();
    
    // Check that the chatbot list is visible
    await expect(page.locator('.chatbot-list')).toBeVisible();
  });

  test('should create a new chatbot', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.locator('input[type="email"]').fill(TEST_USER_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_USER_PASSWORD);
    await page.locator('button[type="submit"]').click();
    
    // Go to the chatbots page
    await page.locator('text=My Chatbots').click();
    
    // Click the create chatbot button
    await page.locator('button:has-text("Create Chatbot")').click();
    
    // Check that we're on the create chatbot page
    await expect(page).toHaveURL(/.*chatbots\/create/);
    
    // Fill in the chatbot form
    const chatbotName = `UI Test Bot ${Date.now()}`;
    await page.locator('input[name="name"]').fill(chatbotName);
    await page.locator('textarea[name="description"]').fill('Created during UI verification testing');
    await page.locator('select[name="type"]').selectOption('customer-support');
    
    // Submit the form
    await page.locator('button[type="submit"]').click();
    
    // Check that we're redirected to the chatbot details page
    await expect(page).toHaveURL(/.*chatbots\/[\w-]+/);
    
    // Check that the chatbot name is displayed
    await expect(page.locator('h1')).toContainText(chatbotName);
  });

  test('should edit a chatbot', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.locator('input[type="email"]').fill(TEST_USER_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_USER_PASSWORD);
    await page.locator('button[type="submit"]').click();
    
    // Go to the chatbots page
    await page.locator('text=My Chatbots').click();
    
    // Click on the first chatbot in the list
    await page.locator('.chatbot-list .chatbot-item').first().click();
    
    // Click the edit button
    await page.locator('button:has-text("Edit")').click();
    
    // Check that we're on the edit page
    await expect(page).toHaveURL(/.*edit/);
    
    // Update the description
    await page.locator('textarea[name="description"]').fill('Updated during UI verification testing');
    
    // Submit the form
    await page.locator('button[type="submit"]').click();
    
    // Check that we're redirected to the chatbot details page
    await expect(page).toHaveURL(/.*chatbots\/[\w-]+/);
    
    // Check that the updated description is displayed
    await expect(page.locator('.chatbot-description')).toContainText('Updated during UI verification testing');
  });

  test('should delete a chatbot', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.locator('input[type="email"]').fill(TEST_USER_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_USER_PASSWORD);
    await page.locator('button[type="submit"]').click();
    
    // Go to the chatbots page
    await page.locator('text=My Chatbots').click();
    
    // Count the number of chatbots before deletion
    const beforeCount = await page.locator('.chatbot-list .chatbot-item').count();
    
    // Click on the first chatbot in the list
    await page.locator('.chatbot-list .chatbot-item').first().click();
    
    // Click the delete button
    await page.locator('button:has-text("Delete")').click();
    
    // Confirm deletion in the modal
    await page.locator('button:has-text("Confirm")').click();
    
    // Check that we're redirected to the chatbots page
    await expect(page).toHaveURL(/.*chatbots$/);
    
    // Check that the number of chatbots has decreased
    const afterCount = await page.locator('.chatbot-list .chatbot-item').count();
    expect(afterCount).toBe(beforeCount - 1);
  });

  test('should navigate to subscription page', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.locator('input[type="email"]').fill(TEST_USER_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_USER_PASSWORD);
    await page.locator('button[type="submit"]').click();
    
    // Go to the subscription page
    await page.locator('text=Subscription').click();
    
    // Check that we're on the subscription page
    await expect(page).toHaveURL(/.*subscription/);
    
    // Check for subscription page elements
    await expect(page.locator('h1')).toContainText('Subscription');
    await expect(page.locator('.subscription-details')).toBeVisible();
  });

  test('should navigate to analytics dashboard', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.locator('input[type="email"]').fill(TEST_USER_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_USER_PASSWORD);
    await page.locator('button[type="submit"]').click();
    
    // Go to the analytics dashboard
    await page.locator('text=Analytics').click();
    
    // Check that we're on the analytics page
    await expect(page).toHaveURL(/.*analytics/);
    
    // Check for analytics page elements
    await expect(page.locator('h1')).toContainText('Analytics');
    await expect(page.locator('.analytics-dashboard')).toBeVisible();
    await expect(page.locator('.chart')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.locator('input[type="email"]').fill(TEST_USER_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_USER_PASSWORD);
    await page.locator('button[type="submit"]').click();
    
    // Click the user menu
    await page.locator('.user-menu').click();
    
    // Click the logout button
    await page.locator('text=Logout').click();
    
    // Check that we're redirected to the home page
    await expect(page).toHaveURL(BASE_URL);
    
    // Check that the login button is visible
    await expect(page.locator('text=Login')).toBeVisible();
  });

  test('should handle responsive design', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that the mobile menu button is visible
    await expect(page.locator('.mobile-menu-button')).toBeVisible();
    
    // Open the mobile menu
    await page.locator('.mobile-menu-button').click();
    
    // Check that the navigation links are visible
    await expect(page.locator('nav a')).toBeVisible();
    
    // Test on tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Check that the layout adjusts
    await expect(page.locator('nav')).toBeVisible();
    
    // Test on desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    
    // Check that the desktop layout is visible
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('.mobile-menu-button')).not.toBeVisible();
  });

  test('should handle form validation', async ({ page }) => {
    // Go to the login page
    await page.goto(`${BASE_URL}/login`);
    
    // Submit the form without filling it
    await page.locator('button[type="submit"]').click();
    
    // Check for validation messages
    await expect(page.locator('.error-message')).toBeVisible();
    
    // Fill in invalid email
    await page.locator('input[type="email"]').fill('invalid-email');
    
    // Submit the form
    await page.locator('button[type="submit"]').click();
    
    // Check for validation message
    await expect(page.locator('.error-message')).toContainText('valid email');
    
    // Fill in valid email but no password
    await page.locator('input[type="email"]').fill('valid@example.com');
    
    // Submit the form
    await page.locator('button[type="submit"]').click();
    
    // Check for validation message
    await expect(page.locator('.error-message')).toContainText('password');
  });

  test('should handle incorrect login', async ({ page }) => {
    // Go to the login page
    await page.goto(`${BASE_URL}/login`);
    
    // Fill in the login form with incorrect credentials
    await page.locator('input[type="email"]').fill('wrong@example.com');
    await page.locator('input[type="password"]').fill('WrongPassword123!');
    
    // Submit the form
    await page.locator('button[type="submit"]').click();
    
    // Check for error message
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Invalid email or password');
    
    // Check that we're still on the login page
    await expect(page).toHaveURL(/.*login/);
  });
});
