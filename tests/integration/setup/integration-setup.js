/**
 * Integration Test Setup for Jest
 * 
 * This file configures the environment for integration tests.
 * It handles database connections, test data setup, and cleanup.
 */

// Register module aliases before any other imports
require('../../../src/core/module-alias');

// Import mongoose and test setup utilities
const mongoose = require('mongoose');
require('@tests/unit\setup\mongoose-test-setup');

// Set environment variables for tests
process.env.NODE_ENV = 'test';

// Start database connection before all tests
beforeAll(async () => {
  try {
    // Connect to test database (will use Memory Server if USE_MEMORY_SERVER=true)
    await connectTestDB();
    console.log(`Connected to MongoDB at ${mongoose.connection.client.s.url}`);
    
    // Set up any global test data here
    await setupTestData();
    
  } catch (error) {
    console.error('Failed to set up integration test environment:', error);
    throw error;
  }
});

// Clear database between tests
beforeEach(async () => {
  // First clear the database using our utility
  await clearDatabase();
  
  // Then set up test data specific to integration tests
  await setupTestData();
});

// Close database connection after all tests
afterAll(async () => {
  // Use our utility to disconnect and stop MongoDB Memory Server if it's running
  await disconnectTestDB();
  console.log('Disconnected from MongoDB');
});

/**
 * Set up initial test data for integration tests
 */
async function setupTestData() {
  // Add code to set up any required test data for integration tests
  // This data will be available for all integration tests
  // For example:
  // await UserModel.create({ username: 'testuser', email: 'test@example.com' });
  // await ConfigModel.create({ key: 'test_config', value: 'test_value' });
}

// Export helper functions and utilities for tests
module.exports = {
  setupTestData,
  clearDatabase,
  connectTestDB,
  disconnectTestDB
};
