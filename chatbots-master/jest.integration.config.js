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
    '**/src/tests/integration/**/*.test.js',
    '**/src/tests/integration/**/*.spec.js',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/coverage/**',
    '!**/e2e/**',
    '!**/unit/**',
    '!**/__mocks__/**',
    '!**/__fixtures__/**'
  ],
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/tests/setup/jest-setup.js',
    '<rootDir>/src/tests/integration/setup.js'
  ],
  
  // Global setup/teardown
  globalSetup: '<rootDir>/src/tests/integration/global-setup.js',
  globalTeardown: '<rootDir>/src/tests/integration/global-teardown.js',
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage/integration',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/tests/**',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/coverage/**',
    '!**/*.config.js',
    '!**/index.js',
    '!src/database/migrations/**',
    'src/database/seeders/**'
  ],
  
  // Test timeout (longer for integration tests)
  testTimeout: 30000,
  
  // Run tests in parallel but with limited workers
  maxWorkers: '25%',
  
  // Setup test environment
  testEnvironmentOptions: {
    NODE_ENV: 'test',
    ENV: 'test',
    INTEGRATION: 'true'
  }
};
