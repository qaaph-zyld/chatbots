/**
 * Entity Service
 * 
 * Service for managing named entities in the chatbot platform
 */

const { logger } = require('../utils');
const Entity = require('../models/entity.model');

/**
 * Create a new entity
 * @param {Object} entityData - Entity data
 * @returns {Promise<Object>} Created entity
 */
const createEntity = async (entityData) => {
  try {
    const entity = new Entity(entityData);
    await entity.save();
    
    logger.info(`Entity created: ${entity._id}`, { name: entity.name });
    return entity;
  } catch (error) {
    logger.error('Error creating entity', { error, entityData });
    throw error;
  }
};

/**
 * Get entity by ID
 * @param {string} entityId - Entity ID
 * @returns {Promise<Object>} Entity object
 */
const getEntityById = async (entityId) => {
  try {
    const entity = await Entity.findById(entityId);
    
    if (!entity) {
      logger.warn(`Entity not found: ${entityId}`);
      return null;
    }
    
    return entity;
  } catch (error) {
    logger.error('Error getting entity by ID', { error, entityId });
    throw error;
  }
};

/**
 * Get entity by name
 * @param {string} name - Entity name
 * @param {string} chatbotId - Chatbot ID
 * @returns {Promise<Object>} Entity object
 */
const getEntityByName = async (name, chatbotId) => {
  try {
    const entity = await Entity.findOne({ name, chatbotId });
    
    if (!entity) {
      logger.warn(`Entity not found: ${name}`, { chatbotId });
      return null;
    }
    
    return entity;
  } catch (error) {
    logger.error('Error getting entity by name', { error, name, chatbotId });
    throw error;
  }
};

/**
 * Update an entity
 * @param {string} entityId - Entity ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Updated entity
 */
const updateEntity = async (entityId, updateData) => {
  try {
    const entity = await Entity.findByIdAndUpdate(
      entityId,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!entity) {
      logger.warn(`Entity not found for update: ${entityId}`);
      return null;
    }
    
    logger.info(`Entity updated: ${entityId}`, { name: entity.name });
    return entity;
  } catch (error) {
    logger.error('Error updating entity', { error, entityId, updateData });
    throw error;
  }
};

/**
 * Delete an entity
 * @param {string} entityId - Entity ID
 * @returns {Promise<boolean>} True if deleted
 */
const deleteEntity = async (entityId) => {
  try {
    const result = await Entity.findByIdAndDelete(entityId);
    
    if (!result) {
      logger.warn(`Entity not found for deletion: ${entityId}`);
      return false;
    }
    
    logger.info(`Entity deleted: ${entityId}`, { name: result.name });
    return true;
  } catch (error) {
    logger.error('Error deleting entity', { error, entityId });
    throw error;
  }
};

/**
 * List entities for a chatbot
 * @param {string} chatbotId - Chatbot ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} List of entities
 */
const listEntities = async (chatbotId, options = {}) => {
  try {
    const query = { chatbotId };
    
    if (options.type) {
      query.type = options.type;
    }
    
    const entities = await Entity.find(query).sort({ name: 1 });
    
    logger.debug(`Listed ${entities.length} entities for chatbot`, { chatbotId });
    return entities;
  } catch (error) {
    logger.error('Error listing entities', { error, chatbotId });
    throw error;
  }
};

/**
 * Add a value to an entity
 * @param {string} entityId - Entity ID
 * @param {Object} valueData - Value data
 * @returns {Promise<Object>} Updated entity
 */
const addEntityValue = async (entityId, valueData) => {
  try {
    const entity = await Entity.findById(entityId);
    
    if (!entity) {
      logger.warn(`Entity not found for adding value: ${entityId}`);
      return null;
    }
    
    // Check for duplicate values
    const existingValue = entity.values.find(v => v.value === valueData.value);
    if (existingValue) {
      logger.warn(`Value already exists in entity: ${valueData.value}`, { entityId });
      return entity;
    }
    
    entity.values.push(valueData);
    await entity.save();
    
    logger.info(`Value added to entity: ${entityId}`, { value: valueData.value });
    return entity;
  } catch (error) {
    logger.error('Error adding entity value', { error, entityId, valueData });
    throw error;
  }
};

/**
 * Remove a value from an entity
 * @param {string} entityId - Entity ID
 * @param {string} valueId - Value ID
 * @returns {Promise<Object>} Updated entity
 */
const removeEntityValue = async (entityId, valueId) => {
  try {
    const entity = await Entity.findById(entityId);
    
    if (!entity) {
      logger.warn(`Entity not found for removing value: ${entityId}`);
      return null;
    }
    
    entity.values = entity.values.filter(v => v._id.toString() !== valueId);
    await entity.save();
    
    logger.info(`Value removed from entity: ${entityId}`, { valueId });
    return entity;
  } catch (error) {
    logger.error('Error removing entity value', { error, entityId, valueId });
    throw error;
  }
};

/**
 * Recognize entities in text
 * @param {string} text - Text to analyze
 * @param {string} chatbotId - Chatbot ID
 * @returns {Promise<Array>} Recognized entities
 */
const recognizeEntities = async (text, chatbotId) => {
  try {
    const entities = await Entity.find({ chatbotId });
    const recognizedEntities = [];
    
    for (const entity of entities) {
      for (const value of entity.values) {
        // Simple exact match for now
        if (text.toLowerCase().includes(value.value.toLowerCase())) {
          recognizedEntities.push({
            entity: entity.name,
            value: value.value,
            synonyms: value.synonyms,
            type: entity.type,
            confidence: 1.0
          });
        }
        
        // Check synonyms
        for (const synonym of value.synonyms || []) {
          if (text.toLowerCase().includes(synonym.toLowerCase())) {
            recognizedEntities.push({
              entity: entity.name,
              value: value.value,
              matchedSynonym: synonym,
              type: entity.type,
              confidence: 0.9
            });
          }
        }
      }
    }
    
    logger.debug(`Recognized ${recognizedEntities.length} entities in text`, { chatbotId });
    return recognizedEntities;
  } catch (error) {
    logger.error('Error recognizing entities', { error, chatbotId });
    throw error;
  }
};

module.exports = {
  createEntity,
  getEntityById,
  getEntityByName,
  updateEntity,
  deleteEntity,
  listEntities,
  addEntityValue,
  removeEntityValue,
  recognizeEntities
};
