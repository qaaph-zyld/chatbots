/**
 * URL Utilities Unit Tests
 */

describe('URL Utilities', () => {
  test('should handle URL construction', () => {
    const baseUrl = 'https://api.example.com';
    const endpoint = '/users';
    const fullUrl = baseUrl + endpoint;
    expect(fullUrl).toBe('https://api.example.com/users');
  });

  test('should handle URL parsing', () => {
    const url = 'https://example.com:8080/path?param=value#section';
    const urlObj = new URL(url);
    
    expect(urlObj.protocol).toBe('https:');
    expect(urlObj.hostname).toBe('example.com');
    expect(urlObj.port).toBe('8080');
    expect(urlObj.pathname).toBe('/path');
    expect(urlObj.search).toBe('?param=value');
    expect(urlObj.hash).toBe('#section');
  });

  test('should handle query parameters', () => {
    const url = new URL('https://example.com');
    url.searchParams.set('name', 'test');
    url.searchParams.set('age', '25');
    
    expect(url.searchParams.get('name')).toBe('test');
    expect(url.searchParams.get('age')).toBe('25');
  });

  test('should handle URL encoding', () => {
    const text = 'hello world';
    const encoded = encodeURIComponent(text);
    const decoded = decodeURIComponent(encoded);
    
    expect(encoded).toBe('hello%20world');
    expect(decoded).toBe('hello world');
  });

  test('should validate URLs', () => {
    const validUrl = 'https://example.com';
    const invalidUrl = 'not-a-url';
    
    expect(() => new URL(validUrl)).not.toThrow();
    expect(() => new URL(invalidUrl)).toThrow();
  });
});
