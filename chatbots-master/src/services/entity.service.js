/**
 * Entity Service
 * 
 * Service for managing named entities in the chatbot platform
 * Refactored to use the MongoDB model abstraction layer with repository pattern
 */

require('@src/data');
require('@src/utils');

/**
 * Create a new entity
 * @param {Object} entityData - Entity data
 * @returns {Promise<Object>} Created entity
 */
const createEntity = async (entityData) => {
  try {
    // Ensure database connection
    await databaseService.connect();
    
    // Create entity using repository
    const entity = await repositories.entity.create(entityData);
    
    logger.info(`Entity created: ${entity._id}`, { name: entity.name });
    return entity;
  } catch (error) {
    logger.error('Error creating entity', { error: error.message, entityData });
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
    // Ensure database connection
    await databaseService.connect();
    
    // Get entity by ID using repository
    const entity = await repositories.entity.findById(entityId);
    
    if (!entity) {
      logger.warn(`Entity not found: ${entityId}`);
      return null;
    }
    
    return entity;
  } catch (error) {
    logger.error('Error getting entity by ID', { error: error.message, entityId });
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
    // Ensure database connection
    await databaseService.connect();
    
    // Get entity by name using repository with caching
    const entity = await repositories.entity.findByName(name, chatbotId);
    
    if (!entity) {
      logger.warn(`Entity not found by name: ${name}`, { chatbotId });
      return null;
    }
    
    return entity;
  } catch (error) {
    logger.error('Error getting entity by name', { error: error.message, name, chatbotId });
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
    // Ensure database connection
    await databaseService.connect();
    
    // Update entity using repository
    const entity = await repositories.entity.findByIdAndUpdate(
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
    logger.error('Error updating entity', { error: error.message, entityId });
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
    // Ensure database connection
    await databaseService.connect();
    
    // Delete entity using repository
    const result = await repositories.entity.deleteById(entityId);
    
    if (!result) {
      logger.warn(`Entity not found for deletion: ${entityId}`);
      return false;
    }
    
    logger.info(`Entity deleted: ${entityId}`);
    return true;
  } catch (error) {
    logger.error('Error deleting entity', { error: error.message, entityId });
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
    // Ensure database connection
    await databaseService.connect();
    
    // Prepare query options
    const queryOptions = { sort: { name: 1 } };
    const filter = { chatbotId };
    
    if (options.type) {
      filter.type = options.type;
    }
    
    // Use repository to find entities by chatbot
    const entities = await repositories.entity.findByChatbot(chatbotId, queryOptions);
    
    logger.debug(`Listed ${entities.length} entities for chatbot`, { chatbotId });
    return entities;
  } catch (error) {
    logger.error('Error listing entities', { error: error.message, chatbotId });
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
    // Ensure database connection
    await databaseService.connect();
    
    // Use repository to add value to entity with transaction support
    const entity = await repositories.entity.addValue(entityId, valueData);
    
    if (!entity) {
      logger.warn(`Cannot add value: Entity not found: ${entityId}`);
      return null;
    }
    
    logger.info(`Value added to entity: ${entityId}`, { value: valueData.value });
    return entity;
  } catch (error) {
    logger.error('Error adding value to entity', { error: error.message, entityId });
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
    // Ensure database connection
    await databaseService.connect();
    
    // Use repository to remove value from entity with transaction support
    const entity = await repositories.entity.removeValue(entityId, valueId);
    
    if (!entity) {
      logger.warn(`Entity not found for removing value: ${entityId}`);
      return null;
    }
    
    logger.info(`Value removed from entity: ${entityId}`, { valueId });
    return entity;
  } catch (error) {
    logger.error('Error removing entity value', { error: error.message, entityId, valueId });
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
    // Ensure database connection
    await databaseService.connect();
    
    // Use repository to find matching entities
    const matches = await repositories.entity.findMatchingEntities(text, chatbotId);
    
    // Format the response
    const recognizedEntities = [];
    
    for (const match of matches) {
      const entity = match.entity;
      
      for (const valueMatch of match.matches) {
        recognizedEntities.push({
          entity: entity.name,
          value: valueMatch.value,
          matchedSynonym: valueMatch.synonym !== valueMatch.value ? valueMatch.synonym : undefined,
          type: entity.type,
          confidence: valueMatch.synonym === valueMatch.value ? 1.0 : 0.9
        });
      }
    }
    
    logger.debug(`Recognized ${recognizedEntities.length} entities in text`, { chatbotId });
    return recognizedEntities;
  } catch (error) {
    logger.error('Error recognizing entities', { error: error.message, chatbotId });
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
