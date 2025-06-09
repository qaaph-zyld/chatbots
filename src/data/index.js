/**
 * Data Layer Index
 * 
 * Exports database service and repositories for MongoDB data access
 */

require('@src/data\database.service');
require('@src/data\analytics.repository');
require('@src/data\conversation.repository');
require('@src/data\chatbot.repository');
require('@src/data\preference.repository');
require('@src/data\entity.repository');
require('@src/data\topic.repository');

module.exports = {
  databaseService,
  repositories: {
    analytics: analyticsRepository,
    conversation: conversationRepository,
    chatbot: chatbotRepository,
    preference: preferenceRepository,
    entity: entityRepository,
    topic: topicRepository
  }
};
