/**
 * Baseline Jest Configuration
 * 
 * Specialized configuration for running baseline tests.
 */

const path = require('path');
const baseConfig = require('../jest.config.js');

module.exports = {
  ...baseConfig,
  // Explicitly set rootDir to the project root to fix path resolution issues
  rootDir: path.resolve(__dirname, '..'),
  // Override the testMatch pattern to include our baseline test
  testMatch: [
    '**/test-results/sample-tests/**/*.test.js'
  ],
  // Ensure verbose output
  verbose: true,
  // Don't use the testPathIgnorePatterns from the base config
  testPathIgnorePatterns: ['/node_modules/'],
  // Create a minimal setup for baseline tests
  setupFilesAfterEnv: []
};
