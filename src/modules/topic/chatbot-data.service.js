/**
 * Chatbot Data Service
 * 
 * Service for managing chatbot data using the repository pattern
 */

require('@src/modules\data');
require('@src/modules\utils');

class ChatbotDataService {
  constructor() {
    this.chatbotRepo = repositories.chatbot;
    this.analyticsRepo = repositories.analytics;
    this.conversationRepo = repositories.conversation;
  }

  /**
   * Get chatbots by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Chatbots owned by the user
   */
  async getChatbotsByUser(userId) {
    try {
      await databaseService.connect();
      logger.debug(`Getting chatbots for user: ${userId}`);
      
      const chatbots = await this.chatbotRepo.findByUser(userId);
      logger.info(`Found ${chatbots.length} chatbots for user: ${userId}`);
      
      return chatbots;
    } catch (error) {
      logger.error('Error getting chatbots by user', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get public chatbots
   * @returns {Promise<Array>} - Public chatbots
   */
  async getPublicChatbots() {
    try {
      await databaseService.connect();
      logger.debug('Getting public chatbots');
      
      const chatbots = await this.chatbotRepo.findPublic();
      logger.info(`Found ${chatbots.length} public chatbots`);
      
      return chatbots;
    } catch (error) {
      logger.error('Error getting public chatbots', { error: error.message });
      throw error;
    }
  }

  /**
   * Get chatbots by type
   * @param {string} type - Chatbot type
   * @returns {Promise<Array>} - Chatbots of the specified type
   */
  async getChatbotsByType(type) {
    try {
      await databaseService.connect();
      logger.debug(`Getting chatbots of type: ${type}`);
      
      const chatbots = await this.chatbotRepo.findByType(type);
      logger.info(`Found ${chatbots.length} chatbots of type: ${type}`);
      
      return chatbots;
    } catch (error) {
      logger.error('Error getting chatbots by type', { type, error: error.message });
      throw error;
    }
  }

  /**
   * Get chatbot by ID
   * @param {string} id - Chatbot ID
   * @returns {Promise<Object>} - Chatbot data
   */
  async getChatbotById(id) {
    try {
      await databaseService.connect();
      logger.debug(`Getting chatbot by ID: ${id}`);
      
      const chatbot = await this.chatbotRepo.findById(id);
      
      if (!chatbot) {
        logger.warn(`Chatbot not found: ${id}`);
        return null;
      }
      
      logger.info(`Found chatbot: ${chatbot.name} (${id})`);
      return chatbot;
    } catch (error) {
      logger.error('Error getting chatbot by ID', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Search chatbots
   * @param {string} query - Search query
   * @returns {Promise<Array>} - Matching chatbots
   */
  async searchChatbots(query) {
    try {
      await databaseService.connect();
      logger.debug(`Searching chatbots with query: ${query}`);
      
      const chatbots = await this.chatbotRepo.search(query);
      logger.info(`Found ${chatbots.length} chatbots matching query: ${query}`);
      
      return chatbots;
    } catch (error) {
      logger.error('Error searching chatbots', { query, error: error.message });
      throw error;
    }
  }

  /**
   * Create a new chatbot
   * @param {Object} chatbotData - Chatbot data
   * @returns {Promise<Object>} - Created chatbot
   */
  async createChatbot(chatbotData) {
    try {
      await databaseService.connect();
      logger.info(`Creating new chatbot: ${chatbotData.name}`);
      
      const chatbot = await this.chatbotRepo.create(chatbotData);
      logger.info(`Chatbot created: ${chatbot.name} (${chatbot._id})`);
      
      return chatbot;
    } catch (error) {
      logger.error('Error creating chatbot', { error: error.message });
      throw error;
    }
  }

  /**
   * Create a chatbot with initial analytics record
   * @param {Object} chatbotData - Chatbot data
   * @returns {Promise<Object>} - Created chatbot and analytics
   */
  async createChatbotWithAnalytics(chatbotData) {
    try {
      await databaseService.connect();
      logger.info(`Creating chatbot with analytics: ${chatbotData.name}`);
      
      // Start transaction
      const session = await this.chatbotRepo.startTransaction();
      
      try {
        // Create chatbot with session
        const chatbot = await this.chatbotRepo.model.create([chatbotData], { session });
        
        // Create analytics record with session
        const analytics = await this.analyticsRepo.model.create([{
          chatbotId: chatbot[0]._id,
          period: 'daily',
          date: new Date(),
          metrics: {
            sessions: { count: 0 },
            messages: { count: 0 },
            users: { unique: 0 }
          }
        }], { session });
        
        // Commit transaction
        await this.chatbotRepo.commitTransaction(session);
        
        logger.info(`Chatbot created with analytics: ${chatbot[0].name} (${chatbot[0]._id})`);
        return { chatbot: chatbot[0], analytics: analytics[0] };
      } catch (error) {
        // Abort transaction on error
        await this.chatbotRepo.abortTransaction(session);
        logger.error('Transaction aborted', { error: error.message });
        throw error;
      }
    } catch (error) {
      logger.error('Error creating chatbot with analytics', { error: error.message });
      throw error;
    }
  }

  /**
   * Update a chatbot
   * @param {string} id - Chatbot ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} - Updated chatbot
   */
  async updateChatbot(id, updateData) {
    try {
      await databaseService.connect();
      logger.info(`Updating chatbot: ${id}`);
      
      const chatbot = await this.chatbotRepo.updateById(id, updateData);
      
      if (!chatbot) {
        logger.warn(`Chatbot not found for update: ${id}`);
        return null;
      }
      
      // Invalidate cache
      this.chatbotRepo.invalidateChatbotCache(id);
      
      logger.info(`Chatbot updated: ${chatbot.name} (${id})`);
      return chatbot;
    } catch (error) {
      logger.error('Error updating chatbot', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Delete a chatbot
   * @param {string} id - Chatbot ID
   * @returns {Promise<boolean>} - True if deletion was successful
   */
  async deleteChatbot(id) {
    try {
      await databaseService.connect();
      logger.info(`Deleting chatbot: ${id}`);
      
      const result = await this.chatbotRepo.deleteById(id);
      
      if (!result) {
        logger.warn(`Chatbot not found for deletion: ${id}`);
        return false;
      }
      
      // Invalidate cache
      this.chatbotRepo.invalidateChatbotCache(id);
      
      logger.info(`Chatbot deleted: ${id}`);
      return true;
    } catch (error) {
      logger.error('Error deleting chatbot', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Check if a user has access to a chatbot
   * @param {string} chatbotId - Chatbot ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - True if user has access
   */
  async hasAccess(chatbotId, userId) {
    try {
      await databaseService.connect();
      logger.debug(`Checking access for user ${userId} to chatbot ${chatbotId}`);
      
      const hasAccess = await this.chatbotRepo.hasAccess(chatbotId, userId);
      
      logger.debug(`Access check result: ${hasAccess}`);
      return hasAccess;
    } catch (error) {
      logger.error('Error checking chatbot access', { chatbotId, userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get chatbot statistics
   * @param {string} chatbotId - Chatbot ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} - Chatbot statistics
   */
  async getChatbotStatistics(chatbotId, startDate, endDate) {
    try {
      await databaseService.connect();
      logger.debug(`Getting statistics for chatbot: ${chatbotId}`);
      
      // Get analytics data
      const analytics = await this.analyticsRepo.getByPeriod(
        chatbotId,
        'daily',
        startDate,
        endDate
      );
      
      // Get conversation statistics
      const conversations = await this.conversationRepo.getStatistics(
        chatbotId,
        startDate,
        endDate
      );
      
      // Combine data
      const statistics = {
        analytics: {
          totalSessions: analytics.reduce((sum, record) => sum + record.metrics.sessions.count, 0),
          totalMessages: analytics.reduce((sum, record) => sum + record.metrics.messages.count, 0),
          uniqueUsers: analytics.reduce((sum, record) => sum + record.metrics.users.unique, 0),
          dailyData: analytics.map(record => ({
            date: record.date,
            sessions: record.metrics.sessions.count,
            messages: record.metrics.messages.count,
            users: record.metrics.users.unique
          }))
        },
        conversations: conversations
      };
      
      logger.info(`Retrieved statistics for chatbot: ${chatbotId}`);
      return statistics;
    } catch (error) {
      logger.error('Error getting chatbot statistics', { chatbotId, error: error.message });
      throw error;
    }
  }
}

// Create singleton instance
const chatbotDataService = new ChatbotDataService();

module.exports = chatbotDataService;
