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

const analyticsService = require('./analytics.service');
const insightsService = require('./insights.service');
const learningService = require('./learning.service');
const conversationAnalytics = require('./conversation');
const { conversationTrackingService, conversationDashboardService, conversationInsightsService } = require('./conversation');
const feedbackService = require('./conversation/feedback.service');
const learningModules = require('./learning');
const engagementAnalytics = require('./engagement');
const { abTestingService } = require('./testing/ab-testing.service');
const { performanceBenchmarkService } = require('./benchmarking/performance-benchmark.service');
const { reportBuilderService } = require('./reporting/report-builder.service');
const { reportGeneratorService } = require('./reporting/report-generator.service');
const { predictiveAnalyticsService } = require('./predictive/predictive-analytics.service');
const { userBehaviorInsightsService } = require('./behavior/user-behavior-insights.service');
const { performanceOptimizerService } = require('./optimization/performance-optimizer.service');

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
