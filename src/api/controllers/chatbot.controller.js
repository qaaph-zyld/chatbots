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
 * Send message to chatbot
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.sendMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message, sessionId, userId, conversationId, context } = req.body;
    
    logger.debug(`Processing message for chatbot ${id}: ${message?.substring(0, 50)}${message?.length > 50 ? '...' : ''}`);
    
    if (!message) {
      throw new ValidationError('Message is required');
    }
    
    // Process message with the chatbot
    const options = {
      sessionId: sessionId,
      userId: userId,
      conversationId: conversationId,
      context: context || {},
      metadata: {
        source: 'api',
        timestamp: new Date().toISOString()
      }
    };
    
    const result = await chatbotService.processMessage(id, message, options);
    
    logger.info(`Message processed for chatbot ${id}, conversation ${result.conversationId}`);
    
    res.status(200).json({
      success: true,
      conversationId: result.conversationId,
      sessionId: result.sessionId,
      message: message,
      response: result.response,
      timestamp: result.timestamp,
      metadata: result.metadata
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
    const { sessionId, conversationId } = req.query;
    
    // Get conversation service
    const conversationService = require('../../services/conversation.service');
    
    let conversation;
    
    if (conversationId) {
      logger.debug(`Getting conversation history by ID: ${conversationId}`);
      conversation = await conversationService.getConversationById(conversationId);
    } else if (sessionId) {
      logger.debug(`Getting conversation history by session ID: ${sessionId}`);
      conversation = await conversationService.getConversationBySessionId(sessionId);
    } else {
      throw new ValidationError('Either session ID or conversation ID is required');
    }
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Conversation not found'
      });
    }
    
    // Verify that the conversation belongs to the specified chatbot
    if (conversation.chatbotId.toString() !== id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Conversation does not belong to the specified chatbot'
      });
    }
    
    logger.info(`Retrieved conversation history for chatbot ${id}, conversation ${conversation._id}: ${conversation.messages.length} messages`);
    
    res.status(200).json({
      success: true,
      data: {
        id: conversation._id,
        sessionId: conversation.sessionId,
        messages: conversation.messages,
        context: conversation.context,
        startedAt: conversation.startedAt,
        lastMessageAt: conversation.lastMessageAt
      }
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
