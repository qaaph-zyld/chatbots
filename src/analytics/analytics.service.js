/**
 * Analytics Service
 * 
 * Provides conversation analytics and insights for chatbots
 */

const mongoose = require('mongoose');
const { logger } = require('../utils');

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
      
      // Add to buffer
      this.messageBuffer.push(messageData);
      
      // Process buffer if it reaches the threshold
      if (this.messageBuffer.length >= this.bufferSize) {
        await this.processBuffer();
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
}

// Create singleton instance
const analyticsService = new AnalyticsService();

module.exports = analyticsService;
