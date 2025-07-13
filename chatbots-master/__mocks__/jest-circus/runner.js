// Mock implementation for jest-circus/runner
const { EventEmitter } = require('events');

// Create a mock test runner
const run = async () => {
  const eventEmitter = new EventEmitter();
  
  // Emit necessary events for test execution
  process.nextTick(() => {
    eventEmitter.emit('test-file-start', { name: 'test' });
    eventEmitter.emit('test-file-success', { testFilePath: 'test.js' });
  });
  
  return {
    unsubscribes: [],
    on: (event, listener) => {
      eventEmitter.on(event, listener);
      return () => eventEmitter.off(event, listener);
    },
  };
};

// Mock makeDescribe and makeTest functions
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

module.exports = {
  run,
  makeDescribe,
  makeTest,
};
