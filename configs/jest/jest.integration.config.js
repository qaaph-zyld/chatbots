/**
 * Jest configuration for integration tests
 */

const path = require('path');
const baseConfig = require('../../jest.config');

// Get the root directory path
const rootDir = path.resolve(__dirname, '../..');

module.exports = {
  ...baseConfig,
  // Override the root directory to ensure paths resolve correctly
  rootDir,
  // Use a different test environment setup file
  setupFilesAfterEnv: [
    path.join(rootDir, 'tests/integration/setup/integration-setup.js')
  ],
  // Add test match patterns specific to integration tests
  testMatch: [
    path.join(rootDir, 'tests/integration/**/*.test.js'),
    path.join(rootDir, 'tests/integration/**/*.spec.js')
  ],
  // Increase timeout for integration tests
  testTimeout: 30000,
  // Set environment variables via Jest's testEnvironment options
  testEnvironment: 'node',
  testEnvironmentOptions: {
    NODE_ENV: 'test',
    INTEGRATION_TEST: 'true'
  }
};
