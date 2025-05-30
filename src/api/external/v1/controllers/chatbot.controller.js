/**
 * External API Chatbot Controller
 * 
 * Handles external API requests related to chatbots
 */

const Chatbot = require('../../../../models/chatbot.model');
const ApiError = require('../../../../utils/apiError');

/**
 * Get all accessible chatbots
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getAllChatbots = async (req, res, next) => {
  try {
    // Get API key from request (set by authenticateApiKey middleware)
    const apiKey = req.apiKey;
    
    // Find all chatbots accessible with this API key
    const chatbots = await Chatbot.find({
      $or: [
        { ownerId: apiKey.userId },
        { collaborators: { $elemMatch: { userId: apiKey.userId } } },
        { isPublic: true }
      ]
    }).select('id name description avatar isPublic createdAt updatedAt');
    
    res.status(200).json({
      success: true,
      count: chatbots.length,
      data: chatbots
    });
  } catch (error) {
    next(new ApiError(error.message, 500));
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
    // Get API key from request (set by authenticateApiKey middleware)
    const apiKey = req.apiKey;
    
    // Find the chatbot
    const chatbot = await Chatbot.findOne({
      _id: req.params.id,
      $or: [
        { ownerId: apiKey.userId },
        { collaborators: { $elemMatch: { userId: apiKey.userId } } },
        { isPublic: true }
      ]
    });
    
    // Check if chatbot exists
    if (!chatbot) {
      return next(new ApiError('Chatbot not found or not accessible', 404));
    }
    
    // Return chatbot details
    res.status(200).json({
      success: true,
      data: {
        id: chatbot._id,
        name: chatbot.name,
        description: chatbot.description,
        avatar: chatbot.avatar,
        isPublic: chatbot.isPublic,
        personality: chatbot.personality,
        capabilities: chatbot.capabilities,
        createdAt: chatbot.createdAt,
        updatedAt: chatbot.updatedAt
      }
    });
  } catch (error) {
    next(new ApiError(error.message, 500));
  }
};
