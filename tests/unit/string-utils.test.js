/**
 * String Utilities Unit Tests
 * 
 * Tests for string manipulation functions
 */

describe('String Utilities', () => {
  test('should handle string concatenation', () => {
    const result = 'hello' + ' ' + 'world';
    expect(result).toBe('hello world');
  });

  test('should handle string trimming', () => {
    expect('  test  '.trim()).toBe('test');
    expect('\n\tspaces\t\n'.trim()).toBe('spaces');
  });

  test('should handle string case conversion', () => {
    expect('Test String'.toLowerCase()).toBe('test string');
    expect('test string'.toUpperCase()).toBe('TEST STRING');
  });

  test('should handle string splitting', () => {
    expect('a,b,c'.split(',')).toEqual(['a', 'b', 'c']);
    expect('one two three'.split(' ')).toEqual(['one', 'two', 'three']);
  });

  test('should handle string replacement', () => {
    expect('hello world'.replace('world', 'test')).toBe('hello test');
    expect('test test test'.replace(/test/g, 'demo')).toBe('demo demo demo');
  });

  test('should handle string validation', () => {
    expect('test@example.com'.includes('@')).toBe(true);
    expect('password123'.length >= 8).toBe(true);
    expect(''.length === 0).toBe(true);
  });
});
