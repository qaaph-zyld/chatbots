/**
 * Jest End-to-End Tests Configuration
 */

const baseConfig = require('./jest.config');

module.exports = {
  ...baseConfig,
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/tests/e2e/**/*.test.js',
    '**/tests/e2e/**/*.spec.js'
  ],
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/tests/e2e/setup.js'
  ],
  
  // Global setup/teardown
  globalSetup: '<rootDir>/src/tests/e2e/global-setup.js',
  globalTeardown: '<rootDir>/src/tests/e2e/global-teardown.js',
  
  // Coverage configuration
  collectCoverage: false,
  
  // Test timeout (much longer for E2E tests)
  testTimeout: 60000
};
