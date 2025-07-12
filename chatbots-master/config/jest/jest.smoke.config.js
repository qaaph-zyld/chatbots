/**
 * Jest configuration for smoke tests
 * 
 * Smoke tests are quick tests that verify the basic functionality
 * of the application after deployment.
 */

const baseConfig = require('./jest.config');

module.exports = {
  ...baseConfig,
  testMatch: ['**/tests/smoke/**/*.test.js'],
  testTimeout: 30000, // 30 seconds
  setupFilesAfterEnv: [
    ...baseConfig.setupFilesAfterEnv,
    '<rootDir>/tests/smoke/setup.js'
  ],
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './test-results/smoke',
      outputName: 'smoke-test-results.xml',
    }],
    ['./configs/jest/reporters/deployment-reporter.js', {
      outputFile: './test-results/smoke/smoke-test-summary.json',
      includeConsoleOutput: true
    }]
  ],
  testEnvironment: 'node',
  verbose: true
};
