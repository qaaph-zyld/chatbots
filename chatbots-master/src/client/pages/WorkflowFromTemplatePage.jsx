import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import WorkflowService from "@modules/workflow.service";
import '@src/client\pages\WorkflowPages.css';

// Configure axios with proxy as specified in user requirements
axios.defaults.proxy = {
  host: '104.129.196.38',
  port: 10563
};

/**
 * WorkflowFromTemplatePage Component
 * 
 * Allows users to customize a template before creating a workflow
 */
const WorkflowFromTemplatePage = () => {
  const { chatbotId, templateId } = useParams();
  const navigate = useNavigate();
  
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: false
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  
  // Load template data
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const template = await WorkflowService.getWorkflowTemplateById(templateId);
        setTemplate(template);
        
        // Pre-fill form with template data
        setFormData({
          name: `${template.name} Workflow`,
          description: template.description,
          isActive: false
        });
      } catch (err) {
        setError(`Error loading template: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTemplate();
  }, [templateId]);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setCreating(true);
      setCreateError(null);
      
      // Create workflow from template
      const response = await axios.post(`/api/chatbots/${chatbotId}/templates/${templateId}`, formData);
      
      if (response.data.success) {
        // Navigate to the workflow editor
        navigate(`/chatbots/${chatbotId}/workflows/${response.data.data._id}/edit`);
      } else {
        setCreateError(response.data.message || 'Failed to create workflow');
      }
    } catch (err) {
      setCreateError(`Error creating workflow: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };
  
  if (loading) {
    return (
      <div className="workflow-from-template-page">
        <div className="workflow-from-template-page__loading">
          <h2>Loading template...</h2>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="workflow-from-template-page">
        <div className="workflow-from-template-page__error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate(`/chatbots/${chatbotId}/workflows/templates`)}>
            Back to Templates
          </button>
        </div>
      </div>
    );
  }
  
  if (!template) {
    return null;
  }
  
  return (
    <div className="workflow-from-template-page">
      <div className="workflow-from-template-page__header">
        <h1>Create Workflow from Template</h1>
        <div className="header-actions">
          <button 
            className="back-button"
            onClick={() => navigate(`/chatbots/${chatbotId}/workflows/templates`)}
          >
            Back to Templates
          </button>
        </div>
      </div>
      
      <div className="workflow-from-template-page__content">
        <div className="template-info">
          <h2>{template.name}</h2>
          <p>{template.description}</p>
          <div className="template-meta">
            <div className="meta-item">
              <span className="meta-label">Category:</span>
              <span className="meta-value">{template.category}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Complexity:</span>
              <span className="meta-value">{template.complexity}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Nodes:</span>
              <span className="meta-value">{template.nodes}</span>
            </div>
          </div>
        </div>
        
        <div className="workflow-form">
          <h2>Customize Your Workflow</h2>
          
          {createError && (
            <div className="form-error">
              <p>{createError}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Workflow Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                required
              ></textarea>
            </div>
            
            <div className="form-group checkbox">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
              />
              <label htmlFor="isActive">Activate workflow immediately</label>
            </div>
            
            <div className="form-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => navigate(`/chatbots/${chatbotId}/workflows/templates`)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="create-button"
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create Workflow'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WorkflowFromTemplatePage;
