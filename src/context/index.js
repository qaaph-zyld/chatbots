/**
 * Context Module Index
 * 
 * Exports all context awareness services including advanced context management,
 * entity tracking across conversations, user preference learning, and topic detection.
 */

require('@src/context\context.service');
require('@src/context\topic.service');
require('@src/context\entity.service');
require('@src/context\reference.service');
require('@src/context\advanced-context.service');
require('@src/context\preference-learning.service');
require('@src/context\topic-detection.service');
require('@src/context\entity-tracking.service');

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
