/**
 * Performance Tests Setup
 * 
 * This file contains setup code for performance tests
 */

const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { createTestUser, createTestChatbot } = require('../utils/test-helpers');
const User = require('../../models/user.model');
const Chatbot = require('../../models/chatbot.model');
const Integration = require('../../models/integration.model');

// Load environment variables
dotenv.config({ path: '.env.test' });

/**
 * Setup test environment for performance tests
 * @returns {Promise<Object>} Test data
 */
const setupTestEnvironment = async () => {
  console.log('Setting up test environment for performance tests...');
  
  // Connect to test database
  const mongoUri = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/chatbots-perf-test';
  await mongoose.connect(mongoUri);
  console.log(`Connected to test MongoDB at ${mongoUri}`);
  
  // Create test user
  const testUser = await createTestUser({
    email: process.env.TEST_USER_EMAIL || 'performance-test@example.com',
    password: process.env.TEST_USER_PASSWORD || 'password123',
    permissions: ['chatbot:read', 'chatbot:write', 'integration:read', 'integration:write']
  });
  console.log(`Created test user: ${testUser.email}`);
  
  // Create test chatbot
  const testChatbot = await createTestChatbot({
    name: 'Performance Test Chatbot',
    description: 'A chatbot for performance testing'
  }, testUser);
  console.log(`Created test chatbot: ${testChatbot.name}`);
  
  return {
    user: testUser,
    chatbot: testChatbot
  };
};

/**
 * Clean up test environment after performance tests
 */
const cleanupTestEnvironment = async () => {
  console.log('Cleaning up test environment...');
  
  // Clean up test data
  await User.deleteMany({ email: { $regex: /performance-test/ } });
  await Chatbot.deleteMany({ name: { $regex: /Performance Test/ } });
  await Integration.deleteMany({ name: { $regex: /Performance Test/ } });
  
  // Disconnect from database
  await mongoose.disconnect();
  console.log('Disconnected from test MongoDB');
};

// Export setup and cleanup functions
module.exports = {
  setupTestEnvironment,
  cleanupTestEnvironment
};

// If this script is run directly, set up the test environment
if (require.main === module) {
  (async () => {
    try {
      await setupTestEnvironment();
      console.log('Test environment setup complete.');
    } catch (error) {
      console.error('Error setting up test environment:', error);
      process.exit(1);
    }
  })();
}
