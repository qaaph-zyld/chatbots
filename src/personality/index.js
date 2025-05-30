/**
 * Personality Module Index
 * 
 * Exports the personality service, schema, and message processor
 * for chatbot personality customization
 */

const personalityService = require('./personality.service');
const personalityMessageProcessor = require('./message-processor');
const { Personality, PersonalitySchema } = require('./personality.schema');

module.exports = {
  personalityService,
  personalityMessageProcessor,
  Personality,
  PersonalitySchema
};
