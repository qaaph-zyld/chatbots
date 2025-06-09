/**
 * Sample Training Data Loader
 * 
 * Utility to load sample training data into the system
 */

const fs = require('fs');
const path = require('path');
require('@src/database\connection');
require('@src/database\schemas\chatbot.schema');
require('@src/services\training.service');
require('@src/utils\index');

/**
 * Load sample training data for a chatbot
 * @param {string} chatbotId - Chatbot ID
 * @returns {Promise<Object>} - Created training dataset
 */
async function loadSampleTrainingData(chatbotId) {
  try {
    // Check if chatbot exists
    const chatbot = await Chatbot.findById(chatbotId);
    if (!chatbot) {
      throw new Error(`Chatbot with ID ${chatbotId} not found`);
    }
    
    // Load sample training data
    const sampleDataPath = path.join(__dirname, '../data/sample-training-data.json');
    const sampleData = JSON.parse(fs.readFileSync(sampleDataPath, 'utf8'));
    
    // Create training dataset
    const trainingDataset = await trainingService.createTrainingDataset({
      name: sampleData.name,
      description: sampleData.description,
      domain: sampleData.domain,
      chatbotId
    });
    
    logger.info(`Created training dataset: ${trainingDataset._id} (${trainingDataset.name})`);
    
    // Add training examples
    for (const example of sampleData.examples) {
      await trainingService.addTrainingExample(trainingDataset._id, example);
    }
    
    logger.info(`Added ${sampleData.examples.length} training examples to dataset ${trainingDataset._id}`);
    
    return trainingDataset;
  } catch (error) {
    logger.error('Error loading sample training data:', error.message);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // Connect to database
    await connectDB();
    
    // Get first chatbot
    const chatbots = await Chatbot.find({}).limit(1);
    
    if (chatbots.length === 0) {
      logger.error('No chatbots found in the database');
      return;
    }
    
    const chatbot = chatbots[0];
    
    // Load sample training data
    const trainingDataset = await loadSampleTrainingData(chatbot._id);
    
    logger.info(`Successfully loaded sample training data for chatbot ${chatbot.name} (${chatbot._id})`);
    logger.info(`Training dataset ID: ${trainingDataset._id}`);
    
    // Disconnect from database
    await disconnectDB();
  } catch (error) {
    logger.error('Error in main function:', error.message);
  }
}

// Run main function if this script is executed directly
if (require.main === module) {
  main().catch(err => {
    logger.error('Unhandled error:', err);
    process.exit(1);
  });
}

module.exports = {
  loadSampleTrainingData
};
