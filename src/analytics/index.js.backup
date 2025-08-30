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

require('@src/analytics\analytics.service');
require('@src/analytics\insights.service');
require('@src/analytics\learning.service');
require('@src/analytics\conversation');
require('@src/analytics\conversation');
require('@src/analytics\conversation\feedback.service');
require('@src/analytics\learning');
require('@src/analytics\engagement');
require('@src/analytics\testing\ab-testing.service');
require('@src/analytics\benchmarking\performance-benchmark.service');
require('@src/analytics\reporting\report-builder.service');
require('@src/analytics\reporting\report-generator.service');
require('@src/analytics\predictive\predictive-analytics.service');
require('@src/analytics\behavior\user-behavior-insights.service');
require('@src/analytics\optimization\performance-optimizer.service');

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
