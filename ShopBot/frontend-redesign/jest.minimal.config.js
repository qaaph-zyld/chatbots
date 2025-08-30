module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup/jest.setup.js'],
  testMatch: [
    '<rootDir>/src/__tests__/**/*.test.{js,jsx,ts,tsx}'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  transform: {
    '^.+\\\\\\\.(js|jsx|ts|tsx)$': ['babel-jest', {
      presets: ['next/babel']
    }]
  },
  testTimeout: 10000,
  forceExit: true,
  detectOpenHandles: true,
  runInBand: true,
  maxWorkers: 1
};
