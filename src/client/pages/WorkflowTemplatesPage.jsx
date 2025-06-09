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
 * WorkflowTemplatesPage Component
 * 
 * Displays available workflow templates for selection
 */
const WorkflowTemplatesPage = () => {
  const { chatbotId } = useParams();
  const navigate = useNavigate();
  
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatbot, setChatbot] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Load chatbot and templates
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
        
        // Fetch templates
        const templates = await WorkflowService.getWorkflowTemplates();
        setTemplates(templates);
      } catch (err) {
        setError(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [chatbotId]);
  
  // Get unique categories from templates
  const categories = ['all', ...new Set(templates.map(template => template.category))];
  
  // Filter templates by category and search query
  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });
  
  // Handle template selection
  const handleSelectTemplate = (templateId) => {
    navigate(`/chatbots/${chatbotId}/workflows/template/${templateId}`);
  };
  
  if (loading) {
    return (
      <div className="workflow-templates-page">
        <div className="workflow-templates-page__loading">
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="workflow-templates-page">
        <div className="workflow-templates-page__error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate(`/chatbots/${chatbotId}/workflows`)}>
            Back to Workflows
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="workflow-templates-page">
      <div className="workflow-templates-page__header">
        <h1>Workflow Templates</h1>
        <div className="header-actions">
          <button 
            className="back-button"
            onClick={() => navigate(`/chatbots/${chatbotId}/workflows`)}
          >
            Back to Workflows
          </button>
          <button 
            className="create-blank-button"
            onClick={() => navigate(`/chatbots/${chatbotId}/workflows/create`)}
          >
            Create Blank Workflow
          </button>
        </div>
      </div>
      
      <div className="workflow-templates-page__filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="category-filters">
          {categories.map(category => (
            <button
              key={category}
              className={`category-filter ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      <div className="workflow-templates-page__templates">
        {filteredTemplates.length === 0 ? (
          <div className="no-templates">
            <p>No templates found matching your criteria.</p>
          </div>
        ) : (
          <div className="template-grid">
            {filteredTemplates.map(template => (
              <div key={template.id} className="template-card">
                <div className="template-card__preview">
                  {template.preview ? (
                    <img src={template.preview} alt={template.name} />
                  ) : (
                    <div className="template-card__preview-placeholder">
                      <span>{template.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="template-card__content">
                  <h3>{template.name}</h3>
                  <p>{template.description}</p>
                  <div className="template-card__meta">
                    <span className="template-card__category">{template.category}</span>
                    <span className="template-card__complexity">{template.complexity}</span>
                    <span className="template-card__nodes">{template.nodes} nodes</span>
                  </div>
                </div>
                <div className="template-card__actions">
                  <button 
                    className="template-card__use-button"
                    onClick={() => handleSelectTemplate(template.id)}
                  >
                    Use Template
                  </button>
                  <button 
                    className="template-card__preview-button"
                    onClick={() => navigate(`/chatbots/${chatbotId}/workflows/template/${template.id}/preview`)}
                  >
                    Preview
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowTemplatesPage;
