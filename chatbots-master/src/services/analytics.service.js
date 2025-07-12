/**
 * Analytics Service
 * 
 * Service for managing analytics data in the chatbot platform
 */

require('@src/utils');
require('@src/data');

/**
 * Record analytics data
 * @param {string} chatbotId - Chatbot ID
 * @param {string} period - Period type (daily, weekly, monthly, yearly)
 * @param {Date} date - Date for the analytics record
 * @param {Object} metrics - Metrics data
 * @returns {Promise<Object>} Created or updated analytics record
 */
const recordAnalytics = async (chatbotId, period, date, metrics) => {
  try {
    // Ensure database connection
    await databaseService.connect();
    
    // Find existing record or create new one
    const analyticsRepo = repositories.analytics;
    let analytics = await analyticsRepo.findOrCreate(chatbotId, period, date);
    
    // Update metrics
    for (const category in metrics) {
      if (!analytics.metrics[category]) {
        analytics.metrics[category] = {};
      }
      
      for (const metric in metrics[category]) {
        if (analytics.metrics[category][metric] === undefined) {
          analytics.metrics[category][metric] = metrics[category][metric];
        } else {
          analytics.metrics[category][metric] += metrics[category][metric];
        }
      }
    }
    
    // Save analytics
    await analytics.save();
    logger.debug('Analytics recorded', { chatbotId, period, date });
    return analytics;
  } catch (error) {
    logger.error('Error recording analytics', { error, chatbotId, period });
    throw error;
  }
};

/**
 * Get analytics by period
 * @param {string} chatbotId - Chatbot ID
 * @param {string} period - Period type (daily, weekly, monthly, yearly)
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} Analytics records
 */
const getAnalyticsByPeriod = async (chatbotId, period, startDate, endDate) => {
  try {
    // Ensure database connection
    await databaseService.connect();
    
    // Use repository with optimized query and caching
    const analyticsRepo = repositories.analytics;
    const analytics = await analyticsRepo.getByPeriod(chatbotId, period, startDate, endDate);
    
    return analytics;
  } catch (error) {
    logger.error('Error getting analytics by period', { chatbotId, period, error: error.message });
    throw error;
  }
};

/**
 * Get latest analytics
 * @param {string} chatbotId - Chatbot ID
 * @param {string} period - Period type (daily, weekly, monthly, yearly)
 * @param {number} limit - Maximum number of records to return
 * @returns {Promise<Array>} Latest analytics records
 */
const getLatestAnalytics = async (chatbotId, period = 'daily', limit = 30) => {
  try {
    // Ensure database connection
    await databaseService.connect();
    
    // Use repository with optimized query and caching
    const analyticsRepo = repositories.analytics;
    const analytics = await analyticsRepo.getLatest(chatbotId, period, limit);
    
    return analytics;
  } catch (error) {
    logger.error('Error getting latest analytics', { chatbotId, period, error: error.message });
    throw error;
  }
};

/**
 * Get all-time analytics summary
 * @param {string} chatbotId - Chatbot ID
 * @returns {Promise<Object>} All-time analytics summary
 */
const getAllTimeAnalytics = async (chatbotId) => {
  try {
    // Ensure database connection
    await databaseService.connect();
    
    // Use repository with optimized aggregation pipeline and caching
    const analyticsRepo = repositories.analytics;
    const conversationRepo = repositories.conversation;
    
    // Get analytics summary from repository
    const analyticsSummary = await analyticsRepo.generateSummary(chatbotId);
    
    // Get conversation statistics
    const startDate = new Date(0); // Beginning of time
    const endDate = new Date(); // Now
    const conversationStats = await conversationRepo.getStatistics(chatbotId, startDate, endDate);
    
    // Get conversation insights for user retention data
    const conversationInsights = await conversationRepo.getInsights(chatbotId, startDate, endDate);
    
    // Combine data into comprehensive summary
    const summary = {
      sessions: {
        total: 0,
        average: 0
      },
      messages: {
        total: 0,
        average: 0
      },
      users: {
        total: conversationStats.uniqueUsers || 0,
        returning: conversationInsights.userRetention.returningUsers || 0
      },
      engagement: {
        averageSessionDuration: conversationStats.averageDuration || 0,
        averageMessagesPerSession: conversationStats.averageMessages || 0
      },
      periods: {}
    };
    
    // Process analytics by period
    for (const period in analyticsSummary) {
      const periodData = analyticsSummary[period];
      
      summary.sessions.total += periodData.totalSessions || 0;
      summary.messages.total += periodData.totalMessages || 0;
      
      summary.periods[period] = {
        sessions: periodData.totalSessions || 0,
        messages: periodData.totalMessages || 0,
        users: periodData.totalUsers || 0,
        averageSessionDuration: periodData.averageSessionDuration || 0,
        dateRange: {
          start: periodData.latestDate ? new Date(periodData.latestDate) : null,
          end: periodData.latestDate ? new Date(periodData.latestDate) : null
        }
      };
    }
    
    logger.debug('Retrieved all-time analytics summary', { chatbotId });
    return summary;
  } catch (error) {
    logger.error('Error getting all-time analytics', { error, chatbotId });
    throw error;
  }
};

/**
 * Generate analytics report
 * @param {string} chatbotId - Chatbot ID
 * @param {string} period - Period type (daily, weekly, monthly, yearly)
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} Generated report
 */
const generateReport = async (chatbotId, period, startDate, endDate) => {
  try {
    // Get analytics data for the specified period
    const analyticsData = await getAnalyticsByPeriod(chatbotId, period, startDate, endDate);
    
    // Initialize report structure
    const report = {
      chatbotId,
      period,
      timeRange: {
        start: startDate,
        end: endDate
      },
      summary: {
        conversations: {
          total: 0,
          completed: 0,
          abandoned: 0,
          growth: 0
        },
        messages: {
          total: 0,
          user: 0,
          bot: 0,
          growth: 0
        },
        users: {
          total: 0,
          new: 0,
          returning: 0,
          growth: 0
        },
        engagement: {
          averageSessionDuration: 0,
          averageMessagesPerConversation: 0,
          averageResponseTime: 0
        },
        performance: {
          successRate: 0,
          handoffRate: 0
        },
        satisfaction: {
          averageRating: 0,
          feedbackCount: 0,
          positiveRate: 0
        }
      },
      trends: {
        conversations: [],
        messages: [],
        users: [],
        satisfaction: []
      },
      topIntents: [],
      topQueries: [],
      deviceDistribution: {},
      geographicDistribution: []
    };
    
    // Process analytics data
    if (analyticsData.length > 0) {
      let totalRatings = 0;
      
      analyticsData.forEach(record => {
        // Add to summary
        if (record.metrics.conversations) {
          report.summary.conversations.total += record.metrics.conversations.total || 0;
          report.summary.conversations.completed += record.metrics.conversations.completed || 0;
          report.summary.conversations.abandoned += record.metrics.conversations.abandoned || 0;
        }
        
        if (record.metrics.messages) {
          report.summary.messages.total += record.metrics.messages.total || 0;
          report.summary.messages.user += record.metrics.messages.user || 0;
          report.summary.messages.bot += record.metrics.messages.bot || 0;
        }
        
        if (record.metrics.users) {
          report.summary.users.total += record.metrics.users.total || 0;
          report.summary.users.new += record.metrics.users.new || 0;
          report.summary.users.returning += record.metrics.users.returning || 0;
        }
        
        if (record.metrics.satisfaction) {
          if (record.metrics.satisfaction.averageRating && record.metrics.satisfaction.feedbackCount) {
            totalRatings += (record.metrics.satisfaction.averageRating * record.metrics.satisfaction.feedbackCount);
            report.summary.satisfaction.feedbackCount += record.metrics.satisfaction.feedbackCount;
          }
        }
        
        // Add to trends
        report.trends.conversations.push({
          date: record.date,
          total: record.metrics.conversations?.total || 0,
          completed: record.metrics.conversations?.completed || 0,
          abandoned: record.metrics.conversations?.abandoned || 0
        });
        
        report.trends.messages.push({
          date: record.date,
          total: record.metrics.messages?.total || 0,
          user: record.metrics.messages?.user || 0,
          bot: record.metrics.messages?.bot || 0
        });
        
        report.trends.users.push({
          date: record.date,
          total: record.metrics.users?.total || 0,
          new: record.metrics.users?.new || 0,
          returning: record.metrics.users?.returning || 0
        });
        
        report.trends.satisfaction.push({
          date: record.date,
          averageRating: record.metrics.satisfaction?.averageRating || 0,
          feedbackCount: record.metrics.satisfaction?.feedbackCount || 0
        });
        
        // Collect top intents
        if (record.topIntents && record.topIntents.length > 0) {
          record.topIntents.forEach(intent => {
            const existingIntent = report.topIntents.find(i => i.intent === intent.intent);
            if (existingIntent) {
              existingIntent.count += intent.count;
              existingIntent.successRate = (existingIntent.successRate + intent.successRate) / 2;
            } else {
              report.topIntents.push({ ...intent });
            }
          });
        }
        
        // Collect top queries
        if (record.topQueries && record.topQueries.length > 0) {
          record.topQueries.forEach(query => {
            const existingQuery = report.topQueries.find(q => q.query === query.query);
            if (existingQuery) {
              existingQuery.count += query.count;
            } else {
              report.topQueries.push({ ...query });
            }
          });
        }
        
        // Collect device distribution
        if (record.deviceStats) {
          for (const device in record.deviceStats) {
            if (!report.deviceDistribution[device]) {
              report.deviceDistribution[device] = 0;
            }
            report.deviceDistribution[device] += record.deviceStats[device];
          }
        }
        
        // Collect geographic distribution
        if (record.geographicStats && record.geographicStats.length > 0) {
          record.geographicStats.forEach(geo => {
            const existingGeo = report.geographicDistribution.find(g => g.country === geo.country);
            if (existingGeo) {
              existingGeo.count += geo.count;
            } else {
              report.geographicDistribution.push({ ...geo });
            }
          });
        }
      });
      
      // Calculate averages and rates
      if (report.summary.conversations.total > 0) {
        report.summary.conversations.completionRate = report.summary.conversations.completed / report.summary.conversations.total;
        report.summary.engagement.averageMessagesPerConversation = report.summary.messages.total / report.summary.conversations.total;
      }
      
      if (report.summary.satisfaction.feedbackCount > 0) {
        report.summary.satisfaction.averageRating = totalRatings / report.summary.satisfaction.feedbackCount;
      }
      
      const totalPerformance = report.summary.performance.successfulResponses + report.summary.performance.failedResponses;
      if (totalPerformance > 0) {
        report.summary.performance.successRate = report.summary.performance.successfulResponses / totalPerformance;
      }
      
      if (report.summary.messages.total > 0) {
        report.summary.performance.handoffRate = report.summary.performance.handoffs / report.summary.messages.total;
      }
      
      // Sort top intents and queries
      report.topIntents.sort((a, b) => b.count - a.count);
      report.topQueries.sort((a, b) => b.count - a.count);
      report.geographicDistribution.sort((a, b) => b.count - a.count);
      
      // Limit to top 10
      report.topIntents = report.topIntents.slice(0, 10);
      report.topQueries = report.topQueries.slice(0, 10);
      report.geographicDistribution = report.geographicDistribution.slice(0, 10);
    }
    
    logger.debug('Generated analytics report', { chatbotId, period });
    return report;
  } catch (error) {
    logger.error('Error generating analytics report', { error, chatbotId, period });
    throw error;
  }
};

module.exports = {
  recordAnalytics,
  getAnalyticsByPeriod,
  getLatestAnalytics,
  getAllTimeAnalytics,
  generateReport
};
