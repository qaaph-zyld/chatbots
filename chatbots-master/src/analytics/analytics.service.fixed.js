/**
 * Analytics Service
 * 
 * Provides conversation analytics and insights for chatbots
 */

const mongoose = require('mongoose');
require('@src/utils');

// Define analytics schema
const AnalyticsSchema = new mongoose.Schema({
  chatbotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chatbot',
    required: true
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'all'],
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  metrics: {
    messageCount: {
      type: Number,
      default: 0
    },
    userMessageCount: {
      type: Number,
      default: 0
    },
    botMessageCount: {
      type: Number,
      default: 0
    },
    averageResponseTime: {
      type: Number,
      default: 0
    },
    conversationCount: {
      type: Number,
      default: 0
    },
    uniqueUserCount: {
      type: Number,
      default: 0
    },
    averageConversationLength: {
      type: Number,
      default: 0
    },
    averageUserMessageLength: {
      type: Number,
      default: 0
    },
    averageBotMessageLength: {
      type: Number,
      default: 0
    }
  },
  sentimentAnalysis: {
    positive: {
      type: Number,
      default: 0
    },
    neutral: {
      type: Number,
      default: 0
    },
    negative: {
      type: Number,
      default: 0
    }
  },
  intentAnalysis: {
    type: Map,
    of: Number,
    default: {}
  },
  topEntities: {
    type: Map,
    of: Number,
    default: {}
  },
  topUserQueries: [{
    query: String,
    count: Number
  }],
  topFailedQueries: [{
    query: String,
    count: Number
  }],
  responseRatings: {
    positive: {
      type: Number,
      default: 0
    },
    neutral: {
      type: Number,
      default: 0
    },
    negative: {
      type: Number,
      default: 0
    }
  },
  inputTypes: {
    text: {
      type: Number,
      default: 0
    },
    image: {
      type: Number,
      default: 0
    },
    audio: {
      type: Number,
      default: 0
    },
    location: {
      type: Number,
      default: 0
    },
    other: {
      type: Number,
      default: 0
    }
  },
  outputTypes: {
    text: {
      type: Number,
      default: 0
    },
    image: {
      type: Number,
      default: 0
    },
    audio: {
      type: Number,
      default: 0
    },
    card: {
      type: Number,
      default: 0
    },
    carousel: {
      type: Number,
      default: 0
    },
    quickReply: {
      type: Number,
      default: 0
    },
    other: {
      type: Number,
      default: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create model
const Analytics = mongoose.model('Analytics', AnalyticsSchema);

/**
 * Analytics Service class
 */
class AnalyticsService {
  /**
   * Constructor
   */
  constructor() {
    this.messageBuffer = [];
    this.bufferSize = 100; // Process analytics in batches
    this.processingInterval = 60000; // Process buffer every minute
    
    // Start periodic processing
    this.startPeriodicProcessing();
    
    logger.info('Analytics Service initialized');
  }
  
  /**
   * Start periodic processing of analytics buffer
   * @private
   */
  startPeriodicProcessing() {
    setInterval(() => {
      this.processBuffer();
    }, this.processingInterval);
  }
  
  /**
   * Process message buffer
   * @private
   */
  async processBuffer() {
    if (this.messageBuffer.length === 0) {
      return;
    }
    
    logger.debug(`Processing ${this.messageBuffer.length} messages in analytics buffer`);
    
    // Group messages by chatbot and date
    const messageGroups = this.groupMessagesByDate(this.messageBuffer);
    
    // Process each group
    for (const [chatbotId, dateGroups] of Object.entries(messageGroups)) {
      for (const [period, messages] of Object.entries(dateGroups)) {
        await this.processMessageGroup(chatbotId, period, messages);
      }
    }
    
    // Clear buffer
    this.messageBuffer = [];
    
    logger.debug('Analytics buffer processed');
  }
  
  /**
   * Group messages by date and period
   * @param {Array<Object>} messages - Messages to group
   * @returns {Object} - Grouped messages
   * @private
   */
  groupMessagesByDate(messages) {
    const groups = {};
    
    for (const message of messages) {
      const { chatbotId } = message;
      
      if (!groups[chatbotId]) {
        groups[chatbotId] = {
          daily: {},
          weekly: {},
          monthly: {},
          all: []
        };
      }
      
      // Add to all-time group
      groups[chatbotId].all.push(message);
      
      // Format dates for different periods
      const dailyDate = this.formatDate(message.timestamp, 'daily');
      const weeklyDate = this.formatDate(message.timestamp, 'weekly');
      const monthlyDate = this.formatDate(message.timestamp, 'monthly');
      
      // Add to daily group
      if (!groups[chatbotId].daily[dailyDate]) {
        groups[chatbotId].daily[dailyDate] = [];
      }
      groups[chatbotId].daily[dailyDate].push(message);
      
      // Add to weekly group
      if (!groups[chatbotId].weekly[weeklyDate]) {
        groups[chatbotId].weekly[weeklyDate] = [];
      }
      groups[chatbotId].weekly[weeklyDate].push(message);
      
      // Add to monthly group
      if (!groups[chatbotId].monthly[monthlyDate]) {
        groups[chatbotId].monthly[monthlyDate] = [];
      }
      groups[chatbotId].monthly[monthlyDate].push(message);
    }
    
    return groups;
  }
  
  /**
   * Format date for different periods
   * @param {Date} date - Date to format
   * @param {string} period - Period type (daily, weekly, monthly)
   * @returns {string} - Formatted date
   * @private
   */
  formatDate(date, period) {
    const d = new Date(date);
    
    if (period === 'daily') {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } else if (period === 'weekly') {
      // Get the first day of the week (Sunday)
      const day = d.getDay();
      const diff = d.getDate() - day;
      const firstDayOfWeek = new Date(d.setDate(diff));
      return `${firstDayOfWeek.getFullYear()}-${String(firstDayOfWeek.getMonth() + 1).padStart(2, '0')}-${String(firstDayOfWeek.getDate()).padStart(2, '0')}`;
    } else if (period === 'monthly') {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    }
    
    return '1970-01-01'; // All-time
  }
  
  /**
   * Process a group of messages for analytics
   * @param {string} chatbotId - Chatbot ID
   * @param {string} period - Period type (daily, weekly, monthly, all)
   * @param {Array<Object>} messages - Messages to process
   * @returns {Promise<void>}
   * @private
   */
  async processMessageGroup(chatbotId, period, messages) {
    try {
      if (!messages || messages.length === 0) {
        return;
      }
      
      // Get date from first message for the period
      const date = period === 'all' ? new Date(0) : new Date(this.formatDate(messages[0].timestamp, period));
      
      // Find or create analytics document
      let analytics = await Analytics.findOne({
        chatbotId,
        period,
        date
      });
      
      if (!analytics) {
        analytics = new Analytics({
          chatbotId,
          period,
          date
        });
      }
      
      // Update metrics
      this.updateMetrics(analytics, messages);
      
      // Update sentiment analysis
      this.updateSentimentAnalysis(analytics, messages);
      
      // Update intent analysis
      this.updateIntentAnalysis(analytics, messages);
      
      // Update entity analysis
      this.updateEntityAnalysis(analytics, messages);
      
      // Update query analysis
      this.updateQueryAnalysis(analytics, messages);
      
      // Save analytics
      analytics.updatedAt = new Date();
      await analytics.save();
      
      logger.debug(`Updated ${period} analytics for chatbot ${chatbotId}`);
    } catch (error) {
      logger.error(`Error processing message group for chatbot ${chatbotId}:`, error.message);
    }
  }
  
  /**
   * Update metrics for analytics document
   * @param {Object} analytics - Analytics document
   * @param {Array<Object>} messages - Messages to process
   * @private
   */
  updateMetrics(analytics, messages) {
    // Count messages
    analytics.metrics.messageCount += messages.length;
    
    // Count user and bot messages
    const userMessages = messages.filter(m => m.role === 'user');
    const botMessages = messages.filter(m => m.role === 'bot');
    
    analytics.metrics.userMessageCount += userMessages.length;
    analytics.metrics.botMessageCount += botMessages.length;
    
    // Calculate average message lengths
    if (userMessages.length > 0) {
      const totalUserMessageLength = userMessages.reduce((sum, m) => sum + (m.content?.length || 0), 0);
      analytics.metrics.averageUserMessageLength = totalUserMessageLength / userMessages.length;
    }
    
    if (botMessages.length > 0) {
      const totalBotMessageLength = botMessages.reduce((sum, m) => sum + (m.content?.length || 0), 0);
      analytics.metrics.averageBotMessageLength = totalBotMessageLength / botMessages.length;
    }
    
    // Count conversations and unique users
    const conversationIds = new Set(messages.map(m => m.conversationId));
    const userIds = new Set(messages.map(m => m.userId));
    
    analytics.metrics.conversationCount += conversationIds.size;
    analytics.metrics.uniqueUserCount += userIds.size;
    
    // Calculate average conversation length
    const conversationLengths = {};
    
    for (const message of messages) {
      if (!conversationLengths[message.conversationId]) {
        conversationLengths[message.conversationId] = 0;
      }
      conversationLengths[message.conversationId]++;
    }
    
    const totalLength = Object.values(conversationLengths).reduce((sum, length) => sum + length, 0);
    analytics.metrics.averageConversationLength = conversationIds.size > 0 ? totalLength / conversationIds.size : 0;
    
    // Calculate average response time
    let totalResponseTime = 0;
    let responseCount = 0;
    
    // Sort messages by timestamp
    const sortedMessages = [...messages].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Group by conversation
    const conversationMessages = {};
    
    for (const message of sortedMessages) {
      if (!conversationMessages[message.conversationId]) {
        conversationMessages[message.conversationId] = [];
      }
      conversationMessages[message.conversationId].push(message);
    }
    
    // Calculate response times for each conversation
    for (const conversation of Object.values(conversationMessages)) {
      for (let i = 1; i < conversation.length; i++) {
        const current = conversation[i];
        const previous = conversation[i - 1];
        
        // If current is bot and previous is user, calculate response time
        if (current.role === 'bot' && previous.role === 'user') {
          const responseTime = new Date(current.timestamp) - new Date(previous.timestamp);
          totalResponseTime += responseTime;
          responseCount++;
        }
      }
    }
    
    analytics.metrics.averageResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;
  }
  
  /**
   * Update sentiment analysis for analytics document
   * @param {Object} analytics - Analytics document
   * @param {Array<Object>} messages - Messages to process
   * @private
   */
  updateSentimentAnalysis(analytics, messages) {
    // Only analyze user messages
    const userMessages = messages.filter(m => m.role === 'user');
    
    for (const message of userMessages) {
      if (message.sentiment) {
        if (message.sentiment === 'positive') {
          analytics.sentimentAnalysis.positive++;
        } else if (message.sentiment === 'negative') {
          analytics.sentimentAnalysis.negative++;
        } else {
          analytics.sentimentAnalysis.neutral++;
        }
      } else {
        // Default to neutral if sentiment not provided
        analytics.sentimentAnalysis.neutral++;
      }
    }
  }
  
  /**
   * Update intent analysis for analytics document
   * @param {Object} analytics - Analytics document
   * @param {Array<Object>} messages - Messages to process
   * @private
   */
  updateIntentAnalysis(analytics, messages) {
    // Only analyze user messages
    const userMessages = messages.filter(m => m.role === 'user');
    
    for (const message of userMessages) {
      if (message.intent) {
        const currentCount = analytics.intentAnalysis.get(message.intent) || 0;
        analytics.intentAnalysis.set(message.intent, currentCount + 1);
      }
    }
  }
  
  /**
   * Update entity analysis for analytics document
   * @param {Object} analytics - Analytics document
   * @param {Array<Object>} messages - Messages to process
   * @private
   */
  updateEntityAnalysis(analytics, messages) {
    // Only analyze user messages
    const userMessages = messages.filter(m => m.role === 'user');
    
    for (const message of userMessages) {
      if (message.entities && Array.isArray(message.entities)) {
        for (const entity of message.entities) {
          if (entity.type && entity.value) {
            const key = `${entity.type}:${entity.value}`;
            const currentCount = analytics.topEntities.get(key) || 0;
            analytics.topEntities.set(key, currentCount + 1);
          }
        }
      }
    }
  }
  
  /**
   * Update query analysis for analytics document
   * @param {Object} analytics - Analytics document
   * @param {Array<Object>} messages - Messages to process
   * @private
   */
  updateQueryAnalysis(analytics, messages) {
    // Only analyze user messages
    const userMessages = messages.filter(m => m.role === 'user');
    
    // Count queries
    const queryCounts = {};
    
    for (const message of userMessages) {
      const query = message.content?.trim();
      if (query) {
        queryCounts[query] = (queryCounts[query] || 0) + 1;
      }
    }
    
    // Convert to array and sort
    const sortedQueries = Object.entries(queryCounts)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Keep top 10
    
    // Update top user queries
    analytics.topUserQueries = sortedQueries;
    
    // Update failed queries if available
    const failedMessages = userMessages.filter(m => m.failed);
    const failedQueryCounts = {};
    
    for (const message of failedMessages) {
      const query = message.content?.trim();
      if (query) {
        failedQueryCounts[query] = (failedQueryCounts[query] || 0) + 1;
      }
    }
    
    // Convert to array and sort
    const sortedFailedQueries = Object.entries(failedQueryCounts)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Keep top 10
    
    // Update top failed queries
    analytics.topFailedQueries = sortedFailedQueries;
  }
  
  /**
   * Track a message for analytics
   * @param {Object} message - Message to track
   * @returns {Promise<void>}
   */
  async trackMessage(message) {
    try {
      // Validate message
      if (!message || !message.chatbotId || !message.conversationId) {
        logger.warn('Invalid message for analytics tracking');
        return;
      }
      
      // Add timestamp if not provided
      if (!message.timestamp) {
        message.timestamp = new Date();
      }
      
      // Add message to buffer
      this.messageBuffer.push(message);
      
      // Process buffer if it reaches the buffer size
      if (this.messageBuffer.length >= this.bufferSize) {
        await this.processBuffer();
      }
      
      logger.debug(`Tracked message for analytics: ${message.conversationId}`);
    } catch (error) {
      logger.error('Error tracking message for analytics:', error.message);
    }
  }
  
  /**
   * Get analytics for a chatbot by period
   * @param {string} chatbotId - Chatbot ID
   * @param {string} period - Period type (daily, weekly, monthly)
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array<Object>>} - Analytics data
   */
  async getAnalytics(chatbotId, period, startDate, endDate) {
    try {
      logger.debug(`Getting ${period} analytics for chatbot ${chatbotId} from ${startDate} to ${endDate}`);
      
      // Find analytics documents for the specified period and date range
      const analytics = await Analytics.find({
        chatbotId,
        period,
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: 1 }).lean().exec();
      
      logger.info(`Retrieved ${analytics.length} ${period} analytics records for chatbot ${chatbotId}`);
      return analytics;
    } catch (error) {
      logger.error(`Error getting analytics for chatbot ${chatbotId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Get all-time analytics for a chatbot
   * @param {string} chatbotId - Chatbot ID
   * @returns {Promise<Object>} - All-time analytics
   */
  async getAllTimeAnalytics(chatbotId) {
    try {
      logger.debug(`Getting all-time analytics for chatbot ${chatbotId}`);
      
      // Find the all-time analytics document
      const analytics = await Analytics.findOne({
        chatbotId,
        period: 'all',
        date: new Date(0)
      }).lean().exec();
      
      if (!analytics) {
        logger.warn(`No all-time analytics found for chatbot ${chatbotId}`);
        return {
          chatbotId,
          period: 'all',
          metrics: {
            messageCount: 0,
            userMessageCount: 0,
            botMessageCount: 0,
            averageResponseTime: 0,
            conversationCount: 0,
            uniqueUserCount: 0,
            averageConversationLength: 0
          }
        };
      }
      
      logger.info(`Retrieved all-time analytics for chatbot ${chatbotId}`);
      return analytics;
    } catch (error) {
      logger.error(`Error getting all-time analytics for chatbot ${chatbotId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Generate a comprehensive analytics report
   * @param {string} chatbotId - Chatbot ID
   * @param {string} period - Period type (daily, weekly, monthly)
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} - Generated report
   */
  async generateReport(chatbotId, period, startDate, endDate) {
    try {
      logger.debug(`Generating ${period} report for chatbot ${chatbotId} from ${startDate} to ${endDate}`);
      
      // Get analytics for the specified period
      const analyticsData = await this.getAnalytics(chatbotId, period, startDate, endDate);
      
      // Get all-time analytics for comparison
      const allTimeAnalytics = await this.getAllTimeAnalytics(chatbotId);
      
      // Calculate aggregated metrics
      const aggregatedMetrics = this.aggregateMetrics(analyticsData);
      
      // Calculate trends
      const trends = this.calculateTrends(analyticsData);
      
      // Generate insights
      const insights = this.generateInsights(aggregatedMetrics, allTimeAnalytics.metrics, trends);
      
      // Compile report
      const report = {
        chatbotId,
        period,
        startDate,
        endDate,
        generatedAt: new Date(),
        metrics: aggregatedMetrics,
        trends,
        insights,
        topIntents: this.getTopIntents(analyticsData),
        topEntities: this.getTopEntities(analyticsData),
        topQueries: this.getTopQueries(analyticsData),
        sentimentAnalysis: this.aggregateSentiment(analyticsData),
        performanceMetrics: this.calculatePerformanceMetrics(analyticsData)
      };
      
      logger.info(`Generated ${period} report for chatbot ${chatbotId}`);
      return report;
    } catch (error) {
      logger.error(`Error generating report for chatbot ${chatbotId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Aggregate metrics from multiple analytics documents
   * @param {Array<Object>} analyticsData - Analytics data
   * @returns {Object} - Aggregated metrics
   * @private
   */
  aggregateMetrics(analyticsData) {
    if (!analyticsData || analyticsData.length === 0) {
      return {
        messageCount: 0,
        userMessageCount: 0,
        botMessageCount: 0,
        averageResponseTime: 0,
        conversationCount: 0,
        uniqueUserCount: 0,
        averageConversationLength: 0,
        averageUserMessageLength: 0,
        averageBotMessageLength: 0
      };
    }
    
    // Initialize aggregated metrics
    const aggregated = {
      messageCount: 0,
      userMessageCount: 0,
      botMessageCount: 0,
      responseTimeTotal: 0,
      responseTimeCount: 0,
      conversationCount: 0,
      uniqueUserCount: 0,
      conversationLengthTotal: 0,
      conversationLengthCount: 0,
      userMessageLengthTotal: 0,
      userMessageLengthCount: 0,
      botMessageLengthTotal: 0,
      botMessageLengthCount: 0
    };
    
    // Combine metrics from all analytics documents
    for (const analytics of analyticsData) {
      if (!analytics.metrics) continue;
      
      aggregated.messageCount += analytics.metrics.messageCount || 0;
      aggregated.userMessageCount += analytics.metrics.userMessageCount || 0;
      aggregated.botMessageCount += analytics.metrics.botMessageCount || 0;
      
      if (analytics.metrics.averageResponseTime) {
        aggregated.responseTimeTotal += analytics.metrics.averageResponseTime * (analytics.metrics.botMessageCount || 1);
        aggregated.responseTimeCount += analytics.metrics.botMessageCount || 1;
      }
      
      aggregated.conversationCount += analytics.metrics.conversationCount || 0;
      
      // For unique users, we need to deduplicate across documents
      aggregated.uniqueUserCount = Math.max(aggregated.uniqueUserCount, analytics.metrics.uniqueUserCount || 0);
      
      if (analytics.metrics.averageConversationLength) {
        aggregated.conversationLengthTotal += analytics.metrics.averageConversationLength * (analytics.metrics.conversationCount || 1);
        aggregated.conversationLengthCount += analytics.metrics.conversationCount || 1;
      }
      
      if (analytics.metrics.averageUserMessageLength) {
        aggregated.userMessageLengthTotal += analytics.metrics.averageUserMessageLength * (analytics.metrics.userMessageCount || 1);
        aggregated.userMessageLengthCount += analytics.metrics.userMessageCount || 1;
      }
      
      if (analytics.metrics.averageBotMessageLength) {
        aggregated.botMessageLengthTotal += analytics.metrics.averageBotMessageLength * (analytics.metrics.botMessageCount || 1);
        aggregated.botMessageLengthCount += analytics.metrics.botMessageCount || 1;
      }
    }
    
    // Calculate averages
    return {
      messageCount: aggregated.messageCount,
      userMessageCount: aggregated.userMessageCount,
      botMessageCount: aggregated.botMessageCount,
      averageResponseTime: aggregated.responseTimeCount > 0 ? aggregated.responseTimeTotal / aggregated.responseTimeCount : 0,
      conversationCount: aggregated.conversationCount,
      uniqueUserCount: aggregated.uniqueUserCount,
      averageConversationLength: aggregated.conversationLengthCount > 0 ? aggregated.conversationLengthTotal / aggregated.conversationLengthCount : 0,
      averageUserMessageLength: aggregated.userMessageLengthCount > 0 ? aggregated.userMessageLengthTotal / aggregated.userMessageLengthCount : 0,
      averageBotMessageLength: aggregated.botMessageLengthCount > 0 ? aggregated.botMessageLengthTotal / aggregated.botMessageLengthCount : 0
    };
  }
  
  /**
   * Calculate trends from analytics data
   * @param {Array<Object>} analyticsData - Analytics data
   * @returns {Object} - Calculated trends
   * @private
   */
  calculateTrends(analyticsData) {
    if (!analyticsData || analyticsData.length < 2) {
      return {
        messageCountTrend: 0,
        responseTimeTrend: 0,
        conversationCountTrend: 0,
        userCountTrend: 0
      };
    }
    
    // Sort data by date
    const sortedData = [...analyticsData].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Calculate trends for key metrics
    const trends = {};
    
    // Message count trend
    const messageCounts = sortedData.map(a => a.metrics?.messageCount || 0);
    trends.messageCountTrend = this.calculateTrendPercentage(messageCounts);
    
    // Response time trend (negative is better)
    const responseTimes = sortedData.map(a => a.metrics?.averageResponseTime || 0);
    trends.responseTimeTrend = -1 * this.calculateTrendPercentage(responseTimes);
    
    // Conversation count trend
    const conversationCounts = sortedData.map(a => a.metrics?.conversationCount || 0);
    trends.conversationCountTrend = this.calculateTrendPercentage(conversationCounts);
    
    // User count trend
    const userCounts = sortedData.map(a => a.metrics?.uniqueUserCount || 0);
    trends.userCountTrend = this.calculateTrendPercentage(userCounts);
    
    return trends;
  }
  
  /**
   * Calculate trend percentage from an array of values
   * @param {Array<number>} values - Values to calculate trend from
   * @returns {number} - Trend percentage
   * @private
   */
  calculateTrendPercentage(values) {
    if (!values || values.length < 2) return 0;
    
    // Use linear regression to calculate trend
    const n = values.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    
    // Calculate means
    const meanX = indices.reduce((sum, x) => sum + x, 0) / n;
    const meanY = values.reduce((sum, y) => sum + y, 0) / n;
    
    // Calculate slope
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (indices[i] - meanX) * (values[i] - meanY);
      denominator += (indices[i] - meanX) ** 2;
    }
    
    const slope = denominator !== 0 ? numerator / denominator : 0;
    
    // Calculate percentage change
    const firstValue = values[0] || 1; // Avoid division by zero
    const percentageChange = (slope * (n - 1)) / firstValue * 100;
    
    return Math.round(percentageChange * 100) / 100; // Round to 2 decimal places
  }
  
  /**
   * Get top intents from analytics data
   * @param {Array<Object>} analyticsData - Analytics data
   * @returns {Array<Object>} - Top intents
   * @private
   */
  getTopIntents(analyticsData) {
    if (!analyticsData || analyticsData.length === 0) return [];
    
    // Combine intent data from all analytics documents
    const intentCounts = {};
    
    for (const analytics of analyticsData) {
      if (!analytics.intentAnalysis) continue;
      
      // Convert Map to object if needed
      const intents = analytics.intentAnalysis instanceof Map ? 
        Object.fromEntries(analytics.intentAnalysis) : 
        analytics.intentAnalysis;
      
      // Combine counts
      for (const [intent, count] of Object.entries(intents)) {
        intentCounts[intent] = (intentCounts[intent] || 0) + count;
      }
    }
    
    // Convert to array and sort
    return Object.entries(intentCounts)
      .map(([intent, count]) => ({ intent, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Keep top 10
  }
  
  /**
   * Get top entities from analytics data
   * @param {Array<Object>} analyticsData - Analytics data
   * @returns {Array<Object>} - Top entities
   * @private
   */
  getTopEntities(analyticsData) {
    if (!analyticsData || analyticsData.length === 0) return [];
    
    // Combine entity data from all analytics documents
    const entityCounts = {};
    
    for (const analytics of analyticsData) {
      if (!analytics.topEntities) continue;
      
      // Convert Map to object if needed
      const entities = analytics.topEntities instanceof Map ? 
        Object.fromEntries(analytics.topEntities) : 
        analytics.topEntities;
      
      // Combine counts
      for (const [entityKey, count] of Object.entries(entities)) {
        entityCounts[entityKey] = (entityCounts[entityKey] || 0) + count;
      }
    }
    
    // Convert to array and sort
    return Object.entries(entityCounts)
      .map(([key, count]) => {
        const [type, value] = key.split(':');
        return { type, value, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Keep top 10
  }
  
  /**
   * Get top queries from analytics data
   * @param {Array<Object>} analyticsData - Analytics data
   * @returns {Object} - Top queries and failed queries
   * @private
   */
  getTopQueries(analyticsData) {
    if (!analyticsData || analyticsData.length === 0) {
      return {
        topUserQueries: [],
        topFailedQueries: []
      };
    }
    
    // Combine query data from all analytics documents
    const userQueryCounts = {};
    const failedQueryCounts = {};
    
    for (const analytics of analyticsData) {
      // Process top user queries
      if (analytics.topUserQueries && Array.isArray(analytics.topUserQueries)) {
        for (const { query, count } of analytics.topUserQueries) {
          userQueryCounts[query] = (userQueryCounts[query] || 0) + count;
        }
      }
      
      // Process top failed queries
      if (analytics.topFailedQueries && Array.isArray(analytics.topFailedQueries)) {
        for (const { query, count } of analytics.topFailedQueries) {
          failedQueryCounts[query] = (failedQueryCounts[query] || 0) + count;
        }
      }
    }
    
    // Convert to arrays and sort
    const topUserQueries = Object.entries(userQueryCounts)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Keep top 10
    
    const topFailedQueries = Object.entries(failedQueryCounts)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Keep top 10
    
    return {
      topUserQueries,
      topFailedQueries
    };
  }
  
  /**
   * Aggregate sentiment analysis from analytics data
   * @param {Array<Object>} analyticsData - Analytics data
   * @returns {Object} - Aggregated sentiment
   * @private
   */
  aggregateSentiment(analyticsData) {
    if (!analyticsData || analyticsData.length === 0) {
      return {
        positive: 0,
        negative: 0,
        neutral: 0,
        positivePercentage: 0,
        negativePercentage: 0,
        neutralPercentage: 0
      };
    }
    
    // Combine sentiment data from all analytics documents
    let positive = 0;
    let negative = 0;
    let neutral = 0;
    
    for (const analytics of analyticsData) {
      if (!analytics.sentimentAnalysis) continue;
      
      positive += analytics.sentimentAnalysis.positive || 0;
      negative += analytics.sentimentAnalysis.negative || 0;
      neutral += analytics.sentimentAnalysis.neutral || 0;
    }
    
    // Calculate percentages
    const total = positive + negative + neutral;
    
    return {
      positive,
      negative,
      neutral,
      positivePercentage: total > 0 ? (positive / total * 100) : 0,
      negativePercentage: total > 0 ? (negative / total * 100) : 0,
      neutralPercentage: total > 0 ? (neutral / total * 100) : 0
    };
  }
  
  /**
   * Calculate performance metrics from analytics data
   * @param {Array<Object>} analyticsData - Analytics data
   * @returns {Object} - Performance metrics
   * @private
   */
  calculatePerformanceMetrics(analyticsData) {
    if (!analyticsData || analyticsData.length === 0) {
      return {
        averageResponseTime: 0,
        responseTimePercentile90: 0,
        messageSuccessRate: 0,
        conversationCompletionRate: 0
      };
    }
    
    // Extract response times
    const responseTimes = [];
    let totalMessages = 0;
    let successfulMessages = 0;
    let totalConversations = 0;
    let completedConversations = 0;
    
    for (const analytics of analyticsData) {
      if (!analytics.metrics) continue;
      
      // Add response times
      if (analytics.metrics.averageResponseTime) {
        // We don't have individual response times, so we approximate using the average
        const count = analytics.metrics.botMessageCount || 0;
        for (let i = 0; i < count; i++) {
          responseTimes.push(analytics.metrics.averageResponseTime);
        }
      }
      
      // Count messages and success rate
      totalMessages += analytics.metrics.messageCount || 0;
      successfulMessages += (analytics.metrics.messageCount || 0) - (analytics.metrics.failedMessageCount || 0);
      
      // Count conversations and completion rate
      totalConversations += analytics.metrics.conversationCount || 0;
      completedConversations += analytics.metrics.completedConversationCount || 0;
    }
    
    // Calculate 90th percentile response time
    let responseTimePercentile90 = 0;
    if (responseTimes.length > 0) {
      responseTimes.sort((a, b) => a - b);
      const index = Math.floor(responseTimes.length * 0.9);
      responseTimePercentile90 = responseTimes[index] || responseTimes[responseTimes.length - 1];
    }
    
    return {
      averageResponseTime: responseTimes.length > 0 ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : 0,
      responseTimePercentile90,
      messageSuccessRate: totalMessages > 0 ? (successfulMessages / totalMessages * 100) : 100,
      conversationCompletionRate: totalConversations > 0 ? (completedConversations / totalConversations * 100) : 100
    };
  }
  
  /**
   * Generate insights from analytics data
   * @param {Object} currentMetrics - Current period metrics
   * @param {Object} allTimeMetrics - All-time metrics for comparison
   * @param {Object} trends - Calculated trends
   * @returns {Array<string>} - Generated insights
   * @private
   */
  generateInsights(currentMetrics, allTimeMetrics, trends) {
    const insights = [];
    
    // Message volume insights
    if (currentMetrics.messageCount > allTimeMetrics.messageCount * 1.2) {
      insights.push('Message volume is significantly higher than the all-time average.');
    } else if (currentMetrics.messageCount < allTimeMetrics.messageCount * 0.8) {
      insights.push('Message volume is significantly lower than the all-time average.');
    }
    
    // Response time insights
    if (trends.responseTimeTrend > 10) {
      insights.push('Response times are improving significantly.');
    } else if (trends.responseTimeTrend < -10) {
      insights.push('Response times are degrading. Consider optimizing the chatbot.');
    }
    
    // User engagement insights
    if (trends.userCountTrend > 5) {
      insights.push('User engagement is growing steadily.');
    } else if (trends.userCountTrend < -5) {
      insights.push('User engagement is declining. Consider reviewing the chatbot experience.');
    }
    
    // Conversation insights
    if (currentMetrics.averageConversationLength > allTimeMetrics.averageConversationLength * 1.2) {
      insights.push('Conversations are longer than usual, indicating deeper engagement.');
    } else if (currentMetrics.averageConversationLength < allTimeMetrics.averageConversationLength * 0.8) {
      insights.push('Conversations are shorter than usual. Users may not be finding what they need.');
    }
    
    // Add default insight if none generated
    if (insights.length === 0) {
      insights.push('Performance is consistent with historical patterns.');
    }
    
    return insights;
  }
}
