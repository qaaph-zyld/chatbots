/**
 * Scaling Service Unit Tests
 */

const sinon = require('sinon');
const os = require('os');
const { mockDeep } = require('jest-mock-extended');

// Import the service to test
const ScalingService = require('../../../scaling/scaling.service');

// Import dependencies
const cluster = require('../../../scaling/cluster');
const { logger } = require('../../../utils');

// Mock dependencies
jest.mock('../../../scaling/cluster');
jest.mock('../../../utils', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));
jest.mock('os');

describe('Scaling Service', () => {
  let scalingService;
  let originalEnv;
  
  // Setup before each test
  beforeEach(() => {
    // Save original environment variables
    originalEnv = { ...process.env };
    
    // Set environment variables for testing
    process.env.SCALING_ENABLED = 'true';
    process.env.AUTO_SCALING_ENABLED = 'true';
    process.env.MIN_INSTANCES = '1';
    process.env.MAX_INSTANCES = '4';
    process.env.SCALE_UP_THRESHOLD = '70';
    process.env.SCALE_DOWN_THRESHOLD = '30';
    process.env.METRICS_INTERVAL = '5000';
    process.env.SCALING_INTERVAL = '10000';
    
    // Mock OS methods
    os.cpus.mockReturnValue(Array(4).fill({}));
    os.loadavg.mockReturnValue([1.5, 1.2, 1.0]);
    os.totalmem.mockReturnValue(8 * 1024 * 1024 * 1024); // 8GB
    os.freemem.mockReturnValue(4 * 1024 * 1024 * 1024); // 4GB
    
    // Mock cluster methods
    cluster.getWorkerCount.mockReturnValue(2);
    cluster.fork.mockImplementation(() => {});
    cluster.terminateWorker.mockImplementation(() => {});
    
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create scaling service instance
    scalingService = new ScalingService();
  });
  
  // Restore original environment after each test
  afterEach(() => {
    process.env = originalEnv;
  });
  
  // Test initialization
  describe('initialization', () => {
    it('should initialize with correct configuration from environment variables', () => {
      // Assert
      expect(scalingService.config).toEqual({
        enabled: true,
        autoScalingEnabled: true,
        minInstances: 1,
        maxInstances: 4,
        scaleUpThreshold: 70,
        scaleDownThreshold: 30,
        metricsInterval: 5000,
        scalingInterval: 10000,
        cooldownPeriod: 60000, // Default value
        requestsWindowSize: 60, // Default value
        responseTimeWindowSize: 60 // Default value
      });
    });
    
    it('should use default values if environment variables are not set', () => {
      // Arrange
      delete process.env.SCALING_ENABLED;
      delete process.env.AUTO_SCALING_ENABLED;
      delete process.env.MIN_INSTANCES;
      delete process.env.MAX_INSTANCES;
      delete process.env.SCALE_UP_THRESHOLD;
      delete process.env.SCALE_DOWN_THRESHOLD;
      delete process.env.METRICS_INTERVAL;
      delete process.env.SCALING_INTERVAL;
      
      // Act
      const service = new ScalingService();
      
      // Assert
      expect(service.config).toEqual({
        enabled: false, // Default is false
        autoScalingEnabled: false, // Default is false
        minInstances: 1, // Default is 1
        maxInstances: os.cpus().length, // Default is number of CPUs
        scaleUpThreshold: 70, // Default is 70
        scaleDownThreshold: 30, // Default is 30
        metricsInterval: 5000, // Default is 5000
        scalingInterval: 30000, // Default is 30000
        cooldownPeriod: 60000, // Default is 60000
        requestsWindowSize: 60, // Default is 60
        responseTimeWindowSize: 60 // Default is 60
      });
    });
  });
  
  // Test starting the service
  describe('start', () => {
    it('should start metrics collection and auto-scaling if enabled', () => {
      // Arrange
      const collectMetricsSpy = sinon.spy(scalingService, 'collectMetrics');
      const evaluateScalingSpy = sinon.spy(scalingService, 'evaluateScaling');
      
      // Act
      scalingService.start();
      
      // Assert
      expect(collectMetricsSpy.calledOnce).toBe(true);
      expect(evaluateScalingSpy.calledOnce).toBe(true);
      expect(scalingService.metricsInterval).toBeDefined();
      expect(scalingService.scalingInterval).toBeDefined();
      
      // Clean up
      collectMetricsSpy.restore();
      evaluateScalingSpy.restore();
      scalingService.stop();
    });
    
    it('should not start auto-scaling if disabled', () => {
      // Arrange
      process.env.AUTO_SCALING_ENABLED = 'false';
      const service = new ScalingService();
      const collectMetricsSpy = sinon.spy(service, 'collectMetrics');
      const evaluateScalingSpy = sinon.spy(service, 'evaluateScaling');
      
      // Act
      service.start();
      
      // Assert
      expect(collectMetricsSpy.calledOnce).toBe(true);
      expect(evaluateScalingSpy.called).toBe(false);
      expect(service.metricsInterval).toBeDefined();
      expect(service.scalingInterval).toBeUndefined();
      
      // Clean up
      collectMetricsSpy.restore();
      evaluateScalingSpy.restore();
      service.stop();
    });
    
    it('should not start metrics collection if scaling is disabled', () => {
      // Arrange
      process.env.SCALING_ENABLED = 'false';
      const service = new ScalingService();
      const collectMetricsSpy = sinon.spy(service, 'collectMetrics');
      
      // Act
      service.start();
      
      // Assert
      expect(collectMetricsSpy.called).toBe(false);
      expect(service.metricsInterval).toBeUndefined();
      
      // Clean up
      collectMetricsSpy.restore();
    });
  });
  
  // Test collecting metrics
  describe('collectMetrics', () => {
    it('should collect system metrics correctly', () => {
      // Act
      scalingService.collectMetrics();
      
      // Assert
      expect(scalingService.metrics.cpu).toBeDefined();
      expect(scalingService.metrics.memory).toBeDefined();
      expect(os.loadavg).toHaveBeenCalled();
      expect(os.totalmem).toHaveBeenCalled();
      expect(os.freemem).toHaveBeenCalled();
    });
    
    it('should calculate CPU usage correctly', () => {
      // Arrange
      os.loadavg.mockReturnValue([2.0, 1.5, 1.0]);
      const cpuCount = 4;
      os.cpus.mockReturnValue(Array(cpuCount).fill({}));
      
      // Act
      scalingService.collectMetrics();
      
      // Assert
      // CPU usage should be (load average / CPU count) * 100
      expect(scalingService.metrics.cpu.usage).toBe((2.0 / cpuCount) * 100);
    });
    
    it('should calculate memory usage correctly', () => {
      // Arrange
      const totalMem = 8 * 1024 * 1024 * 1024; // 8GB
      const freeMem = 2 * 1024 * 1024 * 1024; // 2GB
      os.totalmem.mockReturnValue(totalMem);
      os.freemem.mockReturnValue(freeMem);
      
      // Act
      scalingService.collectMetrics();
      
      // Assert
      // Memory usage should be ((total - free) / total) * 100
      expect(scalingService.metrics.memory.usage).toBe(((totalMem - freeMem) / totalMem) * 100);
    });
  });
  
  // Test scaling evaluation
  describe('evaluateScaling', () => {
    it('should scale up when CPU usage exceeds threshold', () => {
      // Arrange
      scalingService.metrics.cpu = { usage: 80 }; // Above scale-up threshold (70)
      scalingService.metrics.memory = { usage: 60 };
      
      // Act
      scalingService.evaluateScaling();
      
      // Assert
      expect(cluster.fork).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Scaling up'));
    });
    
    it('should scale down when CPU usage is below threshold', () => {
      // Arrange
      scalingService.metrics.cpu = { usage: 20 }; // Below scale-down threshold (30)
      scalingService.metrics.memory = { usage: 25 };
      cluster.getWorkerCount.mockReturnValue(3); // More than minInstances
      
      // Act
      scalingService.evaluateScaling();
      
      // Assert
      expect(cluster.terminateWorker).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Scaling down'));
    });
    
    it('should not scale up beyond maxInstances', () => {
      // Arrange
      scalingService.metrics.cpu = { usage: 90 }; // Above scale-up threshold
      scalingService.metrics.memory = { usage: 80 };
      cluster.getWorkerCount.mockReturnValue(4); // Equal to maxInstances
      
      // Act
      scalingService.evaluateScaling();
      
      // Assert
      expect(cluster.fork).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Already at maximum'));
    });
    
    it('should not scale down below minInstances', () => {
      // Arrange
      scalingService.metrics.cpu = { usage: 10 }; // Below scale-down threshold
      scalingService.metrics.memory = { usage: 15 };
      cluster.getWorkerCount.mockReturnValue(1); // Equal to minInstances
      
      // Act
      scalingService.evaluateScaling();
      
      // Assert
      expect(cluster.terminateWorker).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Already at minimum'));
    });
    
    it('should respect cooldown period after scaling', () => {
      // Arrange
      scalingService.metrics.cpu = { usage: 80 }; // Above scale-up threshold
      scalingService.metrics.memory = { usage: 70 };
      scalingService.lastScalingAction = Date.now() - 30000; // 30 seconds ago (less than cooldown)
      
      // Act
      scalingService.evaluateScaling();
      
      // Assert
      expect(cluster.fork).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Cooldown period'));
    });
  });
  
  // Test getting metrics
  describe('getMetrics', () => {
    it('should return current metrics', () => {
      // Arrange
      scalingService.metrics = {
        cpu: { usage: 50, load: 2.0 },
        memory: { usage: 60, total: 8000, free: 3200 },
        requests: { rate: 100, total: 5000 },
        responseTime: { average: 150, max: 500 }
      };
      
      // Act
      const metrics = scalingService.getMetrics();
      
      // Assert
      expect(metrics).toEqual(scalingService.metrics);
    });
  });
  
  // Test getting configuration
  describe('getConfig', () => {
    it('should return current configuration', () => {
      // Act
      const config = scalingService.getConfig();
      
      // Assert
      expect(config).toEqual(scalingService.config);
    });
  });
  
  // Test updating configuration
  describe('updateConfig', () => {
    it('should update configuration with valid values', () => {
      // Arrange
      const newConfig = {
        minInstances: 2,
        maxInstances: 6,
        scaleUpThreshold: 80,
        scaleDownThreshold: 20
      };
      
      // Act
      scalingService.updateConfig(newConfig);
      
      // Assert
      expect(scalingService.config.minInstances).toBe(2);
      expect(scalingService.config.maxInstances).toBe(6);
      expect(scalingService.config.scaleUpThreshold).toBe(80);
      expect(scalingService.config.scaleDownThreshold).toBe(20);
    });
    
    it('should validate configuration values', () => {
      // Arrange
      const invalidConfig = {
        minInstances: 0, // Invalid: must be at least 1
        maxInstances: 10, // Valid
        scaleUpThreshold: 110, // Invalid: must be <= 100
        scaleDownThreshold: -10 // Invalid: must be >= 0
      };
      
      // Act & Assert
      expect(() => scalingService.updateConfig(invalidConfig)).toThrow();
      
      // Configuration should remain unchanged
      expect(scalingService.config.minInstances).toBe(1);
      expect(scalingService.config.maxInstances).toBe(4);
      expect(scalingService.config.scaleUpThreshold).toBe(70);
      expect(scalingService.config.scaleDownThreshold).toBe(30);
    });
    
    it('should ensure minInstances <= maxInstances', () => {
      // Arrange
      const invalidConfig = {
        minInstances: 5,
        maxInstances: 3
      };
      
      // Act & Assert
      expect(() => scalingService.updateConfig(invalidConfig)).toThrow();
      
      // Configuration should remain unchanged
      expect(scalingService.config.minInstances).toBe(1);
      expect(scalingService.config.maxInstances).toBe(4);
    });
  });
  
  // Test stopping the service
  describe('stop', () => {
    it('should stop metrics collection and auto-scaling', () => {
      // Arrange
      scalingService.start();
      expect(scalingService.metricsInterval).toBeDefined();
      expect(scalingService.scalingInterval).toBeDefined();
      
      // Act
      scalingService.stop();
      
      // Assert
      expect(scalingService.metricsInterval).toBeNull();
      expect(scalingService.scalingInterval).toBeNull();
    });
  });
});
