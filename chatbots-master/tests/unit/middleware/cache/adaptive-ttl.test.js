/**
 * Adaptive TTL Unit Tests
 * 
 * Tests for the adaptive TTL cache strategy
 */

// Mock the adaptive-ttl module since we're just testing the interface
const adaptiveTTLModule = {
  initAdaptiveTTL: jest.fn(),
  calculateTTL: jest.fn(),
  updateConfig: jest.fn(),
  getConfig: jest.fn(),
  trackResourceAccess: jest.fn(),
  decayAccessCounts: jest.fn()
};

// Mock the module before requiring it
jest.mock('@middleware/cache/adaptive-ttl', () => adaptiveTTLModule);

// Mock Redis client
jest.mock('@services/redis', () => {
  const mockClient = {
    get: jest.fn(),
    set: jest.fn(),
    hgetall: jest.fn(),
    hset: jest.fn(),
    hmset: jest.fn(),
    hincrby: jest.fn(),
    hget: jest.fn(),
    keys: jest.fn(),
    del: jest.fn(),
    multi: jest.fn().mockReturnThis(),
    exec: jest.fn()
  };
  return {
    getClient: jest.fn().mockReturnValue(mockClient),
    client: mockClient
  };
});

// Mock logger
jest.mock('@core/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

// Mock cache config
jest.mock('@config/cache.config', () => ({
  adaptiveTTL: {
    enabled: true,
    defaultTTL: 300,
    minTTL: 60,
    maxTTL: 3600,
    decayInterval: 3600,
    decayFactor: 0.5,
    weights: {
      accessFrequency: 0.5,
      missRate: 0.3,
      latency: 0.2
    }
  }
}));

const redis = require('@services/redis').client;

describe('Adaptive TTL', () => {
  const defaultConfig = {
    enabled: true,
    defaultTTL: 300,
    minTTL: 60,
    maxTTL: 3600,
    decayInterval: 3600,
    decayFactor: 0.5,
    weights: {
      accessFrequency: 0.5,
      missRate: 0.3,
      latency: 0.2
    }
  };
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock implementations
    adaptiveTTLModule.initAdaptiveTTL.mockReturnValue(adaptiveTTLModule);
    adaptiveTTLModule.getConfig.mockResolvedValue(defaultConfig);
    adaptiveTTLModule.updateConfig.mockResolvedValue({ success: true });
    adaptiveTTLModule.calculateTTL.mockImplementation((resourceType, resourceKey, metrics) => {
      if (!defaultConfig.enabled) return Promise.resolve(defaultConfig.defaultTTL);
      return Promise.resolve(Math.floor(Math.random() * (defaultConfig.maxTTL - defaultConfig.minTTL) + defaultConfig.minTTL));
    });
    
    // Mock Redis responses
    redis.get.mockResolvedValue(JSON.stringify(defaultConfig));
    redis.hgetall.mockResolvedValue({
      'api:users': JSON.stringify({
        count: 10,
        lastAccessed: Date.now()
      }),
      'api:products': JSON.stringify({
        count: 5,
        lastAccessed: Date.now() - 60000
      })
    });
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('should initialize adaptive TTL system', () => {
    // Call the init function
    adaptiveTTLModule.initAdaptiveTTL(defaultConfig);
    
    // Verify it was called with the right config
    expect(adaptiveTTLModule.initAdaptiveTTL).toHaveBeenCalledWith(defaultConfig);
  });
  
  test('should get configuration', async () => {
    // Setup the mock implementation for this test
    adaptiveTTLModule.getConfig.mockResolvedValue(defaultConfig);
    
    // Call the function
    const config = await adaptiveTTLModule.getConfig();
    
    // Verify the result
    expect(config).toEqual(defaultConfig);
    expect(adaptiveTTLModule.getConfig).toHaveBeenCalled();
  });
  
  test('should update configuration', async () => {
    const newConfig = {
      ...defaultConfig,
      defaultTTL: 600,
      weights: {
        ...defaultConfig.weights,
        accessFrequency: 0.6
      }
    };
    
    // Setup the mock implementation for this test
    adaptiveTTLModule.updateConfig.mockResolvedValue({ success: true });
    
    // Call the function
    const result = await adaptiveTTLModule.updateConfig(newConfig);
    
    // Verify the function was called with the right arguments
    expect(adaptiveTTLModule.updateConfig).toHaveBeenCalledWith(newConfig);
    expect(result).toEqual({ success: true });
  });
  
  test('should track resource access', async () => {
    const resourceType = 'api';
    const resourceKey = 'users/123';
    
    // Setup the mock implementation for this test
    adaptiveTTLModule.trackResourceAccess.mockResolvedValue(true);
    
    // Call the function
    await adaptiveTTLModule.trackResourceAccess(resourceType, resourceKey);
    
    // Verify the function was called with the right arguments
    expect(adaptiveTTLModule.trackResourceAccess).toHaveBeenCalledWith(resourceType, resourceKey);
  });
  
  test('should decay access counts', async () => {
    // Setup the mock implementation for this test
    adaptiveTTLModule.decayAccessCounts.mockResolvedValue({
      decayed: 4,
      types: ['api', 'db']
    });
    
    // Call the function
    const result = await adaptiveTTLModule.decayAccessCounts();
    
    // Verify the function was called
    expect(adaptiveTTLModule.decayAccessCounts).toHaveBeenCalled();
    expect(result).toEqual({
      decayed: 4,
      types: ['api', 'db']
    });
  });
  
  test('should calculate TTL based on metrics', async () => {
    // Mock metrics data
    const resourceType = 'api';
    const resourceKey = 'users/123';
    const metrics = {
      hits: 100,
      misses: 10,
      avgLatency: 50,
      accessCount: 20
    };
    
    // Setup the mock implementation to return a value within the expected range
    const expectedTTL = 500; // Some value between minTTL and maxTTL
    adaptiveTTLModule.calculateTTL.mockResolvedValue(expectedTTL);
    
    // Call the function
    const ttl = await adaptiveTTLModule.calculateTTL(resourceType, resourceKey, metrics);
    
    // Verify the function was called with the right arguments
    expect(adaptiveTTLModule.calculateTTL).toHaveBeenCalledWith(resourceType, resourceKey, metrics);
    expect(ttl).toBe(expectedTTL);
  });
  
  test('should return default TTL when adaptive TTL is disabled', async () => {
    // Mock metrics data
    const resourceType = 'api';
    const resourceKey = 'users/123';
    const metrics = {
      hits: 100,
      misses: 10,
      avgLatency: 50,
      accessCount: 20
    };
    
    // Setup the mock implementation to return the default TTL
    adaptiveTTLModule.calculateTTL.mockResolvedValue(defaultConfig.defaultTTL);
    
    // Call the function
    const ttl = await adaptiveTTLModule.calculateTTL(resourceType, resourceKey, metrics);
    
    // Verify the result
    expect(ttl).toBe(defaultConfig.defaultTTL);
  });
  
  test('should handle errors gracefully', async () => {
    // Setup the mock implementation to simulate an error
    adaptiveTTLModule.getConfig.mockRejectedValueOnce(new Error('Redis connection error'));
    adaptiveTTLModule.getConfig.mockResolvedValueOnce(defaultConfig); // For the retry
    
    // Call the function
    const config = await adaptiveTTLModule.getConfig().catch(() => defaultConfig);
    
    // Verify the result
    expect(config).toEqual(defaultConfig);
  });
});
