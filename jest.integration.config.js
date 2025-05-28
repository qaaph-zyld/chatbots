/**
 * Jest Integration Tests Configuration
 */

const baseConfig = require('./jest.config');

module.exports = {
  ...baseConfig,
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/tests/integration/**/*.test.js',
    '**/tests/integration/**/*.spec.js'
  ],
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/tests/integration/setup.js'
  ],
  
  // Global setup/teardown
  globalSetup: '<rootDir>/src/tests/integration/global-setup.js',
  globalTeardown: '<rootDir>/src/tests/integration/global-teardown.js',
  
  // Coverage configuration
  collectCoverage: false,
  
  // Test timeout (longer for integration tests)
  testTimeout: 30000
};
