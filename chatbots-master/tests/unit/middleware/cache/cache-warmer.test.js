/**
 * Cache Warmer Unit Tests
 * 
 * Tests for the cache warming system
 */

// Import dependencies
const { initWarming, trackAccess, getTopResources, resetTracker } = require('@middleware/cache/cache-warmer');

// Mock Redis client
const mockRedisClient = {
  setex: jest.fn().mockResolvedValue('OK'),
  get: jest.fn(),
  keys: jest.fn(),
  del: jest.fn()
};

// Mock logger
jest.mock('@core/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

// Mock cache config
jest.mock('@config/cache.config', () => ({
  warming: {
    enabled: true,
    interval: 5000,
    maxItems: 10,
    minHits: 3
  }
}));

describe('Cache Warmer', () => {
  let warmer;
  
  beforeEach(() => {
    // Initialize warming with test options
    warmer = initWarming(mockRedisClient, {
      enabled: true,
      interval: 1000,
      maxItems: 5,
      minHits: 2
    });
    
    // Reset tracker before each test
    warmer.resetTracker();
    
    // Reset mocks
    jest.clearAllMocks();
  });
  
  test('should initialize warming system', () => {
    expect(warmer).toBeDefined();
    expect(typeof warmer.trackAccess).toBe('function');
    expect(typeof warmer.warmCache).toBe('function');
    expect(typeof warmer.getTopResources).toBe('function');
    expect(typeof warmer.resetTracker).toBe('function');
  });
  
  test('should track resource access', () => {
    // Mock fetch function
    const fetchFunction = jest.fn();
    
    // Track access multiple times
    warmer.trackAccess('sentiment', 'key1', fetchFunction);
    warmer.trackAccess('sentiment', 'key1', fetchFunction);
    warmer.trackAccess('sentiment', 'key1', fetchFunction);
    warmer.trackAccess('sentiment', 'key2', fetchFunction);
    warmer.trackAccess('conversation', 'key3', fetchFunction);
    
    // Get top resources
    const topResources = warmer.getTopResources();
    
    // Check top resources
    expect(topResources.length).toBe(2); // Only 2 resources have >= 2 hits (minHits)
    expect(topResources[0].resourceType).toBe('sentiment');
    expect(topResources[0].key).toBe('key1');
    expect(topResources[0].hits).toBe(3);
    expect(topResources[1].resourceType).toBe('sentiment');
    expect(topResources[1].key).toBe('key2');
    expect(topResources[1].hits).toBe(1);
  });
  
  test('should respect minHits threshold', () => {
    // Mock fetch function
    const fetchFunction = jest.fn();
    
    // Track access
    warmer.trackAccess('sentiment', 'key1', fetchFunction); // 1 hit
    warmer.trackAccess('sentiment', 'key2', fetchFunction);
    warmer.trackAccess('sentiment', 'key2', fetchFunction); // 2 hits
    warmer.trackAccess('conversation', 'key3', fetchFunction);
    warmer.trackAccess('conversation', 'key3', fetchFunction);
    warmer.trackAccess('conversation', 'key3', fetchFunction); // 3 hits
    
    // Get top resources with higher minHits
    const topResources = warmer.getTopResources(5, 3);
    
    // Check top resources
    expect(topResources.length).toBe(1); // Only 1 resource has >= 3 hits
    expect(topResources[0].resourceType).toBe('conversation');
    expect(topResources[0].key).toBe('key3');
    expect(topResources[0].hits).toBe(3);
  });
  
  test('should respect maxItems limit', () => {
    // Mock fetch function
    const fetchFunction = jest.fn();
    
    // Track access for many resources
    for (let i = 0; i < 10; i++) {
      warmer.trackAccess('sentiment', `key${i}`, fetchFunction);
      warmer.trackAccess('sentiment', `key${i}`, fetchFunction);
      warmer.trackAccess('sentiment', `key${i}`, fetchFunction);
    }
    
    // Get top resources with lower maxItems
    const topResources = warmer.getTopResources(3, 2);
    
    // Check top resources
    expect(topResources.length).toBe(3); // Limited to 3 resources
  });
  
  test('should warm cache with top resources', async () => {
    // Mock fetch functions
    const fetchFunction1 = jest.fn().mockResolvedValue({ data: 'resource1' });
    const fetchFunction2 = jest.fn().mockResolvedValue({ data: 'resource2' });
    const fetchFunction3 = jest.fn().mockResolvedValue(null); // This one returns null
    
    // Track access
    warmer.trackAccess('sentiment', 'key1', fetchFunction1);
    warmer.trackAccess('sentiment', 'key1', fetchFunction1);
    warmer.trackAccess('sentiment', 'key1', fetchFunction1);
    
    warmer.trackAccess('sentiment', 'key2', fetchFunction2);
    warmer.trackAccess('sentiment', 'key2', fetchFunction2);
    
    warmer.trackAccess('conversation', 'key3', fetchFunction3);
    warmer.trackAccess('conversation', 'key3', fetchFunction3);
    warmer.trackAccess('conversation', 'key3', fetchFunction3);
    
    // Warm cache
    const result = await warmer.warmCache();
    
    // Check result
    expect(result.total).toBe(3); // 3 resources qualified for warming
    expect(result.warmed).toBe(2); // Only 2 were successfully warmed (fetchFunction3 returns null)
    
    // Check fetch functions were called
    expect(fetchFunction1).toHaveBeenCalledTimes(1);
    expect(fetchFunction2).toHaveBeenCalledTimes(1);
    expect(fetchFunction3).toHaveBeenCalledTimes(1);
    
    // Check Redis setex was called for successful resources
    expect(mockRedisClient.setex).toHaveBeenCalledTimes(2);
    expect(mockRedisClient.setex).toHaveBeenCalledWith(
      'sentiment:key1',
      3600,
      JSON.stringify({ data: 'resource1' })
    );
    expect(mockRedisClient.setex).toHaveBeenCalledWith(
      'sentiment:key2',
      3600,
      JSON.stringify({ data: 'resource2' })
    );
  });
  
  test('should handle errors during warming', async () => {
    // Mock fetch function that throws an error
    const fetchFunction = jest.fn().mockRejectedValue(new Error('Fetch error'));
    
    // Track access
    warmer.trackAccess('sentiment', 'key1', fetchFunction);
    warmer.trackAccess('sentiment', 'key1', fetchFunction);
    warmer.trackAccess('sentiment', 'key1', fetchFunction);
    
    // Warm cache
    const result = await warmer.warmCache();
    
    // Check result
    expect(result.total).toBe(1); // 1 resource qualified for warming
    expect(result.warmed).toBe(0); // 0 were successfully warmed due to error
    
    // Check fetch function was called
    expect(fetchFunction).toHaveBeenCalledTimes(1);
    
    // Check Redis setex was not called
    expect(mockRedisClient.setex).not.toHaveBeenCalled();
  });
  
  test('should reset access tracker', () => {
    // Mock fetch function
    const fetchFunction = jest.fn();
    
    // Track access
    warmer.trackAccess('sentiment', 'key1', fetchFunction);
    warmer.trackAccess('sentiment', 'key1', fetchFunction);
    
    // Get top resources before reset
    const topResourcesBefore = warmer.getTopResources();
    expect(topResourcesBefore.length).toBe(1);
    
    // Reset tracker
    warmer.resetTracker();
    
    // Get top resources after reset
    const topResourcesAfter = warmer.getTopResources();
    expect(topResourcesAfter.length).toBe(0);
  });
  
  test('should return empty warmer when disabled', () => {
    // Create disabled warmer
    const disabledWarmer = initWarming(mockRedisClient, {
      enabled: false
    });
    
    // Track access (should be no-op)
    disabledWarmer.trackAccess('sentiment', 'key1', jest.fn());
    
    // Warm cache (should be no-op)
    const result = disabledWarmer.warmCache();
    
    // Check result
    expect(result).toBeUndefined();
    
    // Check Redis was not called
    expect(mockRedisClient.setex).not.toHaveBeenCalled();
  });
});
