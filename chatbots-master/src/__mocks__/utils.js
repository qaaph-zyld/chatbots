// Mock implementation for utils module
const utils = {
  // Logger functions
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  
  // Test runner functions needed by Jest
  makeDescribe: jest.fn().mockImplementation((title, parent) => ({
    type: 'describeBlock',
    children: [],
    hooks: [],
    tests: [],
    parent,
    mode: undefined,
    name: title,
  })),
  
  makeTest: jest.fn().mockImplementation((fn, title, timeout) => ({
    type: 'test',
    title,
    fn,
    mode: undefined,
    timeout,
  })),

  // Snapshot testing functions
  getSnapshotData: jest.fn().mockImplementation(() => ({
    data: {
      'test.spec.js.snap': 'exports[`test 1`] = `snapshot 1`;\nexports[`test 2`] = `snapshot 2`;',
      'another.test.js.snap': 'exports[`another test 1`] = `another snapshot 1`;',
    },
    dirty: false,
    fileExists: true,
    isEmpty: false,
  })),
  saveSnapshotFile: jest.fn().mockImplementation(() => true),
  deepMerge: jest.fn().mockImplementation((target, source) => ({
    ...target,
    ...source
  })),
  saveSnapshotState: jest.fn().mockImplementation(() => true),
  
  // Add a helper to reset snapshot data between tests
  _resetSnapshotData: function() {
    this.getSnapshotData = jest.fn().mockImplementation(() => ({
      data: {
        'test.spec.js.snap': 'exports[`test 1`] = `snapshot 1`;\nexports[`test 2`] = `snapshot 2`;',
        'another.test.js.snap': 'exports[`another test 1`] = `another snapshot 1`;',
      },
      dirty: false,
      fileExists: true,
      isEmpty: false,
    }));
  },

  // Utility functions
  generateId: jest.fn().mockReturnValue('mocked-id'),
  formatDate: jest.fn().mockReturnValue('2023-01-01'),
  validateInput: jest.fn().mockReturnValue(true),
  
  // Add more utility mocks as needed
};

// Add reset function to easily reset all mocks between tests
utils.resetMocks = () => {
  // Reset all mock functions
  Object.values(utils).forEach(mockFn => {
    if (typeof mockFn === 'object' && mockFn !== null && 'mockClear' in mockFn) {
      mockFn.mockClear();
    } else if (typeof mockFn === 'function' && '_isMockFunction' in mockFn) {
      mockFn.mockClear();
    }
  });
  
  // Reset snapshot data
  if (typeof utils._resetSnapshotData === 'function') {
    utils._resetSnapshotData();
  }
};

// Export both default and named exports
module.exports = utils;
module.exports.makeDescribe = utils.makeDescribe;
module.exports.makeTest = utils.makeTest;
