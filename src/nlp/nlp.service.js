/**
 * Advanced NLP Service
 * 
 * Provides advanced natural language processing capabilities for chatbots
 * Integrates with open-source NLP engines (spaCy, NLTK) for local processing
 * Supports advanced entity recognition using Hugging Face models
 * Supports intent classification with local models
 * Provides contextual understanding across conversation turns
 * Includes sentiment analysis using open-source libraries
 */

const axios = require('axios');
const { logger } = require('../utils');
const { spacyEngine, nltkEngine } = require('./engines');
const { entityRecognitionService } = require('./entity');
const { intentClassificationService } = require('./intent');
const { contextManagementService } = require('./context');
const { sentimentAnalysisService } = require('./sentiment');

/**
 * NLP Service class
 */
class NLPService {
  /**
   * Constructor
   * @param {Object} options - NLP service options
   */
  constructor(options = {}) {
    this.options = {
      apiKey: process.env.NLP_API_KEY,
      apiUrl: process.env.NLP_API_URL || 'https://api.nlp-service.com',
      preferLocalProcessing: process.env.PREFER_LOCAL_NLP === 'true' || false,
      defaultEngine: process.env.DEFAULT_NLP_ENGINE || 'spacy', // 'spacy' or 'nltk'
      useAdvancedEntityRecognition: process.env.USE_ADVANCED_ENTITY_RECOGNITION === 'true' || true,
      useAdvancedIntentClassification: process.env.USE_ADVANCED_INTENT_CLASSIFICATION === 'true' || true,
      useContextualUnderstanding: process.env.USE_CONTEXTUAL_UNDERSTANDING === 'true' || true,
      useSentimentAnalysis: process.env.USE_SENTIMENT_ANALYSIS === 'true' || true,
      ...options
    };
    
    this.axios = axios.create({
      baseURL: this.options.apiUrl,
      headers: {
        'Authorization': `Bearer ${this.options.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Initialize engines
    this.engines = {
      spacy: spacyEngine,
      nltk: nltkEngine
    };
    
    // Try to initialize the default engine
    if (this.options.preferLocalProcessing) {
      this._initializeDefaultEngine();
    }
    
    // Initialize advanced entity recognition if enabled
    if (this.options.useAdvancedEntityRecognition) {
      this._initializeEntityRecognition();
    }
    
    // Initialize advanced intent classification if enabled
    if (this.options.useAdvancedIntentClassification) {
      this._initializeIntentClassification();
    }
    
    // Initialize contextual understanding if enabled
    if (this.options.useContextualUnderstanding) {
      this._initializeContextualUnderstanding();
    }
    
    // Initialize sentiment analysis if enabled
    if (this.options.useSentimentAnalysis) {
      this._initializeSentimentAnalysis();
    }
    
    logger.info('NLP Service initialized with ' + 
      (this.options.preferLocalProcessing ? 'local processing preferred' : 'remote processing preferred') +
      (this.options.useAdvancedEntityRecognition ? ', advanced entity recognition' : '') +
      (this.options.useAdvancedIntentClassification ? ', advanced intent classification' : '') +
      (this.options.useContextualUnderstanding ? ', contextual understanding' : '') +
      (this.options.useSentimentAnalysis ? ', sentiment analysis' : ''));
  }
  
  /**
   * Initialize the default NLP engine
   * @private
   */
  async _initializeDefaultEngine() {
    try {
      const engine = this.engines[this.options.defaultEngine];
      if (engine) {
        const initialized = await engine.initialize();
        if (initialized) {
          logger.info(`Default NLP engine (${this.options.defaultEngine}) initialized successfully`);
        } else {
          logger.warn(`Failed to initialize default NLP engine (${this.options.defaultEngine})`);
        }
      } else {
        logger.warn(`Unknown default NLP engine: ${this.options.defaultEngine}`);
      }
    } catch (error) {
      logger.error('Error initializing default NLP engine:', error.message);
    }
  }
  
  /**
   * Initialize advanced entity recognition
   * @private
   */
  async _initializeEntityRecognition() {
    try {
      const initialized = await entityRecognitionService.initialize();
      if (initialized) {
        logger.info('Advanced entity recognition initialized successfully');
        this.entityRecognitionInitialized = true;
      } else {
        logger.warn('Failed to initialize advanced entity recognition');
        this.entityRecognitionInitialized = false;
      }
    } catch (error) {
      logger.error('Error initializing advanced entity recognition:', error.message);
      this.entityRecognitionInitialized = false;
    }
  }
  
  /**
   * Initialize advanced intent classification
   * @private
   */
  async _initializeIntentClassification() {
    try {
      const initialized = await intentClassificationService.initialize();
      if (initialized) {
        logger.info('Advanced intent classification initialized successfully');
        this.intentClassificationInitialized = true;
      } else {
        logger.warn('Failed to initialize advanced intent classification');
        this.intentClassificationInitialized = false;
      }
    } catch (error) {
      logger.error('Error initializing advanced intent classification:', error.message);
      this.intentClassificationInitialized = false;
    }
  }
  
  /**
   * Initialize contextual understanding
   * @private
   */
  async _initializeContextualUnderstanding() {
    try {
      const initialized = await contextManagementService.initialize();
      if (initialized) {
        logger.info('Contextual understanding initialized successfully');
        this.contextualUnderstandingInitialized = true;
      } else {
        logger.warn('Failed to initialize contextual understanding');
        this.contextualUnderstandingInitialized = false;
      }
    } catch (error) {
      logger.error('Error initializing contextual understanding:', error.message);
      this.contextualUnderstandingInitialized = false;
    }
  }
  
  /**
   * Initialize sentiment analysis
   * @private
   */
  async _initializeSentimentAnalysis() {
    try {
      const initialized = await sentimentAnalysisService.initialize();
      if (initialized) {
        logger.info('Sentiment analysis initialized successfully');
        this.sentimentAnalysisInitialized = true;
      } else {
        logger.warn('Failed to initialize sentiment analysis');
        this.sentimentAnalysisInitialized = false;
      }
    } catch (error) {
      logger.error('Error initializing sentiment analysis:', error.message);
      this.sentimentAnalysisInitialized = false;
    }
  }
  
  /**
   * Get the appropriate engine for a specific NLP task
   * @param {string} task - The NLP task (e.g., 'entities', 'sentiment')
   * @returns {Object} - The selected engine or null for remote processing
   * @private
   */
  _getEngineForTask(task) {
    if (!this.options.preferLocalProcessing) {
      return null; // Use remote processing
    }
    
    // Use the default engine if available
    const defaultEngine = this.engines[this.options.defaultEngine];
    if (defaultEngine && defaultEngine.initialized) {
      return defaultEngine;
    }
    
    // Try other engines if the default is not available
    for (const [name, engine] of Object.entries(this.engines)) {
      if (engine.initialized) {
        logger.info(`Using ${name} engine for ${task} as fallback`);
        return engine;
      }
    }
    
    logger.warn(`No local NLP engines available for ${task}, falling back to remote processing`);
    return null; // Fall back to remote processing
  }
  
  /**
   * Extract entities from text
   * @param {string} text - Text to extract entities from
   * @param {Object} options - Entity extraction options
   * @returns {Promise<Array>} - Array of extracted entities
   */
  async extractEntities(text, options = {}) {
    // Use advanced entity recognition if enabled and initialized
    if (this.options.useAdvancedEntityRecognition && this.entityRecognitionInitialized) {
      try {
        const entities = await entityRecognitionService.extractEntities(text, options);
        if (entities && entities.length > 0) {
          return entities;
        }
        // Fall back to standard processing if no entities found
      } catch (error) {
        logger.error('Error extracting entities with advanced recognition:', error.message);
        // Fall back to standard processing on error
      }
    }
    
    // Standard processing with local engines
    const engine = this._getEngineForTask('entities');
    
    if (engine) {
      try {
        return await engine.extractEntities(text);
      } catch (error) {
        logger.error(`Error extracting entities with ${this.options.defaultEngine}:`, error.message);
        // Fall back to remote processing on error
      }
    }
    
    // Remote processing
    try {
      const response = await this.axios.post('/entities', { text });
      return response.data.entities;
    } catch (error) {
      logger.error('Error extracting entities with remote API:', error.message);
      return [];
    }
  }
  
  /**
   * Extract keywords from text
   * @param {string} text - Text to extract keywords from
   * @returns {Promise<Array>} - Array of extracted keywords
   */
  async extractKeywords(text) {
    const engine = this._getEngineForTask('keywords');
    
    if (engine) {
      try {
        return await engine.extractKeywords(text);
      } catch (error) {
        logger.error(`Error extracting keywords with ${this.options.defaultEngine}:`, error.message);
        // Fall back to remote processing on error
      }
    }
    
    // Remote processing
    try {
      const response = await this.axios.post('/keywords', { text });
      return response.data.keywords;
    } catch (error) {
      logger.error('Error extracting keywords with remote API:', error.message);
      return [];
    }
  }
  
  /**
   * Analyze sentiment of text
   * @param {string} text - Text to analyze sentiment of
   * @param {Object} options - Sentiment analysis options
   * @returns {Promise<Object>} - Sentiment analysis result
   */
  async analyzeSentiment(text, options = {}) {
    // Use advanced sentiment analysis if enabled and initialized
    if (this.options.useSentimentAnalysis && this.sentimentAnalysisInitialized) {
      try {
        return await sentimentAnalysisService.analyzeSentiment(text, options);
      } catch (error) {
        logger.error('Error analyzing sentiment with advanced analysis:', error.message);
        // Fall back to standard processing on error
      }
    }
    
    // Standard processing with local engines
    const engine = this._getEngineForTask('sentiment');
    
    if (engine) {
      try {
        return await engine.analyzeSentiment(text);
      } catch (error) {
        logger.error(`Error analyzing sentiment with ${this.options.defaultEngine}:`, error.message);
        // Fall back to remote processing on error
      }
    }
    
    // Remote processing
    try {
      const response = await this.axios.post('/sentiment', { text });
      return response.data;
    } catch (error) {
      logger.error('Error analyzing sentiment with remote API:', error.message);
      return { 
        text,
        sentiment: {
          score: 0,
          label: 'neutral',
          error: error.message
        },
        emotions: {
          joy: 0,
          sadness: 0,
          anger: 0,
          fear: 0,
          surprise: 0
        }
      };
    }
  }
  
  /**
   * Track sentiment over a conversation
   * @param {string} contextId - Conversation context ID
   * @param {number} limit - Maximum number of messages to consider
   * @returns {Promise<Object>} - Sentiment tracking result
   */
  async trackConversationSentiment(contextId, limit = 10) {
    if (!this.options.useSentimentAnalysis || !this.sentimentAnalysisInitialized) {
      throw new Error('Sentiment analysis is not enabled or initialized');
    }
    
    if (!this.options.useContextualUnderstanding || !this.contextualUnderstandingInitialized) {
      throw new Error('Contextual understanding is required for conversation sentiment tracking');
    }
    
    try {
      // Get conversation history
      const history = await contextManagementService.getConversationHistory(contextId, limit);
      
      // Filter messages with NLP data
      const messagesWithSentiment = history.filter(msg => msg.nlpData && msg.nlpData.sentiment);
      
      if (messagesWithSentiment.length === 0) {
        return {
          averageScore: 0,
          label: 'neutral',
          messageCount: 0,
          error: 'No messages with sentiment data found'
        };
      }
      
      // Track sentiment
      return sentimentAnalysisService.trackSentiment(messagesWithSentiment);
    } catch (error) {
      logger.error('Error tracking conversation sentiment:', error.message);
      throw error;
    }
  }
  
  /**
   * Detect language of text
   * @param {string} text - Text to detect language of
   * @returns {Promise<Object>} - Language detection result
   */
  async detectLanguage(text) {
    const engine = this._getEngineForTask('language');
    
    if (engine) {
      try {
        return await engine.detectLanguage(text);
      } catch (error) {
        logger.error(`Error detecting language with ${this.options.defaultEngine}:`, error.message);
        // Fall back to remote processing on error
      }
    }
    
    // Remote processing
    try {
      const response = await this.axios.post('/language', { text });
      return response.data;
    } catch (error) {
      logger.error('Error detecting language with remote API:', error.message);
      return { language: 'en', confidence: 0 };
    }
  }
  
  /**
   * Classify text into categories
   * @param {string} text - Text to classify
   * @param {Array} categories - Categories to classify into
   * @returns {Promise<Object>} - Classification result
   */
  async classifyText(text, categories = []) {
    try {
      const response = await this.axios.post('/classify', { text, categories });
      return response.data;
    } catch (error) {
      logger.error('Error classifying text:', error.message);
      return { category: null, confidence: 0 };
    }
  }
  
  /**
   * Generate embeddings for text
   * @param {string} text - Text to generate embeddings for
   * @returns {Promise<Object>} - Embeddings result
   */
  async generateEmbeddings(text) {
    try {
      const response = await this.axios.post('/embeddings', { text });
      return response.data;
    } catch (error) {
      logger.error('Error generating embeddings:', error.message);
      return { embeddings: [] };
    }
  }
  
  /**
   * Summarize text
   * @param {string} text - Text to summarize
   * @param {Object} options - Summarization options
   * @returns {Promise<Object>} - Summarization result
   */
  async summarizeText(text, options = { maxLength: 100 }) {
    try {
      const response = await this.axios.post('/summarize', { text, ...options });
      return response.data;
    } catch (error) {
      logger.error('Error summarizing text:', error.message);
      return { summary: '' };
    }
  }
  
  /**
   * Parse intent from text
   * @param {string} text - Text to parse intent from
   * @param {Object} options - Intent parsing options
   * @returns {Promise<Object>} - Parsed intent
   */
  async parseIntent(text, options = {}) {
    // Use advanced intent classification if enabled and initialized
    if (this.options.useAdvancedIntentClassification && this.intentClassificationInitialized) {
      try {
        const result = await intentClassificationService.classifyIntent(text, options);
        if (result.intent) {
          return result;
        }
        // Fall back to standard processing if no intent found
      } catch (error) {
        logger.error('Error classifying intent with advanced classification:', error.message);
        // Fall back to standard processing on error
      }
    }
    
    // Standard processing with local engines
    const engine = this._getEngineForTask('intent');
    
    if (engine) {
      try {
        return await engine.parseIntent(text);
      } catch (error) {
        logger.error(`Error parsing intent with ${this.options.defaultEngine}:`, error.message);
        // Fall back to remote processing on error
      }
    }
    
    // Remote processing
    try {
      const response = await this.axios.post('/intent', { text });
      return response.data.intent;
    } catch (error) {
      logger.error('Error parsing intent with remote API:', error.message);
      return { intent: null, confidence: 0, intents: [] };
    }
  }
  
  /**
   * Process text with multiple NLP features
   * @param {string} text - Text to process
   * @param {Array<string>} features - Features to extract (e.g., 'entities', 'sentiment', 'keywords', 'intent')
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} - Extracted features
   */
  async processText(text, features = ['entities', 'keywords'], options = {}) {
    const result = {};
    
    // Process each feature
    for (const feature of features) {
      switch (feature) {
        case 'entities':
          result.entities = await this.extractEntities(text, options);
          break;
        case 'keywords':
          result.keywords = await this.extractKeywords(text);
          break;
        case 'sentiment':
          result.sentiment = await this.analyzeSentiment(text);
          break;
        case 'summary':
          result.summary = await this.summarizeText(text, options);
          break;
        case 'intent':
          result.intent = await this.parseIntent(text, options);
          break;
        default:
          logger.warn(`Unknown NLP feature: ${feature}`);
      }
    }
    
    return result;
  }
  
  /**
   * Process text with contextual understanding
   * @param {string} text - Text to process
   * @param {string} contextId - Conversation context ID
   * @param {Array<string>} features - Features to extract
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} - Processing result with context
   */
  async processTextWithContext(text, contextId, features = ['entities', 'intent'], options = {}) {
    if (!this.options.useContextualUnderstanding || !this.contextualUnderstandingInitialized) {
      // Fall back to regular processing if contextual understanding is not available
      return this.processText(text, features, options);
    }
    
    try {
      // Get the conversation context
      const context = await contextManagementService.getContext(contextId);
      
      if (!context) {
        logger.warn(`Context not found for ID: ${contextId}, creating new context`);
        // Create a new context if not found
        const userId = options.userId || 'anonymous';
        await contextManagementService.createContext(userId, options.metadata || {});
      }
      
      // Resolve references in the text (pronouns, etc.)
      const resolvedReferences = await contextManagementService.resolveReferences(contextId, text);
      
      // Process text with NLP features
      const nlpResult = await this.processText(text, features, options);
      
      // Add the processed message to the context
      await contextManagementService.addMessage(contextId, text, 'user', nlpResult);
      
      // Return the result with context information
      return {
        ...nlpResult,
        context: {
          id: contextId,
          resolvedReferences,
          activeEntities: await contextManagementService.getActiveEntities(contextId),
          recentIntents: await contextManagementService.getRecentIntents(contextId, 3)
        }
      };
    } catch (error) {
      logger.error('Error processing text with context:', error.message);
      // Fall back to regular processing
      return this.processText(text, features, options);
    }
  }
  
  /**
   * Create a new conversation context
   * @param {string} userId - User ID
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} - Created context
   */
  async createConversationContext(userId, metadata = {}) {
    if (!this.options.useContextualUnderstanding || !this.contextualUnderstandingInitialized) {
      throw new Error('Contextual understanding is not enabled or initialized');
    }
    
    try {
      const context = await contextManagementService.createContext(userId, metadata);
      return context;
    } catch (error) {
      logger.error('Error creating conversation context:', error.message);
      throw error;
    }
  }
  
  /**
   * Get a conversation context
   * @param {string} contextId - Context ID
   * @returns {Promise<Object>} - Conversation context
   */
  async getConversationContext(contextId) {
    if (!this.options.useContextualUnderstanding || !this.contextualUnderstandingInitialized) {
      throw new Error('Contextual understanding is not enabled or initialized');
    }
    
    try {
      const context = await contextManagementService.getContext(contextId);
      return context;
    } catch (error) {
      logger.error('Error getting conversation context:', error.message);
      throw error;
    }
  }
  
  /**
   * Get conversation history
   * @param {string} contextId - Context ID
   * @param {number} limit - Maximum number of messages to return
   * @returns {Promise<Array>} - Conversation history
   */
  async getConversationHistory(contextId, limit = 10) {
    if (!this.options.useContextualUnderstanding || !this.contextualUnderstandingInitialized) {
      throw new Error('Contextual understanding is not enabled or initialized');
    }
    
    try {
      const history = await contextManagementService.getConversationHistory(contextId, limit);
      return history;
    } catch (error) {
      logger.error('Error getting conversation history:', error.message);
      throw error;
    }
  }
}

// Create singleton instance
const nlpService = new NLPService();

module.exports = nlpService;
