/**
 * Advanced Template Controller
 * 
 * Handles API requests for advanced template operations
 */

require('@src/services\advanced-template.service');
require('@src/utils');
require('@src/utils\errors');

/**
 * Create a template with inheritance
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createTemplateWithInheritance = async (req, res) => {
  try {
    const { parentTemplateId } = req.params;
    const userId = req.user.id;
    
    const template = await advancedTemplateService.createTemplateWithInheritance(
      parentTemplateId,
      req.body,
      userId
    );
    
    res.status(201).json({
      success: true,
      template
    });
  } catch (error) {
    logger.error('Error in createTemplateWithInheritance controller', {
      error: error.message,
      userId: req.user.id,
      parentTemplateId: req.params.parentTemplateId
    });
    
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create template with inheritance'
    });
  }
};

/**
 * Create a composite template
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createCompositeTemplate = async (req, res) => {
  try {
    const { sourceTemplateIds, templateData, compositionRules } = req.body;
    const userId = req.user.id;
    
    const template = await advancedTemplateService.createCompositeTemplate(
      sourceTemplateIds,
      templateData,
      compositionRules,
      userId
    );
    
    res.status(201).json({
      success: true,
      template
    });
  } catch (error) {
    logger.error('Error in createCompositeTemplate controller', {
      error: error.message,
      userId: req.user.id
    });
    
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create composite template'
    });
  }
};

/**
 * Create a new version of a template
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createTemplateVersion = async (req, res) => {
  try {
    const { templateId } = req.params;
    const userId = req.user.id;
    
    const template = await advancedTemplateService.createTemplateVersion(
      templateId,
      req.body,
      userId
    );
    
    res.status(201).json({
      success: true,
      template
    });
  } catch (error) {
    logger.error('Error in createTemplateVersion controller', {
      error: error.message,
      userId: req.user.id,
      templateId: req.params.templateId
    });
    
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create template version'
    });
  }
};

/**
 * Apply variables to a template
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.applyTemplateVariables = async (req, res) => {
  try {
    const { templateId } = req.params;
    const { variables } = req.body;
    
    const template = await advancedTemplateService.applyTemplateVariables(
      templateId,
      variables
    );
    
    res.status(200).json({
      success: true,
      template
    });
  } catch (error) {
    logger.error('Error in applyTemplateVariables controller', {
      error: error.message,
      templateId: req.params.templateId
    });
    
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to apply template variables'
    });
  }
};

/**
 * Get template variables schema
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getTemplateVariablesSchema = async (req, res) => {
  try {
    const { templateId } = req.params;
    
    const schema = await advancedTemplateService.getTemplateVariablesSchema(templateId);
    
    res.status(200).json({
      success: true,
      schema
    });
  } catch (error) {
    logger.error('Error in getTemplateVariablesSchema controller', {
      error: error.message,
      templateId: req.params.templateId
    });
    
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to get template variables schema'
    });
  }
};

/**
 * Set template styling
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.setTemplateStyling = async (req, res) => {
  try {
    const { templateId } = req.params;
    const userId = req.user.id;
    
    const template = await advancedTemplateService.setTemplateStyling(
      templateId,
      req.body,
      userId
    );
    
    res.status(200).json({
      success: true,
      template
    });
  } catch (error) {
    logger.error('Error in setTemplateStyling controller', {
      error: error.message,
      userId: req.user.id,
      templateId: req.params.templateId
    });
    
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to set template styling'
    });
  }
};

/**
 * Get templates with advanced filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getTemplatesAdvanced = async (req, res) => {
  try {
    const filters = {
      categories: req.query.categories ? req.query.categories.split(',') : undefined,
      tags: req.query.tags ? req.query.tags.split(',') : undefined,
      creator: req.query.creator,
      isPublic: req.query.isPublic !== undefined ? req.query.isPublic === 'true' : undefined,
      featured: req.query.featured !== undefined ? req.query.featured === 'true' : undefined,
      official: req.query.official !== undefined ? req.query.official === 'true' : undefined,
      status: req.query.status,
      search: req.query.search,
      hasVariables: req.query.hasVariables === 'true',
      hasStyling: req.query.hasStyling === 'true',
      isComposite: req.query.isComposite === 'true',
      isInherited: req.query.isInherited === 'true',
      minVersion: req.query.minVersion ? parseInt(req.query.minVersion, 10) : undefined
    };
    
    const options = {
      page: req.query.page ? parseInt(req.query.page, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit, 10) : 10,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder
    };
    
    const result = await advancedTemplateService.getTemplatesAdvanced(filters, options);
    
    res.status(200).json({
      success: true,
      templates: result.templates,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Error in getTemplatesAdvanced controller', {
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to get templates'
    });
  }
};
