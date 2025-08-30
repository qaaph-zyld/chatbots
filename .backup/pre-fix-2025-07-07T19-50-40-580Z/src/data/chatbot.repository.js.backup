/**
 * Chatbot Repository
 * 
 * Repository for Chatbot model with optimized queries and caching
 */

require('@src/data\base.repository');
require('@src/models\chatbot.model');
require('@src/utils');

class ChatbotRepository extends BaseRepository {
  constructor() {
    super(Chatbot);
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes in milliseconds
  }

  /**
   * Find chatbots by user ID with caching
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} User's chatbots
   */
  async findByUser(userId, options = {}) {
    try {
      // Generate cache key
      const cacheKey = `chatbot:user:${userId}`;
      
      // Check cache
      const cachedResult = this.getFromCache(cacheKey);
      if (cachedResult) {
        logger.debug('User chatbots retrieved from cache', { userId });
        return cachedResult;
      }
      
      // Use the static method from the model with optimized query
      const chatbots = await this.model.findByUser(userId);
      
      // Cache result
      this.setInCache(cacheKey, chatbots);
      
      return chatbots;
    } catch (error) {
      logger.error('Error finding chatbots by user', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Find public chatbots with caching
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Public chatbots
   */
  async findPublic(options = {}) {
    try {
      // Generate cache key
      const cacheKey = 'chatbot:public';
      
      // Check cache
      const cachedResult = this.getFromCache(cacheKey);
      if (cachedResult) {
        logger.debug('Public chatbots retrieved from cache');
        return cachedResult;
      }
      
      // Use the static method from the model with optimized query
      const chatbots = await this.model.findPublic();
      
      // Cache result
      this.setInCache(cacheKey, chatbots);
      
      return chatbots;
    } catch (error) {
      logger.error('Error finding public chatbots', { error: error.message });
      throw error;
    }
  }

  /**
   * Check if user has access to chatbot
   * @param {string} chatbotId - Chatbot ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Whether user has access
   */
  async hasAccess(chatbotId, userId) {
    try {
      const chatbot = await this.findById(chatbotId);
      
      if (!chatbot) {
        return false;
      }
      
      return chatbot.hasAccess(userId);
    } catch (error) {
      logger.error('Error checking chatbot access', { chatbotId, userId, error: error.message });
      return false;
    }
  }

  /**
   * Find chatbots by type with optimized query
   * @param {string} type - Chatbot type
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Chatbots of specified type
   */
  async findByType(type, options = {}) {
    try {
      // Generate cache key
      const cacheKey = `chatbot:type:${type}`;
      
      // Check cache
      const cachedResult = this.getFromCache(cacheKey);
      if (cachedResult) {
        logger.debug('Chatbots by type retrieved from cache', { type });
        return cachedResult;
      }
      
      const filter = { type };
      
      const queryOptions = {
        sort: { createdAt: -1 },
        lean: true,
        ...options
      };
      
      const chatbots = await this.find(filter, queryOptions);
      
      // Cache result
      this.setInCache(cacheKey, chatbots);
      
      return chatbots;
    } catch (error) {
      logger.error('Error finding chatbots by type', { type, error: error.message });
      throw error;
    }
  }

  /**
   * Find chatbots by engine with optimized query
   * @param {string} engine - Chatbot engine
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Chatbots using specified engine
   */
  async findByEngine(engine, options = {}) {
    try {
      // Generate cache key
      const cacheKey = `chatbot:engine:${engine}`;
      
      // Check cache
      const cachedResult = this.getFromCache(cacheKey);
      if (cachedResult) {
        logger.debug('Chatbots by engine retrieved from cache', { engine });
        return cachedResult;
      }
      
      const filter = { engine };
      
      const queryOptions = {
        sort: { createdAt: -1 },
        lean: true,
        ...options
      };
      
      const chatbots = await this.find(filter, queryOptions);
      
      // Cache result
      this.setInCache(cacheKey, chatbots);
      
      return chatbots;
    } catch (error) {
      logger.error('Error finding chatbots by engine', { engine, error: error.message });
      throw error;
    }
  }

  /**
   * Search chatbots by name or description with text index
   * @param {string} query - Search query
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Matching chatbots
   */
  async search(query, options = {}) {
    try {
      // Ensure text index exists
      await this.ensureTextIndex();
      
      const filter = {
        $text: { $search: query }
      };
      
      const queryOptions = {
        sort: { score: { $meta: 'textScore' } },
        lean: true,
        ...options
      };
      
      if (!queryOptions.select) {
        queryOptions.select = [];
      }
      
      queryOptions.select.push('score');
      
      const chatbots = await this.find(filter, queryOptions);
      
      return chatbots;
    } catch (error) {
      logger.error('Error searching chatbots', { query, error: error.message });
      throw error;
    }
  }

  /**
   * Ensure text index exists for search
   * @returns {Promise<void>}
   */
  async ensureTextIndex() {
    try {
      const indexes = await this.model.collection.getIndexes();
      
      // Check if text index already exists
      const hasTextIndex = Object.values(indexes).some(index => 
        index.key && Object.keys(index.key).some(key => index.key[key] === 'text')
      );
      
      if (!hasTextIndex) {
        logger.debug('Creating text index for chatbot search');
        await this.model.collection.createIndex(
          { name: 'text', description: 'text' },
          { background: true, weights: { name: 10, description: 5 } }
        );
      }
    } catch (error) {
      logger.error('Error ensuring text index', { error: error.message });
      // Don't throw error, just log it
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
   * Invalidate cache for a specific chatbot
   * @param {string} chatbotId - Chatbot ID
   */
  invalidateChatbotCache(chatbotId) {
    // Invalidate specific chatbot cache
    this.cache.delete(`chatbot:${chatbotId}`);
    
    // Invalidate all list caches since they might contain this chatbot
    for (const [key] of this.cache) {
      if (key.startsWith('chatbot:user:') || 
          key.startsWith('chatbot:type:') || 
          key.startsWith('chatbot:engine:') || 
          key === 'chatbot:public') {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Invalidate all user's chatbot caches
   * @param {string} userId - User ID
   */
  invalidateUserCache(userId) {
    this.cache.delete(`chatbot:user:${userId}`);
  }
}

// Create singleton instance
const chatbotRepository = new ChatbotRepository();

module.exports = chatbotRepository;
