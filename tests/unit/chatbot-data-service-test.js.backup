/**
 * Chatbot Data Service Test
 * 
 * Tests the chatbot data service with the MongoDB model abstraction layer
 */

const chatbotDataService = require('../../services/chatbot-data.service');
const { databaseService } = require('../../data');
const { logger } = require('../../utils');
const fs = require('fs');
const path = require('path');

// Test configurations
const TEST_USER_ID = 'user123'; // Using test ID from test files

/**
 * Run test for creating and retrieving chatbots
 */
async function testCreateAndRetrieve() {
  logger.info('Testing create and retrieve chatbots...');
  
  try {
    // Create test chatbot
    const chatbotData = {
      name: 'Test Chatbot',
      description: 'Created for testing the data service',
      ownerId: TEST_USER_ID,
      type: 'customer-support',
      engine: 'botpress',
      personality: {
        tone: 'friendly',
        style: 'helpful',
        knowledge: 'customer-support'
      }
    };
    
    // Create chatbot
    const createdChatbot = await chatbotDataService.createChatbot(chatbotData);
    logger.info(`Created test chatbot: ${createdChatbot._id}`);
    
    // Get chatbot by ID
    const retrievedChatbot = await chatbotDataService.getChatbotById(createdChatbot._id);
    logger.info(`Retrieved chatbot: ${retrievedChatbot.name}`);
    
    // Verify data
    if (retrievedChatbot.name === chatbotData.name && 
        retrievedChatbot.ownerId.toString() === TEST_USER_ID) {
      logger.info('✅ Create and retrieve test passed');
    } else {
      logger.error('❌ Create and retrieve test failed - data mismatch');
    }
    
    return createdChatbot;
  } catch (error) {
    logger.error('Error in create and retrieve test', { error: error.message });
    throw error;
  }
}

/**
 * Test finding chatbots by user
 */
async function testFindByUser(createdChatbotId) {
  logger.info('Testing find chatbots by user...');
  
  try {
    // Find chatbots by user
    const userChatbots = await chatbotDataService.getChatbotsByUser(TEST_USER_ID);
    logger.info(`Found ${userChatbots.length} chatbots for user ${TEST_USER_ID}`);
    
    // Verify the created chatbot is in the results
    const found = userChatbots.some(chatbot => chatbot._id.toString() === createdChatbotId.toString());
    
    if (found) {
      logger.info('✅ Find by user test passed');
    } else {
      logger.error('❌ Find by user test failed - created chatbot not found');
    }
  } catch (error) {
    logger.error('Error in find by user test', { error: error.message });
    throw error;
  }
}

/**
 * Test updating a chatbot
 */
async function testUpdate(chatbotId) {
  logger.info('Testing update chatbot...');
  
  try {
    // Update data
    const updateData = {
      name: 'Updated Test Chatbot',
      description: 'Updated for testing'
    };
    
    // Update chatbot
    const updatedChatbot = await chatbotDataService.updateChatbot(chatbotId, updateData);
    logger.info(`Updated chatbot: ${updatedChatbot.name}`);
    
    // Verify update
    if (updatedChatbot.name === updateData.name && 
        updatedChatbot.description === updateData.description) {
      logger.info('✅ Update test passed');
    } else {
      logger.error('❌ Update test failed - data not updated correctly');
    }
  } catch (error) {
    logger.error('Error in update test', { error: error.message });
    throw error;
  }
}

/**
 * Test creating a chatbot with analytics
 */
async function testCreateWithAnalytics() {
  logger.info('Testing create chatbot with analytics...');
  
  try {
    // Create test chatbot with analytics
    const chatbotData = {
      name: 'Analytics Test Chatbot',
      description: 'Created for testing analytics',
      ownerId: TEST_USER_ID,
      type: 'sales',
      engine: 'openai'
    };
    
    // Create chatbot with analytics
    const result = await chatbotDataService.createChatbotWithAnalytics(chatbotData);
    logger.info(`Created chatbot with analytics: ${result.chatbot._id}`);
    
    // Verify both objects were created
    if (result.chatbot && result.analytics && 
        result.analytics.chatbotId.toString() === result.chatbot._id.toString()) {
      logger.info('✅ Create with analytics test passed');
    } else {
      logger.error('❌ Create with analytics test failed - data mismatch');
    }
    
    return result.chatbot;
  } catch (error) {
    logger.error('Error in create with analytics test', { error: error.message });
    throw error;
  }
}

/**
 * Test access control
 */
async function testAccessControl(chatbotId) {
  logger.info('Testing access control...');
  
  try {
    // Check access for owner
    const ownerAccess = await chatbotDataService.hasAccess(chatbotId, TEST_USER_ID);
    logger.info(`Owner access: ${ownerAccess}`);
    
    // Check access for another user
    const otherAccess = await chatbotDataService.hasAccess(chatbotId, 'other-user');
    logger.info(`Other user access: ${otherAccess}`);
    
    // Verify access control
    if (ownerAccess === true && otherAccess === false) {
      logger.info('✅ Access control test passed');
    } else {
      logger.error('❌ Access control test failed - incorrect access results');
    }
  } catch (error) {
    logger.error('Error in access control test', { error: error.message });
    throw error;
  }
}

/**
 * Test deleting a chatbot
 */
async function testDelete(chatbotId) {
  logger.info('Testing delete chatbot...');
  
  try {
    // Delete chatbot
    const deleteResult = await chatbotDataService.deleteChatbot(chatbotId);
    logger.info(`Delete result: ${deleteResult}`);
    
    // Try to retrieve deleted chatbot
    const retrievedChatbot = await chatbotDataService.getChatbotById(chatbotId);
    
    // Verify deletion
    if (deleteResult === true && retrievedChatbot === null) {
      logger.info('✅ Delete test passed');
    } else {
      logger.error('❌ Delete test failed - chatbot not deleted properly');
    }
  } catch (error) {
    logger.error('Error in delete test', { error: error.message });
    throw error;
  }
}

/**
 * Clean up test data
 */
async function cleanUp(chatbotIds) {
  logger.info('Cleaning up test data...');
  
  try {
    // Delete all test chatbots
    for (const id of chatbotIds) {
      if (id) {
        await chatbotDataService.deleteChatbot(id);
        logger.info(`Deleted test chatbot: ${id}`);
      }
    }
    
    logger.info('Cleanup completed');
  } catch (error) {
    logger.error('Error cleaning up test data', { error: error.message });
  }
}

/**
 * Run all tests
 */
async function runTests() {
  const testChatbots = [];
  
  try {
    logger.info('Starting chatbot data service tests...');
    
    // Connect to database
    await databaseService.connect();
    logger.info('Connected to database');
    
    // Run tests
    const chatbot1 = await testCreateAndRetrieve();
    testChatbots.push(chatbot1._id);
    
    await testFindByUser(chatbot1._id);
    await testUpdate(chatbot1._id);
    
    const chatbot2 = await testCreateWithAnalytics();
    testChatbots.push(chatbot2._id);
    
    await testAccessControl(chatbot2._id);
    await testDelete(chatbot1._id);
    
    // Remove deleted chatbot from cleanup list
    testChatbots[0] = null;
    
    // Clean up remaining test data
    await cleanUp(testChatbots);
    
    // Disconnect from database
    await databaseService.disconnect();
    logger.info('Disconnected from database');
    
    logger.info('All chatbot data service tests completed');
    
    // Save test results to file
    const testResultsDir = path.join(__dirname, '..', '..', '..', 'test-results');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(testResultsDir)) {
      fs.mkdirSync(testResultsDir, { recursive: true });
    }
    
    // Write test results
    fs.writeFileSync(
      path.join(testResultsDir, 'manual-test-results.txt'),
      `Chatbot Data Service Test Results\n` +
      `Timestamp: ${new Date().toISOString()}\n` +
      `Status: Completed\n` +
      `Tests: Create, Retrieve, Find, Update, Transaction, Access Control, Delete\n`
    );
    
    process.exit(0);
  } catch (error) {
    logger.error('Error running chatbot data service tests', { error: error.message });
    
    // Try to clean up even if tests fail
    try {
      await cleanUp(testChatbots.filter(id => id));
      await databaseService.disconnect();
    } catch (cleanupError) {
      logger.error('Error during cleanup', { error: cleanupError.message });
    }
    
    process.exit(1);
  }
}

// Run tests
runTests();
