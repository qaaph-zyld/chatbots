/**
 * Data Layer Test Script
 * 
 * Tests the MongoDB model abstraction layer with repositories
 */

require('@src/data');
require('@src/utils');

// Test configurations
const TEST_CHATBOT_ID = '789'; // Using test ID from test files
const TEST_USER_ID = 'user123'; // Using test ID from test files

/**
 * Run test for chatbot repository
 */
async function testChatbotRepository() {
  logger.info('Testing Chatbot Repository...');
  
  try {
    const chatbotRepo = repositories.chatbot;
    
    // Test findByUser
    logger.info('Testing findByUser...');
    const userChatbots = await chatbotRepo.findByUser(TEST_USER_ID);
    logger.info(`Found ${userChatbots.length} chatbots for user`);
    
    // Test findPublic
    logger.info('Testing findPublic...');
    const publicChatbots = await chatbotRepo.findPublic();
    logger.info(`Found ${publicChatbots.length} public chatbots`);
    
    // Test findByType
    logger.info('Testing findByType...');
    const customChatbots = await chatbotRepo.findByType('custom');
    logger.info(`Found ${customChatbots.length} custom chatbots`);
    
    // Test search
    logger.info('Testing search...');
    const searchResults = await chatbotRepo.search('support');
    logger.info(`Found ${searchResults.length} chatbots matching search`);
    
    logger.info('Chatbot Repository tests completed successfully');
  } catch (error) {
    logger.error('Error testing chatbot repository', { error: error.message });
  }
}

/**
 * Run test for analytics repository
 */
async function testAnalyticsRepository() {
  logger.info('Testing Analytics Repository...');
  
  try {
    const analyticsRepo = repositories.analytics;
    
    // Test date ranges
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    // Test getByPeriod
    logger.info('Testing getByPeriod...');
    const periodAnalytics = await analyticsRepo.getByPeriod(
      TEST_CHATBOT_ID,
      'daily',
      oneMonthAgo,
      today
    );
    logger.info(`Found ${periodAnalytics.length} analytics records for period`);
    
    // Test getLatest
    logger.info('Testing getLatest...');
    const latestAnalytics = await analyticsRepo.getLatest(
      TEST_CHATBOT_ID,
      'daily',
      10
    );
    logger.info(`Found ${latestAnalytics.length} latest analytics records`);
    
    // Test generateSummary
    logger.info('Testing generateSummary...');
    const summary = await analyticsRepo.generateSummary(TEST_CHATBOT_ID);
    logger.info('Generated analytics summary', { 
      periods: Object.keys(summary).length 
    });
    
    logger.info('Analytics Repository tests completed successfully');
  } catch (error) {
    logger.error('Error testing analytics repository', { error: error.message });
  }
}

/**
 * Run test for conversation repository
 */
async function testConversationRepository() {
  logger.info('Testing Conversation Repository...');
  
  try {
    const conversationRepo = repositories.conversation;
    
    // Test findActive
    logger.info('Testing findActive...');
    const activeConversations = await conversationRepo.findActive(TEST_CHATBOT_ID);
    logger.info(`Found ${activeConversations.length} active conversations`);
    
    // Test findByUser
    logger.info('Testing findByUser...');
    const userConversations = await conversationRepo.findByUser(TEST_USER_ID);
    logger.info(`Found ${userConversations.length} conversations for user`);
    
    // Test date ranges
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    // Test getStatistics
    logger.info('Testing getStatistics...');
    const statistics = await conversationRepo.getStatistics(
      TEST_CHATBOT_ID,
      oneMonthAgo,
      today
    );
    logger.info('Generated conversation statistics', { 
      totalConversations: statistics.totalConversations 
    });
    
    // Test getInsights
    logger.info('Testing getInsights...');
    const insights = await conversationRepo.getInsights(
      TEST_CHATBOT_ID,
      oneMonthAgo,
      today
    );
    logger.info('Generated conversation insights', { 
      dailyConversations: insights.dailyConversations.length 
    });
    
    logger.info('Conversation Repository tests completed successfully');
  } catch (error) {
    logger.error('Error testing conversation repository', { error: error.message });
  }
}

/**
 * Run all tests
 */
async function runTests() {
  try {
    logger.info('Starting data layer tests...');
    
    // Connect to database
    await databaseService.connect();
    logger.info('Connected to database');
    
    // Run repository tests
    await testChatbotRepository();
    await testAnalyticsRepository();
    await testConversationRepository();
    
    // Disconnect from database
    await databaseService.disconnect();
    logger.info('Disconnected from database');
    
    logger.info('All data layer tests completed');
    
    // Save test results to file
    const fs = require('fs');
    const path = require('path');
    const testResultsDir = path.join(__dirname, '..', '..', '..', 'test-results');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(testResultsDir)) {
      fs.mkdirSync(testResultsDir, { recursive: true });
    }
    
    // Write test results
    fs.writeFileSync(
      path.join(testResultsDir, 'manual-test-results.txt'),
      `Data Layer Test Results\n` +
      `Timestamp: ${new Date().toISOString()}\n` +
      `Status: Completed\n` +
      `Repositories Tested: chatbot, analytics, conversation\n`
    );
    
    process.exit(0);
  } catch (error) {
    logger.error('Error running data layer tests', { error: error.message });
    process.exit(1);
  }
}

// Run tests
runTests();
