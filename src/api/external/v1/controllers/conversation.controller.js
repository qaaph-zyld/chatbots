/**
 * External API Conversation Controller
 * 
 * Handles external API requests related to conversations
 */

const Conversation = require('../../../../models/conversation.model');
const Chatbot = require('../../../../models/chatbot.model');
const ApiError = require('../../../../utils/apiError');

/**
 * Get all conversations
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getAllConversations = async (req, res, next) => {
  try {
    // Get API key from request (set by authenticateApiKey middleware)
    const apiKey = req.apiKey;
    
    // Get query parameters
    const { chatbotId, limit = 20, page = 1 } = req.query;
    
    // Build query
    const query = { userId: apiKey.userId };
    
    // Add chatbot filter if provided
    if (chatbotId) {
      query.chatbotId = chatbotId;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Find conversations
    const conversations = await Conversation.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('id chatbotId title lastMessage createdAt updatedAt');
    
    // Get total count
    const total = await Conversation.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: conversations.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: conversations
    });
  } catch (error) {
    next(new ApiError(error.message, 500));
  }
};

/**
 * Create a new conversation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.createConversation = async (req, res, next) => {
  try {
    // Get API key from request (set by authenticateApiKey middleware)
    const apiKey = req.apiKey;
    
    // Get request body
    const { chatbotId, metadata } = req.body;
    
    // Validate chatbotId
    if (!chatbotId) {
      return next(new ApiError('Chatbot ID is required', 400));
    }
    
    // Check if chatbot exists and is accessible
    const chatbot = await Chatbot.findOne({
      _id: chatbotId,
      $or: [
        { ownerId: apiKey.userId },
        { collaborators: { $elemMatch: { userId: apiKey.userId } } },
        { isPublic: true }
      ]
    });
    
    if (!chatbot) {
      return next(new ApiError('Chatbot not found or not accessible', 404));
    }
    
    // Create conversation
    const conversation = new Conversation({
      chatbotId,
      userId: apiKey.userId,
      title: `Conversation with ${chatbot.name}`,
      metadata: metadata || {},
      lastMessage: null
    });
    
    // Save conversation
    await conversation.save();
    
    res.status(201).json({
      success: true,
      data: {
        id: conversation._id,
        chatbotId: conversation.chatbotId,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      }
    });
  } catch (error) {
    next(new ApiError(error.message, 500));
  }
};

/**
 * Get conversation by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getConversationById = async (req, res, next) => {
  try {
    // Get API key from request (set by authenticateApiKey middleware)
    const apiKey = req.apiKey;
    
    // Find conversation
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: apiKey.userId
    });
    
    // Check if conversation exists
    if (!conversation) {
      return next(new ApiError('Conversation not found or not accessible', 404));
    }
    
    // Get chatbot details
    const chatbot = await Chatbot.findById(conversation.chatbotId)
      .select('name avatar');
    
    // Return conversation details
    res.status(200).json({
      success: true,
      data: {
        id: conversation._id,
        chatbotId: conversation.chatbotId,
        chatbotName: chatbot ? chatbot.name : 'Unknown',
        chatbotAvatar: chatbot ? chatbot.avatar : null,
        title: conversation.title,
        metadata: conversation.metadata,
        lastMessage: conversation.lastMessage,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      }
    });
  } catch (error) {
    next(new ApiError(error.message, 500));
  }
};
