/**
 * Analytics Repository
 * 
 * Repository for Analytics model with optimized queries and caching
 */

require('@src/data\base.repository');
require('@src/models\analytics.model');
require('@src/utils');

class AnalyticsRepository extends BaseRepository {
  constructor() {
    super(Analytics);
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes in milliseconds
  }

  /**
   * Find or create analytics record
   * @param {string} chatbotId - Chatbot ID
   * @param {string} period - Period type (daily, weekly, monthly, yearly)
   * @param {Date} date - Date for the analytics record
   * @returns {Promise<Object>} Found or created analytics record
   */
  async findOrCreate(chatbotId, period, date) {
    try {
      const filter = { chatbotId, period, date };
      let analytics = await this.findOne(filter);
      
      if (!analytics) {
        analytics = await this.create({
          chatbotId,
          period,
          date,
          metrics: {}
        });
      }
      
      return analytics;
    } catch (error) {
      logger.error('Error finding or creating analytics record', { chatbotId, period, date, error: error.message });
      throw error;
    }
  }

  /**
   * Get analytics by period with caching
   * @param {string} chatbotId - Chatbot ID
   * @param {string} period - Period type (daily, weekly, monthly, yearly)
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Analytics records
   */
  async getByPeriod(chatbotId, period, startDate, endDate) {
    try {
      // Generate cache key
      const cacheKey = `analytics:${chatbotId}:${period}:${startDate.toISOString()}:${endDate.toISOString()}`;
      
      // Check cache
      const cachedResult = this.getFromCache(cacheKey);
      if (cachedResult) {
        logger.debug('Analytics retrieved from cache', { chatbotId, period });
        return cachedResult;
      }
      
      // Query database with optimized filter
      const filter = {
        chatbotId,
        period,
        date: { $gte: startDate, $lte: endDate }
      };
      
      const options = {
        sort: { date: 1 },
        lean: true
      };
      
      const analytics = await this.find(filter, options);
      
      // Cache result
      this.setInCache(cacheKey, analytics);
      
      return analytics;
    } catch (error) {
      logger.error('Error getting analytics by period', { chatbotId, period, error: error.message });
      throw error;
    }
  }

  /**
   * Get latest analytics with optimized query
   * @param {string} chatbotId - Chatbot ID
   * @param {string} period - Period type (daily, weekly, monthly, yearly)
   * @param {number} limit - Maximum number of records to return
   * @returns {Promise<Array>} Latest analytics records
   */
  async getLatest(chatbotId, period = 'daily', limit = 30) {
    try {
      // Generate cache key
      const cacheKey = `analytics:latest:${chatbotId}:${period}:${limit}`;
      
      // Check cache
      const cachedResult = this.getFromCache(cacheKey);
      if (cachedResult) {
        logger.debug('Latest analytics retrieved from cache', { chatbotId, period });
        return cachedResult;
      }
      
      // Query database with optimized filter and sort
      const filter = { chatbotId, period };
      
      const options = {
        sort: { date: -1 },
        limit,
        lean: true
      };
      
      const analytics = await this.find(filter, options);
      
      // Cache result
      this.setInCache(cacheKey, analytics);
      
      return analytics;
    } catch (error) {
      logger.error('Error getting latest analytics', { chatbotId, period, error: error.message });
      throw error;
    }
  }

  /**
   * Generate analytics summary with aggregation pipeline
   * @param {string} chatbotId - Chatbot ID
   * @returns {Promise<Object>} Analytics summary
   */
  async generateSummary(chatbotId) {
    try {
      // Generate cache key
      const cacheKey = `analytics:summary:${chatbotId}`;
      
      // Check cache
      const cachedResult = this.getFromCache(cacheKey);
      if (cachedResult) {
        logger.debug('Analytics summary retrieved from cache', { chatbotId });
        return cachedResult;
      }
      
      // Use aggregation pipeline for efficient summary generation
      const pipeline = [
        { $match: { chatbotId } },
        { $sort: { date: -1 } },
        { $group: {
            _id: "$period",
            totalSessions: { $sum: { $ifNull: ["$metrics.sessions.count", 0] } },
            totalMessages: { $sum: { $ifNull: ["$metrics.messages.count", 0] } },
            totalUsers: { $sum: { $ifNull: ["$metrics.users.unique", 0] } },
            averageSessionDuration: { $avg: { $ifNull: ["$metrics.sessions.averageDuration", 0] } },
            latestDate: { $max: "$date" }
          }
        },
        { $project: {
            _id: 0,
            period: "$_id",
            totalSessions: 1,
            totalMessages: 1,
            totalUsers: 1,
            averageSessionDuration: 1,
            latestDate: 1
          }
        }
      ];
      
      const summaries = await this.aggregate(pipeline);
      
      // Transform results into a more usable format
      const result = summaries.reduce((acc, summary) => {
        acc[summary.period] = summary;
        delete summary.period;
        return acc;
      }, {});
      
      // Cache result
      this.setInCache(cacheKey, result);
      
      return result;
    } catch (error) {
      logger.error('Error generating analytics summary', { chatbotId, error: error.message });
      throw error;
    }
  }

  /**
   * Update metrics for an analytics record
   * @param {string} id - Analytics record ID
   * @param {Object} metrics - Metrics to update
   * @returns {Promise<Object>} Updated analytics record
   */
  async updateMetrics(id, metrics) {
    try {
      const analytics = await this.findById(id);
      
      if (!analytics) {
        throw new Error(`Analytics record not found: ${id}`);
      }
      
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
      
      // Save and invalidate cache
      await analytics.save();
      this.invalidateCache(analytics.chatbotId);
      
      return analytics;
    } catch (error) {
      logger.error('Error updating analytics metrics', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Get from cache
   * @param {string} key - Cache key
   * @returns {any} Cached value or undefined
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() < cached.expiry) {
      return cached.value;
    }
    
    if (cached) {
      this.cache.delete(key);
    }
    
    return undefined;
  }

  /**
   * Set in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   */
  setInCache(key, value) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.cacheTTL
    });
  }

  /**
   * Invalidate cache for a chatbot
   * @param {string} chatbotId - Chatbot ID
   */
  invalidateCache(chatbotId) {
    for (const [key] of this.cache) {
      if (key.includes(`analytics:${chatbotId}`)) {
        this.cache.delete(key);
      }
    }
  }
}

// Create singleton instance
const analyticsRepository = new AnalyticsRepository();

module.exports = analyticsRepository;
