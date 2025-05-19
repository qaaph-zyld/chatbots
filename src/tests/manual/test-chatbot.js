/**
 * Manual Test Script for Chatbot Functionality
 * 
 * This script tests the core chatbot functionality without requiring a full server setup.
 * It can be run directly with Node.js to verify that the chatbot components are working correctly.
 */

// Set up environment
require('dotenv').config();

// Import required modules
const { engineFactory } = require('../../bot/engines');
const { logger } = require('../../utils');
const config = require('../../config');

// Configure logger for testing
logger.setLevel('debug');

/**
 * Test function to verify chatbot engine functionality
 */
async function testChatbotEngine() {
  logger.info('Starting chatbot engine test');
  
  try {
    // Get default engine type from config
    const engineType = config.chatbot.defaultEngine || 'botpress';
    logger.info(`Testing engine type: ${engineType}`);
    
    // Create engine instance
    const engine = engineFactory.getEngine(engineType, {
      // Test configuration
      botId: 'test-bot',
      timeout: 5000
    });
    
    // Initialize engine
    logger.info('Initializing engine...');
    const initialized = await engine.initialize();
    
    if (!initialized) {
      logger.error('Failed to initialize engine');
      return false;
    }
    
    logger.info('Engine initialized successfully');
    
    // Test messages
    const testMessages = [
      'Hello',
      'What can you do?',
      'Tell me about yourself',
      'Help me with something',
      'Goodbye'
    ];
    
    // Process each test message
    for (const message of testMessages) {
      logger.info(`Testing message: "${message}"`);
      
      const response = await engine.processMessage(message, {
        sessionId: 'test-session',
        userId: 'test-user'
      });
      
      logger.info(`Response: "${response.text}"`);
      logger.debug('Response metadata:', response.metadata);
      
      // Add a small delay between messages
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Clean up
    await engine.cleanup();
    logger.info('Engine cleaned up');
    
    return true;
  } catch (error) {
    logger.error('Error testing chatbot engine:', error.message);
    return false;
  }
}

/**
 * Main test function
 */
async function runTests() {
  logger.info('=== CHATBOT FUNCTIONALITY TEST ===');
  
  // Test chatbot engine
  const engineTestResult = await testChatbotEngine();
  logger.info(`Engine test ${engineTestResult ? 'PASSED' : 'FAILED'}`);
  
  logger.info('=== TEST COMPLETE ===');
}

// Run tests
runTests().catch(error => {
  logger.error('Test failed with error:', error);
  process.exit(1);
});
