/**
 * Training Controller
 * 
 * Handles all training-related operations and API endpoints
 */

require('@src/services\training.service');
require('@src/utils');
require('@src/utils\errors');

/**
 * Get all training datasets for a chatbot
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getTrainingDatasets = async (req, res, next) => {
  try {
    const { chatbotId } = req.params;
    
    logger.debug(`Getting training datasets for chatbot ${chatbotId}`);
    
    // Get training datasets from service
    const trainingDatasets = await trainingService.getTrainingDatasetsByChatbotId(chatbotId);
    
    logger.info(`Retrieved ${trainingDatasets.length} training datasets for chatbot ${chatbotId}`);
    
    res.status(200).json({
      success: true,
      count: trainingDatasets.length,
      data: trainingDatasets
    });
  } catch (error) {
    logger.error('Error fetching training datasets:', error.message);
    next(error);
  }
};

/**
 * Create a new training dataset
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.createTrainingDataset = async (req, res, next) => {
  try {
    const { chatbotId } = req.params;
    const datasetData = req.body;
    
    logger.debug(`Creating new training dataset for chatbot ${chatbotId}`);
    
    // Validate required fields
    if (!datasetData.name) {
      throw new ValidationError('Training dataset name is required');
    }
    
    if (!datasetData.domain) {
      throw new ValidationError('Training domain is required');
    }
    
    // Add chatbot ID to dataset data
    datasetData.chatbotId = chatbotId;
    
    // Create training dataset using service
    const trainingDataset = await trainingService.createTrainingDataset(datasetData);
    
    logger.info(`Created new training dataset: ${trainingDataset._id} (${trainingDataset.name})`);
    
    res.status(201).json({
      success: true,
      data: trainingDataset
    });
  } catch (error) {
    logger.error('Error creating training dataset:', error.message);
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: error.message
      });
    }
    
    next(error);
  }
};

/**
 * Get training dataset by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getTrainingDatasetById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    logger.debug(`Getting training dataset by ID: ${id}`);
    
    // Get training dataset by ID from service
    const trainingDataset = await trainingService.getTrainingDatasetById(id);
    
    logger.info(`Retrieved training dataset: ${id}`);
    
    res.status(200).json({
      success: true,
      data: trainingDataset
    });
  } catch (error) {
    logger.error(`Error fetching training dataset ${req.params.id}:`, error.message);
    
    if (error.name === 'NotFoundError') {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: error.message
      });
    }
    
    next(error);
  }
};

/**
 * Update training dataset
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateTrainingDataset = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    logger.debug(`Updating training dataset ${id}`);
    
    // Update training dataset using service
    const trainingDataset = await trainingService.updateTrainingDataset(id, updateData);
    
    logger.info(`Updated training dataset ${id}`);
    
    res.status(200).json({
      success: true,
      data: trainingDataset
    });
  } catch (error) {
    logger.error(`Error updating training dataset ${req.params.id}:`, error.message);
    
    if (error.name === 'NotFoundError') {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: error.message
      });
    }
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: error.message
      });
    }
    
    next(error);
  }
};

/**
 * Delete training dataset
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.deleteTrainingDataset = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    logger.debug(`Deleting training dataset ${id}`);
    
    // Delete training dataset using service
    await trainingService.deleteTrainingDataset(id);
    
    logger.info(`Deleted training dataset ${id}`);
    
    res.status(200).json({
      success: true,
      message: `Training dataset with ID ${id} successfully deleted`
    });
  } catch (error) {
    logger.error(`Error deleting training dataset ${req.params.id}:`, error.message);
    
    if (error.name === 'NotFoundError') {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: error.message
      });
    }
    
    next(error);
  }
};

/**
 * Add training example to dataset
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.addTrainingExample = async (req, res, next) => {
  try {
    const { id } = req.params;
    const exampleData = req.body;
    
    logger.debug(`Adding training example to dataset ${id}`);
    
    // Validate required fields
    if (!exampleData.input || !exampleData.output) {
      throw new ValidationError('Training example input and output are required');
    }
    
    // Add training example using service
    const trainingDataset = await trainingService.addTrainingExample(id, exampleData);
    
    logger.info(`Added training example to dataset ${id}`);
    
    res.status(201).json({
      success: true,
      data: trainingDataset
    });
  } catch (error) {
    logger.error(`Error adding training example to dataset ${req.params.id}:`, error.message);
    
    if (error.name === 'NotFoundError') {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: error.message
      });
    }
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: error.message
      });
    }
    
    next(error);
  }
};

/**
 * Remove training example from dataset
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.removeTrainingExample = async (req, res, next) => {
  try {
    const { id, index } = req.params;
    
    logger.debug(`Removing training example from dataset ${id}`);
    
    // Remove training example using service
    const trainingDataset = await trainingService.removeTrainingExample(id, parseInt(index, 10));
    
    logger.info(`Removed training example from dataset ${id}`);
    
    res.status(200).json({
      success: true,
      data: trainingDataset
    });
  } catch (error) {
    logger.error(`Error removing training example from dataset ${req.params.id}:`, error.message);
    
    if (error.name === 'NotFoundError') {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: error.message
      });
    }
    
    next(error);
  }
};

/**
 * Train chatbot with dataset
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.trainChatbot = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    logger.debug(`Training chatbot with dataset ${id}`);
    
    // Train chatbot using service
    const result = await trainingService.trainChatbotWithDataset(id);
    
    logger.info(`Trained chatbot with dataset ${id}`);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Error training chatbot with dataset ${req.params.id}:`, error.message);
    
    if (error.name === 'NotFoundError') {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: error.message
      });
    }
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: error.message
      });
    }
    
    next(error);
  }
};
