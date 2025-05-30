/**
 * External API Message Controller
 * 
 * Handles external API requests related to messages
 */

const Message = require('../../../../models/message.model');
const Conversation = require('../../../../models/conversation.model');
const Chatbot = require('../../../../models/chatbot.model');
const ApiError = require('../../../../utils/apiError');
const { processMessage } = require('../../../../services/chatbot.service');

/**
 * Get messages in a conversation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getMessages = async (req, res, next) => {
  try {
    // Get API key from request (set by authenticateApiKey middleware)
    const apiKey = req.apiKey;
    
    // Get conversation ID from params
    const { conversationId } = req.params;
    
    // Get query parameters
    const { limit = 50, before, after } = req.query;
    
    // Check if conversation exists and belongs to the user
    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: apiKey.userId
    });
    
    if (!conversation) {
      return next(new ApiError('Conversation not found or not accessible', 404));
    }
    
    // Build query
    const query = { conversationId };
    
    // Add time filters if provided
    if (before) {
      query.createdAt = { ...query.createdAt, $lt: new Date(before) };
    }
    
    if (after) {
      query.createdAt = { ...query.createdAt, $gt: new Date(after) };
    }
    
    // Find messages
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('id sender content type metadata createdAt');
    
    // Return messages in chronological order (oldest first)
    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages.reverse()
    });
  } catch (error) {
    next(new ApiError(error.message, 500));
  }
};

/**
 * Send a message in a conversation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.sendMessage = async (req, res, next) => {
  try {
    // Get API key from request (set by authenticateApiKey middleware)
    const apiKey = req.apiKey;
    
    // Get conversation ID from params
    const { conversationId } = req.params;
    
    // Get request body
    const { content, type = 'text', metadata = {} } = req.body;
    
    // Validate content
    if (!content) {
      return next(new ApiError('Message content is required', 400));
    }
    
    // Check if conversation exists and belongs to the user
    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: apiKey.userId
    });
    
    if (!conversation) {
      return next(new ApiError('Conversation not found or not accessible', 404));
    }
    
    // Get chatbot
    const chatbot = await Chatbot.findById(conversation.chatbotId);
    
    if (!chatbot) {
      return next(new ApiError('Chatbot not found', 404));
    }
    
    // Create user message
    const userMessage = new Message({
      conversationId,
      sender: 'user',
      content,
      type,
      metadata: {
        ...metadata,
        source: 'api',
        apiKeyId: apiKey._id
      }
    });
    
    // Save user message
    await userMessage.save();
    
    // Update conversation with last message
    conversation.lastMessage = {
      sender: 'user',
      content,
      timestamp: userMessage.createdAt
    };
    
    await conversation.save();
    
    // Process message and get chatbot response
    // Note: Using HTTP_PROXY environment variable for external requests if configured
    const botResponse = await processMessage(
      chatbot, 
      conversation, 
      content, 
      {
        userId: apiKey.userId,
        source: 'api',
        apiKeyId: apiKey._id,
        proxy: process.env.HTTP_PROXY || '104.129.196.38:10563' // Use configured proxy
      }
    );
    
    // Create bot message
    const botMessage = new Message({
      conversationId,
      sender: 'bot',
      content: botResponse.content,
      type: botResponse.type || 'text',
      metadata: {
        ...botResponse.metadata,
        source: 'api'
      }
    });
    
    // Save bot message
    await botMessage.save();
    
    // Update conversation with last message
    conversation.lastMessage = {
      sender: 'bot',
      content: botResponse.content,
      timestamp: botMessage.createdAt
    };
    
    await conversation.save();
    
    // Return both messages
    res.status(201).json({
      success: true,
      data: {
        userMessage: {
          id: userMessage._id,
          sender: userMessage.sender,
          content: userMessage.content,
          type: userMessage.type,
          createdAt: userMessage.createdAt
        },
        botMessage: {
          id: botMessage._id,
          sender: botMessage.sender,
          content: botMessage.content,
          type: botMessage.type,
          createdAt: botMessage.createdAt
        }
      }
    });
  } catch (error) {
    next(new ApiError(error.message, 500));
  }
};
