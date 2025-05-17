/**
 * API Models Index
 * 
 * Centralizes and exports all API models
 */

const chatbotSchema = require('../../database/schemas/chatbot.schema');
const templateSchema = require('../../database/schemas/template.schema');
const conversationSchema = require('../../database/schemas/conversation.schema');
const integrationSchema = require('../../database/schemas/integration.schema');

module.exports = {
  Chatbot: chatbotSchema,
  Template: templateSchema,
  Conversation: conversationSchema,
  Integration: integrationSchema
};
