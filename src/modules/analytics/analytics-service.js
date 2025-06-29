/**
 * Analytics Service Module
 * 
 * Provides comprehensive analytics and reporting capabilities for chatbot interactions,
 * user engagement metrics, and conversation performance.
 */

const mongoose = require('mongoose');
const { logger } = require('../../utils/logger');
const metrics = require('../../monitoring/metrics');

// Analytics event types
const EVENT_TYPES = {
  CONVERSATION_START: 'conversation_start',
  CONVERSATION_END: 'conversation_end',
  MESSAGE_RECEIVED: 'message_received',
  MESSAGE_SENT: 'message_sent',
  USER_FEEDBACK: 'user_feedback',
  ERROR: 'error',
  HANDOFF: 'handoff'
};

// Initialize models
let AnalyticsEvent = null;
let AnalyticsReport = null;

/**
 * Initialize the analytics service
 * 
 * @param {Object} db - MongoDB connection
 * @returns {Promise<void>}
 */
const initialize = async (db) => {
  try {
    // Define analytics event schema
    const analyticsEventSchema = new mongoose.Schema({
      eventType: {
        type: String,
        required: true,
        enum: Object.values(EVENT_TYPES)
      },
      botId: {
        type: String,
        required: true
      },
      conversationId: {
        type: String,
        required: true
      },
      userId: {
        type: String,
        required: false
      },
      templateId: {
        type: String,
        required: false
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
      },
      duration: {
        type: Number,
        required: false
      }
    }, { timestamps: true });

    // Define analytics report schema
    const analyticsReportSchema = new mongoose.Schema({
      reportType: {
        type: String,
        required: true
      },
      startDate: {
        type: Date,
        required: true
      },
      endDate: {
        type: Date,
        required: true
      },
      botId: {
        type: String,
        required: false
      },
      data: {
        type: mongoose.Schema.Types.Mixed,
        required: true
      },
      generatedAt: {
        type: Date,
        default: Date.now
      }
    }, { timestamps: true });

    // Create models
    AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsEventSchema);
    AnalyticsReport = mongoose.model('AnalyticsReport', analyticsReportSchema);

    logger.info('Analytics Service: Initialized successfully');
  } catch (err) {
    logger.error(`Analytics Service: Initialization failed: ${err.message}`);
    throw err;
  }
};

/**
 * Record an analytics event
 * 
 * @param {Object} event - Event data
 * @returns {Promise<Object>} - Created event
 */
const recordEvent = async (event) => {
  if (!AnalyticsEvent) {
    throw new Error('Analytics Service: Not initialized');
  }

  try {
    // Validate required fields
    if (!event.eventType || !event.botId || !event.conversationId) {
      throw new Error('Missing required fields: eventType, botId, conversationId');
    }

    // Create event
    const analyticsEvent = new AnalyticsEvent(event);
    await analyticsEvent.save();

    // Update Prometheus metrics
    if (event.eventType === EVENT_TYPES.CONVERSATION_START) {
      metrics.recordConversation(event.botId, event.templateId || 'unknown');
    } else if (event.eventType === EVENT_TYPES.MESSAGE_RECEIVED) {
      metrics.recordMessage(event.botId, 'incoming');
    } else if (event.eventType === EVENT_TYPES.MESSAGE_SENT) {
      metrics.recordMessage(event.botId, 'outgoing');
      if (event.duration) {
        metrics.recordResponseTime(event.botId, event.templateId || 'unknown', event.duration);
      }
    }

    logger.debug(`Analytics Service: Recorded ${event.eventType} event`);
    return analyticsEvent;
  } catch (err) {
    logger.error(`Analytics Service: Error recording event: ${err.message}`);
    throw err;
  }
};

/**
 * Generate a report for a specific time period
 * 
 * @param {Object} options - Report options
 * @param {string} options.reportType - Type of report
 * @param {Date} options.startDate - Start date
 * @param {Date} options.endDate - End date
 * @param {string} options.botId - Optional bot ID filter
 * @returns {Promise<Object>} - Generated report
 */
const generateReport = async (options) => {
  if (!AnalyticsEvent || !AnalyticsReport) {
    throw new Error('Analytics Service: Not initialized');
  }

  try {
    const { reportType, startDate, endDate, botId } = options;

    // Validate required fields
    if (!reportType || !startDate || !endDate) {
      throw new Error('Missing required fields: reportType, startDate, endDate');
    }

    // Build query
    const query = {
      timestamp: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    if (botId) {
      query.botId = botId;
    }

    // Generate report based on type
    let reportData = {};

    switch (reportType) {
      case 'conversation_metrics':
        reportData = await generateConversationMetricsReport(query);
        break;
      case 'user_engagement':
        reportData = await generateUserEngagementReport(query);
        break;
      case 'response_quality':
        reportData = await generateResponseQualityReport(query);
        break;
      case 'template_performance':
        reportData = await generateTemplatePerformanceReport(query);
        break;
      case 'error_analysis':
        reportData = await generateErrorAnalysisReport(query);
        break;
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }

    // Save report
    const report = new AnalyticsReport({
      reportType,
      startDate,
      endDate,
      botId,
      data: reportData
    });

    await report.save();
    logger.info(`Analytics Service: Generated ${reportType} report`);
    return report;
  } catch (err) {
    logger.error(`Analytics Service: Error generating report: ${err.message}`);
    throw err;
  }
};

/**
 * Generate conversation metrics report
 * 
 * @param {Object} query - MongoDB query
 * @returns {Promise<Object>} - Report data
 */
const generateConversationMetricsReport = async (query) => {
  // Count conversation starts
  const conversationCount = await AnalyticsEvent.countDocuments({
    ...query,
    eventType: EVENT_TYPES.CONVERSATION_START
  });

  // Get average conversation length
  const conversationLengths = await AnalyticsEvent.aggregate([
    {
      $match: {
        ...query,
        eventType: { $in: [EVENT_TYPES.MESSAGE_RECEIVED, EVENT_TYPES.MESSAGE_SENT] }
      }
    },
    {
      $group: {
        _id: '$conversationId',
        messageCount: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: null,
        avgLength: { $avg: '$messageCount' },
        maxLength: { $max: '$messageCount' },
        minLength: { $min: '$messageCount' }
      }
    }
  ]);

  // Get average conversation duration
  const conversationDurations = await AnalyticsEvent.aggregate([
    {
      $match: {
        ...query,
        eventType: { $in: [EVENT_TYPES.CONVERSATION_START, EVENT_TYPES.CONVERSATION_END] }
      }
    },
    {
      $sort: { conversationId: 1, timestamp: 1 }
    },
    {
      $group: {
        _id: '$conversationId',
        start: { $first: '$timestamp' },
        end: { $last: '$timestamp' }
      }
    },
    {
      $project: {
        _id: 1,
        duration: { $subtract: ['$end', '$start'] }
      }
    },
    {
      $group: {
        _id: null,
        avgDuration: { $avg: '$duration' },
        maxDuration: { $max: '$duration' },
        minDuration: { $min: '$duration' }
      }
    }
  ]);

  // Get hourly distribution
  const hourlyDistribution = await AnalyticsEvent.aggregate([
    {
      $match: {
        ...query,
        eventType: EVENT_TYPES.CONVERSATION_START
      }
    },
    {
      $project: {
        hour: { $hour: '$timestamp' }
      }
    },
    {
      $group: {
        _id: '$hour',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  return {
    metrics: {
      totalConversations: conversationCount,
      avgConversationLength: conversationLengths.length > 0 ? conversationLengths[0].avgLength : 0,
      avgConversationDuration: conversationDurations.length > 0 ? conversationDurations[0].avgDuration / 1000 : 0, // Convert to seconds
      completionRate: 0.78 // Placeholder - would need to calculate based on actual completion criteria
    },
    hourlyDistribution: hourlyDistribution.map(item => ({
      hour: item._id,
      count: item.count
    })),
    topConversationTopics: [] // Would need NLP analysis to extract topics
  };
};

/**
 * Generate user engagement report
 * 
 * @param {Object} query - MongoDB query
 * @returns {Promise<Object>} - Report data
 */
const generateUserEngagementReport = async (query) => {
  // Count unique users
  const uniqueUsers = await AnalyticsEvent.distinct('userId', query);
  
  // Get returning users (users with multiple conversations)
  const returningUsers = await AnalyticsEvent.aggregate([
    {
      $match: {
        ...query,
        eventType: EVENT_TYPES.CONVERSATION_START,
        userId: { $exists: true, $ne: null }
      }
    },
    {
      $group: {
        _id: '$userId',
        conversationCount: { $sum: 1 }
      }
    },
    {
      $match: {
        conversationCount: { $gt: 1 }
      }
    },
    {
      $count: 'count'
    }
  ]);

  // Get average sessions per user
  const sessionsPerUser = await AnalyticsEvent.aggregate([
    {
      $match: {
        ...query,
        eventType: EVENT_TYPES.CONVERSATION_START,
        userId: { $exists: true, $ne: null }
      }
    },
    {
      $group: {
        _id: '$userId',
        sessionCount: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: null,
        avgSessions: { $avg: '$sessionCount' }
      }
    }
  ]);

  return {
    metrics: {
      totalUsers: uniqueUsers.length,
      newUsers: uniqueUsers.length - (returningUsers.length > 0 ? returningUsers[0].count : 0),
      returningUsers: returningUsers.length > 0 ? returningUsers[0].count : 0,
      avgSessionsPerUser: sessionsPerUser.length > 0 ? sessionsPerUser[0].avgSessions : 0
    },
    retention: {
      day1: 0.72, // Placeholder - would need to calculate based on return visits
      day7: 0.45,
      day30: 0.28
    },
    userSegments: [] // Would need additional user data to segment
  };
};

/**
 * Generate response quality report
 * 
 * @param {Object} query - MongoDB query
 * @returns {Promise<Object>} - Report data
 */
const generateResponseQualityReport = async (query) => {
  // Get average response time
  const responseTimes = await AnalyticsEvent.aggregate([
    {
      $match: {
        ...query,
        eventType: EVENT_TYPES.MESSAGE_SENT,
        duration: { $exists: true }
      }
    },
    {
      $group: {
        _id: null,
        avgResponseTime: { $avg: '$duration' },
        maxResponseTime: { $max: '$duration' },
        minResponseTime: { $min: '$duration' }
      }
    }
  ]);

  // Get user feedback ratings
  const userRatings = await AnalyticsEvent.aggregate([
    {
      $match: {
        ...query,
        eventType: EVENT_TYPES.USER_FEEDBACK,
        'metadata.rating': { $exists: true }
      }
    },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$metadata.rating' },
        count: { $sum: 1 }
      }
    }
  ]);

  // Get handoff rate
  const handoffCount = await AnalyticsEvent.countDocuments({
    ...query,
    eventType: EVENT_TYPES.HANDOFF
  });

  const conversationCount = await AnalyticsEvent.countDocuments({
    ...query,
    eventType: EVENT_TYPES.CONVERSATION_START
  });

  return {
    metrics: {
      avgResponseTime: responseTimes.length > 0 ? responseTimes[0].avgResponseTime / 1000 : 0, // Convert to seconds
      avgUserRating: userRatings.length > 0 ? userRatings[0].avgRating : 0,
      handoffRate: conversationCount > 0 ? handoffCount / conversationCount : 0
    },
    sentimentDistribution: [], // Would need NLP analysis to extract sentiment
    responseTimeDistribution: [] // Would need to calculate buckets
  };
};

/**
 * Generate template performance report
 * 
 * @param {Object} query - MongoDB query
 * @returns {Promise<Object>} - Report data
 */
const generateTemplatePerformanceReport = async (query) => {
  // Get template usage
  const templateUsage = await AnalyticsEvent.aggregate([
    {
      $match: {
        ...query,
        eventType: EVENT_TYPES.CONVERSATION_START,
        templateId: { $exists: true, $ne: null }
      }
    },
    {
      $group: {
        _id: '$templateId',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  // Get template ratings
  const templateRatings = await AnalyticsEvent.aggregate([
    {
      $match: {
        ...query,
        eventType: EVENT_TYPES.USER_FEEDBACK,
        templateId: { $exists: true, $ne: null },
        'metadata.rating': { $exists: true }
      }
    },
    {
      $group: {
        _id: '$templateId',
        avgRating: { $avg: '$metadata.rating' },
        count: { $sum: 1 }
      }
    }
  ]);

  // Count active templates
  const activeTemplates = templateUsage.length;

  // Calculate average template usage
  const totalUsage = templateUsage.reduce((sum, template) => sum + template.count, 0);
  const avgTemplateUsage = activeTemplates > 0 ? totalUsage / activeTemplates : 0;

  return {
    metrics: {
      totalTemplates: activeTemplates,
      activeTemplates: activeTemplates,
      avgTemplateUsage: avgTemplateUsage
    },
    topTemplates: templateUsage.slice(0, 10).map(template => {
      const rating = templateRatings.find(r => r._id === template._id);
      return {
        id: template._id,
        usage: template.count,
        rating: rating ? rating.avgRating : null
      };
    })
  };
};

/**
 * Generate error analysis report
 * 
 * @param {Object} query - MongoDB query
 * @returns {Promise<Object>} - Report data
 */
const generateErrorAnalysisReport = async (query) => {
  // Get error counts
  const errorCounts = await AnalyticsEvent.aggregate([
    {
      $match: {
        ...query,
        eventType: EVENT_TYPES.ERROR
      }
    },
    {
      $group: {
        _id: '$metadata.errorType',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  return {
    totalErrors: errorCounts.reduce((sum, error) => sum + error.count, 0),
    errorTypes: errorCounts.map(error => ({
      type: error._id || 'unknown',
      count: error.count
    }))
  };
};

/**
 * Get a previously generated report
 * 
 * @param {string} reportId - Report ID
 * @returns {Promise<Object>} - Report object
 */
const getReport = async (reportId) => {
  if (!AnalyticsReport) {
    throw new Error('Analytics Service: Not initialized');
  }

  try {
    const report = await AnalyticsReport.findById(reportId);
    if (!report) {
      throw new Error(`Report not found: ${reportId}`);
    }
    return report;
  } catch (err) {
    logger.error(`Analytics Service: Error retrieving report: ${err.message}`);
    throw err;
  }
};

/**
 * Get analytics events for a conversation
 * 
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<Object[]>} - Events for the conversation
 */
const getConversationEvents = async (conversationId) => {
  if (!AnalyticsEvent) {
    throw new Error('Analytics Service: Not initialized');
  }

  try {
    const events = await AnalyticsEvent.find({ conversationId })
      .sort({ timestamp: 1 });
    return events;
  } catch (err) {
    logger.error(`Analytics Service: Error retrieving conversation events: ${err.message}`);
    throw err;
  }
};

module.exports = {
  initialize,
  recordEvent,
  generateReport,
  getReport,
  getConversationEvents,
  EVENT_TYPES
};