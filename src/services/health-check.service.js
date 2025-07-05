/**
 * Health Check Service
 * 
 * Provides functionality to check the health of various system components
 */

const mongoose = require('mongoose');
const redis = require('redis');
const os = require('os');
const config = require('@core/config');
const alertService = require('./alert.service');

class HealthCheckService {
  constructor() {
    this.checkIntervalMs = 60000; // 1 minute
    this.checkInterval = null;
    this.externalServices = [];
  }

  /**
   * Initialize the health check service
   * @param {Object} options - Configuration options
   */
  initialize(options = {}) {
    if (options.checkIntervalMs) {
      this.checkIntervalMs = options.checkIntervalMs;
    }

    // Register external services to check
    if (options.externalServices) {
      this.externalServices = options.externalServices;
    }

    // Start periodic health checks if enabled
    if (options.enablePeriodicChecks) {
      this.startPeriodicChecks();
    }

    console.log('Health check service initialized');
  }

  /**
   * Start periodic health checks
   */
  startPeriodicChecks() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(async () => {
      try {
        const health = await this.checkHealth();
        
        // Check for unhealthy components
        const unhealthyComponents = [];
        
        if (health.components.database.status === 'unhealthy') {
          unhealthyComponents.push('database');
        }
        
        if (health.components.cache.status === 'unhealthy') {
          unhealthyComponents.push('cache');
        }
        
        if (health.components.externalServices.status === 'unhealthy') {
          const unhealthyServices = health.components.externalServices.services
            .filter(service => service.status === 'unhealthy')
            .map(service => service.name);
          
          unhealthyComponents.push(...unhealthyServices);
        }
        
        if (health.components.systemResources.status === 'unhealthy') {
          unhealthyComponents.push('systemResources');
        }
        
        // Create alerts for unhealthy components
        if (unhealthyComponents.length > 0) {
          await alertService.createAlert({
            level: 'warning',
            source: 'health-check',
            message: `Unhealthy components detected: ${unhealthyComponents.join(', ')}`,
            details: health
          });
        }
      } catch (error) {
        console.error('Error during periodic health check:', error);
        
        await alertService.createAlert({
          level: 'critical',
          source: 'health-check',
          message: 'Failed to perform health check',
          details: { error: error.message, stack: error.stack }
        });
      }
    }, this.checkIntervalMs);
    
    console.log(`Started periodic health checks (interval: ${this.checkIntervalMs}ms)`);
  }

  /**
   * Stop periodic health checks
   */
  stopPeriodicChecks() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('Stopped periodic health checks');
    }
  }

  /**
   * Check the health of all system components
   * @returns {Promise<Object>} Health status of all components
   */
  async checkHealth() {
    const [database, cache, externalServices, systemResources] = await Promise.all([
      this.checkDatabaseHealth(),
      this.checkCacheHealth(),
      this.checkExternalServicesHealth(),
      this.checkSystemResourcesHealth()
    ]);

    const status = (
      database.status === 'healthy' &&
      cache.status === 'healthy' &&
      externalServices.status === 'healthy' &&
      systemResources.status === 'healthy'
    ) ? 'healthy' : 'unhealthy';

    return {
      status,
      timestamp: new Date().toISOString(),
      components: {
        database,
        cache,
        externalServices,
        systemResources
      }
    };
  }

  /**
   * Check the health of a specific component
   * @param {string} component - Component name (database, cache, external-services, system-resources)
   * @returns {Promise<Object>} Health status of the specified component
   */
  async checkComponentHealth(component) {
    switch (component) {
      case 'database':
        return this.checkDatabaseHealth();
      case 'cache':
        return this.checkCacheHealth();
      case 'external-services':
        return this.checkExternalServicesHealth();
      case 'system-resources':
        return this.checkSystemResourcesHealth();
      default:
        throw new Error(`Unknown component: ${component}`);
    }
  }

  /**
   * Check database health
   * @returns {Promise<Object>} Database health status
   */
  async checkDatabaseHealth() {
    const startTime = Date.now();
    let status = 'healthy';
    let error = null;

    try {
      if (mongoose.connection.readyState !== 1) {
        status = 'unhealthy';
        error = 'Database not connected';
      } else {
        // Perform a simple query to verify database responsiveness
        await mongoose.connection.db.admin().ping();
      }
    } catch (err) {
      status = 'unhealthy';
      error = err.message;
    }

    const responseTime = `${Date.now() - startTime}ms`;

    return {
      status,
      responseTime,
      details: {
        connectionState: mongoose.connection.readyState,
        error
      }
    };
  }

  /**
   * Check cache health
   * @returns {Promise<Object>} Cache health status
   */
  async checkCacheHealth() {
    const startTime = Date.now();
    let status = 'healthy';
    let error = null;

    try {
      if (!config.cache || !config.cache.enabled) {
        return {
          status: 'not-configured',
          responseTime: '0ms',
          details: {
            error: 'Cache not configured'
          }
        };
      }

      // Create a temporary Redis client
      const client = redis.createClient({
        url: config.cache.redisUrl || 'redis://localhost:6379'
      });

      await client.connect();
      await client.ping();
      await client.quit();
    } catch (err) {
      status = 'unhealthy';
      error = err.message;
    }

    const responseTime = `${Date.now() - startTime}ms`;

    return {
      status,
      responseTime,
      details: {
        error
      }
    };
  }

  /**
   * Check external services health
   * @returns {Promise<Object>} External services health status
   */
  async checkExternalServicesHealth() {
    const startTime = Date.now();
    const services = [];
    let overallStatus = 'healthy';

    try {
      // Check each registered external service
      for (const service of this.externalServices) {
        const serviceStartTime = Date.now();
        let serviceStatus = 'healthy';
        let serviceError = null;

        try {
          const response = await fetch(service.url, {
            method: service.method || 'GET',
            headers: service.headers || {},
            timeout: service.timeout || 5000
          });

          if (!response.ok) {
            serviceStatus = 'unhealthy';
            serviceError = `HTTP ${response.status}: ${response.statusText}`;
          }
        } catch (err) {
          serviceStatus = 'unhealthy';
          serviceError = err.message;
        }

        if (serviceStatus === 'unhealthy') {
          overallStatus = 'unhealthy';
        }

        services.push({
          name: service.name,
          status: serviceStatus,
          responseTime: `${Date.now() - serviceStartTime}ms`,
          error: serviceError
        });
      }
    } catch (err) {
      overallStatus = 'unhealthy';
    }

    const responseTime = `${Date.now() - startTime}ms`;

    return {
      status: overallStatus,
      responseTime,
      services
    };
  }

  /**
   * Check system resources health
   * @returns {Promise<Object>} System resources health status
   */
  async checkSystemResourcesHealth() {
    const startTime = Date.now();
    let status = 'healthy';
    const warnings = [];

    try {
      // Check CPU load
      const cpuLoad = os.loadavg()[0] / os.cpus().length;
      if (cpuLoad > 0.8) { // 80% threshold
        status = 'unhealthy';
        warnings.push(`High CPU load: ${(cpuLoad * 100).toFixed(1)}%`);
      }

      // Check memory usage
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const memoryUsage = (totalMemory - freeMemory) / totalMemory;
      if (memoryUsage > 0.9) { // 90% threshold
        status = 'unhealthy';
        warnings.push(`High memory usage: ${(memoryUsage * 100).toFixed(1)}%`);
      }

      // Check disk space (simplified, would need a more robust solution for production)
      // This is a placeholder for actual disk space checking
      const diskSpaceCheck = true;
      if (!diskSpaceCheck) {
        status = 'unhealthy';
        warnings.push('Low disk space');
      }
    } catch (err) {
      status = 'unhealthy';
      warnings.push(err.message);
    }

    const responseTime = `${Date.now() - startTime}ms`;

    return {
      status,
      responseTime,
      details: {
        cpuLoad: os.loadavg()[0] / os.cpus().length,
        memoryUsage: 1 - (os.freemem() / os.totalmem()),
        uptime: os.uptime(),
        warnings
      }
    };
  }

  /**
   * Check liveness (simple check for kubernetes)
   * @returns {Promise<Object>} Liveness status
   */
  async checkLiveness() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check readiness (checks if the application is ready to serve requests)
   * @returns {Promise<Object>} Readiness status
   */
  async checkReadiness() {
    // For readiness, we only check database and cache
    const [database, cache] = await Promise.all([
      this.checkDatabaseHealth(),
      this.checkCacheHealth()
    ]);

    const status = (
      database.status === 'healthy' &&
      (cache.status === 'healthy' || cache.status === 'not-configured')
    ) ? 'healthy' : 'unhealthy';

    return {
      status,
      timestamp: new Date().toISOString(),
      components: {
        database,
        cache
      }
    };
  }
}

module.exports = new HealthCheckService();
