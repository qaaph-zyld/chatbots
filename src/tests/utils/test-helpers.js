/**
 * Test Helpers
 * 
 * Utility functions for testing
 */

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('@src/models\user.model');
require('@src/models\chatbot.model');
require('@src/models\integration.model');

/**
 * Create a test user
 * @param {Object} userData - User data (optional)
 * @returns {Promise<Object>} - Created user document
 */
const createTestUser = async (userData = {}) => {
  const defaultUserData = {
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: await bcrypt.hash('password123', 10),
    role: 'user',
    permissions: ['chatbot:read', 'chatbot:write']
  };
  
  const user = new User({
    ...defaultUserData,
    ...userData
  });
  
  await user.save();
  return user;
};

/**
 * Create a test admin user
 * @returns {Promise<Object>} - Created admin user document
 */
const createTestAdmin = async () => {
  return createTestUser({
    username: `admin_${Date.now()}`,
    email: `admin_${Date.now()}@example.com`,
    role: 'admin',
    permissions: ['chatbot:read', 'chatbot:write', 'chatbot:delete', 'user:read', 'user:write', 'user:delete', 'admin']
  });
};

/**
 * Create a test chatbot
 * @param {Object} chatbotData - Chatbot data (optional)
 * @param {Object} owner - Owner user document
 * @returns {Promise<Object>} - Created chatbot document
 */
const createTestChatbot = async (chatbotData = {}, owner) => {
  if (!owner) {
    owner = await createTestUser();
  }
  
  const defaultChatbotData = {
    name: `Test Chatbot ${Date.now()}`,
    description: 'A test chatbot for automated testing',
    owner: owner._id,
    status: 'active',
    settings: {
      language: 'en',
      defaultPersonality: 'friendly',
      maxContextLength: 10
    }
  };
  
  const chatbot = new Chatbot({
    ...defaultChatbotData,
    ...chatbotData
  });
  
  await chatbot.save();
  return chatbot;
};

/**
 * Create a test integration
 * @param {Object} integrationData - Integration data (optional)
 * @param {Object} chatbot - Chatbot document
 * @returns {Promise<Object>} - Created integration document
 */
const createTestIntegration = async (integrationData = {}, chatbot) => {
  if (!chatbot) {
    chatbot = await createTestChatbot();
  }
  
  const defaultIntegrationData = {
    name: `Test Integration ${Date.now()}`,
    platform: 'web',
    chatbotId: chatbot._id,
    status: 'active',
    config: {
      webhook: 'https://example.com/webhook',
      apiKey: 'test-api-key'
    }
  };
  
  const integration = new Integration({
    ...defaultIntegrationData,
    ...integrationData
  });
  
  await integration.save();
  return integration;
};

/**
 * Generate a JWT token for a user
 * @param {Object} user - User document
 * @returns {string} - JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      username: user.username,
      role: user.role,
      permissions: user.permissions
    },
    process.env.JWT_SECRET || 'test-jwt-secret',
    { expiresIn: '1h' }
  );
};

/**
 * Generate an API key for testing
 * @param {Object} user - User document
 * @returns {string} - API key
 */
const generateApiKey = (user) => {
  const payload = {
    id: user._id,
    type: 'api_key',
    permissions: user.permissions
  };
  
  return jwt.sign(
    payload,
    process.env.API_KEY_SECRET || 'test-api-key-secret',
    { expiresIn: '30d' }
  );
};

/**
 * Clear all test data
 * @returns {Promise<void>}
 */
const clearTestData = async () => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('clearTestData can only be called in test environment');
  }
  
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

module.exports = {
  createTestUser,
  createTestAdmin,
  createTestChatbot,
  createTestIntegration,
  generateToken,
  generateApiKey,
  clearTestData
};
