const express = require('express');
const { param, query, validationResult } = require('express-validator');
const Chatbot = require('../models/Chatbot');
const Conversation = require('../models/Conversation');
const Session = require('../models/Session');
const User = require('../models/User');
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

// Get dashboard overview analytics
router.get('/dashboard',
  auth,
  async (req, res) => {
    try {
      const userId = req.user.id;

      // Get user's chatbots
      const userChatbots = await Chatbot.find({ createdBy: userId, isActive: true });
      const chatbotIds = userChatbots.map(bot => bot._id);

      // Aggregate data
      const [
        totalConversations,
        totalMessages,
        activeSessions,
        recentConversations
      ] = await Promise.all([
        Conversation.countDocuments({ chatbotId: { $in: chatbotIds } }),
        Conversation.aggregate([
          { $match: { chatbotId: { $in: chatbotIds } } },
          { $group: { _id: null, total: { $sum: '$summary.totalMessages' } } }
        ]),
        Session.countDocuments({ chatbotId: { $in: chatbotIds }, isActive: true }),
        Conversation.find({ chatbotId: { $in: chatbotIds } })
          .sort({ createdAt: -1 })
          .limit(10)
          .populate('chatbotId', 'name')
      ]);

      // Calculate metrics
      const totalMessagesCount = totalMessages[0]?.total || 0;
      const averageMessagesPerConversation = totalConversations > 0 ? 
        Math.round(totalMessagesCount / totalConversations) : 0;

      // Get sentiment distribution
      const sentimentStats = await Conversation.aggregate([
        { $match: { chatbotId: { $in: chatbotIds } } },
        { $group: {
          _id: '$summary.overallSentiment.label',
          count: { $sum: 1 }
        }}
      ]);

      // Get conversation trends (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const conversationTrends = await Conversation.aggregate([
        { 
          $match: { 
            chatbotId: { $in: chatbotIds },
            createdAt: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ]);

      res.json({
        success: true,
        data: {
          overview: {
            totalChatbots: userChatbots.length,
            totalConversations,
            totalMessages: totalMessagesCount,
            activeSessions,
            averageMessagesPerConversation
          },
          sentiment: sentimentStats.reduce((acc, item) => {
            acc[item._id || 'unknown'] = item.count;
            return acc;
          }, {}),
          trends: conversationTrends,
          recentConversations: recentConversations.map(conv => ({
            id: conv._id,
            chatbotName: conv.chatbotId.name,
            messageCount: conv.summary.totalMessages,
            status: conv.status,
            sentiment: conv.summary.overallSentiment?.label,
            createdAt: conv.createdAt
          }))
        }
      });
    } catch (error) {
      logger.error('Error fetching dashboard analytics:', error);
      res.status(500).json({
        error: 'Failed to fetch analytics',
        message: error.message
      });
    }
  }
);

// Get analytics for a specific chatbot
router.get('/chatbot/:id',
  auth,
  [
    param('id').isMongoId().withMessage('Invalid chatbot ID'),
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date'),
    query('granularity').optional().isIn(['hour', 'day', 'week', 'month']).withMessage('Invalid granularity')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const chatbotId = req.params.id;
      const { startDate, endDate, granularity = 'day' } = req.query;

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

      // Build date filter
      const dateFilter = { chatbotId };
      if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
        if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
      }

      // Get basic metrics
      const [
        conversationStats,
        messageStats,
        sessionStats,
        sentimentStats,
        intentStats
      ] = await Promise.all([
        // Conversation statistics
        Conversation.aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: null,
              totalConversations: { $sum: 1 },
              completedConversations: {
                $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
              },
              abandonedConversations: {
                $sum: { $cond: [{ $eq: ['$status', 'abandoned'] }, 1, 0] }
              },
              averageMessages: { $avg: '$summary.totalMessages' },
              averageResponseTime: { $avg: '$summary.averageResponseTime' }
            }
          }
        ]),

        // Message statistics
        Conversation.aggregate([
          { $match: dateFilter },
          { $unwind: '$messages' },
          {
            $group: {
              _id: '$messages.type',
              count: { $sum: 1 },
              averageProcessingTime: { $avg: '$messages.metadata.processingTime' }
            }
          }
        ]),

        // Session statistics
        Session.aggregate([
          { $match: { chatbotId, ...dateFilter } },
          {
            $group: {
              _id: null,
              totalSessions: { $sum: 1 },
              activeSessions: {
                $sum: { $cond: ['$isActive', 1, 0] }
              },
              averageMessageCount: { $avg: '$analytics.messageCount' },
              averageSentiment: { $avg: '$analytics.averageSentiment' }
            }
          }
        ]),

        // Sentiment distribution
        Conversation.aggregate([
          { $match: dateFilter },
          { $unwind: '$messages' },
          { $match: { 'messages.sentiment.label': { $exists: true } } },
          {
            $group: {
              _id: '$messages.sentiment.label',
              count: { $sum: 1 },
              averageScore: { $avg: '$messages.sentiment.score' }
            }
          }
        ]),

        // Intent distribution
        Conversation.aggregate([
          { $match: dateFilter },
          { $unwind: '$messages' },
          { $match: { 'messages.intent.name': { $exists: true } } },
          {
            $group: {
              _id: '$messages.intent.name',
              count: { $sum: 1 },
              averageConfidence: { $avg: '$messages.intent.confidence' }
            }
          },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ])
      ]);

      // Get time-series data based on granularity
      const getDateFormat = (granularity) => {
        switch (granularity) {
          case 'hour': return '%Y-%m-%d %H:00';
          case 'day': return '%Y-%m-%d';
          case 'week': return '%Y-W%U';
          case 'month': return '%Y-%m';
          default: return '%Y-%m-%d';
        }
      };

      const timeSeriesData = await Conversation.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: {
              $dateToString: { 
                format: getDateFormat(granularity), 
                date: '$createdAt' 
              }
            },
            conversations: { $sum: 1 },
            messages: { $sum: '$summary.totalMessages' },
            averageSentiment: { $avg: '$summary.overallSentiment.score' }
          }
        },
        { $sort: { '_id': 1 } }
      ]);

      // Get top performing hours/days
      const performanceData = await Conversation.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: {
              hour: { $hour: '$createdAt' },
              dayOfWeek: { $dayOfWeek: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          chatbot: {
            id: chatbot._id,
            name: chatbot.name,
            engine: chatbot.engine
          },
          period: {
            startDate: startDate || 'all time',
            endDate: endDate || 'now',
            granularity
          },
          metrics: {
            conversations: conversationStats[0] || {},
            messages: messageStats.reduce((acc, item) => {
              acc[item._id] = {
                count: item.count,
                averageProcessingTime: item.averageProcessingTime
              };
              return acc;
            }, {}),
            sessions: sessionStats[0] || {},
            sentiment: sentimentStats.reduce((acc, item) => {
              acc[item._id] = {
                count: item.count,
                averageScore: item.averageScore
              };
              return acc;
            }, {}),
            intents: intentStats.map(item => ({
              name: item._id,
              count: item.count,
              averageConfidence: item.averageConfidence
            }))
          },
          timeSeries: timeSeriesData,
          performance: {
            byHour: performanceData.reduce((acc, item) => {
              acc[item._id.hour] = (acc[item._id.hour] || 0) + item.count;
              return acc;
            }, {}),
            byDayOfWeek: performanceData.reduce((acc, item) => {
              acc[item._id.dayOfWeek] = (acc[item._id.dayOfWeek] || 0) + item.count;
              return acc;
            }, {})
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching chatbot analytics:', error);
      res.status(500).json({
        error: 'Failed to fetch chatbot analytics',
        message: error.message
      });
    }
  }
);

// Get user engagement analytics
router.get('/engagement',
  auth,
  [
    query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period'),
    query('chatbotId').optional().isMongoId().withMessage('Invalid chatbot ID')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { period = '30d', chatbotId } = req.query;
      
      // Calculate date range
      const periodDays = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365
      };
      
      const startDate = new Date(Date.now() - periodDays[period] * 24 * 60 * 60 * 1000);
      
      // Build filter
      const filter = { createdAt: { $gte: startDate } };
      
      if (chatbotId) {
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
        
        filter.chatbotId = chatbotId;
      } else {
        // Get all user's chatbots
        const userChatbots = await Chatbot.find({ createdBy: req.user.id, isActive: true });
        filter.chatbotId = { $in: userChatbots.map(bot => bot._id) };
      }

      // Get engagement metrics
      const [
        userRetention,
        sessionDuration,
        messageFrequency,
        satisfactionRatings
      ] = await Promise.all([
        // User retention (returning users)
        Session.aggregate([
          { $match: filter },
          { $match: { userId: { $exists: true, $ne: null } } },
          {
            $group: {
              _id: '$userId',
              sessionCount: { $sum: 1 },
              firstSession: { $min: '$createdAt' },
              lastSession: { $max: '$createdAt' }
            }
          },
          {
            $group: {
              _id: null,
              totalUsers: { $sum: 1 },
              returningUsers: {
                $sum: { $cond: [{ $gt: ['$sessionCount', 1] }, 1, 0] }
              },
              averageSessionsPerUser: { $avg: '$sessionCount' }
            }
          }
        ]),

        // Session duration analysis
        Session.aggregate([
          { $match: filter },
          { $match: { 'analytics.duration': { $exists: true } } },
          {
            $group: {
              _id: null,
              averageDuration: { $avg: '$analytics.duration' },
              medianDuration: { $avg: '$analytics.duration' }, // Simplified median
              shortSessions: {
                $sum: { $cond: [{ $lt: ['$analytics.duration', 60000] }, 1, 0] }
              },
              longSessions: {
                $sum: { $cond: [{ $gt: ['$analytics.duration', 300000] }, 1, 0] }
              },
              totalSessions: { $sum: 1 }
            }
          }
        ]),

        // Message frequency patterns
        Conversation.aggregate([
          { $match: filter },
          { $unwind: '$messages' },
          {
            $group: {
              _id: {
                hour: { $hour: '$messages.timestamp' },
                type: '$messages.type'
              },
              count: { $sum: 1 }
            }
          }
        ]),

        // Satisfaction ratings
        Session.aggregate([
          { $match: filter },
          { $match: { 'analytics.satisfactionRating': { $exists: true } } },
          {
            $group: {
              _id: '$analytics.satisfactionRating',
              count: { $sum: 1 }
            }
          }
        ])
      ]);

      res.json({
        success: true,
        data: {
          period,
          userRetention: userRetention[0] || {
            totalUsers: 0,
            returningUsers: 0,
            averageSessionsPerUser: 0
          },
          sessionDuration: sessionDuration[0] || {
            averageDuration: 0,
            shortSessions: 0,
            longSessions: 0,
            totalSessions: 0
          },
          messageFrequency: messageFrequency.reduce((acc, item) => {
            const key = `${item._id.hour}_${item._id.type}`;
            acc[key] = item.count;
            return acc;
          }, {}),
          satisfaction: satisfactionRatings.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {})
        }
      });
    } catch (error) {
      logger.error('Error fetching engagement analytics:', error);
      res.status(500).json({
        error: 'Failed to fetch engagement analytics',
        message: error.message
      });
    }
  }
);

// Export analytics data
router.get('/export',
  auth,
  [
    query('chatbotId').optional().isMongoId().withMessage('Invalid chatbot ID'),
    query('format').optional().isIn(['json', 'csv']).withMessage('Invalid format'),
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { chatbotId, format = 'json', startDate, endDate } = req.query;

      // Build filter
      const filter = {};
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      if (chatbotId) {
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
        
        filter.chatbotId = chatbotId;
      } else {
        // Get all user's chatbots
        const userChatbots = await Chatbot.find({ createdBy: req.user.id, isActive: true });
        filter.chatbotId = { $in: userChatbots.map(bot => bot._id) };
      }

      // Get conversations with messages
      const conversations = await Conversation.find(filter)
        .populate('chatbotId', 'name engine')
        .sort({ createdAt: -1 })
        .limit(1000); // Limit for performance

      if (format === 'csv') {
        // Convert to CSV format
        const csvData = conversations.map(conv => ({
          conversationId: conv._id,
          chatbotName: conv.chatbotId.name,
          chatbotEngine: conv.chatbotId.engine,
          sessionId: conv.sessionId,
          userId: conv.userId || 'anonymous',
          status: conv.status,
          totalMessages: conv.summary.totalMessages,
          userMessages: conv.summary.userMessages,
          botMessages: conv.summary.botMessages,
          averageResponseTime: conv.summary.averageResponseTime,
          overallSentiment: conv.summary.overallSentiment?.label,
          sentimentScore: conv.summary.overallSentiment?.score,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt
        }));

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="analytics-${Date.now()}.csv"`);
        
        // Simple CSV conversion
        const headers = Object.keys(csvData[0] || {});
        const csvContent = [
          headers.join(','),
          ...csvData.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
        ].join('\n');
        
        res.send(csvContent);
      } else {
        // JSON format
        res.json({
          success: true,
          data: {
            exportedAt: new Date(),
            totalConversations: conversations.length,
            filter,
            conversations
          }
        });
      }
    } catch (error) {
      logger.error('Error exporting analytics:', error);
      res.status(500).json({
        error: 'Failed to export analytics',
        message: error.message
      });
    }
  }
);

module.exports = router;
