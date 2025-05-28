/**
 * Knowledge Base Controller
 * 
 * Handles all knowledge base-related operations and API endpoints
 */

const knowledgeBaseService = require('../../services/knowledgeBase.service');
const { logger } = require('../../utils');
const { ValidationError } = require('../../utils/errors');

/**
 * Get all knowledge bases for a chatbot
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getKnowledgeBases = async (req, res, next) => {
  try {
    const { chatbotId } = req.params;
    
    logger.debug(`Getting knowledge bases for chatbot ${chatbotId}`);
    
    // Get knowledge bases from service
    const knowledgeBases = await knowledgeBaseService.getKnowledgeBasesByChatbotId(chatbotId);
    
    logger.info(`Retrieved ${knowledgeBases.length} knowledge bases for chatbot ${chatbotId}`);
    
    res.status(200).json({
      success: true,
      count: knowledgeBases.length,
      data: knowledgeBases
    });
  } catch (error) {
    logger.error('Error fetching knowledge bases:', error.message);
    next(error);
  }
};

/**
 * Create a new knowledge base
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.createKnowledgeBase = async (req, res, next) => {
  try {
    const { chatbotId } = req.params;
    const knowledgeBaseData = req.body;
    
    logger.debug(`Creating new knowledge base for chatbot ${chatbotId}`);
    
    // Validate required fields
    if (!knowledgeBaseData.name) {
      throw new ValidationError('Knowledge base name is required');
    }
    
    // Add chatbot ID to knowledge base data
    knowledgeBaseData.chatbotId = chatbotId;
    
    // Create knowledge base using service
    const knowledgeBase = await knowledgeBaseService.createKnowledgeBase(knowledgeBaseData);
    
    logger.info(`Created new knowledge base: ${knowledgeBase._id} (${knowledgeBase.name})`);
    
    res.status(201).json({
      success: true,
      data: knowledgeBase
    });
  } catch (error) {
    logger.error('Error creating knowledge base:', error.message);
    
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
 * Get knowledge base by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getKnowledgeBaseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    logger.debug(`Getting knowledge base by ID: ${id}`);
    
    // Get knowledge base by ID from service
    const knowledgeBase = await knowledgeBaseService.getKnowledgeBaseById(id);
    
    logger.info(`Retrieved knowledge base: ${id}`);
    
    res.status(200).json({
      success: true,
      data: knowledgeBase
    });
  } catch (error) {
    logger.error(`Error fetching knowledge base ${req.params.id}:`, error.message);
    
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
 * Update knowledge base
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateKnowledgeBase = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    logger.debug(`Updating knowledge base ${id}`);
    
    // Update knowledge base using service
    const knowledgeBase = await knowledgeBaseService.updateKnowledgeBase(id, updateData);
    
    logger.info(`Updated knowledge base ${id}`);
    
    res.status(200).json({
      success: true,
      data: knowledgeBase
    });
  } catch (error) {
    logger.error(`Error updating knowledge base ${req.params.id}:`, error.message);
    
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
 * Delete knowledge base
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.deleteKnowledgeBase = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    logger.debug(`Deleting knowledge base ${id}`);
    
    // Delete knowledge base using service
    await knowledgeBaseService.deleteKnowledgeBase(id);
    
    logger.info(`Deleted knowledge base ${id}`);
    
    res.status(200).json({
      success: true,
      message: `Knowledge base with ID ${id} successfully deleted`
    });
  } catch (error) {
    logger.error(`Error deleting knowledge base ${req.params.id}:`, error.message);
    
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
 * Add knowledge item to knowledge base
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.addKnowledgeItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const itemData = req.body;
    
    logger.debug(`Adding knowledge item to knowledge base ${id}`);
    
    // Validate required fields
    if (!itemData.title || !itemData.content) {
      throw new ValidationError('Knowledge item title and content are required');
    }
    
    // Add knowledge item using service
    const knowledgeBase = await knowledgeBaseService.addKnowledgeItem(id, itemData);
    
    logger.info(`Added knowledge item to knowledge base ${id}`);
    
    res.status(201).json({
      success: true,
      data: knowledgeBase
    });
  } catch (error) {
    logger.error(`Error adding knowledge item to knowledge base ${req.params.id}:`, error.message);
    
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
 * Update knowledge item
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateKnowledgeItem = async (req, res, next) => {
  try {
    const { id, itemId } = req.params;
    const itemData = req.body;
    
    logger.debug(`Updating knowledge item ${itemId} in knowledge base ${id}`);
    
    // Update knowledge item using service
    const knowledgeBase = await knowledgeBaseService.updateKnowledgeItem(id, itemId, itemData);
    
    logger.info(`Updated knowledge item ${itemId} in knowledge base ${id}`);
    
    res.status(200).json({
      success: true,
      data: knowledgeBase
    });
  } catch (error) {
    logger.error(`Error updating knowledge item ${req.params.itemId} in knowledge base ${req.params.id}:`, error.message);
    
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
 * Delete knowledge item
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.deleteKnowledgeItem = async (req, res, next) => {
  try {
    const { id, itemId } = req.params;
    
    logger.debug(`Deleting knowledge item ${itemId} from knowledge base ${id}`);
    
    // Delete knowledge item using service
    const knowledgeBase = await knowledgeBaseService.deleteKnowledgeItem(id, itemId);
    
    logger.info(`Deleted knowledge item ${itemId} from knowledge base ${id}`);
    
    res.status(200).json({
      success: true,
      message: `Knowledge item with ID ${itemId} successfully deleted`,
      data: knowledgeBase
    });
  } catch (error) {
    logger.error(`Error deleting knowledge item ${req.params.itemId} from knowledge base ${req.params.id}:`, error.message);
    
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
 * Search knowledge items
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.searchKnowledgeItems = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { query, tags, limit } = req.query;
    
    logger.debug(`Searching knowledge base ${id} for "${query}"`);
    
    // Validate query
    if (!query) {
      throw new ValidationError('Search query is required');
    }
    
    // Parse tags if provided
    const parsedTags = tags ? tags.split(',') : undefined;
    
    // Parse limit if provided
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    
    // Search knowledge items using service
    const results = await knowledgeBaseService.searchKnowledgeItems(id, query, {
      tags: parsedTags,
      limit: parsedLimit
    });
    
    logger.info(`Searched knowledge base ${id} for "${query}", found ${results.length} results`);
    
    res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    logger.error(`Error searching knowledge base ${req.params.id}:`, error.message);
    
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
