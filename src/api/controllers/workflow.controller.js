/**
 * Workflow Controller
 * 
 * Handles API requests for workflow management and execution
 */

const workflowService = require('../../services/workflow.service');
const { logger } = require('../../utils');

/**
 * Create a new workflow
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createWorkflow = async (req, res) => {
  try {
    const workflowData = req.body;
    const userId = req.user.id;
    const chatbotId = req.params.chatbotId;
    
    // Add chatbot ID to workflow data
    workflowData.chatbotId = chatbotId;
    
    const workflow = await workflowService.createWorkflow(workflowData, userId);
    
    res.status(201).json({
      success: true,
      data: workflow
    });
  } catch (error) {
    logger.error(`Error creating workflow: ${error.message}`, error);
    
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get workflow by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getWorkflowById = async (req, res) => {
  try {
    const { workflowId, chatbotId } = req.params;
    
    const workflow = await workflowService.getWorkflowById(workflowId, chatbotId);
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: workflow
    });
  } catch (error) {
    logger.error(`Error getting workflow: ${error.message}`, error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get all workflows for a chatbot
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getWorkflowsByChatbot = async (req, res) => {
  try {
    const { chatbotId } = req.params;
    
    const workflows = await workflowService.getWorkflowsByChatbot(chatbotId);
    
    res.status(200).json({
      success: true,
      count: workflows.length,
      data: workflows
    });
  } catch (error) {
    logger.error(`Error getting workflows: ${error.message}`, error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update a workflow
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateWorkflow = async (req, res) => {
  try {
    const { workflowId, chatbotId } = req.params;
    const updateData = req.body;
    
    const workflow = await workflowService.updateWorkflow(workflowId, chatbotId, updateData);
    
    res.status(200).json({
      success: true,
      data: workflow
    });
  } catch (error) {
    logger.error(`Error updating workflow: ${error.message}`, error);
    
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Delete a workflow
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteWorkflow = async (req, res) => {
  try {
    const { workflowId, chatbotId } = req.params;
    
    await workflowService.deleteWorkflow(workflowId, chatbotId);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    logger.error(`Error deleting workflow: ${error.message}`, error);
    
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Start workflow execution
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.startWorkflowExecution = async (req, res) => {
  try {
    const { workflowId, chatbotId } = req.params;
    const { userId, conversationId, initialData } = req.body;
    
    const execution = await workflowService.startWorkflowExecution(
      workflowId,
      chatbotId,
      userId,
      conversationId,
      initialData
    );
    
    res.status(200).json({
      success: true,
      data: execution
    });
  } catch (error) {
    logger.error(`Error starting workflow execution: ${error.message}`, error);
    
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Process user input for workflow execution
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.processUserInput = async (req, res) => {
  try {
    const { executionId } = req.params;
    const { input } = req.body;
    
    const result = await workflowService.processUserInput(executionId, input);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Error processing user input: ${error.message}`, error);
    
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get workflow execution by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getWorkflowExecutionById = async (req, res) => {
  try {
    const { executionId } = req.params;
    
    const execution = await workflowService.getWorkflowExecutionById(executionId);
    
    if (!execution) {
      return res.status(404).json({
        success: false,
        error: 'Workflow execution not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: execution
    });
  } catch (error) {
    logger.error(`Error getting workflow execution: ${error.message}`, error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get all executions for a workflow
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getWorkflowExecutions = async (req, res) => {
  try {
    const { workflowId, chatbotId } = req.params;
    
    const executions = await workflowService.getWorkflowExecutions(workflowId, chatbotId);
    
    res.status(200).json({
      success: true,
      count: executions.length,
      data: executions
    });
  } catch (error) {
    logger.error(`Error getting workflow executions: ${error.message}`, error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get workflow analytics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getWorkflowAnalytics = async (req, res) => {
  try {
    const { workflowId, chatbotId } = req.params;
    const { startDate, endDate } = req.query;
    
    const analytics = await workflowService.getWorkflowAnalytics(workflowId, chatbotId, {
      startDate,
      endDate
    });
    
    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error(`Error getting workflow analytics: ${error.message}`, error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
