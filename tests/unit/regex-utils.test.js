/**
 * Regex Utilities Unit Tests
 */

describe('Regex Utilities', () => {
  test('should handle basic pattern matching', () => {
    const pattern = /test/;
    expect(pattern.test('testing')).toBe(true);
    expect(pattern.test('example')).toBe(false);
  });

  test('should handle email validation', () => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailPattern.test('user@example.com')).toBe(true);
    expect(emailPattern.test('invalid-email')).toBe(false);
  });

  test('should handle string replacement with regex', () => {
    const text = 'Hello World Hello';
    const result = text.replace(/Hello/g, 'Hi');
    expect(result).toBe('Hi World Hi');
  });

  test('should handle pattern extraction', () => {
    const text = 'Phone: 123-456-7890';
    const match = text.match(/(\d{3})-(\d{3})-(\d{4})/);
    expect(match[1]).toBe('123');
    expect(match[2]).toBe('456');
    expect(match[3]).toBe('7890');
  });

  test('should handle case insensitive matching', () => {
    const pattern = /test/i;
    expect(pattern.test('TEST')).toBe(true);
    expect(pattern.test('Test')).toBe(true);
  });
});
