const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const Chatbot = require('../models/Chatbot');
const Conversation = require('../models/Conversation');
const Session = require('../models/Session');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Create a new chatbot
router.post('/',
  auth,
  [
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
    body('description').trim().isLength({ min: 1, max: 500 }).withMessage('Description must be 1-500 characters'),
    body('engine').isIn(['botpress', 'huggingface', 'openai', 'custom']).withMessage('Invalid engine'),
    body('engineConfig').isObject().withMessage('Engine config must be an object')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { name, description, engine, engineConfig, settings } = req.body;

      const chatbot = new Chatbot({
        name,
        description,
        engine,
        engineConfig,
        settings: settings || {},
        createdBy: req.user.id
      });

      await chatbot.save();

      logger.info('Chatbot created', {
        chatbotId: chatbot._id,
        userId: req.user.id,
        engine
      });

      res.status(201).json({
        success: true,
        data: chatbot
      });
    } catch (error) {
      logger.error('Error creating chatbot:', error);
      res.status(500).json({
        error: 'Failed to create chatbot',
        message: error.message
      });
    }
  }
);

// Get all chatbots for the authenticated user
router.get('/',
  auth,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
    query('engine').optional().isIn(['botpress', 'huggingface', 'openai', 'custom']).withMessage('Invalid engine filter')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const filter = { createdBy: req.user.id, isActive: true };
      if (req.query.engine) {
        filter.engine = req.query.engine;
      }

      const chatbots = await Chatbot.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('conversationCount');

      const total = await Chatbot.countDocuments(filter);

      res.json({
        success: true,
        data: chatbots,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('Error fetching chatbots:', error);
      res.status(500).json({
        error: 'Failed to fetch chatbots',
        message: error.message
      });
    }
  }
);

// Get a specific chatbot
router.get('/:id',
  auth,
  [
    param('id').isMongoId().withMessage('Invalid chatbot ID')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const chatbot = await Chatbot.findOne({
        _id: req.params.id,
        createdBy: req.user.id,
        isActive: true
      }).populate('conversationCount');

      if (!chatbot) {
        return res.status(404).json({
          error: 'Chatbot not found'
        });
      }

      res.json({
        success: true,
        data: chatbot
      });
    } catch (error) {
      logger.error('Error fetching chatbot:', error);
      res.status(500).json({
        error: 'Failed to fetch chatbot',
        message: error.message
      });
    }
  }
);

// Update a chatbot
router.put('/:id',
  auth,
  [
    param('id').isMongoId().withMessage('Invalid chatbot ID'),
    body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
    body('description').optional().trim().isLength({ min: 1, max: 500 }).withMessage('Description must be 1-500 characters'),
    body('engine').optional().isIn(['botpress', 'huggingface', 'openai', 'custom']).withMessage('Invalid engine'),
    body('engineConfig').optional().isObject().withMessage('Engine config must be an object')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const chatbot = await Chatbot.findOne({
        _id: req.params.id,
        createdBy: req.user.id,
        isActive: true
      });

      if (!chatbot) {
        return res.status(404).json({
          error: 'Chatbot not found'
        });
      }

      const allowedUpdates = ['name', 'description', 'engine', 'engineConfig', 'settings'];
      const updates = {};
      
      allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      Object.assign(chatbot, updates);
      await chatbot.save();

      logger.info('Chatbot updated', {
        chatbotId: chatbot._id,
        userId: req.user.id,
        updates: Object.keys(updates)
      });

      res.json({
        success: true,
        data: chatbot
      });
    } catch (error) {
      logger.error('Error updating chatbot:', error);
      res.status(500).json({
        error: 'Failed to update chatbot',
        message: error.message
      });
    }
  }
);

// Delete a chatbot (soft delete)
router.delete('/:id',
  auth,
  [
    param('id').isMongoId().withMessage('Invalid chatbot ID')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const chatbot = await Chatbot.findOne({
        _id: req.params.id,
        createdBy: req.user.id,
        isActive: true
      });

      if (!chatbot) {
        return res.status(404).json({
          error: 'Chatbot not found'
        });
      }

      chatbot.isActive = false;
      await chatbot.save();

      logger.info('Chatbot deleted', {
        chatbotId: chatbot._id,
        userId: req.user.id
      });

      res.json({
        success: true,
        message: 'Chatbot deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting chatbot:', error);
      res.status(500).json({
        error: 'Failed to delete chatbot',
        message: error.message
      });
    }
  }
);

// Process a message with a chatbot
router.post('/:id/message',
  [
    param('id').isMongoId().withMessage('Invalid chatbot ID'),
    body('message').trim().isLength({ min: 1, max: 1000 }).withMessage('Message must be 1-1000 characters'),
    body('sessionId').trim().isLength({ min: 1, max: 100 }).withMessage('Session ID is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { message, sessionId, userId, metadata } = req.body;
      const chatbotId = req.params.id;

      // Find the chatbot
      const chatbot = await Chatbot.findOne({
        _id: chatbotId,
        isActive: true
      });

      if (!chatbot) {
        return res.status(404).json({
          error: 'Chatbot not found'
        });
      }

      // Find or create session
      let session = await Session.findOne({ sessionId });
      if (!session) {
        session = await Session.createSession(sessionId, chatbotId, userId, metadata);
      }

      // Find or create conversation
      let conversation = await Conversation.findBySession(sessionId);
      if (!conversation) {
        conversation = await Conversation.createConversation(sessionId, chatbotId, userId);
      }

      // Add user message to conversation
      await conversation.addMessage({
        type: 'user',
        content: { text: message },
        metadata: { timestamp: new Date() }
      });

      // Increment session message count
      await session.incrementMessageCount();

      // Process message with the chatbot engine
      const startTime = Date.now();
      let botResponse;

      try {
        // This is where you'd integrate with actual AI engines
        // For now, we'll use a simple response
        botResponse = await processMessageWithEngine(chatbot, message, session.context);
      } catch (engineError) {
        logger.error('Engine processing error:', engineError);
        botResponse = {
          text: chatbot.settings.fallbackMessage || "I'm sorry, I'm having trouble processing your request right now.",
          intent: { name: 'fallback', confidence: 0 }
        };
      }

      const processingTime = Date.now() - startTime;

      // Add bot response to conversation
      await conversation.addMessage({
        type: 'bot',
        content: { text: botResponse.text },
        intent: botResponse.intent,
        entities: botResponse.entities || [],
        sentiment: botResponse.sentiment,
        metadata: { processingTime }
      });

      // Update session context if needed
      if (botResponse.context) {
        await session.updateContext(botResponse.context);
      }

      // Update chatbot analytics
      await chatbot.updateAnalytics({
        totalMessages: chatbot.analytics.totalMessages + 1
      });

      logger.info('Message processed', {
        chatbotId,
        sessionId,
        processingTime,
        intent: botResponse.intent?.name
      });

      res.json({
        success: true,
        data: {
          response: botResponse.text,
          intent: botResponse.intent,
          entities: botResponse.entities,
          sessionId,
          processingTime
        }
      });
    } catch (error) {
      logger.error('Error processing message:', error);
      res.status(500).json({
        error: 'Failed to process message',
        message: error.message
      });
    }
  }
);

// Get conversation history for a chatbot
router.get('/:id/conversations',
  auth,
  [
    param('id').isMongoId().withMessage('Invalid chatbot ID'),
    query('sessionId').optional().trim().isLength({ min: 1 }).withMessage('Invalid session ID'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const chatbotId = req.params.id;
      const { sessionId, limit = 50 } = req.query;

      // Verify chatbot ownership
      const chatbot = await Chatbot.findOne({
        _id: chatbotId,
        createdBy: req.user.id,
        isActive: true
      });

      if (!chatbot) {
        return res.status(404).json({
          error: 'Chatbot not found'
        });
      }

      let conversations;
      if (sessionId) {
        // Get specific conversation
        conversations = await Conversation.findBySession(sessionId);
        if (!conversations || conversations.chatbotId.toString() !== chatbotId) {
          return res.status(404).json({
            error: 'Conversation not found'
          });
        }
        conversations = [conversations];
      } else {
        // Get all conversations for this chatbot
        conversations = await Conversation.findByChatbot(chatbotId, parseInt(limit));
      }

      res.json({
        success: true,
        data: conversations
      });
    } catch (error) {
      logger.error('Error fetching conversations:', error);
      res.status(500).json({
        error: 'Failed to fetch conversations',
        message: error.message
      });
    }
  }
);

// Simple message processing function (to be replaced with actual AI engine integration)
async function processMessageWithEngine(chatbot, message, context) {
  // This is a placeholder implementation
  // In a real application, you would integrate with the actual AI engines here
  
  const responses = [
    "I understand you're asking about that. Let me help you.",
    "That's an interesting question. Here's what I think...",
    "I can help you with that. Let me provide some information.",
    "Thank you for your message. I'm here to assist you."
  ];

  const randomResponse = responses[Math.floor(Math.random() * responses.length)];

  return {
    text: randomResponse,
    intent: {
      name: 'general_inquiry',
      confidence: 0.8
    },
    entities: [],
    sentiment: {
      score: 0.1,
      magnitude: 0.5,
      label: 'neutral'
    }
  };
}

module.exports = router;
