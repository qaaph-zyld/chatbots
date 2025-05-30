/**
 * Multi-Modal Input/Output Module
 * 
 * This module provides capabilities for processing and generating
 * various types of content beyond text, including images, audio,
 * and structured outputs like cards and carousels.
 */

const { inputService } = require('./input');
const { outputService } = require('./output');

module.exports = {
  inputService,
  outputService
};
