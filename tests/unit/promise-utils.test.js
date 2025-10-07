/**
 * Promise Utilities Unit Tests
 * 
 * Tests for Promise operations
 */

describe('Promise Utilities', () => {
  test('should handle basic promise resolution', async () => {
    const promise = Promise.resolve('success');
    const result = await promise;
    expect(result).toBe('success');
  });

  test('should handle promise rejection', async () => {
    const promise = Promise.reject(new Error('test error'));
    await expect(promise).rejects.toThrow('test error');
  });

  test('should handle async/await syntax', async () => {
    const asyncFunction = async () => {
      return 'async result';
    };
    const result = await asyncFunction();
    expect(result).toBe('async result');
  });

  test('should handle Promise.all', async () => {
    const promises = [
      Promise.resolve(1),
      Promise.resolve(2),
      Promise.resolve(3)
    ];
    const results = await Promise.all(promises);
    expect(results).toEqual([1, 2, 3]);
  });

  test('should handle Promise.race', async () => {
    const fast = new Promise(resolve => setTimeout(() => resolve('fast'), 10));
    const slow = new Promise(resolve => setTimeout(() => resolve('slow'), 100));
    const result = await Promise.race([fast, slow]);
    expect(result).toBe('fast');
  });

  test('should handle promise chaining', async () => {
    const result = await Promise.resolve(5)
      .then(x => x * 2)
      .then(x => x + 1);
    expect(result).toBe(11);
  });
});
