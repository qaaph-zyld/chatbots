/**
 * Cache Utilities Unit Tests
 */

describe('Cache Utilities', () => {
  test('should handle simple cache operations', () => {
    const cache = new Map();
    
    const cacheUtils = {
      set: (key, value, ttl = null) => {
        const item = { value, timestamp: Date.now(), ttl };
        cache.set(key, item);
      },
      get: (key) => {
        const item = cache.get(key);
        if (!item) return null;
        
        if (item.ttl && Date.now() - item.timestamp > item.ttl) {
          cache.delete(key);
          return null;
        }
        
        return item.value;
      },
      has: (key) => cache.has(key),
      delete: (key) => cache.delete(key),
      clear: () => cache.clear(),
      size: () => cache.size
    };

    cacheUtils.set('key1', 'value1');
    expect(cacheUtils.get('key1')).toBe('value1');
    expect(cacheUtils.has('key1')).toBe(true);
    expect(cacheUtils.size()).toBe(1);
    
    cacheUtils.delete('key1');
    expect(cacheUtils.get('key1')).toBe(null);
  });

  test('should handle TTL expiration', () => {
    const cache = new Map();
    
    const cacheWithTTL = {
      set: (key, value, ttl) => {
        cache.set(key, { value, timestamp: Date.now(), ttl });
      },
      get: (key) => {
        const item = cache.get(key);
        if (!item) return null;
        
        if (Date.now() - item.timestamp > item.ttl) {
          cache.delete(key);
          return null;
        }
        
        return item.value;
      }
    };

    cacheWithTTL.set('temp', 'data', 100); // 100ms TTL
    expect(cacheWithTTL.get('temp')).toBe('data');
    
    // Simulate time passing
    const item = cache.get('temp');
    item.timestamp = Date.now() - 200; // Make it expired
    cache.set('temp', item);
    
    expect(cacheWithTTL.get('temp')).toBe(null);
  });

  test('should handle LRU cache behavior', () => {
    const createLRUCache = (maxSize) => {
      const cache = new Map();
      
      return {
        get: (key) => {
          if (cache.has(key)) {
            const value = cache.get(key);
            cache.delete(key);
            cache.set(key, value);
            return value;
          }
          return null;
        },
        set: (key, value) => {
          if (cache.has(key)) {
            cache.delete(key);
          } else if (cache.size >= maxSize) {
            const firstKey = cache.keys().next().value;
            cache.delete(firstKey);
          }
          cache.set(key, value);
        },
        size: () => cache.size
      };
    };

    const lru = createLRUCache(2);
    
    lru.set('a', 1);
    lru.set('b', 2);
    expect(lru.size()).toBe(2);
    
    lru.set('c', 3); // Should evict 'a'
    expect(lru.get('a')).toBe(null);
    expect(lru.get('b')).toBe(2);
    expect(lru.get('c')).toBe(3);
  });

  test('should handle cache statistics', () => {
    const cacheWithStats = {
      cache: new Map(),
      stats: { hits: 0, misses: 0, sets: 0 },
      
      get: function(key) {
        if (this.cache.has(key)) {
          this.stats.hits++;
          return this.cache.get(key);
        } else {
          this.stats.misses++;
          return null;
        }
      },
      
      set: function(key, value) {
        this.stats.sets++;
        this.cache.set(key, value);
      },
      
      getStats: function() {
        const total = this.stats.hits + this.stats.misses;
        return {
          ...this.stats,
          hitRate: total > 0 ? this.stats.hits / total : 0
        };
      }
    };

    cacheWithStats.set('key', 'value');
    cacheWithStats.get('key');
    cacheWithStats.get('missing');
    
    const stats = cacheWithStats.getStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.sets).toBe(1);
    expect(stats.hitRate).toBe(0.5);
  });
});
