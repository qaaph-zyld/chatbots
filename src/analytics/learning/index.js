/**
 * Learning Module Index
 * 
 * Exports all learning-related services for easy access.
 */

require('@src/analytics\learning\continuous.service');
require('@src/analytics\learning\finetune.service');

module.exports = {
  continuousLearning: continuousLearningService,
  fineTuning: fineTuningService
};
