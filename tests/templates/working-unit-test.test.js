/**
 * Working Unit Test Template
 * 
 * This template demonstrates the proven working pattern for unit tests.
 * Copy this template and modify for new unit tests.
 */

describe('Working Unit Test Template', () => {
  // Basic functionality tests (always work)
  test('should handle basic arithmetic', () => {
    expect(2 + 2).toBe(4);
    expect(10 - 5).toBe(5);
    expect(3 * 4).toBe(12);
    expect(8 / 2).toBe(4);
  });

  test('should handle string operations', () => {
    expect('hello world'.toUpperCase()).toBe('HELLO WORLD');
    expect('test string'.length).toBe(11);
    expect('split,test'.split(',')).toEqual(['split', 'test']);
  });

  test('should handle array operations', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(arr).toHaveLength(5);
    expect(arr).toContain(3);
    expect(arr.filter(n => n > 3)).toEqual([4, 5]);
  });

  test('should handle object operations', () => {
    const obj = { name: 'test', value: 42, active: true };
    expect(obj).toHaveProperty('name');
    expect(obj.name).toBe('test');
    expect(Object.keys(obj)).toEqual(['name', 'value', 'active']);
  });

  test('should handle async operations', async () => {
    const promise = Promise.resolve('success');
    await expect(promise).resolves.toBe('success');
    
    const asyncFunction = async () => 'async result';
    const result = await asyncFunction();
    expect(result).toBe('async result');
  });

  test('should handle error cases', () => {
    expect(() => {
      throw new Error('test error');
    }).toThrow('test error');
    
    expect(() => {
      JSON.parse('invalid json');
    }).toThrow();
  });

  // Mock usage examples (safe patterns)
  test('should work with simple mocks', () => {
    const mockFunction = jest.fn();
    mockFunction.mockReturnValue('mocked result');
    
    expect(mockFunction()).toBe('mocked result');
    expect(mockFunction).toHaveBeenCalledTimes(1);
  });

  test('should work with module mocking', () => {
    // Mock a built-in Node.js module (always safe)
    const fs = require('fs');
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    
    expect(fs.existsSync('/fake/path')).toBe(true);
    
    // Restore the mock
    fs.existsSync.mockRestore();
  });
});

// Export test utilities if needed
module.exports = {
  // Helper functions for other tests
  createTestData: () => ({
    id: 1,
    name: 'test',
    timestamp: new Date().toISOString()
  }),
  
  createMockResponse: () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis()
  })
};
