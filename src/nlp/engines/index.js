/**
 * NLP Engines Index
 * 
 * Exports all NLP engine adapters for easy access
 */

const spacyEngine = require('./spacy.engine');
const nltkEngine = require('./nltk.engine');

module.exports = {
  spacyEngine,
  nltkEngine
};
