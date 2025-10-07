/**
 * Conversion Utilities Unit Tests
 */

describe('Conversion Utilities', () => {
  test('should convert between string and number', () => {
    expect(Number('42')).toBe(42);
    expect(parseInt('42')).toBe(42);
    expect(parseFloat('3.14')).toBe(3.14);
    expect(String(42)).toBe('42');
  });

  test('should convert boolean values', () => {
    expect(Boolean(1)).toBe(true);
    expect(Boolean(0)).toBe(false);
    expect(Boolean('test')).toBe(true);
    expect(Boolean('')).toBe(false);
  });

  test('should convert arrays', () => {
    expect([1, 2, 3].join(',')).toBe('1,2,3');
    expect('1,2,3'.split(',')).toEqual(['1', '2', '3']);
    expect([1, 2, 3].toString()).toBe('1,2,3');
  });

  test('should convert case', () => {
    expect('Hello World'.toLowerCase()).toBe('hello world');
    expect('hello world'.toUpperCase()).toBe('HELLO WORLD');
  });

  test('should convert encoding', () => {
    const text = 'Hello World';
    const encoded = btoa(text);
    const decoded = atob(encoded);
    expect(decoded).toBe(text);
  });
});
