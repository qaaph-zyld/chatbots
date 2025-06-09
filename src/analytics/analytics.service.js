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
   * Track a message for analytics
   * @param {Object} messageData - Message data to track
   * @returns {Promise<void>}
   */
  async trackMessage(messageData) {
    try {
      // Add timestamp if not present
      if (!messageData.timestamp) {
        messageData.timestamp = new Date();
      }
      
      // Format date for daily period
      const date = new Date(messageData.timestamp);
      date.setHours(0, 0, 0, 0);
      
      // Determine message direction
      const isUserMessage = messageData.direction === 'incoming';
      
      // Calculate response time for bot messages
      let responseTime = 0;
      if (!isUserMessage && messageData.conversationId) {
        try {
          const lastUserMessage = await Conversation.findOne({
            conversationId: messageData.conversationId,
            direction: 'incoming'
          }).sort({ timestamp: -1 }).exec();
          
          if (lastUserMessage) {
            responseTime = messageData.timestamp - lastUserMessage.timestamp;
          }
        } catch (error) {
          logger.warn(`Error calculating response time: ${error.message}`);
        }
      }
      
      // Update daily analytics
      await Analytics.findOneAndUpdate(
        { 
          chatbotId: messageData.chatbotId, 
          period: 'daily', 
          date: date 
        },
        { 
          $inc: { 
            'metrics.messageCount': 1,
            [`metrics.${isUserMessage ? 'userMessageCount' : 'botMessageCount'}`]: 1,
            ...(responseTime > 0 ? { 'metrics.totalResponseTime': responseTime } : {})
          },
          $set: {
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );
      
      // Also update all-time analytics
      await Analytics.findOneAndUpdate(
        { 
          chatbotId: messageData.chatbotId, 
          period: 'all', 
          date: new Date(0)
        },
        { 
          $inc: { 
            'metrics.messageCount': 1,
            [`metrics.${isUserMessage ? 'userMessageCount' : 'botMessageCount'}`]: 1,
            ...(responseTime > 0 ? { 'metrics.totalResponseTime': responseTime } : {})
          },
          $set: {
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );
      
      // Add to buffer for batch processing of more detailed analytics
      this.messageBuffer.push(messageData);
      
      // Process buffer if it reaches the threshold
      if (this.messageBuffer.length >= this.bufferSize) {
        await this.processBuffer();
      }
      
      logger.debug(`Message tracked for chatbot ${messageData.chatbotId}`);
    }
    } catch (error) {
      logger.error('Error tracking message for analytics:', error.message);
    }
  }
  
  /**
   * Process the message buffer and update analytics
   * @returns {Promise<void>}
   * @private
   */
  async processBuffer() {
    if (this.messageBuffer.length === 0) {
      return;
    }
    
    try {
      const messages = [...this.messageBuffer];
      this.messageBuffer = [];
      
      // Group messages by chatbot and date
      const groupedMessages = this.groupMessagesByDate(messages);
      
      // Update analytics for each group
      for (const [key, group] of Object.entries(groupedMessages)) {
        const [chatbotId, dateStr, period] = key.split('|');
        const date = new Date(dateStr);
        
        await this.updateAnalytics(chatbotId, date, period, group);
      }
      
      logger.info(`Processed ${messages.length} messages for analytics`);
    } catch (error) {
      logger.error('Error processing analytics buffer:', error.message);
    }
  }
  
  /**
   * Group messages by chatbot ID, date, and period
   * @param {Array<Object>} messages - Messages to group
   * @returns {Object} - Grouped messages
   * @private
   */
  groupMessagesByDate(messages) {
    const grouped = {};
    
    for (const message of messages) {
      const { chatbotId, timestamp } = message;
      const date = new Date(timestamp);
      
      // Create keys for different periods
      const dailyKey = `${chatbotId}|${this.formatDate(date, 'daily')}|daily`;
      const weeklyKey = `${chatbotId}|${this.formatDate(date, 'weekly')}|weekly`;
      const monthlyKey = `${chatbotId}|${this.formatDate(date, 'monthly')}|monthly`;
      const allTimeKey = `${chatbotId}|all|all`;
      
      // Add message to each period group
      if (!grouped[dailyKey]) grouped[dailyKey] = [];
      if (!grouped[weeklyKey]) grouped[weeklyKey] = [];
      if (!grouped[monthlyKey]) grouped[monthlyKey] = [];
      if (!grouped[allTimeKey]) grouped[allTimeKey] = [];
      
      grouped[dailyKey].push(message);
      grouped[weeklyKey].push(message);
      grouped[monthlyKey].push(message);
      grouped[allTimeKey].push(message);
    }
    
    return grouped;
  }
  
  /**
   * Format date for different periods
   * @param {Date} date - Date to format
   * @param {string} period - Period type
   * @returns {string} - Formatted date
   * @private
   */
  formatDate(date, period) {
    switch (period) {
      case 'daily':
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
      case 'weekly':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
        return weekStart.toISOString().split('T')[0];
      case 'monthly':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
      default:
        return 'all';
    }
  }
  
  /**
   * Update analytics for a specific chatbot, date, and period
   * @param {string} chatbotId - Chatbot ID
   * @param {Date} date - Date
   * @param {string} period - Period type
   * @param {Array<Object>} messages - Messages to analyze
   * @returns {Promise<void>}
   * @private
   */
  async updateAnalytics(chatbotId, date, period, messages) {
    try {
      // Find or create analytics document
      let analytics = await Analytics.findOne({
        chatbotId,
        period,
        date: period === 'all' ? new Date(0) : date
      });
      
      if (!analytics) {
        analytics = new Analytics({
          chatbotId,
          period,
          date: period === 'all' ? new Date(0) : date
        });
      }
      
      // Calculate metrics
      const metrics = this.calculateMetrics(messages, analytics.metrics);
      const sentimentAnalysis = this.analyzeSentiment(messages, analytics.sentimentAnalysis);
      const intentAnalysis = this.analyzeIntents(messages, analytics.intentAnalysis);
      const topEntities = this.analyzeEntities(messages, analytics.topEntities);
      const { topUserQueries, topFailedQueries } = this.analyzeQueries(messages, analytics.topUserQueries, analytics.topFailedQueries);
      const inputTypes = this.analyzeInputTypes(messages, analytics.inputTypes);
      const outputTypes = this.analyzeOutputTypes(messages, analytics.outputTypes);
      
      // Update analytics document
      analytics.metrics = metrics;
      analytics.sentimentAnalysis = sentimentAnalysis;
      analytics.intentAnalysis = intentAnalysis;
      analytics.topEntities = topEntities;
      analytics.topUserQueries = topUserQueries;
      analytics.topFailedQueries = topFailedQueries;
      analytics.inputTypes = inputTypes;
      analytics.outputTypes = outputTypes;
      analytics.updatedAt = new Date();
      
      await analytics.save();
    } catch (error) {
      logger.error(`Error updating analytics for chatbot ${chatbotId}:`, error.message);
    }
  }
  
  /**
   * Calculate metrics from messages
   * @param {Array<Object>} messages - Messages to analyze
   * @param {Object} currentMetrics - Current metrics
   * @returns {Object} - Updated metrics
   * @private
   */
  calculateMetrics(messages, currentMetrics) {
    const metrics = { ...currentMetrics };
    
    // Count messages
    metrics.messageCount += messages.length;
    
    // Count user and bot messages
    const userMessages = messages.filter(m => m.role === 'user');
    const botMessages = messages.filter(m => m.role === 'bot');
    metrics.userMessageCount += userMessages.length;
    metrics.botMessageCount += botMessages.length;
    
    // Calculate response times
    let totalResponseTime = 0;
    let responseCount = 0;
    
    for (let i = 0; i < messages.length - 1; i++) {
      if (messages[i].role === 'user' && messages[i + 1].role === 'bot') {
        const responseTime = new Date(messages[i + 1].timestamp) - new Date(messages[i].timestamp);
        totalResponseTime += responseTime;
        responseCount++;
      }
    }
    
    // Update average response time
    if (responseCount > 0) {
      const newAvgTime = totalResponseTime / responseCount;
      metrics.averageResponseTime = 
        (metrics.averageResponseTime * (metrics.messageCount - messages.length) + newAvgTime * responseCount) / 
        (metrics.messageCount - messages.length + responseCount);
    }
    
    // Count unique users and conversations
    const uniqueUsers = new Set(messages.map(m => m.userId));
    const conversations = new Set(messages.map(m => m.conversationId));
    metrics.uniqueUserCount += uniqueUsers.size;
    metrics.conversationCount += conversations.size;
    
    // Calculate message lengths
    let totalUserMessageLength = 0;
    let totalBotMessageLength = 0;
    
    for (const message of userMessages) {
      totalUserMessageLength += message.content ? message.content.length : 0;
    }
    
    for (const message of botMessages) {
      totalBotMessageLength += message.content ? message.content.length : 0;
    }
    
    // Update average message lengths
    if (userMessages.length > 0) {
      const newAvgLength = totalUserMessageLength / userMessages.length;
      metrics.averageUserMessageLength = 
        (metrics.averageUserMessageLength * (metrics.userMessageCount - userMessages.length) + newAvgLength * userMessages.length) / 
        (metrics.userMessageCount - userMessages.length + userMessages.length);
    }
    
    if (botMessages.length > 0) {
      const newAvgLength = totalBotMessageLength / botMessages.length;
      metrics.averageBotMessageLength = 
        (metrics.averageBotMessageLength * (metrics.botMessageCount - botMessages.length) + newAvgLength * botMessages.length) / 
        (metrics.botMessageCount - botMessages.length + botMessages.length);
    }
    
    // Calculate average conversation length
    if (conversations.size > 0) {
      const conversationMessages = {};
      
      for (const message of messages) {
        if (!conversationMessages[message.conversationId]) {
          conversationMessages[message.conversationId] = 0;
        }
        
        conversationMessages[message.conversationId]++;
      }
      
      let totalLength = 0;
      for (const [_, length] of Object.entries(conversationMessages)) {
        totalLength += length;
      }
      
      const newAvgLength = totalLength / conversations.size;
      metrics.averageConversationLength = 
        (metrics.averageConversationLength * (metrics.conversationCount - conversations.size) + newAvgLength * conversations.size) / 
        (metrics.conversationCount - conversations.size + conversations.size);
    }
    
    return metrics;
  }
  
  /**
   * Analyze sentiment from messages
   * @param {Array<Object>} messages - Messages to analyze
   * @param {Object} currentSentiment - Current sentiment analysis
   * @returns {Object} - Updated sentiment analysis
   * @private
   */
  analyzeSentiment(messages, currentSentiment) {
    const sentiment = { ...currentSentiment };
    
    // Only analyze user messages
    const userMessages = messages.filter(m => m.role === 'user');
    
    for (const message of userMessages) {
      if (message.nlpAnalysis && message.nlpAnalysis.sentiment) {
        const sentimentCategory = message.nlpAnalysis.sentiment.toLowerCase();
        
        if (sentimentCategory.includes('positive')) {
          sentiment.positive++;
        } else if (sentimentCategory.includes('negative')) {
          sentiment.negative++;
        } else {
          sentiment.neutral++;
        }
      } else {
        // Default to neutral if no sentiment analysis
        sentiment.neutral++;
      }
    }
    
    return sentiment;
  }
  
  /**
   * Analyze intents from messages
   * @param {Array<Object>} messages - Messages to analyze
   * @param {Map<string, number>} currentIntents - Current intent analysis
   * @returns {Map<string, number>} - Updated intent analysis
   * @private
   */
  analyzeIntents(messages, currentIntents) {
    const intents = new Map(currentIntents);
    
    // Only analyze user messages
    const userMessages = messages.filter(m => m.role === 'user');
    
    for (const message of userMessages) {
      if (message.nlpAnalysis && message.nlpAnalysis.intent) {
        const intent = message.nlpAnalysis.intent;
        
        if (intent) {
          const count = intents.get(intent) || 0;
          intents.set(intent, count + 1);
        }
      }
    }
    
    return intents;
  }
  
  /**
   * Analyze entities from messages
   * @param {Array<Object>} messages - Messages to analyze
   * @param {Map<string, number>} currentEntities - Current entity analysis
   * @returns {Map<string, number>} - Updated entity analysis
   * @private
   */
  analyzeEntities(messages, currentEntities) {
    const entities = new Map(currentEntities);
    
    // Only analyze user messages
    const userMessages = messages.filter(m => m.role === 'user');
    
    for (const message of userMessages) {
      if (message.nlpAnalysis && message.nlpAnalysis.entities) {
        for (const entity of message.nlpAnalysis.entities) {
          const entityKey = `${entity.type}:${entity.value}`;
          const count = entities.get(entityKey) || 0;
          entities.set(entityKey, count + 1);
        }
      }
    }
    
    // Sort and limit to top 20 entities
    const sortedEntities = [...entities.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);
    
    return new Map(sortedEntities);
  }
  
  /**
   * Analyze queries from messages
   * @param {Array<Object>} messages - Messages to analyze
   * @param {Array<Object>} currentTopQueries - Current top queries
   * @param {Array<Object>} currentFailedQueries - Current failed queries
   * @returns {Object} - Updated query analysis
   * @private
   */
  analyzeQueries(messages, currentTopQueries, currentFailedQueries) {
    const queryMap = new Map();
    const failedQueryMap = new Map();
    
    // Convert current arrays to maps for easier updating
    for (const item of currentTopQueries) {
      queryMap.set(item.query, item.count);
    }
    
    for (const item of currentFailedQueries) {
      failedQueryMap.set(item.query, item.count);
    }
    
    // Only analyze user messages
    const userMessages = messages.filter(m => m.role === 'user');
    
    for (const message of userMessages) {
      const query = message.content;
      
      if (query) {
        // Update top queries
        const count = queryMap.get(query) || 0;
        queryMap.set(query, count + 1);
        
        // Check if this was a failed query
        const nextMessage = messages.find(m => 
          m.conversationId === message.conversationId && 
          m.role === 'bot' && 
          new Date(m.timestamp) > new Date(message.timestamp)
        );
        
        if (nextMessage && this.isFailedResponse(nextMessage)) {
          const failedCount = failedQueryMap.get(query) || 0;
          failedQueryMap.set(query, failedCount + 1);
        }
      }
    }
    
    // Convert maps back to arrays and sort by count
    const topUserQueries = [...queryMap.entries()]
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
    
    const topFailedQueries = [...failedQueryMap.entries()]
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
    
    return { topUserQueries, topFailedQueries };
  }
  
  /**
   * Check if a response indicates a failed query
   * @param {Object} message - Bot message to check
   * @returns {boolean} - True if the response indicates a failed query
   * @private
   */
  isFailedResponse(message) {
    const content = message.content || '';
    const failureIndicators = [
      "I don't know",
      "I don't understand",
      "I'm not sure",
      "I can't help",
      "I can't answer",
      "I don't have information",
      "I'm unable to",
      "I don't have enough information"
    ];
    
    return failureIndicators.some(indicator => 
      content.toLowerCase().includes(indicator.toLowerCase())
    );
  }
  
  /**
   * Analyze input types from messages
   * @param {Array<Object>} messages - Messages to analyze
   * @param {Object} currentInputTypes - Current input type analysis
   * @returns {Object} - Updated input type analysis
   * @private
   */
  analyzeInputTypes(messages, currentInputTypes) {
    const inputTypes = { ...currentInputTypes };
    
    // Only analyze user messages
    const userMessages = messages.filter(m => m.role === 'user');
    
    for (const message of userMessages) {
      if (message.input && message.input.type) {
        const type = message.input.type.toLowerCase();
        
        switch (type) {
          case 'text':
            inputTypes.text++;
            break;
          case 'image':
            inputTypes.image++;
            break;
          case 'audio':
            inputTypes.audio++;
            break;
          case 'location':
            inputTypes.location++;
            break;
          default:
            inputTypes.other++;
            break;
        }
      } else {
        // Default to text if no input type
        inputTypes.text++;
      }
    }
    
    return inputTypes;
  }
  
  /**
   * Analyze output types from messages
   * @param {Array<Object>} messages - Messages to analyze
   * @param {Object} currentOutputTypes - Current output type analysis
   * @returns {Object} - Updated output type analysis
   * @private
   */
  analyzeOutputTypes(messages, currentOutputTypes) {
    const outputTypes = { ...currentOutputTypes };
    
    // Only analyze bot messages
    const botMessages = messages.filter(m => m.role === 'bot');
    
    for (const message of botMessages) {
      if (message.output && message.output.type) {
        const type = message.output.type.toLowerCase();
        
        switch (type) {
          case 'text':
            outputTypes.text++;
            break;
          case 'image':
            outputTypes.image++;
            break;
          case 'audio':
            outputTypes.audio++;
            break;
          case 'card':
            outputTypes.card++;
            break;
          case 'carousel':
            outputTypes.carousel++;
            break;
          case 'quick_reply':
            outputTypes.quickReply++;
            break;
          default:
            outputTypes.other++;
            break;
        }
      } else if (typeof message.content === 'string') {
        // Default to text if no output type
        outputTypes.text++;
      } else {
        outputTypes.other++;
      }
    }
    
    return outputTypes;
  }
  
  /**
   * Get analytics for a specific chatbot
   * @param {string} chatbotId - Chatbot ID
   * @param {string} period - Period type (daily, weekly, monthly, all)
   * @param {Date} date - Date to get analytics for
   * @returns {Promise<Object>} - Analytics data
   */
  async getAnalytics(chatbotId, period = 'all', date = new Date()) {
    try {
      // Format date based on period
      const formattedDate = period === 'all' ? new Date(0) : new Date(this.formatDate(date, period));
      
      // Find analytics document
      const analytics = await Analytics.findOne({
        chatbotId,
        period,
        date: formattedDate
      });
      
      if (!analytics) {
        return {
          chatbotId,
          period,
          date: formattedDate,
          metrics: {
            messageCount: 0,
            userMessageCount: 0,
            botMessageCount: 0,
            averageResponseTime: 0,
            conversationCount: 0,
            uniqueUserCount: 0,
            averageConversationLength: 0,
            averageUserMessageLength: 0,
            averageBotMessageLength: 0
          },
          sentimentAnalysis: {
            positive: 0,
            neutral: 0,
            negative: 0
          },
          intentAnalysis: {},
          topEntities: {},
          topUserQueries: [],
          topFailedQueries: [],
          responseRatings: {
            positive: 0,
            neutral: 0,
            negative: 0
          },
          inputTypes: {
            text: 0,
            image: 0,
            audio: 0,
            location: 0,
            other: 0
          },
          outputTypes: {
            text: 0,
            image: 0,
            audio: 0,
            card: 0,
            carousel: 0,
            quickReply: 0,
            other: 0
          }
        };
      }
      
      return analytics.toObject();
    } catch (error) {
      logger.error(`Error getting analytics for chatbot ${chatbotId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Get analytics for all chatbots
   * @param {string} period - Period type (daily, weekly, monthly, all)
   * @param {Date} date - Date to get analytics for
   * @returns {Promise<Array<Object>>} - Analytics data for all chatbots
   */
  async getAllAnalytics(period = 'all', date = new Date()) {
    try {
      // Format date based on period
      const formattedDate = period === 'all' ? new Date(0) : new Date(this.formatDate(date, period));
      
      // Find all analytics documents for the period and date
      const analytics = await Analytics.find({
        period,
        date: formattedDate
      });
      
      return analytics.map(a => a.toObject());
    } catch (error) {
      logger.error('Error getting analytics for all chatbots:', error.message);
      throw error;
    }
  }
  
  /**
   * Track response rating
   * @param {string} chatbotId - Chatbot ID
   * @param {string} conversationId - Conversation ID
   * @param {string} rating - Rating (positive, neutral, negative)
   * @returns {Promise<void>}
   */
  async trackResponseRating(chatbotId, conversationId, rating) {
    try {
      // Find all analytics documents for this chatbot
      const analyticsDocuments = await Analytics.find({ chatbotId });
      
      for (const analytics of analyticsDocuments) {
        // Update response ratings
        if (rating === 'positive') {
          analytics.responseRatings.positive++;
        } else if (rating === 'negative') {
          analytics.responseRatings.negative++;
        } else {
          analytics.responseRatings.neutral++;
        }
        
        analytics.updatedAt = new Date();
        await analytics.save();
      }
      
      logger.info(`Tracked response rating for chatbot ${chatbotId}, conversation ${conversationId}: ${rating}`);
    } catch (error) {
      logger.error(`Error tracking response rating for chatbot ${chatbotId}:`, error.message);
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
   * @returns {Promise<Object|null>} - All-time analytics or null if not found
   */
  async getAllTimeAnalytics(chatbotId) {
    try {
      logger.debug(`Getting all-time analytics for chatbot ${chatbotId}`);
      
      // Find the all-time analytics document
      const analytics = await Analytics.findOne({
        chatbotId,
        period: 'all'
      });
      
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
      const analyticsData = await Analytics.findByDateRange(chatbotId, startDate, endDate, period);
      
      if (!analyticsData || analyticsData.length === 0) {
        logger.warn(`No analytics data found for chatbot ${chatbotId} in the specified period`);
        return {
          chatbotId,
          period,
          startDate,
          endDate,
          generatedAt: new Date(),
          summary: {
            conversations: { total: 0, new: 0, completed: 0 },
            messages: { total: 0, user: 0, bot: 0 },
            users: { total: 0, new: 0, returning: 0 },
            engagement: { averageConversationLength: 0, averageResponseTime: 0 }
          },
          trends: {
            conversations: [],
            messages: [],
            users: [],
            engagement: []
          }
        };
      }
      
      // Calculate summary metrics
      const summary = {
        conversations: {
          total: analyticsData.reduce((sum, data) => sum + (data.metrics.conversations?.total || 0), 0),
          new: analyticsData.reduce((sum, data) => sum + (data.metrics.conversations?.new || 0), 0),
          completed: analyticsData.reduce((sum, data) => sum + (data.metrics.conversations?.completed || 0), 0)
        },
        messages: {
          total: analyticsData.reduce((sum, data) => sum + (data.metrics.messages?.total || 0), 0),
          user: analyticsData.reduce((sum, data) => sum + (data.metrics.messages?.user || 0), 0),
          bot: analyticsData.reduce((sum, data) => sum + (data.metrics.messages?.bot || 0), 0)
        },
        users: {
          total: Math.max(...analyticsData.map(data => data.metrics.users?.total || 0)),
          new: analyticsData.reduce((sum, data) => sum + (data.metrics.users?.new || 0), 0),
          returning: analyticsData.reduce((sum, data) => sum + (data.metrics.users?.returning || 0), 0)
        },
        engagement: {
          averageConversationLength: analyticsData.reduce((sum, data, index, array) => 
            sum + (data.metrics.engagement?.averageConversationLength || 0) / array.length, 0),
          averageResponseTime: analyticsData.reduce((sum, data, index, array) => 
            sum + (data.metrics.engagement?.averageResponseTime || 0) / array.length, 0)
        }
      };
      
      // Calculate trends
      const trends = {
        conversations: analyticsData.map(data => ({
          date: data.date,
          total: data.metrics.conversations?.total || 0,
          new: data.metrics.conversations?.new || 0,
          completed: data.metrics.conversations?.completed || 0
        })),
        messages: analyticsData.map(data => ({
          date: data.date,
          total: data.metrics.messages?.total || 0,
          user: data.metrics.messages?.user || 0,
          bot: data.metrics.messages?.bot || 0
        })),
        users: analyticsData.map(data => ({
          date: data.date,
          total: data.metrics.users?.total || 0,
          new: data.metrics.users?.new || 0,
          returning: data.metrics.users?.returning || 0
        })),
        engagement: analyticsData.map(data => ({
          date: data.date,
          averageConversationLength: data.metrics.engagement?.averageConversationLength || 0,
          averageResponseTime: data.metrics.engagement?.averageResponseTime || 0
        }))
      };
      
      // Generate the report
      const report = {
        chatbotId,
        period,
        startDate,
        endDate,
        generatedAt: new Date(),
        summary,
        trends
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
      totalResponseTime: 0,
      conversationCount: 0,
      uniqueUserCount: 0,
      totalConversationLength: 0,
      totalUserMessageLength: 0,
      totalBotMessageLength: 0
    };
    
    // Sum up metrics
    for (const analytics of analyticsData) {
      aggregated.messageCount += analytics.metrics.messageCount || 0;
      aggregated.userMessageCount += analytics.metrics.userMessageCount || 0;
      aggregated.botMessageCount += analytics.metrics.botMessageCount || 0;
      aggregated.totalResponseTime += (analytics.metrics.averageResponseTime || 0) * (analytics.metrics.botMessageCount || 0);
      aggregated.conversationCount += analytics.metrics.conversationCount || 0;
      aggregated.uniqueUserCount = Math.max(aggregated.uniqueUserCount, analytics.metrics.uniqueUserCount || 0);
      aggregated.totalConversationLength += (analytics.metrics.averageConversationLength || 0) * (analytics.metrics.conversationCount || 0);
      aggregated.totalUserMessageLength += (analytics.metrics.averageUserMessageLength || 0) * (analytics.metrics.userMessageCount || 0);
      aggregated.totalBotMessageLength += (analytics.metrics.averageBotMessageLength || 0) * (analytics.metrics.botMessageCount || 0);
    }
    
    // Calculate averages
    return {
      messageCount: aggregated.messageCount,
      userMessageCount: aggregated.userMessageCount,
      botMessageCount: aggregated.botMessageCount,
      averageResponseTime: aggregated.botMessageCount > 0 ? aggregated.totalResponseTime / aggregated.botMessageCount : 0,
      conversationCount: aggregated.conversationCount,
      uniqueUserCount: aggregated.uniqueUserCount,
      averageConversationLength: aggregated.conversationCount > 0 ? aggregated.totalConversationLength / aggregated.conversationCount : 0,
      averageUserMessageLength: aggregated.userMessageCount > 0 ? aggregated.totalUserMessageLength / aggregated.userMessageCount : 0,
      averageBotMessageLength: aggregated.botMessageCount > 0 ? aggregated.totalBotMessageLength / aggregated.botMessageCount : 0
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
        userSentimentTrend: 0
      };
    }
    
    // Sort by date
    const sorted = [...analyticsData].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Calculate trends
    const firstPeriod = sorted[0];
    const lastPeriod = sorted[sorted.length - 1];
    
    const messageCountTrend = this.calculatePercentageChange(
      firstPeriod.metrics.messageCount || 0,
      lastPeriod.metrics.messageCount || 0
    );
    
    const responseTimeTrend = this.calculatePercentageChange(
      firstPeriod.metrics.averageResponseTime || 0,
      lastPeriod.metrics.averageResponseTime || 0
    );
    
    const firstPositiveRatio = firstPeriod.sentimentAnalysis ? 
      (firstPeriod.sentimentAnalysis.positive || 0) / 
      ((firstPeriod.sentimentAnalysis.positive || 0) + 
       (firstPeriod.sentimentAnalysis.neutral || 0) + 
       (firstPeriod.sentimentAnalysis.negative || 0)) : 0;
    
    const lastPositiveRatio = lastPeriod.sentimentAnalysis ? 
      (lastPeriod.sentimentAnalysis.positive || 0) / 
      ((lastPeriod.sentimentAnalysis.positive || 0) + 
       (lastPeriod.sentimentAnalysis.neutral || 0) + 
       (lastPeriod.sentimentAnalysis.negative || 0)) : 0;
    
    const userSentimentTrend = this.calculatePercentageChange(firstPositiveRatio, lastPositiveRatio);
    
    return {
      messageCountTrend,
      responseTimeTrend,
      userSentimentTrend
    };
  }

  /**
   * Calculate percentage change between two values
   * @param {number} oldValue - Old value
   * @param {number} newValue - New value
   * @returns {number} - Percentage change
   * @private
   */
  calculatePercentageChange(oldValue, newValue) {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return ((newValue - oldValue) / oldValue) * 100;
  }
  
  /**
   * Get top intents from analytics data
   * @param {Array<Object>} analyticsData - Analytics data
   * @returns {Array<Object>} - Top intents
   * @private
   */
  /**
   * Get top intents from analytics data
   * @param {Array<Object>} analyticsData - Analytics data
   * @returns {Array<Object>} - Top intents
   * @private
   */
  getTopIntents(analyticsData) {
    const intentMap = new Map();
    
    for (const analytics of analyticsData) {
      if (analytics.intentAnalysis) {
        for (const [intent, count] of Object.entries(analytics.intentAnalysis)) {
          const currentCount = intentMap.get(intent) || 0;
          intentMap.set(intent, currentCount + count);
        }
      }
    }
    
    // Convert to array and sort
    return [...intentMap.entries()]
      .map(([intent, count]) => ({ intent, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
  
  /**
   * Get top entities from analytics data
   * @param {Array<Object>} analyticsData - Analytics data
   * @returns {Array<Object>} - Top entities
   * @private
   */
  /**
   * Get top entities from analytics data
   * @param {Array<Object>} analyticsData - Analytics data
   * @returns {Array<Object>} - Top entities
   * @private
   */
  getTopEntities(analyticsData) {
    const entityMap = new Map();
    
    for (const analytics of analyticsData) {
      if (analytics.topEntities) {
        for (const [entity, count] of Object.entries(analytics.topEntities)) {
          const currentCount = entityMap.get(entity) || 0;
          entityMap.set(entity, currentCount + count);
        }
      }
    }
    
    // Convert to array and sort
    return [...entityMap.entries()]
      .map(([entity, count]) => {
        const [type, value] = entity.split(':');
        return { type, value, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
  
  /**
   * Get top queries from analytics data
   * @param {Array<Object>} analyticsData - Analytics data
   * @returns {Array<Object>} - Top queries
   * @private
   */
  /**
   * Get top queries from analytics data
   * @param {Array<Object>} analyticsData - Analytics data
   * @returns {Array<Object>} - Top queries
   * @private
   */
  getTopQueries(analyticsData) {
    const queryMap = new Map();
    
    for (const analytics of analyticsData) {
      if (analytics.topUserQueries) {
        for (const { query, count } of analytics.topUserQueries) {
          const currentCount = queryMap.get(query) || 0;
          queryMap.set(query, currentCount + count);
        }
      }
    }
    
    // Convert to array and sort
    return [...queryMap.entries()]
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
  
  /**
   * Aggregate sentiment analysis from analytics data
   * @param {Array<Object>} analyticsData - Analytics data
   * @returns {Object} - Aggregated sentiment analysis
   * @private
   */
  /**
   * Aggregate sentiment analysis from analytics data
   * @param {Array<Object>} analyticsData - Analytics data
   * @returns {Object} - Aggregated sentiment analysis
   * @private
   */
  aggregateSentiment(analyticsData) {
    const sentiment = {
      positive: 0,
      neutral: 0,
      negative: 0
    };
    
    for (const analytics of analyticsData) {
      if (analytics.sentimentAnalysis) {
        sentiment.positive += analytics.sentimentAnalysis.positive || 0;
        sentiment.neutral += analytics.sentimentAnalysis.neutral || 0;
        sentiment.negative += analytics.sentimentAnalysis.negative || 0;
      }
    }
    
    return sentiment;
  }
  
  /**
   * Calculate performance metrics from analytics data
   * @param {Array<Object>} analyticsData - Analytics data
   * @returns {Object} - Performance metrics
   * @private
   */
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
        peakResponseTime: 0,
        responseTimeDistribution: []
      };
    }
    
    // Calculate response time metrics
    let totalResponseTime = 0;
    let totalResponses = 0;
    let peakResponseTime = 0;
    const responseTimeBuckets = {
      '0-500ms': 0,
      '500ms-1s': 0,
      '1s-2s': 0,
      '2s-5s': 0,
      '5s+': 0
    };
    
    for (const analytics of analyticsData) {
      const responseTime = analytics.metrics.averageResponseTime || 0;
      const responses = analytics.metrics.botMessageCount || 0;
      
      totalResponseTime += responseTime * responses;
      totalResponses += responses;
      peakResponseTime = Math.max(peakResponseTime, responseTime);
      
      // Categorize response times
      if (responseTime < 500) {
        responseTimeBuckets['0-500ms'] += responses;
      } else if (responseTime < 1000) {
        responseTimeBuckets['500ms-1s'] += responses;
      } else if (responseTime < 2000) {
        responseTimeBuckets['1s-2s'] += responses;
      } else if (responseTime < 5000) {
        responseTimeBuckets['2s-5s'] += responses;
      } else {
        responseTimeBuckets['5s+'] += responses;
      }
    }
    
    // Convert buckets to distribution
    const responseTimeDistribution = Object.entries(responseTimeBuckets)
      .map(([range, count]) => ({ range, count }));
    
    return {
      averageResponseTime: totalResponses > 0 ? totalResponseTime / totalResponses : 0,
      peakResponseTime,
      responseTimeDistribution
    };
  }
  
  /**
   * Generate insights from metrics and trends
   * @param {Object} metrics - Aggregated metrics
   * @param {Object} allTimeMetrics - All-time metrics
   * @param {Object} trends - Calculated trends
   * @returns {Array<string>} - Generated insights
   * @private
   */
  /**
   * Generate insights from metrics and trends
   * @param {Object} metrics - Aggregated metrics
   * @param {Object} allTimeMetrics - All-time metrics
   * @param {Object} trends - Calculated trends
   * @returns {Array<string>} - Generated insights
   * @private
   */
  generateInsights(metrics, allTimeMetrics, trends) {
    const insights = [];
    
    // Message volume insights
    if (metrics.messageCount > 0) {
      if (trends.messageCountTrend > 20) {
        insights.push(`Message volume increased by ${trends.messageCountTrend.toFixed(1)}% during this period.`);
      } else if (trends.messageCountTrend < -20) {
        insights.push(`Message volume decreased by ${Math.abs(trends.messageCountTrend).toFixed(1)}% during this period.`);
      }
      
      const allTimeAvg = allTimeMetrics.messageCount / 30; // Assuming 30 days average
      if (metrics.messageCount > allTimeAvg * 1.5) {
        insights.push(`Message volume is ${((metrics.messageCount / allTimeAvg) * 100).toFixed(1)}% higher than the historical average.`);
      }
    }
    
    // Response time insights
    if (metrics.averageResponseTime > 0) {
      if (trends.responseTimeTrend < -10) {
        insights.push(`Response time improved by ${Math.abs(trends.responseTimeTrend).toFixed(1)}% during this period.`);
      } else if (trends.responseTimeTrend > 10) {
        insights.push(`Response time increased by ${trends.responseTimeTrend.toFixed(1)}% during this period, indicating potential performance issues.`);
      }
    }
    
    // User sentiment insights
    if (trends.userSentimentTrend > 10) {
      insights.push(`User sentiment improved by ${trends.userSentimentTrend.toFixed(1)}% during this period.`);
    } else if (trends.userSentimentTrend < -10) {
      insights.push(`User sentiment declined by ${Math.abs(trends.userSentimentTrend).toFixed(1)}% during this period.`);
    }
    
    return insights;
  }
}

// Create singleton instance
const analyticsService = new AnalyticsService();

module.exports = analyticsService;
