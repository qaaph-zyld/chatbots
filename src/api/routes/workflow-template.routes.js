/**
 * Workflow Template Routes
 * 
 * Defines API routes for workflow templates
 */

const express = require('express');
const router = express.Router();
require('@src/api\controllers\workflow-template.controller');
require('@src/api\middleware\auth.middleware');

// Get all templates
router.get('/', authenticate, workflowTemplateController.getTemplates);

// Get template by ID
router.get('/:templateId', authenticate, workflowTemplateController.getTemplateById);

// Create workflow from template
router.post('/chatbots/:chatbotId/templates/:templateId', 
  authenticate, 
  workflowTemplateController.createWorkflowFromTemplate
);

module.exports = router;
