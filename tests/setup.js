/**
 * Global Test Setup Configuration
 * Unified environment initialization for all test suites
 */

// Environment configuration
process.env.NODE_ENV = 'test';
process.env.DB_URI = 'mongodb://localhost:27017/chatbot_test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.PORT = 3001;
process.env.SUPPRESS_JEST_WARNINGS = 'true';

// Global test timeout
jest.setTimeout(10000);

// Configure Jest to work with Mongoose
beforeAll(() => {
  jest.useFakeTimers('legacy');
});

afterAll(() => {
  jest.useRealTimers();
});

// Database connection management
const mongoose = require('mongoose');

// MongoDB Memory Server for isolated testing
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Global setup - runs before all tests
beforeAll(async () => {
  try {
    // Start in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to test database
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Test database connected successfully');
  } catch (error) {
    console.error('Test database connection failed:', error);
    process.exit(1);
  }
});

// Global cleanup - runs after all tests
afterAll(async () => {
  try {
    // Close database connection
    await mongoose.connection.close();
    
    // Stop MongoDB server
    if (mongoServer) {
      await mongoServer.stop();
    }
    
    console.log('Test database disconnected successfully');
  } catch (error) {
    console.error('Test cleanup failed:', error);
  }
});

// Test data cleanup between tests
afterEach(async () => {
  try {
    // Clear all collections
    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  } catch (error) {
    console.error('Test data cleanup failed:', error);
  }
});

// Mock console methods for cleaner test output
const originalConsole = { ...console };

beforeEach(() => {
  // Suppress console output during tests
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  // Restore console methods
  console.log.mockRestore();
  console.error.mockRestore();
  console.warn.mockRestore();
});

// Global test utilities
global.testUtils = {
  // Generate test data
  generateTestData: {
    chatbot: (overrides = {}) => ({
      name: 'Test Chatbot',
      description: 'Test chatbot description',
      status: 'active',
      ...overrides
    }),
    
    conversation: (overrides = {}) => ({
      title: 'Test Conversation',
      status: 'active',
      messageCount: 0,
      metadata: {},
      ...overrides
    }),
    
    message: (overrides = {}) => ({
      content: 'Test message content',
      type: 'user',
      timestamp: new Date(),
      ...overrides
    })
  },
  
  // Common test expectations
  expectApiResponse: (response, statusCode = 200) => {
    expect(response.status).toBe(statusCode);
    expect(response.body).toHaveProperty('success');
    expect(response.body).toHaveProperty('data');
  },
  
  expectApiError: (response, statusCode = 400) => {
    expect(response.status).toBe(statusCode);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message');
  },
  
  // Database helpers
  cleanDatabase: async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
};

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
