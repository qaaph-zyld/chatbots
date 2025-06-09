/**
 * Workflow Template Controller
 * 
 * Handles API requests for workflow templates
 */

require('@src/services\workflow-template.service');
require('@src/api\utils\response.utils');

/**
 * Get all available workflow templates
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTemplates = async (req, res) => {
  try {
    const templates = await WorkflowTemplateService.getTemplates();
    return handleSuccess(res, templates);
  } catch (error) {
    return handleError(res, error);
  }
};

/**
 * Get a specific template by ID
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTemplateById = async (req, res) => {
  try {
    const { templateId } = req.params;
    const template = await WorkflowTemplateService.getTemplateById(templateId);
    return handleSuccess(res, template);
  } catch (error) {
    return handleError(res, error);
  }
};

/**
 * Create a workflow from a template
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createWorkflowFromTemplate = async (req, res) => {
  try {
    const { chatbotId, templateId } = req.params;
    const userId = req.user.id; // Assuming authentication middleware sets req.user
    const customData = req.body;
    
    const workflow = await WorkflowTemplateService.createWorkflowFromTemplate(
      chatbotId,
      templateId,
      userId,
      customData
    );
    
    return handleSuccess(res, workflow);
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  getTemplates,
  getTemplateById,
  createWorkflowFromTemplate
};
