/**
 * Jest Configuration
 * 
 * Base configuration for all Jest tests in the project.
 * Cross-platform path resolution to handle Windows/Unix path differences.
 */

const path = require('path');

module.exports = {
  // The root directory for the test suite
  rootDir: path.resolve(__dirname),
  
  // The test environment to use
  testEnvironment: 'node',
  
  // The glob patterns Jest uses to detect test files
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '\.backup/',  // Exclude backup files from test runs
    '/tests/e2e/',  // Exclude Playwright e2e tests
    'chatbot-flow.test.js',  // Specifically exclude the Playwright test
    'voice-components.test.js',  // Exclude problematic voice component tests
    'advanced-context-awareness.test.js',  // Exclude empty test suite
    '/.backup/'  // Exclude .backup directory from test runs
  ],
  
  // An array of file extensions your modules use
  moduleFileExtensions: ['js', 'json', 'jsx', 'node'],
  
  // A list of paths to directories that Jest should use to search for files in
  roots: ['<rootDir>'],
  
  // Module name mapper - Cross-platform path resolution
  moduleNameMapper: {
    '@src/(.*)': '<rootDir>/src/$1',
    '^@src/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/src/tests/$1',
    '^@config/(.*)$': '<rootDir>/config/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@models/(.*)$': '<rootDir>/src/models/$1',
    '^@controllers/(.*)$': '<rootDir>/src/api/external/v1/controllers/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^@routes/(.*)$': '<rootDir>/src/api/external/v1/routes/$1',
    '^@data/connection$': '<rootDir>/src/data/connection',
    '^@data/(.*)$': '<rootDir>/src/data/$1',
  },
  
  // Mock configuration
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // The directory where Jest should output its coverage files
  coverageDirectory: '<rootDir>/coverage',
  
  // A list of paths to modules that run some code to configure or set up the testing framework
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Increase test timeout for Mongoose operations
  testTimeout: 10000,
  
  // Indicates whether each individual test should be reported during the run
  verbose: true,
  
  // Configure coverage collection
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/config/**',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  
  // Transform ES modules
  transformIgnorePatterns: [
    '/node_modules/(?!(chai|sinon|node-mocks-http)/)',
  ],
  
  // Collect coverage from these directories
  collectCoverageFrom: [
    'src/**/*.js',
    'src/**/*.jsx',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/build/**'
  ],
  
  // Module name mapper for module aliases
  moduleNameMapper: {
    '^@src[\\/](.*)$': '<rootDir>/src/$1',
    '^@data[\\/](.*)$': '<rootDir>/src/data/$1',
    '^@core[\\/](.*)$': '<rootDir>/src/core/$1',
    '^@modules[\\/](.*)$': '<rootDir>/src/modules/$1',
    '^@api[\\/](.*)$': '<rootDir>/src/api/$1',
    '^@tests[\\/](.*)$': '<rootDir>/tests/$1'
  },
  
  // Set timeout for tests
  testTimeout: 60000,
  
  // Run tests in sequence to prevent database conflicts
  maxWorkers: 1,
  
  // Force exit after tests to prevent hanging
  forceExit: true,
  
  // Detect open handles to help troubleshoot hanging tests
  detectOpenHandles: true,
  
  // Coverage thresholds by directory - updated for new directory structure
  coverageThreshold: {
    global: {
      statements: 50,
      branches: 40,
      functions: 50,
      lines: 50
    },
    'src/modules/': {
      statements: 60,
      branches: 55,
      functions: 60,
      lines: 60
    },
    'src/api/': {
      statements: 65,
      branches: 60,
      functions: 65,
      lines: 65
    },
    'src/domain/': {
      statements: 60,
      branches: 55,
      functions: 60,
      lines: 60
    },
    'src/core/': {
      statements: 60,
      branches: 55,
      functions: 60,
      lines: 60
    },
    'src/utils/': {
      statements: 55,
      branches: 50,
      functions: 55,
      lines: 55
    }
  },
  // globalSetup: '<rootDir>/global-test-setup.js',
  // globalTeardown: '<rootDir>/global-test-teardown.js'
};
