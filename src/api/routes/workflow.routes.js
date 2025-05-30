/**
 * Workflow Routes
 * 
 * Defines API endpoints for the Advanced Workflow Builder
 */

const express = require('express');
const router = express.Router();
const workflowController = require('../controllers/workflow.controller');
const { authenticateToken, hasPermission } = require('../../auth/auth.middleware');

// Workflow management routes
router.post('/chatbots/:chatbotId/workflows', 
  authenticateToken, 
  hasPermission('chatbot:write'), 
  workflowController.createWorkflow
);

router.get('/chatbots/:chatbotId/workflows', 
  authenticateToken, 
  hasPermission('chatbot:read'), 
  workflowController.getWorkflowsByChatbot
);

router.get('/chatbots/:chatbotId/workflows/:workflowId', 
  authenticateToken, 
  hasPermission('chatbot:read'), 
  workflowController.getWorkflowById
);

router.put('/chatbots/:chatbotId/workflows/:workflowId', 
  authenticateToken, 
  hasPermission('chatbot:write'), 
  workflowController.updateWorkflow
);

router.delete('/chatbots/:chatbotId/workflows/:workflowId', 
  authenticateToken, 
  hasPermission('chatbot:delete'), 
  workflowController.deleteWorkflow
);

// Workflow execution routes
router.post('/chatbots/:chatbotId/workflows/:workflowId/execute', 
  authenticateToken, 
  hasPermission('chatbot:write'), 
  workflowController.startWorkflowExecution
);

router.post('/workflow-executions/:executionId/input', 
  authenticateToken, 
  hasPermission('chatbot:write'), 
  workflowController.processUserInput
);

router.get('/workflow-executions/:executionId', 
  authenticateToken, 
  hasPermission('chatbot:read'), 
  workflowController.getWorkflowExecutionById
);

router.get('/chatbots/:chatbotId/workflows/:workflowId/executions', 
  authenticateToken, 
  hasPermission('chatbot:read'), 
  workflowController.getWorkflowExecutions
);

// Workflow analytics routes
router.get('/chatbots/:chatbotId/workflows/:workflowId/analytics', 
  authenticateToken, 
  hasPermission('analytics:read'), 
  workflowController.getWorkflowAnalytics
);

module.exports = router;
