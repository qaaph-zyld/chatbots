module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    'models/**/*.js',
    '*.js',
    '!**/node_modules/**',
    '!**/coverage/**'
  ],
  testTimeout: 60000,
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  clearMocks: true,
  resetMocks: true,
  globalSetup: '<rootDir>/tests/setup.js',
  globalTeardown: '<rootDir>/tests/setup.js',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  maxWorkers: 1
};
