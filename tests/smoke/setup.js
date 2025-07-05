/**
 * Setup file for smoke tests
 * 
 * This file is executed before running smoke tests and sets up
 * the test environment, global variables, and any necessary mocks.
 */

// Set longer timeout for all tests
jest.setTimeout(30000);

// Environment variables
process.env.NODE_ENV = 'smoke';

// Log test environment details
console.log('Smoke Test Environment:');
console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`- TEST_URL: ${process.env.TEST_URL || 'https://chatbot-platform.example.com'}`);
console.log(`- Test Timestamp: ${new Date().toISOString()}`);

// Clean up function to run after all tests
afterAll(async () => {
  console.log('Smoke tests completed');
});
