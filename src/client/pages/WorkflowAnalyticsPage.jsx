import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Configure axios with proxy as specified in user requirements
axios.defaults.proxy = {
  host: '104.129.196.38',
  port: 10563
};

/**
 * WorkflowAnalyticsPage Component
 * 
 * Displays analytics and insights for a specific workflow
 */
const WorkflowAnalyticsPage = () => {
  const { chatbotId, workflowId } = useParams();
  const navigate = useNavigate();
  
  const [workflow, setWorkflow] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0] // today
  });
  
  // Load workflow and analytics data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch workflow data
        const workflowResponse = await axios.get(`/api/chatbots/${chatbotId}/workflows/${workflowId}`);
        
        if (workflowResponse.data.success) {
          setWorkflow(workflowResponse.data.data);
        } else {
          setError('Failed to load workflow data');
          setLoading(false);
          return;
        }
        
        // Fetch analytics data
        const analyticsResponse = await axios.get(
          `/api/chatbots/${chatbotId}/workflows/${workflowId}/analytics`,
          {
            params: {
              startDate: dateRange.startDate,
              endDate: dateRange.endDate
            }
          }
        );
        
        if (analyticsResponse.data.success) {
          setAnalytics(analyticsResponse.data.data);
        } else {
          setError('Failed to load analytics data');
        }
        
        // Fetch recent executions
        const executionsResponse = await axios.get(`/api/chatbots/${chatbotId}/workflows/${workflowId}/executions`);
        
        if (executionsResponse.data.success) {
          setExecutions(executionsResponse.data.data.slice(0, 10)); // Get the 10 most recent executions
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
  }, [chatbotId, workflowId, dateRange]);
  
  // Handle date range change
  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Format date
  const formatDate = (dateString) => {
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
  
  if (loading) {
    return (
      <div className="workflow-analytics-page">
        <div className="workflow-analytics-page__loading">
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="workflow-analytics-page">
        <div className="workflow-analytics-page__error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate(`/chatbots/${chatbotId}/workflows`)}>
            Back to Workflows
          </button>
        </div>
      </div>
    );
  }
  
  if (!workflow || !analytics) {
    return null;
  }
  
  return (
    <div className="workflow-analytics-page">
      <div className="workflow-analytics-page__header">
        <h1>Analytics: {workflow.name}</h1>
        <div className="date-range-selector">
          <div className="form-group">
            <label htmlFor="startDate">Start Date</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateRangeChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="endDate">End Date</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateRangeChange}
            />
          </div>
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
        </div>
      </div>
      
      <div className="analytics-overview">
        <div className="analytics-card">
          <h3>Total Executions</h3>
          <div className="analytics-value">{analytics.totalExecutions}</div>
        </div>
        <div className="analytics-card">
          <h3>Completion Rate</h3>
          <div className="analytics-value">{analytics.completionRate.toFixed(1)}%</div>
        </div>
        <div className="analytics-card">
          <h3>Avg. Execution Time</h3>
          <div className="analytics-value">{formatDuration(analytics.averageExecutionTime)}</div>
        </div>
        <div className="analytics-card">
          <h3>Active Executions</h3>
          <div className="analytics-value">{analytics.runningExecutions + analytics.waitingExecutions}</div>
        </div>
      </div>
      
      <div className="analytics-details">
        <div className="analytics-section">
          <h2>Execution Status</h2>
          <div className="status-chart">
            {/* Simplified chart representation */}
            <div className="status-bars">
              <div 
                className="status-bar status-bar--completed" 
                style={{ width: `${(analytics.executionsByStatus.completed / analytics.totalExecutions) * 100}%` }}
                title={`Completed: ${analytics.executionsByStatus.completed}`}
              ></div>
              <div 
                className="status-bar status-bar--error" 
                style={{ width: `${(analytics.executionsByStatus.error / analytics.totalExecutions) * 100}%` }}
                title={`Error: ${analytics.executionsByStatus.error}`}
              ></div>
              <div 
                className="status-bar status-bar--running" 
                style={{ width: `${(analytics.executionsByStatus.running / analytics.totalExecutions) * 100}%` }}
                title={`Running: ${analytics.executionsByStatus.running}`}
              ></div>
              <div 
                className="status-bar status-bar--waiting" 
                style={{ width: `${(analytics.executionsByStatus.waiting_for_input / analytics.totalExecutions) * 100}%` }}
                title={`Waiting for Input: ${analytics.executionsByStatus.waiting_for_input}`}
              ></div>
            </div>
            <div className="status-legend">
              <div className="legend-item">
                <div className="legend-color legend-color--completed"></div>
                <div className="legend-label">Completed ({analytics.executionsByStatus.completed})</div>
              </div>
              <div className="legend-item">
                <div className="legend-color legend-color--error"></div>
                <div className="legend-label">Error ({analytics.executionsByStatus.error})</div>
              </div>
              <div className="legend-item">
                <div className="legend-color legend-color--running"></div>
                <div className="legend-label">Running ({analytics.executionsByStatus.running})</div>
              </div>
              <div className="legend-item">
                <div className="legend-color legend-color--waiting"></div>
                <div className="legend-label">Waiting ({analytics.executionsByStatus.waiting_for_input})</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="analytics-section">
          <h2>Recent Executions</h2>
          {executions.length === 0 ? (
            <p>No executions found for this workflow.</p>
          ) : (
            <table className="executions-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Status</th>
                  <th>Started</th>
                  <th>Completed</th>
                  <th>Duration</th>
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
                      {execution.completedAt 
                        ? formatDuration(new Date(execution.completedAt) - new Date(execution.startedAt)) 
                        : 'In progress'}
                    </td>
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
        </div>
        
        <div className="analytics-section">
          <h2>Insights</h2>
          <div className="insights-cards">
            <div className="insight-card">
              <h3>Completion Rate</h3>
              <p>
                {analytics.completionRate > 90 
                  ? '✅ Excellent completion rate! Users are successfully navigating through your workflow.' 
                  : analytics.completionRate > 70 
                    ? '⚠️ Good completion rate, but there may be room for improvement. Check where users are dropping off.' 
                    : '❌ Low completion rate. Users are having trouble completing this workflow. Review error logs and user feedback.'}
              </p>
            </div>
            
            <div className="insight-card">
              <h3>Execution Time</h3>
              <p>
                {analytics.averageExecutionTime < 30000 
                  ? '✅ Quick execution time! Users can complete this workflow efficiently.' 
                  : analytics.averageExecutionTime < 120000 
                    ? '⚠️ Moderate execution time. Consider optimizing longer steps.' 
                    : '❌ Long execution time. Users may be getting stuck or the workflow may be too complex.'}
              </p>
            </div>
            
            <div className="insight-card">
              <h3>Error Rate</h3>
              <p>
                {(analytics.executionsByStatus.error / analytics.totalExecutions) * 100 < 5 
                  ? '✅ Low error rate. The workflow is running smoothly.' 
                  : (analytics.executionsByStatus.error / analytics.totalExecutions) * 100 < 15 
                    ? '⚠️ Moderate error rate. Check error logs for patterns.' 
                    : '❌ High error rate. There may be issues with integrations or conditions.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowAnalyticsPage;
