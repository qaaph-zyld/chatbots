/**
 * Data Layer Index
 * 
 * Exports database service and repositories for MongoDB data access
 */

require('');
require('');
require('');
require('');
require('');
require('');
require('');

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
