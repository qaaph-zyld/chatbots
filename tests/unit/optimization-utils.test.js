/**
 * Optimization Utilities Unit Tests
 */

describe('Optimization Utilities', () => {
  test('should handle lazy evaluation', () => {
    const lazy = (fn) => {
      let cached = false;
      let result;
      
      return () => {
        if (!cached) {
          result = fn();
          cached = true;
        }
        return result;
      };
    };

    let callCount = 0;
    const expensiveOperation = lazy(() => {
      callCount++;
      return 'expensive result';
    });

    expect(callCount).toBe(0);
    expect(expensiveOperation()).toBe('expensive result');
    expect(callCount).toBe(1);
    expect(expensiveOperation()).toBe('expensive result');
    expect(callCount).toBe(1); // Still 1, not called again
  });

  test('should handle memoization with TTL', () => {
    const memoizeWithTTL = (fn, ttl = 1000) => {
      const cache = new Map();
      
      return (...args) => {
        const key = JSON.stringify(args);
        const now = Date.now();
        
        if (cache.has(key)) {
          const { value, timestamp } = cache.get(key);
          if (now - timestamp < ttl) {
            return value;
          }
          cache.delete(key);
        }
        
        const result = fn(...args);
        cache.set(key, { value: result, timestamp: now });
        return result;
      };
    };

    let callCount = 0;
    const memoizedFn = memoizeWithTTL((x) => {
      callCount++;
      return x * 2;
    }, 100);

    expect(memoizedFn(5)).toBe(10);
    expect(callCount).toBe(1);
    
    expect(memoizedFn(5)).toBe(10);
    expect(callCount).toBe(1); // Cached
    
    // Simulate TTL expiry
    const originalNow = Date.now;
    Date.now = () => originalNow() + 200;
    
    expect(memoizedFn(5)).toBe(10);
    expect(callCount).toBe(2); // Cache expired
    
    Date.now = originalNow; // Restore
  });

  test('should handle object pooling', () => {
    const createObjectPool = (factory, resetFn = null) => {
      const pool = [];
      
      return {
        acquire: () => {
          if (pool.length > 0) {
            return pool.pop();
          }
          return factory();
        },
        
        release: (obj) => {
          if (resetFn) {
            resetFn(obj);
          }
          pool.push(obj);
        },
        
        size: () => pool.length
      };
    };

    const arrayPool = createObjectPool(
      () => [],
      (arr) => arr.length = 0
    );

    const arr1 = arrayPool.acquire();
    arr1.push(1, 2, 3);
    expect(arr1).toEqual([1, 2, 3]);
    
    arrayPool.release(arr1);
    expect(arrayPool.size()).toBe(1);
    
    const arr2 = arrayPool.acquire();
    expect(arr2).toEqual([]); // Reset function cleared it
    expect(arr2).toBe(arr1); // Same object reused
  });

  test('should handle batch processing', () => {
    const createBatchProcessor = (processFn, batchSize = 10, delay = 100) => {
      let batch = [];
      let timeoutId = null;
      
      const flush = () => {
        if (batch.length > 0) {
          const currentBatch = batch.splice(0);
          processFn(currentBatch);
        }
        timeoutId = null;
      };
      
      return {
        add: (item) => {
          batch.push(item);
          
          if (batch.length >= batchSize) {
            if (timeoutId) {
              clearTimeout(timeoutId);
              timeoutId = null;
            }
            flush();
          } else if (!timeoutId) {
            timeoutId = setTimeout(flush, delay);
          }
        },
        
        flush: () => {
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          flush();
        },
        
        size: () => batch.length
      };
    };

    const processedBatches = [];
    const processor = createBatchProcessor(
      (batch) => processedBatches.push([...batch]),
      3,
      50
    );

    processor.add('item1');
    processor.add('item2');
    expect(processedBatches).toHaveLength(0);
    
    processor.add('item3');
    expect(processedBatches).toHaveLength(1);
    expect(processedBatches[0]).toEqual(['item1', 'item2', 'item3']);
  });

  test('should handle resource recycling', () => {
    const createResourceManager = () => {
      const resources = new Map();
      const usage = new Map();
      
      return {
        register: (id, resource) => {
          resources.set(id, resource);
          usage.set(id, 0);
        },
        
        use: (id) => {
          if (resources.has(id)) {
            usage.set(id, usage.get(id) + 1);
            return resources.get(id);
          }
          return null;
        },
        
        release: (id) => {
          if (usage.has(id) && usage.get(id) > 0) {
            usage.set(id, usage.get(id) - 1);
          }
        },
        
        cleanup: (threshold = 0) => {
          const toRemove = [];
          usage.forEach((count, id) => {
            if (count <= threshold) {
              toRemove.push(id);
            }
          });
          
          toRemove.forEach(id => {
            resources.delete(id);
            usage.delete(id);
          });
          
          return toRemove.length;
        },
        
        getUsage: (id) => usage.get(id) || 0,
        getStats: () => ({ 
          total: resources.size, 
          totalUsage: Array.from(usage.values()).reduce((a, b) => a + b, 0) 
        })
      };
    };

    const manager = createResourceManager();
    
    manager.register('db1', { connection: 'database1' });
    manager.register('cache1', { connection: 'cache1' });
    
    const db = manager.use('db1');
    expect(db.connection).toBe('database1');
    expect(manager.getUsage('db1')).toBe(1);
    
    manager.release('db1');
    expect(manager.getUsage('db1')).toBe(0);
    
    const cleaned = manager.cleanup(0);
    expect(cleaned).toBe(2);
    expect(manager.getStats().total).toBe(0);
  });

  test('should handle virtual scrolling calculation', () => {
    const createVirtualScrolling = (itemHeight, containerHeight) => {
      return {
        getVisibleRange: (scrollTop, totalItems) => {
          const startIndex = Math.floor(scrollTop / itemHeight);
          const endIndex = Math.min(
            startIndex + Math.ceil(containerHeight / itemHeight) + 1,
            totalItems - 1
          );
          
          return { startIndex: Math.max(0, startIndex), endIndex };
        },
        
        getScrollHeight: (totalItems) => {
          return totalItems * itemHeight;
        },
        
        getOffsetY: (index) => {
          return index * itemHeight;
        },
        
        getItemsInView: (scrollTop, totalItems) => {
          const { startIndex, endIndex } = this.getVisibleRange(scrollTop, totalItems);
          return endIndex - startIndex + 1;
        }
      };
    };

    const virtualScroll = createVirtualScrolling(50, 300);
    
    const range = virtualScroll.getVisibleRange(100, 1000);
    expect(range.startIndex).toBe(2); // 100 / 50 = 2
    expect(range.endIndex).toBe(8); // 2 + ceil(300/50) + 1 = 8
    
    expect(virtualScroll.getScrollHeight(1000)).toBe(50000);
    expect(virtualScroll.getOffsetY(10)).toBe(500);
  });

  test('should handle debounced operations', () => {
    const debounce = (fn, delay) => {
      let timeoutId;
      let lastArgs;
      
      const debouncedFn = (...args) => {
        lastArgs = args;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...lastArgs), delay);
      };
      
      debouncedFn.cancel = () => {
        clearTimeout(timeoutId);
      };
      
      debouncedFn.flush = () => {
        clearTimeout(timeoutId);
        if (lastArgs) {
          fn(...lastArgs);
        }
      };
      
      return debouncedFn;
    };

    let callCount = 0;
    let lastValue = null;
    
    const debouncedFn = debounce((value) => {
      callCount++;
      lastValue = value;
    }, 100);

    debouncedFn('first');
    debouncedFn('second');
    debouncedFn('third');
    
    expect(callCount).toBe(0); // Not called yet
    
    debouncedFn.flush();
    expect(callCount).toBe(1);
    expect(lastValue).toBe('third');
  });
});
