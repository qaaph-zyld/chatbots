/**
 * Conversation Analytics Module
 * 
 * This module provides capabilities for tracking conversations,
 * generating analytics, creating insights from conversation data,
 * and collecting user feedback for continuous learning.
 */

const { conversationTrackingService } = require('./tracking.service');
const { conversationDashboardService } = require('./dashboard.service');
const { conversationInsightsService } = require('./insights.service');
const { analyticsIntegrationService } = require('./integration.service');
const feedbackService = require('./feedback.service');

module.exports = {
  conversationTrackingService,
  conversationDashboardService,
  conversationInsightsService,
  analyticsIntegrationService,
  feedbackService
};
