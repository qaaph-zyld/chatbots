const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const Training = require('../models/Training');
const Chatbot = require('../models/Chatbot');
const Conversation = require('../models/Conversation');
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

// Create training data
router.post('/',
  auth,
  [
    body('chatbotId').isMongoId().withMessage('Invalid chatbot ID'),
    body('type').isIn(['intent', 'entity', 'response', 'conversation_flow', 'knowledge_base']).withMessage('Invalid training type'),
    body('input.text').trim().isLength({ min: 1, max: 1000 }).withMessage('Input text must be 1-1000 characters'),
    body('expectedOutput').isObject().withMessage('Expected output is required'),
    body('priority').optional().isInt({ min: 1, max: 10 }).withMessage('Priority must be 1-10')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { chatbotId, type, input, expectedOutput, metadata, priority } = req.body;

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

      const trainingData = new Training({
        chatbotId,
        type,
        input,
        expectedOutput,
        metadata: {
          ...metadata,
          source: 'manual'
        },
        priority: priority || 1,
        createdBy: req.user.id
      });

      await trainingData.save();

      logger.info('Training data created', {
        trainingId: trainingData._id,
        chatbotId,
        type,
        userId: req.user.id
      });

      res.status(201).json({
        success: true,
        data: trainingData
      });
    } catch (error) {
      logger.error('Error creating training data:', error);
      res.status(500).json({
        error: 'Failed to create training data',
        message: error.message
      });
    }
  }
);

// Get training data for a chatbot
router.get('/chatbot/:chatbotId',
  auth,
  [
    param('chatbotId').isMongoId().withMessage('Invalid chatbot ID'),
    query('type').optional().isIn(['intent', 'entity', 'response', 'conversation_flow', 'knowledge_base']).withMessage('Invalid type'),
    query('status').optional().isIn(['pending', 'validated', 'rejected', 'needs_review', 'archived']).withMessage('Invalid status'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const chatbotId = req.params.chatbotId;
      const { type, status, page = 1, limit = 20 } = req.query;

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

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const filter = { chatbotId };

      if (type) filter.type = type;
      if (status) filter.status = status;

      const [trainingData, total] = await Promise.all([
        Training.find(filter)
          .sort({ priority: -1, createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .populate('createdBy', 'username')
          .populate('validation.validatedBy', 'username'),
        Training.countDocuments(filter)
      ]);

      res.json({
        success: true,
        data: trainingData,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      logger.error('Error fetching training data:', error);
      res.status(500).json({
        error: 'Failed to fetch training data',
        message: error.message
      });
    }
  }
);

// Get specific training data
router.get('/:id',
  auth,
  [
    param('id').isMongoId().withMessage('Invalid training ID')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const trainingData = await Training.findById(req.params.id)
        .populate('chatbotId', 'name')
        .populate('createdBy', 'username')
        .populate('validation.validatedBy', 'username');

      if (!trainingData) {
        return res.status(404).json({
          error: 'Training data not found'
        });
      }

      // Verify access (user must own the chatbot)
      const chatbot = await Chatbot.findOne({
        _id: trainingData.chatbotId._id,
        createdBy: req.user.id,
        isActive: true
      });

      if (!chatbot) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: trainingData
      });
    } catch (error) {
      logger.error('Error fetching training data:', error);
      res.status(500).json({
        error: 'Failed to fetch training data',
        message: error.message
      });
    }
  }
);

// Update training data
router.put('/:id',
  auth,
  [
    param('id').isMongoId().withMessage('Invalid training ID'),
    body('input.text').optional().trim().isLength({ min: 1, max: 1000 }).withMessage('Input text must be 1-1000 characters'),
    body('expectedOutput').optional().isObject().withMessage('Expected output must be an object'),
    body('priority').optional().isInt({ min: 1, max: 10 }).withMessage('Priority must be 1-10')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const trainingData = await Training.findById(req.params.id);

      if (!trainingData) {
        return res.status(404).json({
          error: 'Training data not found'
        });
      }

      // Verify access (user must own the chatbot)
      const chatbot = await Chatbot.findOne({
        _id: trainingData.chatbotId,
        createdBy: req.user.id,
        isActive: true
      });

      if (!chatbot) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      const allowedUpdates = ['input', 'expectedOutput', 'metadata', 'priority', 'status'];
      const updates = {};

      allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      Object.assign(trainingData, updates);
      await trainingData.save();

      logger.info('Training data updated', {
        trainingId: trainingData._id,
        chatbotId: trainingData.chatbotId,
        userId: req.user.id,
        updates: Object.keys(updates)
      });

      res.json({
        success: true,
        data: trainingData
      });
    } catch (error) {
      logger.error('Error updating training data:', error);
      res.status(500).json({
        error: 'Failed to update training data',
        message: error.message
      });
    }
  }
);

// Validate training data
router.post('/:id/validate',
  auth,
  [
    param('id').isMongoId().withMessage('Invalid training ID'),
    body('isCorrect').isBoolean().withMessage('isCorrect must be a boolean'),
    body('feedback').optional().trim().isLength({ max: 500 }).withMessage('Feedback must be less than 500 characters')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { isCorrect, feedback } = req.body;

      const trainingData = await Training.findById(req.params.id);

      if (!trainingData) {
        return res.status(404).json({
          error: 'Training data not found'
        });
      }

      // Verify access (user must own the chatbot)
      const chatbot = await Chatbot.findOne({
        _id: trainingData.chatbotId,
        createdBy: req.user.id,
        isActive: true
      });

      if (!chatbot) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      await trainingData.validate(isCorrect, feedback, req.user.id);

      logger.info('Training data validated', {
        trainingId: trainingData._id,
        chatbotId: trainingData.chatbotId,
        userId: req.user.id,
        isCorrect
      });

      res.json({
        success: true,
        message: 'Training data validated successfully',
        data: trainingData
      });
    } catch (error) {
      logger.error('Error validating training data:', error);
      res.status(500).json({
        error: 'Failed to validate training data',
        message: error.message
      });
    }
  }
);

// Test training data
router.post('/:id/test',
  auth,
  [
    param('id').isMongoId().withMessage('Invalid training ID'),
    body('actualOutput').isObject().withMessage('Actual output is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { actualOutput } = req.body;

      const trainingData = await Training.findById(req.params.id);

      if (!trainingData) {
        return res.status(404).json({
          error: 'Training data not found'
        });
      }

      // Verify access (user must own the chatbot)
      const chatbot = await Chatbot.findOne({
        _id: trainingData.chatbotId,
        createdBy: req.user.id,
        isActive: true
      });

      if (!chatbot) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      await trainingData.test(actualOutput);

      logger.info('Training data tested', {
        trainingId: trainingData._id,
        chatbotId: trainingData.chatbotId,
        userId: req.user.id
      });

      res.json({
        success: true,
        message: 'Training data tested successfully',
        data: {
          performanceScore: trainingData.performanceScore,
          performance: trainingData.performance,
          validation: trainingData.validation
        }
      });
    } catch (error) {
      logger.error('Error testing training data:', error);
      res.status(500).json({
        error: 'Failed to test training data',
        message: error.message
      });
    }
  }
);

// Generate variations of training data
router.post('/:id/variations',
  auth,
  [
    param('id').isMongoId().withMessage('Invalid training ID'),
    body('count').optional().isInt({ min: 1, max: 20 }).withMessage('Count must be 1-20')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { count = 5 } = req.body;

      const trainingData = await Training.findById(req.params.id);

      if (!trainingData) {
        return res.status(404).json({
          error: 'Training data not found'
        });
      }

      // Verify access (user must own the chatbot)
      const chatbot = await Chatbot.findOne({
        _id: trainingData.chatbotId,
        createdBy: req.user.id,
        isActive: true
      });

      if (!chatbot) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      const variations = trainingData.generateVariations(count);
      const savedVariations = await Training.insertMany(variations);

      logger.info('Training data variations generated', {
        originalId: trainingData._id,
        chatbotId: trainingData.chatbotId,
        userId: req.user.id,
        variationsCount: savedVariations.length
      });

      res.status(201).json({
        success: true,
        message: `Generated ${savedVariations.length} variations`,
        data: savedVariations
      });
    } catch (error) {
      logger.error('Error generating training data variations:', error);
      res.status(500).json({
        error: 'Failed to generate variations',
        message: error.message
      });
    }
  }
);

// Get training performance statistics
router.get('/performance/:chatbotId',
  auth,
  [
    param('chatbotId').isMongoId().withMessage('Invalid chatbot ID'),
    query('type').optional().isIn(['intent', 'entity', 'response', 'conversation_flow', 'knowledge_base']).withMessage('Invalid type')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const chatbotId = req.params.chatbotId;
      const { type } = req.query;

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

      const performanceStats = await Training.getPerformanceStats(chatbotId, type);

      res.json({
        success: true,
        data: {
          chatbotId,
          type: type || 'all',
          performance: performanceStats[0] || {
            totalSamples: 0,
            averageAccuracy: 0,
            averagePrecision: 0,
            averageRecall: 0,
            averageF1Score: 0,
            highPerformingSamples: 0,
            lowPerformingSamples: 0
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching performance statistics:', error);
      res.status(500).json({
        error: 'Failed to fetch performance statistics',
        message: error.message
      });
    }
  }
);

// Get training data that needs review
router.get('/review/:chatbotId',
  auth,
  [
    param('chatbotId').isMongoId().withMessage('Invalid chatbot ID'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const chatbotId = req.params.chatbotId;
      const { limit = 50 } = req.query;

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

      const needsReview = await Training.getNeedsReview(chatbotId, parseInt(limit));

      res.json({
        success: true,
        data: needsReview
      });
    } catch (error) {
      logger.error('Error fetching training data for review:', error);
      res.status(500).json({
        error: 'Failed to fetch training data for review',
        message: error.message
      });
    }
  }
);

// Generate training set
router.post('/generate-set/:chatbotId',
  auth,
  [
    param('chatbotId').isMongoId().withMessage('Invalid chatbot ID'),
    body('type').optional().isIn(['intent', 'entity', 'response', 'conversation_flow', 'knowledge_base']).withMessage('Invalid type'),
    body('minSamples').optional().isInt({ min: 1 }).withMessage('Min samples must be positive'),
    body('maxSamples').optional().isInt({ min: 1, max: 10000 }).withMessage('Max samples must be 1-10000'),
    body('includeVariations').optional().isBoolean().withMessage('Include variations must be boolean'),
    body('balanceIntents').optional().isBoolean().withMessage('Balance intents must be boolean')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const chatbotId = req.params.chatbotId;
      const options = req.body;

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

      const trainingSet = await Training.generateTrainingSet(chatbotId, options);

      logger.info('Training set generated', {
        chatbotId,
        userId: req.user.id,
        samplesCount: trainingSet.length,
        options
      });

      res.json({
        success: true,
        data: {
          chatbotId,
          options,
          trainingSet,
          totalSamples: trainingSet.length
        }
      });
    } catch (error) {
      logger.error('Error generating training set:', error);
      res.status(500).json({
        error: 'Failed to generate training set',
        message: error.message
      });
    }
  }
);

// Import training data from conversations
router.post('/import-from-conversations/:chatbotId',
  auth,
  [
    param('chatbotId').isMongoId().withMessage('Invalid chatbot ID'),
    body('conversationIds').isArray({ min: 1 }).withMessage('Conversation IDs array is required'),
    body('conversationIds.*').isMongoId().withMessage('Invalid conversation ID'),
    body('minConfidence').optional().isFloat({ min: 0, max: 1 }).withMessage('Min confidence must be 0-1'),
    body('includeFailures').optional().isBoolean().withMessage('Include failures must be boolean'),
    body('autoValidate').optional().isBoolean().withMessage('Auto validate must be boolean')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const chatbotId = req.params.chatbotId;
      const { conversationIds, ...options } = req.body;

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

      // Verify conversation ownership
      const conversations = await Conversation.find({
        _id: { $in: conversationIds },
        chatbotId
      });

      if (conversations.length !== conversationIds.length) {
        return res.status(400).json({
          error: 'Some conversations not found or not accessible'
        });
      }

      // Extract training data from conversations
      const trainingData = [];
      
      for (const conversation of conversations) {
        for (const message of conversation.messages) {
          if (message.type === 'user' && message.intent) {
            trainingData.push({
              chatbotId,
              type: 'intent',
              input: {
                text: message.content.text,
                context: conversation.sessionId
              },
              expectedOutput: {
                intent: message.intent,
                entities: message.entities || []
              },
              metadata: {
                source: 'conversation',
                conversationId: conversation._id,
                sessionId: conversation.sessionId,
                difficulty: message.intent.confidence > 0.8 ? 'easy' : 
                           message.intent.confidence > 0.5 ? 'medium' : 'hard'
              },
              status: options.autoValidate && message.intent.confidence > (options.minConfidence || 0.7) ? 
                      'validated' : 'pending',
              createdBy: req.user.id
            });
          }
        }
      }

      const savedTrainingData = await Training.insertMany(trainingData);

      logger.info('Training data imported from conversations', {
        chatbotId,
        userId: req.user.id,
        conversationsCount: conversations.length,
        trainingDataCount: savedTrainingData.length
      });

      res.status(201).json({
        success: true,
        message: `Imported ${savedTrainingData.length} training samples from ${conversations.length} conversations`,
        data: {
          imported: savedTrainingData.length,
          conversations: conversations.length,
          trainingData: savedTrainingData
        }
      });
    } catch (error) {
      logger.error('Error importing training data from conversations:', error);
      res.status(500).json({
        error: 'Failed to import training data',
        message: error.message
      });
    }
  }
);

// Bulk delete training data
router.delete('/bulk',
  auth,
  [
    body('ids').isArray({ min: 1 }).withMessage('IDs array is required'),
    body('ids.*').isMongoId().withMessage('Invalid training ID')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { ids } = req.body;

      // Verify all training data belongs to user's chatbots
      const trainingData = await Training.find({ _id: { $in: ids } });
      const chatbotIds = [...new Set(trainingData.map(td => td.chatbotId.toString()))];
      
      const userChatbots = await Chatbot.find({
        _id: { $in: chatbotIds },
        createdBy: req.user.id,
        isActive: true
      });

      if (userChatbots.length !== chatbotIds.length) {
        return res.status(403).json({
          error: 'Access denied to some training data'
        });
      }

      const result = await Training.deleteMany({ _id: { $in: ids } });

      logger.info('Bulk training data deletion', {
        userId: req.user.id,
        deletedCount: result.deletedCount,
        requestedCount: ids.length
      });

      res.json({
        success: true,
        message: `Deleted ${result.deletedCount} training data entries`,
        data: {
          deletedCount: result.deletedCount,
          requestedCount: ids.length
        }
      });
    } catch (error) {
      logger.error('Error bulk deleting training data:', error);
      res.status(500).json({
        error: 'Failed to delete training data',
        message: error.message
      });
    }
  }
);

module.exports = router;
