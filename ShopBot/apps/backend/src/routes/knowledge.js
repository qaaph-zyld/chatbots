const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const KnowledgeBase = require('../models/KnowledgeBase');
const Chatbot = require('../models/Chatbot');
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

// Create knowledge base entry
router.post('/',
  auth,
  [
    body('chatbotId').isMongoId().withMessage('Invalid chatbot ID'),
    body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title must be 1-200 characters'),
    body('content').trim().isLength({ min: 1, max: 10000 }).withMessage('Content must be 1-10000 characters'),
    body('category').trim().isLength({ min: 1, max: 100 }).withMessage('Category must be 1-100 characters'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('priority').optional().isInt({ min: 1, max: 10 }).withMessage('Priority must be 1-10')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { chatbotId, title, content, summary, category, tags, priority, metadata } = req.body;

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

      const knowledgeEntry = new KnowledgeBase({
        chatbotId,
        title,
        content,
        summary,
        category,
        tags: tags || [],
        priority: priority || 1,
        metadata: {
          ...metadata,
          source: 'manual'
        },
        createdBy: req.user.id
      });

      await knowledgeEntry.save();

      logger.info('Knowledge base entry created', {
        entryId: knowledgeEntry._id,
        chatbotId,
        userId: req.user.id,
        category
      });

      res.status(201).json({
        success: true,
        data: knowledgeEntry
      });
    } catch (error) {
      logger.error('Error creating knowledge base entry:', error);
      res.status(500).json({
        error: 'Failed to create knowledge base entry',
        message: error.message
      });
    }
  }
);

// Get knowledge base entries for a chatbot
router.get('/chatbot/:chatbotId',
  auth,
  [
    param('chatbotId').isMongoId().withMessage('Invalid chatbot ID'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
    query('category').optional().trim().isLength({ min: 1 }).withMessage('Invalid category'),
    query('tags').optional().isString().withMessage('Tags must be a string'),
    query('status').optional().isIn(['active', 'inactive', 'archived', 'pending_review']).withMessage('Invalid status')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const chatbotId = req.params.chatbotId;
      const { page = 1, limit = 20, category, tags, status = 'active' } = req.query;

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
      const filter = { chatbotId, status };

      if (category) {
        filter.category = category;
      }

      if (tags) {
        const tagArray = tags.split(',').map(tag => tag.trim());
        filter.tags = { $in: tagArray };
      }

      const [entries, total] = await Promise.all([
        KnowledgeBase.find(filter)
          .sort({ priority: -1, 'usage.relevanceScore': -1, createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .populate('createdBy', 'username'),
        KnowledgeBase.countDocuments(filter)
      ]);

      res.json({
        success: true,
        data: entries,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      logger.error('Error fetching knowledge base entries:', error);
      res.status(500).json({
        error: 'Failed to fetch knowledge base entries',
        message: error.message
      });
    }
  }
);

// Search knowledge base
router.get('/search',
  auth,
  [
    query('chatbotId').isMongoId().withMessage('Invalid chatbot ID'),
    query('q').trim().isLength({ min: 1 }).withMessage('Search query is required'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50'),
    query('category').optional().trim().isLength({ min: 1 }).withMessage('Invalid category'),
    query('tags').optional().isString().withMessage('Tags must be a string'),
    query('minRelevance').optional().isFloat({ min: 0, max: 1 }).withMessage('Min relevance must be 0-1')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { chatbotId, q, limit = 10, category, tags, minRelevance } = req.query;

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

      const searchOptions = {
        limit: parseInt(limit),
        category,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : undefined,
        minRelevance: minRelevance ? parseFloat(minRelevance) : 0
      };

      const results = await KnowledgeBase.search(chatbotId, q, searchOptions);

      // Record access for found entries
      const accessPromises = results.map(entry => entry.recordAccess(req.user.id));
      await Promise.all(accessPromises);

      logger.info('Knowledge base search performed', {
        chatbotId,
        query: q,
        resultsCount: results.length,
        userId: req.user.id
      });

      res.json({
        success: true,
        data: {
          query: q,
          results,
          totalFound: results.length
        }
      });
    } catch (error) {
      logger.error('Error searching knowledge base:', error);
      res.status(500).json({
        error: 'Failed to search knowledge base',
        message: error.message
      });
    }
  }
);

// Get a specific knowledge base entry
router.get('/:id',
  auth,
  [
    param('id').isMongoId().withMessage('Invalid entry ID')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const entry = await KnowledgeBase.findById(req.params.id)
        .populate('chatbotId', 'name')
        .populate('createdBy', 'username')
        .populate('relatedEntries.entryId', 'title category');

      if (!entry) {
        return res.status(404).json({
          error: 'Knowledge base entry not found'
        });
      }

      // Verify access (user must own the chatbot)
      const chatbot = await Chatbot.findOne({
        _id: entry.chatbotId._id,
        createdBy: req.user.id,
        isActive: true
      });

      if (!chatbot) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      // Record access
      await entry.recordAccess(req.user.id);

      // Get similar entries
      const similarEntries = await entry.findSimilar(5);

      res.json({
        success: true,
        data: {
          entry,
          similar: similarEntries
        }
      });
    } catch (error) {
      logger.error('Error fetching knowledge base entry:', error);
      res.status(500).json({
        error: 'Failed to fetch knowledge base entry',
        message: error.message
      });
    }
  }
);

// Update knowledge base entry
router.put('/:id',
  auth,
  [
    param('id').isMongoId().withMessage('Invalid entry ID'),
    body('title').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Title must be 1-200 characters'),
    body('content').optional().trim().isLength({ min: 1, max: 10000 }).withMessage('Content must be 1-10000 characters'),
    body('category').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Category must be 1-100 characters'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('priority').optional().isInt({ min: 1, max: 10 }).withMessage('Priority must be 1-10')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const entry = await KnowledgeBase.findById(req.params.id);

      if (!entry) {
        return res.status(404).json({
          error: 'Knowledge base entry not found'
        });
      }

      // Verify access (user must own the chatbot)
      const chatbot = await Chatbot.findOne({
        _id: entry.chatbotId,
        createdBy: req.user.id,
        isActive: true
      });

      if (!chatbot) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      const allowedUpdates = ['title', 'content', 'summary', 'category', 'tags', 'priority', 'status'];
      const updates = {};

      allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      // Increment version
      updates['metadata.version'] = entry.metadata.version + 1;

      Object.assign(entry, updates);
      await entry.save();

      logger.info('Knowledge base entry updated', {
        entryId: entry._id,
        chatbotId: entry.chatbotId,
        userId: req.user.id,
        updates: Object.keys(updates)
      });

      res.json({
        success: true,
        data: entry
      });
    } catch (error) {
      logger.error('Error updating knowledge base entry:', error);
      res.status(500).json({
        error: 'Failed to update knowledge base entry',
        message: error.message
      });
    }
  }
);

// Delete knowledge base entry
router.delete('/:id',
  auth,
  [
    param('id').isMongoId().withMessage('Invalid entry ID')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const entry = await KnowledgeBase.findById(req.params.id);

      if (!entry) {
        return res.status(404).json({
          error: 'Knowledge base entry not found'
        });
      }

      // Verify access (user must own the chatbot)
      const chatbot = await Chatbot.findOne({
        _id: entry.chatbotId,
        createdBy: req.user.id,
        isActive: true
      });

      if (!chatbot) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      await KnowledgeBase.findByIdAndDelete(req.params.id);

      logger.info('Knowledge base entry deleted', {
        entryId: req.params.id,
        chatbotId: entry.chatbotId,
        userId: req.user.id
      });

      res.json({
        success: true,
        message: 'Knowledge base entry deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting knowledge base entry:', error);
      res.status(500).json({
        error: 'Failed to delete knowledge base entry',
        message: error.message
      });
    }
  }
);

// Add feedback to knowledge base entry
router.post('/:id/feedback',
  auth,
  [
    param('id').isMongoId().withMessage('Invalid entry ID'),
    body('helpful').isBoolean().withMessage('Helpful must be a boolean'),
    body('comment').optional().trim().isLength({ max: 500 }).withMessage('Comment must be less than 500 characters')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { helpful, comment } = req.body;

      const entry = await KnowledgeBase.findById(req.params.id);

      if (!entry) {
        return res.status(404).json({
          error: 'Knowledge base entry not found'
        });
      }

      await entry.addFeedback(req.user.id, helpful, comment);

      logger.info('Knowledge base feedback added', {
        entryId: req.params.id,
        userId: req.user.id,
        helpful
      });

      res.json({
        success: true,
        message: 'Feedback added successfully',
        data: {
          helpfulnessRatio: entry.helpfulnessRatio
        }
      });
    } catch (error) {
      logger.error('Error adding feedback:', error);
      res.status(500).json({
        error: 'Failed to add feedback',
        message: error.message
      });
    }
  }
);

// Get knowledge base analytics
router.get('/analytics/:chatbotId',
  auth,
  [
    param('chatbotId').isMongoId().withMessage('Invalid chatbot ID')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const chatbotId = req.params.chatbotId;

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

      const [
        basicAnalytics,
        categoryStats,
        popularEntries,
        recentEntries
      ] = await Promise.all([
        KnowledgeBase.getAnalytics(chatbotId),
        KnowledgeBase.aggregate([
          { $match: { chatbotId: new mongoose.Types.ObjectId(chatbotId) } },
          {
            $group: {
              _id: '$category',
              count: { $sum: 1 },
              totalAccesses: { $sum: '$usage.accessCount' },
              averageRelevance: { $avg: '$usage.relevanceScore' }
            }
          },
          { $sort: { count: -1 } }
        ]),
        KnowledgeBase.getPopular(chatbotId, 10),
        KnowledgeBase.getRecent(chatbotId, 10)
      ]);

      res.json({
        success: true,
        data: {
          overview: basicAnalytics[0] || {},
          categories: categoryStats,
          popular: popularEntries,
          recent: recentEntries
        }
      });
    } catch (error) {
      logger.error('Error fetching knowledge base analytics:', error);
      res.status(500).json({
        error: 'Failed to fetch analytics',
        message: error.message
      });
    }
  }
);

// Bulk import knowledge base entries
router.post('/bulk-import',
  auth,
  [
    body('chatbotId').isMongoId().withMessage('Invalid chatbot ID'),
    body('entries').isArray({ min: 1, max: 100 }).withMessage('Entries must be an array of 1-100 items'),
    body('entries.*.title').trim().isLength({ min: 1, max: 200 }).withMessage('Each entry title must be 1-200 characters'),
    body('entries.*.content').trim().isLength({ min: 1, max: 10000 }).withMessage('Each entry content must be 1-10000 characters'),
    body('entries.*.category').trim().isLength({ min: 1, max: 100 }).withMessage('Each entry category must be 1-100 characters')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { chatbotId, entries } = req.body;

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

      const knowledgeEntries = entries.map(entry => ({
        ...entry,
        chatbotId,
        createdBy: req.user.id,
        metadata: {
          source: 'import',
          ...entry.metadata
        }
      }));

      const result = await KnowledgeBase.insertMany(knowledgeEntries);

      logger.info('Bulk knowledge base import completed', {
        chatbotId,
        userId: req.user.id,
        entriesCount: result.length
      });

      res.status(201).json({
        success: true,
        message: `Successfully imported ${result.length} knowledge base entries`,
        data: {
          imported: result.length,
          entries: result
        }
      });
    } catch (error) {
      logger.error('Error bulk importing knowledge base entries:', error);
      res.status(500).json({
        error: 'Failed to import knowledge base entries',
        message: error.message
      });
    }
  }
);

module.exports = router;
