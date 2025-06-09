import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import WorkflowService from "@modules/workflow.service";
import '@src/client\pages\WorkflowPages.css';

// Configure axios with proxy as specified in user requirements
axios.defaults.proxy = {
  host: '104.129.196.38',
  port: 10563
};

/**
 * WorkflowDetailsPage Component
 * 
 * Displays detailed information about a specific workflow
 */
const WorkflowDetailsPage = () => {
  const { chatbotId, workflowId } = useParams();
  const navigate = useNavigate();
  
  const [workflow, setWorkflow] = useState(null);
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatbot, setChatbot] = useState(null);
  const [executionStats, setExecutionStats] = useState({
    total: 0,
    completed: 0,
    running: 0,
    error: 0,
    waiting: 0
  });
  
  // Load workflow and related data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch chatbot data
        const chatbotResponse = await axios.get(`/api/chatbots/${chatbotId}`);
        
        if (chatbotResponse.data.success) {
          setChatbot(chatbotResponse.data.data);
        } else {
          setError('Failed to load chatbot data');
          setLoading(false);
          return;
        }
        
        // Fetch workflow data
        const workflowResponse = await WorkflowService.getWorkflowById(chatbotId, workflowId);
        setWorkflow(workflowResponse);
        
        // Fetch recent executions
        const executionsResponse = await WorkflowService.getWorkflowExecutions(chatbotId, workflowId);
        setExecutions(executionsResponse.slice(0, 5)); // Get the 5 most recent executions
        
        // Calculate execution stats
        const stats = {
          total: executionsResponse.length,
          completed: executionsResponse.filter(e => e.status === 'completed').length,
          running: executionsResponse.filter(e => e.status === 'running').length,
          error: executionsResponse.filter(e => e.status === 'error').length,
          waiting: executionsResponse.filter(e => e.status === 'waiting_for_input').length
        };
        setExecutionStats(stats);
      } catch (err) {
        setError(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [chatbotId, workflowId]);
  
  // Handle workflow activation toggle
  const handleToggleActive = async () => {
    try {
      const updatedWorkflow = await WorkflowService.updateWorkflow(chatbotId, workflowId, {
        ...workflow,
        isActive: !workflow.isActive
      });
      
      setWorkflow(updatedWorkflow);
    } catch (err) {
      setError(`Error updating workflow: ${err.message}`);
    }
  };
  
  // Handle workflow execution
  const handleStartExecution = async () => {
    try {
      const execution = await WorkflowService.startWorkflowExecution(chatbotId, workflowId);
      
      // Navigate to execution details
      navigate(`/workflow-executions/${execution._id}`);
    } catch (err) {
      setError(`Error starting workflow execution: ${err.message}`);
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  // Calculate completion rate
  const getCompletionRate = () => {
    if (executionStats.total === 0) return 0;
    return Math.round((executionStats.completed / executionStats.total) * 100);
  };
  
  if (loading) {
    return (
      <div className="workflow-details-page">
        <div className="workflow-details-page__loading">
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="workflow-details-page">
        <div className="workflow-details-page__error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate(`/chatbots/${chatbotId}/workflows`)}>
            Back to Workflows
          </button>
        </div>
      </div>
    );
  }
  
  if (!workflow || !chatbot) {
    return null;
  }
  
  return (
    <div className="workflow-details-page">
      <div className="workflow-details-page__header">
        <div className="header-info">
          <h1>{workflow.name}</h1>
          <p>{workflow.description}</p>
        </div>
        <div className="header-actions">
          <button 
            className="back-button"
            onClick={() => navigate(`/chatbots/${chatbotId}/workflows`)}
          >
            Back to Workflows
          </button>
          <button 
            className="edit-button"
            onClick={() => navigate(`/chatbots/${chatbotId}/workflows/${workflowId}/edit`)}
          >
            Edit Workflow
          </button>
          <button 
            className="analytics-button"
            onClick={() => navigate(`/chatbots/${chatbotId}/workflows/${workflowId}/analytics`)}
          >
            View Analytics
          </button>
        </div>
      </div>
      
      <div className="workflow-details-page__content">
        <div className="workflow-info-panel">
          <div className="workflow-status">
            <h2>Status</h2>
            <div className="status-toggle">
              <span className={`status-badge ${workflow.isActive ? 'active' : 'inactive'}`}>
                {workflow.isActive ? 'Active' : 'Inactive'}
              </span>
              <button 
                className="toggle-button"
                onClick={handleToggleActive}
                title={workflow.isActive ? 'Deactivate' : 'Activate'}
              >
                {workflow.isActive ? '⏸️' : '▶️'}
              </button>
            </div>
          </div>
          
          <div className="workflow-meta">
            <div className="meta-item">
              <span className="meta-label">Created:</span>
              <span className="meta-value">{formatDate(workflow.createdAt)}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Last Updated:</span>
              <span className="meta-value">{formatDate(workflow.updatedAt)}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Nodes:</span>
              <span className="meta-value">{workflow.nodes ? workflow.nodes.length : 0}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Chatbot:</span>
              <span className="meta-value">{chatbot.name}</span>
            </div>
          </div>
          
          <div className="workflow-actions">
            <button 
              className="run-workflow-button"
              onClick={handleStartExecution}
              disabled={!workflow.isActive}
            >
              Run Workflow
            </button>
            {!workflow.isActive && (
              <p className="inactive-warning">
                Workflow must be active to run
              </p>
            )}
          </div>
        </div>
        
        <div className="workflow-stats-panel">
          <h2>Execution Statistics</h2>
          
          {executionStats.total === 0 ? (
            <div className="no-executions">
              <p>No executions yet. Run the workflow to see statistics.</p>
            </div>
          ) : (
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Executions</h3>
                <div className="stat-value">{executionStats.total}</div>
              </div>
              <div className="stat-card">
                <h3>Completion Rate</h3>
                <div className="stat-value">{getCompletionRate()}%</div>
              </div>
              <div className="stat-card">
                <h3>Active Executions</h3>
                <div className="stat-value">{executionStats.running + executionStats.waiting}</div>
              </div>
              <div className="stat-card">
                <h3>Errors</h3>
                <div className="stat-value">{executionStats.error}</div>
              </div>
            </div>
          )}
          
          <div className="view-analytics-link">
            <Link to={`/chatbots/${chatbotId}/workflows/${workflowId}/analytics`}>
              View Full Analytics
            </Link>
          </div>
        </div>
        
        <div className="workflow-executions-panel">
          <h2>Recent Executions</h2>
          
          {executions.length === 0 ? (
            <div className="no-executions">
              <p>No executions yet. Run the workflow to see execution history.</p>
            </div>
          ) : (
            <table className="executions-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Status</th>
                  <th>Started</th>
                  <th>Completed</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {executions.map(execution => (
                  <tr key={execution._id} className={`status-${execution.status}`}>
                    <td>{execution._id.substring(0, 8)}...</td>
                    <td>
                      <span className={`status-badge status-badge--${execution.status}`}>
                        {execution.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>{formatDate(execution.startedAt)}</td>
                    <td>{execution.completedAt ? formatDate(execution.completedAt) : 'N/A'}</td>
                    <td>
                      <button 
                        className="view-execution-button"
                        onClick={() => navigate(`/workflow-executions/${execution._id}`)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          <div className="view-all-executions-link">
            <Link to={`/chatbots/${chatbotId}/workflows/${workflowId}/executions`}>
              View All Executions
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowDetailsPage;
