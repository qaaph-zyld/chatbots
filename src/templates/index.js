/**
 * Templates Index
 * 
 * Exports all template components for easy access
 */

const templateService = require('./template.service');
const templateController = require('./template.controller');
const templateRoutes = require('./template.routes');

module.exports = {
  templateService,
  templateController,
  templateRoutes
};
