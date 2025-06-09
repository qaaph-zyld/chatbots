/**
 * NLP Engines Index
 * 
 * Exports all NLP engine adapters for easy access
 */

require('@src/nlp\engines\spacy.engine');
require('@src/nlp\engines\nltk.engine');

module.exports = {
  spacyEngine,
  nltkEngine
};
