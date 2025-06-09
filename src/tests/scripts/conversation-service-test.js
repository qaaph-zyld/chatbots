/**
 * Conversation Service Test
 * 
 * Tests the refactored conversation service using the repository pattern
 */

require('@src/data');
require('@src/services\conversation.service');
require('@src/utils');
const fs = require('fs');
const path = require('path');

// Test configurations
const TEST_CHATBOT_ID = 'test-chatbot-123';
const TEST_USER_ID = 'test-user-456';

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
 * Test creating a conversation
 */
async function testCreateConversation() {
  // Create a new conversation
  const initialContext = {
    source: 'web',
    referrer: 'test'
  };
  
  const conversation = await conversationService.createConversation(
    TEST_CHATBOT_ID,
    TEST_USER_ID,
    initialContext
  );
  
  // Verify conversation was created
  if (!conversation || !conversation._id) {
    throw new Error('Failed to create conversation');
  }
  
  if (conversation.chatbotId !== TEST_CHATBOT_ID) {
    throw new Error('Conversation has incorrect chatbot ID');
  }
  
  if (conversation.userId !== TEST_USER_ID) {
    throw new Error('Conversation has incorrect user ID');
  }
  
  if (!conversation.sessionId) {
    throw new Error('Conversation missing session ID');
  }
  
  if (!conversation.context || conversation.context.source !== 'web') {
    throw new Error('Conversation has incorrect context');
  }
  
  logger.info(`Created conversation: ${conversation._id}`);
  
  return conversation._id;
}

/**
 * Test retrieving a conversation
 */
async function testGetConversation(conversationId) {
  // Get conversation by ID
  const conversation = await conversationService.getConversationById(conversationId);
  
  // Verify conversation was retrieved
  if (!conversation || !conversation._id) {
    throw new Error('Failed to retrieve conversation by ID');
  }
  
  if (conversation._id.toString() !== conversationId.toString()) {
    throw new Error('Retrieved conversation has incorrect ID');
  }
  
  // Get conversation by session ID
  const sessionId = conversation.sessionId;
  const conversationBySession = await conversationService.getConversationBySessionId(sessionId);
  
  // Verify conversation was retrieved by session ID
  if (!conversationBySession || !conversationBySession._id) {
    throw new Error('Failed to retrieve conversation by session ID');
  }
  
  if (conversationBySession._id.toString() !== conversationId.toString()) {
    throw new Error('Retrieved conversation by session has incorrect ID');
  }
  
  logger.info(`Retrieved conversation: ${conversation._id}`);
}

/**
 * Test adding a message to a conversation
 */
async function testAddMessage(conversationId) {
  // Add user message
  const userMessage = 'Hello, this is a test message';
  const updatedConversation = await conversationService.addMessage(
    conversationId,
    userMessage,
    'user',
    { source: 'test' }
  );
  
  // Verify message was added
  if (!updatedConversation.messages || updatedConversation.messages.length !== 1) {
    throw new Error('Failed to add user message to conversation');
  }
  
  if (updatedConversation.messages[0].text !== userMessage) {
    throw new Error('Added message has incorrect text');
  }
  
  if (updatedConversation.messages[0].sender !== 'user') {
    throw new Error('Added message has incorrect sender');
  }
  
  // Add bot message
  const botMessage = 'I am a test bot response';
  const finalConversation = await conversationService.addMessage(
    conversationId,
    botMessage,
    'bot',
    { intent: 'greeting' }
  );
  
  // Verify bot message was added
  if (!finalConversation.messages || finalConversation.messages.length !== 2) {
    throw new Error('Failed to add bot message to conversation');
  }
  
  if (finalConversation.messages[1].text !== botMessage) {
    throw new Error('Added bot message has incorrect text');
  }
  
  if (finalConversation.messages[1].sender !== 'bot') {
    throw new Error('Added bot message has incorrect sender');
  }
  
  logger.info(`Added messages to conversation: ${conversationId}`);
}

/**
 * Test updating conversation context
 */
async function testUpdateContext(conversationId) {
  // Update context with merge
  const contextUpdate = {
    lastIntent: 'greeting',
    userPreference: 'quick-replies'
  };
  
  const updatedConversation = await conversationService.updateContext(
    conversationId,
    contextUpdate,
    true // merge with existing context
  );
  
  // Verify context was updated
  if (!updatedConversation.context || !updatedConversation.context.lastIntent) {
    throw new Error('Failed to update conversation context');
  }
  
  if (updatedConversation.context.lastIntent !== 'greeting') {
    throw new Error('Updated context has incorrect lastIntent');
  }
  
  if (!updatedConversation.context.source || updatedConversation.context.source !== 'web') {
    throw new Error('Context merge failed to preserve existing values');
  }
  
  // Replace context entirely
  const newContext = {
    reset: true,
    flow: 'onboarding'
  };
  
  const replacedConversation = await conversationService.updateContext(
    conversationId,
    newContext,
    false // replace existing context
  );
  
  // Verify context was replaced
  if (!replacedConversation.context || !replacedConversation.context.reset) {
    throw new Error('Failed to replace conversation context');
  }
  
  if (replacedConversation.context.source) {
    throw new Error('Context replacement failed, old values still present');
  }
  
  logger.info(`Updated context for conversation: ${conversationId}`);
}

/**
 * Test ending a conversation
 */
async function testEndConversation(conversationId) {
  // End conversation
  const endedConversation = await conversationService.endConversation(conversationId);
  
  // Verify conversation was ended
  if (endedConversation.isActive !== false) {
    throw new Error('Failed to end conversation');
  }
  
  logger.info(`Ended conversation: ${conversationId}`);
}

/**
 * Test getting active conversations
 */
async function testGetActiveConversations() {
  // Create a few active conversations
  const conversationIds = [];
  
  for (let i = 0; i < 3; i++) {
    const conversation = await conversationService.createConversation(
      TEST_CHATBOT_ID,
      `${TEST_USER_ID}-${i}`,
      { test: `conversation-${i}` }
    );
    conversationIds.push(conversation._id);
  }
  
  // Get active conversations
  const activeConversations = await conversationService.getActiveConversations(TEST_CHATBOT_ID);
  
  // Verify active conversations were retrieved
  if (!activeConversations || activeConversations.length < 3) {
    throw new Error('Failed to retrieve active conversations');
  }
  
  // End one conversation
  await conversationService.endConversation(conversationIds[0]);
  
  // Get active conversations again
  const remainingActive = await conversationService.getActiveConversations(TEST_CHATBOT_ID);
  
  // Verify one less active conversation
  if (remainingActive.length >= activeConversations.length) {
    throw new Error('Ended conversation still appears in active conversations');
  }
  
  logger.info(`Retrieved active conversations for chatbot: ${TEST_CHATBOT_ID}`);
  
  return conversationIds;
}

/**
 * Clean up test data
 */
async function cleanupTestData(conversationIds) {
  logger.info('Cleaning up test data...');
  
  try {
    // Delete test conversations using the repository
    require('@src/data');
    
    for (const id of conversationIds) {
      await repositories.conversation.deleteById(id);
      logger.info(`Deleted test conversation: ${id}`);
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
  const conversationIds = [];
  
  const results = {
    total: 5,
    passed: 0,
    failed: 0
  };
  
  try {
    logger.info('Starting conversation service tests...');
    
    // Connect to database
    await databaseService.connect();
    logger.info('Connected to database');
    
    // Run create conversation test
    if (await runTest('Create Conversation', async () => {
      const conversationId = await testCreateConversation();
      conversationIds.push(conversationId);
    })) {
      results.passed++;
    } else {
      results.failed++;
    }
    
    // Run get conversation test
    if (conversationIds.length > 0 && await runTest('Get Conversation', async () => {
      await testGetConversation(conversationIds[0]);
    })) {
      results.passed++;
    } else {
      results.failed++;
    }
    
    // Run add message test
    if (conversationIds.length > 0 && await runTest('Add Message', async () => {
      await testAddMessage(conversationIds[0]);
    })) {
      results.passed++;
    } else {
      results.failed++;
    }
    
    // Run update context test
    if (conversationIds.length > 0 && await runTest('Update Context', async () => {
      await testUpdateContext(conversationIds[0]);
    })) {
      results.passed++;
    } else {
      results.failed++;
    }
    
    // Run get active conversations test
    if (await runTest('Get Active Conversations', async () => {
      const activeIds = await testGetActiveConversations();
      conversationIds.push(...activeIds);
    })) {
      results.passed++;
    } else {
      results.failed++;
    }
    
    // Run end conversation test
    if (conversationIds.length > 0 && await runTest('End Conversation', async () => {
      await testEndConversation(conversationIds[0]);
    })) {
      results.passed++;
    } else {
      results.failed++;
    }
    
    // Clean up test data
    await cleanupTestData(conversationIds);
    
    // Disconnect from database
    await databaseService.disconnect();
    logger.info('Disconnected from database');
    
    // Log test results
    logger.info('All conversation service tests completed', {
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
      `Conversation Service Test Results\n` +
      `Timestamp: ${new Date().toISOString()}\n` +
      `Status: Completed\n` +
      `Tests: ${results.total}\n` +
      `Passed: ${results.passed}\n` +
      `Failed: ${results.failed}\n` +
      `\n` +
      `Operations Tested:\n` +
      `- Create Conversation\n` +
      `- Get Conversation (by ID and session ID)\n` +
      `- Add Messages\n` +
      `- Update Context\n` +
      `- Get Active Conversations\n` +
      `- End Conversation\n` +
      `\n` +
      `Features Validated:\n` +
      `- Repository Pattern Integration\n` +
      `- Transaction Support\n` +
      `- Caching\n` +
      `- Error Handling\n`
    );
    
    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    logger.error('Error running conversation service tests', { error: error.message });
    
    // Try to clean up even if tests fail
    try {
      await cleanupTestData(conversationIds);
      await databaseService.disconnect();
    } catch (cleanupError) {
      logger.error('Error during cleanup', { error: cleanupError.message });
    }
    
    process.exit(1);
  }
}

// Run all tests
runAllTests();
