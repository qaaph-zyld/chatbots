/**
 * Training Index
 * 
 * Exports all training components for easy access
 */

const trainingService = require('./training.service');
const trainingController = require('./training.controller');
const trainingRoutes = require('./training.routes');

module.exports = {
  trainingService,
  trainingController,
  trainingRoutes
};
