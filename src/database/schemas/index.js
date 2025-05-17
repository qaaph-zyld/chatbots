/**
 * Database Schemas
 * 
 * Export all database schemas
 */

const Chatbot = require('./chatbot.schema');
const Template = require('./template.schema');
const Conversation = require('./conversation.schema');
const Integration = require('./integration.schema');

module.exports = {
  Chatbot,
  Template,
  Conversation,
  Integration
};
