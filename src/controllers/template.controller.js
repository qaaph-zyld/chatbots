/**
 * Template Controller
 * 
 * This controller handles HTTP requests related to chatbot templates,
 * providing endpoints for template management and the template gallery.
 */

const templateService = require('../services/template.service');
const { validateRequest } = require('../utils/validator');
const logger = require('../utils/logger');

/**
 * Create a new template
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createTemplate = async (req, res) => {
  try {
    // Validate request
    const validationRules = {
      name: 'required|string|max:100',
      description: 'required|string|max:500',
      category: 'required|string|in:customer-service,sales,support,education,entertainment,productivity,other',
      tags: 'array',
      'tags.*': 'string|max:30',
      configuration: 'required|object',
      'configuration.personality': 'required|object',
      previewImage: 'string|nullable',
      isPublic: 'boolean'
    };
    
    const validation = validateRequest(req.body, validationRules);
    if (!validation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: validation.errors 
      });
    }
    
    // Create template
    const template = await templateService.createTemplate(req.body, req.user.id);
    
    return res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: template
    });
  } catch (error) {
    logger.error('Error in createTemplate controller', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Failed to create template',
      error: error.message
    });
  }
};

/**
 * Create a template from an existing chatbot
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createTemplateFromChatbot = async (req, res) => {
  try {
    const { chatbotId } = req.params;
    
    // Validate request
    const validationRules = {
      name: 'string|max:100',
      description: 'string|max:500',
      category: 'string|in:customer-service,sales,support,education,entertainment,productivity,other',
      tags: 'array',
      'tags.*': 'string|max:30',
      previewImage: 'string|nullable',
      isPublic: 'boolean'
    };
    
    const validation = validateRequest(req.body, validationRules);
    if (!validation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: validation.errors 
      });
    }
    
    // Create template from chatbot
    const template = await templateService.createTemplateFromChatbot(
      chatbotId, 
      req.body, 
      req.user.id
    );
    
    return res.status(201).json({
      success: true,
      message: 'Template created from chatbot successfully',
      data: template
    });
  } catch (error) {
    logger.error('Error in createTemplateFromChatbot controller', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Failed to create template from chatbot',
      error: error.message
    });
  }
};

/**
 * Get template by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getTemplateById = async (req, res) => {
  try {
    const { templateId } = req.params;
    
    // Get template
    const template = await templateService.getTemplateById(templateId);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    // Check if template is public or belongs to the user
    if (!template.isPublic && template.creator.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to access this template'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: template
    });
  } catch (error) {
    logger.error('Error in getTemplateById controller', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Failed to get template',
      error: error.message
    });
  }
};

/**
 * Update template
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    
    // Validate request
    const validationRules = {
      name: 'string|max:100',
      description: 'string|max:500',
      category: 'string|in:customer-service,sales,support,education,entertainment,productivity,other',
      tags: 'array',
      'tags.*': 'string|max:30',
      configuration: 'object',
      'configuration.personality': 'object',
      previewImage: 'string|nullable',
      isPublic: 'boolean',
      status: 'string|in:draft,published,archived'
    };
    
    const validation = validateRequest(req.body, validationRules);
    if (!validation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: validation.errors 
      });
    }
    
    // Update template
    const template = await templateService.updateTemplate(
      templateId, 
      req.body, 
      req.user.id
    );
    
    return res.status(200).json({
      success: true,
      message: 'Template updated successfully',
      data: template
    });
  } catch (error) {
    logger.error('Error in updateTemplate controller', { error: error.message });
    
    if (error.message === 'Template not found') {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    if (error.message === 'Unauthorized to update this template') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this template'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Failed to update template',
      error: error.message
    });
  }
};

/**
 * Delete template
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    
    // Delete template
    await templateService.deleteTemplate(templateId, req.user.id);
    
    return res.status(200).json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    logger.error('Error in deleteTemplate controller', { error: error.message });
    
    if (error.message === 'Template not found') {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    if (error.message === 'Unauthorized to delete this template') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this template'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Failed to delete template',
      error: error.message
    });
  }
};

/**
 * Create chatbot from template
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createChatbotFromTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    
    // Validate request
    const validationRules = {
      name: 'string|max:100',
      description: 'string|max:500'
    };
    
    const validation = validateRequest(req.body, validationRules);
    if (!validation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: validation.errors 
      });
    }
    
    // Create chatbot from template
    const chatbot = await templateService.createChatbotFromTemplate(
      templateId, 
      req.body, 
      req.user.id
    );
    
    return res.status(201).json({
      success: true,
      message: 'Chatbot created from template successfully',
      data: chatbot
    });
  } catch (error) {
    logger.error('Error in createChatbotFromTemplate controller', { error: error.message });
    
    if (error.message === 'Template not found') {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Failed to create chatbot from template',
      error: error.message
    });
  }
};

/**
 * Get featured templates
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getFeaturedTemplates = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 5;
    
    // Get featured templates
    const templates = await templateService.getFeaturedTemplates(limit);
    
    return res.status(200).json({
      success: true,
      data: templates
    });
  } catch (error) {
    logger.error('Error in getFeaturedTemplates controller', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Failed to get featured templates',
      error: error.message
    });
  }
};

/**
 * Get popular templates
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getPopularTemplates = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    
    // Get popular templates
    const templates = await templateService.getPopularTemplates(limit);
    
    return res.status(200).json({
      success: true,
      data: templates
    });
  } catch (error) {
    logger.error('Error in getPopularTemplates controller', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Failed to get popular templates',
      error: error.message
    });
  }
};

/**
 * Get templates by category
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getTemplatesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    
    // Get templates by category
    const templates = await templateService.getTemplatesByCategory(category, limit);
    
    return res.status(200).json({
      success: true,
      data: templates
    });
  } catch (error) {
    logger.error('Error in getTemplatesByCategory controller', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Failed to get templates by category',
      error: error.message
    });
  }
};

/**
 * Search templates
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.searchTemplates = async (req, res) => {
  try {
    const { query } = req.query;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    // Search templates
    const templates = await templateService.searchTemplates(query, limit);
    
    return res.status(200).json({
      success: true,
      data: templates
    });
  } catch (error) {
    logger.error('Error in searchTemplates controller', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Failed to search templates',
      error: error.message
    });
  }
};

/**
 * Get user templates
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getUserTemplates = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    
    // Check if user is requesting their own templates or is an admin
    if (userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to access these templates'
      });
    }
    
    // Get user templates
    const templates = await templateService.getUserTemplates(userId, limit);
    
    return res.status(200).json({
      success: true,
      data: templates
    });
  } catch (error) {
    logger.error('Error in getUserTemplates controller', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Failed to get user templates',
      error: error.message
    });
  }
};

/**
 * Add review to template
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.addReview = async (req, res) => {
  try {
    const { templateId } = req.params;
    
    // Validate request
    const validationRules = {
      rating: 'required|integer|min:1|max:5',
      comment: 'string|max:500'
    };
    
    const validation = validateRequest(req.body, validationRules);
    if (!validation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: validation.errors 
      });
    }
    
    // Add review
    const template = await templateService.addReview(
      templateId,
      req.user.id,
      req.body.rating,
      req.body.comment || ''
    );
    
    return res.status(200).json({
      success: true,
      message: 'Review added successfully',
      data: {
        rating: template.rating
      }
    });
  } catch (error) {
    logger.error('Error in addReview controller', { error: error.message });
    
    if (error.message === 'Template not found') {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Failed to add review',
      error: error.message
    });
  }
};

/**
 * Export template
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.exportTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    
    // Export template
    const exportData = await templateService.exportTemplate(templateId);
    
    return res.status(200).json({
      success: true,
      data: exportData
    });
  } catch (error) {
    logger.error('Error in exportTemplate controller', { error: error.message });
    
    if (error.message === 'Template not found') {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Failed to export template',
      error: error.message
    });
  }
};

/**
 * Import template
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.importTemplate = async (req, res) => {
  try {
    // Validate request
    if (!req.body || !req.body.name || !req.body.configuration) {
      return res.status(400).json({
        success: false,
        message: 'Invalid template import data'
      });
    }
    
    // Import template
    const template = await templateService.importTemplate(req.body, req.user.id);
    
    return res.status(201).json({
      success: true,
      message: 'Template imported successfully',
      data: template
    });
  } catch (error) {
    logger.error('Error in importTemplate controller', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Failed to import template',
      error: error.message
    });
  }
};
