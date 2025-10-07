/**
 * Minimal Jest Configuration for MVP Testing
 * Focuses on basic functionality without complex enterprise features
 */

module.exports = {
  testEnvironment: 'node',
  
  // Only test essential directories
  roots: ['<rootDir>/tests/mvp'],
  
  // Simple test patterns
  testMatch: [
    '<rootDir>/tests/mvp/**/*.test.js'
  ],
  
  // Ignore problematic directories
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/tests/generated/',
    '<rootDir>/tests/src/',
    '<rootDir>/src/web-widget/',
    '<rootDir>/src/modules/',
    '<rootDir>/src/analytics/',
    '<rootDir>/coverage/'
  ],
  
  // Minimal module mapping
  moduleNameMapper: {
    '^@mvp/(.*)$': '<rootDir>/src/mvp/$1'
  },
  
  // Basic coverage
  collectCoverage: false, // Disable for now to focus on getting tests to run
  
  // Simple setup
  setupFilesAfterEnv: ['<rootDir>/tests/mvp/setup.js'],
  
  // Conservative timeouts
  testTimeout: 10000,
  verbose: true,
  maxWorkers: 1,
  forceExit: true,
  detectOpenHandles: false
};
