/**
 * Integration Controller
 * 
 * Handles all integration-related operations and API endpoints
 */

const integrationService = require('../../integrations/integration.service');
const { logger } = require('../../utils');

/**
 * Get all integrations
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAllIntegrations = async (req, res) => {
  try {
    const filter = {};
    
    // Apply filters if provided
    if (req.query.platform) {
      filter.platform = req.query.platform;
    }
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    // If not admin, only show integrations created by the user
    if (req.user.role !== 'admin') {
      filter.createdBy = req.user.id;
    }
    
    // Pagination options
    const options = {
      sort: { createdAt: -1 },
      limit: parseInt(req.query.limit) || 10,
      skip: parseInt(req.query.page) * (parseInt(req.query.limit) || 10) || 0
    };
    
    const integrations = await integrationService.getAllIntegrations(filter, options);
    
    res.status(200).json({
      status: 'success',
      data: integrations
    });
  } catch (error) {
    logger.error('Error fetching integrations:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch integrations',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Create a new integration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createIntegration = async (req, res) => {
  try {
    const { name, description, platform, chatbotId, config } = req.body;
    
    // Validate required fields
    if (!name || !platform || !chatbotId || !config) {
      return res.status(400).json({
        status: 'error',
        message: 'Name, platform, chatbotId, and config are required fields',
        code: 'VALIDATION_ERROR'
      });
    }
    
    // Create integration data
    const integrationData = {
      name,
      description,
      platform,
      chatbotId,
      config,
      createdBy: req.user.id,
      status: req.body.status || 'inactive'
    };
    
    // Create integration
    const integration = await integrationService.createIntegration(integrationData);
    
    res.status(201).json({
      status: 'success',
      message: 'Integration created successfully',
      data: integration
    });
  } catch (error) {
    logger.error('Error creating integration:', error.message);
    
    // Handle validation errors
    if (error.message.includes('required field') || error.message.includes('Unsupported platform')) {
      return res.status(400).json({
        status: 'error',
        message: error.message,
        code: 'VALIDATION_ERROR'
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to create integration',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Get integration by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getIntegrationById = async (req, res) => {
  try {
    const integrationId = req.params.id;
    
    // Get integration
    const integration = await integrationService.getIntegrationById(integrationId);
    
    // Check if user has permission to view this integration
    if (req.user.role !== 'admin' && integration.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to view this integration',
        code: 'FORBIDDEN'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: integration
    });
  } catch (error) {
    logger.error(`Error getting integration ${req.params.id}:`, error.message);
    
    // Handle not found error
    if (error.message === 'Integration not found') {
      return res.status(404).json({
        status: 'error',
        message: 'Integration not found',
        code: 'NOT_FOUND'
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to get integration',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Update integration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateIntegration = async (req, res) => {
  try {
    const integrationId = req.params.id;
    
    // Get integration
    const integration = await integrationService.getIntegrationById(integrationId);
    
    // Check if user has permission to update this integration
    if (req.user.role !== 'admin' && integration.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to update this integration',
        code: 'FORBIDDEN'
      });
    }
    
    // Update integration
    const updatedIntegration = await integrationService.updateIntegration(integrationId, req.body);
    
    res.status(200).json({
      status: 'success',
      message: 'Integration updated successfully',
      data: updatedIntegration
    });
  } catch (error) {
    logger.error(`Error updating integration ${req.params.id}:`, error.message);
    
    // Handle not found error
    if (error.message === 'Integration not found') {
      return res.status(404).json({
        status: 'error',
        message: 'Integration not found',
        code: 'NOT_FOUND'
      });
    }
    
    // Handle validation errors
    if (error.message.includes('required field') || error.message.includes('Unsupported platform')) {
      return res.status(400).json({
        status: 'error',
        message: error.message,
        code: 'VALIDATION_ERROR'
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to update integration',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Delete integration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteIntegration = async (req, res) => {
  try {
    const integrationId = req.params.id;
    
    // Get integration
    const integration = await integrationService.getIntegrationById(integrationId);
    
    // Check if user has permission to delete this integration
    if (req.user.role !== 'admin' && integration.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to delete this integration',
        code: 'FORBIDDEN'
      });
    }
    
    // Delete integration
    await integrationService.deleteIntegration(integrationId);
    
    res.status(200).json({
      status: 'success',
      message: 'Integration deleted successfully'
    });
  } catch (error) {
    logger.error(`Error deleting integration ${req.params.id}:`, error.message);
    
    // Handle not found error
    if (error.message === 'Integration not found') {
      return res.status(404).json({
        status: 'error',
        message: 'Integration not found',
        code: 'NOT_FOUND'
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete integration',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Get integrations by chatbot ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getIntegrationsByChatbotId = async (req, res) => {
  try {
    const chatbotId = req.params.chatbotId;
    
    // Get integrations
    const integrations = await integrationService.getIntegrationsByChatbotId(chatbotId);
    
    res.status(200).json({
      status: 'success',
      data: integrations
    });
  } catch (error) {
    logger.error(`Error getting integrations for chatbot ${req.params.chatbotId}:`, error.message);
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to get integrations',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Activate integration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.activateIntegration = async (req, res) => {
  try {
    const integrationId = req.params.id;
    
    // Get integration
    const integration = await integrationService.getIntegrationById(integrationId);
    
    // Check if user has permission to activate this integration
    if (req.user.role !== 'admin' && integration.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to activate this integration',
        code: 'FORBIDDEN'
      });
    }
    
    // Activate integration
    const activatedIntegration = await integrationService.activateIntegration(integrationId);
    
    res.status(200).json({
      status: 'success',
      message: 'Integration activated successfully',
      data: activatedIntegration
    });
  } catch (error) {
    logger.error(`Error activating integration ${req.params.id}:`, error.message);
    
    // Handle not found error
    if (error.message === 'Integration not found') {
      return res.status(404).json({
        status: 'error',
        message: 'Integration not found',
        code: 'NOT_FOUND'
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to activate integration',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Deactivate integration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deactivateIntegration = async (req, res) => {
  try {
    const integrationId = req.params.id;
    
    // Get integration
    const integration = await integrationService.getIntegrationById(integrationId);
    
    // Check if user has permission to deactivate this integration
    if (req.user.role !== 'admin' && integration.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to deactivate this integration',
        code: 'FORBIDDEN'
      });
    }
    
    // Deactivate integration
    const deactivatedIntegration = await integrationService.deactivateIntegration(integrationId);
    
    res.status(200).json({
      status: 'success',
      message: 'Integration deactivated successfully',
      data: deactivatedIntegration
    });
  } catch (error) {
    logger.error(`Error deactivating integration ${req.params.id}:`, error.message);
    
    // Handle not found error
    if (error.message === 'Integration not found') {
      return res.status(404).json({
        status: 'error',
        message: 'Integration not found',
        code: 'NOT_FOUND'
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to deactivate integration',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Process message from integration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.processMessage = async (req, res) => {
  try {
    const integrationId = req.params.id;
    const message = req.body;
    
    // Get integration
    const integration = await integrationService.getIntegrationById(integrationId);
    
    // Check if integration is active
    if (integration.status !== 'active') {
      return res.status(400).json({
        status: 'error',
        message: 'Integration is not active',
        code: 'INVALID_STATE'
      });
    }
    
    // Process message
    const response = await integrationService.processMessage(integration, {
      ...message,
      callbackUrl: req.body.callbackUrl || req.query.callbackUrl,
      origin: req.headers.origin
    });
    
    res.status(200).json({
      status: 'success',
      data: response
    });
  } catch (error) {
    logger.error(`Error processing message for integration ${req.params.id}:`, error.message);
    
    // Handle not found error
    if (error.message === 'Integration not found') {
      return res.status(404).json({
        status: 'error',
        message: 'Integration not found',
        code: 'NOT_FOUND'
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to process message',
      code: 'SERVER_ERROR'
    });
  }
};
