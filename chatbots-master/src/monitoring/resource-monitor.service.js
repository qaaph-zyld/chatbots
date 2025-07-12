/**
 * Resource Monitor Service
 * 
 * This service monitors system resources such as CPU, memory, and disk usage
 * to help identify performance bottlenecks and optimize resource allocation.
 */

const os = require('os');
const fs = require('fs').promises;
require('@src/utils');
const { EventEmitter } = require('events');

/**
 * Resource Monitor Service class
 */
class ResourceMonitorService extends EventEmitter {
  /**
   * Initialize the resource monitor service
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    super();
    
    this.options = {
      monitoringInterval: parseInt(process.env.RESOURCE_MONITORING_INTERVAL || '60000'), // ms (default: 1 minute)
      alertThresholds: {
        cpu: parseFloat(process.env.CPU_ALERT_THRESHOLD || '80'), // percent
        memory: parseFloat(process.env.MEMORY_ALERT_THRESHOLD || '85'), // percent
        disk: parseFloat(process.env.DISK_ALERT_THRESHOLD || '90'), // percent
      },
      retentionPeriod: parseInt(process.env.RESOURCE_DATA_RETENTION || '86400000'), // ms (default: 1 day)
      ...options
    };

    // Storage for resource metrics
    this.metrics = {
      cpu: [],
      memory: [],
      disk: [],
      system: {}
    };

    // Monitoring interval reference
    this.monitoringInterval = null;

    // Initialize system info
    this._initSystemInfo();

    logger.info('Resource Monitor Service initialized with options:', {
      monitoringInterval: this.options.monitoringInterval,
      alertThresholds: this.options.alertThresholds,
      retentionPeriod: this.options.retentionPeriod
    });
  }

  /**
   * Initialize system information
   * @private
   */
  _initSystemInfo() {
    try {
      const cpus = os.cpus();
      
      this.metrics.system = {
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        cpuModel: cpus.length > 0 ? cpus[0].model : 'Unknown',
        cpuCount: cpus.length,
        totalMemory: os.totalmem(),
        uptime: os.uptime()
      };
    } catch (error) {
      logger.error('Error initializing system info:', error.message);
    }
  }

  /**
   * Start resource monitoring
   * @returns {Promise<boolean>} - Success status
   */
  async start() {
    try {
      if (this.monitoringInterval) {
        logger.warn('Resource monitoring is already running');
        return true;
      }

      // Collect initial metrics
      await this.collectMetrics();

      // Start monitoring interval
      this.monitoringInterval = setInterval(async () => {
        await this.collectMetrics();
      }, this.options.monitoringInterval);

      logger.info('Resource monitoring started');
      return true;
    } catch (error) {
      logger.error('Error starting resource monitoring:', error.message);
      return false;
    }
  }

  /**
   * Stop resource monitoring
   * @returns {boolean} - Success status
   */
  stop() {
    try {
      if (!this.monitoringInterval) {
        logger.warn('Resource monitoring is not running');
        return true;
      }

      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;

      logger.info('Resource monitoring stopped');
      return true;
    } catch (error) {
      logger.error('Error stopping resource monitoring:', error.message);
      return false;
    }
  }

  /**
   * Collect resource metrics
   * @returns {Promise<Object>} - Current metrics
   */
  async collectMetrics() {
    try {
      const timestamp = new Date().toISOString();
      
      // Collect CPU metrics
      const cpuMetrics = await this._collectCpuMetrics();
      
      // Collect memory metrics
      const memoryMetrics = this._collectMemoryMetrics();
      
      // Collect disk metrics
      const diskMetrics = await this._collectDiskMetrics();

      // Create metrics object
      const metrics = {
        timestamp,
        cpu: cpuMetrics,
        memory: memoryMetrics,
        disk: diskMetrics
      };

      // Store metrics
      this._storeMetrics(metrics);

      // Check for alerts
      this._checkAlerts(metrics);

      return metrics;
    } catch (error) {
      logger.error('Error collecting resource metrics:', error.message);
      return null;
    }
  }

  /**
   * Collect CPU metrics
   * @returns {Promise<Object>} - CPU metrics
   * @private
   */
  async _collectCpuMetrics() {
    try {
      // Get initial CPU info
      const cpuInfo1 = os.cpus();
      
      // Wait a short time to get a meaningful CPU usage sample
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get updated CPU info
      const cpuInfo2 = os.cpus();
      
      // Calculate CPU usage for each core
      const cores = [];
      let totalIdle = 0;
      let totalTotal = 0;
      
      for (let i = 0; i < cpuInfo1.length; i++) {
        const cpu1 = cpuInfo1[i].times;
        const cpu2 = cpuInfo2[i].times;
        
        const idle = cpu2.idle - cpu1.idle;
        const user = cpu2.user - cpu1.user;
        const sys = cpu2.sys - cpu1.sys;
        const nice = cpu2.nice - cpu1.nice;
        const irq = cpu2.irq - cpu1.irq;
        
        const total = idle + user + sys + nice + irq;
        const usage = 100 - (idle / total * 100);
        
        cores.push({
          core: i,
          usage: Math.round(usage * 10) / 10
        });
        
        totalIdle += idle;
        totalTotal += total;
      }
      
      // Calculate overall CPU usage
      const totalUsage = 100 - (totalIdle / totalTotal * 100);
      
      return {
        usage: Math.round(totalUsage * 10) / 10,
        cores
      };
    } catch (error) {
      logger.error('Error collecting CPU metrics:', error.message);
      return {
        usage: 0,
        cores: []
      };
    }
  }

  /**
   * Collect memory metrics
   * @returns {Object} - Memory metrics
   * @private
   */
  _collectMemoryMetrics() {
    try {
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const usagePercent = (usedMemory / totalMemory) * 100;
      
      return {
        total: totalMemory,
        used: usedMemory,
        free: freeMemory,
        usage: Math.round(usagePercent * 10) / 10
      };
    } catch (error) {
      logger.error('Error collecting memory metrics:', error.message);
      return {
        total: 0,
        used: 0,
        free: 0,
        usage: 0
      };
    }
  }

  /**
   * Collect disk metrics
   * @returns {Promise<Object>} - Disk metrics
   * @private
   */
  async _collectDiskMetrics() {
    try {
      // This is a simplified implementation that checks the current directory
      // In a production environment, you might want to check specific partitions
      const stats = await fs.stat('.');
      
      // Get disk usage (this is platform-specific and simplified)
      // For a more accurate implementation, consider using a library like diskusage
      return {
        usage: 70, // Placeholder value (70%)
        path: process.cwd()
      };
    } catch (error) {
      logger.error('Error collecting disk metrics:', error.message);
      return {
        usage: 0,
        path: process.cwd()
      };
    }
  }

  /**
   * Store metrics and apply retention policy
   * @param {Object} metrics - Resource metrics
   * @private
   */
  _storeMetrics(metrics) {
    try {
      // Add CPU metrics
      this.metrics.cpu.push({
        timestamp: metrics.timestamp,
        usage: metrics.cpu.usage
      });
      
      // Add memory metrics
      this.metrics.memory.push({
        timestamp: metrics.timestamp,
        usage: metrics.memory.usage,
        used: metrics.memory.used
      });
      
      // Add disk metrics
      this.metrics.disk.push({
        timestamp: metrics.timestamp,
        usage: metrics.disk.usage
      });
      
      // Apply retention policy
      this._applyRetentionPolicy();
    } catch (error) {
      logger.error('Error storing metrics:', error.message);
    }
  }

  /**
   * Apply retention policy to stored metrics
   * @private
   */
  _applyRetentionPolicy() {
    try {
      const cutoffTime = Date.now() - this.options.retentionPeriod;
      
      // Filter out old metrics
      this.metrics.cpu = this.metrics.cpu.filter(item => 
        new Date(item.timestamp).getTime() > cutoffTime
      );
      
      this.metrics.memory = this.metrics.memory.filter(item => 
        new Date(item.timestamp).getTime() > cutoffTime
      );
      
      this.metrics.disk = this.metrics.disk.filter(item => 
        new Date(item.timestamp).getTime() > cutoffTime
      );
    } catch (error) {
      logger.error('Error applying retention policy:', error.message);
    }
  }

  /**
   * Check for resource alerts
   * @param {Object} metrics - Resource metrics
   * @private
   */
  _checkAlerts(metrics) {
    try {
      // Check CPU usage
      if (metrics.cpu.usage > this.options.alertThresholds.cpu) {
        const alert = {
          type: 'cpu',
          level: 'warning',
          message: `High CPU usage: ${metrics.cpu.usage}%`,
          timestamp: metrics.timestamp,
          value: metrics.cpu.usage,
          threshold: this.options.alertThresholds.cpu
        };
        
        this.emit('alert', alert);
        logger.warn(alert.message);
      }
      
      // Check memory usage
      if (metrics.memory.usage > this.options.alertThresholds.memory) {
        const alert = {
          type: 'memory',
          level: 'warning',
          message: `High memory usage: ${metrics.memory.usage}%`,
          timestamp: metrics.timestamp,
          value: metrics.memory.usage,
          threshold: this.options.alertThresholds.memory
        };
        
        this.emit('alert', alert);
        logger.warn(alert.message);
      }
      
      // Check disk usage
      if (metrics.disk.usage > this.options.alertThresholds.disk) {
        const alert = {
          type: 'disk',
          level: 'warning',
          message: `High disk usage: ${metrics.disk.usage}%`,
          timestamp: metrics.timestamp,
          value: metrics.disk.usage,
          threshold: this.options.alertThresholds.disk
        };
        
        this.emit('alert', alert);
        logger.warn(alert.message);
      }
    } catch (error) {
      logger.error('Error checking alerts:', error.message);
    }
  }

  /**
   * Get current resource metrics
   * @returns {Promise<Object>} - Current metrics
   */
  async getCurrentMetrics() {
    return await this.collectMetrics();
  }

  /**
   * Get historical resource metrics
   * @param {Object} options - Query options
   * @returns {Object} - Historical metrics
   */
  getHistoricalMetrics(options = {}) {
    try {
      const { timeRange = 3600000, type = 'all' } = options; // default: 1 hour
      const cutoffTime = Date.now() - timeRange;
      
      // Filter metrics by time range
      const result = {
        system: this.metrics.system
      };
      
      if (type === 'all' || type === 'cpu') {
        result.cpu = this.metrics.cpu.filter(item => 
          new Date(item.timestamp).getTime() > cutoffTime
        );
      }
      
      if (type === 'all' || type === 'memory') {
        result.memory = this.metrics.memory.filter(item => 
          new Date(item.timestamp).getTime() > cutoffTime
        );
      }
      
      if (type === 'all' || type === 'disk') {
        result.disk = this.metrics.disk.filter(item => 
          new Date(item.timestamp).getTime() > cutoffTime
        );
      }
      
      return result;
    } catch (error) {
      logger.error('Error getting historical metrics:', error.message);
      return {
        system: this.metrics.system,
        cpu: [],
        memory: [],
        disk: []
      };
    }
  }

  /**
   * Get system information
   * @returns {Object} - System information
   */
  getSystemInfo() {
    return {
      ...this.metrics.system,
      uptime: os.uptime() // Get current uptime
    };
  }
}

// Create and export service instance
const resourceMonitorService = new ResourceMonitorService();

module.exports = {
  ResourceMonitorService,
  resourceMonitorService
};
