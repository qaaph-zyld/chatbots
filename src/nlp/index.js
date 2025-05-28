/**
 * NLP Services Index
 * 
 * Exports all NLP services for easy access
 */

const nlpService = require('./nlp.service');
const intentService = require('./intent.service');
const { entityService, EntityType } = require('./entity.service');
const { sentimentService, SentimentCategory } = require('./sentiment.service');

module.exports = {
  nlpService,
  intentService,
  entityService,
  sentimentService,
  EntityType,
  SentimentCategory
};
