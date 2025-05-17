/**
 * Chatbot Controller
 * 
 * Handles all chatbot-related operations and API endpoints
 */

const chatbotService = require('../../services/chatbot.service');

/**
 * Get all chatbots
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAllChatbots = async (req, res) => {
  try {
    // Get all chatbots from service
    const chatbots = chatbotService.getAllChatbots();
    
    res.status(200).json({
      success: true,
      data: chatbots
    });
  } catch (error) {
    console.error('Error fetching chatbots:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Failed to fetch chatbots'
    });
  }
};

/**
 * Create a new chatbot
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createChatbot = async (req, res) => {
  try {
    const { name, description, engine, engineConfig } = req.body;
    
    // Validate required fields
    if (!name || !engine) {
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'Name and engine are required fields'
      });
    }
    
    // Create chatbot using service
    const chatbot = await chatbotService.createChatbot({
      id: Date.now().toString(),
      name,
      description,
      engine,
      engineConfig,
      owner: req.user?.id || 'system'
    });
    
    res.status(201).json({
      success: true,
      data: chatbot
    });
  } catch (error) {
    console.error('Error creating chatbot:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Failed to create chatbot'
    });
  }
};

/**
 * Get chatbot by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getChatbotById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get chatbot by ID from service
    let chatbot;
    try {
      chatbot = chatbotService.getChatbot(id);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: `Chatbot with ID ${id} not found`
      });
    }
    
    res.status(200).json({
      success: true,
      data: chatbot
    });
  } catch (error) {
    console.error(`Error fetching chatbot ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Failed to fetch chatbot'
    });
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
 */
exports.sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, sessionId } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'Message is required'
      });
    }
    
    // Process message using integration manager's web channel
    const session = sessionId || Date.now().toString();
    const result = await chatbotService.processMessage({
      text: message,
      sessionId: session,
      chatbotId: id,
      user: req.user || { id: 'anonymous' }
    }, 'web');
    
    res.status(200).json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error(`Error processing message for chatbot ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Failed to process message'
    });
  }
};

/**
 * Get conversation history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getConversationHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionId } = req.query;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'Session ID is required'
      });
    }
    
    // This will be implemented when we add conversation storage
    // For now, return an empty array
    const history = [];
    
    res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error(`Error fetching conversation history for chatbot ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Failed to fetch conversation history'
    });
  }
};
