/**
 * Workflow Service
 * 
 * Provides functionality for creating, managing, and executing conversation workflows.
 * This service is the core of the Advanced Workflow Builder feature.
 */

const mongoose = require('mongoose');
require('@src/models\workflow.model');
require('@src/models\workflow-execution.model');
require('@src/utils');
const axios = require('axios');

class WorkflowService {
  /**
   * Create a new workflow
   * @param {Object} workflowData - Workflow data
   * @param {String} userId - User ID creating the workflow
   * @returns {Promise<Object>} Created workflow
   */
  async createWorkflow(workflowData, userId) {
    try {
      logger.info(`Creating workflow for chatbot ${workflowData.chatbotId}`);
      
      // Validate workflow has a start node
      const hasStartNode = workflowData.nodes && 
        workflowData.nodes.some(node => node.type === 'start');
      
      if (!hasStartNode) {
        throw new Error('Workflow must have a start node');
      }
      
      // Create and save the workflow
      const workflow = new Workflow({ 
        ...workflowData,
        createdBy: userId
      });
      
      await workflow.save();
      logger.info(`Workflow created: ${workflow._id}`);
      
      return workflow;
    } catch (error) {
      logger.error(`Error creating workflow: ${error.message}`, error);
      throw error;
    }
  }
  
  /**
   * Get workflow by ID
   * @param {String} workflowId - Workflow ID
   * @param {String} chatbotId - Chatbot ID
   * @returns {Promise<Object>} Workflow
   */
  async getWorkflowById(workflowId, chatbotId) {
    try {
      const workflow = await Workflow.findOne({ _id: workflowId, chatbotId });
      
      if (!workflow) {
        logger.warn(`Workflow not found: ${workflowId}`);
        return null;
      }
      
      logger.info(`Retrieved workflow: ${workflowId}`);
      return workflow;
    } catch (error) {
      logger.error(`Error getting workflow ${workflowId}: ${error.message}`, error);
      throw error;
    }
  }
  
  /**
   * Get all workflows for a chatbot
   * @param {String} chatbotId - Chatbot ID
   * @returns {Promise<Array>} List of workflows
   */
  async getWorkflowsByChatbot(chatbotId) {
    try {
      const workflows = await Workflow.find({ chatbotId })
        .sort({ updatedAt: -1 });
      
      logger.info(`Retrieved ${workflows.length} workflows for chatbot ${chatbotId}`);
      return workflows;
    } catch (error) {
      logger.error(`Error getting workflows for chatbot ${chatbotId}: ${error.message}`, error);
      throw error;
    }
  }
  
  /**
   * Update a workflow
   * @param {String} workflowId - Workflow ID
   * @param {String} chatbotId - Chatbot ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated workflow
   */
  async updateWorkflow(workflowId, chatbotId, updateData) {
    try {
      // Find the workflow
      const workflow = await Workflow.findOne({ _id: workflowId, chatbotId });
      
      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }
      
      // Validate workflow still has a start node if nodes are being updated
      if (updateData.nodes) {
        const hasStartNode = updateData.nodes.some(node => node.type === 'start');
        
        if (!hasStartNode) {
          throw new Error('Workflow must have a start node');
        }
      }
      
      // Update fields
      Object.keys(updateData).forEach(key => {
        if (key !== '_id' && key !== 'chatbotId' && key !== 'createdBy') {
          workflow[key] = updateData[key];
        }
      });
      
      await workflow.save();
      logger.info(`Workflow updated: ${workflowId}`);
      
      return workflow;
    } catch (error) {
      logger.error(`Error updating workflow ${workflowId}: ${error.message}`, error);
      throw error;
    }
  }
  
  /**
   * Delete a workflow
   * @param {String} workflowId - Workflow ID
   * @param {String} chatbotId - Chatbot ID
   * @returns {Promise<Boolean>} True if deleted
   */
  async deleteWorkflow(workflowId, chatbotId) {
    try {
      // Check if there are any active executions
      const activeExecutions = await WorkflowExecution.find({
        workflowId,
        status: 'running'
      });
      
      if (activeExecutions.length > 0) {
        throw new Error('Cannot delete workflow with active executions');
      }
      
      // Delete all executions for this workflow
      await WorkflowExecution.deleteMany({ workflowId });
      
      // Delete the workflow
      const result = await Workflow.deleteOne({ _id: workflowId, chatbotId });
      
      if (result.deletedCount === 0) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }
      
      logger.info(`Workflow deleted: ${workflowId}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting workflow ${workflowId}: ${error.message}`, error);
      throw error;
    }
  }
  
  /**
   * Start workflow execution
   * @param {String} workflowId - Workflow ID
   * @param {String} chatbotId - Chatbot ID
   * @param {String} userId - User ID
   * @param {String} conversationId - Conversation ID
   * @param {Object} initialData - Initial data for workflow
   * @returns {Promise<Object>} Workflow execution
   */
  async startWorkflowExecution(workflowId, chatbotId, userId, conversationId, initialData = {}) {
    try {
      // Get the workflow
      const workflow = await Workflow.findOne({ 
        _id: workflowId, 
        chatbotId,
        isActive: true
      });
      
      if (!workflow) {
        throw new Error('Workflow not found or not active');
      }
      
      // Find the start node
      const startNode = workflow.nodes.find(node => node.type === 'start');
      
      if (!startNode) {
        throw new Error('Workflow has no start node');
      }
      
      // Create execution
      const execution = new WorkflowExecution({
        workflowId: workflow._id,
        chatbotId,
        userId,
        conversationId,
        currentNodeId: startNode.nodeId,
        status: 'running',
        data: initialData,
        startedAt: new Date()
      });
      
      await execution.save();
      logger.info(`Started workflow execution: ${execution._id}`);
      
      // Process the start node
      const result = await this.processNode(execution, startNode.nodeId, workflow);
      
      return execution;
    } catch (error) {
      logger.error(`Error starting workflow execution: ${error.message}`, error);
      throw error;
    }
  }
  
  /**
   * Process a workflow node
   * @param {Object} execution - Workflow execution
   * @param {String} nodeId - Node ID to process
   * @param {Object} workflow - Workflow object
   * @returns {Promise<Object>} Processing result
   */
  async processNode(execution, nodeId, workflow) {
    try {
      // Find the node
      const node = workflow.nodes.find(n => n.nodeId === nodeId);
      
      if (!node) {
        throw new Error(`Node not found: ${nodeId}`);
      }
      
      logger.info(`Processing node ${nodeId} (${node.type}) for execution ${execution._id}`);
      
      let result = {
        nextNodeId: null,
        output: {}
      };
      
      // Process based on node type
      switch (node.type) {
        case 'start':
          // Find the next node connected to start
          const startConnection = workflow.connections.find(conn => conn.sourceId === nodeId);
          result.nextNodeId = startConnection ? startConnection.targetId : null;
          break;
          
        case 'message':
          // Send a message
          result.output = {
            message: node.data.message,
            messageType: node.data.messageType || 'text'
          };
          
          // Find the next node
          const messageConnection = workflow.connections.find(conn => conn.sourceId === nodeId);
          result.nextNodeId = messageConnection ? messageConnection.targetId : null;
          break;
          
        case 'condition':
          // Evaluate condition
          const conditionResult = await this.evaluateCondition(node.data.condition, execution.data);
          
          // Find the connection based on condition result
          const conditionConnection = workflow.connections.find(conn => 
            conn.sourceId === nodeId && 
            (conditionResult ? conn.condition === 'true' : conn.condition === 'false')
          );
          
          result.nextNodeId = conditionConnection ? conditionConnection.targetId : null;
          break;
          
        case 'input':
          // Wait for user input
          execution.status = 'waiting_for_input';
          execution.waitingForInputType = node.data.inputType;
          await execution.save();
          
          result.output = {
            prompt: node.data.prompt,
            inputType: node.data.inputType,
            options: node.data.options
          };
          
          // Don't set nextNodeId yet, will be set when input is received
          break;
          
        case 'action':
          // Perform an action
          const actionResult = await this.performAction(node.data.action, execution.data);
          
          // Update execution data with action result
          execution.data = {
            ...execution.data,
            actionResult
          };
          
          await execution.save();
          
          // Find the next node
          const actionConnection = workflow.connections.find(conn => conn.sourceId === nodeId);
          result.nextNodeId = actionConnection ? actionConnection.targetId : null;
          break;
          
        case 'integration':
          // Call an integration
          const integrationResult = await this.callIntegration(
            node.data.integration,
            node.data.params,
            execution.data
          );
          
          // Update execution data with integration result
          execution.data = {
            ...execution.data,
            integrationResult
          };
          
          await execution.save();
          
          // Find the next node
          const integrationConnection = workflow.connections.find(conn => conn.sourceId === nodeId);
          result.nextNodeId = integrationConnection ? integrationConnection.targetId : null;
          break;
          
        case 'context':
          // Update context
          const contextResult = await this.updateContext(
            node.data.contextOperation,
            execution.userId,
            execution.chatbotId,
            execution.data
          );
          
          // Update execution data with context result
          execution.data = {
            ...execution.data,
            contextResult
          };
          
          await execution.save();
          
          // Find the next node
          const contextConnection = workflow.connections.find(conn => conn.sourceId === nodeId);
          result.nextNodeId = contextConnection ? contextConnection.targetId : null;
          break;
          
        case 'jump':
          // Jump to another node
          result.nextNodeId = node.data.targetNodeId;
          break;
          
        case 'end':
          // End the workflow
          execution.status = 'completed';
          execution.completedAt = new Date();
          await execution.save();
          
          logger.info(`Workflow execution completed: ${execution._id}`);
          break;
          
        default:
          logger.warn(`Unknown node type: ${node.type}`);
          break;
      }
      
      // Update execution with next node
      if (result.nextNodeId && execution.status === 'running') {
        execution.currentNodeId = result.nextNodeId;
        await execution.save();
        
        // Process the next node
        return this.processNode(execution, result.nextNodeId, workflow);
      }
      
      return result;
    } catch (error) {
      logger.error(`Error processing node ${nodeId}: ${error.message}`, error);
      
      // Update execution status to error
      execution.status = 'error';
      execution.error = error.message;
      await execution.save();
      
      throw error;
    }
  }
  
  /**
   * Evaluate a condition
   * @param {Object} condition - Condition to evaluate
   * @param {Object} data - Data to evaluate against
   * @returns {Promise<Boolean>} Condition result
   */
  async evaluateCondition(condition, data) {
    try {
      // Simple condition evaluation for now
      // This can be expanded to support more complex conditions
      
      const { field, operator, value } = condition;
      const fieldValue = this.getNestedValue(data, field);
      
      switch (operator) {
        case 'equals':
          return fieldValue === value;
        case 'notEquals':
          return fieldValue !== value;
        case 'contains':
          return String(fieldValue).includes(value);
        case 'notContains':
          return !String(fieldValue).includes(value);
        case 'greaterThan':
          return fieldValue > value;
        case 'lessThan':
          return fieldValue < value;
        case 'exists':
          return fieldValue !== undefined && fieldValue !== null;
        case 'notExists':
          return fieldValue === undefined || fieldValue === null;
        default:
          logger.warn(`Unknown operator: ${operator}`);
          return false;
      }
    } catch (error) {
      logger.error(`Error evaluating condition: ${error.message}`, error);
      return false;
    }
  }
  
  /**
   * Get a nested value from an object
   * @param {Object} obj - Object to get value from
   * @param {String} path - Path to value (e.g. 'user.name')
   * @returns {*} Value at path
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((o, i) => (o && o[i] !== undefined) ? o[i] : undefined, obj);
  }
  
  /**
   * Perform an action
   * @param {Object} action - Action to perform
   * @param {Object} data - Data for the action
   * @returns {Promise<Object>} Action result
   */
  async performAction(action, data) {
    try {
      // Different action types can be implemented here
      switch (action.type) {
        case 'setVariable':
          return {
            success: true,
            variable: action.variable,
            value: action.value
          };
          
        case 'calculateValue':
          // Simple expression evaluation
          // This can be expanded to support more complex calculations
          const result = eval(this.replaceVariables(action.expression, data));
          return {
            success: true,
            result
          };
          
        case 'delay':
          // Delay execution
          await new Promise(resolve => setTimeout(resolve, action.milliseconds));
          return {
            success: true,
            delayedMs: action.milliseconds
          };
          
        default:
          logger.warn(`Unknown action type: ${action.type}`);
          return {
            success: false,
            error: `Unknown action type: ${action.type}`
          };
      }
    } catch (error) {
      logger.error(`Error performing action: ${error.message}`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Replace variables in a string
   * @param {String} str - String with variables
   * @param {Object} data - Data to replace variables with
   * @returns {String} String with variables replaced
   */
  replaceVariables(str, data) {
    return str.replace(/\${([^}]+)}/g, (match, path) => {
      const value = this.getNestedValue(data, path);
      return value !== undefined ? value : match;
    });
  }
  
  /**
   * Call an integration
   * @param {Object} integration - Integration to call
   * @param {Object} params - Parameters for the integration
   * @param {Object} data - Data for the integration
   * @returns {Promise<Object>} Integration result
   */
  async callIntegration(integration, params, data) {
    try {
      // Different integration types can be implemented here
      switch (integration.type) {
        case 'http':
          // Make HTTP request
          const url = this.replaceVariables(integration.url, data);
          const method = integration.method || 'GET';
          const headers = integration.headers || {};
          const requestData = integration.data ? JSON.parse(this.replaceVariables(JSON.stringify(integration.data), data)) : null;
          
          const response = await axios({
            method,
            url,
            headers,
            data: requestData
          });
          
          return {
            success: true,
            status: response.status,
            data: response.data
          };
          
        case 'database':
          // Database operations
          // This would need to be implemented based on the specific database being used
          return {
            success: false,
            error: 'Database integrations not implemented yet'
          };
          
        default:
          logger.warn(`Unknown integration type: ${integration.type}`);
          return {
            success: false,
            error: `Unknown integration type: ${integration.type}`
          };
      }
    } catch (error) {
      logger.error(`Error calling integration: ${error.message}`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Update context
   * @param {Object} operation - Context operation
   * @param {String} userId - User ID
   * @param {String} chatbotId - Chatbot ID
   * @param {Object} data - Data for the operation
   * @returns {Promise<Object>} Context update result
   */
  async updateContext(operation, userId, chatbotId, data) {
    try {
      // Different context operations can be implemented here
      switch (operation.type) {
        case 'setPreference':
          // Set user preference
          // This would need to integrate with the preference service
          return {
            success: false,
            error: 'Preference operations not implemented yet'
          };
          
        case 'trackEntity':
          // Track entity
          // This would need to integrate with the entity tracking service
          return {
            success: false,
            error: 'Entity tracking operations not implemented yet'
          };
          
        case 'detectTopic':
          // Detect topic
          // This would need to integrate with the topic detection service
          return {
            success: false,
            error: 'Topic detection operations not implemented yet'
          };
          
        default:
          logger.warn(`Unknown context operation type: ${operation.type}`);
          return {
            success: false,
            error: `Unknown context operation type: ${operation.type}`
          };
      }
    } catch (error) {
      logger.error(`Error updating context: ${error.message}`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Process user input for a workflow execution
   * @param {String} executionId - Execution ID
   * @param {*} input - User input
   * @returns {Promise<Object>} Processing result
   */
  async processUserInput(executionId, input) {
    try {
      // Get the execution
      const execution = await WorkflowExecution.findById(executionId);
      
      if (!execution) {
        throw new Error(`Execution not found: ${executionId}`);
      }
      
      if (execution.status !== 'waiting_for_input') {
        throw new Error(`Execution not waiting for input: ${executionId}`);
      }
      
      // Get the workflow
      const workflow = await Workflow.findById(execution.workflowId);
      
      if (!workflow) {
        throw new Error(`Workflow not found: ${execution.workflowId}`);
      }
      
      // Find the current node
      const node = workflow.nodes.find(n => n.nodeId === execution.currentNodeId);
      
      if (!node || node.type !== 'input') {
        throw new Error(`Current node is not an input node: ${execution.currentNodeId}`);
      }
      
      // Update execution data with input
      execution.data = {
        ...execution.data,
        input
      };
      
      // Update execution status
      execution.status = 'running';
      execution.waitingForInputType = null;
      
      await execution.save();
      
      // Find the next node
      const connection = workflow.connections.find(conn => conn.sourceId === node.nodeId);
      
      if (!connection) {
        throw new Error(`No connection found for node: ${node.nodeId}`);
      }
      
      // Process the next node
      const result = await this.processNode(execution, connection.targetId, workflow);
      
      return result;
    } catch (error) {
      logger.error(`Error processing user input: ${error.message}`, error);
      throw error;
    }
  }
  
  /**
   * Get workflow execution by ID
   * @param {String} executionId - Execution ID
   * @returns {Promise<Object>} Workflow execution
   */
  async getWorkflowExecutionById(executionId) {
    try {
      const execution = await WorkflowExecution.findById(executionId);
      
      if (!execution) {
        logger.warn(`Workflow execution not found: ${executionId}`);
        return null;
      }
      
      logger.info(`Retrieved workflow execution: ${executionId}`);
      return execution;
    } catch (error) {
      logger.error(`Error getting workflow execution ${executionId}: ${error.message}`, error);
      throw error;
    }
  }
  
  /**
   * Get all executions for a workflow
   * @param {String} workflowId - Workflow ID
   * @param {String} chatbotId - Chatbot ID
   * @returns {Promise<Array>} List of workflow executions
   */
  async getWorkflowExecutions(workflowId, chatbotId) {
    try {
      const executions = await WorkflowExecution.find({ workflowId, chatbotId })
        .sort({ startedAt: -1 });
      
      logger.info(`Retrieved ${executions.length} executions for workflow ${workflowId}`);
      return executions;
    } catch (error) {
      logger.error(`Error getting executions for workflow ${workflowId}: ${error.message}`, error);
      throw error;
    }
  }
  
  /**
   * Get workflow execution analytics
   * @param {String} workflowId - Workflow ID
   * @param {String} chatbotId - Chatbot ID
   * @param {Object} options - Analytics options
   * @returns {Promise<Object>} Workflow analytics
   */
  async getWorkflowAnalytics(workflowId, chatbotId, options = {}) {
    try {
      const { startDate, endDate } = options;
      
      // Build query
      const query = { workflowId, chatbotId };
      
      if (startDate || endDate) {
        query.startedAt = {};
        
        if (startDate) {
          query.startedAt.$gte = new Date(startDate);
        }
        
        if (endDate) {
          query.startedAt.$lte = new Date(endDate);
        }
      }
      
      // Get executions
      const executions = await WorkflowExecution.find(query);
      
      // Calculate analytics
      const totalExecutions = executions.length;
      const completedExecutions = executions.filter(e => e.status === 'completed').length;
      const errorExecutions = executions.filter(e => e.status === 'error').length;
      const runningExecutions = executions.filter(e => e.status === 'running').length;
      const waitingExecutions = executions.filter(e => e.status === 'waiting_for_input').length;
      
      // Calculate completion rate
      const completionRate = totalExecutions > 0 
        ? (completedExecutions / totalExecutions) * 100 
        : 0;
      
      // Calculate average execution time
      const completedExecutionTimes = executions
        .filter(e => e.status === 'completed' && e.completedAt)
        .map(e => e.completedAt - e.startedAt);
      
      const averageExecutionTime = completedExecutionTimes.length > 0
        ? completedExecutionTimes.reduce((sum, time) => sum + time, 0) / completedExecutionTimes.length
        : 0;
      
      return {
        totalExecutions,
        completedExecutions,
        errorExecutions,
        runningExecutions,
        waitingExecutions,
        completionRate,
        averageExecutionTime,
        executionsByStatus: {
          completed: completedExecutions,
          error: errorExecutions,
          running: runningExecutions,
          waiting_for_input: waitingExecutions
        }
      };
    } catch (error) {
      logger.error(`Error getting analytics for workflow ${workflowId}: ${error.message}`, error);
      throw error;
    }
  }
}

// Create singleton instance
const workflowService = new WorkflowService();

module.exports = workflowService;
