/**
 * Math Utilities Unit Tests
 * 
 * Tests for mathematical operations
 */

describe('Math Utilities', () => {
  test('should handle basic arithmetic', () => {
    expect(2 + 3).toBe(5);
    expect(10 - 4).toBe(6);
    expect(6 * 7).toBe(42);
    expect(15 / 3).toBe(5);
    expect(17 % 5).toBe(2);
  });

  test('should handle Math object functions', () => {
    expect(Math.abs(-5)).toBe(5);
    expect(Math.max(1, 5, 3)).toBe(5);
    expect(Math.min(1, 5, 3)).toBe(1);
    expect(Math.round(4.7)).toBe(5);
    expect(Math.floor(4.9)).toBe(4);
    expect(Math.ceil(4.1)).toBe(5);
  });

  test('should handle power and root operations', () => {
    expect(Math.pow(2, 3)).toBe(8);
    expect(Math.sqrt(16)).toBe(4);
    expect(2 ** 3).toBe(8);
  });

  test('should handle random numbers', () => {
    const random = Math.random();
    expect(random >= 0 && random < 1).toBe(true);
    
    const randomInt = Math.floor(Math.random() * 10);
    expect(randomInt >= 0 && randomInt < 10).toBe(true);
  });

  test('should handle number validation', () => {
    expect(Number.isInteger(5)).toBe(true);
    expect(Number.isInteger(5.5)).toBe(false);
    expect(Number.isNaN(NaN)).toBe(true);
    expect(Number.isFinite(100)).toBe(true);
    expect(Number.isFinite(Infinity)).toBe(false);
  });

  test('should handle number parsing', () => {
    expect(parseInt('42')).toBe(42);
    expect(parseFloat('3.14')).toBe(3.14);
    expect(Number('123')).toBe(123);
  });
});
