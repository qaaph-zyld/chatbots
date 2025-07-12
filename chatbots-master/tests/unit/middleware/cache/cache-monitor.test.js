/**
 * Cache Monitor Unit Tests
 * 
 * Tests for the cache monitoring system
 */

// Import dependencies
const { initMonitoring, recordHit, recordMiss, getMetrics, resetMetrics } = require('@middleware/cache/cache-monitor');

// Mock logger
jest.mock('@core/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

// Mock cache config
jest.mock('@config/cache.config', () => ({
  monitoring: {
    enabled: true,
    sampleRate: 1.0,
    logLevel: 'info',
    metricsInterval: 1000,
    retentionPeriod: 10000
  }
}));

describe('Cache Monitor', () => {
  let monitor;
  
  beforeEach(() => {
    // Initialize monitoring with test options
    monitor = initMonitoring({
      enabled: true,
      sampleRate: 1.0,
      logLevel: 'info',
      metricsInterval: 100,
      retentionPeriod: 1000
    });
    
    // Reset metrics before each test
    monitor.resetMetrics();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('should initialize monitoring system', () => {
    expect(monitor).toBeDefined();
    expect(typeof monitor.recordHit).toBe('function');
    expect(typeof monitor.recordMiss).toBe('function');
    expect(typeof monitor.getMetrics).toBe('function');
    expect(typeof monitor.resetMetrics).toBe('function');
  });
  
  test('should record cache hits', () => {
    // Record some hits
    monitor.recordHit('sentiment', 'key1', 10, 100);
    monitor.recordHit('sentiment', 'key2', 20, 200);
    monitor.recordHit('conversation', 'key3', 15, 150);
    
    // Get metrics
    const metrics = monitor.getMetrics();
    
    // Check metrics
    expect(metrics.resources.sentiment).toBeDefined();
    expect(metrics.resources.sentiment.hits).toBe(2);
    expect(metrics.resources.sentiment.misses).toBe(0);
    expect(metrics.resources.sentiment.hitRate).toBe(1);
    expect(metrics.resources.sentiment.avgLatency).toBe(15); // (10 + 20) / 2
    expect(metrics.resources.sentiment.avgSize).toBe(150); // (100 + 200) / 2
    
    expect(metrics.resources.conversation).toBeDefined();
    expect(metrics.resources.conversation.hits).toBe(1);
    expect(metrics.resources.conversation.misses).toBe(0);
    expect(metrics.resources.conversation.hitRate).toBe(1);
    expect(metrics.resources.conversation.avgLatency).toBe(15);
    expect(metrics.resources.conversation.avgSize).toBe(150);
    
    expect(metrics.overall.hits).toBe(3);
    expect(metrics.overall.misses).toBe(0);
    expect(metrics.overall.total).toBe(3);
    expect(metrics.overall.hitRate).toBe(1);
  });
  
  test('should record cache misses', () => {
    // Record some misses
    monitor.recordMiss('sentiment', 'key1');
    monitor.recordMiss('sentiment', 'key2');
    monitor.recordMiss('conversation', 'key3');
    
    // Get metrics
    const metrics = monitor.getMetrics();
    
    // Check metrics
    expect(metrics.resources.sentiment).toBeDefined();
    expect(metrics.resources.sentiment.hits).toBe(0);
    expect(metrics.resources.sentiment.misses).toBe(2);
    expect(metrics.resources.sentiment.hitRate).toBe(0);
    
    expect(metrics.resources.conversation).toBeDefined();
    expect(metrics.resources.conversation.hits).toBe(0);
    expect(metrics.resources.conversation.misses).toBe(1);
    expect(metrics.resources.conversation.hitRate).toBe(0);
    
    expect(metrics.overall.hits).toBe(0);
    expect(metrics.overall.misses).toBe(3);
    expect(metrics.overall.total).toBe(3);
    expect(metrics.overall.hitRate).toBe(0);
  });
  
  test('should calculate hit rate correctly', () => {
    // Record hits and misses
    monitor.recordHit('sentiment', 'key1', 10, 100);
    monitor.recordHit('sentiment', 'key2', 20, 200);
    monitor.recordMiss('sentiment', 'key3');
    monitor.recordMiss('sentiment', 'key4');
    
    // Get metrics
    const metrics = monitor.getMetrics();
    
    // Check metrics
    expect(metrics.resources.sentiment).toBeDefined();
    expect(metrics.resources.sentiment.hits).toBe(2);
    expect(metrics.resources.sentiment.misses).toBe(2);
    expect(metrics.resources.sentiment.total).toBe(4);
    expect(metrics.resources.sentiment.hitRate).toBe(0.5); // 2 hits / 4 total
    
    expect(metrics.overall.hits).toBe(2);
    expect(metrics.overall.misses).toBe(2);
    expect(metrics.overall.total).toBe(4);
    expect(metrics.overall.hitRate).toBe(0.5);
  });
  
  test('should take snapshots for historical tracking', async () => {
    // Record some hits and misses
    monitor.recordHit('sentiment', 'key1', 10, 100);
    monitor.recordMiss('sentiment', 'key2');
    
    // Take snapshot
    const snapshot = monitor.takeSnapshot();
    
    // Wait for a moment
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Record more hits and misses
    monitor.recordHit('conversation', 'key3', 15, 150);
    monitor.recordMiss('conversation', 'key4');
    
    // Take another snapshot
    const snapshot2 = monitor.takeSnapshot();
    
    // Get history
    const history = monitor.getHistory();
    
    // Check history
    expect(history.length).toBe(2);
    expect(history[0].timestamp).toBe(snapshot.timestamp);
    expect(history[1].timestamp).toBe(snapshot2.timestamp);
    
    // Check first snapshot
    expect(history[0].resources.sentiment).toBeDefined();
    expect(history[0].resources.sentiment.hits).toBe(1);
    expect(history[0].resources.sentiment.misses).toBe(1);
    expect(history[0].resources.sentiment.hitRate).toBe(0.5);
    
    // Check second snapshot
    expect(history[1].resources.sentiment).toBeDefined();
    expect(history[1].resources.sentiment.hits).toBe(1);
    expect(history[1].resources.sentiment.misses).toBe(1);
    expect(history[1].resources.conversation).toBeDefined();
    expect(history[1].resources.conversation.hits).toBe(1);
    expect(history[1].resources.conversation.misses).toBe(1);
  });
  
  test('should reset metrics', () => {
    // Record some hits and misses
    monitor.recordHit('sentiment', 'key1', 10, 100);
    monitor.recordMiss('sentiment', 'key2');
    
    // Take snapshot
    monitor.takeSnapshot();
    
    // Reset metrics
    monitor.resetMetrics();
    
    // Get metrics
    const metrics = monitor.getMetrics();
    
    // Check metrics
    expect(Object.keys(metrics.resources).length).toBe(0);
    expect(metrics.overall.hits).toBe(0);
    expect(metrics.overall.misses).toBe(0);
    expect(metrics.overall.total).toBe(0);
    
    // History should still be intact
    const history = monitor.getHistory();
    expect(history.length).toBe(1);
  });
  
  test('should respect sample rate', () => {
    // Create monitor with low sample rate
    const lowSampleMonitor = initMonitoring({
      enabled: true,
      sampleRate: 0.0, // 0% sampling
      logLevel: 'info'
    });
    
    // Record hits and misses
    lowSampleMonitor.recordHit('sentiment', 'key1', 10, 100);
    lowSampleMonitor.recordMiss('sentiment', 'key2');
    
    // Get metrics
    const metrics = lowSampleMonitor.getMetrics();
    
    // Check metrics - should be empty due to 0% sampling
    expect(Object.keys(metrics.resources).length).toBe(0);
    expect(metrics.overall.hits).toBe(0);
    expect(metrics.overall.misses).toBe(0);
  });
  
  test('should return empty metrics when disabled', () => {
    // Create disabled monitor
    const disabledMonitor = initMonitoring({
      enabled: false
    });
    
    // Record hits and misses (should be no-ops)
    disabledMonitor.recordHit('sentiment', 'key1', 10, 100);
    disabledMonitor.recordMiss('sentiment', 'key2');
    
    // Get metrics
    const metrics = disabledMonitor.getMetrics();
    
    // Check metrics - should be empty
    expect(metrics).toEqual({});
  });
});
