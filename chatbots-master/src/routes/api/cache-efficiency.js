/**
 * Cache Efficiency API Routes
 * 
 * Provides endpoints for monitoring cache efficiency and performance
 * and managing adaptive TTL weight tuning
 */

const express = require('express');
const router = express.Router();
const { 
  generateEfficiencyReport, 
  getMonitoringStatus,
  autoTuneWeights,
  resetWeights
} = require('@src/middleware/cache/adaptive-ttl');
const { isAdmin } = require('@middleware/auth');
const logger = require('@utils/logger');

/**
 * @route GET /api/cache-efficiency/report
 * @desc Get cache efficiency comparison report
 * @access Admin
 */
router.get('/report', isAdmin, async (req, res) => {
  try {
    const report = await generateEfficiencyReport();
    
    if (report.error) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to generate cache efficiency report',
        error: report.error
      });
    }
    
    return res.json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error generating cache efficiency report:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to generate cache efficiency report',
      error: error.message
    });
  }
});

/**
 * @route POST /api/cache-efficiency/initialize
 * @desc Initialize or reset cache efficiency monitoring
 * @access Admin
 */
router.post('/initialize', isAdmin, async (req, res) => {
  try {
    // Using the imported function directly instead of through adaptiveTTL object
    await initMonitoring();
    
    return res.json({
      success: true,
      message: 'Cache efficiency monitoring initialized'
    });
  } catch (error) {
    logger.error('Error initializing cache efficiency monitoring:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to initialize cache efficiency monitoring',
      error: error.message
    });
  }
});

/**
 * @route GET /api/cache-efficiency/status
 * @desc Get current status of cache efficiency monitoring
 * @access Admin
 */
router.get('/status', isAdmin, async (req, res) => {
  try {
    // Using the imported function directly instead of through adaptiveTTL object
    const status = await getMonitoringStatus();
    
    return res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Error getting cache monitoring status:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to get cache monitoring status',
      error: error.message
    });
  }
});

/**
 * @route POST /api/cache-efficiency/weights/tune
 * @desc Automatically tune the weights used in TTL calculation
 * @access Admin
 */
router.post('/weights/tune', isAdmin, async (req, res) => {
  try {
    const result = await autoTuneWeights();
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    return res.json({
      success: true,
      message: 'Adaptive TTL weights tuned successfully',
      data: result
    });
  } catch (error) {
    logger.error('Error tuning adaptive TTL weights:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to tune adaptive TTL weights',
      error: error.message
    });
  }
});

/**
 * @route POST /api/cache-efficiency/weights/reset
 * @desc Reset weights to their original values
 * @access Admin
 */
router.post('/weights/reset', isAdmin, async (req, res) => {
  try {
    const result = resetWeights();
    
    return res.json({
      success: true,
      message: 'Adaptive TTL weights reset to defaults',
      data: result
    });
  } catch (error) {
    logger.error('Error resetting adaptive TTL weights:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to reset adaptive TTL weights',
      error: error.message
    });
  }
});

module.exports = router;
