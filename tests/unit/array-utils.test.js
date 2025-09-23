/**
 * Array Utilities Unit Tests
 * 
 * Tests for array manipulation functions
 */

describe('Array Utilities', () => {
  test('should handle array creation and access', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(arr).toHaveLength(5);
    expect(arr[0]).toBe(1);
    expect(arr[arr.length - 1]).toBe(5);
  });

  test('should handle array filtering', () => {
    const numbers = [1, 2, 3, 4, 5, 6];
    const evens = numbers.filter(n => n % 2 === 0);
    expect(evens).toEqual([2, 4, 6]);
  });

  test('should handle array mapping', () => {
    const numbers = [1, 2, 3];
    const doubled = numbers.map(n => n * 2);
    expect(doubled).toEqual([2, 4, 6]);
  });

  test('should handle array reduction', () => {
    const numbers = [1, 2, 3, 4];
    const sum = numbers.reduce((acc, n) => acc + n, 0);
    expect(sum).toBe(10);
  });

  test('should handle array searching', () => {
    const fruits = ['apple', 'banana', 'orange'];
    expect(fruits.includes('banana')).toBe(true);
    expect(fruits.indexOf('orange')).toBe(2);
    expect(fruits.find(f => f.startsWith('a'))).toBe('apple');
  });

  test('should handle array sorting', () => {
    const numbers = [3, 1, 4, 1, 5];
    const sorted = [...numbers].sort((a, b) => a - b);
    expect(sorted).toEqual([1, 1, 3, 4, 5]);
  });
});
