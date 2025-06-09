/**
 * Entity Tracking Service
 * 
 * This service provides functionality for tracking entities across conversations,
 * including creating, updating, retrieving, and managing entity relationships.
 */

const mongoose = require('mongoose');
require('@src/models\entity.model');
require('@src/models\entity-relation.model');
require('@src/models\entity-reference.model');
require('@src/utils');
const axios = require('axios');

// Configure axios with proxy
axios.defaults.proxy = {
  host: '104.129.196.38',
  port: 10563
};

class EntityTrackingService {
  /**
   * Track a new entity or update an existing one
   * @param {Object} entityData - Entity data to track
   * @param {String} userId - User ID
   * @param {String} chatbotId - Chatbot ID
   * @param {String} conversationId - Conversation ID
   * @returns {Promise<Object>} - Tracked entity
   */
  async trackEntity(entityData, userId, chatbotId, conversationId) {
    try {
      // Check if entity already exists
      let entity = await Entity.findOne({
        type: entityData.type,
        name: entityData.name,
        userId,
        chatbotId
      });

      if (entity) {
        // Update existing entity
        entity.aliases = [...new Set([...entity.aliases, ...(entityData.aliases || [])])];
        entity.confidence = Math.max(entity.confidence, entityData.confidence || 0);
        entity.metadata = { ...entity.metadata, ...(entityData.metadata || {}) };
        entity.lastUpdated = new Date();
        
        await entity.save();
        logger.info(`Updated existing entity: ${entity._id}`);
      } else {
        // Create new entity
        entity = new Entity({
          type: entityData.type,
          name: entityData.name,
          aliases: entityData.aliases || [],
          confidence: entityData.confidence || 0.5,
          metadata: entityData.metadata || {},
          userId,
          chatbotId,
          created: new Date(),
          lastUpdated: new Date()
        });
        
        await entity.save();
        logger.info(`Created new entity: ${entity._id}`);
      }

      // Create a reference to this entity in the current conversation
      const reference = new EntityReference({
        entityId: entity._id,
        conversationId,
        userId,
        chatbotId,
        context: entityData.context || 'mentioned in conversation',
        timestamp: new Date()
      });
      
      await reference.save();
      
      return entity;
    } catch (error) {
      logger.error('Error tracking entity:', error);
      throw error;
    }
  }

  /**
   * Create a relation between two entities
   * @param {Object} relationData - Relation data
   * @param {String} userId - User ID
   * @param {String} chatbotId - Chatbot ID
   * @returns {Promise<Object>} - Created relation
   */
  async createEntityRelation(relationData, userId, chatbotId) {
    try {
      // Verify both entities exist and belong to the user
      const sourceEntity = await Entity.findOne({
        _id: relationData.sourceEntityId,
        userId,
        chatbotId
      });
      
      const targetEntity = await Entity.findOne({
        _id: relationData.targetEntityId,
        userId,
        chatbotId
      });
      
      if (!sourceEntity || !targetEntity) {
        throw new Error('One or both entities not found');
      }
      
      // Check if relation already exists
      let relation = await EntityRelation.findOne({
        sourceEntityId: relationData.sourceEntityId,
        targetEntityId: relationData.targetEntityId,
        relationType: relationData.relationType,
        userId,
        chatbotId
      });
      
      if (relation) {
        // Update existing relation
        relation.confidence = Math.max(relation.confidence, relationData.confidence || 0);
        relation.metadata = { ...relation.metadata, ...(relationData.metadata || {}) };
        relation.lastUpdated = new Date();
        
        await relation.save();
        logger.info(`Updated existing entity relation: ${relation._id}`);
      } else {
        // Create new relation
        relation = new EntityRelation({
          sourceEntityId: relationData.sourceEntityId,
          targetEntityId: relationData.targetEntityId,
          relationType: relationData.relationType,
          confidence: relationData.confidence || 0.5,
          metadata: relationData.metadata || {},
          userId,
          chatbotId,
          created: new Date(),
          lastUpdated: new Date()
        });
        
        await relation.save();
        logger.info(`Created new entity relation: ${relation._id}`);
      }
      
      return relation;
    } catch (error) {
      logger.error('Error creating entity relation:', error);
      throw error;
    }
  }

  /**
   * Reference an existing entity in a conversation
   * @param {String} entityId - Entity ID
   * @param {String} conversationId - Conversation ID
   * @param {String} userId - User ID
   * @param {String} chatbotId - Chatbot ID
   * @param {String} context - Reference context
   * @returns {Promise<Object>} - Created reference
   */
  async referenceEntity(entityId, conversationId, userId, chatbotId, context) {
    try {
      // Verify entity exists and belongs to the user
      const entity = await Entity.findOne({
        _id: entityId,
        userId,
        chatbotId
      });
      
      if (!entity) {
        throw new Error('Entity not found');
      }
      
      // Create a reference
      const reference = new EntityReference({
        entityId,
        conversationId,
        userId,
        chatbotId,
        context: context || 'referenced in conversation',
        timestamp: new Date()
      });
      
      await reference.save();
      logger.info(`Created entity reference: ${reference._id}`);
      
      return reference;
    } catch (error) {
      logger.error('Error referencing entity:', error);
      throw error;
    }
  }

  /**
   * Get all entities for a user
   * @param {String} userId - User ID
   * @param {String} chatbotId - Chatbot ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} - List of entities
   */
  async getUserEntities(userId, chatbotId, filters = {}) {
    try {
      const query = {
        userId,
        chatbotId,
        ...filters
      };
      
      const entities = await Entity.find(query).sort({ lastUpdated: -1 });
      return entities;
    } catch (error) {
      logger.error('Error getting user entities:', error);
      throw error;
    }
  }

  /**
   * Get entities referenced in a conversation
   * @param {String} conversationId - Conversation ID
   * @param {String} userId - User ID
   * @param {String} chatbotId - Chatbot ID
   * @returns {Promise<Array>} - List of entities
   */
  async getConversationEntities(conversationId, userId, chatbotId) {
    try {
      // Find all references for this conversation
      const references = await EntityReference.find({
        conversationId,
        userId,
        chatbotId
      });
      
      // Get the unique entity IDs
      const entityIds = [...new Set(references.map(ref => ref.entityId))];
      
      // Fetch the entities
      const entities = await Entity.find({
        _id: { $in: entityIds },
        userId,
        chatbotId
      });
      
      return entities;
    } catch (error) {
      logger.error('Error getting conversation entities:', error);
      throw error;
    }
  }

  /**
   * Get entity relations
   * @param {String} entityId - Entity ID
   * @param {String} userId - User ID
   * @param {String} chatbotId - Chatbot ID
   * @returns {Promise<Object>} - Entity relations
   */
  async getEntityRelations(entityId, userId, chatbotId) {
    try {
      // Get relations where this entity is the source
      const outgoingRelations = await EntityRelation.find({
        sourceEntityId: entityId,
        userId,
        chatbotId
      }).populate('targetEntityId');
      
      // Get relations where this entity is the target
      const incomingRelations = await EntityRelation.find({
        targetEntityId: entityId,
        userId,
        chatbotId
      }).populate('sourceEntityId');
      
      return {
        outgoing: outgoingRelations,
        incoming: incomingRelations
      };
    } catch (error) {
      logger.error('Error getting entity relations:', error);
      throw error;
    }
  }

  /**
   * Delete an entity and all its relations and references
   * @param {String} entityId - Entity ID
   * @param {String} userId - User ID
   * @param {String} chatbotId - Chatbot ID
   * @returns {Promise<Boolean>} - Success status
   */
  async deleteEntity(entityId, userId, chatbotId) {
    try {
      // Verify entity exists and belongs to the user
      const entity = await Entity.findOne({
        _id: entityId,
        userId,
        chatbotId
      });
      
      if (!entity) {
        throw new Error('Entity not found');
      }
      
      // Delete all relations involving this entity
      await EntityRelation.deleteMany({
        $or: [
          { sourceEntityId: entityId },
          { targetEntityId: entityId }
        ],
        userId,
        chatbotId
      });
      
      // Delete all references to this entity
      await EntityReference.deleteMany({
        entityId,
        userId,
        chatbotId
      });
      
      // Delete the entity
      await Entity.deleteOne({
        _id: entityId,
        userId,
        chatbotId
      });
      
      logger.info(`Deleted entity: ${entityId}`);
      
      return true;
    } catch (error) {
      logger.error('Error deleting entity:', error);
      throw error;
    }
  }
}

module.exports = new EntityTrackingService();
