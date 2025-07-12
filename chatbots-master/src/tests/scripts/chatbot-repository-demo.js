/**
 * Chatbot Repository Demo
 * 
 * Demonstrates how to use the new data abstraction layer with the chatbot service
 */

require('@src/data');
require('@src/utils');

/**
 * Demo creating a new chatbot
 * @param {Object} chatbotData - Chatbot data
 * @returns {Promise<Object>} Created chatbot
 */
async function createChatbotDemo(chatbotData) {
  try {
    logger.info('Creating new chatbot...');
    
    const chatbotRepo = repositories.chatbot;
    const chatbot = await chatbotRepo.create(chatbotData);
    
    logger.info('Chatbot created successfully', { id: chatbot._id });
    return chatbot;
  } catch (error) {
    logger.error('Error creating chatbot', { error: error.message });
    throw error;
  }
}

/**
 * Demo finding chatbots by type
 * @param {string} type - Chatbot type
 * @returns {Promise<Array>} Chatbots of specified type
 */
async function findChatbotsByTypeDemo(type) {
  try {
    logger.info(`Finding chatbots of type: ${type}...`);
    
    const chatbotRepo = repositories.chatbot;
    const chatbots = await chatbotRepo.findByType(type);
    
    logger.info(`Found ${chatbots.length} chatbots of type: ${type}`);
    return chatbots;
  } catch (error) {
    logger.error('Error finding chatbots by type', { type, error: error.message });
    throw error;
  }
}

/**
 * Demo searching chatbots
 * @param {string} query - Search query
 * @returns {Promise<Array>} Matching chatbots
 */
async function searchChatbotsDemo(query) {
  try {
    logger.info(`Searching chatbots with query: ${query}...`);
    
    const chatbotRepo = repositories.chatbot;
    const chatbots = await chatbotRepo.search(query);
    
    logger.info(`Found ${chatbots.length} chatbots matching query: ${query}`);
    return chatbots;
  } catch (error) {
    logger.error('Error searching chatbots', { query, error: error.message });
    throw error;
  }
}

/**
 * Demo updating a chatbot
 * @param {string} chatbotId - Chatbot ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Updated chatbot
 */
async function updateChatbotDemo(chatbotId, updateData) {
  try {
    logger.info(`Updating chatbot: ${chatbotId}...`);
    
    const chatbotRepo = repositories.chatbot;
    const chatbot = await chatbotRepo.updateById(chatbotId, updateData);
    
    if (!chatbot) {
      logger.warn(`Chatbot not found: ${chatbotId}`);
      return null;
    }
    
    logger.info('Chatbot updated successfully', { id: chatbot._id });
    return chatbot;
  } catch (error) {
    logger.error('Error updating chatbot', { chatbotId, error: error.message });
    throw error;
  }
}

/**
 * Demo using a transaction to create a chatbot and analytics record
 * @param {Object} chatbotData - Chatbot data
 * @returns {Promise<Object>} Created chatbot and analytics
 */
async function transactionDemo(chatbotData) {
  try {
    logger.info('Starting transaction demo...');
    
    const chatbotRepo = repositories.chatbot;
    const analyticsRepo = repositories.analytics;
    
    // Start transaction
    const session = await chatbotRepo.startTransaction();
    
    try {
      // Create chatbot with session
      const chatbot = await chatbotRepo.model.create([chatbotData], { session });
      
      // Create analytics record with session
      const analytics = await analyticsRepo.model.create([{
        chatbotId: chatbot[0]._id,
        period: 'daily',
        date: new Date(),
        metrics: {
          sessions: { count: 0 },
          messages: { count: 0 },
          users: { unique: 0 }
        }
      }], { session });
      
      // Commit transaction
      await chatbotRepo.commitTransaction(session);
      
      logger.info('Transaction completed successfully', { 
        chatbotId: chatbot[0]._id,
        analyticsId: analytics[0]._id
      });
      
      return { chatbot: chatbot[0], analytics: analytics[0] };
    } catch (error) {
      // Abort transaction on error
      await chatbotRepo.abortTransaction(session);
      logger.error('Transaction aborted', { error: error.message });
      throw error;
    }
  } catch (error) {
    logger.error('Error in transaction demo', { error: error.message });
    throw error;
  }
}

/**
 * Run demo
 */
async function runDemo() {
  try {
    logger.info('Starting chatbot repository demo...');
    
    // Connect to database
    await databaseService.connect();
    logger.info('Connected to database');
    
    // Sample data
    const chatbotData = {
      name: 'Demo Chatbot',
      description: 'Created with repository pattern',
      ownerId: 'user123',
      type: 'customer-support',
      engine: 'botpress',
      personality: {
        tone: 'friendly',
        style: 'helpful',
        knowledge: 'customer-support'
      }
    };
    
    // Create chatbot
    const chatbot = await createChatbotDemo(chatbotData);
    
    // Find chatbots by type
    await findChatbotsByTypeDemo('customer-support');
    
    // Search chatbots
    await searchChatbotsDemo('support');
    
    // Update chatbot
    await updateChatbotDemo(chatbot._id, {
      name: 'Updated Demo Chatbot',
      description: 'Updated with repository pattern'
    });
    
    // Transaction demo
    await transactionDemo({
      name: 'Transaction Demo Chatbot',
      description: 'Created with transaction',
      ownerId: 'user123',
      type: 'sales',
      engine: 'openai'
    });
    
    // Disconnect from database
    await databaseService.disconnect();
    logger.info('Disconnected from database');
    
    logger.info('Chatbot repository demo completed');
    
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
      `Chatbot Repository Demo Results\n` +
      `Timestamp: ${new Date().toISOString()}\n` +
      `Status: Completed\n` +
      `Operations: Create, Find, Search, Update, Transaction\n`
    );
    
    process.exit(0);
  } catch (error) {
    logger.error('Error running chatbot repository demo', { error: error.message });
    process.exit(1);
  }
}

// Run demo
runDemo();
