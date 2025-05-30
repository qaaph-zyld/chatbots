/**
 * Entity Recognition Service
 * 
 * Provides advanced entity recognition capabilities using open-source models
 * that can run locally without requiring cloud services.
 */

const path = require('path');
const fs = require('fs').promises;
const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../../utils');
const { localStorageService } = require('../../storage');

class EntityRecognitionService {
  constructor() {
    this.models = {};
    this.modelPath = process.env.MODEL_PATH || path.join(process.cwd(), 'models', 'entity');
    this.pythonPath = process.env.PYTHON_PATH || 'python';
    this.scriptPath = path.join(__dirname, 'python', 'entity_recognition.py');
    this.customEntities = { global: {} };
    this.initialized = false;
    
    // Default configuration
    this.config = {
      defaultModel: 'distilbert-base-cased-ner',
      fallbackToSpacy: true,
      confidenceThreshold: 0.7,
      enabledModels: ['distilbert-base-cased-ner', 'spacy']
    };
  }
  
  /**
   * Initialize the entity recognition service
   * @param {Object} config - Configuration options
   * @returns {Promise<boolean>} - True if initialization was successful
   */
  async initialize(config = {}) {
    try {
      // Merge provided config with defaults
      this.config = { ...this.config, ...config };
      
      logger.info('Initializing entity recognition service');
      
      // Create model directory if it doesn't exist
      await fs.mkdir(this.modelPath, { recursive: true });
      
      // Load custom entities from storage
      await this.loadCustomEntities();
      
      // Check if Python bridge is available
      await this.checkPythonBridge();
      
      // Load enabled models
      for (const modelName of this.config.enabledModels) {
        await this.loadModel(modelName);
      }
      
      this.initialized = true;
      logger.info('Entity recognition service initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize entity recognition service:', error.message);
      return false;
    }
  }
  
  /**
   * Check if Python bridge is available
   * @returns {Promise<boolean>} - True if Python bridge is available
   * @private
   */
  async checkPythonBridge() {
    return new Promise((resolve, reject) => {
      const process = spawn(this.pythonPath, ['-c', 'print("Python bridge check")']);
      
      process.on('close', (code) => {
        if (code === 0) {
          logger.info('Python bridge is available');
          resolve(true);
        } else {
          const error = new Error(`Python bridge check failed with code ${code}`);
          logger.error(error.message);
          reject(error);
        }
      });
      
      process.on('error', (error) => {
        logger.error('Python bridge error:', error.message);
        reject(error);
      });
    });
  }
  
  /**
   * Load a model for entity recognition
   * @param {string} modelName - Name of the model to load
   * @returns {Promise<boolean>} - True if model was loaded successfully
   */
  async loadModel(modelName) {
    try {
      logger.info(`Loading entity recognition model: ${modelName}`);
      
      // For Hugging Face models, we'll use the Python bridge
      if (modelName.includes('bert') || modelName.includes('roberta')) {
        const result = await this.runPythonScript('load_model', { model_name: modelName });
        
        if (result.success) {
          this.models[modelName] = {
            type: 'transformer',
            loaded: true,
            entities: result.supported_entities || []
          };
          logger.info(`Loaded transformer model: ${modelName}`);
        } else {
          throw new Error(`Failed to load model ${modelName}: ${result.error}`);
        }
      } 
      // For spaCy, we'll use the existing spaCy engine
      else if (modelName === 'spacy') {
        // We'll assume spaCy is already loaded via the spaCy engine
        this.models[modelName] = {
          type: 'spacy',
          loaded: true,
          entities: ['PERSON', 'ORG', 'GPE', 'LOC', 'PRODUCT', 'EVENT', 'DATE', 'TIME', 'MONEY', 'PERCENT']
        };
        logger.info('Using spaCy for entity recognition');
      }
      
      return true;
    } catch (error) {
      logger.error(`Failed to load model ${modelName}:`, error.message);
      return false;
    }
  }
  
  /**
   * Run a Python script for entity recognition
   * @param {string} command - Command to run
   * @param {Object} params - Parameters for the command
   * @returns {Promise<Object>} - Result from the Python script
   * @private
   */
  async runPythonScript(command, params = {}) {
    return new Promise((resolve, reject) => {
      const requestId = uuidv4();
      const requestData = JSON.stringify({
        command,
        params,
        request_id: requestId
      });
      
      const pythonProcess = spawn(this.pythonPath, [this.scriptPath], {
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
      });
      
      let result = '';
      let error = '';
      
      pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const parsedResult = JSON.parse(result);
            resolve(parsedResult);
          } catch (e) {
            reject(new Error(`Failed to parse Python result: ${e.message}`));
          }
        } else {
          reject(new Error(`Python process exited with code ${code}: ${error}`));
        }
      });
      
      pythonProcess.stdin.write(requestData);
      pythonProcess.stdin.end();
    });
  }
  
  /**
   * Extract entities from text
   * @param {string} text - Text to extract entities from
   * @param {Object} options - Options for entity extraction
   * @returns {Promise<Array>} - Array of extracted entities
   */
  async extractEntities(text, options = {}) {
    if (!this.initialized) {
      throw new Error('Entity recognition service not initialized');
    }
    
    const opts = {
      modelName: options.modelName || this.config.defaultModel,
      confidenceThreshold: options.confidenceThreshold || this.config.confidenceThreshold,
      includeCustomEntities: options.includeCustomEntities !== false,
      domainId: options.domainId || null
    };
    
    try {
      let entities = [];
      
      // Use transformer model via Python bridge
      if (this.models[opts.modelName]?.type === 'transformer') {
        const result = await this.runPythonScript('extract_entities', {
          text,
          model_name: opts.modelName,
          confidence_threshold: opts.confidenceThreshold
        });
        
        if (result.success) {
          entities = result.entities;
        } else {
          throw new Error(`Entity extraction failed: ${result.error}`);
        }
      }
      // Use spaCy if specified or as fallback
      else if (this.models['spacy']?.loaded && 
               (opts.modelName === 'spacy' || this.config.fallbackToSpacy)) {
        const { spaCyEngine } = require('../engines');
        const spaCyResult = await spaCyEngine.analyze(text, { features: ['entities'] });
        
        if (spaCyResult.success) {
          entities = spaCyResult.entities.map(entity => ({
            text: entity.text,
            type: entity.label,
            start: entity.start,
            end: entity.end,
            confidence: 1.0, // spaCy doesn't provide confidence scores
            source: 'spacy'
          }));
        }
      }
      
      // Add custom entities if enabled
      if (opts.includeCustomEntities) {
        const customEntities = this.extractCustomEntities(text, opts.domainId);
        entities = [...entities, ...customEntities];
      }
      
      // Sort entities by position in text
      entities.sort((a, b) => a.start - b.start);
      
      return entities;
    } catch (error) {
      logger.error('Entity extraction error:', error.message);
      return [];
    }
  }
  
  /**
   * Extract custom entities from text
   * @param {string} text - Text to extract entities from
   * @param {string} domainId - Domain ID for domain-specific entities
   * @returns {Array} - Array of extracted custom entities
   * @private
   */
  extractCustomEntities(text, domainId = null) {
    const entities = [];
    const customEntitySets = [];
    
    // Add global custom entities
    customEntitySets.push(this.customEntities.global || {});
    
    // Add domain-specific entities if domain ID is provided
    if (domainId && this.customEntities[domainId]) {
      customEntitySets.push(this.customEntities[domainId]);
    }
    
    for (const entitySet of customEntitySets) {
      for (const [entityType, patterns] of Object.entries(entitySet)) {
        for (const pattern of patterns) {
          // If pattern is a string, do exact matching
          if (typeof pattern === 'string') {
            let index = 0;
            while ((index = text.indexOf(pattern, index)) !== -1) {
              entities.push({
                text: pattern,
                type: entityType,
                start: index,
                end: index + pattern.length,
                confidence: 1.0,
                source: 'custom'
              });
              index += pattern.length;
            }
          }
          // If pattern is a regex, do regex matching
          else if (pattern instanceof RegExp) {
            const regex = new RegExp(pattern, 'g');
            let match;
            while ((match = regex.exec(text)) !== null) {
              entities.push({
                text: match[0],
                type: entityType,
                start: match.index,
                end: match.index + match[0].length,
                confidence: 1.0,
                source: 'custom'
              });
            }
          }
        }
      }
    }
    
    return entities;
  }
  
  /**
   * Add custom entity patterns
   * @param {string} entityType - Type of entity
   * @param {Array<string|RegExp>} patterns - Patterns to match
   * @param {string} domainId - Domain ID for domain-specific entities
   * @returns {Promise<boolean>} - True if patterns were added successfully
   */
  async addCustomEntityPatterns(entityType, patterns, domainId = 'global') {
    try {
      if (!this.customEntities[domainId]) {
        this.customEntities[domainId] = {};
      }
      
      if (!this.customEntities[domainId][entityType]) {
        this.customEntities[domainId][entityType] = [];
      }
      
      this.customEntities[domainId][entityType] = [
        ...this.customEntities[domainId][entityType],
        ...patterns
      ];
      
      // Save to storage
      await this.saveCustomEntities();
      
      return true;
    } catch (error) {
      logger.error('Failed to add custom entity patterns:', error.message);
      return false;
    }
  }
  
  /**
   * Load custom entities from storage
   * @returns {Promise<boolean>} - True if custom entities were loaded successfully
   * @private
   */
  async loadCustomEntities() {
    try {
      const storage = localStorageService.getCollection('entity_patterns');
      const patterns = await storage.find({});
      
      this.customEntities = { global: {} };
      
      for (const pattern of patterns) {
        const domainId = pattern.domain_id || 'global';
        
        if (!this.customEntities[domainId]) {
          this.customEntities[domainId] = {};
        }
        
        if (!this.customEntities[domainId][pattern.entity_type]) {
          this.customEntities[domainId][pattern.entity_type] = [];
        }
        
        // Convert string regex patterns back to RegExp objects
        let patternValue = pattern.pattern;
        if (pattern.is_regex) {
          try {
            // Extract pattern and flags from string representation
            const regexMatch = /\/(.*)\/([gimuy]*)/.exec(pattern.pattern);
            if (regexMatch) {
              patternValue = new RegExp(regexMatch[1], regexMatch[2]);
            } else {
              patternValue = new RegExp(pattern.pattern);
            }
          } catch (e) {
            logger.warn(`Failed to parse regex pattern: ${pattern.pattern}`);
            patternValue = pattern.pattern;
          }
        }
        
        this.customEntities[domainId][pattern.entity_type].push(patternValue);
      }
      
      logger.info('Custom entity patterns loaded from storage');
      return true;
    } catch (error) {
      logger.error('Failed to load custom entity patterns:', error.message);
      this.customEntities = { global: {} };
      return false;
    }
  }
  
  /**
   * Save custom entities to storage
   * @returns {Promise<boolean>} - True if custom entities were saved successfully
   * @private
   */
  async saveCustomEntities() {
    try {
      const storage = localStorageService.getCollection('entity_patterns');
      
      // Clear existing patterns
      await storage.deleteMany({});
      
      // Convert to storage format
      const patterns = [];
      
      for (const [domainId, entityTypes] of Object.entries(this.customEntities)) {
        for (const [entityType, entityPatterns] of Object.entries(entityTypes)) {
          for (const pattern of entityPatterns) {
            const isRegex = pattern instanceof RegExp;
            
            patterns.push({
              id: uuidv4(),
              domain_id: domainId === 'global' ? null : domainId,
              entity_type: entityType,
              pattern: pattern.toString(),
              is_regex: isRegex,
              created_at: Date.now()
            });
          }
        }
      }
      
      // Save new patterns
      if (patterns.length > 0) {
        await storage.insertMany(patterns);
      }
      
      logger.info('Custom entity patterns saved to storage');
      return true;
    } catch (error) {
      logger.error('Failed to save custom entity patterns:', error.message);
      return false;
    }
  }
  
  /**
   * Get supported entity types
   * @param {string} modelName - Name of the model
   * @returns {Array<string>} - Array of supported entity types
   */
  getSupportedEntityTypes(modelName = null) {
    if (modelName && this.models[modelName]) {
      return this.models[modelName].entities;
    }
    
    // Return all supported entity types from all models
    const entityTypes = new Set();
    
    for (const model of Object.values(this.models)) {
      for (const entity of model.entities) {
        entityTypes.add(entity);
      }
    }
    
    // Add custom entity types
    for (const entitySet of Object.values(this.customEntities)) {
      for (const entityType of Object.keys(entitySet)) {
        entityTypes.add(entityType);
      }
    }
    
    return Array.from(entityTypes);
  }
  
  /**
   * Get available models
   * @returns {Array<Object>} - Array of available models
   */
  getAvailableModels() {
    return Object.entries(this.models).map(([name, model]) => ({
      name,
      type: model.type,
      loaded: model.loaded,
      entities: model.entities
    }));
  }
}

// Create singleton instance
const entityRecognitionService = new EntityRecognitionService();

module.exports = entityRecognitionService;
