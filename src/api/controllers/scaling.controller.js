/**
 * Scaling Controller
 * 
 * Handles API endpoints for scaling configuration and metrics
 */

require('@src/scaling\scaling.service');
require('@src/utils');

/**
 * Get scaling metrics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.getMetrics = async (req, res) => {
  try {
    const metrics = scalingService.getMetrics();
    
    return res.status(200).json({
      status: 'success',
      data: metrics
    });
  } catch (error) {
    logger.error('Error getting scaling metrics:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get scaling metrics',
      error: error.message,
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Get scaling configuration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.getConfiguration = async (req, res) => {
  try {
    const config = scalingService.getConfiguration();
    
    return res.status(200).json({
      status: 'success',
      data: config
    });
  } catch (error) {
    logger.error('Error getting scaling configuration:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get scaling configuration',
      error: error.message,
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Update scaling configuration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.updateConfiguration = async (req, res) => {
  try {
    const newConfig = req.body;
    
    // Validate configuration
    if (!newConfig || Object.keys(newConfig).length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Configuration data is required',
        code: 'VALIDATION_ERROR'
      });
    }
    
    // Update configuration
    const updatedConfig = scalingService.updateConfiguration(newConfig);
    
    return res.status(200).json({
      status: 'success',
      data: updatedConfig,
      message: 'Scaling configuration updated successfully'
    });
  } catch (error) {
    logger.error('Error updating scaling configuration:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update scaling configuration',
      error: error.message,
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};
