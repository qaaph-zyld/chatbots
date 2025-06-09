import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';
import axios from 'axios';
import WorkflowService from "@modules/workflow.service";
import '@src/client\pages\WorkflowPages.css';

// Configure axios with proxy as specified in user requirements
axios.defaults.proxy = {
  host: '104.129.196.38',
  port: 10563
};

/**
 * WorkflowTemplatePreviewPage Component
 * 
 * Displays a preview of a workflow template
 */
const WorkflowTemplatePreviewPage = () => {
  const { chatbotId, templateId } = useParams();
  const navigate = useNavigate();
  
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  
  // Load template data
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const template = await WorkflowService.getWorkflowTemplateById(templateId);
        setTemplate(template);
        
        // Prepare nodes and edges for ReactFlow
        if (template && template.definition) {
          setNodes(template.definition.nodes.map(node => ({
            ...node,
            type: getNodeType(node.type),
            data: {
              ...node.data,
              isPreview: true // Flag to indicate this is a preview
            }
          })));
          
          setEdges(template.definition.edges.map(edge => ({
            ...edge,
            animated: true,
            style: { stroke: '#2196f3' }
          })));
        }
      } catch (err) {
        setError(`Error loading template: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTemplate();
  }, [templateId]);
  
  // Get the appropriate node type for ReactFlow
  const getNodeType = (type) => {
    // In a real implementation, this would map to custom node components
    // For now, we'll use the default node type
    return 'default';
  };
  
  // Handle use template button click
  const handleUseTemplate = () => {
    navigate(`/chatbots/${chatbotId}/workflows/template/${templateId}`);
  };
  
  if (loading) {
    return (
      <div className="workflow-template-preview-page">
        <div className="workflow-template-preview-page__loading">
          <h2>Loading template preview...</h2>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="workflow-template-preview-page">
        <div className="workflow-template-preview-page__error">
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
    <div className="workflow-template-preview-page">
      <div className="workflow-template-preview-page__header">
        <div className="header-info">
          <h1>{template.name} Template</h1>
          <p>{template.description}</p>
        </div>
        <div className="header-actions">
          <button 
            className="back-button"
            onClick={() => navigate(`/chatbots/${chatbotId}/workflows/templates`)}
          >
            Back to Templates
          </button>
          <button 
            className="use-template-button"
            onClick={handleUseTemplate}
          >
            Use This Template
          </button>
        </div>
      </div>
      
      <div className="workflow-template-preview-page__details">
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
      
      <div className="workflow-template-preview-page__flow">
        <div className="flow-container" style={{ height: 600 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            fitView
            attributionPosition="bottom-right"
            zoomOnScroll={false}
            panOnScroll={true}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
          >
            <Background color="#f5f5f5" gap={16} />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
      </div>
      
      <div className="workflow-template-preview-page__description">
        <h2>Template Description</h2>
        <p>{template.description}</p>
        
        <h3>Use Cases</h3>
        <ul className="use-cases">
          {getUseCases(template.category).map((useCase, index) => (
            <li key={index}>{useCase}</li>
          ))}
        </ul>
        
        <h3>Features</h3>
        <ul className="features">
          {getFeatures(template.id).map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
      </div>
      
      <div className="workflow-template-preview-page__actions">
        <button 
          className="use-template-button large"
          onClick={handleUseTemplate}
        >
          Use This Template
        </button>
        <button 
          className="create-blank-button"
          onClick={() => navigate(`/chatbots/${chatbotId}/workflows/create`)}
        >
          Create Blank Workflow
        </button>
      </div>
    </div>
  );
};

// Helper function to get use cases based on category
const getUseCases = (category) => {
  const useCases = {
    'customer-service': [
      'Improve customer onboarding experience',
      'Reduce support ticket volume by answering common questions',
      'Collect customer feedback and improve satisfaction'
    ],
    'marketing': [
      'Generate qualified leads for your sales team',
      'Engage website visitors and convert them to customers',
      'Promote new products or services to existing customers'
    ],
    'sales': [
      'Qualify leads before routing to sales representatives',
      'Recommend products based on customer needs',
      'Automate follow-ups and nurture prospects'
    ],
    'scheduling': [
      'Reduce no-shows with automated appointment reminders',
      'Streamline scheduling process for customers and staff',
      'Integrate with your existing calendar system'
    ]
  };
  
  return useCases[category] || [
    'Automate repetitive conversations',
    'Provide consistent user experiences',
    'Save time and resources'
  ];
};

// Helper function to get features based on template ID
const getFeatures = (templateId) => {
  const features = {
    'onboarding': [
      'Personalized welcome messages',
      'User information collection',
      'Conditional paths based on user goals',
      'Resource recommendations'
    ],
    'faq': [
      'Question categorization',
      'Contextual responses',
      'Follow-up question handling',
      'Escalation to human support when needed'
    ],
    'appointment': [
      'Date and time selection',
      'Appointment type options',
      'Calendar integration',
      'Confirmation messages and reminders'
    ],
    'lead-gen': [
      'Contact information collection',
      'Lead qualification questions',
      'CRM integration',
      'Follow-up scheduling'
    ],
    'product-recommendation': [
      'Need assessment questions',
      'Product matching logic',
      'Detailed product information',
      'Purchase facilitation'
    ],
    'feedback-collection': [
      'Rating scale questions',
      'Open-ended feedback collection',
      'Sentiment analysis',
      'Follow-up based on feedback score'
    ]
  };
  
  return features[templateId] || [
    'Easy to customize for your specific needs',
    'Pre-built conversation flow',
    'Best practices implementation',
    'Time-saving solution'
  ];
};

export default WorkflowTemplatePreviewPage;
