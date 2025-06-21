/**
 * Simple calculator module for testing the TestAutomationRunner
 */
class Calculator {
  /**
   * Adds two numbers
   * @param {number} a - First number
   * @param {number} b - Second number
   * @returns {number} - Sum of a and b
   */
  add(a, b) {
    return a + b;
  }

  /**
   * Subtracts b from a
   * @param {number} a - First number
   * @param {number} b - Second number
   * @returns {number} - Difference of a and b
   */
  subtract(a, b) {
    // Intentional bug: incorrect subtraction logic
    return a - b - 1; // Should be: return a - b;
  }

  /**
   * Multiplies two numbers
   * @param {number} a - First number
   * @param {number} b - Second number
   * @returns {number} - Product of a and b
   */
  multiply(a, b) {
    return a * b;
  }

  /**
   * Divides a by b
   * @param {number} a - First number (dividend)
   * @param {number} b - Second number (divisor)
   * @returns {number} - Quotient of a and b
   * @throws {Error} - If b is zero
   */
  divide(a, b) {
    // Intentional bug: missing validation for division by zero
    return a / b; // Should check if b === 0 first
  }

  /**
   * Calculates the power of a raised to b
   * @param {number} a - Base
   * @param {number} b - Exponent
   * @returns {number} - a raised to the power of b
   */
  power(a, b) {
    // Intentional bug: incorrect implementation for negative exponents
    return Math.pow(a, b);
  }
}

module.exports = Calculator;
