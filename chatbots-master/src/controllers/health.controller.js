/**
 * Health Check Controller
 * 
 * Provides API endpoints to check the health of various system components
 */

const healthService = require('../services/health.service');

class HealthController {
  /**
   * Get overall system health status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getSystemHealth(req, res) {
    try {
      const healthStatus = await healthService.checkSystemHealth();
      
      // Set appropriate status code based on health
      const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
      
      res.status(statusCode).json(healthStatus);
    } catch (error) {
      console.error('Error checking system health:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to check system health',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get simple liveness probe status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getLiveness(req, res) {
    // Simple liveness check - if this responds, the server is running
    res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get readiness probe status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getReadiness(req, res) {
    try {
      // Check database connection as the minimum requirement for readiness
      const dbStatus = await healthService.checkDatabaseConnection();
      
      const statusCode = dbStatus.status === 'healthy' ? 200 : 503;
      
      res.status(statusCode).json({
        status: dbStatus.status === 'healthy' ? 'ready' : 'not ready',
        database: dbStatus,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error checking readiness:', error);
      res.status(503).json({
        status: 'not ready',
        message: 'Failed to check readiness',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get detailed component health status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getComponentHealth(req, res) {
    try {
      const componentName = req.params.component;
      let componentStatus;

      switch (componentName) {
        case 'database':
          componentStatus = await healthService.checkDatabaseConnection();
          break;
        case 'cache':
          componentStatus = await healthService.checkCacheConnection();
          break;
        case 'external-services':
          componentStatus = { services: await healthService.checkExternalServices() };
          break;
        case 'system-resources':
          componentStatus = healthService.checkSystemResources();
          break;
        default:
          return res.status(404).json({
            status: 'error',
            message: `Unknown component: ${componentName}`,
            timestamp: new Date().toISOString()
          });
      }

      const statusCode = 
        (componentName === 'external-services' && componentStatus.services.some(s => s.status === 'unhealthy')) ||
        (componentName !== 'external-services' && componentStatus.status === 'unhealthy') ? 503 : 200;

      res.status(statusCode).json({
        component: componentName,
        ...componentStatus,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error checking component health for ${req.params.component}:`, error);
      res.status(500).json({
        status: 'error',
        message: `Failed to check ${req.params.component} health`,
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = new HealthController();
