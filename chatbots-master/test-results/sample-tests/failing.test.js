/**
 * Sample failing tests to validate error detection and reporting
 * These tests are intentionally designed to fail to test the framework's
 * error handling and reporting capabilities.
 */

describe('Failing Tests', () => {
  test('should fail with assertion error', () => {
    expect(1 + 1).toBe(3); // Intentional failure
  });
  
  test('should fail with type error', () => {
    const obj = null;
    expect(obj.property).toBeDefined(); // Will throw TypeError
  });
  
  test('should pass to verify partial success reporting', () => {
    expect(true).toBe(true);
  });
});
