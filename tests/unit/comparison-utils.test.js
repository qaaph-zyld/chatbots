/**
 * Comparison Utilities Unit Tests
 */

describe('Comparison Utilities', () => {
  test('should handle equality comparisons', () => {
    expect(1 == '1').toBe(true);
    expect(1 === '1').toBe(false);
    expect(true == 1).toBe(true);
    expect(true === 1).toBe(false);
    expect(null == undefined).toBe(true);
    expect(null === undefined).toBe(false);
  });

  test('should handle numeric comparisons', () => {
    expect(5 > 3).toBe(true);
    expect(5 < 3).toBe(false);
    expect(5 >= 5).toBe(true);
    expect(5 <= 5).toBe(true);
    expect(5 !== 3).toBe(true);
  });

  test('should handle string comparisons', () => {
    expect('apple' < 'banana').toBe(true);
    expect('zebra' > 'apple').toBe(true);
    expect('test'.localeCompare('test')).toBe(0);
    expect('a'.localeCompare('b')).toBeLessThan(0);
    expect('b'.localeCompare('a')).toBeGreaterThan(0);
  });

  test('should handle array comparisons', () => {
    const arr1 = [1, 2, 3];
    const arr2 = [1, 2, 3];
    const arr3 = arr1;
    
    expect(arr1 === arr2).toBe(false);
    expect(arr1 === arr3).toBe(true);
    expect(JSON.stringify(arr1) === JSON.stringify(arr2)).toBe(true);
  });

  test('should handle object comparisons', () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { a: 1, b: 2 };
    const obj3 = obj1;
    
    expect(obj1 === obj2).toBe(false);
    expect(obj1 === obj3).toBe(true);
    expect(JSON.stringify(obj1) === JSON.stringify(obj2)).toBe(true);
  });

  test('should create deep comparison function', () => {
    const deepEqual = (a, b) => {
      if (a === b) return true;
      if (a == null || b == null) return false;
      if (typeof a !== typeof b) return false;
      if (typeof a !== 'object') return false;
      
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      
      return keysA.every(key => deepEqual(a[key], b[key]));
    };
    
    expect(deepEqual({ a: 1 }, { a: 1 })).toBe(true);
    expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
    expect(deepEqual([1, 2], [1, 2])).toBe(true);
  });
});
