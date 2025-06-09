/**
 * MongoDB Memory Server Setup for Jest
 * 
 * This file configures MongoDB Memory Server for testing.
 * It starts a MongoDB Memory Server instance before all tests
 * and stops it after all tests are complete.
 */

// Register module aliases before any other imports
require('../../../src/core/module-alias');

// Import mongoose test setup utilities
require('@tests/unit\setup\mongoose-test-setup');
const mongoose = require('mongoose');

// Set environment variables for tests
process.env.NODE_ENV = 'test';
process.env.USE_MEMORY_SERVER = 'true';

// Start MongoDB Memory Server and connect before all tests
beforeAll(async () => {
  try {
    // Connect to MongoDB Memory Server using our utility
    await connectTestDB();
    
    // Set environment variable for tests
    process.env.MONGODB_URI = mongoose.connection.client.s.url;
    
    // Log connection info
    console.log(`MongoDB Memory Server started at ${mongoose.connection.client.s.url}`);
  } catch (error) {
    console.error('Failed to start MongoDB Memory Server:', error);
    throw error;
  }
});

// Clear database between tests
beforeEach(async () => {
  // Use our utility to clear the database
  await clearDatabase();
  console.log('Cleared database between tests');
});

// Close MongoDB Memory Server after all tests
afterAll(async () => {
  // Use our utility to disconnect and stop the MongoDB Memory Server
  await disconnectTestDB();
  console.log('Disconnected and stopped MongoDB Memory Server');
});

// Export utilities for direct access if needed
module.exports = {
  connectTestDB,
  disconnectTestDB,
  clearDatabase
};
