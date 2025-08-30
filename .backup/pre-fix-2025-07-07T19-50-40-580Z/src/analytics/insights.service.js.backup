/**
 * Insights Service
 * 
 * Provides conversation insights and recommendations based on analytics data
 */

require('@src/analytics\analytics.service');
require('@src/utils');

/**
 * Insights Service class
 */
class InsightsService {
  /**
   * Constructor
   */
  constructor() {
    logger.info('Insights Service initialized');
  }
  
  /**
   * Generate insights for a specific chatbot
   * @param {string} chatbotId - Chatbot ID
   * @param {string} period - Period type (daily, weekly, monthly, all)
   * @returns {Promise<Object>} - Insights and recommendations
   */
  async generateInsights(chatbotId, period = 'monthly') {
    try {
      // Get analytics data
      const analytics = await analyticsService.getAnalytics(chatbotId, period);
      
      // Generate insights
      const performanceInsights = this.generatePerformanceInsights(analytics);
      const userInsights = this.generateUserInsights(analytics);
      const contentInsights = this.generateContentInsights(analytics);
      const recommendations = this.generateRecommendations(analytics);
      
      return {
        chatbotId,
        period,
        date: analytics.date,
        performanceInsights,
        userInsights,
        contentInsights,
        recommendations,
        generatedAt: new Date()
      };
    } catch (error) {
      logger.error(`Error generating insights for chatbot ${chatbotId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Generate performance insights
   * @param {Object} analytics - Analytics data
   * @returns {Array<Object>} - Performance insights
   * @private
   */
  generatePerformanceInsights(analytics) {
    const insights = [];
    
    // Response time insights
    if (analytics.metrics.averageResponseTime > 0) {
      const responseTimeInsight = {
        type: 'response_time',
        title: 'Response Time',
        value: analytics.metrics.averageResponseTime,
        unit: 'ms',
        status: this.getResponseTimeStatus(analytics.metrics.averageResponseTime),
        description: this.getResponseTimeDescription(analytics.metrics.averageResponseTime)
      };
      
      insights.push(responseTimeInsight);
    }
    
    // Message volume insights
    const messageVolumeInsight = {
      type: 'message_volume',
      title: 'Message Volume',
      value: analytics.metrics.messageCount,
      unit: 'messages',
      status: 'neutral',
      description: `Total of ${analytics.metrics.messageCount} messages processed (${analytics.metrics.userMessageCount} user, ${analytics.metrics.botMessageCount} bot).`
    };
    
    insights.push(messageVolumeInsight);
    
    // Conversation insights
    const conversationInsight = {
      type: 'conversations',
      title: 'Conversations',
      value: analytics.metrics.conversationCount,
      unit: 'conversations',
      status: 'neutral',
      description: `Total of ${analytics.metrics.conversationCount} conversations with an average length of ${analytics.metrics.averageConversationLength.toFixed(1)} messages.`
    };
    
    insights.push(conversationInsight);
    
    // User engagement insights
    const userEngagementInsight = {
      type: 'user_engagement',
      title: 'User Engagement',
      value: analytics.metrics.uniqueUserCount,
      unit: 'users',
      status: 'neutral',
      description: `${analytics.metrics.uniqueUserCount} unique users engaged with the chatbot.`
    };
    
    insights.push(userEngagementInsight);
    
    // Response rating insights
    const totalRatings = analytics.responseRatings.positive + analytics.responseRatings.neutral + analytics.responseRatings.negative;
    
    if (totalRatings > 0) {
      const positiveRatio = analytics.responseRatings.positive / totalRatings;
      const negativeRatio = analytics.responseRatings.negative / totalRatings;
      
      let status = 'neutral';
      if (positiveRatio > 0.8) status = 'excellent';
      else if (positiveRatio > 0.6) status = 'good';
      else if (negativeRatio > 0.4) status = 'poor';
      else if (negativeRatio > 0.2) status = 'fair';
      
      const responseRatingInsight = {
        type: 'response_ratings',
        title: 'Response Ratings',
        value: (positiveRatio * 100).toFixed(1),
        unit: '%',
        status,
        description: `${(positiveRatio * 100).toFixed(1)}% positive ratings (${analytics.responseRatings.positive} positive, ${analytics.responseRatings.neutral} neutral, ${analytics.responseRatings.negative} negative).`
      };
      
      insights.push(responseRatingInsight);
    }
    
    return insights;
  }
  
  /**
   * Generate user insights
   * @param {Object} analytics - Analytics data
   * @returns {Array<Object>} - User insights
   * @private
   */
  generateUserInsights(analytics) {
    const insights = [];
    
    // Sentiment insights
    const totalSentiment = analytics.sentimentAnalysis.positive + analytics.sentimentAnalysis.neutral + analytics.sentimentAnalysis.negative;
    
    if (totalSentiment > 0) {
      const positiveRatio = analytics.sentimentAnalysis.positive / totalSentiment;
      const negativeRatio = analytics.sentimentAnalysis.negative / totalSentiment;
      
      let status = 'neutral';
      if (positiveRatio > 0.7) status = 'excellent';
      else if (positiveRatio > 0.5) status = 'good';
      else if (negativeRatio > 0.3) status = 'poor';
      else if (negativeRatio > 0.2) status = 'fair';
      
      const sentimentInsight = {
        type: 'sentiment',
        title: 'User Sentiment',
        value: (positiveRatio * 100).toFixed(1),
        unit: '%',
        status,
        description: `${(positiveRatio * 100).toFixed(1)}% positive sentiment in user messages (${analytics.sentimentAnalysis.positive} positive, ${analytics.sentimentAnalysis.neutral} neutral, ${analytics.sentimentAnalysis.negative} negative).`
      };
      
      insights.push(sentimentInsight);
    }
    
    // Intent insights
    if (analytics.intentAnalysis && Object.keys(analytics.intentAnalysis).length > 0) {
      const intents = Object.entries(analytics.intentAnalysis)
        .map(([intent, count]) => ({ intent, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      const intentInsight = {
        type: 'intents',
        title: 'Top User Intents',
        value: intents.length,
        unit: 'intents',
        status: 'neutral',
        description: `Top user intents: ${intents.map(i => `${i.intent} (${i.count})`).join(', ')}.`,
        details: intents
      };
      
      insights.push(intentInsight);
    }
    
    // Entity insights
    if (analytics.topEntities && Object.keys(analytics.topEntities).length > 0) {
      const entities = Object.entries(analytics.topEntities)
        .map(([entity, count]) => {
          const [type, value] = entity.split(':');
          return { type, value, count };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      const entityInsight = {
        type: 'entities',
        title: 'Top Entities',
        value: entities.length,
        unit: 'entities',
        status: 'neutral',
        description: `Top entities mentioned: ${entities.map(e => `${e.value} (${e.type})`).join(', ')}.`,
        details: entities
      };
      
      insights.push(entityInsight);
    }
    
    // Input type insights
    const totalInputs = analytics.inputTypes.text + analytics.inputTypes.image + 
      analytics.inputTypes.audio + analytics.inputTypes.location + analytics.inputTypes.other;
    
    if (totalInputs > 0) {
      const textRatio = analytics.inputTypes.text / totalInputs;
      const multimodalRatio = 1 - textRatio;
      
      const inputTypeInsight = {
        type: 'input_types',
        title: 'Input Types',
        value: (multimodalRatio * 100).toFixed(1),
        unit: '%',
        status: 'neutral',
        description: `${(textRatio * 100).toFixed(1)}% text inputs, ${(multimodalRatio * 100).toFixed(1)}% multi-modal inputs (${analytics.inputTypes.image} image, ${analytics.inputTypes.audio} audio, ${analytics.inputTypes.location} location).`
      };
      
      insights.push(inputTypeInsight);
    }
    
    return insights;
  }
  
  /**
   * Generate content insights
   * @param {Object} analytics - Analytics data
   * @returns {Array<Object>} - Content insights
   * @private
   */
  generateContentInsights(analytics) {
    const insights = [];
    
    // Top queries insights
    if (analytics.topUserQueries && analytics.topUserQueries.length > 0) {
      const queries = analytics.topUserQueries.slice(0, 5);
      
      const topQueriesInsight = {
        type: 'top_queries',
        title: 'Top User Queries',
        value: queries.length,
        unit: 'queries',
        status: 'neutral',
        description: `Most frequent user queries: ${queries.map(q => `"${q.query}" (${q.count})`).join(', ')}.`,
        details: queries
      };
      
      insights.push(topQueriesInsight);
    }
    
    // Failed queries insights
    if (analytics.topFailedQueries && analytics.topFailedQueries.length > 0) {
      const queries = analytics.topFailedQueries.slice(0, 5);
      
      const failedQueriesInsight = {
        type: 'failed_queries',
        title: 'Failed Queries',
        value: queries.length,
        unit: 'queries',
        status: queries.length > 0 ? 'poor' : 'good',
        description: `Queries the chatbot struggled with: ${queries.map(q => `"${q.query}" (${q.count})`).join(', ')}.`,
        details: queries
      };
      
      insights.push(failedQueriesInsight);
    }
    
    // Output type insights
    const totalOutputs = analytics.outputTypes.text + analytics.outputTypes.image + 
      analytics.outputTypes.audio + analytics.outputTypes.card + 
      analytics.outputTypes.carousel + analytics.outputTypes.quickReply + 
      analytics.outputTypes.other;
    
    if (totalOutputs > 0) {
      const textRatio = analytics.outputTypes.text / totalOutputs;
      const richRatio = 1 - textRatio;
      
      const outputTypeInsight = {
        type: 'output_types',
        title: 'Output Types',
        value: (richRatio * 100).toFixed(1),
        unit: '%',
        status: 'neutral',
        description: `${(textRatio * 100).toFixed(1)}% text outputs, ${(richRatio * 100).toFixed(1)}% rich outputs (${analytics.outputTypes.image} image, ${analytics.outputTypes.audio} audio, ${analytics.outputTypes.card} card, ${analytics.outputTypes.carousel} carousel, ${analytics.outputTypes.quickReply} quick reply).`
      };
      
      insights.push(outputTypeInsight);
    }
    
    // Message length insights
    if (analytics.metrics.averageUserMessageLength > 0 && analytics.metrics.averageBotMessageLength > 0) {
      const ratio = analytics.metrics.averageBotMessageLength / analytics.metrics.averageUserMessageLength;
      
      let status = 'neutral';
      if (ratio > 3) status = 'poor';
      else if (ratio > 2) status = 'fair';
      else if (ratio < 0.5) status = 'poor';
      else status = 'good';
      
      const messageLengthInsight = {
        type: 'message_length',
        title: 'Message Length',
        value: ratio.toFixed(1),
        unit: 'ratio',
        status,
        description: `Average user message: ${analytics.metrics.averageUserMessageLength.toFixed(1)} chars, Average bot response: ${analytics.metrics.averageBotMessageLength.toFixed(1)} chars (ratio: ${ratio.toFixed(1)}).`
      };
      
      insights.push(messageLengthInsight);
    }
    
    return insights;
  }
  
  /**
   * Generate recommendations based on analytics
   * @param {Object} analytics - Analytics data
   * @returns {Array<Object>} - Recommendations
   * @private
   */
  generateRecommendations(analytics) {
    const recommendations = [];
    
    // Response time recommendations
    if (analytics.metrics.averageResponseTime > 2000) {
      recommendations.push({
        type: 'response_time',
        priority: 'high',
        title: 'Improve Response Time',
        description: 'Response time is too slow. Consider optimizing the chatbot engine or reducing the complexity of responses.',
        actions: [
          'Review and optimize the chatbot engine configuration',
          'Reduce the number of API calls in response generation',
          'Implement caching for frequently accessed data',
          'Consider using a faster NLP service'
        ]
      });
    }
    
    // Sentiment recommendations
    const totalSentiment = analytics.sentimentAnalysis.positive + analytics.sentimentAnalysis.neutral + analytics.sentimentAnalysis.negative;
    if (totalSentiment > 0) {
      const negativeRatio = analytics.sentimentAnalysis.negative / totalSentiment;
      
      if (negativeRatio > 0.3) {
        recommendations.push({
          type: 'sentiment',
          priority: 'high',
          title: 'Address Negative Sentiment',
          description: 'High level of negative sentiment detected in user messages. Consider improving the chatbot responses to better address user concerns.',
          actions: [
            'Review conversations with negative sentiment to identify patterns',
            'Improve responses for common issues',
            'Add more empathetic responses for frustrated users',
            'Train the chatbot on handling difficult situations'
          ]
        });
      }
    }
    
    // Failed queries recommendations
    if (analytics.topFailedQueries && analytics.topFailedQueries.length > 0) {
      recommendations.push({
        type: 'failed_queries',
        priority: 'medium',
        title: 'Address Failed Queries',
        description: 'The chatbot is struggling with certain queries. Consider adding knowledge or training for these topics.',
        actions: [
          'Add knowledge base items for the top failed queries',
          'Create training examples for these queries',
          'Implement fallback responses that guide users to alternative topics'
        ],
        details: analytics.topFailedQueries.slice(0, 5)
      });
    }
    
    // Multi-modal recommendations
    const totalInputs = analytics.inputTypes.text + analytics.inputTypes.image + 
      analytics.inputTypes.audio + analytics.inputTypes.location + analytics.inputTypes.other;
    
    if (totalInputs > 0) {
      const textRatio = analytics.inputTypes.text / totalInputs;
      
      if (textRatio > 0.95) {
        recommendations.push({
          type: 'multi_modal',
          priority: 'low',
          title: 'Encourage Multi-modal Interactions',
          description: 'Users are primarily using text inputs. Consider encouraging the use of other input types.',
          actions: [
            'Add prompts for users to try image or audio inputs',
            'Create quick reply buttons for uploading images or audio',
            'Showcase multi-modal capabilities in welcome messages'
          ]
        });
      }
    }
    
    // Rich content recommendations
    const totalOutputs = analytics.outputTypes.text + analytics.outputTypes.image + 
      analytics.outputTypes.audio + analytics.outputTypes.card + 
      analytics.outputTypes.carousel + analytics.outputTypes.quickReply + 
      analytics.outputTypes.other;
    
    if (totalOutputs > 0) {
      const textRatio = analytics.outputTypes.text / totalOutputs;
      
      if (textRatio > 0.9) {
        recommendations.push({
          type: 'rich_content',
          priority: 'medium',
          title: 'Use More Rich Content',
          description: 'Responses are primarily text-based. Consider using more rich content types for better engagement.',
          actions: [
            'Add cards for structured information',
            'Use carousels for presenting multiple options',
            'Implement quick replies for common follow-up questions',
            'Generate images for visual explanations'
          ]
        });
      }
    }
    
    // Intent recommendations
    if (analytics.intentAnalysis) {
      const intents = Object.entries(analytics.intentAnalysis);
      const totalIntents = intents.reduce((sum, [_, count]) => sum + count, 0);
      
      if (intents.length < 5 && totalIntents > 100) {
        recommendations.push({
          type: 'intents',
          priority: 'medium',
          title: 'Expand Intent Recognition',
          description: 'The chatbot is recognizing a limited number of intents. Consider expanding intent recognition capabilities.',
          actions: [
            'Add more intent patterns to the NLP service',
            'Train the chatbot on a wider variety of user queries',
            'Implement a feedback mechanism for unrecognized intents'
          ]
        });
      }
    }
    
    return recommendations;
  }
  
  /**
   * Get response time status
   * @param {number} responseTime - Response time in milliseconds
   * @returns {string} - Status (excellent, good, fair, poor)
   * @private
   */
  getResponseTimeStatus(responseTime) {
    if (responseTime < 500) return 'excellent';
    if (responseTime < 1000) return 'good';
    if (responseTime < 2000) return 'fair';
    return 'poor';
  }
  
  /**
   * Get response time description
   * @param {number} responseTime - Response time in milliseconds
   * @returns {string} - Description
   * @private
   */
  getResponseTimeDescription(responseTime) {
    if (responseTime < 500) {
      return `Excellent response time of ${responseTime}ms.`;
    } else if (responseTime < 1000) {
      return `Good response time of ${responseTime}ms.`;
    } else if (responseTime < 2000) {
      return `Fair response time of ${responseTime}ms. Consider optimizing for better user experience.`;
    } else {
      return `Poor response time of ${responseTime}ms. Users may experience delays. Optimization recommended.`;
    }
  }
  
  /**
   * Compare analytics between two periods
   * @param {string} chatbotId - Chatbot ID
   * @param {string} period - Period type (daily, weekly, monthly)
   * @param {Date} currentDate - Current period date
   * @param {Date} previousDate - Previous period date
   * @returns {Promise<Object>} - Comparison results
   */
  async compareAnalytics(chatbotId, period = 'monthly', currentDate = new Date(), previousDate = null) {
    try {
      // Calculate previous date if not provided
      if (!previousDate) {
        previousDate = new Date(currentDate);
        
        switch (period) {
          case 'daily':
            previousDate.setDate(previousDate.getDate() - 1);
            break;
          case 'weekly':
            previousDate.setDate(previousDate.getDate() - 7);
            break;
          case 'monthly':
            previousDate.setMonth(previousDate.getMonth() - 1);
            break;
          default:
            throw new Error(`Invalid period: ${period}`);
        }
      }
      
      // Get analytics for both periods
      const currentAnalytics = await analyticsService.getAnalytics(chatbotId, period, currentDate);
      const previousAnalytics = await analyticsService.getAnalytics(chatbotId, period, previousDate);
      
      // Compare metrics
      const metricComparisons = this.compareMetrics(currentAnalytics.metrics, previousAnalytics.metrics);
      
      // Compare sentiment
      const sentimentComparison = this.compareSentiment(
        currentAnalytics.sentimentAnalysis,
        previousAnalytics.sentimentAnalysis
      );
      
      // Compare input and output types
      const inputTypeComparison = this.compareInputTypes(
        currentAnalytics.inputTypes,
        previousAnalytics.inputTypes
      );
      
      const outputTypeComparison = this.compareOutputTypes(
        currentAnalytics.outputTypes,
        previousAnalytics.outputTypes
      );
      
      return {
        chatbotId,
        period,
        currentDate,
        previousDate,
        metrics: metricComparisons,
        sentiment: sentimentComparison,
        inputTypes: inputTypeComparison,
        outputTypes: outputTypeComparison,
        generatedAt: new Date()
      };
    } catch (error) {
      logger.error(`Error comparing analytics for chatbot ${chatbotId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Compare metrics between two periods
   * @param {Object} current - Current metrics
   * @param {Object} previous - Previous metrics
   * @returns {Object} - Metric comparisons
   * @private
   */
  compareMetrics(current, previous) {
    const comparisons = {};
    
    for (const [key, value] of Object.entries(current)) {
      const previousValue = previous[key] || 0;
      const difference = value - previousValue;
      const percentChange = previousValue === 0 ? 100 : (difference / previousValue) * 100;
      
      comparisons[key] = {
        current: value,
        previous: previousValue,
        difference,
        percentChange,
        trend: difference > 0 ? 'up' : difference < 0 ? 'down' : 'stable'
      };
    }
    
    return comparisons;
  }
  
  /**
   * Compare sentiment between two periods
   * @param {Object} current - Current sentiment analysis
   * @param {Object} previous - Previous sentiment analysis
   * @returns {Object} - Sentiment comparison
   * @private
   */
  compareSentiment(current, previous) {
    const currentTotal = current.positive + current.neutral + current.negative;
    const previousTotal = previous.positive + previous.neutral + previous.negative;
    
    const currentPositiveRatio = currentTotal > 0 ? current.positive / currentTotal : 0;
    const previousPositiveRatio = previousTotal > 0 ? previous.positive / previousTotal : 0;
    
    const difference = currentPositiveRatio - previousPositiveRatio;
    const percentChange = previousPositiveRatio === 0 ? 100 : (difference / previousPositiveRatio) * 100;
    
    return {
      positive: {
        current: current.positive,
        previous: previous.positive,
        difference: current.positive - previous.positive,
        percentChange: previous.positive === 0 ? 100 : ((current.positive - previous.positive) / previous.positive) * 100,
        trend: current.positive > previous.positive ? 'up' : current.positive < previous.positive ? 'down' : 'stable'
      },
      neutral: {
        current: current.neutral,
        previous: previous.neutral,
        difference: current.neutral - previous.neutral,
        percentChange: previous.neutral === 0 ? 100 : ((current.neutral - previous.neutral) / previous.neutral) * 100,
        trend: current.neutral > previous.neutral ? 'up' : current.neutral < previous.neutral ? 'down' : 'stable'
      },
      negative: {
        current: current.negative,
        previous: previous.negative,
        difference: current.negative - previous.negative,
        percentChange: previous.negative === 0 ? 100 : ((current.negative - previous.negative) / previous.negative) * 100,
        trend: current.negative > previous.negative ? 'up' : current.negative < previous.negative ? 'down' : 'stable'
      },
      positiveRatio: {
        current: currentPositiveRatio,
        previous: previousPositiveRatio,
        difference,
        percentChange,
        trend: difference > 0 ? 'up' : difference < 0 ? 'down' : 'stable'
      }
    };
  }
  
  /**
   * Compare input types between two periods
   * @param {Object} current - Current input types
   * @param {Object} previous - Previous input types
   * @returns {Object} - Input type comparison
   * @private
   */
  compareInputTypes(current, previous) {
    const comparisons = {};
    
    for (const [key, value] of Object.entries(current)) {
      const previousValue = previous[key] || 0;
      const difference = value - previousValue;
      const percentChange = previousValue === 0 ? 100 : (difference / previousValue) * 100;
      
      comparisons[key] = {
        current: value,
        previous: previousValue,
        difference,
        percentChange,
        trend: difference > 0 ? 'up' : difference < 0 ? 'down' : 'stable'
      };
    }
    
    return comparisons;
  }
  
  /**
   * Compare output types between two periods
   * @param {Object} current - Current output types
   * @param {Object} previous - Previous output types
   * @returns {Object} - Output type comparison
   * @private
   */
  compareOutputTypes(current, previous) {
    const comparisons = {};
    
    for (const [key, value] of Object.entries(current)) {
      const previousValue = previous[key] || 0;
      const difference = value - previousValue;
      const percentChange = previousValue === 0 ? 100 : (difference / previousValue) * 100;
      
      comparisons[key] = {
        current: value,
        previous: previousValue,
        difference,
        percentChange,
        trend: difference > 0 ? 'up' : difference < 0 ? 'down' : 'stable'
      };
    }
    
    return comparisons;
  }
}

// Create singleton instance
const insightsService = new InsightsService();

module.exports = insightsService;
