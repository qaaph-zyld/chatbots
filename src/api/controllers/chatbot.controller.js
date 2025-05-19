/**
 * Chatbot Controller
 * 
 * Handles all chatbot-related operations and API endpoints
 */

const chatbotService = require('../../services/chatbot.service');
const { logger } = require('../../utils');
const { ValidationError } = require('../../utils/errors');

/**
 * Get all chatbots
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getAllChatbots = async (req, res, next) => {
  try {
    logger.debug('Getting all chatbots');
    
    // Get all chatbots from service
    const chatbots = chatbotService.getAllChatbots();
    
    logger.info(`Retrieved ${chatbots.length} chatbots`);
    
    res.status(200).json({
      success: true,
      count: chatbots.length,
      data: chatbots
    });
  } catch (error) {
    logger.error('Error fetching chatbots:', error.message);
    next(error);
  }
};

/**
 * Create a new chatbot
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.createChatbot = async (req, res, next) => {
  try {
    const { name, description, engine, engineConfig } = req.body;
    
    logger.debug(`Request to create chatbot: ${name}`);
    
    // Validate required fields
    if (!name) {
      throw new ValidationError('Name is required');
    }
    
    // Check if engine is valid
    if (engine) {
      const availableEngines = chatbotService.getAvailableEngineTypes();
      if (!availableEngines.includes(engine)) {
        throw new ValidationError(`Invalid engine type. Available engines: ${availableEngines.join(', ')}`);
      }
    }
    
    // Create chatbot using service
    const chatbot = await chatbotService.createChatbot({
      name,
      description,
      engine,
      engineConfig,
      owner: req.user?.id || 'system'
    });
    
    logger.info(`Created new chatbot: ${chatbot.id} (${chatbot.name})`);
    
    res.status(201).json({
      success: true,
      data: chatbot
    });
  } catch (error) {
    logger.error('Error creating chatbot:', error.message);
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: error.message
      });
    }
    
    next(error);
  }
};

/**
 * Get chatbot by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getChatbotById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    logger.debug(`Getting chatbot by ID: ${id}`);
    
    // Get chatbot by ID from service
    let chatbot;
    try {
      chatbot = chatbotService.getChatbot(id);
      logger.info(`Retrieved chatbot: ${id}`);
      
      res.status(200).json({
        success: true,
        data: chatbot
      });
    } catch (error) {
      logger.warn(`Chatbot not found: ${id}`);
      
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Chatbot with ID ${id} not found`
      });
    }
  } catch (error) {
    logger.error(`Error fetching chatbot ${req.params.id}:`, error.message);
    next(error);
  }
};

/**
 * Update chatbot by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateChatbot = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Placeholder for database update
    const chatbot = null;
    
    if (!chatbot) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: `Chatbot with ID ${id} not found`
      });
    }
    
    res.status(200).json({
      success: true,
      data: { ...chatbot, ...updateData, updatedAt: new Date().toISOString() }
    });
  } catch (error) {
    console.error(`Error updating chatbot ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Failed to update chatbot'
    });
  }
};

/**
 * Delete chatbot by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteChatbot = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete chatbot using service
    let deleted;
    try {
      deleted = await chatbotService.deleteChatbot(id);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: `Chatbot with ID ${id} not found`
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Chatbot with ID ${id} successfully deleted`
    });
  } catch (error) {
    console.error(`Error deleting chatbot ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Failed to delete chatbot'
    });
  }
};

/**
 * Process message with chatbot
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.processMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message, sessionId, userId, language } = req.body;
    
    logger.debug(`Processing message for chatbot ${id}: ${message?.substring(0, 50)}${message?.length > 50 ? '...' : ''}`);
    
    if (!message) {
      throw new ValidationError('Message is required');
    }
    
    // Process message using integration manager's web channel
    const session = sessionId || `session-${Date.now()}`;
    const result = await chatbotService.processMessage({
      text: message,
      sessionId: session,
      userId: userId || `user-${session}`,
      language: language || 'en',
      metadata: {
        chatbotId: id,
        source: 'api',
        timestamp: new Date().toISOString()
      }
    }, 'web');
    
    logger.info(`Message processed for chatbot ${id}, session ${session}`);
    
    res.status(200).json({
      success: true,
      response: result.response.text,
      metadata: {
        sessionId: session,
        timestamp: new Date().toISOString(),
        confidence: result.engine?.metadata?.confidence || 0,
        intent: result.nlp?.intent || 'unknown'
      }
    });
  } catch (error) {
    logger.error(`Error processing message for chatbot ${req.params.id}:`, error.message);
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: error.message
      });
    }
    
    next(error);
  }
};

/**
 * Get conversation history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getConversationHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sessionId } = req.query;
    
    logger.debug(`Getting conversation history for chatbot ${id}, session ${sessionId}`);
    
    if (!sessionId) {
      throw new ValidationError('Session ID is required');
    }
    
    // Placeholder for conversation history
    // In a real implementation, this would fetch from the database
    const history = [];
    
    logger.info(`Retrieved conversation history for chatbot ${id}, session ${sessionId}: ${history.length} messages`);
    
    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    logger.error(`Error fetching conversation history for chatbot ${req.params.id}:`, error.message);
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: error.message
      });
    }
    
    next(error);
  }
};
