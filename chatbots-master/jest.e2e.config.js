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
    '**/src/tests/e2e/**/*.test.js',
    '**/src/tests/e2e/**/*.spec.js',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/coverage/**',
    '!**/unit/**',
    '!**/integration/**',
    '!**/__mocks__/**',
    '!**/__fixtures__/**'
  ],
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/tests/setup/jest-setup.js',
    '<rootDir>/src/tests/e2e/setup.js'
  ],
  
  // Global setup/teardown
  globalSetup: '<rootDir>/src/tests/e2e/global-setup.js',
  globalTeardown: '<rootDir>/src/tests/e2e/global-teardown.js',
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage/e2e',
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
  
  // Test timeout (much longer for E2E tests)
  testTimeout: 120000, // 2 minutes for E2E tests
  
  // Run tests sequentially to avoid conflicts
  maxWorkers: 1,
  
  // Setup test environment
  testEnvironmentOptions: {
    NODE_ENV: 'test',
    ENV: 'test',
    E2E: 'true'
  },
  
  // Global test setup
  globalSetup: '<rootDir>/src/tests/e2e/setup/global-setup.js',
  globalTeardown: '<rootDir>/src/tests/e2e/setup/global-teardown.js',
  
  // Setup files that run before each test file
  setupFiles: [
    '<rootDir>/src/tests/e2e/setup/test-setup.js'
  ]
};
