/**
 * Jest configuration for end-to-end tests
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
    path.join(rootDir, 'tests/e2e/setup/e2e-setup.js')
  ],
  // Add test match patterns specific to e2e tests
  testMatch: [
    path.join(rootDir, 'tests/e2e/**/*.test.js'),
    path.join(rootDir, 'tests/e2e/**/*.spec.js')
  ],
  // Increase timeout for e2e tests
  testTimeout: 60000,
  // Set environment variables via Jest's testEnvironment options
  testEnvironment: 'node',
  testEnvironmentOptions: {
    NODE_ENV: 'test',
    E2E_TEST: 'true'
  }
};
