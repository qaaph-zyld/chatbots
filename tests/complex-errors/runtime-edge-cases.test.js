/**
 * Runtime Edge Case Tests
 * 
 * This test suite demonstrates complex runtime errors that are challenging
 * for AI fix engines to resolve. These include:
 * - Race conditions
 * - Memory leaks
 * - Asynchronous timing issues
 * - Complex state management bugs
 */

describe('Runtime Edge Case Tests', () => {
  
  describe('Asynchronous Timing Issues', () => {
    test('Promise resolution order is incorrect', async () => {
      // This test demonstrates a common async issue where the order of operations
      // is not properly maintained, leading to incorrect results
      
      const results = [];
      
      // Intentional bug: not awaiting the first promise before starting the second
      const processData = async () => {
        const promise1 = new Promise(resolve => {
          setTimeout(() => {
            results.push('Step 1');
            resolve('Step 1 Complete');
          }, 100);
        });
        
        // This should wait for promise1, but doesn't
        const promise2 = new Promise(resolve => {
          setTimeout(() => {
            results.push('Step 2');
            resolve('Step 2 Complete');
          }, 50);
        });
        
        // This creates a race condition where Step 2 will complete before Step 1
        await promise1;
        await promise2;
        
        return results;
      };
      
      const finalResults = await processData();
      // This will fail because Step 2 will be processed before Step 1
      expect(finalResults).toEqual(['Step 1', 'Step 2']);
    });
    
    test('Fix verification - correct async operation order', async () => {
      // This test verifies the fix for the async timing issue
      
      const results = [];
      
      // Fixed version: properly awaiting each promise in sequence
      const processDataFixed = async () => {
        const promise1 = new Promise(resolve => {
          setTimeout(() => {
            results.push('Step 1');
            resolve('Step 1 Complete');
          }, 100);
        });
        
        // Wait for promise1 to complete before starting promise2
        await promise1;
        
        const promise2 = new Promise(resolve => {
          setTimeout(() => {
            results.push('Step 2');
            resolve('Step 2 Complete');
          }, 50);
        });
        
        await promise2;
        
        return results;
      };
      
      const finalResults = await processDataFixed();
      expect(finalResults).toEqual(['Step 1', 'Step 2']);
    });
  });
  
  describe('Memory Leak Simulation', () => {
    test('Function creates potential memory leak', () => {
      // This test simulates a memory leak scenario that's hard for AI to detect
      
      const createLargeDataStructures = () => {
        const cache = {};
        
        return {
          addItem: (key, value) => {
            // Bug: No cache size limit or cleanup mechanism
            cache[key] = {
              data: new Array(10000).fill(value),
              timestamp: Date.now()
            };
          },
          getItem: (key) => {
            return cache[key]?.data;
          },
          // Bug: Missing cache cleanup method
          getCacheSize: () => Object.keys(cache).length
        };
      };
      
      const dataManager = createLargeDataStructures();
      
      // Add many items to simulate memory pressure
      for (let i = 0; i < 100; i++) {
        dataManager.addItem(`key-${i}`, i);
      }
      
      // Verify the cache has grown to an unsafe size
      expect(dataManager.getCacheSize()).toBe(100);
      
      // This test "passes" but actually demonstrates the problem
      // A proper implementation would limit cache size
    });
    
    test('Fix verification - memory leak prevention', () => {
      // This test verifies the fix for the memory leak issue
      
      const MAX_CACHE_SIZE = 50;
      
      const createLargeDataStructuresFixed = () => {
        const cache = {};
        const keys = [];
        
        return {
          addItem: (key, value) => {
            // Fixed: Implement cache size limit and LRU eviction
            if (keys.includes(key)) {
              // Move existing key to the end (most recently used)
              keys.splice(keys.indexOf(key), 1);
              keys.push(key);
            } else {
              // Add new key
              keys.push(key);
              // Evict oldest item if cache exceeds max size
              if (keys.length > MAX_CACHE_SIZE) {
                const oldestKey = keys.shift();
                delete cache[oldestKey];
              }
            }
            
            cache[key] = {
              data: new Array(10000).fill(value),
              timestamp: Date.now()
            };
          },
          getItem: (key) => {
            if (cache[key]) {
              // Move accessed key to the end (most recently used)
              keys.splice(keys.indexOf(key), 1);
              keys.push(key);
              return cache[key].data;
            }
            return undefined;
          },
          clearCache: () => {
            Object.keys(cache).forEach(key => delete cache[key]);
            keys.length = 0;
          },
          getCacheSize: () => Object.keys(cache).length
        };
      };
      
      const dataManager = createLargeDataStructuresFixed();
      
      // Add many items to simulate memory pressure
      for (let i = 0; i < 100; i++) {
        dataManager.addItem(`key-${i}`, i);
      }
      
      // Verify the cache has been limited to MAX_CACHE_SIZE
      expect(dataManager.getCacheSize()).toBe(MAX_CACHE_SIZE);
      
      // Verify the most recent items are kept (not the oldest)
      expect(dataManager.getItem('key-99')).toBeDefined();
      expect(dataManager.getItem('key-0')).toBeUndefined();
    });
  });
  
  describe('Race Condition in State Management', () => {
    test('Counter increments incorrectly with async operations', async () => {
      // This test demonstrates a race condition in state management
      
      class AsyncCounter {
        constructor() {
          this.count = 0;
        }
        
        // Bug: Race condition in async increment
        async increment() {
          // Simulate reading the current value from a data store
          const currentValue = this.count;
          
          // Simulate some async operation that takes time
          await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
          
          // Update with the incremented value
          // Bug: This doesn't account for other increments that might have
          // happened while we were waiting
          this.count = currentValue + 1;
          
          return this.count;
        }
        
        getValue() {
          return this.count;
        }
      }
      
      const counter = new AsyncCounter();
      
      // Perform multiple increments in parallel
      const incrementPromises = [];
      for (let i = 0; i < 10; i++) {
        incrementPromises.push(counter.increment());
      }
      
      // Wait for all increments to complete
      await Promise.all(incrementPromises);
      
      // This will fail because of the race condition
      // We expect 10 increments to result in a value of 10
      expect(counter.getValue()).toBe(10);
    });
    
    test('Fix verification - race condition prevention', async () => {
      // This test verifies the fix for the race condition issue
      
      class AsyncCounterFixed {
        constructor() {
          this.count = 0;
          this._lock = Promise.resolve();
        }
        
        // Fixed: Use a lock to prevent race conditions
        async increment() {
          // Create a new promise that resolves when the lock is released
          const newLock = new Promise(async (resolve) => {
            // Wait for any previous operations to complete
            await this._lock;
            
            try {
              // Simulate reading the current value from a data store
              const currentValue = this.count;
              
              // Simulate some async operation that takes time
              await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
              
              // Update with the incremented value
              this.count = currentValue + 1;
            } finally {
              // Release the lock
              resolve();
            }
          });
          
          // Update the lock
          this._lock = newLock;
          
          // Wait for this operation to complete
          await newLock;
          
          return this.count;
        }
        
        getValue() {
          return this.count;
        }
      }
      
      const counter = new AsyncCounterFixed();
      
      // Perform multiple increments in parallel
      const incrementPromises = [];
      for (let i = 0; i < 10; i++) {
        incrementPromises.push(counter.increment());
      }
      
      // Wait for all increments to complete
      await Promise.all(incrementPromises);
      
      // This should now pass because the race condition is fixed
      expect(counter.getValue()).toBe(10);
    });
  });
});
