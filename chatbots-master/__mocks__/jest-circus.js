// Mock implementation for jest-circus
const actualJestCircus = jest.requireActual('jest-circus');
const util = require('jest-util');

// Re-export everything from the actual jest-circus
module.exports = {
  ...actualJestCircus,
  
  // Override specific functions if needed
  makeDescribe: (title, parent) => ({
    type: 'describeBlock',
    children: [],
    hooks: [],
    tests: [],
    parent,
    mode: undefined,
    name: title,
  }),
  
  makeTest: (fn, title, timeout) => ({
    type: 'test',
    title,
    fn,
    mode: undefined,
    timeout,
  }),
};
