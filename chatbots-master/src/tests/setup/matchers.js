/**
 * Custom Jest matchers
 * 
 * This file contains custom matchers that can be used in tests.
 * These matchers are automatically available in all test files.
 */

// Custom matchers
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// Export the expect object so it can be used in other files if needed
module.exports = expect;
