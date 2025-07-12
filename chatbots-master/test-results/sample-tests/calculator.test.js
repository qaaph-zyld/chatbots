/**
 * Test suite for the Calculator module
 * Contains intentional failures to test the TestAutomationRunner
 */
const Calculator = require('./calculator');

describe('Calculator', () => {
  let calculator;

  beforeEach(() => {
    calculator = new Calculator();
  });

  describe('add method', () => {
    test('should correctly add two positive numbers', () => {
      expect(calculator.add(2, 3)).toBe(5);
    });

    test('should correctly handle negative numbers', () => {
      expect(calculator.add(-2, -3)).toBe(-5);
    });

    test('should correctly handle zero', () => {
      expect(calculator.add(0, 0)).toBe(0);
    });
  });

  describe('subtract method', () => {
    test('should correctly subtract two positive numbers', () => {
      // This will fail due to the intentional bug in subtract
      expect(calculator.subtract(5, 3)).toBe(2); // Actual: 1 (bug: returns a - b - 1)
    });

    test('should correctly handle negative numbers', () => {
      // This will fail due to the intentional bug in subtract
      expect(calculator.subtract(-2, -3)).toBe(1); // Actual: 0 (bug: returns a - b - 1)
    });

    test('should correctly handle zero', () => {
      // This will fail due to the intentional bug in subtract
      expect(calculator.subtract(0, 0)).toBe(0); // Actual: -1 (bug: returns a - b - 1)
    });
  });

  describe('multiply method', () => {
    test('should correctly multiply two positive numbers', () => {
      expect(calculator.multiply(2, 3)).toBe(6);
    });

    test('should correctly handle negative numbers', () => {
      expect(calculator.multiply(-2, 3)).toBe(-6);
    });

    test('should correctly handle zero', () => {
      expect(calculator.multiply(5, 0)).toBe(0);
    });
  });

  describe('divide method', () => {
    test('should correctly divide two positive numbers', () => {
      expect(calculator.divide(6, 3)).toBe(2);
    });

    test('should correctly handle negative numbers', () => {
      expect(calculator.divide(-6, 3)).toBe(-2);
    });

    test('should throw an error when dividing by zero', () => {
      // This will fail due to the intentional bug in divide (no validation)
      expect(() => calculator.divide(5, 0)).toThrow(); // Actual: returns Infinity, no error thrown
    });
  });

  describe('power method', () => {
    test('should correctly calculate positive exponents', () => {
      expect(calculator.power(2, 3)).toBe(8);
    });

    test('should correctly handle zero exponent', () => {
      expect(calculator.power(5, 0)).toBe(1);
    });

    test('should correctly handle negative exponents', () => {
      // This might fail depending on precision issues with negative exponents
      expect(calculator.power(2, -2)).toBe(0.25);
    });
  });
});
