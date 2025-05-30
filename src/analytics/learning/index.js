/**
 * Learning Module Index
 * 
 * Exports all learning-related services for easy access.
 */

const continuousLearningService = require('./continuous.service');
const fineTuningService = require('./finetune.service');

module.exports = {
  continuousLearning: continuousLearningService,
  fineTuning: fineTuningService
};
