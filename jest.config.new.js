module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/tests_new/**/*.test.js'
  ],
  collectCoverageFrom: [
    'src_new/**/*.js',
    '!src_new/**/*.test.js'
  ],
  coverageDirectory: 'coverage_new',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapping: {
    '^@src/(.*)$': '<rootDir>/src_new/$1',
    '^@core/(.*)$': '<rootDir>/src_new/core/$1',
    '^@features/(.*)$': '<rootDir>/src_new/features/$1',
    '^@infrastructure/(.*)$': '<rootDir>/src_new/infrastructure/$1',
    '^@api/(.*)$': '<rootDir>/src_new/api/$1',
    '^@config/(.*)$': '<rootDir>/config_new/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/tests_new/setup.js']
};
