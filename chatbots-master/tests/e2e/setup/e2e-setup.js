/**
 * End-to-End Test Setup for Jest
 * 
 * This file configures the environment for end-to-end tests.
 * It handles server startup, browser automation, and test cleanup.
 */

// Register module aliases before any other imports
require('../../../src/core/module-alias');

// Import mongoose and test setup utilities
require('@tests/unit\setup\mongoose-test-setup');
const mongoose = require('mongoose');
const { setup: setupServer } = require('@core/server');
const { chromium } = require('playwright');

// Config
const SERVER_PORT = process.env.PORT || 3000;
const SERVER_URL = `http://localhost:${SERVER_PORT}`;

// Set environment variables for tests
process.env.NODE_ENV = 'test';

// Global variables
let server;
let browser;
let page;

// Start test environment before all tests
beforeAll(async () => {
  try {
    // Connect to test database (will use Memory Server if USE_MEMORY_SERVER=true)
    await connectTestDB();
    const uri = mongoose.connection.client.s.url;
    console.log(`Connected to MongoDB at ${uri}`);
    
    // Start server
    server = await setupServer({
      port: SERVER_PORT,
      mongoUri: uri
    });
    
    console.log(`Server started at ${SERVER_URL}`);
    
    // Launch browser
    browser = await chromium.launch({
      headless: !process.env.DEBUG_E2E
    });
    
    // Create a new page
    page = await browser.newPage();
    
    // Set global variables for tests
    global.__SERVER__ = server;
    global.__BROWSER__ = browser;
    global.__PAGE__ = page;
    global.__SERVER_URL__ = SERVER_URL;
    
  } catch (error) {
    console.error('Failed to set up E2E test environment:', error);
    throw error;
  }
});

// Reset state between tests
beforeEach(async () => {
  // Clear database using our utility
  await clearDatabase();
  
  // Reset browser state
  await page.goto(SERVER_URL);
});

// Clean up after all tests
afterAll(async () => {
  // Close browser
  if (browser) {
    await browser.close();
  }
  
  // Stop server
  if (server) {
    await new Promise((resolve) => {
      server.close(resolve);
    });
    console.log('Server stopped');
  }
  
  // Disconnect from database and stop MongoDB Memory Server using our utility
  await disconnectTestDB();
  console.log('Disconnected from MongoDB and stopped Memory Server');
});

// Helper functions for tests
const helpers = {
  /**
   * Navigate to a specific page
   */
  async navigateTo(path) {
    await page.goto(`${SERVER_URL}${path}`);
  },
  
  /**
   * Fill a form with data
   */
  async fillForm(formSelector, data) {
    await page.waitForSelector(formSelector);
    
    for (const [field, value] of Object.entries(data)) {
      await page.fill(`${formSelector} [name="${field}"]`, value);
    }
  },
  
  /**
   * Submit a form
   */
  async submitForm(formSelector) {
    await page.click(`${formSelector} [type="submit"]`);
  }
};

// Export helper functions for tests
module.exports = helpers;
