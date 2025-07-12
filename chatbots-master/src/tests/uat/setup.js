/**
 * UAT Test Setup
 * 
 * This file contains the setup code for User Acceptance Testing with Playwright.
 * It handles authentication, environment configuration, and test utilities.
 */

const { chromium } = require('@playwright/test');
const axios = require('axios');

// UAT Environment Configuration
const UAT_URL = process.env.UAT_URL || 'http://localhost:3001';
const UAT_API_URL = `${UAT_URL}/api`;
const UAT_ADMIN_EMAIL = process.env.UAT_ADMIN_EMAIL || 'admin@example.com';
const UAT_ADMIN_PASSWORD = process.env.UAT_ADMIN_PASSWORD || 'Admin123!';
const UAT_CREATOR_EMAIL = process.env.UAT_CREATOR_EMAIL || 'creator@example.com';
const UAT_CREATOR_PASSWORD = process.env.UAT_CREATOR_PASSWORD || 'Creator123!';
const UAT_USER_EMAIL = process.env.UAT_USER_EMAIL || 'user@example.com';
const UAT_USER_PASSWORD = process.env.UAT_USER_PASSWORD || 'User123!';

/**
 * Global setup for UAT tests
 * Creates authenticated browser contexts for different user roles
 */
async function globalSetup() {
  // Launch browser
  const browser = await chromium.launch();
  
  // Create contexts for different user roles
  const adminContext = await createAuthenticatedContext(browser, UAT_ADMIN_EMAIL, UAT_ADMIN_PASSWORD);
  const creatorContext = await createAuthenticatedContext(browser, UAT_CREATOR_EMAIL, UAT_CREATOR_PASSWORD);
  const userContext = await createAuthenticatedContext(browser, UAT_USER_EMAIL, UAT_USER_PASSWORD);
  
  // Store authenticated storage states
  await adminContext.storageState({ path: './src/tests/uat/storage/adminState.json' });
  await creatorContext.storageState({ path: './src/tests/uat/storage/creatorState.json' });
  await userContext.storageState({ path: './src/tests/uat/storage/userState.json' });
  
  // Close contexts and browser
  await adminContext.close();
  await creatorContext.close();
  await userContext.close();
  await browser.close();
}

/**
 * Create an authenticated browser context for a user
 * @param {Browser} browser - Playwright browser instance
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {BrowserContext} Authenticated browser context
 */
async function createAuthenticatedContext(browser, email, password) {
  // Create a new context
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to login page
    await page.goto(`${UAT_URL}/login`);
    
    // Fill in login form
    await page.fill('#email', email);
    await page.fill('#password', password);
    
    // Submit form and wait for navigation
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation()
    ]);
    
    // Verify login was successful
    const isLoggedIn = await page.isVisible('.user-profile');
    if (!isLoggedIn) {
      throw new Error(`Failed to login as ${email}`);
    }
    
    return context;
  } catch (error) {
    console.error(`Error creating authenticated context for ${email}:`, error);
    await context.close();
    throw error;
  }
}

/**
 * Get an authentication token via API
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<string>} Authentication token
 */
async function getAuthToken(email, password) {
  try {
    const response = await axios.post(`${UAT_API_URL}/auth/login`, {
      email,
      password
    });
    
    return response.data.data.token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    throw error;
  }
}

/**
 * Create a test API client with authentication
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Object} Authenticated API client
 */
async function createApiClient(email, password) {
  const token = await getAuthToken(email, password);
  
  return axios.create({
    baseURL: UAT_API_URL,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
}

// Export setup functions and configuration
module.exports = {
  globalSetup,
  createAuthenticatedContext,
  getAuthToken,
  createApiClient,
  UAT_URL,
  UAT_API_URL,
  UAT_ADMIN_EMAIL,
  UAT_ADMIN_PASSWORD,
  UAT_CREATOR_EMAIL,
  UAT_CREATOR_PASSWORD,
  UAT_USER_EMAIL,
  UAT_USER_PASSWORD
};
