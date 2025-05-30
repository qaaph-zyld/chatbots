/**
 * Context Module Index
 * 
 * Exports all context awareness services including advanced context management,
 * entity tracking across conversations, user preference learning, and topic detection.
 */

const contextService = require('./context.service');
const topicService = require('./topic.service');
const entityService = require('./entity.service');
const referenceService = require('./reference.service');
const advancedContextService = require('./advanced-context.service');
const preferenceLearningService = require('./preference-learning.service');
const topicDetectionService = require('./topic-detection.service');
const entityTrackingService = require('./entity-tracking.service');

module.exports = {
  contextService,
  topicService,
  entityService,
  referenceService,
  advancedContextService,
  preferenceLearningService,
  topicDetectionService,
  entityTrackingService
};
