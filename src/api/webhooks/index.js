/**
 * Webhook module for the Chatbots Platform
 * Exports the webhook routes and service
 */
require('@src/api\webhooks\webhook.routes');
require('@src/api\webhooks\webhook.service');
require('@src/api\webhooks\webhook.model');

module.exports = {
  routes: webhookRoutes,
  service: webhookService,
  EVENT_TYPES
};
