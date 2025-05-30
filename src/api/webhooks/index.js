/**
 * Webhook module for the Chatbots Platform
 * Exports the webhook routes and service
 */
const webhookRoutes = require('./webhook.routes');
const webhookService = require('./webhook.service');
const { EVENT_TYPES } = require('./webhook.model');

module.exports = {
  routes: webhookRoutes,
  service: webhookService,
  EVENT_TYPES
};
