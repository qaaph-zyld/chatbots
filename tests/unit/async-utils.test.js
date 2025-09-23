/**
 * Async Utilities Unit Tests
 */

describe('Async Utilities', () => {
  test('should handle promise utilities', async () => {
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    const timeout = (promise, ms) => {
      return Promise.race([
        promise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), ms)
        )
      ]);
    };

    const retry = async (fn, maxAttempts = 3) => {
      let lastError;
      for (let i = 0; i < maxAttempts; i++) {
        try {
          return await fn();
        } catch (error) {
          lastError = error;
          if (i < maxAttempts - 1) {
            await delay(100 * (i + 1)); // Exponential backoff
          }
        }
      }
      throw lastError;
    };

    // Test delay
    const start = Date.now();
    await delay(50);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(45);

    // Test retry with success
    let attempts = 0;
    const successfulFn = async () => {
      attempts++;
      if (attempts < 2) throw new Error('Fail');
      return 'success';
    };

    const result = await retry(successfulFn);
    expect(result).toBe('success');
    expect(attempts).toBe(2);
  });

  test('should handle concurrent execution', async () => {
    const concurrent = async (tasks, limit = 3) => {
      const results = [];
      const executing = [];
      
      for (const task of tasks) {
        const promise = task().then(result => {
          executing.splice(executing.indexOf(promise), 1);
          return result;
        });
        
        results.push(promise);
        executing.push(promise);
        
        if (executing.length >= limit) {
          await Promise.race(executing);
        }
      }
      
      return Promise.all(results);
    };

    const tasks = Array.from({ length: 5 }, (_, i) => 
      () => Promise.resolve(`task-${i}`)
    );

    const results = await concurrent(tasks, 2);
    expect(results).toEqual(['task-0', 'task-1', 'task-2', 'task-3', 'task-4']);
  });

  test('should handle async iteration', async () => {
    const asyncMap = async (array, mapper) => {
      const results = [];
      for (const item of array) {
        results.push(await mapper(item));
      }
      return results;
    };

    const asyncFilter = async (array, predicate) => {
      const results = [];
      for (const item of array) {
        if (await predicate(item)) {
          results.push(item);
        }
      }
      return results;
    };

    const numbers = [1, 2, 3, 4, 5];
    
    const doubled = await asyncMap(numbers, async (n) => n * 2);
    expect(doubled).toEqual([2, 4, 6, 8, 10]);

    const evens = await asyncFilter(numbers, async (n) => n % 2 === 0);
    expect(evens).toEqual([2, 4]);
  });

  test('should handle async queue processing', async () => {
    const createAsyncQueue = () => {
      const queue = [];
      let processing = false;
      
      const process = async () => {
        if (processing) return;
        processing = true;
        
        while (queue.length > 0) {
          const { task, resolve, reject } = queue.shift();
          try {
            const result = await task();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }
        
        processing = false;
      };
      
      return {
        add: (task) => {
          return new Promise((resolve, reject) => {
            queue.push({ task, resolve, reject });
            process();
          });
        },
        size: () => queue.length,
        isProcessing: () => processing
      };
    };

    const asyncQueue = createAsyncQueue();
    
    const results = await Promise.all([
      asyncQueue.add(() => Promise.resolve('first')),
      asyncQueue.add(() => Promise.resolve('second')),
      asyncQueue.add(() => Promise.resolve('third'))
    ]);

    expect(results).toEqual(['first', 'second', 'third']);
  });

  test('should handle async memoization', async () => {
    const memoizeAsync = (fn) => {
      const cache = new Map();
      
      return async (...args) => {
        const key = JSON.stringify(args);
        
        if (cache.has(key)) {
          return cache.get(key);
        }
        
        const result = await fn(...args);
        cache.set(key, result);
        return result;
      };
    };

    let callCount = 0;
    const expensiveOperation = memoizeAsync(async (n) => {
      callCount++;
      return n * 2;
    });

    const result1 = await expensiveOperation(5);
    const result2 = await expensiveOperation(5);
    const result3 = await expensiveOperation(10);

    expect(result1).toBe(10);
    expect(result2).toBe(10);
    expect(result3).toBe(20);
    expect(callCount).toBe(2); // Only called twice due to memoization
  });

  test('should handle promise batching', async () => {
    const batchPromises = (promises, batchSize = 3) => {
      const batches = [];
      for (let i = 0; i < promises.length; i += batchSize) {
        batches.push(promises.slice(i, i + batchSize));
      }
      
      return batches.reduce(async (acc, batch) => {
        const results = await acc;
        const batchResults = await Promise.all(batch);
        return [...results, ...batchResults];
      }, Promise.resolve([]));
    };

    const promises = Array.from({ length: 7 }, (_, i) => 
      Promise.resolve(`item-${i}`)
    );

    const results = await batchPromises(promises, 3);
    expect(results).toHaveLength(7);
    expect(results[0]).toBe('item-0');
    expect(results[6]).toBe('item-6');
  });
});
