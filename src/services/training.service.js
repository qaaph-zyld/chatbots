/**
 * Training Service
 * 
 * Handles CRUD operations for training datasets and training sessions
 */

const TrainingDataset = require('../database/schemas/training.schema');
const Chatbot = require('../database/schemas/chatbot.schema');
const { logger } = require('../utils');
const { NotFoundError, ValidationError } = require('../utils/errors');

/**
 * Create a new training dataset
 * @param {Object} datasetData - Training dataset data
 * @returns {Promise<Object>} Created training dataset
 */
exports.createTrainingDataset = async (datasetData) => {
  try {
    // Validate chatbot exists
    const chatbotExists = await Chatbot.exists({ _id: datasetData.chatbotId });
    if (!chatbotExists) {
      throw new NotFoundError(`Chatbot with ID ${datasetData.chatbotId} not found`);
    }
    
    // Create training dataset
    const trainingDataset = new TrainingDataset(datasetData);
    await trainingDataset.save();
    
    logger.info(`Created new training dataset: ${trainingDataset._id} (${trainingDataset.name})`);
    
    return trainingDataset;
  } catch (error) {
    logger.error('Error creating training dataset:', error.message);
    throw error;
  }
};

/**
 * Get all training datasets for a chatbot
 * @param {string} chatbotId - Chatbot ID
 * @returns {Promise<Array>} List of training datasets
 */
exports.getTrainingDatasetsByChatbotId = async (chatbotId) => {
  try {
    // Validate chatbot exists
    const chatbotExists = await Chatbot.exists({ _id: chatbotId });
    if (!chatbotExists) {
      throw new NotFoundError(`Chatbot with ID ${chatbotId} not found`);
    }
    
    // Get training datasets
    const trainingDatasets = await TrainingDataset.find({ chatbotId });
    
    logger.info(`Retrieved ${trainingDatasets.length} training datasets for chatbot ${chatbotId}`);
    
    return trainingDatasets;
  } catch (error) {
    logger.error(`Error fetching training datasets for chatbot ${chatbotId}:`, error.message);
    throw error;
  }
};

/**
 * Get training dataset by ID
 * @param {string} id - Training dataset ID
 * @returns {Promise<Object>} Training dataset
 */
exports.getTrainingDatasetById = async (id) => {
  try {
    const trainingDataset = await TrainingDataset.findById(id);
    
    if (!trainingDataset) {
      throw new NotFoundError(`Training dataset with ID ${id} not found`);
    }
    
    logger.info(`Retrieved training dataset: ${id}`);
    
    return trainingDataset;
  } catch (error) {
    logger.error(`Error fetching training dataset ${id}:`, error.message);
    throw error;
  }
};

/**
 * Update training dataset
 * @param {string} id - Training dataset ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated training dataset
 */
exports.updateTrainingDataset = async (id, updateData) => {
  try {
    const trainingDataset = await TrainingDataset.findById(id);
    
    if (!trainingDataset) {
      throw new NotFoundError(`Training dataset with ID ${id} not found`);
    }
    
    // Update fields
    Object.keys(updateData).forEach(key => {
      // Don't update examples or sessions directly, use specific methods for that
      if (key !== 'examples' && key !== 'sessions' && key !== 'chatbotId') {
        trainingDataset[key] = updateData[key];
      }
    });
    
    await trainingDataset.save();
    
    logger.info(`Updated training dataset ${id}`);
    
    return trainingDataset;
  } catch (error) {
    logger.error(`Error updating training dataset ${id}:`, error.message);
    throw error;
  }
};

/**
 * Delete training dataset
 * @param {string} id - Training dataset ID
 * @returns {Promise<boolean>} True if deleted
 */
exports.deleteTrainingDataset = async (id) => {
  try {
    const result = await TrainingDataset.findByIdAndDelete(id);
    
    if (!result) {
      throw new NotFoundError(`Training dataset with ID ${id} not found`);
    }
    
    logger.info(`Deleted training dataset ${id}`);
    
    return true;
  } catch (error) {
    logger.error(`Error deleting training dataset ${id}:`, error.message);
    throw error;
  }
};

/**
 * Add training example to dataset
 * @param {string} datasetId - Training dataset ID
 * @param {Object} exampleData - Training example data
 * @returns {Promise<Object>} Updated training dataset
 */
exports.addTrainingExample = async (datasetId, exampleData) => {
  try {
    const trainingDataset = await TrainingDataset.findById(datasetId);
    
    if (!trainingDataset) {
      throw new NotFoundError(`Training dataset with ID ${datasetId} not found`);
    }
    
    // Validate required fields
    if (!exampleData.input || !exampleData.output) {
      throw new ValidationError('Training example input and output are required');
    }
    
    // Add example
    await trainingDataset.addExample(exampleData);
    
    logger.info(`Added training example to dataset ${datasetId}`);
    
    return trainingDataset;
  } catch (error) {
    logger.error(`Error adding training example to dataset ${datasetId}:`, error.message);
    throw error;
  }
};

/**
 * Remove training example from dataset
 * @param {string} datasetId - Training dataset ID
 * @param {number} index - Example index
 * @returns {Promise<Object>} Updated training dataset
 */
exports.removeTrainingExample = async (datasetId, index) => {
  try {
    const trainingDataset = await TrainingDataset.findById(datasetId);
    
    if (!trainingDataset) {
      throw new NotFoundError(`Training dataset with ID ${datasetId} not found`);
    }
    
    // Remove example
    await trainingDataset.removeExample(index);
    
    logger.info(`Removed training example from dataset ${datasetId}`);
    
    return trainingDataset;
  } catch (error) {
    logger.error(`Error removing training example from dataset ${datasetId}:`, error.message);
    throw error;
  }
};

/**
 * Start training session
 * @param {string} datasetId - Training dataset ID
 * @returns {Promise<Object>} Updated training dataset
 */
exports.startTrainingSession = async (datasetId) => {
  try {
    const trainingDataset = await TrainingDataset.findById(datasetId);
    
    if (!trainingDataset) {
      throw new NotFoundError(`Training dataset with ID ${datasetId} not found`);
    }
    
    // Check if there are any examples
    if (trainingDataset.examples.length === 0) {
      throw new ValidationError('Training dataset has no examples');
    }
    
    // Check if there's already an active session
    const activeSession = trainingDataset.sessions.find(session => session.status === 'in_progress');
    if (activeSession) {
      throw new ValidationError('There is already an active training session');
    }
    
    // Start training session
    await trainingDataset.startTrainingSession();
    
    logger.info(`Started training session for dataset ${datasetId}`);
    
    return trainingDataset;
  } catch (error) {
    logger.error(`Error starting training session for dataset ${datasetId}:`, error.message);
    throw error;
  }
};

/**
 * Complete training session
 * @param {string} datasetId - Training dataset ID
 * @param {Object} metrics - Training metrics
 * @returns {Promise<Object>} Updated training dataset
 */
exports.completeTrainingSession = async (datasetId, metrics) => {
  try {
    const trainingDataset = await TrainingDataset.findById(datasetId);
    
    if (!trainingDataset) {
      throw new NotFoundError(`Training dataset with ID ${datasetId} not found`);
    }
    
    // Complete training session
    await trainingDataset.completeTrainingSession(metrics);
    
    logger.info(`Completed training session for dataset ${datasetId}`);
    
    return trainingDataset;
  } catch (error) {
    logger.error(`Error completing training session for dataset ${datasetId}:`, error.message);
    throw error;
  }
};

/**
 * Fail training session
 * @param {string} datasetId - Training dataset ID
 * @param {string} error - Error message
 * @returns {Promise<Object>} Updated training dataset
 */
exports.failTrainingSession = async (datasetId, error) => {
  try {
    const trainingDataset = await TrainingDataset.findById(datasetId);
    
    if (!trainingDataset) {
      throw new NotFoundError(`Training dataset with ID ${datasetId} not found`);
    }
    
    // Fail training session
    await trainingDataset.failTrainingSession(error);
    
    logger.info(`Failed training session for dataset ${datasetId}: ${error}`);
    
    return trainingDataset;
  } catch (error) {
    logger.error(`Error failing training session for dataset ${datasetId}:`, error.message);
    throw error;
  }
};

/**
 * Train chatbot with dataset
 * @param {string} datasetId - Training dataset ID
 * @returns {Promise<Object>} Training result
 */
exports.trainChatbotWithDataset = async (datasetId) => {
  try {
    // Get training dataset
    const trainingDataset = await TrainingDataset.findById(datasetId);
    
    if (!trainingDataset) {
      throw new NotFoundError(`Training dataset with ID ${datasetId} not found`);
    }
    
    // Get chatbot
    const chatbot = await Chatbot.findById(trainingDataset.chatbotId);
    
    if (!chatbot) {
      throw new NotFoundError(`Chatbot with ID ${trainingDataset.chatbotId} not found`);
    }
    
    // Start training session
    await exports.startTrainingSession(datasetId);
    
    try {
      // Get chatbot service
      const chatbotService = require('../bot/core');
      
      // Get chatbot instance
      const chatbotInstance = chatbotService.getChatbot(trainingDataset.chatbotId.toString());
      
      if (!chatbotInstance) {
        throw new Error(`Chatbot instance with ID ${trainingDataset.chatbotId} not found`);
      }
      
      // Prepare training data
      const trainingData = trainingDataset.examples.map(example => ({
        input: example.input,
        output: example.output,
        metadata: example.metadata
      }));
      
      // Train chatbot
      const result = await chatbotService.trainChatbot(
        trainingDataset.chatbotId.toString(),
        trainingData,
        { domain: trainingDataset.domain }
      );
      
      // Complete training session
      await exports.completeTrainingSession(datasetId, result.metrics);
      
      logger.info(`Trained chatbot ${trainingDataset.chatbotId} with dataset ${datasetId}`);
      
      return result;
    } catch (trainingError) {
      // Fail training session
      await exports.failTrainingSession(datasetId, trainingError.message);
      
      logger.error(`Error training chatbot ${trainingDataset.chatbotId} with dataset ${datasetId}:`, trainingError.message);
      
      throw trainingError;
    }
  } catch (error) {
    logger.error(`Error training chatbot with dataset ${datasetId}:`, error.message);
    throw error;
  }
};
