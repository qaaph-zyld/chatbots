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
 * @param {string} engineType - Type of engine to test
 */
async function testChatbotEngine(engineType) {
  logger.info(`Starting chatbot engine test for ${engineType}`);
  
  try {
    // Create engine instance with appropriate configuration based on engine type
    let engineConfig = {
      timeout: 5000
    };
    
    // Add engine-specific configuration
    if (engineType === 'botpress') {
      engineConfig = {
        ...engineConfig,
        botId: 'test-botpress-bot'
      };
    } else if (engineType === 'huggingface') {
      engineConfig = {
        ...engineConfig,
        modelName: 'facebook/blenderbot-400M-distill'
      };
    }
    
    // Create engine instance
    const engine = engineFactory.getEngine(engineType, engineConfig);
    
    // Initialize engine
    logger.info(`Initializing ${engineType} engine...`);
    const initialized = await engine.initialize();
    
    if (!initialized) {
      logger.error(`Failed to initialize ${engineType} engine`);
      return false;
    }
    
    logger.info(`${engineType} engine initialized successfully`);
    
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
      logger.info(`Testing message with ${engineType}: "${message}"`);
      
      const response = await engine.processMessage(message, {
        sessionId: `test-session-${engineType}`,
        userId: 'test-user',
        history: [] // Add history for testing context persistence
      });
      
      logger.info(`${engineType} response: "${response.text}"`);
      logger.debug(`${engineType} response metadata:`, response.metadata);
      
      // Add a small delay between messages
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Clean up
    await engine.cleanup();
    logger.info(`${engineType} engine cleaned up`);
    
    return true;
  } catch (error) {
    logger.error(`Error testing ${engineType} chatbot engine:`, error.message);
    return false;
  }
}

/**
 * Main test function
 */
async function runTests() {
  logger.info('=== CHATBOT FUNCTIONALITY TEST ===');
  
  // Get available engine types
  const engineTypes = engineFactory.getAvailableEngineTypes();
  logger.info(`Available engine types: ${engineTypes.join(', ')}`);
  
  // Test results tracking
  const results = {};
  
  // Test each engine type
  for (const engineType of engineTypes) {
    logger.info(`\n=== TESTING ${engineType.toUpperCase()} ENGINE ===`);
    results[engineType] = await testChatbotEngine(engineType);
    logger.info(`${engineType} engine test ${results[engineType] ? 'PASSED' : 'FAILED'}`);
  }
  
  // Summary of results
  logger.info('\n=== TEST RESULTS SUMMARY ===');
  for (const [engineType, result] of Object.entries(results)) {
    logger.info(`${engineType}: ${result ? 'PASSED' : 'FAILED'}`);
  }
  
  // Overall result
  const overallResult = Object.values(results).every(result => result === true);
  logger.info(`\nOverall test result: ${overallResult ? 'PASSED' : 'FAILED'}`);
  
  logger.info('\n=== TEST COMPLETE ===');
}

// Run tests
runTests().catch(error => {
  logger.error('Test failed with error:', error);
  process.exit(1);
});
