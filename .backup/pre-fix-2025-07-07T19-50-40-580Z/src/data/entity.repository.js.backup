/**
 * Entity Repository
 * 
 * Repository for Entity model with optimized queries and caching
 */

require('@src/data\base.repository');
require('@src/models\entity.model');
require('@src/utils');

class EntityRepository extends BaseRepository {
  constructor() {
    super(Entity);
    this.cache = new Map();
    this.cacheTTL = 10 * 60 * 1000; // 10 minutes in milliseconds
  }

  /**
   * Find entity by name with caching
   * @param {string} name - Entity name
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Entity
   */
  async findByName(name, options = {}) {
    try {
      // Check cache first
      const cacheKey = `name:${name}`;
      const cachedEntity = this.getFromCache(cacheKey);
      
      if (cachedEntity) {
        logger.debug('Entity retrieved from cache', { name });
        return cachedEntity;
      }
      
      // Find entity by name
      const entity = await this.findOne({ name }, options);
      
      // Cache the result
      if (entity) {
        this.addToCache(cacheKey, entity);
      }
      
      return entity;
    } catch (error) {
      logger.error('Error finding entity by name', { name, error: error.message });
      throw error;
    }
  }

  /**
   * Find entities for a chatbot with optimized query
   * @param {string} chatbotId - Chatbot ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Entities
   */
  async findByChatbot(chatbotId, options = {}) {
    try {
      const queryOptions = {
        sort: { name: 1 },
        lean: true,
        ...options
      };
      
      return await this.find({ chatbotId }, queryOptions);
    } catch (error) {
      logger.error('Error finding entities by chatbot', { chatbotId, error: error.message });
      throw error;
    }
  }

  /**
   * Add a value to an entity
   * @param {string} entityId - Entity ID
   * @param {Object} valueData - Value data
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Updated entity
   */
  async addValue(entityId, valueData, options = {}) {
    try {
      // Start a transaction if not provided
      const session = options.session || await this.startTransaction();
      const useProvidedSession = !!options.session;
      
      try {
        // Update entity with new value
        const update = {
          $push: { values: valueData }
        };
        
        const updatedEntity = await this.findByIdAndUpdate(
          entityId,
          update,
          { 
            session,
            new: true,
            ...options
          }
        );
        
        // Invalidate cache
        this.invalidateEntityCache(entityId, updatedEntity);
        
        // Commit transaction if we started it
        if (!useProvidedSession) {
          await this.commitTransaction(session);
        }
        
        return updatedEntity;
      } catch (error) {
        // Abort transaction if we started it
        if (!useProvidedSession) {
          await this.abortTransaction(session);
        }
        throw error;
      }
    } catch (error) {
      logger.error('Error adding value to entity', { entityId, error: error.message });
      throw error;
    }
  }

  /**
   * Remove a value from an entity
   * @param {string} entityId - Entity ID
   * @param {string} valueId - Value ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Updated entity
   */
  async removeValue(entityId, valueId, options = {}) {
    try {
      // Start a transaction if not provided
      const session = options.session || await this.startTransaction();
      const useProvidedSession = !!options.session;
      
      try {
        // Update entity to remove value
        const update = {
          $pull: { values: { _id: valueId } }
        };
        
        const updatedEntity = await this.findByIdAndUpdate(
          entityId,
          update,
          { 
            session,
            new: true,
            ...options
          }
        );
        
        // Invalidate cache
        this.invalidateEntityCache(entityId, updatedEntity);
        
        // Commit transaction if we started it
        if (!useProvidedSession) {
          await this.commitTransaction(session);
        }
        
        return updatedEntity;
      } catch (error) {
        // Abort transaction if we started it
        if (!useProvidedSession) {
          await this.abortTransaction(session);
        }
        throw error;
      }
    } catch (error) {
      logger.error('Error removing value from entity', { entityId, valueId, error: error.message });
      throw error;
    }
  }

  /**
   * Find entities with values matching text patterns
   * @param {string} text - Text to analyze
   * @param {string} chatbotId - Chatbot ID
   * @returns {Promise<Array>} Matching entities
   */
  async findMatchingEntities(text, chatbotId) {
    try {
      // Get all entities for the chatbot
      const entities = await this.findByChatbot(chatbotId, { lean: true });
      
      // Filter entities with values that match the text
      const matches = [];
      
      for (const entity of entities) {
        const entityMatches = this.extractEntityMatches(entity, text);
        
        if (entityMatches.length > 0) {
          matches.push({
            entity: entity,
            matches: entityMatches
          });
        }
      }
      
      return matches;
    } catch (error) {
      logger.error('Error finding matching entities', { chatbotId, error: error.message });
      throw error;
    }
  }

  /**
   * Extract entity matches from text
   * @param {Object} entity - Entity object
   * @param {string} text - Text to analyze
   * @returns {Array} Matching values
   * @private
   */
  extractEntityMatches(entity, text) {
    const matches = [];
    const lowerText = text.toLowerCase();
    
    // Check each value for matches
    for (const value of entity.values) {
      const synonyms = [value.value, ...(value.synonyms || [])];
      
      for (const synonym of synonyms) {
        const lowerSynonym = synonym.toLowerCase();
        
        if (lowerText.includes(lowerSynonym)) {
          matches.push({
            value: value.value,
            synonym: synonym,
            index: lowerText.indexOf(lowerSynonym),
            length: lowerSynonym.length
          });
        }
      }
    }
    
    return matches;
  }

  /**
   * Invalidate entity cache entries
   * @param {string} entityId - Entity ID
   * @param {Object} entity - Entity object
   * @private
   */
  invalidateEntityCache(entityId, entity) {
    // Remove ID-based cache
    this.removeFromCache(`id:${entityId}`);
    
    // Remove name-based cache if entity is available
    if (entity && entity.name) {
      this.removeFromCache(`name:${entity.name}`);
    }
  }
}

// Create singleton instance
const entityRepository = new EntityRepository();

module.exports = entityRepository;
