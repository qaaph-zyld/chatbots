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
  testTimeout: 30000,
  verbose: true,
  maxWorkers: 1,
  forceExit: true,
  detectOpenHandles: true,
  // Mock network requests by default
  transformIgnorePatterns: [
    'node_modules/(?!(axios)/)'
  ]
};