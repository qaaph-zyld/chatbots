/**
 * Utility Belt Unit Tests
 */

describe('Utility Belt', () => {
  test('should handle utility composition', () => {
    const compose = (...fns) => (value) => fns.reduceRight((acc, fn) => fn(acc), value);
    const pipe = (...fns) => (value) => fns.reduce((acc, fn) => fn(acc), value);
    
    const add = (n) => (x) => x + n;
    const multiply = (n) => (x) => x * n;
    const square = (x) => x * x;
    
    const composedFn = compose(square, multiply(2), add(3));
    const pipedFn = pipe(add(3), multiply(2), square);
    
    expect(composedFn(5)).toBe(256); // ((5 + 3) * 2)^2 = 16^2 = 256
    expect(pipedFn(5)).toBe(256);    // Same result with pipe
  });

  test('should handle partial application', () => {
    const partial = (fn, ...args1) => (...args2) => fn(...args1, ...args2);
    const curry = (fn) => {
      return function curried(...args) {
        if (args.length >= fn.length) {
          return fn.apply(this, args);
        } else {
          return function(...args2) {
            return curried.apply(this, args.concat(args2));
          };
        }
      };
    };
    
    const add = (a, b, c) => a + b + c;
    const partialAdd = partial(add, 1, 2);
    const curriedAdd = curry(add);
    
    expect(partialAdd(3)).toBe(6);
    expect(curriedAdd(1)(2)(3)).toBe(6);
    expect(curriedAdd(1, 2)(3)).toBe(6);
  });

  test('should handle memoization patterns', () => {
    const memoize = (fn) => {
      const cache = new Map();
      return (...args) => {
        const key = JSON.stringify(args);
        if (cache.has(key)) {
          return cache.get(key);
        }
        const result = fn(...args);
        cache.set(key, result);
        return result;
      };
    };
    
    let callCount = 0;
    const fibonacci = memoize((n) => {
      callCount++;
      if (n <= 1) return n;
      return fibonacci(n - 1) + fibonacci(n - 2);
    });
    
    expect(fibonacci(10)).toBe(55);
    expect(callCount).toBeLessThan(11); // Memoization reduces calls
  });

  test('should handle deep operations', () => {
    const deepClone = (obj) => {
      if (obj === null || typeof obj !== 'object') return obj;
      if (obj instanceof Date) return new Date(obj);
      if (obj instanceof Array) return obj.map(deepClone);
      if (typeof obj === 'object') {
        const cloned = {};
        Object.keys(obj).forEach(key => {
          cloned[key] = deepClone(obj[key]);
        });
        return cloned;
      }
    };
    
    const deepMerge = (target, source) => {
      const result = deepClone(target);
      Object.keys(source).forEach(key => {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          result[key] = deepMerge(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      });
      return result;
    };
    
    const original = { a: { b: 1 }, c: [1, 2] };
    const cloned = deepClone(original);
    cloned.a.b = 2;
    
    expect(original.a.b).toBe(1);
    expect(cloned.a.b).toBe(2);
    
    const merged = deepMerge({ a: { x: 1 } }, { a: { y: 2 }, b: 3 });
    expect(merged).toEqual({ a: { x: 1, y: 2 }, b: 3 });
  });

  test('should handle functional helpers', () => {
    const identity = (x) => x;
    const constant = (value) => () => value;
    const noop = () => {};
    
    const once = (fn) => {
      let called = false;
      let result;
      return (...args) => {
        if (!called) {
          called = true;
          result = fn(...args);
        }
        return result;
      };
    };
    
    const after = (n, fn) => {
      let count = 0;
      return (...args) => {
        count++;
        if (count >= n) {
          return fn(...args);
        }
      };
    };
    
    expect(identity(42)).toBe(42);
    expect(constant('test')()).toBe('test');
    expect(noop()).toBeUndefined();
    
    let callCount = 0;
    const onceFn = once(() => ++callCount);
    onceFn();
    onceFn();
    expect(callCount).toBe(1);
    
    let afterCount = 0;
    const afterFn = after(3, () => ++afterCount);
    afterFn();
    afterFn();
    expect(afterCount).toBe(0);
    afterFn();
    expect(afterCount).toBe(1);
  });

  test('should handle collection utilities', () => {
    const groupBy = (array, keyFn) => {
      return array.reduce((groups, item) => {
        const key = keyFn(item);
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
        return groups;
      }, {});
    };
    
    const partition = (array, predicate) => {
      return array.reduce(([pass, fail], item) => {
        return predicate(item) ? [[...pass, item], fail] : [pass, [...fail, item]];
      }, [[], []]);
    };
    
    const chunk = (array, size) => {
      const chunks = [];
      for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
      }
      return chunks;
    };
    
    const items = [
      { type: 'fruit', name: 'apple' },
      { type: 'vegetable', name: 'carrot' },
      { type: 'fruit', name: 'banana' }
    ];
    
    const grouped = groupBy(items, item => item.type);
    expect(grouped.fruit).toHaveLength(2);
    expect(grouped.vegetable).toHaveLength(1);
    
    const [evens, odds] = partition([1, 2, 3, 4, 5], n => n % 2 === 0);
    expect(evens).toEqual([2, 4]);
    expect(odds).toEqual([1, 3, 5]);
    
    const chunked = chunk([1, 2, 3, 4, 5], 2);
    expect(chunked).toEqual([[1, 2], [3, 4], [5]]);
  });
});
