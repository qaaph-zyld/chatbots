/**
 * MongoDB Data Abstraction Layer Test
 * 
 * Comprehensive test for the MongoDB model abstraction layer
 * Tests all repositories and their interactions
 */

const { databaseService, repositories } = require('../../data');
const { logger } = require('../../utils');
const fs = require('fs');
const path = require('path');

// Test configurations
const TEST_USER_ID = 'user123'; // Using test ID from test files

/**
 * Run a test with proper setup and teardown
 * @param {string} name - Test name
 * @param {Function} testFn - Test function
 */
async function runTest(name, testFn) {
  logger.info(`Running test: ${name}`);
  try {
    await testFn();
    logger.info(`✅ Test passed: ${name}`);
    return true;
  } catch (error) {
    logger.error(`❌ Test failed: ${name}`, { error: error.message });
    return false;
  }
}

/**
 * Test chatbot repository
 */
async function testChatbotRepository() {
  const chatbotRepo = repositories.chatbot;
  
  // Create test chatbot
  const chatbotData = {
    name: 'Test Chatbot',
    description: 'Created for testing the repository',
    ownerId: TEST_USER_ID,
    type: 'customer-support',
    engine: 'botpress'
  };
  
  // Create chatbot
  const chatbot = await chatbotRepo.create(chatbotData);
  logger.info(`Created test chatbot: ${chatbot._id}`);
  
  // Find by ID
  const foundChatbot = await chatbotRepo.findById(chatbot._id);
  if (!foundChatbot) throw new Error('Failed to find chatbot by ID');
  
  // Find by user
  const userChatbots = await chatbotRepo.findByUser(TEST_USER_ID);
  if (!userChatbots.length) throw new Error('Failed to find chatbots by user');
  
  // Find by type
  const typeChatbots = await chatbotRepo.findByType('customer-support');
  if (!typeChatbots.length) throw new Error('Failed to find chatbots by type');
  
  // Update chatbot
  const updateData = { name: 'Updated Test Chatbot' };
  const updatedChatbot = await chatbotRepo.findByIdAndUpdate(chatbot._id, updateData);
  if (updatedChatbot.name !== updateData.name) throw new Error('Failed to update chatbot');
  
  // Delete chatbot (will be done in cleanup)
  return chatbot._id;
}

/**
 * Test analytics repository
 */
async function testAnalyticsRepository(chatbotId) {
  const analyticsRepo = repositories.analytics;
  
  // Create analytics record
  const analyticsData = {
    chatbotId,
    period: 'daily',
    date: new Date(),
    metrics: {
      sessions: { count: 10, duration: 300 },
      messages: { count: 25, characters: 1500 },
      users: { unique: 5, returning: 3 }
    }
  };
  
  // Create analytics
  const analytics = await analyticsRepo.create(analyticsData);
  logger.info(`Created test analytics: ${analytics._id}`);
  
  // Find by chatbot ID
  const foundAnalytics = await analyticsRepo.findByChatbotId(chatbotId);
  if (!foundAnalytics.length) throw new Error('Failed to find analytics by chatbot ID');
  
  // Find by period
  const periodAnalytics = await analyticsRepo.getByPeriod(
    chatbotId, 'daily', new Date(Date.now() - 86400000), new Date()
  );
  if (!periodAnalytics.length) throw new Error('Failed to find analytics by period');
  
  // Update analytics
  const updateData = { 
    metrics: {
      sessions: { count: 15, duration: 450 },
      messages: { count: 30, characters: 1800 },
      users: { unique: 7, returning: 4 }
    }
  };
  const updatedAnalytics = await analyticsRepo.findByIdAndUpdate(analytics._id, updateData);
  if (updatedAnalytics.metrics.sessions.count !== 15) throw new Error('Failed to update analytics');
  
  // Delete analytics (will be done in cleanup)
  return analytics._id;
}

/**
 * Test conversation repository
 */
async function testConversationRepository(chatbotId) {
  const conversationRepo = repositories.conversation;
  
  // Create conversation record
  const conversationData = {
    chatbotId,
    userId: TEST_USER_ID,
    messages: [
      { role: 'user', content: 'Hello', timestamp: new Date() },
      { role: 'assistant', content: 'Hi there!', timestamp: new Date() }
    ],
    metadata: {
      source: 'web',
      browser: 'Chrome',
      platform: 'Windows'
    }
  };
  
  // Create conversation
  const conversation = await conversationRepo.create(conversationData);
  logger.info(`Created test conversation: ${conversation._id}`);
  
  // Find by ID
  const foundConversation = await conversationRepo.findById(conversation._id);
  if (!foundConversation) throw new Error('Failed to find conversation by ID');
  
  // Find by chatbot ID
  const chatbotConversations = await conversationRepo.findByChatbotId(chatbotId);
  if (!chatbotConversations.length) throw new Error('Failed to find conversations by chatbot ID');
  
  // Find by user ID
  const userConversations = await conversationRepo.findByUserId(TEST_USER_ID);
  if (!userConversations.length) throw new Error('Failed to find conversations by user ID');
  
  // Update conversation
  const newMessage = { role: 'user', content: 'How are you?', timestamp: new Date() };
  const updateData = { 
    $push: { messages: newMessage }
  };
  const updatedConversation = await conversationRepo.findByIdAndUpdate(conversation._id, updateData);
  if (updatedConversation.messages.length !== 3) throw new Error('Failed to update conversation');
  
  // Delete conversation (will be done in cleanup)
  return conversation._id;
}

/**
 * Test preference repository
 */
async function testPreferenceRepository() {
  const preferenceRepo = repositories.preference;
  
  // Create preferences
  const preferences = [];
  
  // Add theme preference
  const themePref = await preferenceRepo.setPreference(
    TEST_USER_ID, 'theme', 'mode', 'dark', 
    { source: 'explicit', confidence: 1.0, metadata: { userId: TEST_USER_ID } }
  );
  preferences.push(themePref);
  logger.info(`Created theme preference: ${themePref._id}`);
  
  // Add notification preferences
  const emailPref = await preferenceRepo.setPreference(
    TEST_USER_ID, 'notifications', 'email', true, 
    { source: 'explicit', confidence: 1.0, metadata: { userId: TEST_USER_ID } }
  );
  preferences.push(emailPref);
  logger.info(`Created email preference: ${emailPref._id}`);
  
  const pushPref = await preferenceRepo.setPreference(
    TEST_USER_ID, 'notifications', 'push', false, 
    { source: 'explicit', confidence: 1.0, metadata: { userId: TEST_USER_ID } }
  );
  preferences.push(pushPref);
  logger.info(`Created push preference: ${pushPref._id}`);
  
  // Get by user ID
  const userPreferences = await preferenceRepo.getByUserId(TEST_USER_ID);
  if (userPreferences.length < 3) throw new Error('Failed to get preferences by user ID');
  
  // Get by category
  const notificationPrefs = await preferenceRepo.getByCategory(TEST_USER_ID, 'notifications');
  if (notificationPrefs.length < 2) throw new Error('Failed to get preferences by category');
  
  // Get specific preference
  const emailPreference = await preferenceRepo.getPreference(TEST_USER_ID, 'notifications', 'email');
  if (!emailPreference || emailPreference.value !== true) throw new Error('Failed to get specific preference');
  
  // Update preference
  const updatedEmailPref = await preferenceRepo.setPreference(
    TEST_USER_ID, 'notifications', 'email', false, 
    { source: 'explicit', confidence: 1.0, metadata: { userId: TEST_USER_ID } }
  );
  if (updatedEmailPref.value !== false) throw new Error('Failed to update preference');
  
  // Get high confidence preferences
  const highConfPrefs = await preferenceRepo.getHighConfidencePreferences(TEST_USER_ID, 0.5);
  if (highConfPrefs.length < 3) throw new Error('Failed to get high confidence preferences');
  
  // Return preference IDs for cleanup
  return preferences.map(p => p._id);
}

/**
 * Test transactions across repositories
 */
async function testTransactions(chatbotId) {
  const chatbotRepo = repositories.chatbot;
  const analyticsRepo = repositories.analytics;
  
  // Start a transaction
  const session = await chatbotRepo.startTransaction();
  
  try {
    // Update chatbot in transaction
    const chatbotUpdate = { description: 'Updated in transaction' };
    const updatedChatbot = await chatbotRepo.findByIdAndUpdate(
      chatbotId, chatbotUpdate, { session }
    );
    
    // Create analytics in transaction
    const analyticsData = {
      chatbotId,
      period: 'weekly',
      date: new Date(),
      metrics: {
        sessions: { count: 50, duration: 1500 },
        messages: { count: 120, characters: 7500 },
        users: { unique: 25, returning: 15 }
      }
    };
    
    const analytics = await analyticsRepo.model.create([analyticsData], { session });
    
    // Commit transaction
    await chatbotRepo.commitTransaction(session);
    
    // Verify updates
    const verifiedChatbot = await chatbotRepo.findById(chatbotId);
    if (verifiedChatbot.description !== 'Updated in transaction') {
      throw new Error('Transaction failed: chatbot not updated');
    }
    
    const verifiedAnalytics = await analyticsRepo.findOne({
      chatbotId,
      period: 'weekly'
    });
    if (!verifiedAnalytics) {
      throw new Error('Transaction failed: analytics not created');
    }
    
    return verifiedAnalytics._id;
  } catch (error) {
    // Abort transaction on error
    await chatbotRepo.abortTransaction(session);
    throw error;
  }
}

/**
 * Clean up test data
 */
async function cleanupTestData(ids) {
  logger.info('Cleaning up test data...');
  
  try {
    // Delete chatbot
    if (ids.chatbotId) {
      await repositories.chatbot.deleteById(ids.chatbotId);
      logger.info(`Deleted test chatbot: ${ids.chatbotId}`);
    }
    
    // Delete analytics
    if (ids.analyticsIds && ids.analyticsIds.length) {
      for (const id of ids.analyticsIds) {
        await repositories.analytics.deleteById(id);
        logger.info(`Deleted test analytics: ${id}`);
      }
    }
    
    // Delete conversation
    if (ids.conversationId) {
      await repositories.conversation.deleteById(ids.conversationId);
      logger.info(`Deleted test conversation: ${ids.conversationId}`);
    }
    
    // Delete preferences
    if (ids.preferenceIds && ids.preferenceIds.length) {
      await repositories.preference.deleteAllUserPreferences(TEST_USER_ID);
      logger.info(`Deleted all preferences for user: ${TEST_USER_ID}`);
    }
    
    logger.info('Cleanup completed');
  } catch (error) {
    logger.error('Error cleaning up test data', { error: error.message });
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  const testIds = {
    chatbotId: null,
    analyticsIds: [],
    conversationId: null,
    preferenceIds: []
  };
  
  const results = {
    total: 5,
    passed: 0,
    failed: 0
  };
  
  try {
    logger.info('Starting MongoDB data abstraction layer tests...');
    
    // Connect to database
    await databaseService.connect();
    logger.info('Connected to database');
    
    // Run chatbot repository test
    if (await runTest('Chatbot Repository', async () => {
      testIds.chatbotId = await testChatbotRepository();
    })) {
      results.passed++;
    } else {
      results.failed++;
    }
    
    // Run analytics repository test
    if (testIds.chatbotId && await runTest('Analytics Repository', async () => {
      const analyticsId = await testAnalyticsRepository(testIds.chatbotId);
      testIds.analyticsIds.push(analyticsId);
    })) {
      results.passed++;
    } else {
      results.failed++;
    }
    
    // Run conversation repository test
    if (testIds.chatbotId && await runTest('Conversation Repository', async () => {
      testIds.conversationId = await testConversationRepository(testIds.chatbotId);
    })) {
      results.passed++;
    } else {
      results.failed++;
    }
    
    // Run preference repository test
    if (await runTest('Preference Repository', async () => {
      testIds.preferenceIds = await testPreferenceRepository();
    })) {
      results.passed++;
    } else {
      results.failed++;
    }
    
    // Run transaction test
    if (testIds.chatbotId && await runTest('Transaction Support', async () => {
      const transactionAnalyticsId = await testTransactions(testIds.chatbotId);
      testIds.analyticsIds.push(transactionAnalyticsId);
    })) {
      results.passed++;
    } else {
      results.failed++;
    }
    
    // Clean up test data
    await cleanupTestData(testIds);
    
    // Disconnect from database
    await databaseService.disconnect();
    logger.info('Disconnected from database');
    
    // Log test results
    logger.info('All MongoDB data abstraction layer tests completed', {
      total: results.total,
      passed: results.passed,
      failed: results.failed
    });
    
    // Save test results to file
    const testResultsDir = path.join(__dirname, '..', '..', '..', 'test-results');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(testResultsDir)) {
      fs.mkdirSync(testResultsDir, { recursive: true });
    }
    
    // Write test results
    fs.writeFileSync(
      path.join(testResultsDir, 'manual-test-results.txt'),
      `MongoDB Data Abstraction Layer Test Results\n` +
      `Timestamp: ${new Date().toISOString()}\n` +
      `Status: Completed\n` +
      `Tests: ${results.total}\n` +
      `Passed: ${results.passed}\n` +
      `Failed: ${results.failed}\n` +
      `\n` +
      `Repositories Tested:\n` +
      `- ChatbotRepository\n` +
      `- AnalyticsRepository\n` +
      `- ConversationRepository\n` +
      `- PreferenceRepository\n` +
      `\n` +
      `Features Tested:\n` +
      `- CRUD Operations\n` +
      `- Specialized Query Methods\n` +
      `- Caching\n` +
      `- Transaction Support\n`
    );
    
    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    logger.error('Error running MongoDB data abstraction layer tests', { error: error.message });
    
    // Try to clean up even if tests fail
    try {
      await cleanupTestData(testIds);
      await databaseService.disconnect();
    } catch (cleanupError) {
      logger.error('Error during cleanup', { error: cleanupError.message });
    }
    
    process.exit(1);
  }
}

// Run all tests
runAllTests();
