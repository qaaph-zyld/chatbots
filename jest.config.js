module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/src/**/*.test.js',
    '!<rootDir>/tests/generated/**/*.test.js'
  ],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
    '!**/node_modules/**',
    '!**/*.backup'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/test-setup.js'],
  testTimeout: 60000,
  verbose: false,
  maxWorkers: 1,
  forceExit: true,
  detectOpenHandles: false,
  silent: true,
  // Module name mapping for aliases
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/src/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@api/(.*)$': '<rootDir>/src/api/$1',
    '^@data/(.*)$': '<rootDir>/src/data/$1',
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1'
  },
  // Mock network requests by default
  transformIgnorePatterns: [
    'node_modules/(?!(axios)/)'
  ],
  // Bail on first failure to speed up feedback
  bail: 1,
  // Cache directory
  cacheDirectory: '<rootDir>/.jest-cache',
  // Clear mocks between tests
  clearMocks: true,
  // Reset modules between tests
  resetModules: true
};