/**
 * Analytics Service Demo Script
 * 
 * This script demonstrates the capabilities of the Analytics Service
 * including message tracking, analytics retrieval, and report generation.
 */

const mongoose = require('mongoose');
const AnalyticsService = require('../../analytics/analytics.service');
const logger = require('../../utils/logger');

// MongoDB connection string
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/chatbot-platform';

// Connect to MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  logger.info('Connected to MongoDB');
  runDemo();
}).catch(err => {
  logger.error('MongoDB connection error:', err.message);
  process.exit(1);
});

/**
 * Run the Analytics Service demo
 */
async function runDemo() {
  try {
    logger.info('Starting Analytics Service Demo');
    
    // Initialize Analytics Service
    const analyticsService = new AnalyticsService();
    
    // Create a mock chatbot ID
    const chatbotId = new mongoose.Types.ObjectId();
    
    // Step 1: Track user and bot messages
    logger.info('\n--- Step 1: Track Messages ---');
    
    // Track user message
    const userMessage = {
      chatbotId,
      type: 'user',
      text: 'Hello, how can you help me today?',
      userId: 'user123',
      timestamp: new Date(),
      intent: 'greeting',
      entities: [{ type: 'greeting', value: 'hello' }],
      sentiment: 'positive'
    };
    
    await analyticsService.trackMessage(userMessage);
    logger.info('Tracked user message:', userMessage.text);
    
    // Track bot message
    const botMessage = {
      chatbotId,
      type: 'bot',
      text: 'Hello! I\'m here to help you with any questions about our products and services.',
      userId: 'user123',
      timestamp: new Date(Date.now() + 500), // 500ms later
      intent: 'greeting_response',
      entities: [{ type: 'service', value: 'help' }],
      sentiment: 'positive'
    };
    
    await analyticsService.trackMessage(botMessage);
    logger.info('Tracked bot message:', botMessage.text);
    
    // Step 2: Get analytics for today
    logger.info('\n--- Step 2: Get Today\'s Analytics ---');
    
    const today = new Date();
    const todayAnalytics = await analyticsService.getAnalytics(chatbotId, 'daily', today);
    
    if (todayAnalytics) {
      logger.info('Today\'s Analytics:');
      logger.info(`- Message Count: ${todayAnalytics.metrics.messageCount}`);
      logger.info(`- User Message Count: ${todayAnalytics.metrics.userMessageCount}`);
      logger.info(`- Bot Message Count: ${todayAnalytics.metrics.botMessageCount}`);
      logger.info(`- Average Response Time: ${todayAnalytics.metrics.averageResponseTime}ms`);
    } else {
      logger.info('No analytics found for today');
    }
    
    // Step 3: Get all-time analytics
    logger.info('\n--- Step 3: Get All-Time Analytics ---');
    
    const allTimeAnalytics = await analyticsService.getAllTimeAnalytics(chatbotId);
    
    if (allTimeAnalytics) {
      logger.info('All-Time Analytics:');
      logger.info(`- Message Count: ${allTimeAnalytics.metrics.messageCount}`);
      logger.info(`- User Message Count: ${allTimeAnalytics.metrics.userMessageCount}`);
      logger.info(`- Bot Message Count: ${allTimeAnalytics.metrics.botMessageCount}`);
      logger.info(`- Average Response Time: ${allTimeAnalytics.metrics.averageResponseTime}ms`);
    } else {
      logger.info('No all-time analytics found');
    }
    
    // Step 4: Generate a report for the last 7 days
    logger.info('\n--- Step 4: Generate Weekly Report ---');
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    const report = await analyticsService.generateReport(chatbotId, 'weekly', startDate, endDate);
    
    logger.info('Weekly Report:');
    logger.info(`- Period: ${report.period}`);
    logger.info(`- Date Range: ${report.startDate} to ${report.endDate}`);
    logger.info('- Summary:');
    logger.info(`  - Message Count: ${report.summary.messageCount}`);
    logger.info(`  - User Message Count: ${report.summary.userMessageCount}`);
    logger.info(`  - Bot Message Count: ${report.summary.botMessageCount}`);
    logger.info(`  - Average Response Time: ${report.summary.averageResponseTime}ms`);
    logger.info(`  - Conversation Count: ${report.summary.conversationCount}`);
    
    logger.info('- Trends:');
    logger.info(`  - Message Count Trend: ${report.trends.messageCountTrend}%`);
    logger.info(`  - Response Time Trend: ${report.trends.responseTimeTrend}%`);
    logger.info(`  - Conversation Count Trend: ${report.trends.conversationCountTrend}%`);
    
    logger.info('- Top Intents:');
    report.topIntents.forEach((intent, index) => {
      logger.info(`  ${index + 1}. ${intent.type}: ${intent.count}`);
    });
    
    logger.info('- Top Entities:');
    report.topEntities.forEach((entity, index) => {
      logger.info(`  ${index + 1}. ${entity.type} (${entity.value}): ${entity.count}`);
    });
    
    logger.info('- Top Queries:');
    report.topQueries.topUserQueries.forEach((query, index) => {
      logger.info(`  ${index + 1}. "${query.query}": ${query.count}`);
    });
    
    logger.info('- Sentiment Analysis:');
    logger.info(`  - Positive: ${report.sentimentAnalysis.positivePercentage}%`);
    logger.info(`  - Negative: ${report.sentimentAnalysis.negativePercentage}%`);
    logger.info(`  - Neutral: ${report.sentimentAnalysis.neutralPercentage}%`);
    
    logger.info('- Performance Metrics:');
    logger.info(`  - Average Response Time: ${report.performanceMetrics.averageResponseTime}ms`);
    logger.info(`  - 90th Percentile Response Time: ${report.performanceMetrics.responseTimePercentile90}ms`);
    logger.info(`  - Message Success Rate: ${report.performanceMetrics.messageSuccessRate}%`);
    
    // Step 5: Process message buffer
    logger.info('\n--- Step 5: Process Message Buffer ---');
    
    await analyticsService.processBuffer();
    logger.info('Message buffer processed successfully');
    
    logger.info('\nAnalytics Service Demo completed successfully');
    
    // Close MongoDB connection
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    logger.error('Error in Analytics Service Demo:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}
