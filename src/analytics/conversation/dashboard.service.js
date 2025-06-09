/**
 * Conversation Analytics Dashboard Service
 * 
 * This service provides capabilities for generating analytics dashboards
 * based on conversation data. It processes data from the conversation tracking
 * service and generates visualizations and reports.
 */

require('@src/utils');
require('@src/analytics\conversation\tracking.service');

/**
 * Conversation Dashboard Service class
 */
class ConversationDashboardService {
  /**
   * Initialize the conversation dashboard service
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      defaultTimeRange: parseInt(process.env.DEFAULT_ANALYTICS_TIME_RANGE || '30'), // days
      refreshInterval: parseInt(process.env.ANALYTICS_REFRESH_INTERVAL || '3600'), // seconds
      useExternalAnalytics: process.env.USE_EXTERNAL_ANALYTICS === 'true' || false,
      externalAnalyticsProvider: process.env.EXTERNAL_ANALYTICS_PROVIDER || 'matomo',
      ...options
    };

    // Cache for dashboard data
    this.cache = {
      lastUpdated: null,
      dashboardData: null
    };

    logger.info('Conversation Dashboard Service initialized with options:', {
      defaultTimeRange: this.options.defaultTimeRange,
      refreshInterval: this.options.refreshInterval,
      useExternalAnalytics: this.options.useExternalAnalytics,
      externalAnalyticsProvider: this.options.externalAnalyticsProvider
    });
  }

  /**
   * Generate a dashboard
   * @param {Object} options - Dashboard options
   * @returns {Promise<Object>} - Dashboard data
   */
  async generateDashboard(options = {}) {
    try {
      const dashboardOptions = {
        timeRange: options.timeRange || this.options.defaultTimeRange,
        botId: options.botId,
        userId: options.userId,
        useCache: options.useCache !== false,
        metrics: options.metrics || ['messageCount', 'responseTime', 'userSatisfaction', 'topIntents', 'conversationLength'],
        ...options
      };

      // Check if we can use cached data
      if (dashboardOptions.useCache && this.cache.lastUpdated && this.cache.dashboardData) {
        const cacheAge = (Date.now() - this.cache.lastUpdated) / 1000; // in seconds
        if (cacheAge < this.options.refreshInterval) {
          return this.cache.dashboardData;
        }
      }

      // Generate dashboard data
      const dashboardData = await this._generateDashboardData(dashboardOptions);

      // Update cache
      this.cache.lastUpdated = Date.now();
      this.cache.dashboardData = dashboardData;

      return dashboardData;
    } catch (error) {
      logger.error('Error generating dashboard:', error.message);
      throw error;
    }
  }

  /**
   * Generate dashboard data
   * @param {Object} options - Dashboard options
   * @returns {Promise<Object>} - Dashboard data
   * @private
   */
  async _generateDashboardData(options) {
    // Calculate time range
    const endTime = new Date();
    const startTime = new Date();
    startTime.setDate(startTime.getDate() - options.timeRange);

    // Get conversations in time range
    const filter = {
      startedAt: { $gte: startTime.toISOString() },
      updatedAt: { $lte: endTime.toISOString() }
    };

    if (options.botId) {
      filter.botId = options.botId;
    }

    if (options.userId) {
      filter.userId = options.userId;
    }

    // Get conversation statistics
    const statistics = await conversationTrackingService.getConversationStatistics(filter);

    // Generate dashboard data
    const dashboardData = {
      timeRange: {
        start: startTime.toISOString(),
        end: endTime.toISOString(),
        days: options.timeRange
      },
      overview: {
        totalConversations: statistics.totalConversations,
        averageMessageCount: Math.round(statistics.averageMessageCount * 10) / 10,
        averageResponseTime: Math.round(statistics.averageResponseTime / 1000), // in seconds
        averageConversationLength: Math.round(statistics.averageConversationLength / 60000) // in minutes
      },
      charts: {}
    };

    // Generate charts based on requested metrics
    if (options.metrics.includes('messageCount')) {
      dashboardData.charts.messageCount = await this._generateMessageCountChart(filter);
    }

    if (options.metrics.includes('responseTime')) {
      dashboardData.charts.responseTime = await this._generateResponseTimeChart(filter);
    }

    if (options.metrics.includes('userSatisfaction')) {
      dashboardData.charts.userSatisfaction = await this._generateUserSatisfactionChart(filter);
    }

    if (options.metrics.includes('topIntents')) {
      dashboardData.charts.topIntents = await this._generateTopIntentsChart(filter);
    }

    if (options.metrics.includes('conversationLength')) {
      dashboardData.charts.conversationLength = await this._generateConversationLengthChart(filter);
    }

    return dashboardData;
  }

  /**
   * Generate message count chart data
   * @param {Object} filter - Filter criteria
   * @returns {Promise<Object>} - Chart data
   * @private
   */
  async _generateMessageCountChart(filter) {
    try {
      // Get conversations
      const conversations = await conversationTrackingService.storage.find(filter);

      // Group by day
      const messagesByDay = {};
      const userMessagesByDay = {};
      const botMessagesByDay = {};

      conversations.forEach(conversation => {
        const date = new Date(conversation.startedAt).toISOString().split('T')[0];
        
        messagesByDay[date] = (messagesByDay[date] || 0) + (conversation.messageCount || 0);
        userMessagesByDay[date] = (userMessagesByDay[date] || 0) + (conversation.metrics?.userMessageCount || 0);
        botMessagesByDay[date] = (botMessagesByDay[date] || 0) + (conversation.metrics?.botMessageCount || 0);
      });

      // Convert to arrays for charting
      const labels = Object.keys(messagesByDay).sort();
      const totalMessages = labels.map(date => messagesByDay[date]);
      const userMessages = labels.map(date => userMessagesByDay[date]);
      const botMessages = labels.map(date => botMessagesByDay[date]);

      return {
        type: 'line',
        labels,
        datasets: [
          {
            label: 'Total Messages',
            data: totalMessages
          },
          {
            label: 'User Messages',
            data: userMessages
          },
          {
            label: 'Bot Messages',
            data: botMessages
          }
        ]
      };
    } catch (error) {
      logger.error('Error generating message count chart:', error.message);
      return {
        type: 'line',
        labels: [],
        datasets: []
      };
    }
  }

  /**
   * Generate response time chart data
   * @param {Object} filter - Filter criteria
   * @returns {Promise<Object>} - Chart data
   * @private
   */
  async _generateResponseTimeChart(filter) {
    try {
      // Get conversations
      const conversations = await conversationTrackingService.storage.find(filter);

      // Group by day
      const responseTimeByDay = {};
      const responseCountByDay = {};

      conversations.forEach(conversation => {
        if (conversation.metrics?.totalResponseTime) {
          const date = new Date(conversation.startedAt).toISOString().split('T')[0];
          
          responseTimeByDay[date] = (responseTimeByDay[date] || 0) + conversation.metrics.totalResponseTime;
          responseCountByDay[date] = (responseCountByDay[date] || 0) + conversation.metrics.botMessageCount;
        }
      });

      // Calculate average response time by day
      const averageResponseTimeByDay = {};
      Object.keys(responseTimeByDay).forEach(date => {
        if (responseCountByDay[date] > 0) {
          // Convert to seconds
          averageResponseTimeByDay[date] = Math.round(responseTimeByDay[date] / responseCountByDay[date] / 1000);
        }
      });

      // Convert to arrays for charting
      const labels = Object.keys(averageResponseTimeByDay).sort();
      const data = labels.map(date => averageResponseTimeByDay[date]);

      return {
        type: 'line',
        labels,
        datasets: [
          {
            label: 'Average Response Time (seconds)',
            data
          }
        ]
      };
    } catch (error) {
      logger.error('Error generating response time chart:', error.message);
      return {
        type: 'line',
        labels: [],
        datasets: []
      };
    }
  }

  /**
   * Generate user satisfaction chart data
   * @param {Object} filter - Filter criteria
   * @returns {Promise<Object>} - Chart data
   * @private
   */
  async _generateUserSatisfactionChart(filter) {
    try {
      // In a real implementation, this would use actual user satisfaction data
      // For now, we'll generate placeholder data
      return {
        type: 'pie',
        labels: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied'],
        datasets: [
          {
            data: [45, 30, 15, 7, 3]
          }
        ]
      };
    } catch (error) {
      logger.error('Error generating user satisfaction chart:', error.message);
      return {
        type: 'pie',
        labels: [],
        datasets: []
      };
    }
  }

  /**
   * Generate top intents chart data
   * @param {Object} filter - Filter criteria
   * @returns {Promise<Object>} - Chart data
   * @private
   */
  async _generateTopIntentsChart(filter) {
    try {
      // Get conversations
      const conversations = await conversationTrackingService.storage.find(filter);

      // Count intents
      const intentCounts = {};

      conversations.forEach(conversation => {
        conversation.messages.forEach(message => {
          if (message.nlpData && message.nlpData.intent && message.nlpData.intent.name) {
            const intent = message.nlpData.intent.name;
            intentCounts[intent] = (intentCounts[intent] || 0) + 1;
          }
        });
      });

      // Sort intents by count
      const sortedIntents = Object.entries(intentCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10); // Top 10

      // Convert to arrays for charting
      const labels = sortedIntents.map(([intent]) => intent);
      const data = sortedIntents.map(([, count]) => count);

      return {
        type: 'bar',
        labels,
        datasets: [
          {
            label: 'Intent Count',
            data
          }
        ]
      };
    } catch (error) {
      logger.error('Error generating top intents chart:', error.message);
      return {
        type: 'bar',
        labels: [],
        datasets: []
      };
    }
  }

  /**
   * Generate conversation length chart data
   * @param {Object} filter - Filter criteria
   * @returns {Promise<Object>} - Chart data
   * @private
   */
  async _generateConversationLengthChart(filter) {
    try {
      // Get conversations
      const conversations = await conversationTrackingService.storage.find(filter);

      // Calculate conversation lengths in minutes
      const conversationLengths = conversations.map(conversation => {
        if (conversation.startedAt && conversation.updatedAt) {
          return Math.round((new Date(conversation.updatedAt) - new Date(conversation.startedAt)) / 60000);
        }
        return 0;
      }).filter(length => length > 0);

      // Group into buckets
      const buckets = {
        '< 1 min': 0,
        '1-5 min': 0,
        '5-15 min': 0,
        '15-30 min': 0,
        '30-60 min': 0,
        '> 60 min': 0
      };

      conversationLengths.forEach(length => {
        if (length < 1) buckets['< 1 min']++;
        else if (length < 5) buckets['1-5 min']++;
        else if (length < 15) buckets['5-15 min']++;
        else if (length < 30) buckets['15-30 min']++;
        else if (length < 60) buckets['30-60 min']++;
        else buckets['> 60 min']++;
      });

      // Convert to arrays for charting
      const labels = Object.keys(buckets);
      const data = Object.values(buckets);

      return {
        type: 'bar',
        labels,
        datasets: [
          {
            label: 'Conversation Length',
            data
          }
        ]
      };
    } catch (error) {
      logger.error('Error generating conversation length chart:', error.message);
      return {
        type: 'bar',
        labels: [],
        datasets: []
      };
    }
  }

  /**
   * Export dashboard data to CSV
   * @param {Object} dashboardData - Dashboard data
   * @returns {string} - CSV data
   */
  exportToCsv(dashboardData) {
    try {
      let csv = 'Category,Metric,Value\n';
      
      // Add overview metrics
      Object.entries(dashboardData.overview).forEach(([metric, value]) => {
        csv += `Overview,${metric},${value}\n`;
      });
      
      // Add chart data
      Object.entries(dashboardData.charts).forEach(([chartName, chartData]) => {
        if (chartData.labels && chartData.datasets && chartData.datasets.length > 0) {
          chartData.labels.forEach((label, index) => {
            chartData.datasets.forEach(dataset => {
              csv += `${chartName},${dataset.label || label},${dataset.data[index]}\n`;
            });
          });
        }
      });
      
      return csv;
    } catch (error) {
      logger.error('Error exporting dashboard to CSV:', error.message);
      return '';
    }
  }

  /**
   * Get external analytics URL
   * @param {Object} options - Options
   * @returns {string} - External analytics URL
   */
  getExternalAnalyticsUrl(options = {}) {
    if (!this.options.useExternalAnalytics) {
      return null;
    }

    try {
      const provider = this.options.externalAnalyticsProvider.toLowerCase();
      
      if (provider === 'matomo') {
        const baseUrl = process.env.MATOMO_URL || 'http://localhost/matomo/';
        const siteId = options.botId || process.env.MATOMO_SITE_ID || '1';
        
        return `${baseUrl}index.php?module=CoreHome&action=index&idSite=${siteId}&period=day&date=yesterday`;
      } else if (provider === 'plausible') {
        const baseUrl = process.env.PLAUSIBLE_URL || 'https://plausible.io/';
        const site = options.botId || process.env.PLAUSIBLE_SITE || 'example.com';
        
        return `${baseUrl}${site}`;
      }
      
      return null;
    } catch (error) {
      logger.error('Error generating external analytics URL:', error.message);
      return null;
    }
  }
}

// Create and export service instance
const conversationDashboardService = new ConversationDashboardService();

module.exports = {
  ConversationDashboardService,
  conversationDashboardService
};
