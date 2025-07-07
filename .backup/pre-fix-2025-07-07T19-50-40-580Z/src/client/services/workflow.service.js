import axios from 'axios';

// Configure axios with proxy as specified in user requirements
axios.defaults.proxy = {
  host: '104.129.196.38',
  port: 10563
};

/**
 * Client-side Workflow Service
 * 
 * Handles API interactions with the backend workflow service
 */
class WorkflowService {
  /**
   * Get all workflows for a chatbot
   * @param {string} chatbotId - ID of the chatbot
   * @returns {Promise<Array>} - List of workflows
   */
  static async getWorkflows(chatbotId) {
    try {
      const response = await axios.get(`/api/chatbots/${chatbotId}/workflows`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get workflows');
      }
    } catch (error) {
      console.error('Error getting workflows:', error);
      throw error;
    }
  }
  
  /**
   * Get a workflow by ID
   * @param {string} chatbotId - ID of the chatbot
   * @param {string} workflowId - ID of the workflow
   * @returns {Promise<Object>} - Workflow data
   */
  static async getWorkflowById(chatbotId, workflowId) {
    try {
      const response = await axios.get(`/api/chatbots/${chatbotId}/workflows/${workflowId}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get workflow');
      }
    } catch (error) {
      console.error('Error getting workflow:', error);
      throw error;
    }
  }
  
  /**
   * Create a new workflow
   * @param {string} chatbotId - ID of the chatbot
   * @param {Object} workflowData - Workflow data
   * @returns {Promise<Object>} - Created workflow
   */
  static async createWorkflow(chatbotId, workflowData) {
    try {
      const response = await axios.post(`/api/chatbots/${chatbotId}/workflows`, workflowData);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to create workflow');
      }
    } catch (error) {
      console.error('Error creating workflow:', error);
      throw error;
    }
  }
  
  /**
   * Update a workflow
   * @param {string} chatbotId - ID of the chatbot
   * @param {string} workflowId - ID of the workflow
   * @param {Object} workflowData - Updated workflow data
   * @returns {Promise<Object>} - Updated workflow
   */
  static async updateWorkflow(chatbotId, workflowId, workflowData) {
    try {
      const response = await axios.put(`/api/chatbots/${chatbotId}/workflows/${workflowId}`, workflowData);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to update workflow');
      }
    } catch (error) {
      console.error('Error updating workflow:', error);
      throw error;
    }
  }
  
  /**
   * Delete a workflow
   * @param {string} chatbotId - ID of the chatbot
   * @param {string} workflowId - ID of the workflow
   * @returns {Promise<boolean>} - Success status
   */
  static async deleteWorkflow(chatbotId, workflowId) {
    try {
      const response = await axios.delete(`/api/chatbots/${chatbotId}/workflows/${workflowId}`);
      
      if (response.data.success) {
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to delete workflow');
      }
    } catch (error) {
      console.error('Error deleting workflow:', error);
      throw error;
    }
  }
  
  /**
   * Start a workflow execution
   * @param {string} chatbotId - ID of the chatbot
   * @param {string} workflowId - ID of the workflow
   * @param {Object} context - Initial context for the workflow
   * @returns {Promise<Object>} - Workflow execution data
   */
  static async startWorkflowExecution(chatbotId, workflowId, context = {}) {
    try {
      const response = await axios.post(`/api/chatbots/${chatbotId}/workflows/${workflowId}/execute`, { context });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to start workflow execution');
      }
    } catch (error) {
      console.error('Error starting workflow execution:', error);
      throw error;
    }
  }
  
  /**
   * Get workflow execution by ID
   * @param {string} executionId - ID of the workflow execution
   * @returns {Promise<Object>} - Workflow execution data
   */
  static async getWorkflowExecution(executionId) {
    try {
      const response = await axios.get(`/api/workflow-executions/${executionId}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get workflow execution');
      }
    } catch (error) {
      console.error('Error getting workflow execution:', error);
      throw error;
    }
  }
  
  /**
   * Get workflow executions for a workflow
   * @param {string} chatbotId - ID of the chatbot
   * @param {string} workflowId - ID of the workflow
   * @returns {Promise<Array>} - List of workflow executions
   */
  static async getWorkflowExecutions(chatbotId, workflowId) {
    try {
      const response = await axios.get(`/api/chatbots/${chatbotId}/workflows/${workflowId}/executions`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get workflow executions');
      }
    } catch (error) {
      console.error('Error getting workflow executions:', error);
      throw error;
    }
  }
  
  /**
   * Submit input to a workflow execution
   * @param {string} executionId - ID of the workflow execution
   * @param {*} input - Input data
   * @returns {Promise<Object>} - Updated workflow execution
   */
  static async submitWorkflowInput(executionId, input) {
    try {
      const response = await axios.post(`/api/workflow-executions/${executionId}/input`, { input });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to submit workflow input');
      }
    } catch (error) {
      console.error('Error submitting workflow input:', error);
      throw error;
    }
  }
  
  /**
   * Cancel a workflow execution
   * @param {string} executionId - ID of the workflow execution
   * @returns {Promise<boolean>} - Success status
   */
  static async cancelWorkflowExecution(executionId) {
    try {
      const response = await axios.post(`/api/workflow-executions/${executionId}/cancel`);
      
      if (response.data.success) {
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to cancel workflow execution');
      }
    } catch (error) {
      console.error('Error canceling workflow execution:', error);
      throw error;
    }
  }
  
  /**
   * Get analytics for a workflow
   * @param {string} chatbotId - ID of the chatbot
   * @param {string} workflowId - ID of the workflow
   * @param {Object} options - Analytics options (startDate, endDate)
   * @returns {Promise<Object>} - Workflow analytics data
   */
  static async getWorkflowAnalytics(chatbotId, workflowId, options = {}) {
    try {
      const response = await axios.get(`/api/chatbots/${chatbotId}/workflows/${workflowId}/analytics`, {
        params: options
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get workflow analytics');
      }
    } catch (error) {
      console.error('Error getting workflow analytics:', error);
      throw error;
    }
  }
  
  /**
   * Get workflow templates
   * @returns {Promise<Array>} - List of workflow templates
   */
  static async getWorkflowTemplates() {
    try {
      const response = await axios.get('/api/workflow-templates');
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get workflow templates');
      }
    } catch (error) {
      console.error('Error getting workflow templates:', error);
      throw error;
    }
  }
  
  /**
   * Get a workflow template by ID
   * @param {string} templateId - ID of the template
   * @returns {Promise<Object>} - Workflow template data
   */
  static async getWorkflowTemplateById(templateId) {
    try {
      const response = await axios.get(`/api/workflow-templates/${templateId}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get workflow template');
      }
    } catch (error) {
      console.error('Error getting workflow template:', error);
      throw error;
    }
  }
}

export default WorkflowService;
