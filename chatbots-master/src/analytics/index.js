/**
 * Analytics Module Index
 * 
 * Exports all analytics services including conversation tracking,
 * dashboard generation, insights, external integrations, user
 * engagement metrics, A/B testing framework, performance benchmarking,
 * custom report generation, report scheduling, predictive analytics,
 * user behavior insights, performance optimization recommendations,
 * feedback collection, continuous learning, and model fine-tuning.
 */

require('');
require('');
require('');
require('');
require('');
require('');
require('');
require('');
require('');
require('');
require('');
require('');
require('');
require('');
require('');

module.exports = {
  analyticsService,
  insightsService,
  learningService,
  conversation: conversationAnalytics,
  // Expose conversation analytics services directly for easier access
  conversationTrackingService,
  conversationDashboardService,
  conversationInsightsService,
  feedbackService,
  // Expose learning modules
  learning: learningModules,
  continuousLearning: learningModules.continuousLearning,
  fineTuning: learningModules.fineTuning,
  engagement: engagementAnalytics,
  abTestingService,
  performanceBenchmarkService,
  reportBuilderService,
  reportGeneratorService,
  predictiveAnalyticsService,
  userBehaviorInsightsService,
  performanceOptimizerService
};
