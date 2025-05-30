/**
 * Context Controller
 * 
 * API endpoints for context awareness features including advanced context management,
 * entity tracking across conversations, user preference learning, and topic detection.
 */

const {
  contextService,
  topicService,
  entityService,
  referenceService,
  advancedContextService,
  preferenceLearningService,
  topicDetectionService
} = require('../../context');
const { logger } = require('../../utils');
const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');

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
    const { text, references } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }
    
    const result = await referenceService.applyResolvedReferences(
      chatbotId,
      userId,
      conversationId,
      text,
      references
    );
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error in applyResolvedReferences:', error.message);
    next(error);
  }
};

/**
 * Track entity across conversations
 */
exports.trackEntity = async (req, res, next) => {
  try {
    const { chatbotId, userId, conversationId } = req.params;
    const entityData = req.body;
    
    if (!entityData || !entityData.type || !entityData.name) {
      return res.status(400).json({
        success: false,
        error: 'Entity type and name are required'
      });
    }
    
    const entity = await entityTrackingService.trackEntity(
      chatbotId,
      userId,
      conversationId,
      entityData
    );
    
    res.status(200).json({
      success: true,
      data: entity
    });
  } catch (error) {
    logger.error('Error in trackEntity:', error.message);
    next(error);
  }
};

/**
 * Get cross-conversation entities for a user
 */
exports.getCrossConversationEntities = async (req, res, next) => {
  try {
    const { chatbotId, userId } = req.params;
    const filters = req.query;
    
    const entities = await entityTrackingService.getUserEntities(
      chatbotId,
      userId,
      filters
    );
    
    res.status(200).json({
      success: true,
      data: entities
    });
  } catch (error) {
    logger.error('Error in getCrossConversationEntities:', error.message);
    next(error);
  }
};

/**
 * Get cross-conversation entity by ID
 */
exports.getCrossConversationEntityById = async (req, res, next) => {
  try {
    const { chatbotId, userId, entityId } = req.params;
    
    const entity = await entityTrackingService.getEntityById(
      chatbotId,
      userId,
      entityId
    );
    
    res.status(200).json({
      success: true,
      data: entity
    });
  } catch (error) {
    logger.error('Error in getCrossConversationEntityById:', error.message);
    next(error);
  }
};

/**
 * Add relation between cross-conversation entities
 */
exports.addCrossConversationEntityRelation = async (req, res, next) => {
  try {
    const { chatbotId, userId } = req.params;
    const { sourceEntityId, targetEntityId, relationType, confidence } = req.body;
    
    if (!sourceEntityId || !targetEntityId || !relationType) {
      return res.status(400).json({
        success: false,
        error: 'Source entity ID, target entity ID, and relation type are required'
      });
    }
    
    const entity = await advancedContextService.addEntityRelation(
      chatbotId,
      userId,
      sourceEntityId,
      targetEntityId,
      relationType,
      confidence
    );
    
    res.status(200).json({
      success: true,
      data: entity
    });
  } catch (error) {
    logger.error('Error in addCrossConversationEntityRelation:', error.message);
    next(error);
  }
};

/**
 * Merge cross-conversation entities
 */
exports.mergeCrossConversationEntities = async (req, res, next) => {
  try {
    const { chatbotId, userId } = req.params;
    const { entityIds, primaryEntityId } = req.body;
    
    if (!entityIds || !Array.isArray(entityIds) || entityIds.length < 2 || !primaryEntityId) {
      return res.status(400).json({
        success: false,
        error: 'Entity IDs array with at least 2 entities and primary entity ID are required'
      });
    }
    
    const entity = await advancedContextService.mergeEntities(
      chatbotId,
      userId,
      entityIds,
      primaryEntityId
    );
    
    res.status(200).json({
      success: true,
      data: entity
    });
  } catch (error) {
    logger.error('Error in mergeCrossConversationEntities:', error.message);
    next(error);
  }
};

/**
 * Find potential duplicate cross-conversation entities
 */
exports.findPotentialDuplicateCrossConversationEntities = async (req, res, next) => {
  try {
    const { chatbotId, userId } = req.params;
    const options = req.query;
    
    const duplicates = await advancedContextService.findPotentialDuplicates(
      chatbotId,
      userId,
      options
    );
    
    res.status(200).json({
      success: true,
      data: duplicates
    });
  } catch (error) {
    logger.error('Error in findPotentialDuplicateCrossConversationEntities:', error.message);
    next(error);
  }
};

/**
 * Set user preference
 */
exports.setUserPreference = async (req, res, next) => {
  try {
    const { chatbotId, userId } = req.params;
    const { category, key, value, source, confidence, metadata } = req.body;
    
    if (!category || !key || value === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Category, key, and value are required'
      });
    }
    
    const preference = await preferenceLearningService.setPreference(
      chatbotId,
      userId,
      category,
      key,
      value,
      source,
      confidence,
      metadata
    );
    
    res.status(200).json({
      success: true,
      data: preference
    });
  } catch (error) {
    logger.error('Error in setUserPreference:', error.message);
    next(error);
  }
};

/**
 * Get user preferences
 */
exports.getUserPreferences = async (req, res, next) => {
  try {
    const { chatbotId, userId } = req.params;
    const filters = req.query;
    
    const preferences = await preferenceLearningService.getPreferences(
      chatbotId,
      userId,
      filters
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
 * Delete user preference
 */
exports.deleteUserPreference = async (req, res, next) => {
  try {
    const { chatbotId, userId } = req.params;
    const { category, key } = req.query;
    
    if (!category || !key) {
      return res.status(400).json({
        success: false,
        error: 'Category and key are required'
      });
    }
    
    const result = await preferenceLearningService.deletePreference(
      chatbotId,
      userId,
      category,
      key
    );
    
    res.status(200).json({
      success: true,
      data: { deleted: result }
    });
  } catch (error) {
    logger.error('Error in deleteUserPreference:', error.message);
    next(error);
  }
};

/**
 * Infer preferences from message
 */
exports.inferPreferencesFromMessage = async (req, res, next) => {
  try {
    const { chatbotId, userId, conversationId } = req.params;
    const { message, nlpAnalysis } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }
    
    const preferences = await preferenceLearningService.inferPreferencesFromMessage(
      chatbotId,
      userId,
      conversationId,
      message,
      nlpAnalysis
    );
    
    res.status(200).json({
      success: true,
      data: preferences
    });
  } catch (error) {
    logger.error('Error in inferPreferencesFromMessage:', error.message);
    next(error);
  }
};

/**
 * Apply preferences to response options
 */
exports.applyPreferencesToResponse = async (req, res, next) => {
  try {
    const { chatbotId, userId } = req.params;
    const responseOptions = req.body;
    
    const updatedOptions = await preferenceLearningService.applyPreferencesToResponse(
      chatbotId,
      userId,
      responseOptions
    );
    
    res.status(200).json({
      success: true,
      data: updatedOptions
    });
  } catch (error) {
    logger.error('Error in applyPreferencesToResponse:', error.message);
    next(error);
  }
};

/**
 * Create or update topic
 */
exports.createOrUpdateTopic = async (req, res, next) => {
  try {
    const { chatbotId } = req.params;
    const topicData = req.body;
    
    if (!topicData || !topicData.name) {
      return res.status(400).json({
        success: false,
        error: 'Topic name is required'
      });
    }
    
    const topic = await topicDetectionService.createOrUpdateTopic(
      chatbotId,
      topicData
    );
    
    res.status(200).json({
      success: true,
      data: topic
    });
  } catch (error) {
    logger.error('Error in createOrUpdateTopic:', error.message);
    next(error);
  }
};

/**
 * Detect topics in text
 */
exports.detectTopics = async (req, res, next) => {
  try {
    const { chatbotId } = req.params;
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }
    
    const topics = await topicDetectionService.detectTopics(
      chatbotId,
      text
    );
    
    res.status(200).json({
      success: true,
      data: topics
    });
  } catch (error) {
    logger.error('Error in detectTopics:', error.message);
    next(error);
  }
};

/**
 * Track topics in conversation
 */
exports.trackTopics = async (req, res, next) => {
  try {
    const { chatbotId, userId, conversationId } = req.params;
    const { detectedTopics } = req.body;
    
    if (!detectedTopics || !Array.isArray(detectedTopics)) {
      return res.status(400).json({
        success: false,
        error: 'Detected topics array is required'
      });
    }
    
    const topics = await topicDetectionService.trackTopics(
      chatbotId,
      userId,
      conversationId,
      detectedTopics
    );
    
    res.status(200).json({
      success: true,
      data: topics
    });
  } catch (error) {
    logger.error('Error in trackTopics:', error.message);
    next(error);
  }
};

/**
 * Add related topic
 */
exports.addRelatedTopic = async (req, res, next) => {
  try {
    const { chatbotId } = req.params;
    const { sourceName, targetName, relationStrength } = req.body;
    
    if (!sourceName || !targetName) {
      return res.status(400).json({
        success: false,
        error: 'Source and target topic names are required'
      });
    }
    
    const topic = await topicDetectionService.addRelatedTopic(
      chatbotId,
      sourceName,
      targetName,
      relationStrength
    );
    
    res.status(200).json({
      success: true,
      data: topic
    });
  } catch (error) {
    logger.error('Error in addRelatedTopic:', error.message);
    next(error);
  }
};
