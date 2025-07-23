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
  testTimeout: 30000,
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  clearMocks: true,
  resetMocks: true
};
