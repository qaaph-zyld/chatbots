/**
 * NLP Processors Index
 * 
 * Centralizes and exports all NLP processors
 */

require('@src/bot\nlp\processors\basic.processor');
require('@src/bot\nlp\processors\huggingface.processor');

module.exports = {
  BasicProcessor,
  HuggingFaceProcessor
};
