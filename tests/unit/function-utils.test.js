/**
 * Function Utilities Unit Tests
 */

describe('Function Utilities', () => {
  test('should handle function declarations', () => {
    function add(a, b) {
      return a + b;
    }
    expect(add(2, 3)).toBe(5);
  });

  test('should handle arrow functions', () => {
    const multiply = (a, b) => a * b;
    expect(multiply(4, 5)).toBe(20);
  });

  test('should handle function expressions', () => {
    const divide = function(a, b) {
      return a / b;
    };
    expect(divide(10, 2)).toBe(5);
  });

  test('should handle higher-order functions', () => {
    const numbers = [1, 2, 3, 4];
    const doubled = numbers.map(n => n * 2);
    expect(doubled).toEqual([2, 4, 6, 8]);
  });

  test('should handle function binding', () => {
    const obj = {
      value: 10,
      getValue: function() { return this.value; }
    };
    const boundFunction = obj.getValue.bind(obj);
    expect(boundFunction()).toBe(10);
  });

  test('should handle closures', () => {
    function createCounter() {
      let count = 0;
      return function() {
        return ++count;
      };
    }
    const counter = createCounter();
    expect(counter()).toBe(1);
    expect(counter()).toBe(2);
  });
});
