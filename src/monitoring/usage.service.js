/**
 * Usage Monitoring Service
 * 
 * Tracks and analyzes chatbot usage across different platforms
 */

const mongoose = require('mongoose');
require('@src/utils');
const config = require('../../config');

// Will be implemented once we have the usage model
let Usage;
let UsageMetric;

class UsageMonitoringService {
  constructor() {
    this.isInitialized = false;
    this.metricsBuffer = [];
    this.flushInterval = null;
    this.bufferSize = 100;
    this.flushIntervalMs = 60000; // 1 minute
  }

  /**
   * Initialize the usage monitoring service
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      logger.info('Initializing usage monitoring service');
      
      // Import models
      try {
        Usage = require('../models/usage.model');
        UsageMetric = require('../models/usageMetric.model');
      } catch (error) {
        logger.error('Error importing usage models:', error.message);
        throw error;
      }
      
      // Set up flush interval
      this.flushInterval = setInterval(() => {
        this.flushMetricsBuffer().catch(err => {
          logger.error('Error flushing metrics buffer:', err.message);
        });
      }, this.flushIntervalMs);
      
      this.isInitialized = true;
      logger.info('Usage monitoring service initialized successfully');
    } catch (error) {
      logger.error('Error initializing usage monitoring service:', error.message);
      throw error;
    }
  }

  /**
   * Track chatbot usage
   * @param {Object} data - Usage data
   * @returns {Promise<void>}
   */
  async trackUsage(data) {
    try {
      if (!this.isInitialized) {
        logger.warn('Usage monitoring service not initialized');
        return;
      }
      
      // Validate data
      this._validateUsageData(data);
      
      // Add timestamp if not provided
      if (!data.timestamp) {
        data.timestamp = new Date();
      }
      
      // Add to metrics buffer
      this.metricsBuffer.push(data);
      
      // Flush buffer if it reaches the threshold
      if (this.metricsBuffer.length >= this.bufferSize) {
        await this.flushMetricsBuffer();
      }
    } catch (error) {
      logger.error('Error tracking usage:', error.message);
      // Don't throw error to prevent affecting the main application flow
    }
  }

  /**
   * Flush metrics buffer to database
   * @returns {Promise<void>}
   */
  async flushMetricsBuffer() {
    try {
      if (this.metricsBuffer.length === 0) {
        return;
      }
      
      logger.debug(`Flushing ${this.metricsBuffer.length} usage metrics`);
      
      // Group metrics by type
      const metricsByType = this._groupMetricsByType(this.metricsBuffer);
      
      // Save metrics
      const promises = [];
      
      for (const [type, metrics] of Object.entries(metricsByType)) {
        promises.push(this._saveMetrics(type, metrics));
      }
      
      await Promise.all(promises);
      
      // Clear buffer
      this.metricsBuffer = [];
      
      logger.debug('Usage metrics flushed successfully');
    } catch (error) {
      logger.error('Error flushing metrics buffer:', error.message);
      throw error;
    }
  }

  /**
   * Get usage statistics
   * @param {Object} filter - Filter criteria
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Usage statistics
   */
  async getUsageStatistics(filter = {}, options = {}) {
    try {
      if (!this.isInitialized) {
        logger.warn('Usage monitoring service not initialized');
        return {};
      }
      
      // Ensure we have the latest metrics
      await this.flushMetricsBuffer();
      
      // Set default time range if not provided
      if (!filter.startDate && !filter.endDate) {
        // Default to last 30 days
        filter.startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        filter.endDate = new Date();
      } else if (filter.startDate && !filter.endDate) {
        filter.endDate = new Date();
      } else if (!filter.startDate && filter.endDate) {
        filter.startDate = new Date(0);
      }
      
      // Convert dates to Date objects if they are strings
      if (typeof filter.startDate === 'string') {
        filter.startDate = new Date(filter.startDate);
      }
      if (typeof filter.endDate === 'string') {
        filter.endDate = new Date(filter.endDate);
      }
      
      // Build query
      const query = {
        timestamp: {
          $gte: filter.startDate,
          $lte: filter.endDate
        }
      };
      
      // Add chatbot ID if provided
      if (filter.chatbotId) {
        query.chatbotId = filter.chatbotId;
      }
      
      // Add user ID if provided
      if (filter.userId) {
        query.userId = filter.userId;
      }
      
      // Add platform if provided
      if (filter.platform) {
        query.platform = filter.platform;
      }
      
      // Get usage data
      const usageData = await Usage.find(query, null, options);
      
      // Get usage metrics
      const metricQuery = { ...query };
      delete metricQuery.timestamp;
      metricQuery.date = {
        $gte: filter.startDate,
        $lte: filter.endDate
      };
      
      const usageMetrics = await UsageMetric.find(metricQuery);
      
      // Process data
      const statistics = this._processUsageData(usageData, usageMetrics, filter);
      
      return statistics;
    } catch (error) {
      logger.error('Error getting usage statistics:', error.message);
      throw error;
    }
  }

  /**
   * Get active users
   * @param {Object} filter - Filter criteria
   * @returns {Promise<Object>} Active users statistics
   */
  async getActiveUsers(filter = {}) {
    try {
      if (!this.isInitialized) {
        logger.warn('Usage monitoring service not initialized');
        return {};
      }
      
      // Ensure we have the latest metrics
      await this.flushMetricsBuffer();
      
      // Set default time range if not provided
      if (!filter.startDate && !filter.endDate) {
        // Default to last 30 days
        filter.startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        filter.endDate = new Date();
      } else if (filter.startDate && !filter.endDate) {
        filter.endDate = new Date();
      } else if (!filter.startDate && filter.endDate) {
        filter.startDate = new Date(0);
      }
      
      // Convert dates to Date objects if they are strings
      if (typeof filter.startDate === 'string') {
        filter.startDate = new Date(filter.startDate);
      }
      if (typeof filter.endDate === 'string') {
        filter.endDate = new Date(filter.endDate);
      }
      
      // Build query
      const query = {
        timestamp: {
          $gte: filter.startDate,
          $lte: filter.endDate
        },
        type: 'message'
      };
      
      // Add chatbot ID if provided
      if (filter.chatbotId) {
        query.chatbotId = filter.chatbotId;
      }
      
      // Add platform if provided
      if (filter.platform) {
        query.platform = filter.platform;
      }
      
      // Get daily active users
      const dailyActiveUsers = await Usage.aggregate([
        { $match: query },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
              userId: '$userId'
            }
          }
        },
        {
          $group: {
            _id: '$_id.date',
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);
      
      // Get weekly active users
      const weeklyActiveUsers = await Usage.aggregate([
        { $match: query },
        {
          $group: {
            _id: {
              week: { $week: '$timestamp' },
              year: { $year: '$timestamp' },
              userId: '$userId'
            }
          }
        },
        {
          $group: {
            _id: {
              week: '$_id.week',
              year: '$_id.year'
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.week': 1 } }
      ]);
      
      // Get monthly active users
      const monthlyActiveUsers = await Usage.aggregate([
        { $match: query },
        {
          $group: {
            _id: {
              month: { $month: '$timestamp' },
              year: { $year: '$timestamp' },
              userId: '$userId'
            }
          }
        },
        {
          $group: {
            _id: {
              month: '$_id.month',
              year: '$_id.year'
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);
      
      // Get total unique users
      const totalUniqueUsers = await Usage.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$userId'
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 }
          }
        }
      ]);
      
      return {
        daily: dailyActiveUsers.map(item => ({
          date: item._id,
          count: item.count
        })),
        weekly: weeklyActiveUsers.map(item => ({
          year: item._id.year,
          week: item._id.week,
          count: item.count
        })),
        monthly: monthlyActiveUsers.map(item => ({
          year: item._id.year,
          month: item._id.month,
          count: item.count
        })),
        total: totalUniqueUsers.length > 0 ? totalUniqueUsers[0].count : 0
      };
    } catch (error) {
      logger.error('Error getting active users:', error.message);
      throw error;
    }
  }

  /**
   * Get usage by platform
   * @param {Object} filter - Filter criteria
   * @returns {Promise<Object>} Usage by platform statistics
   */
  async getUsageByPlatform(filter = {}) {
    try {
      if (!this.isInitialized) {
        logger.warn('Usage monitoring service not initialized');
        return {};
      }
      
      // Ensure we have the latest metrics
      await this.flushMetricsBuffer();
      
      // Set default time range if not provided
      if (!filter.startDate && !filter.endDate) {
        // Default to last 30 days
        filter.startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        filter.endDate = new Date();
      } else if (filter.startDate && !filter.endDate) {
        filter.endDate = new Date();
      } else if (!filter.startDate && filter.endDate) {
        filter.startDate = new Date(0);
      }
      
      // Convert dates to Date objects if they are strings
      if (typeof filter.startDate === 'string') {
        filter.startDate = new Date(filter.startDate);
      }
      if (typeof filter.endDate === 'string') {
        filter.endDate = new Date(filter.endDate);
      }
      
      // Build query
      const query = {
        timestamp: {
          $gte: filter.startDate,
          $lte: filter.endDate
        }
      };
      
      // Add chatbot ID if provided
      if (filter.chatbotId) {
        query.chatbotId = filter.chatbotId;
      }
      
      // Get usage by platform
      const usageByPlatform = await Usage.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$platform',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);
      
      return usageByPlatform.map(item => ({
        platform: item._id || 'unknown',
        count: item.count
      }));
    } catch (error) {
      logger.error('Error getting usage by platform:', error.message);
      throw error;
    }
  }

  /**
   * Get usage by time of day
   * @param {Object} filter - Filter criteria
   * @returns {Promise<Object>} Usage by time of day statistics
   */
  async getUsageByTimeOfDay(filter = {}) {
    try {
      if (!this.isInitialized) {
        logger.warn('Usage monitoring service not initialized');
        return {};
      }
      
      // Ensure we have the latest metrics
      await this.flushMetricsBuffer();
      
      // Set default time range if not provided
      if (!filter.startDate && !filter.endDate) {
        // Default to last 30 days
        filter.startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        filter.endDate = new Date();
      } else if (filter.startDate && !filter.endDate) {
        filter.endDate = new Date();
      } else if (!filter.startDate && filter.endDate) {
        filter.startDate = new Date(0);
      }
      
      // Convert dates to Date objects if they are strings
      if (typeof filter.startDate === 'string') {
        filter.startDate = new Date(filter.startDate);
      }
      if (typeof filter.endDate === 'string') {
        filter.endDate = new Date(filter.endDate);
      }
      
      // Build query
      const query = {
        timestamp: {
          $gte: filter.startDate,
          $lte: filter.endDate
        }
      };
      
      // Add chatbot ID if provided
      if (filter.chatbotId) {
        query.chatbotId = filter.chatbotId;
      }
      
      // Add platform if provided
      if (filter.platform) {
        query.platform = filter.platform;
      }
      
      // Get usage by hour of day
      const usageByHour = await Usage.aggregate([
        { $match: query },
        {
          $group: {
            _id: { $hour: '$timestamp' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);
      
      // Initialize hours array with zeros
      const hours = Array(24).fill(0);
      
      // Fill in the data
      usageByHour.forEach(item => {
        hours[item._id] = item.count;
      });
      
      return hours.map((count, hour) => ({
        hour,
        count
      }));
    } catch (error) {
      logger.error('Error getting usage by time of day:', error.message);
      throw error;
    }
  }

  /**
   * Validate usage data
   * @param {Object} data - Usage data
   * @throws {Error} If validation fails
   * @private
   */
  _validateUsageData(data) {
    // Required fields
    const requiredFields = ['type', 'chatbotId', 'userId'];
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    // Validate type
    const validTypes = ['message', 'session', 'error', 'feedback', 'integration'];
    if (!validTypes.includes(data.type)) {
      throw new Error(`Invalid type: ${data.type}`);
    }
  }

  /**
   * Group metrics by type
   * @param {Array} metrics - Metrics to group
   * @returns {Object} Grouped metrics
   * @private
   */
  _groupMetricsByType(metrics) {
    const result = {};
    
    for (const metric of metrics) {
      if (!result[metric.type]) {
        result[metric.type] = [];
      }
      
      result[metric.type].push(metric);
    }
    
    return result;
  }

  /**
   * Save metrics to database
   * @param {string} type - Metric type
   * @param {Array} metrics - Metrics to save
   * @returns {Promise<void>}
   * @private
   */
  async _saveMetrics(type, metrics) {
    try {
      // Save individual usage records
      await Usage.insertMany(metrics);
      
      // Update aggregated metrics
      await this._updateAggregatedMetrics(type, metrics);
    } catch (error) {
      logger.error(`Error saving ${type} metrics:`, error.message);
      throw error;
    }
  }

  /**
   * Update aggregated metrics
   * @param {string} type - Metric type
   * @param {Array} metrics - Metrics to aggregate
   * @returns {Promise<void>}
   * @private
   */
  async _updateAggregatedMetrics(type, metrics) {
    try {
      // Group metrics by date, chatbot, and platform
      const groupedMetrics = {};
      
      for (const metric of metrics) {
        const date = new Date(metric.timestamp);
        date.setHours(0, 0, 0, 0);
        
        const key = `${date.toISOString()}_${metric.chatbotId}_${metric.platform || 'unknown'}`;
        
        if (!groupedMetrics[key]) {
          groupedMetrics[key] = {
            date,
            chatbotId: metric.chatbotId,
            platform: metric.platform || 'unknown',
            counts: {
              message: 0,
              session: 0,
              error: 0,
              feedback: 0,
              integration: 0
            },
            uniqueUsers: new Set()
          };
        }
        
        groupedMetrics[key].counts[metric.type]++;
        groupedMetrics[key].uniqueUsers.add(metric.userId);
      }
      
      // Update metrics in database
      for (const key in groupedMetrics) {
        const metric = groupedMetrics[key];
        
        await UsageMetric.updateOne(
          {
            date: metric.date,
            chatbotId: metric.chatbotId,
            platform: metric.platform
          },
          {
            $inc: {
              [`counts.${type}`]: metric.counts[type]
            },
            $set: {
              lastUpdated: new Date()
            }
          },
          { upsert: true }
        );
        
        // Update unique users count
        await UsageMetric.updateOne(
          {
            date: metric.date,
            chatbotId: metric.chatbotId,
            platform: metric.platform
          },
          {
            $addToSet: {
              uniqueUsers: { $each: Array.from(metric.uniqueUsers) }
            }
          }
        );
      }
    } catch (error) {
      logger.error('Error updating aggregated metrics:', error.message);
      throw error;
    }
  }

  /**
   * Process usage data
   * @param {Array} usageData - Usage data
   * @param {Array} usageMetrics - Usage metrics
   * @param {Object} filter - Filter criteria
   * @returns {Object} Processed usage statistics
   * @private
   */
  _processUsageData(usageData, usageMetrics, filter) {
    // Initialize result
    const result = {
      summary: {
        totalMessages: 0,
        totalSessions: 0,
        totalErrors: 0,
        totalFeedback: 0,
        totalIntegrations: 0,
        uniqueUsers: 0
      },
      timeline: {
        messages: [],
        sessions: [],
        errors: [],
        feedback: [],
        integrations: []
      }
    };
    
    // Process metrics
    const uniqueUsers = new Set();
    
    for (const metric of usageMetrics) {
      // Update summary
      result.summary.totalMessages += metric.counts.message || 0;
      result.summary.totalSessions += metric.counts.session || 0;
      result.summary.totalErrors += metric.counts.error || 0;
      result.summary.totalFeedback += metric.counts.feedback || 0;
      result.summary.totalIntegrations += metric.counts.integration || 0;
      
      // Add unique users
      if (metric.uniqueUsers) {
        for (const userId of metric.uniqueUsers) {
          uniqueUsers.add(userId);
        }
      }
      
      // Add to timeline
      const date = metric.date.toISOString().split('T')[0];
      
      // Messages
      if (metric.counts.message) {
        result.timeline.messages.push({
          date,
          count: metric.counts.message,
          platform: metric.platform
        });
      }
      
      // Sessions
      if (metric.counts.session) {
        result.timeline.sessions.push({
          date,
          count: metric.counts.session,
          platform: metric.platform
        });
      }
      
      // Errors
      if (metric.counts.error) {
        result.timeline.errors.push({
          date,
          count: metric.counts.error,
          platform: metric.platform
        });
      }
      
      // Feedback
      if (metric.counts.feedback) {
        result.timeline.feedback.push({
          date,
          count: metric.counts.feedback,
          platform: metric.platform
        });
      }
      
      // Integrations
      if (metric.counts.integration) {
        result.timeline.integrations.push({
          date,
          count: metric.counts.integration,
          platform: metric.platform
        });
      }
    }
    
    // Set unique users count
    result.summary.uniqueUsers = uniqueUsers.size;
    
    // Sort timeline data
    result.timeline.messages.sort((a, b) => a.date.localeCompare(b.date));
    result.timeline.sessions.sort((a, b) => a.date.localeCompare(b.date));
    result.timeline.errors.sort((a, b) => a.date.localeCompare(b.date));
    result.timeline.feedback.sort((a, b) => a.date.localeCompare(b.date));
    result.timeline.integrations.sort((a, b) => a.date.localeCompare(b.date));
    
    return result;
  }
}

module.exports = new UsageMonitoringService();
