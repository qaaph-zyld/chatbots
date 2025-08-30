/**
 * Template Controller
 * 
 * Handles API requests for template management
 */

require('@src/templates\template.service');
require('@src/utils');

/**
 * Get all templates
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getAllTemplates(req, res) {
  try {
    const { category, search, sort, limit, offset } = req.query;
    
    // Build query
    const query = {};
    if (category) {
      query.category = category;
    }
    
    if (search) {
      // Simple search implementation - in a real app, you'd use a proper search engine
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build options
    const options = {
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0
    };
    
    if (sort) {
      const [field, order] = sort.split(':');
      options.sort = { [field]: order === 'desc' ? -1 : 1 };
    } else {
      options.sort = { name: 1 };
    }
    
    const templates = await templateService.getAllTemplates(query, options);
    
    res.json({
      success: true,
      data: templates,
      meta: {
        total: templates.length, // In a real app, you'd get the total count separately
        limit: options.limit,
        offset: options.offset
      }
    });
  } catch (error) {
    logger.error('Error getting templates:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve templates',
      message: error.message
    });
  }
}

/**
 * Get template by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getTemplateById(req, res) {
  try {
    const { id } = req.params;
    
    const template = await templateService.getTemplateById(id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
        message: `Template with ID ${id} not found`
      });
    }
    
    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    logger.error(`Error getting template ${req.params.id}:`, error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve template',
      message: error.message
    });
  }
}

/**
 * Create a new template
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function createTemplate(req, res) {
  try {
    const templateData = req.body;
    
    // Validate request
    if (!templateData || Object.keys(templateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Template data is required'
      });
    }
    
    const template = await templateService.createTemplate(templateData);
    
    res.status(201).json({
      success: true,
      data: template,
      message: 'Template created successfully'
    });
  } catch (error) {
    logger.error('Error creating template:', error.message);
    res.status(error.message.includes('required') ? 400 : 500).json({
      success: false,
      error: 'Failed to create template',
      message: error.message
    });
  }
}

/**
 * Update an existing template
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function updateTemplate(req, res) {
  try {
    const { id } = req.params;
    const templateData = req.body;
    
    // Validate request
    if (!templateData || Object.keys(templateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Template data is required'
      });
    }
    
    const template = await templateService.updateTemplate(id, templateData);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
        message: `Template with ID ${id} not found`
      });
    }
    
    res.json({
      success: true,
      data: template,
      message: 'Template updated successfully'
    });
  } catch (error) {
    logger.error(`Error updating template ${req.params.id}:`, error.message);
    res.status(error.message.includes('required') ? 400 : 500).json({
      success: false,
      error: 'Failed to update template',
      message: error.message
    });
  }
}

/**
 * Delete a template
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function deleteTemplate(req, res) {
  try {
    const { id } = req.params;
    
    const result = await templateService.deleteTemplate(id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
        message: `Template with ID ${id} not found`
      });
    }
    
    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    logger.error(`Error deleting template ${req.params.id}:`, error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to delete template',
      message: error.message
    });
  }
}

/**
 * Apply a template to a bot
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function applyTemplate(req, res) {
  try {
    const { templateId, botId } = req.params;
    const customizations = req.body || {};
    
    const bot = await templateService.applyTemplate(templateId, botId, customizations);
    
    if (!bot) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Template or bot not found'
      });
    }
    
    res.json({
      success: true,
      data: bot,
      message: 'Template applied successfully'
    });
  } catch (error) {
    logger.error(`Error applying template ${req.params.templateId} to bot ${req.params.botId}:`, error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to apply template',
      message: error.message
    });
  }
}

/**
 * Create a bot from a template
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function createBotFromTemplate(req, res) {
  try {
    const { templateId } = req.params;
    const { bot, customizations } = req.body;
    
    // Validate request
    if (!bot || Object.keys(bot).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Bot data is required'
      });
    }
    
    const createdBot = await templateService.createBotFromTemplate(
      templateId,
      bot,
      customizations || {}
    );
    
    if (!createdBot) {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
        message: `Template with ID ${templateId} not found`
      });
    }
    
    res.status(201).json({
      success: true,
      data: createdBot,
      message: 'Bot created successfully from template'
    });
  } catch (error) {
    logger.error(`Error creating bot from template ${req.params.templateId}:`, error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to create bot from template',
      message: error.message
    });
  }
}

module.exports = {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  applyTemplate,
  createBotFromTemplate
};
