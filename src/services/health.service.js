/**
 * Health Check Service
 * 
 * Provides functionality to check the health of various system components
 * including database connections, external services, and system resources.
 */

const mongoose = require('mongoose');
const redis = require('redis');
const axios = require('axios');
const os = require('os');

class HealthService {
  /**
   * Check the overall system health
   * @returns {Promise<Object>} Health status of all components
   */
  async checkSystemHealth() {
    const [databaseStatus, cacheStatus, externalServicesStatus, systemResourcesStatus] = await Promise.all([
      this.checkDatabaseConnection(),
      this.checkCacheConnection(),
      this.checkExternalServices(),
      this.checkSystemResources()
    ]);

    const isHealthy = (
      databaseStatus.status === 'healthy' &&
      cacheStatus.status === 'healthy' &&
      externalServicesStatus.every(service => service.status === 'healthy') &&
      systemResourcesStatus.status === 'healthy'
    );

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      components: {
        database: databaseStatus,
        cache: cacheStatus,
        externalServices: externalServicesStatus,
        systemResources: systemResourcesStatus
      }
    };
  }

  /**
   * Check database connection health
   * @returns {Promise<Object>} Database connection status
   */
  async checkDatabaseConnection() {
    try {
      if (mongoose.connection.readyState !== 1) {
        return {
          status: 'unhealthy',
          message: 'Database connection is not established',
          details: { readyState: mongoose.connection.readyState }
        };
      }

      // Test a simple query to verify database responsiveness
      const startTime = Date.now();
      await mongoose.connection.db.admin().ping();
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        details: {
          host: mongoose.connection.host,
          port: mongoose.connection.port,
          name: mongoose.connection.name
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Database connection error',
        error: error.message,
        details: { readyState: mongoose.connection.readyState }
      };
    }
  }

  /**
   * Check cache connection health
   * @returns {Promise<Object>} Cache connection status
   */
  async checkCacheConnection() {
    try {
      // Assuming a redis client is available or can be created
      const redisClient = redis.createClient();
      
      // Connect if not connected
      if (!redisClient.isReady) {
        await redisClient.connect();
      }

      const startTime = Date.now();
      await redisClient.ping();
      const responseTime = Date.now() - startTime;

      // Disconnect if we created a new client
      if (redisClient.isReady) {
        await redisClient.quit();
      }

      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        details: {
          host: redisClient.options?.socket?.host || 'localhost',
          port: redisClient.options?.socket?.port || 6379
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Cache connection error',
        error: error.message
      };
    }
  }

  /**
   * Check external services health
   * @returns {Promise<Array>} Status of external services
   */
  async checkExternalServices() {
    // Define external services to check
    const services = [
      { name: 'payment-gateway', url: process.env.PAYMENT_GATEWAY_URL || 'https://api.stripe.com/v1/health' },
      { name: 'email-service', url: process.env.EMAIL_SERVICE_URL || 'https://api.sendgrid.com/v3/health' },
      { name: 'vector-database', url: process.env.VECTOR_DB_URL || 'http://weaviate:8080/v1/meta' }
    ];

    // Check each service
    const results = await Promise.all(
      services.map(async (service) => {
        try {
          const startTime = Date.now();
          const response = await axios.get(service.url, { timeout: 5000 });
          const responseTime = Date.now() - startTime;

          return {
            name: service.name,
            status: response.status >= 200 && response.status < 300 ? 'healthy' : 'unhealthy',
            responseTime: `${responseTime}ms`,
            statusCode: response.status
          };
        } catch (error) {
          return {
            name: service.name,
            status: 'unhealthy',
            error: error.message
          };
        }
      })
    );

    return results;
  }

  /**
   * Check system resources
   * @returns {Object} System resources status
   */
  checkSystemResources() {
    try {
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemoryPercentage = ((totalMemory - freeMemory) / totalMemory) * 100;

      const cpuLoad = os.loadavg()[0]; // 1 minute load average
      const cpuCount = os.cpus().length;
      const normalizedCpuLoad = (cpuLoad / cpuCount) * 100; // Normalize to percentage

      const diskSpace = { free: 'N/A', total: 'N/A', used: 'N/A' }; // Would require additional library to check

      // Define thresholds
      const memoryThreshold = 90; // 90% memory usage
      const cpuThreshold = 80; // 80% CPU usage

      const isHealthy = usedMemoryPercentage < memoryThreshold && normalizedCpuLoad < cpuThreshold;

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        details: {
          memory: {
            total: `${Math.round(totalMemory / 1024 / 1024)} MB`,
            free: `${Math.round(freeMemory / 1024 / 1024)} MB`,
            used: `${Math.round(usedMemoryPercentage)}%`,
            threshold: `${memoryThreshold}%`
          },
          cpu: {
            count: cpuCount,
            loadAverage: cpuLoad.toFixed(2),
            normalizedUsage: `${Math.round(normalizedCpuLoad)}%`,
            threshold: `${cpuThreshold}%`
          },
          disk: diskSpace,
          uptime: `${Math.floor(os.uptime() / 3600)} hours`,
          hostname: os.hostname()
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Error checking system resources',
        error: error.message
      };
    }
  }
}

module.exports = new HealthService();
