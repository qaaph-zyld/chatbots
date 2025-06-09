/**
 * Local Model Service
 * 
 * Manages downloading, storing, and using local NLP models for offline use
 */

const fs = require('fs').promises;
const path = require('path');
require('@src/modules\utils');
require('@src/modules\utils\indexedDB');

class LocalModelService {
  constructor() {
    this.modelsDirectory = path.join(process.cwd(), 'data', 'models');
    this.availableModels = {
      intent: [
        { id: 'intent-small', name: 'Intent Classification (Small)', size: 5, language: 'en' },
        { id: 'intent-medium', name: 'Intent Classification (Medium)', size: 25, language: 'en' },
        { id: 'intent-multilingual', name: 'Intent Classification (Multilingual)', size: 45, languages: ['en', 'es', 'fr', 'de', 'it'] }
      ],
      entity: [
        { id: 'entity-small', name: 'Entity Recognition (Small)', size: 8, language: 'en' },
        { id: 'entity-medium', name: 'Entity Recognition (Medium)', size: 35, language: 'en' },
        { id: 'entity-multilingual', name: 'Entity Recognition (Multilingual)', size: 60, languages: ['en', 'es', 'fr', 'de', 'it'] }
      ],
      sentiment: [
        { id: 'sentiment-small', name: 'Sentiment Analysis (Small)', size: 3, language: 'en' },
        { id: 'sentiment-multilingual', name: 'Sentiment Analysis (Multilingual)', size: 15, languages: ['en', 'es', 'fr', 'de', 'it'] }
      ],
      embedding: [
        { id: 'embedding-small', name: 'Text Embedding (Small)', size: 25, language: 'en' },
        { id: 'embedding-multilingual', name: 'Text Embedding (Multilingual)', size: 80, languages: ['en', 'es', 'fr', 'de', 'it'] }
      ],
      tokenizer: [
        { id: 'tokenizer-small', name: 'Tokenizer (Small)', size: 1, language: 'en' },
        { id: 'tokenizer-multilingual', name: 'Tokenizer (Multilingual)', size: 5, languages: ['en', 'es', 'fr', 'de', 'it', 'ar', 'zh', 'ja', 'ko', 'ru'] }
      ]
    };
    
    this.loadedModels = {};
    this.proxyConfig = null;
  }

  /**
   * Set proxy configuration for network requests
   * 
   * @param {Object|null} proxyConfig - Proxy configuration or null to disable
   * @returns {void}
   */
  setProxyConfig(proxyConfig) {
    this.proxyConfig = proxyConfig;
    logger.debug('Proxy configuration updated', { enabled: !!proxyConfig });
  }

  /**
   * Initialize the service
   * 
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    try {
      // Create models directory if it doesn't exist
      await fs.mkdir(this.modelsDirectory, { recursive: true });
      
      // Check for existing downloaded models
      await this.scanLocalModels();
      
      logger.info('Local model service initialized');
      return true;
    } catch (error) {
      logger.error('Error initializing local model service:', error);
      return false;
    }
  }

  /**
   * Scan for locally downloaded models
   * 
   * @returns {Promise<Object>} Scan results
   */
  async scanLocalModels() {
    try {
      const modelTypes = Object.keys(this.availableModels);
      const results = {};
      
      for (const type of modelTypes) {
        const typeDir = path.join(this.modelsDirectory, type);
        
        try {
          await fs.mkdir(typeDir, { recursive: true });
          
          const files = await fs.readdir(typeDir);
          const models = [];
          
          for (const file of files) {
            if (file.endsWith('.bin') || file.endsWith('.onnx')) {
              const modelId = file.replace(/\.(bin|onnx)$/, '');
              const modelInfo = this.availableModels[type].find(m => m.id === modelId);
              
              if (modelInfo) {
                const stats = await fs.stat(path.join(typeDir, file));
                
                models.push({
                  id: modelId,
                  name: modelInfo.name,
                  size: stats.size,
                  type,
                  language: modelInfo.language || 'en',
                  languages: modelInfo.languages,
                  path: path.join(typeDir, file),
                  lastModified: stats.mtime
                });
              }
            }
          }
          
          results[type] = models;
        } catch (error) {
          logger.error(`Error scanning ${type} models:`, error);
          results[type] = [];
        }
      }
      
      logger.info('Local model scan completed');
      return results;
    } catch (error) {
      logger.error('Error scanning local models:', error);
      return {};
    }
  }

  /**
   * Get available models
   * 
   * @param {string} type - Model type (optional)
   * @returns {Array} Available models
   */
  getAvailableModels(type = null) {
    if (type) {
      return this.availableModels[type] || [];
    }
    
    // Return all models if no type specified
    const allModels = [];
    for (const [type, models] of Object.entries(this.availableModels)) {
      models.forEach(model => {
        allModels.push({
          ...model,
          type
        });
      });
    }
    
    return allModels;
  }

  /**
   * Get downloaded models
   * 
   * @param {string} type - Model type (optional)
   * @returns {Promise<Array>} Downloaded models
   */
  async getDownloadedModels(type = null) {
    try {
      if (type) {
        return await getModelsByType(type);
      }
      
      // Get all model types if no type specified
      const allModels = [];
      for (const type of Object.keys(this.availableModels)) {
        const models = await getModelsByType(type);
        allModels.push(...models);
      }
      
      return allModels;
    } catch (error) {
      logger.error('Error getting downloaded models:', error);
      return [];
    }
  }

  /**
   * Download a model
   * 
   * @param {string} modelId - Model ID
   * @param {Function} progressCallback - Progress callback function
   * @returns {Promise<Object>} Downloaded model info
   */
  async downloadModel(modelId, progressCallback = null) {
    try {
      // Find model in available models
      let modelInfo = null;
      let modelType = null;
      
      for (const [type, models] of Object.entries(this.availableModels)) {
        const model = models.find(m => m.id === modelId);
        if (model) {
          modelInfo = model;
          modelType = type;
          break;
        }
      }
      
      if (!modelInfo) {
        throw new Error(`Model ${modelId} not found`);
      }
      
      // Check if model is already downloaded
      const existingModel = await getModel(modelId);
      if (existingModel) {
        logger.info(`Model ${modelId} is already downloaded`);
        return existingModel;
      }
      
      // In a real implementation, this would download the model from a server
      // For this example, we'll simulate the download
      
      // Create a placeholder for the model file
      const modelDir = path.join(this.modelsDirectory, modelType);
      await fs.mkdir(modelDir, { recursive: true });
      
      const modelPath = path.join(modelDir, `${modelId}.bin`);
      
      // Simulate download progress
      if (progressCallback) {
        for (let progress = 0; progress <= 100; progress += 10) {
          progressCallback({
            modelId,
            progress,
            total: modelInfo.size * 1024 * 1024, // Convert MB to bytes
            downloaded: (progress / 100) * modelInfo.size * 1024 * 1024
          });
          
          // Simulate download time
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      // Create an empty file to simulate the downloaded model
      await fs.writeFile(modelPath, Buffer.alloc(1024)); // Just a small placeholder
      
      // Store model info in IndexedDB
      const modelData = {
        id: modelId,
        name: modelInfo.name,
        type: modelType,
        size: modelInfo.size,
        language: modelInfo.language || 'en',
        languages: modelInfo.languages,
        path: modelPath,
        downloaded: new Date().toISOString()
      };
      
      await storeModel(modelData);
      
      logger.info(`Model ${modelId} downloaded successfully`);
      return modelData;
    } catch (error) {
      logger.error(`Error downloading model ${modelId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a downloaded model
   * 
   * @param {string} modelId - Model ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteModel(modelId) {
    try {
      // Get model info
      const model = await getModel(modelId);
      
      if (!model) {
        logger.warn(`Model ${modelId} not found`);
        return false;
      }
      
      // Delete model file
      if (model.path) {
        try {
          await fs.unlink(model.path);
        } catch (fileError) {
          logger.warn(`Error deleting model file ${model.path}:`, fileError);
          // Continue even if file deletion fails
        }
      }
      
      // Delete from IndexedDB
      await deleteModel(modelId);
      
      // Remove from loaded models if loaded
      if (this.loadedModels[modelId]) {
        delete this.loadedModels[modelId];
      }
      
      logger.info(`Model ${modelId} deleted successfully`);
      return true;
    } catch (error) {
      logger.error(`Error deleting model ${modelId}:`, error);
      return false;
    }
  }

  /**
   * Load a model into memory
   * 
   * @param {string} modelId - Model ID
   * @returns {Promise<Object>} Loaded model
   */
  async loadModel(modelId) {
    try {
      // Check if model is already loaded
      if (this.loadedModels[modelId]) {
        return this.loadedModels[modelId];
      }
      
      // Get model info
      const model = await getModel(modelId);
      
      if (!model) {
        throw new Error(`Model ${modelId} not found. Please download it first.`);
      }
      
      // In a real implementation, this would load the model into memory
      // For this example, we'll create a placeholder
      
      // Create a model object based on the type
      let modelObject;
      
      switch (model.type) {
        case 'intent':
          modelObject = this.createIntentModel(model);
          break;
        case 'entity':
          modelObject = this.createEntityModel(model);
          break;
        case 'sentiment':
          modelObject = this.createSentimentModel(model);
          break;
        case 'embedding':
          modelObject = this.createEmbeddingModel(model);
          break;
        case 'tokenizer':
          modelObject = this.createTokenizerModel(model);
          break;
        default:
          throw new Error(`Unknown model type: ${model.type}`);
      }
      
      // Store in loaded models
      this.loadedModels[modelId] = modelObject;
      
      logger.info(`Model ${modelId} loaded successfully`);
      return modelObject;
    } catch (error) {
      logger.error(`Error loading model ${modelId}:`, error);
      throw error;
    }
  }

  /**
   * Unload a model from memory
   * 
   * @param {string} modelId - Model ID
   * @returns {boolean} Success status
   */
  unloadModel(modelId) {
    if (this.loadedModels[modelId]) {
      delete this.loadedModels[modelId];
      logger.info(`Model ${modelId} unloaded`);
      return true;
    }
    
    logger.warn(`Model ${modelId} is not loaded`);
    return false;
  }

  /**
   * Create an intent classification model
   * 
   * @param {Object} modelInfo - Model info
   * @returns {Object} Intent model
   */
  createIntentModel(modelInfo) {
    // This is a placeholder for a real model implementation
    return {
      ...modelInfo,
      loaded: true,
      predict: (text) => {
        // Simulate intent classification
        const intents = [
          { intent: 'greeting', confidence: 0.9 },
          { intent: 'farewell', confidence: 0.05 },
          { intent: 'help', confidence: 0.03 },
          { intent: 'booking', confidence: 0.02 }
        ];
        
        return intents;
      }
    };
  }

  /**
   * Create an entity recognition model
   * 
   * @param {Object} modelInfo - Model info
   * @returns {Object} Entity model
   */
  createEntityModel(modelInfo) {
    // This is a placeholder for a real model implementation
    return {
      ...modelInfo,
      loaded: true,
      predict: (text) => {
        // Simulate entity recognition
        const entities = [
          { entity: 'person', value: 'John', start: 0, end: 4, confidence: 0.95 },
          { entity: 'date', value: 'tomorrow', start: 10, end: 18, confidence: 0.87 },
          { entity: 'location', value: 'New York', start: 22, end: 30, confidence: 0.92 }
        ];
        
        return entities;
      }
    };
  }

  /**
   * Create a sentiment analysis model
   * 
   * @param {Object} modelInfo - Model info
   * @returns {Object} Sentiment model
   */
  createSentimentModel(modelInfo) {
    // This is a placeholder for a real model implementation
    return {
      ...modelInfo,
      loaded: true,
      predict: (text) => {
        // Simulate sentiment analysis
        return {
          sentiment: 'positive',
          score: 0.75,
          comparative: 0.15
        };
      }
    };
  }

  /**
   * Create a text embedding model
   * 
   * @param {Object} modelInfo - Model info
   * @returns {Object} Embedding model
   */
  createEmbeddingModel(modelInfo) {
    // This is a placeholder for a real model implementation
    return {
      ...modelInfo,
      loaded: true,
      embed: (text) => {
        // Simulate text embedding (return a small random vector)
        const dimension = 64;
        const embedding = new Array(dimension).fill(0).map(() => Math.random() - 0.5);
        
        return embedding;
      }
    };
  }

  /**
   * Create a tokenizer model
   * 
   * @param {Object} modelInfo - Model info
   * @returns {Object} Tokenizer model
   */
  createTokenizerModel(modelInfo) {
    // This is a placeholder for a real model implementation
    return {
      ...modelInfo,
      loaded: true,
      tokenize: (text) => {
        // Simulate tokenization (simple split by space)
        return text.split(/\s+/);
      },
      detokenize: (tokens) => {
        // Simulate detokenization (join with space)
        return tokens.join(' ');
      }
    };
  }

  /**
   * Get model storage usage
   * 
   * @returns {Promise<Object>} Storage usage
   */
  async getStorageUsage() {
    try {
      const models = await this.getDownloadedModels();
      
      const usage = {
        count: models.length,
        totalSize: 0,
        byType: {}
      };
      
      for (const model of models) {
        usage.totalSize += model.size * 1024 * 1024; // Convert MB to bytes
        
        if (!usage.byType[model.type]) {
          usage.byType[model.type] = {
            count: 0,
            size: 0
          };
        }
        
        usage.byType[model.type].count++;
        usage.byType[model.type].size += model.size * 1024 * 1024;
      }
      
      return usage;
    } catch (error) {
      logger.error('Error getting model storage usage:', error);
      return { count: 0, totalSize: 0, byType: {} };
    }
  }
}

module.exports = new LocalModelService();
