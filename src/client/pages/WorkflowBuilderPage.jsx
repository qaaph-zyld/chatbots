import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '@src/client\components\workflow-editor\WorkflowEditor';
import '@src/client\components\workflow-editor\WorkflowEditor.css';

// Configure axios with proxy as specified in user requirements
axios.defaults.proxy = {
  host: '104.129.196.38',
  port: 10563
};

/**
 * WorkflowBuilderPage Component
 * 
 * Main page for creating and editing workflows
 */
const WorkflowBuilderPage = () => {
  const { chatbotId, workflowId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatbot, setChatbot] = useState(null);
  
  // Load chatbot data
  useEffect(() => {
    const fetchChatbot = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`/api/chatbots/${chatbotId}`);
        
        if (response.data.success) {
          setChatbot(response.data.data);
        } else {
          setError('Failed to load chatbot data');
        }
      } catch (err) {
        setError(`Error loading chatbot: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchChatbot();
  }, [chatbotId]);
  
  // Handle save workflow
  const handleSaveWorkflow = (workflow) => {
    // Navigate to workflow list or detail page
    navigate(`/chatbots/${chatbotId}/workflows`);
  };
  
  // Handle cancel
  const handleCancel = () => {
    navigate(`/chatbots/${chatbotId}/workflows`);
  };
  
  if (loading) {
    return (
      <div className="workflow-builder-page">
        <div className="workflow-builder-page__loading">
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="workflow-builder-page">
        <div className="workflow-builder-page__error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate(`/chatbots/${chatbotId}/workflows`)}>
            Back to Workflows
          </button>
        </div>
      </div>
    );
  }
  
  if (!chatbot) {
    return null;
  }
  
  return (
    <div className="workflow-builder-page">
      <div className="workflow-builder-page__container">
        <WorkflowEditor
          chatbotId={chatbotId}
          workflowId={workflowId}
          onSave={handleSaveWorkflow}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default WorkflowBuilderPage;
