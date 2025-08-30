/**
 * Conversation Repository
 * 
 * Repository for Conversation model with optimized queries and caching
 */

require('@src/data\base.repository');
require('@src/models\conversation.model');
require('@src/utils');

class ConversationRepository extends BaseRepository {
  constructor() {
    super(Conversation);
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes in milliseconds
  }

  /**
   * Find active conversations for a chatbot
   * @param {string} chatbotId - Chatbot ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Active conversations
   */
  async findActive(chatbotId, options = {}) {
    try {
      const filter = { 
        chatbotId, 
        status: 'active',
        lastActivity: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      };
      
      const queryOptions = {
        sort: { lastActivity: -1 },
        lean: true,
        ...options
      };
      
      return await this.find(filter, queryOptions);
    } catch (error) {
      logger.error('Error finding active conversations', { chatbotId, error: error.message });
      throw error;
    }
  }

  /**
   * Find conversation by user ID with optimized query
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} User conversations
   */
  async findByUser(userId, options = {}) {
    try {
      // Generate cache key
      const cacheKey = `conversation:user:${userId}`;
      
      // Check cache
      const cachedResult = this.getFromCache(cacheKey);
      if (cachedResult) {
        logger.debug('User conversations retrieved from cache', { userId });
        return cachedResult;
      }
      
      const filter = { userId };
      
      const queryOptions = {
        sort: { lastActivity: -1 },
        lean: true,
        ...options
      };
      
      const conversations = await this.find(filter, queryOptions);
      
      // Cache result
      this.setInCache(cacheKey, conversations);
      
      return conversations;
    } catch (error) {
      logger.error('Error finding conversations by user', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Add message to conversation with transaction
   * @param {string} conversationId - Conversation ID
   * @param {Object} message - Message to add
   * @returns {Promise<Object>} Updated conversation
   */
  async addMessage(conversationId, message) {
    const session = await this.startTransaction();
    
    try {
      const conversation = await this.model.findById(conversationId).session(session);
      
      if (!conversation) {
        await this.abortTransaction(session);
        throw new Error(`Conversation not found: ${conversationId}`);
      }
      
      // Add message
      conversation.messages.push(message);
      
      // Update conversation metadata
      conversation.messageCount = conversation.messages.length;
      conversation.lastActivity = new Date();
      conversation.lastMessage = message;
      
      // Save conversation
      await conversation.save({ session });
      
      // Commit transaction
      await this.commitTransaction(session);
      
      // Invalidate cache
      this.invalidateCache(conversation.userId);
      this.invalidateCache(conversation.chatbotId);
      
      return conversation;
    } catch (error) {
      await this.abortTransaction(session);
      logger.error('Error adding message to conversation', { conversationId, error: error.message });
      throw error;
    }
  }

  /**
   * Get conversation statistics with aggregation pipeline
   * @param {string} chatbotId - Chatbot ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Conversation statistics
   */
  async getStatistics(chatbotId, startDate, endDate) {
    try {
      // Generate cache key
      const cacheKey = `conversation:stats:${chatbotId}:${startDate.toISOString()}:${endDate.toISOString()}`;
      
      // Check cache
      const cachedResult = this.getFromCache(cacheKey);
      if (cachedResult) {
        logger.debug('Conversation statistics retrieved from cache', { chatbotId });
        return cachedResult;
      }
      
      // Use aggregation pipeline for efficient statistics calculation
      const pipeline = [
        { 
          $match: { 
            chatbotId,
            createdAt: { $gte: startDate, $lte: endDate }
          } 
        },
        { 
          $group: {
            _id: null,
            totalConversations: { $sum: 1 },
            totalMessages: { $sum: '$messageCount' },
            averageMessages: { $avg: '$messageCount' },
            uniqueUsers: { $addToSet: '$userId' },
            averageDuration: { 
              $avg: { 
                $divide: [
                  { $subtract: ['$lastActivity', '$createdAt'] }, 
                  1000 // Convert to seconds
                ] 
              } 
            }
          } 
        },
        { 
          $project: {
            _id: 0,
            totalConversations: 1,
            totalMessages: 1,
            averageMessages: 1,
            uniqueUsers: { $size: '$uniqueUsers' },
            averageDuration: 1
          } 
        }
      ];
      
      const results = await this.aggregate(pipeline);
      const statistics = results.length > 0 ? results[0] : {
        totalConversations: 0,
        totalMessages: 0,
        averageMessages: 0,
        uniqueUsers: 0,
        averageDuration: 0
      };
      
      // Cache result
      this.setInCache(cacheKey, statistics);
      
      return statistics;
    } catch (error) {
      logger.error('Error getting conversation statistics', { chatbotId, error: error.message });
      throw error;
    }
  }

  /**
   * Get conversation insights with advanced aggregation
   * @param {string} chatbotId - Chatbot ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Conversation insights
   */
  async getInsights(chatbotId, startDate, endDate) {
    try {
      // Generate cache key
      const cacheKey = `conversation:insights:${chatbotId}:${startDate.toISOString()}:${endDate.toISOString()}`;
      
      // Check cache
      const cachedResult = this.getFromCache(cacheKey);
      if (cachedResult) {
        logger.debug('Conversation insights retrieved from cache', { chatbotId });
        return cachedResult;
      }
      
      // Use aggregation pipeline for efficient insights calculation
      const pipeline = [
        { 
          $match: { 
            chatbotId,
            createdAt: { $gte: startDate, $lte: endDate }
          } 
        },
        { 
          $facet: {
            // Daily conversation counts
            dailyCounts: [
              {
                $group: {
                  _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                  count: { $sum: 1 }
                }
              },
              { $sort: { _id: 1 } }
            ],
            // User retention
            userRetention: [
              {
                $group: {
                  _id: '$userId',
                  firstConversation: { $min: '$createdAt' },
                  lastConversation: { $max: '$createdAt' },
                  conversationCount: { $sum: 1 }
                }
              },
              {
                $project: {
                  _id: 0,
                  userId: '$_id',
                  firstConversation: 1,
                  lastConversation: 1,
                  conversationCount: 1,
                  daysBetween: {
                    $divide: [
                      { $subtract: ['$lastConversation', '$firstConversation'] },
                      1000 * 60 * 60 * 24 // Convert to days
                    ]
                  }
                }
              }
            ],
            // Message distribution
            messageDistribution: [
              {
                $group: {
                  _id: '$messageCount',
                  count: { $sum: 1 }
                }
              },
              { $sort: { _id: 1 } }
            ],
            // Completion rates
            completionRates: [
              {
                $group: {
                  _id: '$status',
                  count: { $sum: 1 }
                }
              }
            ]
          }
        }
      ];
      
      const [results] = await this.aggregate(pipeline);
      
      // Process results
      const insights = {
        dailyConversations: results.dailyCounts.map(item => ({
          date: item._id,
          count: item.count
        })),
        userRetention: {
          totalUsers: results.userRetention.length,
          returningUsers: results.userRetention.filter(u => u.conversationCount > 1).length,
          averageConversationsPerUser: results.userRetention.reduce((sum, u) => sum + u.conversationCount, 0) / 
            (results.userRetention.length || 1),
          averageDaysBetweenConversations: results.userRetention.reduce((sum, u) => sum + (u.daysBetween || 0), 0) / 
            (results.userRetention.length || 1)
        },
        messageDistribution: results.messageDistribution.map(item => ({
          messageCount: item._id,
          conversationCount: item.count
        })),
        completionRates: results.completionRates.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      };
      
      // Cache result
      this.setInCache(cacheKey, insights);
      
      return insights;
    } catch (error) {
      logger.error('Error getting conversation insights', { chatbotId, error: error.message });
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
   * Invalidate cache for a specific ID
   * @param {string} id - ID to invalidate (userId or chatbotId)
   */
  invalidateCache(id) {
    for (const [key] of this.cache) {
      if (key.includes(id)) {
        this.cache.delete(key);
      }
    }
  }
}

// Create singleton instance
const conversationRepository = new ConversationRepository();

module.exports = conversationRepository;
