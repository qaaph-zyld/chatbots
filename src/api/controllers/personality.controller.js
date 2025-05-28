/**
 * Personality Controller
 * 
 * Handles all personality-related operations and API endpoints
 */

const personalityService = require('../../services/personality.service');
const { logger } = require('../../utils');
const { ValidationError } = require('../../utils/errors');

/**
 * Get all personalities for a chatbot
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getPersonalities = async (req, res, next) => {
  try {
    const { chatbotId } = req.params;
    
    logger.debug(`Getting personalities for chatbot ${chatbotId}`);
    
    // Get personalities from service
    const personalities = await personalityService.getPersonalitiesByChatbotId(chatbotId);
    
    logger.info(`Retrieved ${personalities.length} personalities for chatbot ${chatbotId}`);
    
    res.status(200).json({
      success: true,
      count: personalities.length,
      data: personalities
    });
  } catch (error) {
    logger.error('Error fetching personalities:', error.message);
    next(error);
  }
};

/**
 * Create a new personality
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.createPersonality = async (req, res, next) => {
  try {
    const { chatbotId } = req.params;
    const personalityData = req.body;
    
    logger.debug(`Creating new personality for chatbot ${chatbotId}`);
    
    // Validate required fields
    if (!personalityData.name) {
      throw new ValidationError('Personality name is required');
    }
    
    // Add chatbot ID to personality data
    personalityData.chatbotId = chatbotId;
    
    // Create personality using service
    const personality = await personalityService.createPersonality(personalityData);
    
    logger.info(`Created new personality: ${personality._id} (${personality.name})`);
    
    res.status(201).json({
      success: true,
      data: personality
    });
  } catch (error) {
    logger.error('Error creating personality:', error.message);
    
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
 * Get personality by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getPersonalityById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    logger.debug(`Getting personality by ID: ${id}`);
    
    // Get personality by ID from service
    const personality = await personalityService.getPersonalityById(id);
    
    if (!personality) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Personality with ID ${id} not found`
      });
    }
    
    logger.info(`Retrieved personality: ${id}`);
    
    res.status(200).json({
      success: true,
      data: personality
    });
  } catch (error) {
    logger.error(`Error fetching personality ${req.params.id}:`, error.message);
    next(error);
  }
};

/**
 * Update personality by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updatePersonality = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    logger.debug(`Updating personality ${id}`);
    
    // Update personality using service
    const personality = await personalityService.updatePersonality(id, updateData);
    
    if (!personality) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Personality with ID ${id} not found`
      });
    }
    
    logger.info(`Updated personality ${id}`);
    
    res.status(200).json({
      success: true,
      data: personality
    });
  } catch (error) {
    logger.error(`Error updating personality ${req.params.id}:`, error.message);
    
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
 * Delete personality by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.deletePersonality = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    logger.debug(`Deleting personality ${id}`);
    
    // Delete personality using service
    const result = await personalityService.deletePersonality(id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Personality with ID ${id} not found`
      });
    }
    
    logger.info(`Deleted personality ${id}`);
    
    res.status(200).json({
      success: true,
      message: `Personality with ID ${id} successfully deleted`
    });
  } catch (error) {
    logger.error(`Error deleting personality ${req.params.id}:`, error.message);
    next(error);
  }
};

/**
 * Set personality as default for a chatbot
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.setAsDefault = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    logger.debug(`Setting personality ${id} as default`);
    
    // Set as default using service
    const personality = await personalityService.setAsDefault(id);
    
    if (!personality) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Personality with ID ${id} not found`
      });
    }
    
    logger.info(`Set personality ${id} as default for chatbot ${personality.chatbotId}`);
    
    res.status(200).json({
      success: true,
      data: personality
    });
  } catch (error) {
    logger.error(`Error setting personality ${req.params.id} as default:`, error.message);
    next(error);
  }
};

/**
 * Generate prompt modifier for a personality
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.generatePromptModifier = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    logger.debug(`Generating prompt modifier for personality ${id}`);
    
    // Get personality by ID
    const personality = await personalityService.getPersonalityById(id);
    
    if (!personality) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Personality with ID ${id} not found`
      });
    }
    
    // Generate prompt modifier
    const promptModifier = await personalityService.generatePromptModifier(id);
    
    logger.info(`Generated prompt modifier for personality ${id}`);
    
    res.status(200).json({
      success: true,
      data: {
        personalityId: id,
        personalityName: personality.name,
        promptModifier
      }
    });
  } catch (error) {
    logger.error(`Error generating prompt modifier for personality ${req.params.id}:`, error.message);
    next(error);
  }
};

/**
 * Create default personality for a chatbot
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.createDefaultPersonality = async (req, res, next) => {
  try {
    const { chatbotId } = req.params;
    const { name } = req.body;
    
    logger.debug(`Creating default personality for chatbot ${chatbotId}`);
    
    // Create default personality using service
    const personality = await personalityService.createDefaultPersonality(chatbotId, name || 'Default');
    
    logger.info(`Created default personality: ${personality._id} (${personality.name})`);
    
    res.status(201).json({
      success: true,
      data: personality
    });
  } catch (error) {
    logger.error(`Error creating default personality for chatbot ${req.params.chatbotId}:`, error.message);
    next(error);
  }
};
