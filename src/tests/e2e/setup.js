/**
 * End-to-End Tests Setup
 * 
 * This file contains setup code that runs before each end-to-end test
 */

const mongoose = require('mongoose');
require('@src/utils');
require('@src/config');

// Disable logging during tests
logger.silent = true;

// Setup before all tests
beforeAll(async () => {
  // Connect to test database
  const mongoUri = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/chatbots-test';
  await mongoose.connect(mongoUri);
  
  console.log(`Connected to test MongoDB at ${mongoUri}`);
});

// Cleanup after all tests
afterAll(async () => {
  // Disconnect from database
  await mongoose.disconnect();
  
  console.log('Disconnected from test MongoDB');
});

// Set longer timeout for E2E tests
jest.setTimeout(60000);
