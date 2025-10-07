/**
 * JSON Utilities Unit Tests
 * 
 * Tests for JSON operations
 */

describe('JSON Utilities', () => {
  test('should handle JSON serialization', () => {
    const obj = { name: 'test', value: 42, active: true };
    const json = JSON.stringify(obj);
    expect(typeof json).toBe('string');
    expect(json).toContain('"name":"test"');
  });

  test('should handle JSON deserialization', () => {
    const json = '{"name":"test","value":42,"active":true}';
    const obj = JSON.parse(json);
    expect(obj.name).toBe('test');
    expect(obj.value).toBe(42);
    expect(obj.active).toBe(true);
  });

  test('should handle JSON arrays', () => {
    const arr = [1, 2, 3];
    const json = JSON.stringify(arr);
    const parsed = JSON.parse(json);
    expect(parsed).toEqual([1, 2, 3]);
  });

  test('should handle nested JSON objects', () => {
    const nested = { user: { profile: { name: 'Alice', age: 30 } } };
    const json = JSON.stringify(nested);
    const parsed = JSON.parse(json);
    expect(parsed.user.profile.name).toBe('Alice');
  });

  test('should handle JSON error cases', () => {
    expect(() => JSON.parse('invalid json')).toThrow();
    expect(() => JSON.parse('')).toThrow();
    expect(() => JSON.parse('{')).toThrow();
  });

  test('should handle special JSON values', () => {
    expect(JSON.stringify(null)).toBe('null');
    expect(JSON.stringify(undefined)).toBeUndefined();
    expect(JSON.parse('null')).toBe(null);
  });
});
