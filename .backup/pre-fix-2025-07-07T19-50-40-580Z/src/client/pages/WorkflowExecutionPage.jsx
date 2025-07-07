import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Configure axios with proxy as specified in user requirements
axios.defaults.proxy = {
  host: '104.129.196.38',
  port: 10563
};

/**
 * WorkflowExecutionPage Component
 * 
 * Displays detailed information about a specific workflow execution
 */
const WorkflowExecutionPage = () => {
  const { executionId } = useParams();
  const navigate = useNavigate();
  
  const [execution, setExecution] = useState(null);
  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Load execution and workflow data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch execution data
        const executionResponse = await axios.get(`/api/workflow-executions/${executionId}`);
        
        if (executionResponse.data.success) {
          setExecution(executionResponse.data.data);
          
          // Fetch workflow data
          const workflowResponse = await axios.get(`/api/workflows/${executionResponse.data.data.workflowId}`);
          
          if (workflowResponse.data.success) {
            setWorkflow(workflowResponse.data.data);
          } else {
            setError('Failed to load workflow data');
          }
        } else {
          setError('Failed to load execution data');
        }
      } catch (err) {
        setError(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [executionId]);
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  // Format duration in milliseconds to readable format
  const formatDuration = (ms) => {
    if (!ms) return 'N/A';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };
  
  // Get node type display name
  const getNodeTypeDisplay = (type) => {
    const nodeTypes = {
      'start': 'Start',
      'message': 'Message',
      'condition': 'Condition',
      'input': 'Input',
      'action': 'Action',
      'integration': 'Integration',
      'context': 'Context',
      'jump': 'Jump',
      'end': 'End'
    };
    
    return nodeTypes[type] || type;
  };
  
  // Get node color based on type
  const getNodeColor = (type) => {
    const nodeColors = {
      'start': '#4caf50',
      'message': '#2196f3',
      'condition': '#ff9800',
      'input': '#9c27b0',
      'action': '#f44336',
      'integration': '#00bcd4',
      'context': '#3f51b5',
      'jump': '#795548',
      'end': '#607d8b'
    };
    
    return nodeColors[type] || '#9e9e9e';
  };
  
  if (loading) {
    return (
      <div className="workflow-execution-page">
        <div className="workflow-execution-page__loading">
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="workflow-execution-page">
        <div className="workflow-execution-page__error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  if (!execution || !workflow) {
    return null;
  }
  
  // Calculate execution duration
  const duration = execution.completedAt 
    ? new Date(execution.completedAt) - new Date(execution.startedAt) 
    : execution.status === 'running' 
      ? new Date() - new Date(execution.startedAt) 
      : null;
  
  return (
    <div className="workflow-execution-page">
      <div className="workflow-execution-page__header">
        <h1>Workflow Execution Details</h1>
        <div className="header-actions">
          <button 
            className="back-button"
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>
      </div>
      
      <div className="execution-overview">
        <div className="execution-info">
          <div className="info-group">
            <h3>Workflow</h3>
            <p>{workflow.name}</p>
          </div>
          <div className="info-group">
            <h3>Execution ID</h3>
            <p>{execution._id}</p>
          </div>
          <div className="info-group">
            <h3>Status</h3>
            <p>
              <span className={`status-badge status-badge--${execution.status}`}>
                {execution.status.replace('_', ' ')}
              </span>
            </p>
          </div>
          <div className="info-group">
            <h3>Started</h3>
            <p>{formatDate(execution.startedAt)}</p>
          </div>
          <div className="info-group">
            <h3>Completed</h3>
            <p>{formatDate(execution.completedAt)}</p>
          </div>
          <div className="info-group">
            <h3>Duration</h3>
            <p>{formatDuration(duration)}</p>
          </div>
          {execution.error && (
            <div className="info-group info-group--error">
              <h3>Error</h3>
              <p>{execution.error}</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="execution-details">
        <div className="execution-section">
          <h2>Execution Path</h2>
          <div className="execution-path">
            {execution.nodeExecutions.length === 0 ? (
              <p>No nodes have been executed yet.</p>
            ) : (
              <div className="node-timeline">
                {execution.nodeExecutions.map((nodeExecution, index) => {
                  const node = workflow.nodes.find(n => n.id === nodeExecution.nodeId);
                  const nodeType = node ? node.type : 'unknown';
                  const nodeColor = getNodeColor(nodeType);
                  
                  return (
                    <div key={index} className="timeline-item">
                      <div className="timeline-connector">
                        <div 
                          className="timeline-dot" 
                          style={{ backgroundColor: nodeColor }}
                        ></div>
                        {index < execution.nodeExecutions.length - 1 && (
                          <div className="timeline-line"></div>
                        )}
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <h3>
                            <span 
                              className="node-type-badge"
                              style={{ backgroundColor: nodeColor }}
                            >
                              {getNodeTypeDisplay(nodeType)}
                            </span>
                            {node ? node.data.label || `Node ${index + 1}` : `Unknown Node (${nodeExecution.nodeId})`}
                          </h3>
                          <span className="timeline-time">
                            {formatDate(nodeExecution.timestamp)}
                          </span>
                        </div>
                        
                        {nodeExecution.input && Object.keys(nodeExecution.input).length > 0 && (
                          <div className="timeline-data">
                            <h4>Input</h4>
                            <pre>{JSON.stringify(nodeExecution.input, null, 2)}</pre>
                          </div>
                        )}
                        
                        {nodeExecution.output && Object.keys(nodeExecution.output).length > 0 && (
                          <div className="timeline-data">
                            <h4>Output</h4>
                            <pre>{JSON.stringify(nodeExecution.output, null, 2)}</pre>
                          </div>
                        )}
                        
                        {nodeExecution.error && (
                          <div className="timeline-data timeline-data--error">
                            <h4>Error</h4>
                            <pre>{nodeExecution.error}</pre>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        
        <div className="execution-section">
          <h2>Execution Context</h2>
          <div className="context-data">
            {execution.context && Object.keys(execution.context).length > 0 ? (
              <pre>{JSON.stringify(execution.context, null, 2)}</pre>
            ) : (
              <p>No context data available.</p>
            )}
          </div>
        </div>
        
        {execution.status === 'waiting_for_input' && (
          <div className="execution-section execution-section--action">
            <h2>Waiting for Input</h2>
            <p>This workflow execution is waiting for user input. You can provide input below:</p>
            
            <div className="input-form">
              <textarea 
                placeholder="Enter your response..."
                rows={4}
                className="input-textarea"
              ></textarea>
              <button className="submit-input-button">
                Submit Input
              </button>
            </div>
          </div>
        )}
        
        {execution.status === 'running' && (
          <div className="execution-section execution-section--action">
            <h2>Running</h2>
            <p>This workflow execution is currently running.</p>
            <button className="cancel-execution-button">
              Cancel Execution
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowExecutionPage;
