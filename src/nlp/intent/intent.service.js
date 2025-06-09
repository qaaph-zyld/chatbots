/**
 * Intent Classification Service
 * 
 * Provides advanced intent classification capabilities using local models
 * that can run directly in Node.js without requiring external services.
 */

const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
require('@src/utils');
require('@src/storage');

// Will use TensorFlow.js for local model inference
let tf;
try {
  tf = require('@tensorflow/tfjs-node');
  logger.info('TensorFlow.js loaded successfully');
} catch (error) {
  logger.warn('TensorFlow.js not available, will use fallback methods:', error.message);
}

class IntentClassificationService {
  constructor() {
    this.models = {};
    this.modelPath = process.env.MODEL_PATH || path.join(process.cwd(), 'models', 'intent');
    this.tokenizers = {};
    this.customIntents = {};
    this.initialized = false;
    this.tfAvailable = !!tf;
    
    // Default configuration
    this.config = {
      defaultModel: 'universal-sentence-encoder',
      fallbackToRules: true,
      confidenceThreshold: 0.7,
      enabledModels: ['universal-sentence-encoder', 'rules'],
      maxExamplesPerIntent: 50,
      vectorDimensions: 512 // Universal Sentence Encoder dimension
    };
  }
  
  /**
   * Initialize the intent classification service
   * @param {Object} config - Configuration options
   * @returns {Promise<boolean>} - True if initialization was successful
   */
  async initialize(config = {}) {
    try {
      // Merge provided config with defaults
      this.config = { ...this.config, ...config };
      
      logger.info('Initializing intent classification service');
      
      // Create model directory if it doesn't exist
      await fs.mkdir(this.modelPath, { recursive: true });
      
      // Load custom intents from storage
      await this.loadCustomIntents();
      
      // Load enabled models
      for (const modelName of this.config.enabledModels) {
        await this.loadModel(modelName);
      }
      
      this.initialized = true;
      logger.info('Intent classification service initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize intent classification service:', error.message);
      return false;
    }
  }
  
  /**
   * Load a model for intent classification
   * @param {string} modelName - Name of the model to load
   * @returns {Promise<boolean>} - True if model was loaded successfully
   */
  async loadModel(modelName) {
    try {
      logger.info(`Loading intent classification model: ${modelName}`);
      
      // Universal Sentence Encoder (TensorFlow.js)
      if (modelName === 'universal-sentence-encoder' && this.tfAvailable) {
        const modelUrl = `file://${path.join(this.modelPath, 'universal-sentence-encoder')}`;
        
        try {
          // Check if model exists locally
          await fs.access(path.join(this.modelPath, 'universal-sentence-encoder', 'model.json'));
          logger.info('Loading Universal Sentence Encoder from local path');
        } catch (error) {
          // Model doesn't exist locally, will load from TF Hub
          logger.info('Universal Sentence Encoder not found locally, will load from TF Hub');
        }
        
        // Load the model (either from local path or TF Hub)
        const useModel = await tf.loadGraphModel(modelUrl, {
          fromTFHub: !await this._modelExistsLocally(modelName)
        });
        
        this.models[modelName] = {
          type: 'tensorflow',
          model: useModel,
          loaded: true
        };
        
        logger.info('Universal Sentence Encoder loaded successfully');
      }
      // Rule-based intent classification (fallback)
      else if (modelName === 'rules') {
        this.models[modelName] = {
          type: 'rules',
          loaded: true
        };
        
        logger.info('Rule-based intent classification enabled');
      }
      
      return true;
    } catch (error) {
      logger.error(`Failed to load model ${modelName}:`, error.message);
      
      // If TensorFlow model fails to load, enable rules as fallback
      if (modelName === 'universal-sentence-encoder' && this.config.fallbackToRules) {
        logger.info('Enabling rule-based intent classification as fallback');
        this.models['rules'] = {
          type: 'rules',
          loaded: true
        };
      }
      
      return false;
    }
  }
  
  /**
   * Check if a model exists locally
   * @param {string} modelName - Name of the model to check
   * @returns {Promise<boolean>} - True if model exists locally
   * @private
   */
  async _modelExistsLocally(modelName) {
    try {
      await fs.access(path.join(this.modelPath, modelName, 'model.json'));
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Save a model locally
   * @param {string} modelName - Name of the model to save
   * @returns {Promise<boolean>} - True if model was saved successfully
   * @private
   */
  async _saveModelLocally(modelName) {
    try {
      if (modelName === 'universal-sentence-encoder' && this.models[modelName]?.loaded) {
        const modelDir = path.join(this.modelPath, modelName);
        await fs.mkdir(modelDir, { recursive: true });
        
        await this.models[modelName].model.save(`file://${modelDir}`);
        logger.info(`Model ${modelName} saved locally`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error(`Failed to save model ${modelName} locally:`, error.message);
      return false;
    }
  }
  
  /**
   * Classify intent from text
   * @param {string} text - Text to classify intent from
   * @param {Object} options - Classification options
   * @returns {Promise<Object>} - Classification result
   */
  async classifyIntent(text, options = {}) {
    if (!this.initialized) {
      throw new Error('Intent classification service not initialized');
    }
    
    const opts = {
      modelName: options.modelName || this.config.defaultModel,
      confidenceThreshold: options.confidenceThreshold || this.config.confidenceThreshold,
      domainId: options.domainId || null,
      includeScores: options.includeScores !== false,
      topK: options.topK || 3
    };
    
    try {
      // Use Universal Sentence Encoder if available and selected
      if (this.models[opts.modelName]?.type === 'tensorflow' && this.tfAvailable) {
        return await this._classifyWithTensorFlow(text, opts);
      }
      // Use rule-based classification as fallback
      else if (this.models['rules']?.loaded || this.config.fallbackToRules) {
        return await this._classifyWithRules(text, opts);
      }
      
      throw new Error('No suitable intent classification method available');
    } catch (error) {
      logger.error('Intent classification error:', error.message);
      return {
        intent: null,
        confidence: 0,
        intents: []
      };
    }
  }
  
  /**
   * Classify intent using TensorFlow.js
   * @param {string} text - Text to classify intent from
   * @param {Object} options - Classification options
   * @returns {Promise<Object>} - Classification result
   * @private
   */
  async _classifyWithTensorFlow(text, options) {
    const modelName = options.modelName;
    const domainId = options.domainId;
    const confidenceThreshold = options.confidenceThreshold;
    const includeScores = options.includeScores;
    const topK = options.topK;
    
    // Get the domain-specific intents or global intents
    const intents = this._getIntentsForDomain(domainId);
    
    if (Object.keys(intents).length === 0) {
      logger.warn(`No intents available for domain ${domainId || 'global'}`);
      return {
        intent: null,
        confidence: 0,
        intents: []
      };
    }
    
    // Get the model
    const model = this.models[modelName].model;
    
    // Generate embedding for the input text
    const inputTensor = tf.tensor2d([text], [1, 1]);
    const embeddings = await model.predict(inputTensor);
    const inputEmbedding = await embeddings.array();
    
    // Calculate similarity with each intent
    const similarities = [];
    
    for (const [intentName, intentData] of Object.entries(intents)) {
      if (!intentData.embeddings || intentData.embeddings.length === 0) {
        continue;
      }
      
      // Calculate cosine similarity with each example
      const intentSimilarities = intentData.embeddings.map(embedding => {
        return this._cosineSimilarity(inputEmbedding[0], embedding);
      });
      
      // Use the maximum similarity as the score for this intent
      const maxSimilarity = Math.max(...intentSimilarities);
      
      similarities.push({
        intent: intentName,
        confidence: maxSimilarity
      });
    }
    
    // Sort by confidence (descending)
    similarities.sort((a, b) => b.confidence - a.confidence);
    
    // Get the top intent
    const topIntent = similarities.length > 0 ? similarities[0] : null;
    
    // Filter intents by confidence threshold and limit to top K
    const filteredIntents = similarities
      .filter(item => item.confidence >= confidenceThreshold)
      .slice(0, topK);
    
    return {
      intent: topIntent && topIntent.confidence >= confidenceThreshold ? topIntent.intent : null,
      confidence: topIntent ? topIntent.confidence : 0,
      intents: includeScores ? filteredIntents : filteredIntents.map(item => item.intent)
    };
  }
  
  /**
   * Classify intent using rule-based approach
   * @param {string} text - Text to classify intent from
   * @param {Object} options - Classification options
   * @returns {Promise<Object>} - Classification result
   * @private
   */
  async _classifyWithRules(text, options) {
    const domainId = options.domainId;
    const confidenceThreshold = options.confidenceThreshold;
    const includeScores = options.includeScores;
    const topK = options.topK;
    
    // Get the domain-specific intents or global intents
    const intents = this._getIntentsForDomain(domainId);
    
    if (Object.keys(intents).length === 0) {
      logger.warn(`No intents available for domain ${domainId || 'global'}`);
      return {
        intent: null,
        confidence: 0,
        intents: []
      };
    }
    
    // Normalize input text
    const normalizedText = text.toLowerCase().trim();
    
    // Calculate similarity with each intent
    const similarities = [];
    
    for (const [intentName, intentData] of Object.entries(intents)) {
      if (!intentData.examples || intentData.examples.length === 0) {
        continue;
      }
      
      // Calculate similarity with each example
      const intentSimilarities = intentData.examples.map(example => {
        const normalizedExample = example.toLowerCase().trim();
        return this._textSimilarity(normalizedText, normalizedExample);
      });
      
      // Use the maximum similarity as the score for this intent
      const maxSimilarity = Math.max(...intentSimilarities);
      
      similarities.push({
        intent: intentName,
        confidence: maxSimilarity
      });
    }
    
    // Sort by confidence (descending)
    similarities.sort((a, b) => b.confidence - a.confidence);
    
    // Get the top intent
    const topIntent = similarities.length > 0 ? similarities[0] : null;
    
    // Filter intents by confidence threshold and limit to top K
    const filteredIntents = similarities
      .filter(item => item.confidence >= confidenceThreshold)
      .slice(0, topK);
    
    return {
      intent: topIntent && topIntent.confidence >= confidenceThreshold ? topIntent.intent : null,
      confidence: topIntent ? topIntent.confidence : 0,
      intents: includeScores ? filteredIntents : filteredIntents.map(item => item.intent)
    };
  }
  
  /**
   * Calculate cosine similarity between two vectors
   * @param {Array<number>} a - First vector
   * @param {Array<number>} b - Second vector
   * @returns {number} - Cosine similarity
   * @private
   */
  _cosineSimilarity(a, b) {
    if (!a || !b || a.length !== b.length) {
      return 0;
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    
    if (normA === 0 || normB === 0) {
      return 0;
    }
    
    return dotProduct / (normA * normB);
  }
  
  /**
   * Calculate text similarity using Jaccard similarity
   * @param {string} a - First text
   * @param {string} b - Second text
   * @returns {number} - Similarity score
   * @private
   */
  _textSimilarity(a, b) {
    if (!a || !b) {
      return 0;
    }
    
    // Tokenize texts into words
    const wordsA = a.split(/\s+/).filter(Boolean);
    const wordsB = b.split(/\s+/).filter(Boolean);
    
    // Create sets of words
    const setA = new Set(wordsA);
    const setB = new Set(wordsB);
    
    // Calculate Jaccard similarity
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    
    return intersection.size / union.size;
  }
  
  /**
   * Get intents for a specific domain
   * @param {string} domainId - Domain ID
   * @returns {Object} - Intents for the domain
   * @private
   */
  _getIntentsForDomain(domainId) {
    const intents = {};
    
    // Add global intents
    if (this.customIntents.global) {
      Object.assign(intents, this.customIntents.global);
    }
    
    // Add domain-specific intents if domain ID is provided
    if (domainId && this.customIntents[domainId]) {
      Object.assign(intents, this.customIntents[domainId]);
    }
    
    return intents;
  }
  
  /**
   * Add or update an intent
   * @param {string} intentName - Name of the intent
   * @param {Array<string>} examples - Example phrases for the intent
   * @param {string} domainId - Domain ID for domain-specific intents
   * @returns {Promise<boolean>} - True if intent was added successfully
   */
  async addIntent(intentName, examples, domainId = 'global') {
    try {
      if (!this.customIntents[domainId]) {
        this.customIntents[domainId] = {};
      }
      
      // Limit the number of examples
      const limitedExamples = examples.slice(0, this.config.maxExamplesPerIntent);
      
      // Create or update intent
      this.customIntents[domainId][intentName] = {
        examples: limitedExamples,
        embeddings: []
      };
      
      // Generate embeddings if TensorFlow.js is available
      if (this.tfAvailable && this.models['universal-sentence-encoder']?.loaded) {
        await this._generateEmbeddings(intentName, limitedExamples, domainId);
      }
      
      // Save to storage
      await this.saveCustomIntents();
      
      return true;
    } catch (error) {
      logger.error('Failed to add intent:', error.message);
      return false;
    }
  }
  
  /**
   * Generate embeddings for intent examples
   * @param {string} intentName - Name of the intent
   * @param {Array<string>} examples - Example phrases for the intent
   * @param {string} domainId - Domain ID for domain-specific intents
   * @returns {Promise<boolean>} - True if embeddings were generated successfully
   * @private
   */
  async _generateEmbeddings(intentName, examples, domainId) {
    try {
      if (!this.tfAvailable || !this.models['universal-sentence-encoder']?.loaded) {
        return false;
      }
      
      const model = this.models['universal-sentence-encoder'].model;
      
      // Generate embeddings for each example
      const inputTensor = tf.tensor2d(examples, [examples.length, 1]);
      const embeddings = await model.predict(inputTensor);
      const embeddingArrays = await embeddings.array();
      
      // Store embeddings
      this.customIntents[domainId][intentName].embeddings = embeddingArrays;
      
      return true;
    } catch (error) {
      logger.error('Failed to generate embeddings:', error.message);
      return false;
    }
  }
  
  /**
   * Remove an intent
   * @param {string} intentName - Name of the intent to remove
   * @param {string} domainId - Domain ID for domain-specific intents
   * @returns {Promise<boolean>} - True if intent was removed successfully
   */
  async removeIntent(intentName, domainId = 'global') {
    try {
      if (!this.customIntents[domainId] || !this.customIntents[domainId][intentName]) {
        return false;
      }
      
      // Remove intent
      delete this.customIntents[domainId][intentName];
      
      // Remove domain if empty
      if (Object.keys(this.customIntents[domainId]).length === 0) {
        delete this.customIntents[domainId];
      }
      
      // Save to storage
      await this.saveCustomIntents();
      
      return true;
    } catch (error) {
      logger.error('Failed to remove intent:', error.message);
      return false;
    }
  }
  
  /**
   * Load custom intents from storage
   * @returns {Promise<boolean>} - True if custom intents were loaded successfully
   * @private
   */
  async loadCustomIntents() {
    try {
      const storage = localStorageService.getCollection('intent_examples');
      const intents = await storage.find({});
      
      this.customIntents = {};
      
      for (const intent of intents) {
        const domainId = intent.domain_id || 'global';
        
        if (!this.customIntents[domainId]) {
          this.customIntents[domainId] = {};
        }
        
        this.customIntents[domainId][intent.intent_name] = {
          examples: intent.examples || [],
          embeddings: intent.embeddings || []
        };
      }
      
      logger.info('Custom intents loaded from storage');
      return true;
    } catch (error) {
      logger.error('Failed to load custom intents:', error.message);
      this.customIntents = { global: {} };
      return false;
    }
  }
  
  /**
   * Save custom intents to storage
   * @returns {Promise<boolean>} - True if custom intents were saved successfully
   * @private
   */
  async saveCustomIntents() {
    try {
      const storage = localStorageService.getCollection('intent_examples');
      
      // Clear existing intents
      await storage.deleteMany({});
      
      // Convert to storage format
      const intents = [];
      
      for (const [domainId, domainIntents] of Object.entries(this.customIntents)) {
        for (const [intentName, intentData] of Object.entries(domainIntents)) {
          intents.push({
            id: uuidv4(),
            domain_id: domainId === 'global' ? null : domainId,
            intent_name: intentName,
            examples: intentData.examples || [],
            embeddings: intentData.embeddings || [],
            created_at: Date.now()
          });
        }
      }
      
      // Save new intents
      if (intents.length > 0) {
        await storage.insertMany(intents);
      }
      
      logger.info('Custom intents saved to storage');
      return true;
    } catch (error) {
      logger.error('Failed to save custom intents:', error.message);
      return false;
    }
  }
  
  /**
   * Get all intents
   * @param {string} domainId - Domain ID for domain-specific intents
   * @returns {Object} - All intents
   */
  getIntents(domainId = null) {
    const result = {};
    
    // Add global intents
    if (this.customIntents.global) {
      for (const [intentName, intentData] of Object.entries(this.customIntents.global)) {
        result[intentName] = {
          examples: intentData.examples,
          exampleCount: intentData.examples.length
        };
      }
    }
    
    // Add domain-specific intents if domain ID is provided
    if (domainId && this.customIntents[domainId]) {
      for (const [intentName, intentData] of Object.entries(this.customIntents[domainId])) {
        result[intentName] = {
          examples: intentData.examples,
          exampleCount: intentData.examples.length
        };
      }
    }
    
    return result;
  }
  
  /**
   * Get available models
   * @returns {Array<Object>} - Array of available models
   */
  getAvailableModels() {
    return Object.entries(this.models).map(([name, model]) => ({
      name,
      type: model.type,
      loaded: model.loaded
    }));
  }
}

// Create singleton instance
const intentClassificationService = new IntentClassificationService();

module.exports = intentClassificationService;
