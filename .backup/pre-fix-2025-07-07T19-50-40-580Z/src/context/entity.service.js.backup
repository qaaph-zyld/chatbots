/**
 * Entity Service
 * 
 * Provides entity memory and management capabilities for chatbots
 */

const mongoose = require('mongoose');
require('@src/utils');
require('@src/context\context.service');

// Define entity schema
const EntitySchema = new mongoose.Schema({
  chatbotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chatbot',
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  value: {
    type: String,
    required: true
  },
  aliases: [String],
  attributes: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  },
  relations: [
    {
      entityId: String,
      relationType: String,
      confidence: Number
    }
  ],
  mentions: [
    {
      conversationId: String,
      messageId: String,
      timestamp: Date
    }
  ],
  confidence: {
    type: Number,
    default: 0.5
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create compound index for efficient lookups
EntitySchema.index({ chatbotId: 1, userId: 1, type: 1, value: 1 }, { unique: true });

// Create model
const Entity = mongoose.model('Entity', EntitySchema);

/**
 * Entity Service class
 */
class EntityService {
  /**
   * Constructor
   */
  constructor() {
    this.confidenceThreshold = 0.6; // Minimum confidence to store entity
    this.entityMergeThreshold = 0.8; // Minimum confidence to merge entities
    
    logger.info('Entity Service initialized');
  }
  
  /**
   * Get entity unique ID
   * @param {string} type - Entity type
   * @param {string} value - Entity value
   * @returns {string} - Entity ID
   * @private
   */
  _getEntityId(type, value) {
    return `${type}:${value}`;
  }
  
  /**
   * Get or create entity
   * @param {string} chatbotId - Chatbot ID
   * @param {string} userId - User ID
   * @param {string} type - Entity type
   * @param {string} value - Entity value
   * @returns {Promise<Object>} - Entity object
   */
  async getOrCreateEntity(chatbotId, userId, type, value) {
    try {
      // Find existing entity
      let entity = await Entity.findOne({
        chatbotId,
        userId,
        type,
        value
      });
      
      // Create new entity if not found
      if (!entity) {
        entity = new Entity({
          chatbotId,
          userId,
          type,
          value
        });
        
        await entity.save();
        logger.info(`Created new entity ${type}:${value} for chatbot ${chatbotId}, user ${userId}`);
      }
      
      return entity;
    } catch (error) {
      logger.error(`Error getting entity ${type}:${value} for chatbot ${chatbotId}, user ${userId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Update entity with new information
   * @param {string} chatbotId - Chatbot ID
   * @param {string} userId - User ID
   * @param {string} type - Entity type
   * @param {string} value - Entity value
   * @param {Object} entityData - Entity data to update
   * @returns {Promise<Object>} - Updated entity object
   */
  async updateEntity(chatbotId, userId, type, value, entityData) {
    try {
      // Get entity
      const entity = await this.getOrCreateEntity(chatbotId, userId, type, value);
      
      // Update aliases
      if (entityData.aliases && Array.isArray(entityData.aliases)) {
        // Add new aliases without duplicates
        for (const alias of entityData.aliases) {
          if (!entity.aliases.includes(alias)) {
            entity.aliases.push(alias);
          }
        }
      }
      
      // Update attributes
      if (entityData.attributes) {
        for (const [key, attrValue] of Object.entries(entityData.attributes)) {
          entity.attributes.set(key, attrValue);
        }
      }
      
      // Update relations
      if (entityData.relations && Array.isArray(entityData.relations)) {
        for (const relation of entityData.relations) {
          // Check if relation already exists
          const existingRelationIndex = entity.relations.findIndex(r => 
            r.entityId === relation.entityId && r.relationType === relation.relationType
          );
          
          if (existingRelationIndex >= 0) {
            // Update existing relation
            entity.relations[existingRelationIndex].confidence = 
              Math.max(entity.relations[existingRelationIndex].confidence, relation.confidence || 0.5);
          } else {
            // Add new relation
            entity.relations.push({
              entityId: relation.entityId,
              relationType: relation.relationType,
              confidence: relation.confidence || 0.5
            });
          }
        }
      }
      
      // Add mention
      if (entityData.mention) {
        entity.mentions.push({
          conversationId: entityData.mention.conversationId,
          messageId: entityData.mention.messageId,
          timestamp: entityData.mention.timestamp || new Date()
        });
      }
      
      // Update confidence
      if (entityData.confidence !== undefined) {
        // Use weighted average to update confidence
        const oldWeight = entity.mentions.length;
        const newWeight = 1;
        const totalWeight = oldWeight + newWeight;
        
        entity.confidence = (
          (entity.confidence * oldWeight) + (entityData.confidence * newWeight)
        ) / totalWeight;
      }
      
      // Update metadata
      if (entityData.metadata) {
        for (const [key, value] of Object.entries(entityData.metadata)) {
          entity.metadata.set(key, value);
        }
      }
      
      // Update timestamp
      entity.updatedAt = new Date();
      
      // Save entity
      await entity.save();
      
      return entity;
    } catch (error) {
      logger.error(`Error updating entity ${type}:${value} for chatbot ${chatbotId}, user ${userId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Process entities from NLP analysis
   * @param {string} chatbotId - Chatbot ID
   * @param {string} userId - User ID
   * @param {string} conversationId - Conversation ID
   * @param {string} messageId - Message ID
   * @param {Array} entities - Entities from NLP analysis
   * @returns {Promise<Array>} - Processed entities
   */
  async processEntities(chatbotId, userId, conversationId, messageId, entities) {
    try {
      const processedEntities = [];
      
      if (!entities || !Array.isArray(entities)) {
        return processedEntities;
      }
      
      for (const entity of entities) {
        // Skip entities with low confidence
        if (entity.confidence < this.confidenceThreshold) {
          continue;
        }
        
        // Update entity in database
        const updatedEntity = await this.updateEntity(
          chatbotId,
          userId,
          entity.type,
          entity.value,
          {
            confidence: entity.confidence,
            mention: {
              conversationId,
              messageId,
              timestamp: new Date()
            },
            metadata: entity.metadata || {}
          }
        );
        
        // Add to processed entities
        processedEntities.push({
          id: this._getEntityId(entity.type, entity.value),
          type: entity.type,
          value: entity.value,
          confidence: entity.confidence,
          metadata: entity.metadata || {}
        });
        
        // Update context with entity
        await contextService.updateContext(chatbotId, userId, conversationId, {
          entities: {
            [this._getEntityId(entity.type, entity.value)]: {
              type: entity.type,
              value: entity.value,
              metadata: entity.metadata || {},
              lastMentioned: new Date()
            }
          }
        });
      }
      
      return processedEntities;
    } catch (error) {
      logger.error(`Error processing entities for chatbot ${chatbotId}, user ${userId}:`, error.message);
      return [];
    }
  }
  
  /**
   * Get entities for user
   * @param {string} chatbotId - Chatbot ID
   * @param {string} userId - User ID
   * @param {Object} options - Options for filtering entities
   * @returns {Promise<Array>} - Entities
   */
  async getUserEntities(chatbotId, userId, options = {}) {
    try {
      // Build query
      const query = {
        chatbotId,
        userId
      };
      
      // Add type filter
      if (options.types && Array.isArray(options.types)) {
        query.type = { $in: options.types };
      }
      
      // Get entities
      let entities = await Entity.find(query);
      
      // Apply value filter if provided
      if (options.values && Array.isArray(options.values)) {
        entities = entities.filter(entity => options.values.includes(entity.value));
      }
      
      // Apply confidence filter
      if (options.minConfidence !== undefined) {
        entities = entities.filter(entity => entity.confidence >= options.minConfidence);
      }
      
      // Sort by recency
      entities.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      
      // Limit results if specified
      if (options.limit) {
        entities = entities.slice(0, options.limit);
      }
      
      return entities;
    } catch (error) {
      logger.error(`Error getting entities for chatbot ${chatbotId}, user ${userId}:`, error.message);
      return [];
    }
  }
  
  /**
   * Get entity by ID
   * @param {string} chatbotId - Chatbot ID
   * @param {string} userId - User ID
   * @param {string} entityId - Entity ID (type:value)
   * @returns {Promise<Object|null>} - Entity object or null if not found
   */
  async getEntityById(chatbotId, userId, entityId) {
    try {
      const [type, value] = entityId.split(':');
      
      return await Entity.findOne({
        chatbotId,
        userId,
        type,
        value
      });
    } catch (error) {
      logger.error(`Error getting entity ${entityId} for chatbot ${chatbotId}, user ${userId}:`, error.message);
      return null;
    }
  }
  
  /**
   * Find entities by attribute
   * @param {string} chatbotId - Chatbot ID
   * @param {string} userId - User ID
   * @param {string} attributeKey - Attribute key
   * @param {*} attributeValue - Attribute value
   * @returns {Promise<Array>} - Matching entities
   */
  async findEntitiesByAttribute(chatbotId, userId, attributeKey, attributeValue) {
    try {
      // This is a bit tricky with MongoDB's Map type
      // We need to use the dot notation to query the attributes map
      const entities = await Entity.find({
        chatbotId,
        userId,
        [`attributes.${attributeKey}`]: attributeValue
      });
      
      return entities;
    } catch (error) {
      logger.error(`Error finding entities by attribute for chatbot ${chatbotId}, user ${userId}:`, error.message);
      return [];
    }
  }
  
  /**
   * Find entities by relation
   * @param {string} chatbotId - Chatbot ID
   * @param {string} userId - User ID
   * @param {string} relatedEntityId - Related entity ID
   * @param {string} relationType - Relation type (optional)
   * @returns {Promise<Array>} - Matching entities
   */
  async findEntitiesByRelation(chatbotId, userId, relatedEntityId, relationType = null) {
    try {
      // Build query for relations
      const relationQuery = {
        entityId: relatedEntityId
      };
      
      if (relationType) {
        relationQuery.relationType = relationType;
      }
      
      // Find entities with matching relation
      const entities = await Entity.find({
        chatbotId,
        userId,
        relations: {
          $elemMatch: relationQuery
        }
      });
      
      return entities;
    } catch (error) {
      logger.error(`Error finding entities by relation for chatbot ${chatbotId}, user ${userId}:`, error.message);
      return [];
    }
  }
  
  /**
   * Add relation between entities
   * @param {string} chatbotId - Chatbot ID
   * @param {string} userId - User ID
   * @param {string} sourceEntityId - Source entity ID
   * @param {string} targetEntityId - Target entity ID
   * @param {string} relationType - Relation type
   * @param {number} confidence - Confidence level (0-1)
   * @returns {Promise<boolean>} - True if relation was added
   */
  async addEntityRelation(chatbotId, userId, sourceEntityId, targetEntityId, relationType, confidence = 0.7) {
    try {
      // Get source entity
      const sourceEntity = await this.getEntityById(chatbotId, userId, sourceEntityId);
      
      if (!sourceEntity) {
        throw new Error(`Source entity ${sourceEntityId} not found`);
      }
      
      // Get target entity
      const targetEntity = await this.getEntityById(chatbotId, userId, targetEntityId);
      
      if (!targetEntity) {
        throw new Error(`Target entity ${targetEntityId} not found`);
      }
      
      // Add relation to source entity
      await this.updateEntity(
        chatbotId,
        userId,
        sourceEntity.type,
        sourceEntity.value,
        {
          relations: [
            {
              entityId: targetEntityId,
              relationType,
              confidence
            }
          ]
        }
      );
      
      return true;
    } catch (error) {
      logger.error(`Error adding entity relation for chatbot ${chatbotId}, user ${userId}:`, error.message);
      return false;
    }
  }
  
  /**
   * Merge duplicate entities
   * @param {string} chatbotId - Chatbot ID
   * @param {string} userId - User ID
   * @param {string} primaryEntityId - Primary entity ID to keep
   * @param {string} duplicateEntityId - Duplicate entity ID to merge
   * @returns {Promise<Object|null>} - Merged entity or null if failed
   */
  async mergeEntities(chatbotId, userId, primaryEntityId, duplicateEntityId) {
    try {
      // Get primary entity
      const primaryEntity = await this.getEntityById(chatbotId, userId, primaryEntityId);
      
      if (!primaryEntity) {
        throw new Error(`Primary entity ${primaryEntityId} not found`);
      }
      
      // Get duplicate entity
      const duplicateEntity = await this.getEntityById(chatbotId, userId, duplicateEntityId);
      
      if (!duplicateEntity) {
        throw new Error(`Duplicate entity ${duplicateEntityId} not found`);
      }
      
      // Merge aliases
      for (const alias of duplicateEntity.aliases) {
        if (!primaryEntity.aliases.includes(alias)) {
          primaryEntity.aliases.push(alias);
        }
      }
      
      // Merge attributes
      for (const [key, value] of duplicateEntity.attributes.entries()) {
        if (!primaryEntity.attributes.has(key)) {
          primaryEntity.attributes.set(key, value);
        }
      }
      
      // Merge relations
      for (const relation of duplicateEntity.relations) {
        // Skip relations to the primary entity itself
        if (relation.entityId === primaryEntityId) {
          continue;
        }
        
        // Check if relation already exists
        const existingRelationIndex = primaryEntity.relations.findIndex(r => 
          r.entityId === relation.entityId && r.relationType === relation.relationType
        );
        
        if (existingRelationIndex >= 0) {
          // Update existing relation with higher confidence
          primaryEntity.relations[existingRelationIndex].confidence = 
            Math.max(primaryEntity.relations[existingRelationIndex].confidence, relation.confidence);
        } else {
          // Add new relation
          primaryEntity.relations.push(relation);
        }
      }
      
      // Merge mentions
      for (const mention of duplicateEntity.mentions) {
        primaryEntity.mentions.push(mention);
      }
      
      // Update confidence (weighted average)
      const primaryWeight = primaryEntity.mentions.length;
      const duplicateWeight = duplicateEntity.mentions.length;
      const totalWeight = primaryWeight + duplicateWeight;
      
      primaryEntity.confidence = (
        (primaryEntity.confidence * primaryWeight) + 
        (duplicateEntity.confidence * duplicateWeight)
      ) / totalWeight;
      
      // Update timestamp
      primaryEntity.updatedAt = new Date();
      
      // Save primary entity
      await primaryEntity.save();
      
      // Update relations in other entities
      const relatedEntities = await this.findEntitiesByRelation(chatbotId, userId, duplicateEntityId);
      
      for (const entity of relatedEntities) {
        // Update relations to point to primary entity
        for (const relation of entity.relations) {
          if (relation.entityId === duplicateEntityId) {
            relation.entityId = primaryEntityId;
          }
        }
        
        // Remove duplicate relations
        entity.relations = entity.relations.filter((relation, index, self) => 
          index === self.findIndex(r => 
            r.entityId === relation.entityId && r.relationType === relation.relationType
          )
        );
        
        await entity.save();
      }
      
      // Delete duplicate entity
      await Entity.deleteOne({
        chatbotId,
        userId,
        type: duplicateEntity.type,
        value: duplicateEntity.value
      });
      
      logger.info(`Merged entity ${duplicateEntityId} into ${primaryEntityId} for chatbot ${chatbotId}, user ${userId}`);
      
      return primaryEntity;
    } catch (error) {
      logger.error(`Error merging entities for chatbot ${chatbotId}, user ${userId}:`, error.message);
      return null;
    }
  }
  
  /**
   * Find potential duplicate entities
   * @param {string} chatbotId - Chatbot ID
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Potential duplicate pairs
   */
  async findPotentialDuplicates(chatbotId, userId) {
    try {
      const entities = await Entity.find({ chatbotId, userId });
      const potentialDuplicates = [];
      
      // Compare entities of the same type
      const entitiesByType = {};
      
      for (const entity of entities) {
        if (!entitiesByType[entity.type]) {
          entitiesByType[entity.type] = [];
        }
        
        entitiesByType[entity.type].push(entity);
      }
      
      // Check for similar values within each type
      for (const type in entitiesByType) {
        const typeEntities = entitiesByType[type];
        
        for (let i = 0; i < typeEntities.length; i++) {
          for (let j = i + 1; j < typeEntities.length; j++) {
            const entity1 = typeEntities[i];
            const entity2 = typeEntities[j];
            
            // Check for similar values
            if (this._areSimilarValues(entity1.value, entity2.value)) {
              potentialDuplicates.push({
                entity1: {
                  id: this._getEntityId(entity1.type, entity1.value),
                  type: entity1.type,
                  value: entity1.value
                },
                entity2: {
                  id: this._getEntityId(entity2.type, entity2.value),
                  type: entity2.type,
                  value: entity2.value
                },
                similarity: 'value'
              });
              continue;
            }
            
            // Check for alias matches
            if (entity1.aliases.includes(entity2.value) || entity2.aliases.includes(entity1.value)) {
              potentialDuplicates.push({
                entity1: {
                  id: this._getEntityId(entity1.type, entity1.value),
                  type: entity1.type,
                  value: entity1.value
                },
                entity2: {
                  id: this._getEntityId(entity2.type, entity2.value),
                  type: entity2.type,
                  value: entity2.value
                },
                similarity: 'alias'
              });
              continue;
            }
            
            // Check for shared attributes
            const sharedAttributes = this._getSharedAttributes(entity1, entity2);
            
            if (sharedAttributes.length >= 2) {
              potentialDuplicates.push({
                entity1: {
                  id: this._getEntityId(entity1.type, entity1.value),
                  type: entity1.type,
                  value: entity1.value
                },
                entity2: {
                  id: this._getEntityId(entity2.type, entity2.value),
                  type: entity2.type,
                  value: entity2.value
                },
                similarity: 'attributes',
                sharedAttributes
              });
            }
          }
        }
      }
      
      return potentialDuplicates;
    } catch (error) {
      logger.error(`Error finding potential duplicates for chatbot ${chatbotId}, user ${userId}:`, error.message);
      return [];
    }
  }
  
  /**
   * Check if two values are similar
   * @param {string} value1 - First value
   * @param {string} value2 - Second value
   * @returns {boolean} - True if values are similar
   * @private
   */
  _areSimilarValues(value1, value2) {
    // Simple case-insensitive check
    if (value1.toLowerCase() === value2.toLowerCase()) {
      return true;
    }
    
    // Check for contained values
    if (value1.toLowerCase().includes(value2.toLowerCase()) || 
        value2.toLowerCase().includes(value1.toLowerCase())) {
      return true;
    }
    
    // Check for Levenshtein distance (simple implementation)
    if (this._levenshteinDistance(value1.toLowerCase(), value2.toLowerCase()) <= 2) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Calculate Levenshtein distance between two strings
   * @param {string} s1 - First string
   * @param {string} s2 - Second string
   * @returns {number} - Levenshtein distance
   * @private
   */
  _levenshteinDistance(s1, s2) {
    const m = s1.length;
    const n = s2.length;
    
    // Create matrix
    const d = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
    
    // Initialize first row and column
    for (let i = 0; i <= m; i++) {
      d[i][0] = i;
    }
    
    for (let j = 0; j <= n; j++) {
      d[0][j] = j;
    }
    
    // Fill in the rest of the matrix
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        
        d[i][j] = Math.min(
          d[i - 1][j] + 1, // deletion
          d[i][j - 1] + 1, // insertion
          d[i - 1][j - 1] + cost // substitution
        );
      }
    }
    
    return d[m][n];
  }
  
  /**
   * Get shared attributes between two entities
   * @param {Object} entity1 - First entity
   * @param {Object} entity2 - Second entity
   * @returns {Array} - Shared attribute keys
   * @private
   */
  _getSharedAttributes(entity1, entity2) {
    const sharedAttributes = [];
    
    for (const [key, value1] of entity1.attributes.entries()) {
      if (entity2.attributes.has(key)) {
        const value2 = entity2.attributes.get(key);
        
        // Check if values are equal or similar
        if (value1 === value2 || 
            (typeof value1 === 'string' && 
             typeof value2 === 'string' && 
             this._areSimilarValues(value1, value2))) {
          sharedAttributes.push(key);
        }
      }
    }
    
    return sharedAttributes;
  }
  
  /**
   * Delete entity
   * @param {string} chatbotId - Chatbot ID
   * @param {string} userId - User ID
   * @param {string} entityId - Entity ID
   * @returns {Promise<boolean>} - True if deleted
   */
  async deleteEntity(chatbotId, userId, entityId) {
    try {
      const [type, value] = entityId.split(':');
      
      // Delete entity
      const result = await Entity.deleteOne({
        chatbotId,
        userId,
        type,
        value
      });
      
      if (result.deletedCount === 0) {
        throw new Error(`Entity ${entityId} not found`);
      }
      
      logger.info(`Deleted entity ${entityId} for chatbot ${chatbotId}, user ${userId}`);
      
      return true;
    } catch (error) {
      logger.error(`Error deleting entity ${entityId} for chatbot ${chatbotId}, user ${userId}:`, error.message);
      return false;
    }
  }
}

// Create singleton instance
const entityService = new EntityService();

module.exports = entityService;
