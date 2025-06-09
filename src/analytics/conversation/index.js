/**
 * Conversation Analytics Module
 * 
 * This module provides capabilities for tracking conversations,
 * generating analytics, creating insights from conversation data,
 * and collecting user feedback for continuous learning.
 */

require('@src/analytics\conversation\tracking.service');
require('@src/analytics\conversation\dashboard.service');
require('@src/analytics\conversation\insights.service');
require('@src/analytics\conversation\integration.service');
require('@src/analytics\conversation\feedback.service');

module.exports = {
  conversationTrackingService,
  conversationDashboardService,
  conversationInsightsService,
  analyticsIntegrationService,
  feedbackService
};
