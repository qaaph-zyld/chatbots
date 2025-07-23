const express = require('express');
const mongoose = require('mongoose');
const { logger } = require('../middleware/errorHandler');

const router = express.Router();

// Basic health check
router.get('/', (req, res) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  };

  res.status(200).json(healthCheck);
});

// Detailed health check with dependencies
router.get('/detailed', async (req, res) => {
  const startTime = Date.now();
  
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    checks: {}
  };

  // Database health check
  try {
    const dbState = mongoose.connection.readyState;
    const dbStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    healthCheck.checks.database = {
      status: dbState === 1 ? 'healthy' : 'unhealthy',
      state: dbStates[dbState],
      host: mongoose.connection.host,
      name: mongoose.connection.name
    };

    if (dbState === 1) {
      // Test database query
      const dbPing = await mongoose.connection.db.admin().ping();
      healthCheck.checks.database.ping = dbPing.ok === 1 ? 'success' : 'failed';
    }
  } catch (error) {
    healthCheck.checks.database = {
      status: 'unhealthy',
      error: error.message
    };
    healthCheck.status = 'degraded';
  }

  // Memory health check
  const memoryUsage = process.memoryUsage();
  const memoryHealthy = memoryUsage.heapUsed < (500 * 1024 * 1024); // 500MB threshold
  
  healthCheck.checks.memory = {
    status: memoryHealthy ? 'healthy' : 'warning',
    usage: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`
    }
  };

  if (!memoryHealthy) {
    healthCheck.status = 'degraded';
  }

  // Disk space check (simulated)
  const diskUsagePercent = Math.random() * 100; // In real app, use actual disk usage
  const diskHealthy = diskUsagePercent < 85; // 85% threshold
  
  healthCheck.checks.disk = {
    status: diskHealthy ? 'healthy' : 'warning',
    usage: `${diskUsagePercent.toFixed(1)}%`
  };

  if (!diskHealthy) {
    healthCheck.status = 'degraded';
  }

  // External services health check (simulated)
  const externalServices = ['shopify-api', 'woocommerce-api', 'payment-gateway'];
  healthCheck.checks.external_services = {};

  for (const service of externalServices) {
    try {
      // Simulate external service check
      const serviceHealthy = Math.random() > 0.1; // 90% success rate
      const responseTime = Math.floor(Math.random() * 500) + 50; // 50-550ms
      
      healthCheck.checks.external_services[service] = {
        status: serviceHealthy ? 'healthy' : 'unhealthy',
        response_time: `${responseTime}ms`,
        last_check: new Date().toISOString()
      };

      if (!serviceHealthy) {
        healthCheck.status = 'degraded';
      }
    } catch (error) {
      healthCheck.checks.external_services[service] = {
        status: 'unhealthy',
        error: error.message
      };
      healthCheck.status = 'degraded';
    }
  }

  // Response time
  healthCheck.response_time = `${Date.now() - startTime}ms`;

  // Set appropriate status code
  const statusCode = healthCheck.status === 'healthy' ? 200 : 
                    healthCheck.status === 'degraded' ? 200 : 503;

  res.status(statusCode).json(healthCheck);
});

// Readiness probe
router.get('/ready', async (req, res) => {
  try {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        status: 'not ready',
        reason: 'Database not connected',
        timestamp: new Date().toISOString()
      });
    }

    // Check if critical services are available
    const criticalChecks = {
      database: mongoose.connection.readyState === 1,
      memory: process.memoryUsage().heapUsed < (1024 * 1024 * 1024) // 1GB threshold
    };

    const allReady = Object.values(criticalChecks).every(check => check);

    if (allReady) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks: criticalChecks
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        checks: criticalChecks
      });
    }
  } catch (error) {
    logger.error('Readiness check failed', { error: error.message });
    res.status(503).json({
      status: 'not ready',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Liveness probe
router.get('/live', (req, res) => {
  // Simple liveness check - if the server can respond, it's alive
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Metrics endpoint
router.get('/metrics', (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    environment: process.env.NODE_ENV || 'development',
    node_version: process.version,
    platform: process.platform,
    arch: process.arch,
    pid: process.pid
  };

  // Add custom application metrics
  metrics.application = {
    active_connections: 0, // Would track actual connections
    requests_per_minute: 0, // Would track actual request rate
    error_rate: 0, // Would track actual error rate
    response_time_avg: 0 // Would track actual response times
  };

  res.status(200).json(metrics);
});

module.exports = router;
