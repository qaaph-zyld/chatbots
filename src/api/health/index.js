/**
 * Health check module for the Chatbots Platform
 * Exports the health check routes for integration with the main application
 */
require('@src/api\health\health.routes');

module.exports = {
  routes: healthRoutes
};
