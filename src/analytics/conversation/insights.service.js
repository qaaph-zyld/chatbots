/**
 * Conversation Insights Service
 * 
 * This service analyzes conversation data to generate actionable insights
 * about user behavior, common issues, and opportunities for improvement.
 */

require('@src/utils');
require('@src/analytics\conversation\tracking.service');

/**
 * Conversation Insights Service class
 */
class ConversationInsightsService {
  /**
   * Initialize the conversation insights service
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      insightGenerationInterval: parseInt(process.env.INSIGHT_GENERATION_INTERVAL || '86400'), // seconds (default: daily)
      minConversationsForInsights: parseInt(process.env.MIN_CONVERSATIONS_FOR_INSIGHTS || '10'),
      ...options
    };

    // Cache for insights
    this.cache = {
      lastUpdated: null,
      insights: null
    };

    logger.info('Conversation Insights Service initialized');
  }

  /**
   * Generate insights from conversation data
   * @param {Object} options - Options for insight generation
   * @returns {Promise<Object>} - Generated insights
   */
  async generateInsights(options = {}) {
    try {
      const insightOptions = {
        timeRange: options.timeRange || 30, // days
        botId: options.botId,
        userId: options.userId,
        useCache: options.useCache !== false,
        insightTypes: options.insightTypes || ['userBehavior', 'conversationPatterns', 'issueDetection', 'performanceMetrics'],
        ...options
      };

      // Check if we can use cached insights
      if (insightOptions.useCache && this.cache.lastUpdated && this.cache.insights) {
        const cacheAge = (Date.now() - this.cache.lastUpdated) / 1000; // in seconds
        if (cacheAge < this.options.insightGenerationInterval) {
          return this.cache.insights;
        }
      }

      // Calculate time range
      const endTime = new Date();
      const startTime = new Date();
      startTime.setDate(startTime.getDate() - insightOptions.timeRange);

      // Get conversations in time range
      const filter = {
        startedAt: { $gte: startTime.toISOString() },
        updatedAt: { $lte: endTime.toISOString() }
      };

      if (insightOptions.botId) {
        filter.botId = insightOptions.botId;
      }

      if (insightOptions.userId) {
        filter.userId = insightOptions.userId;
      }

      // Get conversations
      const conversations = await conversationTrackingService.storage.find(filter);

      // Check if we have enough data
      if (conversations.length < this.options.minConversationsForInsights) {
        return {
          timeRange: {
            start: startTime.toISOString(),
            end: endTime.toISOString(),
            days: insightOptions.timeRange
          },
          insights: [],
          insufficientData: true,
          message: `Not enough conversations (${conversations.length}) to generate meaningful insights. Minimum required: ${this.options.minConversationsForInsights}.`
        };
      }

      // Generate insights
      const insights = [];

      if (insightOptions.insightTypes.includes('userBehavior')) {
        const userBehaviorInsights = await this._generateUserBehaviorInsights(conversations);
        insights.push(...userBehaviorInsights);
      }

      if (insightOptions.insightTypes.includes('conversationPatterns')) {
        const conversationPatternInsights = await this._generateConversationPatternInsights(conversations);
        insights.push(...conversationPatternInsights);
      }

      if (insightOptions.insightTypes.includes('issueDetection')) {
        const issueDetectionInsights = await this._generateIssueDetectionInsights(conversations);
        insights.push(...issueDetectionInsights);
      }

      if (insightOptions.insightTypes.includes('performanceMetrics')) {
        const performanceMetricsInsights = await this._generatePerformanceMetricsInsights(conversations);
        insights.push(...performanceMetricsInsights);
      }

      // Sort insights by importance
      insights.sort((a, b) => b.importance - a.importance);

      // Create result
      const result = {
        timeRange: {
          start: startTime.toISOString(),
          end: endTime.toISOString(),
          days: insightOptions.timeRange
        },
        insights,
        generatedAt: new Date().toISOString()
      };

      // Update cache
      this.cache.lastUpdated = Date.now();
      this.cache.insights = result;

      return result;
    } catch (error) {
      logger.error('Error generating insights:', error.message);
      throw error;
    }
  }

  /**
   * Generate user behavior insights
   * @param {Array} conversations - Conversation data
   * @returns {Promise<Array>} - User behavior insights
   * @private
   */
  async _generateUserBehaviorInsights(conversations) {
    try {
      const insights = [];

      // Analyze user message patterns
      const userMessages = conversations.flatMap(conversation => 
        conversation.messages.filter(message => message.role === 'user')
      );

      // Calculate average message length
      const messageLengths = userMessages.map(message => message.content.length);
      const averageMessageLength = messageLengths.reduce((sum, length) => sum + length, 0) / messageLengths.length;

      // Analyze time of day patterns
      const messageHours = userMessages.map(message => new Date(message.timestamp).getHours());
      const hourCounts = Array(24).fill(0);
      messageHours.forEach(hour => hourCounts[hour]++);
      
      // Find peak hours (top 3)
      const peakHours = hourCounts
        .map((count, hour) => ({ hour, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .map(({ hour }) => hour);

      // Add insights
      if (peakHours.length > 0) {
        insights.push({
          type: 'userBehavior',
          subtype: 'peakUsageHours',
          title: 'Peak Usage Hours',
          description: `Users are most active during hours: ${peakHours.map(h => `${h}:00-${h+1}:00`).join(', ')}`,
          importance: 70,
          data: {
            peakHours,
            hourCounts
          }
        });
      }

      // Message length insight
      insights.push({
        type: 'userBehavior',
        subtype: 'messageLength',
        title: 'User Message Length',
        description: `Average user message length is ${Math.round(averageMessageLength)} characters`,
        importance: 50,
        data: {
          averageMessageLength,
          messageLengths
        }
      });

      return insights;
    } catch (error) {
      logger.error('Error generating user behavior insights:', error.message);
      return [];
    }
  }

  /**
   * Generate conversation pattern insights
   * @param {Array} conversations - Conversation data
   * @returns {Promise<Array>} - Conversation pattern insights
   * @private
   */
  async _generateConversationPatternInsights(conversations) {
    try {
      const insights = [];

      // Analyze conversation lengths
      const conversationLengths = conversations.map(conversation => 
        conversation.messages.length
      );
      
      const averageConversationLength = conversationLengths.reduce((sum, length) => sum + length, 0) / conversationLengths.length;

      // Analyze conversation durations
      const conversationDurations = conversations.map(conversation => {
        if (conversation.startedAt && conversation.updatedAt) {
          return new Date(conversation.updatedAt) - new Date(conversation.startedAt);
        }
        return 0;
      }).filter(duration => duration > 0);

      const averageConversationDuration = conversationDurations.reduce((sum, duration) => sum + duration, 0) / conversationDurations.length;

      // Add insights
      insights.push({
        type: 'conversationPatterns',
        subtype: 'conversationLength',
        title: 'Conversation Length',
        description: `Average conversation contains ${Math.round(averageConversationLength)} messages`,
        importance: 60,
        data: {
          averageConversationLength,
          conversationLengths
        }
      });

      insights.push({
        type: 'conversationPatterns',
        subtype: 'conversationDuration',
        title: 'Conversation Duration',
        description: `Average conversation lasts ${Math.round(averageConversationDuration / 60000)} minutes`,
        importance: 60,
        data: {
          averageConversationDuration: Math.round(averageConversationDuration / 1000), // in seconds
          conversationDurations: conversationDurations.map(d => Math.round(d / 1000)) // in seconds
        }
      });

      return insights;
    } catch (error) {
      logger.error('Error generating conversation pattern insights:', error.message);
      return [];
    }
  }

  /**
   * Generate issue detection insights
   * @param {Array} conversations - Conversation data
   * @returns {Promise<Array>} - Issue detection insights
   * @private
   */
  async _generateIssueDetectionInsights(conversations) {
    try {
      const insights = [];

      // Detect abandoned conversations (no user response after bot message)
      const abandonedConversations = conversations.filter(conversation => {
        const messages = conversation.messages;
        return messages.length > 0 && messages[messages.length - 1].role === 'bot';
      });

      const abandonedRate = (abandonedConversations.length / conversations.length) * 100;

      // Detect error messages
      const errorMessages = conversations.flatMap(conversation => 
        conversation.messages.filter(message => 
          message.role === 'bot' && 
          (message.content.toLowerCase().includes('error') || 
           message.content.toLowerCase().includes('sorry') || 
           message.content.toLowerCase().includes('cannot'))
        )
      );

      const errorRate = (errorMessages.length / conversations.length) * 100;

      // Add insights
      if (abandonedRate > 20) {
        insights.push({
          type: 'issueDetection',
          subtype: 'abandonedConversations',
          title: 'High Conversation Abandonment Rate',
          description: `${Math.round(abandonedRate)}% of conversations are abandoned by users after receiving a bot response`,
          importance: 90,
          data: {
            abandonedRate,
            abandonedCount: abandonedConversations.length,
            totalCount: conversations.length
          }
        });
      }

      if (errorRate > 10) {
        insights.push({
          type: 'issueDetection',
          subtype: 'errorMessages',
          title: 'High Error Message Rate',
          description: `${Math.round(errorRate)}% of conversations contain error messages from the bot`,
          importance: 85,
          data: {
            errorRate,
            errorCount: errorMessages.length,
            totalCount: conversations.length
          }
        });
      }

      return insights;
    } catch (error) {
      logger.error('Error generating issue detection insights:', error.message);
      return [];
    }
  }

  /**
   * Generate performance metrics insights
   * @param {Array} conversations - Conversation data
   * @returns {Promise<Array>} - Performance metrics insights
   * @private
   */
  async _generatePerformanceMetricsInsights(conversations) {
    try {
      const insights = [];

      // Calculate response times
      const responseTimes = [];
      
      conversations.forEach(conversation => {
        const messages = conversation.messages;
        
        for (let i = 1; i < messages.length; i++) {
          if (messages[i].role === 'bot' && messages[i-1].role === 'user') {
            const responseTime = new Date(messages[i].timestamp) - new Date(messages[i-1].timestamp);
            if (responseTime > 0) {
              responseTimes.push(responseTime);
            }
          }
        }
      });

      const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;

      // Add insights
      insights.push({
        type: 'performanceMetrics',
        subtype: 'responseTime',
        title: 'Bot Response Time',
        description: `Average bot response time is ${Math.round(averageResponseTime / 1000)} seconds`,
        importance: 75,
        data: {
          averageResponseTime: Math.round(averageResponseTime), // in ms
          responseTimes
        }
      });

      // Identify slow responses (more than 5 seconds)
      const slowResponses = responseTimes.filter(time => time > 5000);
      const slowResponseRate = (slowResponses.length / responseTimes.length) * 100;

      if (slowResponseRate > 20) {
        insights.push({
          type: 'performanceMetrics',
          subtype: 'slowResponses',
          title: 'High Rate of Slow Responses',
          description: `${Math.round(slowResponseRate)}% of bot responses take more than 5 seconds`,
          importance: 80,
          data: {
            slowResponseRate,
            slowResponseCount: slowResponses.length,
            totalResponseCount: responseTimes.length
          }
        });
      }

      return insights;
    } catch (error) {
      logger.error('Error generating performance metrics insights:', error.message);
      return [];
    }
  }

  /**
   * Get recommendations based on insights
   * @param {Array} insights - Generated insights
   * @returns {Array} - Recommendations
   */
  getRecommendations(insights) {
    try {
      const recommendations = [];

      // Process each insight to generate recommendations
      insights.forEach(insight => {
        switch (insight.type) {
          case 'issueDetection':
            if (insight.subtype === 'abandonedConversations') {
              recommendations.push({
                title: 'Reduce Conversation Abandonment',
                description: 'Review bot responses in abandoned conversations to identify potential issues with clarity or helpfulness',
                priority: 'high',
                relatedInsight: insight.title
              });
            } else if (insight.subtype === 'errorMessages') {
              recommendations.push({
                title: 'Reduce Error Messages',
                description: 'Analyze common error scenarios and improve fallback responses or add more training examples',
                priority: 'high',
                relatedInsight: insight.title
              });
            }
            break;
            
          case 'performanceMetrics':
            if (insight.subtype === 'slowResponses') {
              recommendations.push({
                title: 'Improve Response Time',
                description: 'Optimize bot processing or consider caching common responses to reduce response times',
                priority: 'medium',
                relatedInsight: insight.title
              });
            }
            break;
            
          case 'userBehavior':
            if (insight.subtype === 'peakUsageHours') {
              recommendations.push({
                title: 'Optimize for Peak Hours',
                description: 'Ensure system resources are allocated appropriately during peak usage hours',
                priority: 'medium',
                relatedInsight: insight.title
              });
            }
            break;
        }
      });

      // Sort recommendations by priority
      const priorityMap = { high: 3, medium: 2, low: 1 };
      recommendations.sort((a, b) => priorityMap[b.priority] - priorityMap[a.priority]);

      return recommendations;
    } catch (error) {
      logger.error('Error generating recommendations:', error.message);
      return [];
    }
  }
}

// Create and export service instance
const conversationInsightsService = new ConversationInsightsService();

module.exports = {
  ConversationInsightsService,
  conversationInsightsService
};
