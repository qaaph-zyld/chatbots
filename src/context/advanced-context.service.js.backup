/**
 * Advanced Context Management Service
 * 
 * Provides enhanced context awareness capabilities for chatbots including
 * persistent context across conversations, entity tracking, user preference
 * learning, and topic detection.
 */

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
require('@src/utils');
const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');
require('@src/context\context.service');

// Define cross-conversation entity schema
const CrossConversationEntitySchema = new mongoose.Schema({
  chatbotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chatbot',
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  entityId: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  value: mongoose.Schema.Types.Mixed,
  aliases: [String],
  firstSeenAt: {
    type: Date,
    default: Date.now
  },
  lastSeenAt: {
    type: Date,
    default: Date.now
  },
  occurrenceCount: {
    type: Number,
    default: 1
  },
  confidence: {
    type: Number,
    default: 0.5
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  },
  relations: [{
    entityId: String,
    relationType: String,
    confidence: Number
  }],
  conversationIds: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Define user preference schema
const UserPreferenceSchema = new mongoose.Schema({
  chatbotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chatbot',
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  key: {
    type: String,
    required: true
  },
  value: mongoose.Schema.Types.Mixed,
  confidence: {
    type: Number,
    default: 0.5
  },
  source: {
    type: String,
    enum: ['explicit', 'implicit', 'inferred'],
    default: 'inferred'
  },
  firstSeenAt: {
    type: Date,
    default: Date.now
  },
  lastSeenAt: {
    type: Date,
    default: Date.now
  },
  occurrenceCount: {
    type: Number,
    default: 1
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

// Define topic schema
const TopicSchema = new mongoose.Schema({
  chatbotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chatbot',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  keywords: [String],
  parentTopic: String,
  childTopics: [String],
  relatedTopics: [{
    name: String,
    relationStrength: Number
  }],
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

// Create models
const CrossConversationEntity = mongoose.model('CrossConversationEntity', CrossConversationEntitySchema);
const UserPreference = mongoose.model('UserPreference', UserPreferenceSchema);
const Topic = mongoose.model('Topic', TopicSchema);

/**
 * Advanced Context Service class
 */
class AdvancedContextService {
  /**
   * Constructor
   */
  constructor() {
    this.proxyConfig = null;
    this.httpClient = axios.create({
      httpAgent: new HttpsProxyAgent(this.proxyConfig),
      httpsAgent: new HttpsProxyAgent(this.proxyConfig)
    });
    
    this.entityConfidenceThreshold = 0.6; // Minimum confidence to track entities across conversations
    this.preferenceConfidenceThreshold = 0.7; // Minimum confidence to store user preferences
    this.topicDetectionThreshold = 0.5; // Minimum confidence for topic detection
    
    logger.info('Advanced Context Service initialized');
  }
  
  /**
   * Track entity across conversations
   * @param {string} chatbotId - Chatbot ID
   * @param {string} userId - User ID
   * @param {string} conversationId - Conversation ID
   * @param {Object} entityData - Entity data
   * @returns {Promise<Object>} - Tracked entity
   */
  async trackEntity(chatbotId, userId, conversationId, entityData) {
    try {
      const { type, name, value, aliases = [], confidence = 0.5, metadata = {} } = entityData;
      
      if (!type || !name) {
        throw new Error('Entity type and name are required');
      }
      
      // Check if entity already exists
      let entity = await CrossConversationEntity.findOne({
        chatbotId,
        userId,
        type,
        name
      });
      
      if (entity) {
        // Update existing entity
        entity.value = value !== undefined ? value : entity.value;
        entity.lastSeenAt = new Date();
        entity.occurrenceCount += 1;
        entity.confidence = Math.max(entity.confidence, confidence);
        
        // Update aliases
        for (const alias of aliases) {
          if (!entity.aliases.includes(alias)) {
            entity.aliases.push(alias);
          }
        }
        
        // Update metadata
        for (const [key, val] of Object.entries(metadata)) {
          entity.metadata.set(key, val);
        }
        
        // Add conversation ID if not already present
        if (!entity.conversationIds.includes(conversationId)) {
          entity.conversationIds.push(conversationId);
        }
        
        entity.updatedAt = new Date();
        await entity.save();
        
        logger.info(`Updated cross-conversation entity ${entity.entityId} for user ${userId}`);
      } else {
        // Create new entity
        entity = new CrossConversationEntity({
          chatbotId,
          userId,
          entityId: uuidv4(),
          type,
          name,
          value,
          aliases,
          confidence,
          metadata: new Map(Object.entries(metadata)),
          conversationIds: [conversationId]
        });
        
        await entity.save();
        logger.info(`Created new cross-conversation entity ${entity.entityId} for user ${userId}`);
      }
      
      return entity.toObject();
    } catch (error) {
      logger.error(`Error tracking entity for user ${userId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Get entities for a user across all conversations
   * @param {string} chatbotId - Chatbot ID
   * @param {string} userId - User ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array<Object>>} - User entities
   */
  async getUserEntities(chatbotId, userId, filters = {}) {
    try {
      const query = { chatbotId, userId, ...filters };
      
      const entities = await CrossConversationEntity.find(query)
        .sort({ lastSeenAt: -1 })
        .limit(100);
      
      return entities.map(entity => entity.toObject());
    } catch (error) {
      logger.error(`Error getting entities for user ${userId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Get entity by ID
   * @param {string} chatbotId - Chatbot ID
   * @param {string} userId - User ID
   * @param {string} entityId - Entity ID
   * @returns {Promise<Object>} - Entity
   */
  async getEntityById(chatbotId, userId, entityId) {
    try {
      const entity = await CrossConversationEntity.findOne({
        chatbotId,
        userId,
        entityId
      });
      
      if (!entity) {
        throw new Error(`Entity not found: ${entityId}`);
      }
      
      return entity.toObject();
    } catch (error) {
      logger.error(`Error getting entity ${entityId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Add relation between entities
   * @param {string} chatbotId - Chatbot ID
   * @param {string} userId - User ID
   * @param {string} sourceEntityId - Source entity ID
   * @param {string} targetEntityId - Target entity ID
   * @param {string} relationType - Relation type
   * @param {number} confidence - Confidence level
   * @returns {Promise<Object>} - Updated source entity
   */
  async addEntityRelation(chatbotId, userId, sourceEntityId, targetEntityId, relationType, confidence = 0.5) {
    try {
      // Verify both entities exist
      const [sourceEntity, targetEntity] = await Promise.all([
        CrossConversationEntity.findOne({ chatbotId, userId, entityId: sourceEntityId }),
        CrossConversationEntity.findOne({ chatbotId, userId, entityId: targetEntityId })
      ]);
      
      if (!sourceEntity) {
        throw new Error(`Source entity not found: ${sourceEntityId}`);
      }
      
      if (!targetEntity) {
        throw new Error(`Target entity not found: ${targetEntityId}`);
      }
      
      // Check if relation already exists
      const existingRelation = sourceEntity.relations.find(
        rel => rel.entityId === targetEntityId && rel.relationType === relationType
      );
      
      if (existingRelation) {
        // Update existing relation
        existingRelation.confidence = Math.max(existingRelation.confidence, confidence);
      } else {
        // Add new relation
        sourceEntity.relations.push({
          entityId: targetEntityId,
          relationType,
          confidence
        });
      }
      
      sourceEntity.updatedAt = new Date();
      await sourceEntity.save();
      
      logger.info(`Added relation from entity ${sourceEntityId} to ${targetEntityId}`);
      
      return sourceEntity.toObject();
    } catch (error) {
      logger.error(`Error adding entity relation:`, error.message);
      throw error;
    }
  }
  
  /**
   * Merge duplicate entities
   * @param {string} chatbotId - Chatbot ID
   * @param {string} userId - User ID
   * @param {Array<string>} entityIds - Entity IDs to merge
   * @param {string} primaryEntityId - Primary entity ID to keep
   * @returns {Promise<Object>} - Merged entity
   */
  async mergeEntities(chatbotId, userId, entityIds, primaryEntityId) {
    try {
      if (!entityIds.includes(primaryEntityId)) {
        throw new Error('Primary entity ID must be included in the list of entities to merge');
      }
      
      // Get all entities
      const entities = await CrossConversationEntity.find({
        chatbotId,
        userId,
        entityId: { $in: entityIds }
      });
      
      if (entities.length !== entityIds.length) {
        throw new Error('One or more entities not found');
      }
      
      // Find primary entity
      const primaryEntity = entities.find(entity => entity.entityId === primaryEntityId);
      
      if (!primaryEntity) {
        throw new Error(`Primary entity not found: ${primaryEntityId}`);
      }
      
      // Merge entities into primary
      for (const entity of entities) {
        if (entity.entityId === primaryEntityId) {
          continue; // Skip primary entity
        }
        
        // Merge aliases
        for (const alias of entity.aliases) {
          if (!primaryEntity.aliases.includes(alias)) {
            primaryEntity.aliases.push(alias);
          }
        }
        
        // Merge conversation IDs
        for (const conversationId of entity.conversationIds) {
          if (!primaryEntity.conversationIds.includes(conversationId)) {
            primaryEntity.conversationIds.push(conversationId);
          }
        }
        
        // Merge relations
        for (const relation of entity.relations) {
          const existingRelation = primaryEntity.relations.find(
            rel => rel.entityId === relation.entityId && rel.relationType === relation.relationType
          );
          
          if (existingRelation) {
            existingRelation.confidence = Math.max(existingRelation.confidence, relation.confidence);
          } else {
            primaryEntity.relations.push(relation);
          }
        }
        
        // Update metadata
        for (const [key, value] of entity.metadata.entries()) {
          if (!primaryEntity.metadata.has(key)) {
            primaryEntity.metadata.set(key, value);
          }
        }
        
        // Update occurrence count
        primaryEntity.occurrenceCount += entity.occurrenceCount;
        
        // Update confidence
        primaryEntity.confidence = Math.max(primaryEntity.confidence, entity.confidence);
        
        // Update timestamps
        primaryEntity.firstSeenAt = new Date(Math.min(
          primaryEntity.firstSeenAt.getTime(),
          entity.firstSeenAt.getTime()
        ));
        
        primaryEntity.lastSeenAt = new Date(Math.max(
          primaryEntity.lastSeenAt.getTime(),
          entity.lastSeenAt.getTime()
        ));
      }
      
      primaryEntity.updatedAt = new Date();
      await primaryEntity.save();
      
      // Delete merged entities
      await CrossConversationEntity.deleteMany({
        chatbotId,
        userId,
        entityId: { $in: entityIds.filter(id => id !== primaryEntityId) }
      });
      
      logger.info(`Merged ${entityIds.length - 1} entities into ${primaryEntityId}`);
      
      return primaryEntity.toObject();
    } catch (error) {
      logger.error(`Error merging entities:`, error.message);
      throw error;
    }
  }
  
  /**
   * Find potential duplicate entities
   * @param {string} chatbotId - Chatbot ID
   * @param {string} userId - User ID
   * @param {Object} options - Search options
   * @returns {Promise<Array<Object>>} - Potential duplicates
   */
  async findPotentialDuplicates(chatbotId, userId, options = {}) {
    try {
      const { type, similarityThreshold = 0.8 } = options;
      
      // Get all entities of the specified type
      const query = { chatbotId, userId };
      if (type) {
        query.type = type;
      }
      
      const entities = await CrossConversationEntity.find(query);
      
      // Group by name similarity
      const potentialDuplicates = [];
      
      for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
          const entity1 = entities[i];
          const entity2 = entities[j];
          
          // Skip if different types
          if (entity1.type !== entity2.type) {
            continue;
          }
          
          // Check name similarity
          const nameSimilarity = this._calculateStringSimilarity(entity1.name, entity2.name);
          
          // Check alias overlap
          let aliasOverlap = false;
          for (const alias1 of entity1.aliases) {
            for (const alias2 of entity2.aliases) {
              if (this._calculateStringSimilarity(alias1, alias2) >= similarityThreshold) {
                aliasOverlap = true;
                break;
              }
            }
            if (aliasOverlap) break;
          }
          
          // Check if entity1 name matches any entity2 alias
          let nameAliasMatch = false;
          for (const alias of entity2.aliases) {
            if (this._calculateStringSimilarity(entity1.name, alias) >= similarityThreshold) {
              nameAliasMatch = true;
              break;
            }
          }
          
          // Check if entity2 name matches any entity1 alias
          if (!nameAliasMatch) {
            for (const alias of entity1.aliases) {
              if (this._calculateStringSimilarity(entity2.name, alias) >= similarityThreshold) {
                nameAliasMatch = true;
                break;
              }
            }
          }
          
          if (nameSimilarity >= similarityThreshold || aliasOverlap || nameAliasMatch) {
            potentialDuplicates.push({
              entities: [entity1.toObject(), entity2.toObject()],
              similarity: nameSimilarity,
              reason: nameSimilarity >= similarityThreshold 
                ? 'name_similarity' 
                : (aliasOverlap ? 'alias_overlap' : 'name_alias_match')
            });
          }
        }
      }
      
      return potentialDuplicates;
    } catch (error) {
      logger.error(`Error finding potential duplicates:`, error.message);
      throw error;
    }
  }
  
  /**
   * Calculate string similarity (Levenshtein distance)
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} - Similarity score (0-1)
   * @private
   */
  _calculateStringSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    // Calculate Levenshtein distance
    const matrix = [];
    
    for (let i = 0; i <= s1.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= s2.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= s1.length; i++) {
      for (let j = 1; j <= s2.length; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }
    
    const distance = matrix[s1.length][s2.length];
    const maxLength = Math.max(s1.length, s2.length);
    
    return maxLength === 0 ? 1 : 1 - distance / maxLength;
  }
}

// Create singleton instance
const advancedContextService = new AdvancedContextService();

module.exports = advancedContextService;
