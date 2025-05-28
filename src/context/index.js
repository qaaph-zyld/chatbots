/**
 * Context Module Index
 * 
 * Exports all context awareness services
 */

const contextService = require('./context.service');
const topicService = require('./topic.service');
const entityService = require('./entity.service');
const referenceService = require('./reference.service');

module.exports = {
  contextService,
  topicService,
  entityService,
  referenceService
};
