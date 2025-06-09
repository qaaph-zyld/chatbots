/**
 * Advanced Context Controller
 * 
 * Handles API requests for advanced context awareness features including
 * entity tracking, topic detection, and preference learning.
 */

require('@src/services\advanced-context.service');
require('@src/services\entity-tracking.service');
require('@src/services\topic-detection.service');
require('@src/services\preference-learning.service');
require('@src/utils');

/**
 * Process a message to extract context
 */
const processMessage = async (req, res) => {
  try {
    const { chatbotId, userId, conversationId } = req.params;
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const context = await advancedContextService.processMessage(
      message, 
      userId, 
      chatbotId, 
      conversationId
    );
    
    return res.status(200).json({ success: true, context });
  } catch (error) {
    logger.error('Error processing message for context:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Get conversation context
 */
const getConversationContext = async (req, res) => {
  try {
    const { chatbotId, userId, conversationId } = req.params;
    
    const context = await advancedContextService.getConversationContext(
      conversationId, 
      userId, 
      chatbotId
    );
    
    return res.status(200).json({ success: true, context });
  } catch (error) {
    logger.error('Error getting conversation context:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Get cross-conversation context
 */
const getCrossConversationContext = async (req, res) => {
  try {
    const { chatbotId, userId } = req.params;
    
    const context = await advancedContextService.getCrossConversationContext(
      userId, 
      chatbotId
    );
    
    return res.status(200).json({ success: true, context });
  } catch (error) {
    logger.error('Error getting cross-conversation context:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Apply context to responses
 */
const applyContextToResponses = async (req, res) => {
  try {
    const { chatbotId, userId, conversationId } = req.params;
    const { responseOptions } = req.body;
    
    if (!responseOptions || !Array.isArray(responseOptions)) {
      return res.status(400).json({ error: 'Response options array is required' });
    }
    
    const personalizedResponse = await advancedContextService.applyContextToResponses(
      responseOptions, 
      userId, 
      chatbotId, 
      conversationId
    );
    
    return res.status(200).json({ success: true, ...personalizedResponse });
  } catch (error) {
    logger.error('Error applying context to responses:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Reset user context
 */
const resetUserContext = async (req, res) => {
  try {
    const { chatbotId, userId } = req.params;
    
    const result = await advancedContextService.resetUserContext(
      userId, 
      chatbotId
    );
    
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    logger.error('Error resetting user context:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Entity Tracking Endpoints

/**
 * Track entity
 */
const trackEntity = async (req, res) => {
  try {
    const { chatbotId, userId, conversationId } = req.params;
    const entityData = req.body;
    
    const entity = await entityTrackingService.trackEntity(
      entityData, 
      userId, 
      chatbotId, 
      conversationId
    );
    
    return res.status(200).json({ success: true, entity });
  } catch (error) {
    logger.error('Error tracking entity:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Create entity relation
 */
const createEntityRelation = async (req, res) => {
  try {
    const { chatbotId, userId } = req.params;
    const relationData = req.body;
    
    const relation = await entityTrackingService.createEntityRelation(
      relationData, 
      userId, 
      chatbotId
    );
    
    return res.status(200).json({ success: true, relation });
  } catch (error) {
    logger.error('Error creating entity relation:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Reference entity
 */
const referenceEntity = async (req, res) => {
  try {
    const { chatbotId, userId, conversationId } = req.params;
    const { entityId, context } = req.body;
    
    if (!entityId) {
      return res.status(400).json({ error: 'Entity ID is required' });
    }
    
    const reference = await entityTrackingService.referenceEntity(
      entityId, 
      conversationId, 
      userId, 
      chatbotId, 
      context
    );
    
    return res.status(200).json({ success: true, reference });
  } catch (error) {
    logger.error('Error referencing entity:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Get user entities
 */
const getUserEntities = async (req, res) => {
  try {
    const { chatbotId, userId } = req.params;
    const filters = req.query;
    
    const entities = await entityTrackingService.getUserEntities(
      userId, 
      chatbotId, 
      filters
    );
    
    return res.status(200).json({ success: true, entities });
  } catch (error) {
    logger.error('Error getting user entities:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Get conversation entities
 */
const getConversationEntities = async (req, res) => {
  try {
    const { chatbotId, userId, conversationId } = req.params;
    
    const entities = await entityTrackingService.getConversationEntities(
      conversationId, 
      userId, 
      chatbotId
    );
    
    return res.status(200).json({ success: true, entities });
  } catch (error) {
    logger.error('Error getting conversation entities:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Get entity relations
 */
const getEntityRelations = async (req, res) => {
  try {
    const { chatbotId, userId, entityId } = req.params;
    
    const relations = await entityTrackingService.getEntityRelations(
      entityId, 
      userId, 
      chatbotId
    );
    
    return res.status(200).json({ success: true, relations });
  } catch (error) {
    logger.error('Error getting entity relations:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Delete entity
 */
const deleteEntity = async (req, res) => {
  try {
    const { chatbotId, userId, entityId } = req.params;
    
    const result = await entityTrackingService.deleteEntity(
      entityId, 
      userId, 
      chatbotId
    );
    
    return res.status(200).json({ success: result });
  } catch (error) {
    logger.error('Error deleting entity:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Topic Detection Endpoints

/**
 * Detect topics
 */
const detectTopics = async (req, res) => {
  try {
    const { chatbotId, userId, conversationId } = req.params;
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const topics = await topicDetectionService.detectTopics(
      message, 
      userId, 
      chatbotId, 
      conversationId
    );
    
    return res.status(200).json({ success: true, topics });
  } catch (error) {
    logger.error('Error detecting topics:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Get conversation topics
 */
const getConversationTopics = async (req, res) => {
  try {
    const { chatbotId, userId, conversationId } = req.params;
    
    const topics = await topicDetectionService.getConversationTopics(
      conversationId, 
      userId, 
      chatbotId
    );
    
    return res.status(200).json({ success: true, topics });
  } catch (error) {
    logger.error('Error getting conversation topics:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Get user topic history
 */
const getUserTopicHistory = async (req, res) => {
  try {
    const { chatbotId, userId } = req.params;
    
    const topicHistory = await topicDetectionService.getUserTopicHistory(
      userId, 
      chatbotId
    );
    
    return res.status(200).json({ success: true, topicHistory });
  } catch (error) {
    logger.error('Error getting user topic history:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Get topics in time period
 */
const getTopicsInTimePeriod = async (req, res) => {
  try {
    const { chatbotId, userId } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }
    
    const topics = await topicDetectionService.getTopicsInTimePeriod(
      userId, 
      chatbotId, 
      new Date(startDate), 
      new Date(endDate)
    );
    
    return res.status(200).json({ success: true, topics });
  } catch (error) {
    logger.error('Error getting topics in time period:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Delete topic
 */
const deleteTopic = async (req, res) => {
  try {
    const { chatbotId, userId, topicId } = req.params;
    
    const result = await topicDetectionService.deleteTopic(
      topicId, 
      userId, 
      chatbotId
    );
    
    return res.status(200).json({ success: result });
  } catch (error) {
    logger.error('Error deleting topic:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Preference Learning Endpoints

/**
 * Set preference
 */
const setPreference = async (req, res) => {
  try {
    const { chatbotId, userId } = req.params;
    const preferenceData = req.body;
    
    const preference = await preferenceLearningService.setPreference(
      preferenceData, 
      userId, 
      chatbotId
    );
    
    return res.status(200).json({ success: true, preference });
  } catch (error) {
    logger.error('Error setting preference:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Infer preferences from message
 */
const inferPreferences = async (req, res) => {
  try {
    const { chatbotId, userId, conversationId } = req.params;
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const preferences = await preferenceLearningService.inferPreferencesFromMessage(
      message, 
      userId, 
      chatbotId, 
      conversationId
    );
    
    return res.status(200).json({ success: true, preferences });
  } catch (error) {
    logger.error('Error inferring preferences:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Get user preferences
 */
const getUserPreferences = async (req, res) => {
  try {
    const { chatbotId, userId } = req.params;
    const filters = req.query;
    
    const preferences = await preferenceLearningService.getUserPreferences(
      userId, 
      chatbotId, 
      filters
    );
    
    return res.status(200).json({ success: true, preferences });
  } catch (error) {
    logger.error('Error getting user preferences:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Apply preferences to responses
 */
const applyPreferencesToResponses = async (req, res) => {
  try {
    const { chatbotId, userId } = req.params;
    const { responseOptions } = req.body;
    
    if (!responseOptions || !Array.isArray(responseOptions)) {
      return res.status(400).json({ error: 'Response options array is required' });
    }
    
    const result = await preferenceLearningService.applyPreferencesToResponses(
      responseOptions, 
      userId, 
      chatbotId
    );
    
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    logger.error('Error applying preferences to responses:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Delete preference
 */
const deletePreference = async (req, res) => {
  try {
    const { chatbotId, userId, preferenceId } = req.params;
    
    const result = await preferenceLearningService.deletePreference(
      preferenceId, 
      userId, 
      chatbotId
    );
    
    return res.status(200).json({ success: result });
  } catch (error) {
    logger.error('Error deleting preference:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Reset user preferences
 */
const resetUserPreferences = async (req, res) => {
  try {
    const { chatbotId, userId } = req.params;
    const { source } = req.query;
    
    const count = await preferenceLearningService.resetUserPreferences(
      userId, 
      chatbotId, 
      source
    );
    
    return res.status(200).json({ success: true, preferencesDeleted: count });
  } catch (error) {
    logger.error('Error resetting user preferences:', error);
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  // Advanced Context
  processMessage,
  getConversationContext,
  getCrossConversationContext,
  applyContextToResponses,
  resetUserContext,
  
  // Entity Tracking
  trackEntity,
  createEntityRelation,
  referenceEntity,
  getUserEntities,
  getConversationEntities,
  getEntityRelations,
  deleteEntity,
  
  // Topic Detection
  detectTopics,
  getConversationTopics,
  getUserTopicHistory,
  getTopicsInTimePeriod,
  deleteTopic,
  
  // Preference Learning
  setPreference,
  inferPreferences,
  getUserPreferences,
  applyPreferencesToResponses,
  deletePreference,
  resetUserPreferences
};
