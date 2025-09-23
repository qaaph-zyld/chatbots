/**
 * Type Utilities Unit Tests
 */

describe('Type Utilities', () => {
  test('should detect primitive types', () => {
    expect(typeof 'string').toBe('string');
    expect(typeof 42).toBe('number');
    expect(typeof true).toBe('boolean');
    expect(typeof undefined).toBe('undefined');
    expect(typeof Symbol('test')).toBe('symbol');
  });

  test('should detect object types', () => {
    expect(typeof {}).toBe('object');
    expect(typeof []).toBe('object');
    expect(typeof null).toBe('object');
    expect(typeof new Date()).toBe('object');
    expect(typeof /regex/).toBe('object');
  });

  test('should use instanceof for specific types', () => {
    expect([] instanceof Array).toBe(true);
    expect(new Date() instanceof Date).toBe(true);
    expect(/regex/ instanceof RegExp).toBe(true);
    expect({} instanceof Object).toBe(true);
  });

  test('should use Array.isArray for arrays', () => {
    expect(Array.isArray([])).toBe(true);
    expect(Array.isArray([1, 2, 3])).toBe(true);
    expect(Array.isArray({})).toBe(false);
    expect(Array.isArray('string')).toBe(false);
  });

  test('should handle null and undefined checks', () => {
    expect(null == undefined).toBe(true);
    expect(null === undefined).toBe(false);
    expect(null === null).toBe(true);
    expect(undefined === undefined).toBe(true);
  });

  test('should create type checking functions', () => {
    const isString = (value) => typeof value === 'string';
    const isNumber = (value) => typeof value === 'number' && !isNaN(value);
    const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
    
    expect(isString('test')).toBe(true);
    expect(isString(123)).toBe(false);
    expect(isNumber(42)).toBe(true);
    expect(isNumber('42')).toBe(false);
    expect(isObject({})).toBe(true);
    expect(isObject([])).toBe(false);
  });
});
