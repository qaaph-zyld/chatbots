/**
 * Jest configuration for MongoDB Memory Server tests
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
    path.join(rootDir, 'tests/unit/setup/memory-server-setup.js')
  ],
  // Add global variables for MongoDB Memory Server tests
  globals: {
    __USE_MEMORY_SERVER__: true
  },
  // Add test match patterns specific to memory server tests
  testMatch: [
    path.join(rootDir, 'tests/**/*.memory.test.js'),
    path.join(rootDir, 'tests/**/*.memory.spec.js')
  ],
  // Set environment variables via Jest's testEnvironment options
  testEnvironment: 'node',
  testEnvironmentOptions: {
    NODE_ENV: 'test',
    USE_MEMORY_SERVER: 'true'
  }
};
