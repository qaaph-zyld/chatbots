// This file runs after Jest has been loaded in the test environment
// but before the test framework is installed

// Set test environment
process.env.NODE_ENV = 'test';

// Import required modules
const { setupTestDB, teardownTestDB } = require('./jest-setup');

// Set up test database before all tests
beforeAll(async () => {
  await setupTestDB();
});

// Clean up after all tests
afterAll(async () => {
  await teardownTestDB();
});

// Reset test database before each test
beforeEach(async () => {
  // Clear all test data
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({}).catch(() => {});
    }
  }
});

// Add a test timeout of 30 seconds
jest.setTimeout(30000);

// Mock console methods to reduce test noise
const originalConsole = { ...console };

beforeEach(() => {
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
});

afterEach(() => {
  global.console = originalConsole;
});
