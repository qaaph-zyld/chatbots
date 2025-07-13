/**
 * Jest Configuration
 * 
 * Base configuration for all Jest tests in the project.
 * Specialized configurations in config/jest/ extend this base config.
 */

module.exports = {
  // Core Jest Configuration
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  
  // Test Environment Setup
  testEnvironment: 'node',
  testEnvironmentOptions: {
    url: 'http://localhost',
    customExportConditions: ['node', 'node-addons']
  },
  
  // Fake timers
  fakeTimers: {
    enableGlobally: true,
    doNotFake: ['nextTick', 'setImmediate']
  },
  
  // Setup files
  setupFiles: [
    '<rootDir>/src/tests/setup/jest-setup.js'
  ],
  
  // Setup files after the test framework is installed
  setupFilesAfterEnv: [
    '<rootDir>/src/tests/setup/matchers.js',
    '<rootDir>/src/tests/setup/after-env.js'
  ],
  
  // Test Pattern Configuration
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js',
    '**/test/**/*.test.js',
    '**/test/**/*.spec.js',
    '**/__tests__/**/*.test.js',
    '**/__tests__/**/*.spec.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Module Resolution
  moduleNameMapper: {
    // Core aliases
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@src/(.*)$': '<rootDir>/src/$1',
    
    // Models
    '^@models$': '<rootDir>/src/models',
    '^@models/(.*)$': '<rootDir>/src/models/$1',
    '^.*/models/(.*)$': '<rootDir>/src/models/$1',
    
    // Web-widget
    '^@src/web-widget/(.*)$': '<rootDir>/src/web-widget/$1',
    
    // Utils
    '^@utils$': '<rootDir>/src/__mocks__/utils.js',
    '^@utils/(.*)$': '<rootDir>/src/__mocks__/utils.js',
    '^(.*)/utils$': '<rootDir>/src/__mocks__/utils.js',
    
    // Mocks
    '^@/storage$': '<rootDir>/src/__mocks__/storage.js',
    '^@/storage/(.*)$': '<rootDir>/src/__mocks__/storage.js',
    '^@/utils/logger$': '<rootDir>/src/__mocks__/utils/logger.js',
    '^@/scaling/cluster$': '<rootDir>/src/__mocks__/scaling/cluster.js',
    '^jest-util$': '<rootDir>/__mocks__/jest-util.js',
    
    // Services & Integrations
    '^@services/(.*)$': '<rootDir>/src/core/services/$1',
    '^@integrations/(.*)$': '<rootDir>/src/integrations/$1',
    '^@config$': '<rootDir>/src/config',
    
    // Handle ESM modules
    '^(\.{1,2}/.*)\\.js$': '$1',
    '^(chai|sinon|@testing-library/.*|@babel/.*|@jest/.*)$': '<rootDir>/node_modules/$1'
  },
  
  // Transform Configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { rootMode: 'upward' }],
    '^.+\\.mjs$': 'babel-jest'
  },
  
  // Transform Ignore Patterns
  transformIgnorePatterns: [
    'node_modules/(?!(chai|sinon|@testing-library|@babel/runtime|@babel/plugin-transform-runtime|@babel/runtime-corejs3|@babel/preset-env|@babel/plugin-transform-modules-commonjs|@playwright|@swc|whatwg-url|tr46|webidl-conversions|abab|cssstyle|domexception|nwsapi|parse5|acorn-jsx|acorn-globals|acorn-walk|acorn|cssom)/)'
  ],
  
  // Module File Extensions
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs', 'json', 'node'],
  
  // ESM Support - Only specify non-js extensions to avoid validation error
  // .mjs is automatically treated as an ECMAScript Module
  extensionsToTreatAsEsm: ['.jsx', '.ts', '.tsx'],
  
  // Test Path Ignore Patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '/src/tests/e2e/',
    '/src/tests/integration/',
    '/src/tests/__mocks__/',
    '/src/tests/__fixtures__/',
    '/cypress/'
  ],
  
  // Coverage Configuration
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/tests/**',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/coverage/**',
    '!**/*.config.{js,ts}',
    '!**/index.{js,ts}',
    '!**/types/**',
    '!**/interfaces/**',
    '!**/__mocks__/**',
    '!**/__fixtures__/**'
  ],
  
  // Coverage Threshold
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  
  // Additional Settings
  verbose: true,
  clearMocks: true,
  resetMocks: true,
  resetModules: true,
  testTimeout: 30000,
  
  // Watch Plugins - Temporarily disabled due to validation errors
  // watchPlugins: [
  //   'jest-watch-typeahead/filename',
  //   'jest-watch-typeahead/testname'
  // ],
  
  // Global Setup/Teardown
  globalSetup: '<rootDir>/src/tests/setup/global-setup.js',
  globalTeardown: '<rootDir>/src/tests/setup/global-teardown.js',
  
  // Test Results Processing
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'junit.xml',
      ancestorSeparator: ' > ',
      uniqueOutputName: 'false',
      suiteNameTemplate: '{filepath}',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}'
    }]
  ]
};
