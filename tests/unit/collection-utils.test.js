/**
 * Collection Utilities Unit Tests
 */

describe('Collection Utilities', () => {
  test('should handle Set operations', () => {
    const set = new Set([1, 2, 3, 2, 1]);
    expect(set.size).toBe(3);
    expect(set.has(2)).toBe(true);
    expect(set.has(4)).toBe(false);
    
    set.add(4);
    expect(set.size).toBe(4);
    
    set.delete(1);
    expect(set.size).toBe(3);
    expect(set.has(1)).toBe(false);
  });

  test('should handle Map operations', () => {
    const map = new Map();
    map.set('key1', 'value1');
    map.set('key2', 'value2');
    
    expect(map.size).toBe(2);
    expect(map.get('key1')).toBe('value1');
    expect(map.has('key2')).toBe(true);
    
    map.delete('key1');
    expect(map.size).toBe(1);
    expect(map.has('key1')).toBe(false);
  });

  test('should handle WeakMap operations', () => {
    const weakMap = new WeakMap();
    const obj1 = {};
    const obj2 = {};
    
    weakMap.set(obj1, 'data1');
    weakMap.set(obj2, 'data2');
    
    expect(weakMap.get(obj1)).toBe('data1');
    expect(weakMap.has(obj2)).toBe(true);
    
    weakMap.delete(obj1);
    expect(weakMap.has(obj1)).toBe(false);
  });

  test('should handle array-like collections', () => {
    const arrayLike = { 0: 'a', 1: 'b', 2: 'c', length: 3 };
    const array = Array.from(arrayLike);
    
    expect(array).toEqual(['a', 'b', 'c']);
    expect(array.length).toBe(3);
  });

  test('should handle collection iteration', () => {
    const map = new Map([['a', 1], ['b', 2], ['c', 3]]);
    const keys = Array.from(map.keys());
    const values = Array.from(map.values());
    const entries = Array.from(map.entries());
    
    expect(keys).toEqual(['a', 'b', 'c']);
    expect(values).toEqual([1, 2, 3]);
    expect(entries).toEqual([['a', 1], ['b', 2], ['c', 3]]);
  });
});
