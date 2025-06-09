/**
 * API Models Index
 * 
 * Centralizes and exports all API models
 */

require('@src/database\schemas\chatbot.schema');
require('@src/database\schemas\template.schema');
require('@src/database\schemas\conversation.schema');
require('@src/database\schemas\integration.schema');

module.exports = {
  Chatbot: chatbotSchema,
  Template: templateSchema,
  Conversation: conversationSchema,
  Integration: integrationSchema
};
