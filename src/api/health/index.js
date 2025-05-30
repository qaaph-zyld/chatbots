/**
 * Health check module for the Chatbots Platform
 * Exports the health check routes for integration with the main application
 */
const healthRoutes = require('./health.routes');

module.exports = {
  routes: healthRoutes
};
