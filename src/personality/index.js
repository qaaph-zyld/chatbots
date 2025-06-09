/**
 * Personality Module Index
 * 
 * Exports the personality service, schema, and message processor
 * for chatbot personality customization
 */

require('@src/personality\personality.service');
require('@src/personality\message-processor');
require('@src/personality\personality.schema');

module.exports = {
  personalityService,
  personalityMessageProcessor,
  Personality,
  PersonalitySchema
};
