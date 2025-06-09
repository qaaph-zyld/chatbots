/**
 * Conversation Controller
 * 
 * Controller for conversation-related API endpoints
 */

// Import module alias registration
require('@src/core/module-alias');

// Import dependencies
const { ConversationService } = require('@modules/conversation/services/conversation.service');
const { ConversationRepository } = require('@modules/conversation/repositories/conversation.repository');

// Create instances
const conversationRepository = new ConversationRepository();
const conversationService = new ConversationService(conversationRepository);

/**
 * Get paginated conversation history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getConversationHistory(req, res) {
  try {
    const { chatbotId } = req.query;
    const userId = req.user.id; // Assuming auth middleware sets req.user
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    // Validate required parameters
    if (!chatbotId) {
      return res.status(400).json({ 
        success: false, 
        message: 'chatbotId is required' 
      });
    }
    
    // Get conversation history
    const result = await conversationService.getConversationHistory(
      userId, 
      chatbotId, 
      page, 
      limit
    );
    
    // Return the result
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in getConversationHistory controller:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'An error occurred while retrieving conversation history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = {
  getConversationHistory
};
