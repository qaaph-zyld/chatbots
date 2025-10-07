/**
 * Generator Utilities Unit Tests
 */

describe('Generator Utilities', () => {
  test('should handle basic generators', () => {
    function* numberGenerator() {
      let i = 0;
      while (i < 5) {
        yield i++;
      }
    }

    const gen = numberGenerator();
    const results = [];
    
    for (const value of gen) {
      results.push(value);
    }
    
    expect(results).toEqual([0, 1, 2, 3, 4]);
  });

  test('should handle infinite generators', () => {
    function* fibonacci() {
      let a = 0, b = 1;
      while (true) {
        yield a;
        [a, b] = [b, a + b];
      }
    }

    const fib = fibonacci();
    const first10 = [];
    
    for (let i = 0; i < 10; i++) {
      first10.push(fib.next().value);
    }
    
    expect(first10).toEqual([0, 1, 1, 2, 3, 5, 8, 13, 21, 34]);
  });

  test('should handle generator composition', () => {
    function* range(start, end) {
      for (let i = start; i < end; i++) {
        yield i;
      }
    }

    function* map(generator, fn) {
      for (const value of generator) {
        yield fn(value);
      }
    }

    function* filter(generator, predicate) {
      for (const value of generator) {
        if (predicate(value)) {
          yield value;
        }
      }
    }

    function* take(generator, n) {
      let count = 0;
      for (const value of generator) {
        if (count >= n) break;
        yield value;
        count++;
      }
    }

    const numbers = range(1, 10);
    const doubled = map(numbers, x => x * 2);
    const evens = filter(doubled, x => x % 4 === 0);
    const first3 = take(evens, 3);
    
    expect([...first3]).toEqual([4, 8, 12]);
  });

  test('should handle async generators', async () => {
    async function* asyncNumberGenerator() {
      for (let i = 0; i < 3; i++) {
        await new Promise(resolve => setTimeout(resolve, 1));
        yield i;
      }
    }

    const asyncGen = asyncNumberGenerator();
    const results = [];
    
    for await (const value of asyncGen) {
      results.push(value);
    }
    
    expect(results).toEqual([0, 1, 2]);
  });

  test('should handle generator utilities', () => {
    const generatorUtils = {
      toArray: function* (generator) {
        const result = [];
        for (const value of generator) {
          result.push(value);
        }
        return result;
      },
      
      reduce: function(generator, reducer, initialValue) {
        let accumulator = initialValue;
        for (const value of generator) {
          accumulator = reducer(accumulator, value);
        }
        return accumulator;
      },
      
      find: function(generator, predicate) {
        for (const value of generator) {
          if (predicate(value)) {
            return value;
          }
        }
        return undefined;
      },
      
      every: function(generator, predicate) {
        for (const value of generator) {
          if (!predicate(value)) {
            return false;
          }
        }
        return true;
      },
      
      some: function(generator, predicate) {
        for (const value of generator) {
          if (predicate(value)) {
            return true;
          }
        }
        return false;
      }
    };

    function* numbers() {
      yield 1;
      yield 2;
      yield 3;
      yield 4;
      yield 5;
    }

    const sum = generatorUtils.reduce(numbers(), (acc, val) => acc + val, 0);
    expect(sum).toBe(15);

    const found = generatorUtils.find(numbers(), x => x > 3);
    expect(found).toBe(4);

    const allPositive = generatorUtils.every(numbers(), x => x > 0);
    expect(allPositive).toBe(true);

    const hasEven = generatorUtils.some(numbers(), x => x % 2 === 0);
    expect(hasEven).toBe(true);
  });

  test('should handle generator-based pagination', () => {
    function* paginate(data, pageSize) {
      for (let i = 0; i < data.length; i += pageSize) {
        yield data.slice(i, i + pageSize);
      }
    }

    const data = Array.from({ length: 23 }, (_, i) => i + 1);
    const pages = [...paginate(data, 5)];
    
    expect(pages).toHaveLength(5);
    expect(pages[0]).toEqual([1, 2, 3, 4, 5]);
    expect(pages[4]).toEqual([21, 22, 23]);
  });

  test('should handle generator-based streaming', () => {
    function* streamProcessor(data) {
      let buffer = '';
      
      for (const chunk of data) {
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.trim()) {
            yield line.trim();
          }
        }
      }
      
      // Yield remaining buffer if not empty
      if (buffer.trim()) {
        yield buffer.trim();
      }
    }

    const chunks = ['Hello\nWor', 'ld\nHow are', ' you?\nFine'];
    const lines = [...streamProcessor(chunks)];
    
    expect(lines).toEqual(['Hello', 'World', 'How are you?', 'Fine']);
  });
});
