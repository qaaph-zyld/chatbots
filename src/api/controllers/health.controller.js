/**
 * Health Controller
 * 
 * Provides endpoints for monitoring system health and status
 */

const mongoose = require('mongoose');
const os = require('os');
const { version } = require('../../../package.json');
const config = require('../../../config');

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

module.exports = {
  healthCheck,
  systemStatus,
  metrics
};
