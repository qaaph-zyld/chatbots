/**
 * Health Controller
 * 
 * Provides endpoints for monitoring system health and status
 * Used by monitoring tools, load balancers, and deployment verification tests
 */

const mongoose = require('mongoose');
const os = require('os');
const { version } = require('../../../package.json');
const config = require('../../../config');
const axios = require('axios');

// External service endpoints to check
const externalServices = {
  stripe: {
    name: 'Stripe API',
    url: 'https://api.stripe.com/v1/health',
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY || config.stripe.secretKey}` }
  },
  // Add other external services as needed
};

/**
 * Basic health check
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const healthCheck = (req, res) => {
  return res.status(200).json({
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime(),
    version
  });
};

/**
 * Detailed system status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const systemStatus = async (req, res) => {
  try {
    // Check database connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // System information
    const systemInfo = {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      memory: {
        total: Math.round(os.totalmem() / (1024 * 1024 * 1024)) + ' GB',
        free: Math.round(os.freemem() / (1024 * 1024 * 1024)) + ' GB',
        usage: Math.round((1 - os.freemem() / os.totalmem()) * 100) + '%'
      },
      uptime: Math.round(os.uptime() / 3600) + ' hours'
    };
    
    // Process information
    const processInfo = {
      pid: process.pid,
      memory: process.memoryUsage(),
      uptime: Math.round(process.uptime() / 60) + ' minutes',
      nodeVersion: process.version
    };
    
    return res.status(200).json({
      status: 'ok',
      timestamp: new Date(),
      environment: config.env,
      version,
      database: {
        status: dbStatus,
        name: mongoose.connection.name
      },
      system: systemInfo,
      process: processInfo
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Metrics endpoint for Prometheus
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const metrics = (req, res) => {
  // Basic metrics in Prometheus format
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  let metricsOutput = '';
  
  // Application info
  metricsOutput += '# HELP chatbots_info Information about the Chatbots application\n';
  metricsOutput += '# TYPE chatbots_info gauge\n';
  metricsOutput += `chatbots_info{version="${version}",environment="${config.env}"} 1\n\n`;
  
  // Uptime
  metricsOutput += '# HELP chatbots_uptime_seconds The uptime of the Chatbots application in seconds\n';
  metricsOutput += '# TYPE chatbots_uptime_seconds gauge\n';
  metricsOutput += `chatbots_uptime_seconds ${uptime}\n\n`;
  
  // Memory usage
  metricsOutput += '# HELP chatbots_memory_usage_bytes Memory usage of the Chatbots application in bytes\n';
  metricsOutput += '# TYPE chatbots_memory_usage_bytes gauge\n';
  metricsOutput += `chatbots_memory_usage_bytes{type="rss"} ${memoryUsage.rss}\n`;
  metricsOutput += `chatbots_memory_usage_bytes{type="heapTotal"} ${memoryUsage.heapTotal}\n`;
  metricsOutput += `chatbots_memory_usage_bytes{type="heapUsed"} ${memoryUsage.heapUsed}\n`;
  metricsOutput += `chatbots_memory_usage_bytes{type="external"} ${memoryUsage.external}\n\n`;
  
  res.set('Content-Type', 'text/plain');
  return res.send(metricsOutput);
};

/**
 * Get basic health status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getHealth = (req, res) => {
  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version
  });
};

/**
 * Get readiness status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getReadiness = (req, res) => {
  // Check if the application is ready to receive traffic
  const isReady = true; // Add any readiness checks here
  
  if (isReady) {
    return res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } else {
    return res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      message: 'Application is starting up or shutting down'
    });
  }
};

/**
 * Get liveness status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getLiveness = (req, res) => {
  // Check if the application is alive
  return res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
};

/**
 * Get database health status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDatabaseHealth = async (req, res) => {
  try {
    // Check database connection
    const dbStatus = mongoose.connection.readyState === 1;
    
    // Try a simple database operation
    let dbOperational = false;
    try {
      // Ping the database
      await mongoose.connection.db.admin().ping();
      dbOperational = true;
    } catch (err) {
      console.error('Database ping failed:', err);
    }
    
    if (dbStatus && dbOperational) {
      return res.status(200).json({
        status: 'ok',
        connected: true,
        timestamp: new Date().toISOString(),
        details: {
          name: mongoose.connection.name,
          host: mongoose.connection.host,
          port: mongoose.connection.port,
          readyState: mongoose.connection.readyState
        }
      });
    } else {
      return res.status(503).json({
        status: 'error',
        connected: false,
        timestamp: new Date().toISOString(),
        message: 'Database connection issues detected'
      });
    }
  } catch (err) {
    console.error('Database health check error:', err);
    return res.status(500).json({
      status: 'error',
      connected: false,
      timestamp: new Date().toISOString(),
      message: 'Failed to check database health'
    });
  }
};

/**
 * Get external integrations health status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getIntegrationsHealth = async (req, res) => {
  try {
    const integrations = {};
    const promises = [];
    
    // Check each external service
    for (const [key, service] of Object.entries(externalServices)) {
      promises.push(
        axios.get(service.url, { headers: service.headers, timeout: 5000 })
          .then(() => {
            integrations[key] = {
              name: service.name,
              status: 'connected',
              timestamp: new Date().toISOString()
            };
          })
          .catch(err => {
            console.error(`${service.name} health check error:`, err.message);
            integrations[key] = {
              name: service.name,
              status: 'disconnected',
              timestamp: new Date().toISOString(),
              error: err.message
            };
          })
      );
    }
    
    await Promise.all(promises);
    
    // Check if all integrations are connected
    const allConnected = Object.values(integrations).every(i => i.status === 'connected');
    
    return res.status(allConnected ? 200 : 207).json({
      status: allConnected ? 'ok' : 'partial',
      timestamp: new Date().toISOString(),
      integrations
    });
  } catch (err) {
    console.error('Integrations health check error:', err);
    return res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Failed to check integrations health'
    });
  }
};

/**
 * Get detailed health status of all components
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDetailedHealth = async (req, res) => {
  try {
    // System information
    const systemInfo = {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      memory: {
        total: Math.round(os.totalmem() / (1024 * 1024 * 1024)) + ' GB',
        free: Math.round(os.freemem() / (1024 * 1024 * 1024)) + ' GB',
        usage: Math.round((1 - os.freemem() / os.totalmem()) * 100) + '%'
      },
      uptime: Math.round(os.uptime() / 3600) + ' hours'
    };
    
    // Process information
    const processInfo = {
      pid: process.pid,
      uptime: Math.round(process.uptime() / 3600) + ' hours',
      memory: process.memoryUsage(),
      version: process.version,
      env: process.env.NODE_ENV
    };
    
    // Database status
    let dbStatus = 'unknown';
    try {
      dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    } catch (err) {
      dbStatus = 'error';
    }
    
    // Check external services
    const integrations = {};
    for (const [key, service] of Object.entries(externalServices)) {
      try {
        await axios.get(service.url, { headers: service.headers, timeout: 3000 });
        integrations[key] = { status: 'connected' };
      } catch (err) {
        integrations[key] = { status: 'disconnected', error: err.message };
      }
    }
    
    // Compile all health information
    const health = {
      status: dbStatus === 'connected' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      version,
      system: systemInfo,
      process: processInfo,
      services: {
        database: { status: dbStatus },
        integrations
      }
    };
    
    return res.status(200).json(health);
  } catch (err) {
    console.error('Detailed health check error:', err);
    return res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Failed to retrieve detailed health information'
    });
  }
};

module.exports = {
  healthCheck,
  systemStatus,
  metrics,
  getHealth,
  getReadiness,
  getLiveness,
  getDatabaseHealth,
  getIntegrationsHealth,
  getDetailedHealth
};
