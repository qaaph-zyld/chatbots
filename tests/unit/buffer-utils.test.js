/**
 * Buffer Utilities Unit Tests
 */

describe('Buffer Utilities', () => {
  test('should create buffers from strings', () => {
    const text = 'Hello World';
    const buffer = Buffer.from(text, 'utf8');
    
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.toString()).toBe(text);
  });

  test('should handle buffer operations', () => {
    const buffer1 = Buffer.from('Hello');
    const buffer2 = Buffer.from(' World');
    const combined = Buffer.concat([buffer1, buffer2]);
    
    expect(combined.toString()).toBe('Hello World');
  });

  test('should handle buffer encoding', () => {
    const text = 'Hello World';
    const buffer = Buffer.from(text);
    
    expect(buffer.toString('utf8')).toBe(text);
    expect(buffer.toString('base64')).toBeTruthy();
    expect(buffer.toString('hex')).toBeTruthy();
  });

  test('should handle buffer allocation', () => {
    const buffer = Buffer.alloc(10);
    expect(buffer.length).toBe(10);
    expect(buffer.every(byte => byte === 0)).toBe(true);
  });

  test('should handle buffer comparison', () => {
    const buffer1 = Buffer.from('test');
    const buffer2 = Buffer.from('test');
    const buffer3 = Buffer.from('different');
    
    expect(buffer1.equals(buffer2)).toBe(true);
    expect(buffer1.equals(buffer3)).toBe(false);
  });
});
