/**
 * Advanced Context Routes
 * 
 * API routes for advanced context awareness features including
 * entity tracking, topic detection, and preference learning.
 */

const express = require('express');
const router = express.Router();
require('@src/api\controllers\advanced-context.controller');
require('@src/api\middleware\auth');
require('@src/api\middleware\validate');
const Joi = require('joi');

// Validation schemas
const messageSchema = Joi.object({
  message: Joi.string().required()
});

const entitySchema = Joi.object({
  type: Joi.string().required(),
  name: Joi.string().required(),
  aliases: Joi.array().items(Joi.string()),
  confidence: Joi.number().min(0).max(1),
  metadata: Joi.object(),
  context: Joi.string()
});

const relationSchema = Joi.object({
  sourceEntityId: Joi.string().required(),
  targetEntityId: Joi.string().required(),
  relationType: Joi.string().required(),
  confidence: Joi.number().min(0).max(1),
  metadata: Joi.object()
});

const referenceSchema = Joi.object({
  entityId: Joi.string().required(),
  context: Joi.string()
});

const preferenceSchema = Joi.object({
  category: Joi.string().required(),
  key: Joi.string().required(),
  value: Joi.alternatives().try(
    Joi.string(),
    Joi.number(),
    Joi.boolean(),
    Joi.array()
  ).required(),
  source: Joi.string().valid('explicit', 'inferred'),
  confidence: Joi.number().min(0).max(1),
  metadata: Joi.object()
});

const responseOptionsSchema = Joi.object({
  responseOptions: Joi.array().items(Joi.object({
    text: Joi.string().required(),
    metadata: Joi.object()
  })).required()
});

// Advanced Context Routes

/**
 * @route POST /api/chatbots/:chatbotId/users/:userId/conversations/:conversationId/process-message
 * @desc Process a message to extract context
 * @access Private
 */
router.post(
  '/chatbots/:chatbotId/users/:userId/conversations/:conversationId/process-message',
  authenticate,
  authorize('chatbot:update'),
  validate(messageSchema),
  advancedContextController.processMessage
);

/**
 * @route GET /api/chatbots/:chatbotId/users/:userId/conversations/:conversationId/context
 * @desc Get conversation context
 * @access Private
 */
router.get(
  '/chatbots/:chatbotId/users/:userId/conversations/:conversationId/context',
  authenticate,
  authorize('chatbot:read'),
  advancedContextController.getConversationContext
);

/**
 * @route GET /api/chatbots/:chatbotId/users/:userId/cross-conversation-context
 * @desc Get cross-conversation context
 * @access Private
 */
router.get(
  '/chatbots/:chatbotId/users/:userId/cross-conversation-context',
  authenticate,
  authorize('chatbot:read'),
  advancedContextController.getCrossConversationContext
);

/**
 * @route POST /api/chatbots/:chatbotId/users/:userId/conversations/:conversationId/apply-context
 * @desc Apply context to responses
 * @access Private
 */
router.post(
  '/chatbots/:chatbotId/users/:userId/conversations/:conversationId/apply-context',
  authenticate,
  authorize('chatbot:update'),
  validate(responseOptionsSchema),
  advancedContextController.applyContextToResponses
);

/**
 * @route DELETE /api/chatbots/:chatbotId/users/:userId/context
 * @desc Reset user context
 * @access Private
 */
router.delete(
  '/chatbots/:chatbotId/users/:userId/context',
  authenticate,
  authorize('chatbot:delete'),
  advancedContextController.resetUserContext
);

// Entity Tracking Routes

/**
 * @route POST /api/chatbots/:chatbotId/users/:userId/conversations/:conversationId/track-entity
 * @desc Track an entity
 * @access Private
 */
router.post(
  '/chatbots/:chatbotId/users/:userId/conversations/:conversationId/track-entity',
  authenticate,
  authorize('chatbot:update'),
  validate(entitySchema),
  advancedContextController.trackEntity
);

/**
 * @route POST /api/chatbots/:chatbotId/users/:userId/cross-conversation-entity-relations
 * @desc Create an entity relation
 * @access Private
 */
router.post(
  '/chatbots/:chatbotId/users/:userId/cross-conversation-entity-relations',
  authenticate,
  authorize('chatbot:update'),
  validate(relationSchema),
  advancedContextController.createEntityRelation
);

/**
 * @route POST /api/chatbots/:chatbotId/users/:userId/conversations/:conversationId/reference-entity
 * @desc Reference an entity in a conversation
 * @access Private
 */
router.post(
  '/chatbots/:chatbotId/users/:userId/conversations/:conversationId/reference-entity',
  authenticate,
  authorize('chatbot:update'),
  validate(referenceSchema),
  advancedContextController.referenceEntity
);

/**
 * @route GET /api/chatbots/:chatbotId/users/:userId/cross-conversation-entities
 * @desc Get all entities for a user
 * @access Private
 */
router.get(
  '/chatbots/:chatbotId/users/:userId/cross-conversation-entities',
  authenticate,
  authorize('chatbot:read'),
  advancedContextController.getUserEntities
);

/**
 * @route GET /api/chatbots/:chatbotId/users/:userId/conversations/:conversationId/entities
 * @desc Get entities for a conversation
 * @access Private
 */
router.get(
  '/chatbots/:chatbotId/users/:userId/conversations/:conversationId/entities',
  authenticate,
  authorize('chatbot:read'),
  advancedContextController.getConversationEntities
);

/**
 * @route GET /api/chatbots/:chatbotId/users/:userId/entities/:entityId/relations
 * @desc Get relations for an entity
 * @access Private
 */
router.get(
  '/chatbots/:chatbotId/users/:userId/entities/:entityId/relations',
  authenticate,
  authorize('chatbot:read'),
  advancedContextController.getEntityRelations
);

/**
 * @route DELETE /api/chatbots/:chatbotId/users/:userId/entities/:entityId
 * @desc Delete an entity
 * @access Private
 */
router.delete(
  '/chatbots/:chatbotId/users/:userId/entities/:entityId',
  authenticate,
  authorize('chatbot:delete'),
  advancedContextController.deleteEntity
);

// Topic Detection Routes

/**
 * @route POST /api/chatbots/:chatbotId/users/:userId/conversations/:conversationId/detect-topics
 * @desc Detect topics in a message
 * @access Private
 */
router.post(
  '/chatbots/:chatbotId/users/:userId/conversations/:conversationId/detect-topics',
  authenticate,
  authorize('chatbot:update'),
  validate(messageSchema),
  advancedContextController.detectTopics
);

/**
 * @route GET /api/chatbots/:chatbotId/users/:userId/conversations/:conversationId/topics
 * @desc Get topics for a conversation
 * @access Private
 */
router.get(
  '/chatbots/:chatbotId/users/:userId/conversations/:conversationId/topics',
  authenticate,
  authorize('chatbot:read'),
  advancedContextController.getConversationTopics
);

/**
 * @route GET /api/chatbots/:chatbotId/users/:userId/topic-history
 * @desc Get topic history for a user
 * @access Private
 */
router.get(
  '/chatbots/:chatbotId/users/:userId/topic-history',
  authenticate,
  authorize('chatbot:read'),
  advancedContextController.getUserTopicHistory
);

/**
 * @route GET /api/chatbots/:chatbotId/users/:userId/topics-in-time-period
 * @desc Get topics for a specific time period
 * @access Private
 */
router.get(
  '/chatbots/:chatbotId/users/:userId/topics-in-time-period',
  authenticate,
  authorize('chatbot:read'),
  advancedContextController.getTopicsInTimePeriod
);

/**
 * @route DELETE /api/chatbots/:chatbotId/users/:userId/topics/:topicId
 * @desc Delete a topic
 * @access Private
 */
router.delete(
  '/chatbots/:chatbotId/users/:userId/topics/:topicId',
  authenticate,
  authorize('chatbot:delete'),
  advancedContextController.deleteTopic
);

// Preference Learning Routes

/**
 * @route POST /api/chatbots/:chatbotId/users/:userId/preferences
 * @desc Set a preference
 * @access Private
 */
router.post(
  '/chatbots/:chatbotId/users/:userId/preferences',
  authenticate,
  authorize('chatbot:update'),
  validate(preferenceSchema),
  advancedContextController.setPreference
);

/**
 * @route POST /api/chatbots/:chatbotId/users/:userId/conversations/:conversationId/infer-preferences
 * @desc Infer preferences from a message
 * @access Private
 */
router.post(
  '/chatbots/:chatbotId/users/:userId/conversations/:conversationId/infer-preferences',
  authenticate,
  authorize('chatbot:update'),
  validate(messageSchema),
  advancedContextController.inferPreferences
);

/**
 * @route GET /api/chatbots/:chatbotId/users/:userId/preferences
 * @desc Get preferences for a user
 * @access Private
 */
router.get(
  '/chatbots/:chatbotId/users/:userId/preferences',
  authenticate,
  authorize('chatbot:read'),
  advancedContextController.getUserPreferences
);

/**
 * @route POST /api/chatbots/:chatbotId/users/:userId/apply-preferences
 * @desc Apply preferences to response options
 * @access Private
 */
router.post(
  '/chatbots/:chatbotId/users/:userId/apply-preferences',
  authenticate,
  authorize('chatbot:update'),
  validate(responseOptionsSchema),
  advancedContextController.applyPreferencesToResponses
);

/**
 * @route DELETE /api/chatbots/:chatbotId/users/:userId/preferences/:preferenceId
 * @desc Delete a preference
 * @access Private
 */
router.delete(
  '/chatbots/:chatbotId/users/:userId/preferences/:preferenceId',
  authenticate,
  authorize('chatbot:delete'),
  advancedContextController.deletePreference
);

/**
 * @route DELETE /api/chatbots/:chatbotId/users/:userId/preferences
 * @desc Reset preferences for a user
 * @access Private
 */
router.delete(
  '/chatbots/:chatbotId/users/:userId/preferences',
  authenticate,
  authorize('chatbot:delete'),
  advancedContextController.resetUserPreferences
);

module.exports = router;
