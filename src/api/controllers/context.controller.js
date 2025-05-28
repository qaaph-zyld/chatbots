/**
 * Context Controller
 * 
 * API endpoints for context awareness features
 */

const contextService = require('../../context/context.service');
const topicService = require('../../context/topic.service');
const entityService = require('../../context/entity.service');
const referenceService = require('../../context/reference.service');
const { logger } = require('../../utils');

/**
 * Get context for a conversation
 */
exports.getContext = async (req, res, next) => {
  try {
    const { chatbotId, userId, conversationId } = req.params;
    
    const context = await contextService.getContext(chatbotId, userId, conversationId);
    
    res.status(200).json({
      success: true,
      data: context
    });
  } catch (error) {
    logger.error('Error in getContext:', error.message);
    next(error);
  }
};

/**
 * Update context for a conversation
 */
exports.updateContext = async (req, res, next) => {
  try {
    const { chatbotId, userId, conversationId } = req.params;
    const contextData = req.body;
    
    const updatedContext = await contextService.updateContext(
      chatbotId,
      userId,
      conversationId,
      contextData
    );
    
    res.status(200).json({
      success: true,
      data: updatedContext
    });
  } catch (error) {
    logger.error('Error in updateContext:', error.message);
    next(error);
  }
};

/**
 * Get conversation summary
 */
exports.getConversationSummary = async (req, res, next) => {
  try {
    const { chatbotId, userId, conversationId } = req.params;
    
    const summary = await contextService.getConversationSummary(
      chatbotId,
      userId,
      conversationId
    );
    
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('Error in getConversationSummary:', error.message);
    next(error);
  }
};

/**
 * Get active topics for a conversation
 */
exports.getActiveTopics = async (req, res, next) => {
  try {
    const { chatbotId, userId, conversationId } = req.params;
    
    const topics = await contextService.getActiveTopics(
      chatbotId,
      userId,
      conversationId
    );
    
    res.status(200).json({
      success: true,
      data: topics
    });
  } catch (error) {
    logger.error('Error in getActiveTopics:', error.message);
    next(error);
  }
};

/**
 * Get entities from context
 */
exports.getEntities = async (req, res, next) => {
  try {
    const { chatbotId, userId, conversationId } = req.params;
    const options = req.query;
    
    const entities = await contextService.getEntities(
      chatbotId,
      userId,
      conversationId,
      options
    );
    
    res.status(200).json({
      success: true,
      data: entities
    });
  } catch (error) {
    logger.error('Error in getEntities:', error.message);
    next(error);
  }
};

/**
 * Get user preferences
 */
exports.getUserPreferences = async (req, res, next) => {
  try {
    const { chatbotId, userId } = req.params;
    
    const preferences = await contextService.getUserPreferences(
      chatbotId,
      userId
    );
    
    res.status(200).json({
      success: true,
      data: preferences
    });
  } catch (error) {
    logger.error('Error in getUserPreferences:', error.message);
    next(error);
  }
};

/**
 * Add user preference
 */
exports.addUserPreference = async (req, res, next) => {
  try {
    const { chatbotId, userId, conversationId } = req.params;
    const { key, value, confidence } = req.body;
    
    const updatedContext = await contextService.addUserPreference(
      chatbotId,
      userId,
      conversationId,
      key,
      value,
      confidence
    );
    
    res.status(200).json({
      success: true,
      data: updatedContext
    });
  } catch (error) {
    logger.error('Error in addUserPreference:', error.message);
    next(error);
  }
};

/**
 * Create topic
 */
exports.createTopic = async (req, res, next) => {
  try {
    const topicData = req.body;
    
    const topic = await topicService.createTopic(topicData);
    
    res.status(201).json({
      success: true,
      data: topic
    });
  } catch (error) {
    logger.error('Error in createTopic:', error.message);
    next(error);
  }
};

/**
 * Get topic by name
 */
exports.getTopicByName = async (req, res, next) => {
  try {
    const { chatbotId, name } = req.params;
    
    const topic = await topicService.getTopicByName(chatbotId, name);
    
    if (!topic) {
      return res.status(404).json({
        success: false,
        error: `Topic '${name}' not found`
      });
    }
    
    res.status(200).json({
      success: true,
      data: topic
    });
  } catch (error) {
    logger.error('Error in getTopicByName:', error.message);
    next(error);
  }
};

/**
 * Get all topics for a chatbot
 */
exports.getAllTopics = async (req, res, next) => {
  try {
    const { chatbotId } = req.params;
    
    const topics = await topicService.getAllTopics(chatbotId);
    
    res.status(200).json({
      success: true,
      data: topics
    });
  } catch (error) {
    logger.error('Error in getAllTopics:', error.message);
    next(error);
  }
};

/**
 * Update topic
 */
exports.updateTopic = async (req, res, next) => {
  try {
    const { chatbotId, name } = req.params;
    const updateData = req.body;
    
    const topic = await topicService.updateTopic(chatbotId, name, updateData);
    
    res.status(200).json({
      success: true,
      data: topic
    });
  } catch (error) {
    logger.error('Error in updateTopic:', error.message);
    next(error);
  }
};

/**
 * Delete topic
 */
exports.deleteTopic = async (req, res, next) => {
  try {
    const { chatbotId, name } = req.params;
    
    const result = await topicService.deleteTopic(chatbotId, name);
    
    res.status(200).json({
      success: true,
      data: { deleted: result }
    });
  } catch (error) {
    logger.error('Error in deleteTopic:', error.message);
    next(error);
  }
};

/**
 * Get topic hierarchy
 */
exports.getTopicHierarchy = async (req, res, next) => {
  try {
    const { chatbotId } = req.params;
    
    const hierarchy = await topicService.getTopicHierarchy(chatbotId);
    
    res.status(200).json({
      success: true,
      data: hierarchy
    });
  } catch (error) {
    logger.error('Error in getTopicHierarchy:', error.message);
    next(error);
  }
};

/**
 * Get related topics
 */
exports.getRelatedTopics = async (req, res, next) => {
  try {
    const { chatbotId, topicName } = req.params;
    
    const relatedTopics = await topicService.getRelatedTopics(chatbotId, topicName);
    
    res.status(200).json({
      success: true,
      data: relatedTopics
    });
  } catch (error) {
    logger.error('Error in getRelatedTopics:', error.message);
    next(error);
  }
};

/**
 * Process entities
 */
exports.processEntities = async (req, res, next) => {
  try {
    const { chatbotId, userId, conversationId } = req.params;
    const { messageId, entities } = req.body;
    
    const processedEntities = await entityService.processEntities(
      chatbotId,
      userId,
      conversationId,
      messageId,
      entities
    );
    
    res.status(200).json({
      success: true,
      data: processedEntities
    });
  } catch (error) {
    logger.error('Error in processEntities:', error.message);
    next(error);
  }
};

/**
 * Get user entities
 */
exports.getUserEntities = async (req, res, next) => {
  try {
    const { chatbotId, userId } = req.params;
    const options = req.query;
    
    const entities = await entityService.getUserEntities(
      chatbotId,
      userId,
      options
    );
    
    res.status(200).json({
      success: true,
      data: entities
    });
  } catch (error) {
    logger.error('Error in getUserEntities:', error.message);
    next(error);
  }
};

/**
 * Get entity by ID
 */
exports.getEntityById = async (req, res, next) => {
  try {
    const { chatbotId, userId, entityId } = req.params;
    
    const entity = await entityService.getEntityById(
      chatbotId,
      userId,
      entityId
    );
    
    if (!entity) {
      return res.status(404).json({
        success: false,
        error: `Entity '${entityId}' not found`
      });
    }
    
    res.status(200).json({
      success: true,
      data: entity
    });
  } catch (error) {
    logger.error('Error in getEntityById:', error.message);
    next(error);
  }
};

/**
 * Add entity relation
 */
exports.addEntityRelation = async (req, res, next) => {
  try {
    const { chatbotId, userId } = req.params;
    const { sourceEntityId, targetEntityId, relationType, confidence } = req.body;
    
    const result = await entityService.addEntityRelation(
      chatbotId,
      userId,
      sourceEntityId,
      targetEntityId,
      relationType,
      confidence
    );
    
    res.status(200).json({
      success: true,
      data: { added: result }
    });
  } catch (error) {
    logger.error('Error in addEntityRelation:', error.message);
    next(error);
  }
};

/**
 * Merge entities
 */
exports.mergeEntities = async (req, res, next) => {
  try {
    const { chatbotId, userId } = req.params;
    const { primaryEntityId, duplicateEntityId } = req.body;
    
    const mergedEntity = await entityService.mergeEntities(
      chatbotId,
      userId,
      primaryEntityId,
      duplicateEntityId
    );
    
    res.status(200).json({
      success: true,
      data: mergedEntity
    });
  } catch (error) {
    logger.error('Error in mergeEntities:', error.message);
    next(error);
  }
};

/**
 * Find potential duplicate entities
 */
exports.findPotentialDuplicates = async (req, res, next) => {
  try {
    const { chatbotId, userId } = req.params;
    
    const duplicates = await entityService.findPotentialDuplicates(
      chatbotId,
      userId
    );
    
    res.status(200).json({
      success: true,
      data: duplicates
    });
  } catch (error) {
    logger.error('Error in findPotentialDuplicates:', error.message);
    next(error);
  }
};

/**
 * Resolve references in text
 */
exports.resolveReferences = async (req, res, next) => {
  try {
    const { chatbotId, userId, conversationId } = req.params;
    const { text } = req.body;
    
    const resolved = await referenceService.resolveReferences(
      chatbotId,
      userId,
      conversationId,
      text
    );
    
    res.status(200).json({
      success: true,
      data: resolved
    });
  } catch (error) {
    logger.error('Error in resolveReferences:', error.message);
    next(error);
  }
};

/**
 * Apply resolved references to a message
 */
exports.applyResolvedReferences = async (req, res, next) => {
  try {
    const { chatbotId, userId, conversationId } = req.params;
    const message = req.body;
    
    const resolvedMessage = await referenceService.applyResolvedReferences(
      chatbotId,
      userId,
      conversationId,
      message
    );
    
    res.status(200).json({
      success: true,
      data: resolvedMessage
    });
  } catch (error) {
    logger.error('Error in applyResolvedReferences:', error.message);
    next(error);
  }
};
