// Enhanced test setup
// Mock server temporarily disabled due to path-to-regexp compatibility issues
// const { server } = require('./mock-server');
require('../../src/tests/setup/jest-setup');

// Global test configuration
jest.setTimeout(30000); // 30 second timeout

// Setup mock server before all tests
beforeAll(async () => {
  // Wait for mock server to be ready
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.BASE_URL = 'http://localhost:3001';
  process.env.API_VERSION = 'v1';
});

// Cleanup after all tests
afterAll(async () => {
  // Mock server cleanup disabled
  // if (server) {
  //   server.close();
  // }
});

// Mock common modules
jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: {}, status: 200 })),
  post: jest.fn(() => Promise.resolve({ data: {}, status: 200 })),
  put: jest.fn(() => Promise.resolve({ data: {}, status: 200 })),
  delete: jest.fn(() => Promise.resolve({ data: {}, status: 200 }))
}));
