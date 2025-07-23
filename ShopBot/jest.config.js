module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/apps/backend/tests'],
  testMatch: ['<rootDir>/apps/backend/tests/**/*.test.js'],
  collectCoverageFrom: [
    'apps/backend/src/**/*.js',
    'apps/backend/models/**/*.js',
    'apps/backend/routes/**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**'
  ],
  testTimeout: 30000,
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  clearMocks: true,
  resetMocks: true
};
