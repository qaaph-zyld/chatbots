/**
 * Setup file for verification tests
 * 
 * This file is executed before running verification tests and sets up
 * the test environment, global variables, and any necessary mocks.
 */

// Set longer timeout for all tests
jest.setTimeout(30000);

// Environment variables
process.env.NODE_ENV = 'verification';

// Global test utilities
global.testUtils = {
  // Helper to wait for a specific condition
  waitFor: async (conditionFn, timeout = 10000, interval = 100) => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      if (await conditionFn()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    throw new Error(`Condition not met within ${timeout}ms`);
  },
  
  // Helper to retry a function until it succeeds
  retry: async (fn, maxRetries = 3, delay = 1000) => {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        console.log(`Attempt ${i + 1}/${maxRetries} failed: ${error.message}`);
        lastError = error;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw lastError;
  }
};

// Log test environment details
console.log('Verification Test Environment:');
console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`- TEST_HOST: ${process.env.TEST_HOST || 'localhost:3000'}`);
console.log(`- Test Timestamp: ${new Date().toISOString()}`);

// Clean up function to run after all tests
afterAll(async () => {
  console.log('Verification tests completed');
});
