// Mock implementation for jest-util
const makeDescribe = (title, parent) => ({
  type: 'describeBlock',
  children: [],
  hooks: [],
  tests: [],
  parent,
  mode: undefined,
  name: title,
});

const makeTest = (fn, title, timeout) => ({
  type: 'test',
  title,
  fn,
  mode: undefined,
  timeout,
});

// Mock invariant function
const invariant = (condition, message) => {
  if (!condition) {
    throw new Error(`Invariant Violation: ${message}`);
  }
};

// Mock ErrorWithStack function
class ErrorWithStack extends Error {
  constructor(message, callsite) {
    super(message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, callsite);
    }
  }
}

// Re-export the actual jest-util for everything else
const actualJestUtil = jest.requireActual('jest-util');

module.exports = {
  ...actualJestUtil,
  makeDescribe,
  makeTest,
  invariant,
  ErrorWithStack,
};
