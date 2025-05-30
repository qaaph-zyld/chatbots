/**
 * Entity Tracking Service
 * 
 * Provides capabilities for tracking entities across conversations
 * to enhance context awareness.
 */

const mongoose = require('mongoose');
const { logger } = require('../utils');
const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');

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
  type: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  aliases: [String],
  confidence: {
    type: Number,
    default: 0.7
  },
  mentionCount: {
    type: Number,
    default: 1
  },
  lastMentionedAt: {
    type: Date,
    default: Date.now
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
CrossConversationEntitySchema.index({ chatbotId: 1, userId: 1, type: 1, name: 1 });

// Create model
const CrossConversationEntity = mongoose.model('CrossConversationEntity', CrossConversationEntitySchema);

/**
 * Entity Tracking Service class
 */
class EntityTrackingService {
  /**
   * Constructor
   */
  constructor() {
    this.proxyConfig = process.env.HTTP_PROXY || 'http://104.129.196.38:10563';
    this.httpClient = axios.create({
      httpAgent: new HttpsProxyAgent(this.proxyConfig),
      httpsAgent: new HttpsProxyAgent(this.proxyConfig)
    });
    
    this.entityConfidenceThreshold = 0.5;
    
    logger.info('Entity Tracking Service initialized');
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
      const { type, name, aliases, confidence, metadata } = entityData;
      
      if (!type || !name) {
        throw new Error('Entity type and name are required');
      }
      
      const now = new Date();
      
      // Find existing entity
      let entity = await CrossConversationEntity.findOne({
        chatbotId,
        userId,
        type,
        $or: [
          { name },
          { aliases: name }
        ]
      });
      
      if (entity) {
        // Update existing entity
        entity.lastMentionedAt = now;
        entity.mentionCount += 1;
        
        // Update confidence if higher
        if (confidence && confidence > entity.confidence) {
          entity.confidence = confidence;
        }
        
        // Add new aliases without duplicates
        if (aliases && Array.isArray(aliases)) {
          for (const alias of aliases) {
            if (!entity.aliases.includes(alias)) {
              entity.aliases.push(alias);
            }
          }
        }
        
        // Update metadata
        if (metadata && typeof metadata === 'object') {
          for (const [key, value] of Object.entries(metadata)) {
            entity.metadata.set(key, value);
          }
        }
        
        // Add conversation ID to metadata if not exists
        if (!entity.metadata.has('conversations')) {
          entity.metadata.set('conversations', [conversationId]);
        } else {
          const conversations = entity.metadata.get('conversations');
          if (!conversations.includes(conversationId)) {
            conversations.push(conversationId);
            entity.metadata.set('conversations', conversations);
          }
        }
        
        entity.updatedAt = now;
        await entity.save();
        
        logger.info(`Updated cross-conversation entity ${type}:${name} for user ${userId}`);
      } else {
        // Create new entity
        entity = new CrossConversationEntity({
          chatbotId,
          userId,
          type,
          name,
          aliases: aliases || [],
          confidence: confidence || 0.7,
          metadata: new Map(Object.entries({
            ...(metadata || {}),
            conversations: [conversationId]
          }))
        });
        
        await entity.save();
        logger.info(`Created new cross-conversation entity ${type}:${name} for user ${userId}`);
      }
      
      return entity.toObject();
    } catch (error) {
      logger.error(`Error tracking entity for user ${userId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Get user entities
   * @param {string} chatbotId - Chatbot ID
   * @param {string} userId - User ID
   * @param {Object} filters - Filters
   * @returns {Promise<Array<Object>>} - User entities
   */
  async getUserEntities(chatbotId, userId, filters = {}) {
    try {
      const { type, name, minConfidence, sortBy, limit } = filters;
      
      const query = {
        chatbotId,
        userId
      };
      
      if (type) {
        query.type = type;
      }
      
      if (name) {
        query.$or = [
          { name: { $regex: name, $options: 'i' } },
          { aliases: { $regex: name, $options: 'i' } }
        ];
      }
      
      if (minConfidence) {
        query.confidence = { $gte: parseFloat(minConfidence) };
      }
      
      let sortOptions = { lastMentionedAt: -1 };
      
      if (sortBy === 'name') {
        sortOptions = { name: 1 };
      } else if (sortBy === 'type') {
        sortOptions = { type: 1, name: 1 };
      } else if (sortBy === 'confidence') {
        sortOptions = { confidence: -1 };
      } else if (sortBy === 'mentionCount') {
        sortOptions = { mentionCount: -1 };
      }
      
      const entities = await CrossConversationEntity.find(query)
        .sort(sortOptions)
        .limit(limit ? parseInt(limit) : 100);
      
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
        _id: entityId,
        chatbotId,
        userId
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
}

// Create singleton instance
const entityTrackingService = new EntityTrackingService();

module.exports = entityTrackingService;
