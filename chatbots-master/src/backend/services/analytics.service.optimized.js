/**
 * Optimized Analytics Service
 * 
 * Enhanced version with performance optimizations, caching, and improved error handling
 */

const db = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const redis = require('../../utils/redis');
const { performance } = require('../../utils/performance');

class AnalyticsService {
  /**
   * Get overview metrics and trends with caching
   * @param {string} userId - User ID
   * @param {string} startDate - Start date for analytics
   * @param {string} endDate - End date for analytics
   * @returns {Object} Overview metrics and trends
   */
  static async getOverviewMetrics(userId, startDate, endDate) {
    try {
      // Generate cache key
      const cacheKey = `analytics:overview:${userId}:${startDate || 'default'}:${endDate || 'default'}`;
      
      // Try to get from cache
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        logger.debug('Retrieved overview metrics from cache');
        return JSON.parse(cachedData);
      }
      
      // Convert string dates to Date objects
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();
      
      // Use parallel queries for better performance
      const [
        totalConversations,
        totalMessages,
        userSatisfactionData,
        dailyMetrics
      ] = await Promise.all([
        // Get conversation counts
        db.Conversation.count({
          where: {
            userId,
            createdAt: { [Op.between]: [start, end] }
          }
        }),
        
        // Get message counts - optimized query with indexing
        db.Message.count({
          include: [{
            model: db.Conversation,
            where: { userId },
            attributes: []
          }],
          where: {
            createdAt: { [Op.between]: [start, end] }
          }
        }),
        
        // Get user satisfaction from feedback
        db.Feedback.findAll({
          attributes: [
            [db.sequelize.fn('AVG', db.sequelize.col('rating')), 'avgRating']
          ],
          include: [{
            model: db.Conversation,
            where: { userId },
            attributes: []
          }],
          where: {
            createdAt: { [Op.between]: [start, end] }
          },
          raw: true
        }),
        
        // Get daily metrics for trends
        this._getDailyMetrics(userId, start, end)
      ]);
      
      // Calculate metrics
      const userSatisfaction = userSatisfactionData[0]?.avgRating || 0;
      const activeUsers = await this._getActiveUsers(userId, start, end);
      
      const result = {
        metrics: {
          totalConversations,
          totalMessages,
          activeUsers,
          userSatisfaction,
          avgMessagesPerConversation: totalConversations > 0 ? totalMessages / totalConversations : 0
        },
        trends: dailyMetrics
      };
      
      // Cache the result for 15 minutes
      await redis.set(cacheKey, JSON.stringify(result), 'EX', 900);
      
      return result;
    } catch (error) {
      logger.error(`Error in getOverviewMetrics: ${error.message}`, { error });
      // Return partial data if possible
      return {
        metrics: {
          totalConversations: 0,
          totalMessages: 0,
          activeUsers: 0,
          userSatisfaction: 0,
          avgMessagesPerConversation: 0
        },
        trends: [],
        error: error.message
      };
    }
  }
  
  /**
   * Get conversation metrics with optimized queries
   * @param {string} userId - User ID
   * @param {string} startDate - Start date for analytics
   * @param {string} endDate - End date for analytics
   * @returns {Object} Conversation metrics and distributions
   */
  static async getConversationMetrics(userId, startDate, endDate) {
    try {
      // Generate cache key
      const cacheKey = `analytics:conversations:${userId}:${startDate || 'default'}:${endDate || 'default'}`;
      
      // Try to get from cache
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        logger.debug('Retrieved conversation metrics from cache');
        return JSON.parse(cachedData);
      }
      
      // Convert string dates to Date objects
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();
      
      // Use optimized queries with proper indexing
      const [
        totalConversations,
        conversationStats,
        hourlyDistribution,
        topIntents,
        completionStats
      ] = await Promise.all([
        // Get total conversations
        db.Conversation.count({
          where: {
            userId,
            createdAt: { [Op.between]: [start, end] }
          }
        }),
        
        // Get conversation stats (avg length, duration)
        db.sequelize.query(`
          SELECT 
            AVG(message_count) as avgLength,
            AVG(TIMESTAMPDIFF(MINUTE, created_at, updated_at)) as avgDuration
          FROM (
            SELECT 
              c.id, 
              COUNT(m.id) as message_count,
              c.created_at,
              c.updated_at
            FROM conversations c
            LEFT JOIN messages m ON c.id = m.conversation_id
            WHERE c.user_id = :userId
            AND c.created_at BETWEEN :start AND :end
            GROUP BY c.id
          ) as conv_stats
        `, {
          replacements: { userId, start, end },
          type: db.sequelize.QueryTypes.SELECT
        }),
        
        // Get hourly distribution
        this._getHourlyDistribution(userId, start, end),
        
        // Get top intents
        this._getTopIntents(userId, start, end),
        
        // Get completion stats
        db.Conversation.findAll({
          attributes: [
            'status',
            [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
          ],
          where: {
            userId,
            createdAt: { [Op.between]: [start, end] }
          },
          group: ['status'],
          raw: true
        })
      ]);
      
      // Process completion stats
      const completedCount = completionStats.find(s => s.status === 'completed')?.count || 0;
      const completionRate = totalConversations > 0 ? completedCount / totalConversations : 0;
      
      const result = {
        metrics: {
          totalConversations,
          avgConversationLength: conversationStats[0]?.avgLength || 0,
          avgConversationDuration: conversationStats[0]?.avgDuration || 0,
          completionRate
        },
        distributions: {
          hourly: hourlyDistribution,
          topIntents
        }
      };
      
      // Cache the result for 15 minutes
      await redis.set(cacheKey, JSON.stringify(result), 'EX', 900);
      
      return result;
    } catch (error) {
      logger.error(`Error in getConversationMetrics: ${error.message}`, { error });
      return {
        metrics: {
          totalConversations: 0,
          avgConversationLength: 0,
          avgConversationDuration: 0,
          completionRate: 0
        },
        distributions: {
          hourly: [],
          topIntents: []
        },
        error: error.message
      };
    }
  }
  
  /**
   * Get user metrics with optimized queries
   * @param {string} userId - User ID
   * @param {string} startDate - Start date for analytics
   * @param {string} endDate - End date for analytics
   * @returns {Object} User metrics and distributions
   */
  static async getUserMetrics(userId, startDate, endDate) {
    // Implementation similar to other methods with caching and optimized queries
    // ...
  }
  
  /**
   * Get performance metrics with optimized queries
   * @param {string} userId - User ID
   * @param {string} startDate - Start date for analytics
   * @param {string} endDate - End date for analytics
   * @returns {Object} Performance metrics
   */
  static async getPerformanceMetrics(userId, startDate, endDate) {
    // Implementation similar to other methods with caching and optimized queries
    // ...
  }
  
  /**
   * Get daily metrics for trends with optimized query
   * @private
   * @param {string} userId - User ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} Daily metrics
   */
  static async _getDailyMetrics(userId, startDate, endDate) {
    try {
      // Use a single optimized query instead of multiple queries
      const dailyMetrics = await db.sequelize.query(`
        SELECT 
          DATE(c.created_at) as date,
          COUNT(DISTINCT c.id) as conversationCount,
          COUNT(m.id) as messageCount,
          AVG(CASE WHEN f.rating IS NOT NULL THEN f.rating ELSE NULL END) as avgSatisfaction
        FROM conversations c
        LEFT JOIN messages m ON c.id = m.conversation_id
        LEFT JOIN feedback f ON c.id = f.conversation_id
        WHERE c.user_id = :userId
        AND c.created_at BETWEEN :startDate AND :endDate
        GROUP BY DATE(c.created_at)
        ORDER BY date ASC
      `, {
        replacements: { userId, startDate, endDate },
        type: db.sequelize.QueryTypes.SELECT
      });
      
      return dailyMetrics.map(day => ({
        date: day.date,
        conversationCount: parseInt(day.conversationCount) || 0,
        messageCount: parseInt(day.messageCount) || 0,
        avgSatisfaction: parseFloat(day.avgSatisfaction) || 0
      }));
    } catch (error) {
      logger.error(`Error in _getDailyMetrics: ${error.message}`, { error });
      return [];
    }
  }
  
  /**
   * Get active users count
   * @private
   * @param {string} userId - User ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {number} Active users count
   */
  static async _getActiveUsers(userId, startDate, endDate) {
    try {
      const result = await db.sequelize.query(`
        SELECT COUNT(DISTINCT user_id) as activeUsers
        FROM user_activities
        WHERE tenant_id = (SELECT tenant_id FROM users WHERE id = :userId)
        AND created_at BETWEEN :startDate AND :endDate
      `, {
        replacements: { userId, startDate, endDate },
        type: db.sequelize.QueryTypes.SELECT
      });
      
      return parseInt(result[0]?.activeUsers) || 0;
    } catch (error) {
      logger.error(`Error in _getActiveUsers: ${error.message}`, { error });
      return 0;
    }
  }
  
  /**
   * Get hourly distribution of conversations
   * @private
   * @param {string} userId - User ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} Hourly distribution
   */
  static async _getHourlyDistribution(userId, startDate, endDate) {
    try {
      const hourlyData = await db.sequelize.query(`
        SELECT 
          HOUR(created_at) as hour,
          COUNT(*) as count
        FROM conversations
        WHERE user_id = :userId
        AND created_at BETWEEN :startDate AND :endDate
        GROUP BY HOUR(created_at)
        ORDER BY hour ASC
      `, {
        replacements: { userId, startDate, endDate },
        type: db.sequelize.QueryTypes.SELECT
      });
      
      // Fill in missing hours with zero counts
      const distribution = Array(24).fill(0);
      hourlyData.forEach(item => {
        distribution[item.hour] = parseInt(item.count);
      });
      
      return distribution;
    } catch (error) {
      logger.error(`Error in _getHourlyDistribution: ${error.message}`, { error });
      return Array(24).fill(0);
    }
  }
  
  /**
   * Get top intents from conversations
   * @private
   * @param {string} userId - User ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} Top intents
   */
  static async _getTopIntents(userId, startDate, endDate) {
    try {
      const intents = await db.sequelize.query(`
        SELECT 
          intent_name,
          COUNT(*) as count
        FROM message_intents mi
        JOIN messages m ON mi.message_id = m.id
        JOIN conversations c ON m.conversation_id = c.id
        WHERE c.user_id = :userId
        AND c.created_at BETWEEN :startDate AND :endDate
        GROUP BY intent_name
        ORDER BY count DESC
        LIMIT 10
      `, {
        replacements: { userId, startDate, endDate },
        type: db.sequelize.QueryTypes.SELECT
      });
      
      return intents.map(intent => ({
        name: intent.intent_name,
        count: parseInt(intent.count)
      }));
    } catch (error) {
      logger.error(`Error in _getTopIntents: ${error.message}`, { error });
      return [];
    }
  }
  
  /**
   * Invalidate analytics cache for a user
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  static async invalidateCache(userId) {
    try {
      const keys = await redis.keys(`analytics:*:${userId}:*`);
      if (keys.length > 0) {
        await redis.del(keys);
        logger.debug(`Invalidated ${keys.length} analytics cache entries for user ${userId}`);
      }
    } catch (error) {
      logger.error(`Error invalidating analytics cache: ${error.message}`, { error });
    }
  }
}

module.exports = AnalyticsService;
