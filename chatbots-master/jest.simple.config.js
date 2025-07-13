module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/src/tests/unit/basic.test.js'],
  setupFiles: [],
  setupFilesAfterEnv: [],
  globalSetup: undefined,
  globalTeardown: undefined,
  collectCoverage: false,
  testPathIgnorePatterns: ['/node_modules/'],
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'node'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  verbose: true,
};
