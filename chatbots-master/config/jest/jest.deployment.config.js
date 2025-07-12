/**
 * Jest configuration for deployment verification tests
 * 
 * These tests verify that a deployment is functioning correctly
 * before switching traffic to the new version.
 */

const baseConfig = require('./jest.config');

module.exports = {
  ...baseConfig,
  testMatch: ['**/tests/verification/**/*.test.js'],
  testTimeout: 60000, // 60 seconds
  setupFilesAfterEnv: [
    ...baseConfig.setupFilesAfterEnv,
    '<rootDir>/tests/verification/setup.js'
  ],
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './test-results/verification',
      outputName: 'verification-test-results.xml',
    }],
    ['./configs/jest/reporters/deployment-reporter.js', {
      outputFile: './test-results/verification/verification-summary.json',
      includeConsoleOutput: true
    }]
  ],
  testEnvironment: 'node',
  verbose: true
};
