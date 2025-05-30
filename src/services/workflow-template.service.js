/**
 * Workflow Template Service
 * 
 * Provides functionality for managing and applying workflow templates
 */

const WorkflowService = require('./workflow.service');
const Workflow = require('../models/workflow.model');

class WorkflowTemplateService {
  /**
   * Get all available workflow templates
   * 
   * @returns {Array} List of available templates
   */
  static async getTemplates() {
    return [
      {
        id: 'onboarding',
        name: 'Customer Onboarding',
        description: 'Guide new customers through your product or service',
        category: 'customer-service',
        complexity: 'medium',
        nodes: 8,
        preview: '/templates/onboarding-preview.png'
      },
      {
        id: 'faq',
        name: 'FAQ Bot',
        description: 'Answer common questions and provide helpful resources',
        category: 'customer-service',
        complexity: 'simple',
        nodes: 5,
        preview: '/templates/faq-preview.png'
      },
      {
        id: 'appointment',
        name: 'Appointment Booking',
        description: 'Help users schedule appointments or meetings',
        category: 'scheduling',
        complexity: 'medium',
        nodes: 10,
        preview: '/templates/appointment-preview.png'
      },
      {
        id: 'lead-gen',
        name: 'Lead Generation',
        description: 'Collect user information and qualify leads',
        category: 'marketing',
        complexity: 'medium',
        nodes: 7,
        preview: '/templates/lead-gen-preview.png'
      },
      {
        id: 'product-recommendation',
        name: 'Product Recommendation',
        description: 'Help users find the right product based on their needs',
        category: 'sales',
        complexity: 'advanced',
        nodes: 12,
        preview: '/templates/product-recommendation-preview.png'
      },
      {
        id: 'feedback-collection',
        name: 'Feedback Collection',
        description: 'Gather customer feedback and satisfaction ratings',
        category: 'customer-service',
        complexity: 'simple',
        nodes: 6,
        preview: '/templates/feedback-preview.png'
      }
    ];
  }

  /**
   * Get a specific template by ID
   * 
   * @param {string} templateId - ID of the template to retrieve
   * @returns {Object} Template data
   */
  static async getTemplateById(templateId) {
    const templates = await this.getTemplates();
    const template = templates.find(t => t.id === templateId);
    
    if (!template) {
      throw new Error(`Template with ID ${templateId} not found`);
    }
    
    // Get the actual template definition based on the ID
    return {
      ...template,
      definition: await this.getTemplateDefinition(templateId)
    };
  }

  /**
   * Get the full definition for a template
   * 
   * @param {string} templateId - ID of the template
   * @returns {Object} Complete template definition with nodes and edges
   */
  static async getTemplateDefinition(templateId) {
    // In a real implementation, these would be stored in a database or file system
    // Here we're defining them inline for demonstration purposes
    
    const templates = {
      'onboarding': {
        name: 'Customer Onboarding',
        description: 'Guide new customers through your product or service',
        nodes: [
          {
            id: 'node-1',
            type: 'start',
            position: { x: 100, y: 100 },
            data: { label: 'Start' }
          },
          {
            id: 'node-2',
            type: 'message',
            position: { x: 100, y: 200 },
            data: { 
              label: 'Welcome Message',
              message: 'Welcome to our service! We\'re excited to have you on board. Let\'s get you set up quickly.'
            }
          },
          {
            id: 'node-3',
            type: 'input',
            position: { x: 100, y: 300 },
            data: { 
              label: 'Get Name',
              question: 'What\'s your name?',
              variableName: 'userName'
            }
          },
          {
            id: 'node-4',
            type: 'message',
            position: { x: 100, y: 400 },
            data: { 
              label: 'Personalized Greeting',
              message: 'Nice to meet you, {{userName}}! I\'ll guide you through our platform.'
            }
          },
          {
            id: 'node-5',
            type: 'input',
            position: { x: 100, y: 500 },
            data: { 
              label: 'Get Goal',
              question: 'What are you hoping to accomplish with our service?',
              variableName: 'userGoal'
            }
          },
          {
            id: 'node-6',
            type: 'condition',
            position: { x: 100, y: 600 },
            data: { 
              label: 'Check Goal',
              condition: '{{userGoal.includes("learn")}}',
              variableName: 'isLearning'
            }
          },
          {
            id: 'node-7a',
            type: 'message',
            position: { x: 0, y: 700 },
            data: { 
              label: 'Learning Resources',
              message: 'Great! Here are some resources to help you learn: [List of resources]'
            }
          },
          {
            id: 'node-7b',
            type: 'message',
            position: { x: 200, y: 700 },
            data: { 
              label: 'General Resources',
              message: 'Perfect! Let me show you how to get started with our platform.'
            }
          },
          {
            id: 'node-8',
            type: 'end',
            position: { x: 100, y: 800 },
            data: { label: 'End' }
          }
        ],
        edges: [
          { id: 'edge-1-2', source: 'node-1', target: 'node-2' },
          { id: 'edge-2-3', source: 'node-2', target: 'node-3' },
          { id: 'edge-3-4', source: 'node-3', target: 'node-4' },
          { id: 'edge-4-5', source: 'node-4', target: 'node-5' },
          { id: 'edge-5-6', source: 'node-5', target: 'node-6' },
          { id: 'edge-6-7a', source: 'node-6', target: 'node-7a', label: 'Yes' },
          { id: 'edge-6-7b', source: 'node-6', target: 'node-7b', label: 'No' },
          { id: 'edge-7a-8', source: 'node-7a', target: 'node-8' },
          { id: 'edge-7b-8', source: 'node-7b', target: 'node-8' }
        ]
      },
      'faq': {
        name: 'FAQ Bot',
        description: 'Answer common questions and provide helpful resources',
        nodes: [
          {
            id: 'node-1',
            type: 'start',
            position: { x: 100, y: 100 },
            data: { label: 'Start' }
          },
          {
            id: 'node-2',
            type: 'message',
            position: { x: 100, y: 200 },
            data: { 
              label: 'Welcome Message',
              message: 'Hello! I\'m here to help answer your questions. What would you like to know about?'
            }
          },
          {
            id: 'node-3',
            type: 'input',
            position: { x: 100, y: 300 },
            data: { 
              label: 'Get Question',
              question: 'Please type your question:',
              variableName: 'userQuestion'
            }
          },
          {
            id: 'node-4',
            type: 'context',
            position: { x: 100, y: 400 },
            data: { 
              label: 'Process Question',
              action: 'analyzeQuestion',
              inputVariable: 'userQuestion',
              outputVariable: 'questionCategory'
            }
          },
          {
            id: 'node-5',
            type: 'condition',
            position: { x: 100, y: 500 },
            data: { 
              label: 'Check Category',
              condition: '{{questionCategory === "pricing"}}',
              variableName: 'isPricing'
            }
          },
          {
            id: 'node-6a',
            type: 'message',
            position: { x: 0, y: 600 },
            data: { 
              label: 'Pricing Answer',
              message: 'Our pricing is simple: $10/month for basic, $20/month for premium. You can find more details on our pricing page.'
            }
          },
          {
            id: 'node-6b',
            type: 'message',
            position: { x: 200, y: 600 },
            data: { 
              label: 'General Answer',
              message: 'I\'ll need to look into that. Would you like to speak with a customer service representative?'
            }
          },
          {
            id: 'node-7',
            type: 'input',
            position: { x: 100, y: 700 },
            data: { 
              label: 'More Questions',
              question: 'Do you have any other questions? (yes/no)',
              variableName: 'hasMoreQuestions'
            }
          },
          {
            id: 'node-8',
            type: 'condition',
            position: { x: 100, y: 800 },
            data: { 
              label: 'Check More Questions',
              condition: '{{hasMoreQuestions.toLowerCase() === "yes"}}',
              variableName: 'continueAsking'
            }
          },
          {
            id: 'node-9',
            type: 'end',
            position: { x: 100, y: 900 },
            data: { label: 'End' }
          }
        ],
        edges: [
          { id: 'edge-1-2', source: 'node-1', target: 'node-2' },
          { id: 'edge-2-3', source: 'node-2', target: 'node-3' },
          { id: 'edge-3-4', source: 'node-3', target: 'node-4' },
          { id: 'edge-4-5', source: 'node-4', target: 'node-5' },
          { id: 'edge-5-6a', source: 'node-5', target: 'node-6a', label: 'Yes' },
          { id: 'edge-5-6b', source: 'node-5', target: 'node-6b', label: 'No' },
          { id: 'edge-6a-7', source: 'node-6a', target: 'node-7' },
          { id: 'edge-6b-7', source: 'node-6b', target: 'node-7' },
          { id: 'edge-7-8', source: 'node-7', target: 'node-8' },
          { id: 'edge-8-3', source: 'node-8', target: 'node-3', label: 'Yes' },
          { id: 'edge-8-9', source: 'node-8', target: 'node-9', label: 'No' }
        ]
      },
      'appointment': {
        name: 'Appointment Booking',
        description: 'Help users schedule appointments or meetings',
        nodes: [
          {
            id: 'node-1',
            type: 'start',
            position: { x: 100, y: 100 },
            data: { label: 'Start' }
          },
          {
            id: 'node-2',
            type: 'message',
            position: { x: 100, y: 200 },
            data: { 
              label: 'Welcome Message',
              message: 'Hello! I\'m here to help you schedule an appointment. What type of appointment are you looking for?'
            }
          },
          {
            id: 'node-3',
            type: 'input',
            position: { x: 100, y: 300 },
            data: { 
              label: 'Get Appointment Type',
              question: 'Please select: 1) Consultation, 2) Demo, 3) Support',
              variableName: 'appointmentType'
            }
          },
          {
            id: 'node-4',
            type: 'message',
            position: { x: 100, y: 400 },
            data: { 
              label: 'Confirm Type',
              message: 'Great! Let\'s schedule a {{appointmentType}} appointment.'
            }
          },
          {
            id: 'node-5',
            type: 'input',
            position: { x: 100, y: 500 },
            data: { 
              label: 'Get Date',
              question: 'What date works best for you? (MM/DD/YYYY)',
              variableName: 'appointmentDate'
            }
          },
          {
            id: 'node-6',
            type: 'input',
            position: { x: 100, y: 600 },
            data: { 
              label: 'Get Time',
              question: 'What time works best for you? (HH:MM AM/PM)',
              variableName: 'appointmentTime'
            }
          },
          {
            id: 'node-7',
            type: 'integration',
            position: { x: 100, y: 700 },
            data: { 
              label: 'Check Availability',
              action: 'checkCalendarAvailability',
              inputVariables: ['appointmentDate', 'appointmentTime', 'appointmentType'],
              outputVariable: 'isAvailable'
            }
          },
          {
            id: 'node-8',
            type: 'condition',
            position: { x: 100, y: 800 },
            data: { 
              label: 'Check Availability',
              condition: '{{isAvailable}}',
              variableName: 'timeIsAvailable'
            }
          },
          {
            id: 'node-9a',
            type: 'message',
            position: { x: 0, y: 900 },
            data: { 
              label: 'Confirm Appointment',
              message: 'Great! Your {{appointmentType}} appointment is confirmed for {{appointmentDate}} at {{appointmentTime}}.'
            }
          },
          {
            id: 'node-9b',
            type: 'message',
            position: { x: 200, y: 900 },
            data: { 
              label: 'Not Available',
              message: 'I\'m sorry, that time is not available. Would you like to try another time?'
            }
          },
          {
            id: 'node-10',
            type: 'end',
            position: { x: 100, y: 1000 },
            data: { label: 'End' }
          }
        ],
        edges: [
          { id: 'edge-1-2', source: 'node-1', target: 'node-2' },
          { id: 'edge-2-3', source: 'node-2', target: 'node-3' },
          { id: 'edge-3-4', source: 'node-3', target: 'node-4' },
          { id: 'edge-4-5', source: 'node-4', target: 'node-5' },
          { id: 'edge-5-6', source: 'node-5', target: 'node-6' },
          { id: 'edge-6-7', source: 'node-6', target: 'node-7' },
          { id: 'edge-7-8', source: 'node-7', target: 'node-8' },
          { id: 'edge-8-9a', source: 'node-8', target: 'node-9a', label: 'Yes' },
          { id: 'edge-8-9b', source: 'node-8', target: 'node-9b', label: 'No' },
          { id: 'edge-9a-10', source: 'node-9a', target: 'node-10' },
          { id: 'edge-9b-5', source: 'node-9b', target: 'node-5' }
        ]
      },
      'lead-gen': {
        name: 'Lead Generation',
        description: 'Collect user information and qualify leads',
        nodes: [
          {
            id: 'node-1',
            type: 'start',
            position: { x: 100, y: 100 },
            data: { label: 'Start' }
          },
          {
            id: 'node-2',
            type: 'message',
            position: { x: 100, y: 200 },
            data: { 
              label: 'Welcome Message',
              message: 'Hi there! I\'d love to learn more about your needs and see how we can help. Mind if I ask you a few questions?'
            }
          },
          {
            id: 'node-3',
            type: 'input',
            position: { x: 100, y: 300 },
            data: { 
              label: 'Get Name',
              question: 'What\'s your name?',
              variableName: 'leadName'
            }
          },
          {
            id: 'node-4',
            type: 'input',
            position: { x: 100, y: 400 },
            data: { 
              label: 'Get Email',
              question: 'What\'s your email address?',
              variableName: 'leadEmail'
            }
          },
          {
            id: 'node-5',
            type: 'input',
            position: { x: 100, y: 500 },
            data: { 
              label: 'Get Company',
              question: 'What company do you work for?',
              variableName: 'leadCompany'
            }
          },
          {
            id: 'node-6',
            type: 'input',
            position: { x: 100, y: 600 },
            data: { 
              label: 'Get Need',
              question: 'What are you looking to accomplish?',
              variableName: 'leadNeed'
            }
          },
          {
            id: 'node-7',
            type: 'input',
            position: { x: 100, y: 700 },
            data: { 
              label: 'Get Timeline',
              question: 'What\'s your timeline for implementation?',
              variableName: 'leadTimeline'
            }
          },
          {
            id: 'node-8',
            type: 'integration',
            position: { x: 100, y: 800 },
            data: { 
              label: 'Save Lead',
              action: 'saveToCRM',
              inputVariables: ['leadName', 'leadEmail', 'leadCompany', 'leadNeed', 'leadTimeline'],
              outputVariable: 'leadId'
            }
          },
          {
            id: 'node-9',
            type: 'message',
            position: { x: 100, y: 900 },
            data: { 
              label: 'Thank You',
              message: 'Thanks, {{leadName}}! Someone from our team will reach out to you shortly at {{leadEmail}}.'
            }
          },
          {
            id: 'node-10',
            type: 'end',
            position: { x: 100, y: 1000 },
            data: { label: 'End' }
          }
        ],
        edges: [
          { id: 'edge-1-2', source: 'node-1', target: 'node-2' },
          { id: 'edge-2-3', source: 'node-2', target: 'node-3' },
          { id: 'edge-3-4', source: 'node-3', target: 'node-4' },
          { id: 'edge-4-5', source: 'node-4', target: 'node-5' },
          { id: 'edge-5-6', source: 'node-5', target: 'node-6' },
          { id: 'edge-6-7', source: 'node-6', target: 'node-7' },
          { id: 'edge-7-8', source: 'node-7', target: 'node-8' },
          { id: 'edge-8-9', source: 'node-8', target: 'node-9' },
          { id: 'edge-9-10', source: 'node-9', target: 'node-10' }
        ]
      }
    };
    
    return templates[templateId] || null;
  }

  /**
   * Create a new workflow from a template
   * 
   * @param {string} chatbotId - ID of the chatbot
   * @param {string} templateId - ID of the template to use
   * @param {string} userId - ID of the user creating the workflow
   * @param {Object} customData - Custom data to override template defaults
   * @returns {Object} Created workflow
   */
  static async createWorkflowFromTemplate(chatbotId, templateId, userId, customData = {}) {
    try {
      const template = await this.getTemplateById(templateId);
      
      if (!template) {
        throw new Error(`Template with ID ${templateId} not found`);
      }
      
      // Merge template data with custom data
      const workflowData = {
        name: customData.name || `${template.name} Workflow`,
        description: customData.description || template.description,
        chatbotId,
        nodes: template.definition.nodes,
        edges: template.definition.edges,
        isActive: false,
        createdBy: userId,
        ...customData
      };
      
      // Create the workflow using the workflow service
      return await WorkflowService.createWorkflow(workflowData, userId);
    } catch (error) {
      console.error('Error creating workflow from template:', error);
      throw error;
    }
  }
}

module.exports = WorkflowTemplateService;
