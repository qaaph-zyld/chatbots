import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

// Configure axios with proxy as specified in user requirements
axios.defaults.proxy = {
  host: '104.129.196.38',
  port: 10563
};

/**
 * WorkflowsListPage Component
 * 
 * Displays a list of workflows for a chatbot
 */
const WorkflowsListPage = () => {
  const { chatbotId } = useParams();
  const navigate = useNavigate();
  
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatbot, setChatbot] = useState(null);
  
  // Load chatbot and workflows
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
        
        // Fetch workflows
        const workflowsResponse = await axios.get(`/api/chatbots/${chatbotId}/workflows`);
        
        if (workflowsResponse.data.success) {
          setWorkflows(workflowsResponse.data.data);
        } else {
          setError('Failed to load workflows');
        }
      } catch (err) {
        setError(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [chatbotId]);
  
  // Handle workflow activation toggle
  const handleToggleActive = async (workflowId, isActive) => {
    try {
      const response = await axios.put(`/api/chatbots/${chatbotId}/workflows/${workflowId}`, {
        isActive: !isActive
      });
      
      if (response.data.success) {
        // Update workflows list
        setWorkflows(workflows.map(workflow => 
          workflow._id === workflowId 
            ? { ...workflow, isActive: !isActive } 
            : workflow
        ));
      }
    } catch (err) {
      setError(`Error updating workflow: ${err.message}`);
    }
  };
  
  // Handle workflow deletion
  const handleDeleteWorkflow = async (workflowId) => {
    if (!window.confirm('Are you sure you want to delete this workflow?')) {
      return;
    }
    
    try {
      const response = await axios.delete(`/api/chatbots/${chatbotId}/workflows/${workflowId}`);
      
      if (response.data.success) {
        // Remove workflow from list
        setWorkflows(workflows.filter(workflow => workflow._id !== workflowId));
      }
    } catch (err) {
      setError(`Error deleting workflow: ${err.message}`);
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  if (loading) {
    return (
      <div className="workflows-list-page">
        <div className="workflows-list-page__loading">
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="workflows-list-page">
        <div className="workflows-list-page__error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate(`/chatbots/${chatbotId}`)}>
            Back to Chatbot
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="workflows-list-page">
      <div className="workflows-list-page__header">
        <h1>Workflows for {chatbot?.name}</h1>
        <button 
          className="workflows-list-page__create-button"
          onClick={() => navigate(`/chatbots/${chatbotId}/workflows/create`)}
        >
          Create New Workflow
        </button>
      </div>
      
      {workflows.length === 0 ? (
        <div className="workflows-list-page__empty">
          <p>No workflows found. Create your first workflow to get started!</p>
        </div>
      ) : (
        <div className="workflows-list-page__list">
          <table className="workflows-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Status</th>
                <th>Created</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {workflows.map(workflow => (
                <tr key={workflow._id} className={workflow.isActive ? 'active' : 'inactive'}>
                  <td>{workflow.name}</td>
                  <td>{workflow.description}</td>
                  <td>
                    <div className="status-toggle">
                      <span className={`status-badge ${workflow.isActive ? 'active' : 'inactive'}`}>
                        {workflow.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <button 
                        className="toggle-button"
                        onClick={() => handleToggleActive(workflow._id, workflow.isActive)}
                        title={workflow.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {workflow.isActive ? '⏸️' : '▶️'}
                      </button>
                    </div>
                  </td>
                  <td>{formatDate(workflow.createdAt)}</td>
                  <td>{formatDate(workflow.updatedAt)}</td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      <button 
                        className="action-button edit"
                        onClick={() => navigate(`/chatbots/${chatbotId}/workflows/${workflow._id}/edit`)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button 
                        className="action-button view"
                        onClick={() => navigate(`/chatbots/${chatbotId}/workflows/${workflow._id}`)}
                        title="View"
                      >
                        👁️
                      </button>
                      <button 
                        className="action-button analytics"
                        onClick={() => navigate(`/chatbots/${chatbotId}/workflows/${workflow._id}/analytics`)}
                        title="Analytics"
                      >
                        📊
                      </button>
                      <button 
                        className="action-button delete"
                        onClick={() => handleDeleteWorkflow(workflow._id)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="workflows-list-page__templates">
        <h2>Workflow Templates</h2>
        <div className="template-cards">
          <div className="template-card">
            <h3>Customer Onboarding</h3>
            <p>Guide new customers through your product or service.</p>
            <button onClick={() => navigate(`/chatbots/${chatbotId}/workflows/template/onboarding`)}>
              Use Template
            </button>
          </div>
          <div className="template-card">
            <h3>FAQ Bot</h3>
            <p>Answer common questions and provide helpful resources.</p>
            <button onClick={() => navigate(`/chatbots/${chatbotId}/workflows/template/faq`)}>
              Use Template
            </button>
          </div>
          <div className="template-card">
            <h3>Appointment Booking</h3>
            <p>Help users schedule appointments or meetings.</p>
            <button onClick={() => navigate(`/chatbots/${chatbotId}/workflows/template/appointment`)}>
              Use Template
            </button>
          </div>
          <div className="template-card">
            <h3>Lead Generation</h3>
            <p>Collect user information and qualify leads.</p>
            <button onClick={() => navigate(`/chatbots/${chatbotId}/workflows/template/lead-gen`)}>
              Use Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowsListPage;
