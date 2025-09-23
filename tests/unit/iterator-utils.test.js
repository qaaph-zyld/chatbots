/**
 * Iterator Utilities Unit Tests
 */

describe('Iterator Utilities', () => {
  test('should handle custom iterator implementation', () => {
    const createRangeIterator = (start, end, step = 1) => {
      let current = start;
      
      return {
        [Symbol.iterator]() {
          return this;
        },
        
        next() {
          if (current < end) {
            const value = current;
            current += step;
            return { value, done: false };
          }
          return { done: true };
        }
      };
    };

    const range = createRangeIterator(1, 5);
    const values = [...range];
    
    expect(values).toEqual([1, 2, 3, 4]);
  });

  test('should handle iterator chaining', () => {
    const iteratorUtils = {
      map: function* (iterable, fn) {
        for (const item of iterable) {
          yield fn(item);
        }
      },
      
      filter: function* (iterable, predicate) {
        for (const item of iterable) {
          if (predicate(item)) {
            yield item;
          }
        }
      },
      
      take: function* (iterable, n) {
        let count = 0;
        for (const item of iterable) {
          if (count >= n) break;
          yield item;
          count++;
        }
      },
      
      skip: function* (iterable, n) {
        let count = 0;
        for (const item of iterable) {
          if (count >= n) {
            yield item;
          }
          count++;
        }
      }
    };

    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    
    const result = [
      ...iteratorUtils.take(
        iteratorUtils.filter(
          iteratorUtils.map(numbers, x => x * 2),
          x => x % 4 === 0
        ),
        3
      )
    ];
    
    expect(result).toEqual([4, 8, 12]);
  });

  test('should handle iterator aggregation', () => {
    const iteratorAggregators = {
      reduce: (iterable, reducer, initialValue) => {
        let accumulator = initialValue;
        for (const item of iterable) {
          accumulator = reducer(accumulator, item);
        }
        return accumulator;
      },
      
      find: (iterable, predicate) => {
        for (const item of iterable) {
          if (predicate(item)) {
            return item;
          }
        }
        return undefined;
      },
      
      every: (iterable, predicate) => {
        for (const item of iterable) {
          if (!predicate(item)) {
            return false;
          }
        }
        return true;
      },
      
      some: (iterable, predicate) => {
        for (const item of iterable) {
          if (predicate(item)) {
            return true;
          }
        }
        return false;
      },
      
      count: (iterable) => {
        let count = 0;
        for (const _ of iterable) {
          count++;
        }
        return count;
      }
    };

    const numbers = [1, 2, 3, 4, 5];
    
    expect(iteratorAggregators.reduce(numbers, (a, b) => a + b, 0)).toBe(15);
    expect(iteratorAggregators.find(numbers, x => x > 3)).toBe(4);
    expect(iteratorAggregators.every(numbers, x => x > 0)).toBe(true);
    expect(iteratorAggregators.some(numbers, x => x > 10)).toBe(false);
    expect(iteratorAggregators.count(numbers)).toBe(5);
  });

  test('should handle iterator composition', () => {
    const createIteratorChain = (iterable) => {
      let current = iterable;
      
      return {
        map: function(fn) {
          const previous = current;
          current = (function* () {
            for (const item of previous) {
              yield fn(item);
            }
          })();
          return this;
        },
        
        filter: function(predicate) {
          const previous = current;
          current = (function* () {
            for (const item of previous) {
              if (predicate(item)) {
                yield item;
              }
            }
          })();
          return this;
        },
        
        take: function(n) {
          const previous = current;
          current = (function* () {
            let count = 0;
            for (const item of previous) {
              if (count >= n) break;
              yield item;
              count++;
            }
          })();
          return this;
        },
        
        toArray: function() {
          return [...current];
        },
        
        forEach: function(fn) {
          for (const item of current) {
            fn(item);
          }
        }
      };
    };

    const result = createIteratorChain([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      .filter(x => x % 2 === 0)
      .map(x => x * 3)
      .take(3)
      .toArray();
    
    expect(result).toEqual([6, 12, 18]);
  });

  test('should handle infinite iterators', () => {
    const createInfiniteIterator = (start = 0, step = 1) => {
      let current = start;
      
      return {
        [Symbol.iterator]() {
          return this;
        },
        
        next() {
          const value = current;
          current += step;
          return { value, done: false };
        }
      };
    };

    const infiniteNumbers = createInfiniteIterator(1, 2);
    const first5Odds = [];
    
    let count = 0;
    for (const num of infiniteNumbers) {
      if (count >= 5) break;
      first5Odds.push(num);
      count++;
    }
    
    expect(first5Odds).toEqual([1, 3, 5, 7, 9]);
  });

  test('should handle iterator utilities with state', () => {
    const createStatefulIterator = (iterable) => {
      const items = [...iterable];
      let index = 0;
      
      return {
        [Symbol.iterator]() {
          return this;
        },
        
        next() {
          if (index < items.length) {
            return { value: items[index++], done: false };
          }
          return { done: true };
        },
        
        peek() {
          return index < items.length ? items[index] : undefined;
        },
        
        hasNext() {
          return index < items.length;
        },
        
        reset() {
          index = 0;
        },
        
        skip(n) {
          index = Math.min(index + n, items.length);
        },
        
        position() {
          return index;
        }
      };
    };

    const iterator = createStatefulIterator([1, 2, 3, 4, 5]);
    
    expect(iterator.peek()).toBe(1);
    expect(iterator.next().value).toBe(1);
    expect(iterator.position()).toBe(1);
    
    iterator.skip(2);
    expect(iterator.next().value).toBe(4);
    
    iterator.reset();
    expect(iterator.next().value).toBe(1);
  });

  test('should handle iterator combinations', () => {
    const iteratorCombinators = {
      zip: function* (...iterables) {
        const iterators = iterables.map(it => it[Symbol.iterator]());
        
        while (true) {
          const results = iterators.map(it => it.next());
          
          if (results.some(result => result.done)) {
            break;
          }
          
          yield results.map(result => result.value);
        }
      },
      
      concat: function* (...iterables) {
        for (const iterable of iterables) {
          yield* iterable;
        }
      },
      
      flatten: function* (iterable) {
        for (const item of iterable) {
          if (item && typeof item[Symbol.iterator] === 'function') {
            yield* this.flatten(item);
          } else {
            yield item;
          }
        }
      },
      
      enumerate: function* (iterable, start = 0) {
        let index = start;
        for (const item of iterable) {
          yield [index++, item];
        }
      }
    };

    const arr1 = [1, 2, 3];
    const arr2 = ['a', 'b', 'c'];
    
    const zipped = [...iteratorCombinators.zip(arr1, arr2)];
    expect(zipped).toEqual([[1, 'a'], [2, 'b'], [3, 'c']]);
    
    const concatenated = [...iteratorCombinators.concat(arr1, arr2)];
    expect(concatenated).toEqual([1, 2, 3, 'a', 'b', 'c']);
    
    const nested = [[1, 2], [3, [4, 5]], 6];
    const flattened = [...iteratorCombinators.flatten(nested)];
    expect(flattened).toEqual([1, 2, 3, 4, 5, 6]);
    
    const enumerated = [...iteratorCombinators.enumerate(['a', 'b', 'c'])];
    expect(enumerated).toEqual([[0, 'a'], [1, 'b'], [2, 'c']]);
  });
});
