/**
 * Health Check Controller
 * 
 * Provides endpoints for checking system health
 */

const healthCheckService = require('../services/health-check.service');

/**
 * Get overall health status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getHealth(req, res) {
  try {
    const health = await healthCheckService.checkHealth();
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json(health);
  } catch (error) {
    console.error('Error checking health:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
}

/**
 * Get liveness status (for kubernetes)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getLiveness(req, res) {
  try {
    const liveness = await healthCheckService.checkLiveness();
    res.status(200).json(liveness);
  } catch (error) {
    console.error('Error checking liveness:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
}

/**
 * Get readiness status (for kubernetes)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getReadiness(req, res) {
  try {
    const readiness = await healthCheckService.checkReadiness();
    
    const statusCode = readiness.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json(readiness);
  } catch (error) {
    console.error('Error checking readiness:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
}

/**
 * Get health status for a specific component
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getComponentHealth(req, res) {
  try {
    const { component } = req.params;
    
    if (!component) {
      return res.status(400).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Component parameter is required'
      });
    }
    
    const health = await healthCheckService.checkComponentHealth(component);
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      status: health.status,
      timestamp: new Date().toISOString(),
      component,
      ...health
    });
  } catch (error) {
    console.error(`Error checking component health (${req.params.component}):`, error);
    res.status(error.message.includes('Unknown component') ? 400 : 500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
}

module.exports = {
  getHealth,
  getLiveness,
  getReadiness,
  getComponentHealth
};
