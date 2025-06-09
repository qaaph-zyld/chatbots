/**
 * Topic Repository
 * 
 * Repository for managing topic data with caching and transaction support
 */

require('@src/data\base.repository');
require('@src/models\topic.model');
require('@src/utils');

class TopicRepository extends BaseRepository {
  /**
   * Create a new topic repository
   */
  constructor() {
    super(Topic);
    
    // Configure caching
    this.cacheTTL = 3600; // 1 hour cache TTL
    this.cacheEnabled = true;
  }
  
  /**
   * Find a topic by name for a specific chatbot
   * @param {string} name - Topic name
   * @param {string} chatbotId - Chatbot ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Found topic
   */
  async findByName(name, chatbotId, options = {}) {
    try {
      // Generate cache key
      const cacheKey = `topic:name:${name}:chatbot:${chatbotId}`;
      
      // Check cache if enabled
      if (this.cacheEnabled) {
        const cachedTopic = await this.getFromCache(cacheKey);
        if (cachedTopic) {
          logger.debug(`Cache hit for topic by name: ${name}`, { chatbotId });
          return cachedTopic;
        }
      }
      
      // Build query
      let query = this.model.findOne({ name, chatbotId });
      
      // Apply options
      if (options.select) {
        query = query.select(options.select.join(' '));
      }
      
      if (options.populate) {
        query = Array.isArray(options.populate) 
          ? options.populate.reduce((q, p) => q.populate(p), query)
          : query.populate(options.populate);
      }
      
      // Execute query
      const topic = await query.exec();
      
      // Cache result if found
      if (topic && this.cacheEnabled) {
        await this.saveToCache(cacheKey, topic, this.cacheTTL);
      }
      
      return topic;
    } catch (error) {
      logger.error('Error finding topic by name', { error: error.message, name, chatbotId });
      throw error;
    }
  }
  
  /**
   * Find topics for a chatbot with filtering options
   * @param {string} chatbotId - Chatbot ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} List of topics
   */
  async findByChatbot(chatbotId, options = {}) {
    try {
      // Build filter
      const filter = { chatbotId };
      
      // Add category filter if provided
      if (options.category) {
        filter.category = options.category;
      }
      
      // Add priority filter if provided
      if (options.priority) {
        filter.priority = options.priority;
      }
      
      // Add active filter if provided
      if (options.active !== undefined) {
        filter.active = options.active;
      }
      
      // Build query
      let query = this.model.find(filter);
      
      // Apply sorting
      if (options.sort) {
        query = query.sort(options.sort);
      } else {
        // Default sorting by priority (desc) and name (asc)
        query = query.sort({ priority: -1, name: 1 });
      }
      
      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
        
        if (options.skip) {
          query = query.skip(options.skip);
        }
      }
      
      // Apply projection
      if (options.select) {
        query = query.select(options.select.join(' '));
      }
      
      // Apply population
      if (options.populate) {
        query = Array.isArray(options.populate) 
          ? options.populate.reduce((q, p) => q.populate(p), query)
          : query.populate(options.populate);
      }
      
      // Execute query
      const topics = await query.exec();
      
      return topics;
    } catch (error) {
      logger.error('Error finding topics by chatbot', { error: error.message, chatbotId });
      throw error;
    }
  }
  
  /**
   * Add a pattern to a topic with transaction support
   * @param {string} topicId - Topic ID
   * @param {Object} patternData - Pattern data
   * @returns {Promise<Object>} Updated topic
   */
  async addPattern(topicId, patternData) {
    const session = await this.startSession();
    
    try {
      session.startTransaction();
      
      // Find topic by ID
      const topic = await this.model.findById(topicId).session(session);
      
      if (!topic) {
        await session.abortTransaction();
        session.endSession();
        return null;
      }
      
      // Add pattern to topic
      topic.patterns.push(patternData);
      
      // Save topic with transaction
      await topic.save({ session });
      
      // Commit transaction
      await session.commitTransaction();
      session.endSession();
      
      // Invalidate cache
      if (this.cacheEnabled) {
        await this.invalidateCache(`topic:id:${topicId}`);
        await this.invalidateCache(`topic:name:${topic.name}:chatbot:${topic.chatbotId}`);
      }
      
      return topic;
    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();
      session.endSession();
      
      logger.error('Error adding pattern to topic', { error: error.message, topicId });
      throw error;
    }
  }
  
  /**
   * Remove a pattern from a topic with transaction support
   * @param {string} topicId - Topic ID
   * @param {string} patternId - Pattern ID
   * @returns {Promise<Object>} Updated topic
   */
  async removePattern(topicId, patternId) {
    const session = await this.startSession();
    
    try {
      session.startTransaction();
      
      // Find topic by ID
      const topic = await this.model.findById(topicId).session(session);
      
      if (!topic) {
        await session.abortTransaction();
        session.endSession();
        return null;
      }
      
      // Remove pattern from topic
      topic.patterns = topic.patterns.filter(p => p._id.toString() !== patternId);
      
      // Save topic with transaction
      await topic.save({ session });
      
      // Commit transaction
      await session.commitTransaction();
      session.endSession();
      
      // Invalidate cache
      if (this.cacheEnabled) {
        await this.invalidateCache(`topic:id:${topicId}`);
        await this.invalidateCache(`topic:name:${topic.name}:chatbot:${topic.chatbotId}`);
      }
      
      return topic;
    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();
      session.endSession();
      
      logger.error('Error removing pattern from topic', { error: error.message, topicId, patternId });
      throw error;
    }
  }
  
  /**
   * Add a response to a topic with transaction support
   * @param {string} topicId - Topic ID
   * @param {Object} responseData - Response data
   * @returns {Promise<Object>} Updated topic
   */
  async addResponse(topicId, responseData) {
    const session = await this.startSession();
    
    try {
      session.startTransaction();
      
      // Find topic by ID
      const topic = await this.model.findById(topicId).session(session);
      
      if (!topic) {
        await session.abortTransaction();
        session.endSession();
        return null;
      }
      
      // Add response to topic
      topic.responses.push(responseData);
      
      // Save topic with transaction
      await topic.save({ session });
      
      // Commit transaction
      await session.commitTransaction();
      session.endSession();
      
      // Invalidate cache
      if (this.cacheEnabled) {
        await this.invalidateCache(`topic:id:${topicId}`);
        await this.invalidateCache(`topic:name:${topic.name}:chatbot:${topic.chatbotId}`);
      }
      
      return topic;
    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();
      session.endSession();
      
      logger.error('Error adding response to topic', { error: error.message, topicId });
      throw error;
    }
  }
  
  /**
   * Remove a response from a topic with transaction support
   * @param {string} topicId - Topic ID
   * @param {string} responseId - Response ID
   * @returns {Promise<Object>} Updated topic
   */
  async removeResponse(topicId, responseId) {
    const session = await this.startSession();
    
    try {
      session.startTransaction();
      
      // Find topic by ID
      const topic = await this.model.findById(topicId).session(session);
      
      if (!topic) {
        await session.abortTransaction();
        session.endSession();
        return null;
      }
      
      // Remove response from topic
      topic.responses = topic.responses.filter(r => r._id.toString() !== responseId);
      
      // Save topic with transaction
      await topic.save({ session });
      
      // Commit transaction
      await session.commitTransaction();
      session.endSession();
      
      // Invalidate cache
      if (this.cacheEnabled) {
        await this.invalidateCache(`topic:id:${topicId}`);
        await this.invalidateCache(`topic:name:${topic.name}:chatbot:${topic.chatbotId}`);
      }
      
      return topic;
    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();
      session.endSession();
      
      logger.error('Error removing response from topic', { error: error.message, topicId, responseId });
      throw error;
    }
  }
  
  /**
   * Find topics matching text patterns
   * @param {string} text - Text to match against
   * @param {string} chatbotId - Chatbot ID
   * @returns {Promise<Array>} Matching topics with confidence scores
   */
  async findMatchingTopics(text, chatbotId) {
    try {
      // Get all active topics for the chatbot
      const topics = await this.model.find({ 
        chatbotId, 
        active: true 
      }).sort({ priority: -1 }).exec();
      
      // Process text to lowercase for case-insensitive matching
      const lowerText = text.toLowerCase();
      
      // Match topics against text
      const matchingTopics = [];
      
      for (const topic of topics) {
        const matches = [];
        let highestConfidence = 0;
        
        // Check each pattern
        for (const pattern of topic.patterns) {
          let confidence = 0;
          let matched = false;
          
          // Exact match
          if (pattern.type === 'exact' && lowerText.includes(pattern.pattern.toLowerCase())) {
            confidence = 1.0;
            matched = true;
          }
          // Regex match
          else if (pattern.type === 'regex') {
            try {
              const regex = new RegExp(pattern.pattern, 'i');
              if (regex.test(text)) {
                confidence = 0.9;
                matched = true;
              }
            } catch (e) {
              logger.warn(`Invalid regex pattern in topic: ${topic._id}`, { pattern: pattern.pattern });
            }
          }
          // Keyword match
          else if (pattern.type === 'keyword') {
            const keywords = pattern.pattern.toLowerCase().split(',').map(k => k.trim());
            const matchedKeywords = keywords.filter(k => lowerText.includes(k));
            
            if (matchedKeywords.length > 0) {
              confidence = 0.7 * (matchedKeywords.length / keywords.length);
              matched = true;
            }
          }
          
          if (matched) {
            matches.push({
              patternId: pattern._id,
              patternType: pattern.type,
              confidence
            });
            
            highestConfidence = Math.max(highestConfidence, confidence);
          }
        }
        
        // Add topic to results if matches found
        if (matches.length > 0) {
          matchingTopics.push({
            topic: {
              _id: topic._id,
              name: topic.name,
              category: topic.category,
              priority: topic.priority
            },
            matches,
            confidence: highestConfidence
          });
        }
      }
      
      // Sort by confidence (desc) and priority (desc)
      matchingTopics.sort((a, b) => {
        if (a.confidence !== b.confidence) {
          return b.confidence - a.confidence;
        }
        return b.topic.priority - a.topic.priority;
      });
      
      return matchingTopics;
    } catch (error) {
      logger.error('Error finding matching topics', { error: error.message, chatbotId });
      throw error;
    }
  }
  
  /**
   * Override create method to add caching
   * @param {Object} data - Entity data
   * @param {Object} options - Create options
   * @returns {Promise<Object>} Created entity
   */
  async create(data, options = {}) {
    const result = await super.create(data, options);
    
    // Invalidate list caches when a new topic is created
    if (this.cacheEnabled && result) {
      await this.invalidateCache(`topic:list:${result.chatbotId}`);
    }
    
    return result;
  }
  
  /**
   * Override findByIdAndUpdate method to add caching
   * @param {string} id - Entity ID
   * @param {Object} updateData - Update data
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Updated entity
   */
  async findByIdAndUpdate(id, updateData, options = {}) {
    const entity = await super.findByIdAndUpdate(id, updateData, options);
    
    // Invalidate caches
    if (this.cacheEnabled && entity) {
      await this.invalidateCache(`topic:id:${id}`);
      await this.invalidateCache(`topic:name:${entity.name}:chatbot:${entity.chatbotId}`);
      await this.invalidateCache(`topic:list:${entity.chatbotId}`);
    }
    
    return entity;
  }
  
  /**
   * Override deleteById method to add caching
   * @param {string} id - Entity ID
   * @param {Object} options - Delete options
   * @returns {Promise<boolean>} True if deleted
   */
  async deleteById(id, options = {}) {
    // Get entity before deletion for cache invalidation
    const entity = await this.findById(id);
    
    const result = await super.deleteById(id, options);
    
    // Invalidate caches
    if (this.cacheEnabled && entity) {
      await this.invalidateCache(`topic:id:${id}`);
      await this.invalidateCache(`topic:name:${entity.name}:chatbot:${entity.chatbotId}`);
      await this.invalidateCache(`topic:list:${entity.chatbotId}`);
    }
    
    return result;
  }
}

module.exports = new TopicRepository();
