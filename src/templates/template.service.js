/**
 * Template Service
 * 
 * Provides functionality for managing and using chatbot templates
 * Templates are pre-defined configurations for common chatbot use cases
 */

const { v4: uuidv4 } = require('uuid');
require('@src/utils');
require('@src/storage');

/**
 * Template Service class
 */
class TemplateService {
  /**
   * Constructor
   * @param {Object} options - Template service options
   */
  constructor(options = {}) {
    this.options = {
      storageService: localStorageService,
      ...options
    };
    
    this.initialized = false;
    this.initPromise = null;
    
    logger.info('Template Service initialized');
  }
  
  /**
   * Initialize the template service
   * @returns {Promise<boolean>} - Whether initialization was successful
   */
  async initialize() {
    if (this.initialized) return true;
    
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = new Promise(async (resolve) => {
      try {
        // Initialize storage service
        await this.options.storageService.initialize();
        
        // Create default templates if they don't exist
        await this._createDefaultTemplates();
        
        this.initialized = true;
        logger.info('Template Service initialized successfully');
        resolve(true);
      } catch (error) {
        logger.error('Error initializing Template Service:', error.message);
        resolve(false);
      }
    });
    
    return this.initPromise;
  }
  
  /**
   * Create default templates
   * @private
   */
  async _createDefaultTemplates() {
    const defaultTemplates = [
      {
        id: 'customer-support',
        name: 'Customer Support',
        description: 'A template for customer support chatbots',
        category: 'business',
        icon: 'headset',
        config: {
          personality: {
            traits: {
              helpfulness: 0.9,
              formality: 0.7,
              friendliness: 0.8,
              patience: 0.9
            },
            tone: 'professional',
            language: 'concise'
          },
          intents: [
            'greeting',
            'farewell',
            'help',
            'product_info',
            'order_status',
            'return_policy',
            'speak_to_human',
            'complaint',
            'thank_you'
          ],
          responses: {
            greeting: 'Hello! I\'m {{bot_name}}, your customer support assistant. How can I help you today?',
            farewell: 'Thank you for contacting us. If you need any further assistance, don\'t hesitate to reach out!',
            help: 'I can help you with product information, order status, returns, and more. What do you need assistance with?',
            product_info: 'I\'d be happy to provide information about our products. Could you specify which product you\'re interested in?',
            order_status: 'I can check the status of your order. Could you please provide your order number?',
            return_policy: 'Our return policy allows returns within 30 days of purchase. Would you like more details about the return process?',
            speak_to_human: 'I understand you\'d like to speak with a human agent. I\'ll connect you with one of our support representatives shortly.',
            complaint: 'I\'m sorry to hear you\'re experiencing an issue. Could you please provide more details so I can help resolve this?',
            thank_you: 'You\'re welcome! Is there anything else I can assist you with today?',
            fallback: 'I\'m not sure I understand. Could you please rephrase your question?'
          },
          plugins: [
            'sentiment-analysis',
            'entity-recognition',
            'knowledge-base'
          ],
          settings: {
            handoff_threshold: 3, // Number of fallbacks before offering human handoff
            greeting_delay: 500, // Delay before sending greeting in ms
            inactivity_timeout: 300000, // 5 minutes in ms
            max_message_length: 500
          }
        }
      },
      {
        id: 'sales-assistant',
        name: 'Sales Assistant',
        description: 'A template for sales and lead generation chatbots',
        category: 'business',
        icon: 'shopping-cart',
        config: {
          personality: {
            traits: {
              helpfulness: 0.8,
              formality: 0.6,
              friendliness: 0.9,
              enthusiasm: 0.8,
              persuasiveness: 0.7
            },
            tone: 'enthusiastic',
            language: 'persuasive'
          },
          intents: [
            'greeting',
            'farewell',
            'product_inquiry',
            'pricing',
            'discount',
            'features',
            'comparison',
            'testimonials',
            'purchase',
            'contact_sales_rep',
            'thank_you'
          ],
          responses: {
            greeting: 'Hi there! I\'m {{bot_name}}, your personal sales assistant. How can I help you find the perfect solution today?',
            farewell: 'Thank you for your interest! Feel free to return if you have any more questions or when you\'re ready to make a purchase.',
            product_inquiry: 'I\'d be delighted to tell you about our products. What specific solution are you looking for?',
            pricing: 'Our pricing is designed to provide excellent value. Would you like to see our different pricing tiers?',
            discount: 'We do offer special discounts for new customers and bulk purchases. Would you like me to explain our current promotions?',
            features: 'Our product comes with numerous powerful features. Which aspects are most important for your needs?',
            comparison: 'I can definitely help you compare our offerings with alternatives. What specific aspects would you like to compare?',
            testimonials: 'Our customers love our products! Here\'s what some of them have to say...',
            purchase: 'Great choice! I can help you complete your purchase. Would you like to proceed with the standard package or would you prefer a customized solution?',
            contact_sales_rep: 'I\'d be happy to connect you with one of our sales representatives who can provide personalized assistance. Could I get your contact information?',
            thank_you: 'You\'re welcome! I\'m here to help you find the perfect solution for your needs.',
            fallback: 'That\'s an interesting question. To better assist you, could you provide more details about what you\'re looking for?'
          },
          plugins: [
            'lead-capture',
            'product-recommender',
            'appointment-scheduler'
          ],
          settings: {
            follow_up_delay: 86400000, // 24 hours in ms
            lead_capture_threshold: 2, // Number of interactions before asking for contact info
            discount_offer_threshold: 5, // Number of interactions before offering discount
            max_message_length: 500
          }
        }
      },
      {
        id: 'faq-bot',
        name: 'FAQ Bot',
        description: 'A template for frequently asked questions chatbots',
        category: 'information',
        icon: 'question-circle',
        config: {
          personality: {
            traits: {
              helpfulness: 0.9,
              formality: 0.5,
              friendliness: 0.7,
              patience: 0.8,
              precision: 0.9
            },
            tone: 'informative',
            language: 'clear'
          },
          intents: [
            'greeting',
            'farewell',
            'faq_question',
            'help',
            'contact_info',
            'search',
            'thank_you'
          ],
          responses: {
            greeting: 'Hello! I\'m {{bot_name}}, your FAQ assistant. Ask me any questions about our products, services, or policies.',
            farewell: 'Thank you for using our FAQ bot. If you have more questions in the future, feel free to ask!',
            faq_question: 'Here\'s what I found about that:',
            help: 'I can answer frequently asked questions about our company, products, services, and policies. What would you like to know?',
            contact_info: 'You can contact our support team at support@example.com or call us at (555) 123-4567 during business hours.',
            search: 'Let me search for information about that...',
            thank_you: 'You\'re welcome! Is there anything else you\'d like to know?',
            fallback: 'I don\'t have specific information about that. Would you like me to connect you with our support team?'
          },
          plugins: [
            'knowledge-base',
            'semantic-search',
            'feedback-collector'
          ],
          settings: {
            search_threshold: 0.7, // Minimum confidence score for search results
            max_search_results: 3, // Maximum number of search results to return
            feedback_prompt_threshold: 3, // Number of interactions before asking for feedback
            max_message_length: 500
          }
        }
      },
      {
        id: 'educational-assistant',
        name: 'Educational Assistant',
        description: 'A template for educational and tutoring chatbots',
        category: 'education',
        icon: 'graduation-cap',
        config: {
          personality: {
            traits: {
              helpfulness: 0.9,
              formality: 0.6,
              friendliness: 0.8,
              patience: 0.9,
              encouragement: 0.9
            },
            tone: 'supportive',
            language: 'educational'
          },
          intents: [
            'greeting',
            'farewell',
            'explain_concept',
            'practice_problem',
            'check_answer',
            'study_tips',
            'progress_check',
            'help',
            'thank_you'
          ],
          responses: {
            greeting: 'Hello! I\'m {{bot_name}}, your educational assistant. How can I help you learn today?',
            farewell: 'Keep up the great work with your studies! Come back anytime you need help.',
            explain_concept: 'Let me explain this concept in a way that\'s easy to understand:',
            practice_problem: 'Here\'s a practice problem for you to try:',
            check_answer: 'Let me check your answer...',
            study_tips: 'Here are some effective study tips that might help you:',
            progress_check: 'You\'re making great progress! Let\'s review what you\'ve learned so far.',
            help: 'I can explain concepts, provide practice problems, check your answers, and offer study tips. What would you like help with?',
            thank_you: 'You\'re welcome! Remember, asking questions is an important part of learning.',
            fallback: 'That\'s an interesting question. Let me think about how to explain this clearly...'
          },
          plugins: [
            'knowledge-base',
            'progress-tracker',
            'quiz-generator'
          ],
          settings: {
            difficulty_adaptation: true, // Adapt difficulty based on user performance
            explanation_detail_level: 'medium', // 'basic', 'medium', or 'detailed'
            encouragement_frequency: 3, // Provide encouragement every N interactions
            max_message_length: 1000
          }
        }
      },
      {
        id: 'personal-assistant',
        name: 'Personal Assistant',
        description: 'A template for personal assistant chatbots',
        category: 'personal',
        icon: 'user',
        config: {
          personality: {
            traits: {
              helpfulness: 0.9,
              formality: 0.4,
              friendliness: 0.9,
              efficiency: 0.8,
              adaptability: 0.8
            },
            tone: 'conversational',
            language: 'natural'
          },
          intents: [
            'greeting',
            'farewell',
            'reminder',
            'schedule',
            'weather',
            'news',
            'recommendation',
            'note',
            'help',
            'thank_you'
          ],
          responses: {
            greeting: 'Hi there! I\'m {{bot_name}}, your personal assistant. How can I help you today?',
            farewell: 'Goodbye! Have a wonderful day. I\'ll be here when you need me again.',
            reminder: 'I\'ll remind you about that. When would you like to be reminded?',
            schedule: 'Let me check your schedule...',
            weather: 'Let me check the weather for you...',
            news: 'Here are the latest headlines I found:',
            recommendation: 'Based on your preferences, I think you might like:',
            note: 'I\'ve made a note of that for you.',
            help: 'I can help you with reminders, schedules, weather updates, news, recommendations, and taking notes. What would you like me to do?',
            thank_you: 'You\'re welcome! Is there anything else I can help you with?',
            fallback: 'I\'m not sure how to help with that yet, but I\'m learning new skills all the time.'
          },
          plugins: [
            'reminder-manager',
            'calendar-integration',
            'weather-api',
            'news-aggregator'
          ],
          settings: {
            proactive_suggestions: true, // Offer suggestions proactively
            context_memory_length: 10, // Number of previous interactions to consider for context
            personalization_level: 'high', // 'low', 'medium', or 'high'
            max_message_length: 500
          }
        }
      }
    ];
    
    for (const template of defaultTemplates) {
      // Check if template already exists
      const existingTemplate = await this.options.storageService.retrieve('templates', template.id);
      
      if (!existingTemplate) {
        // Create template
        await this.options.storageService.store('templates', template.id, template);
        logger.info(`Created default template: ${template.name}`);
      }
    }
  }
  
  /**
   * Get all templates
   * @param {Object} query - Query parameters
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Array of templates
   */
  async getAllTemplates(query = {}, options = {}) {
    await this.initialize();
    
    return this.options.storageService.query('templates', query, options);
  }
  
  /**
   * Get template by ID
   * @param {string} id - Template ID
   * @returns {Promise<Object|null>} - Template or null if not found
   */
  async getTemplateById(id) {
    await this.initialize();
    
    return this.options.storageService.retrieve('templates', id);
  }
  
  /**
   * Create a new template
   * @param {Object} template - Template data
   * @returns {Promise<Object>} - Created template
   */
  async createTemplate(template) {
    await this.initialize();
    
    const templateId = template.id || uuidv4();
    
    // Validate template
    this._validateTemplate(template);
    
    // Store template
    return this.options.storageService.store('templates', templateId, template);
  }
  
  /**
   * Update an existing template
   * @param {string} id - Template ID
   * @param {Object} template - Template data
   * @returns {Promise<Object|null>} - Updated template or null if not found
   */
  async updateTemplate(id, template) {
    await this.initialize();
    
    // Check if template exists
    const existingTemplate = await this.options.storageService.retrieve('templates', id);
    
    if (!existingTemplate) {
      logger.warn(`Template not found: ${id}`);
      return null;
    }
    
    // Validate template
    this._validateTemplate(template);
    
    // Update template
    return this.options.storageService.store('templates', id, {
      ...existingTemplate,
      ...template,
      id, // Ensure ID remains the same
      updated_at: Date.now()
    });
  }
  
  /**
   * Delete a template
   * @param {string} id - Template ID
   * @returns {Promise<boolean>} - Whether deletion was successful
   */
  async deleteTemplate(id) {
    await this.initialize();
    
    return this.options.storageService.delete('templates', id);
  }
  
  /**
   * Apply a template to a bot
   * @param {string} templateId - Template ID
   * @param {string} botId - Bot ID
   * @param {Object} customizations - Custom overrides for the template
   * @returns {Promise<Object|null>} - Updated bot or null if template or bot not found
   */
  async applyTemplate(templateId, botId, customizations = {}) {
    await this.initialize();
    
    // Get template
    const template = await this.options.storageService.retrieve('templates', templateId);
    
    if (!template) {
      logger.warn(`Template not found: ${templateId}`);
      return null;
    }
    
    // Get bot
    const bot = await this.options.storageService.retrieve('bots', botId);
    
    if (!bot) {
      logger.warn(`Bot not found: ${botId}`);
      return null;
    }
    
    // Apply template to bot
    const updatedBot = {
      ...bot,
      template_id: templateId,
      personality: customizations.personality || template.config.personality,
      intents: customizations.intents || template.config.intents,
      responses: {
        ...template.config.responses,
        ...(customizations.responses || {})
      },
      plugins: customizations.plugins || template.config.plugins,
      settings: {
        ...template.config.settings,
        ...(customizations.settings || {})
      },
      updated_at: Date.now()
    };
    
    // Store updated bot
    return this.options.storageService.store('bots', botId, updatedBot);
  }
  
  /**
   * Create a bot from a template
   * @param {string} templateId - Template ID
   * @param {Object} botData - Bot data
   * @param {Object} customizations - Custom overrides for the template
   * @returns {Promise<Object|null>} - Created bot or null if template not found
   */
  async createBotFromTemplate(templateId, botData, customizations = {}) {
    await this.initialize();
    
    // Get template
    const template = await this.options.storageService.retrieve('templates', templateId);
    
    if (!template) {
      logger.warn(`Template not found: ${templateId}`);
      return null;
    }
    
    // Create bot
    const botId = botData.id || uuidv4();
    const bot = {
      id: botId,
      name: botData.name || `${template.name} Bot`,
      description: botData.description || `Bot created from ${template.name} template`,
      template_id: templateId,
      personality: customizations.personality || template.config.personality,
      intents: customizations.intents || template.config.intents,
      responses: {
        ...template.config.responses,
        ...(customizations.responses || {})
      },
      plugins: customizations.plugins || template.config.plugins,
      settings: {
        ...template.config.settings,
        ...(customizations.settings || {})
      },
      created_at: Date.now(),
      updated_at: Date.now()
    };
    
    // Store bot
    return this.options.storageService.store('bots', botId, bot);
  }
  
  /**
   * Validate a template
   * @param {Object} template - Template to validate
   * @throws {Error} - If template is invalid
   * @private
   */
  _validateTemplate(template) {
    // Check required fields
    if (!template.name) {
      throw new Error('Template name is required');
    }
    
    if (!template.description) {
      throw new Error('Template description is required');
    }
    
    if (!template.category) {
      throw new Error('Template category is required');
    }
    
    if (!template.config) {
      throw new Error('Template config is required');
    }
    
    // Check config fields
    const config = template.config;
    
    if (!config.personality) {
      throw new Error('Template personality is required');
    }
    
    if (!config.intents || !Array.isArray(config.intents) || config.intents.length === 0) {
      throw new Error('Template intents must be a non-empty array');
    }
    
    if (!config.responses || typeof config.responses !== 'object') {
      throw new Error('Template responses must be an object');
    }
    
    // Ensure essential responses exist
    const essentialResponses = ['greeting', 'farewell', 'fallback'];
    for (const response of essentialResponses) {
      if (!config.responses[response]) {
        throw new Error(`Template response for "${response}" is required`);
      }
    }
  }
}

// Create singleton instance
const templateService = new TemplateService();

module.exports = templateService;
