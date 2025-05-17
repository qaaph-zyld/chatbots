/**
 * NLP Processors Index
 * 
 * Centralizes and exports all NLP processors
 */

const BasicProcessor = require('../../nlp/processors/basic.processor');
const HuggingFaceProcessor = require('../../nlp/processors/huggingface.processor');

module.exports = {
  BasicProcessor,
  HuggingFaceProcessor
};
