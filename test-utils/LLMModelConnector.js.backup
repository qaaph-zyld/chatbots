/**
 * LLM Model Connector
 * 
 * Provides integration with various open-source LLM models for test fix generation.
 * Supports local models, Hugging Face Inference API, and custom endpoints.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const util = require('util');

// Convert fs functions to promises
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

/**
 * LLM Model Connector class
 */
class LLMModelConnector {
  /**
   * Constructor for the LLMModelConnector
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      modelType: options.modelType || 'local', // 'local', 'huggingface', or 'custom'
      modelEndpoint: options.modelEndpoint || process.env.AI_MODEL_ENDPOINT || 'http://localhost:8080/generate',
      huggingFaceToken: options.huggingFaceToken || process.env.HUGGINGFACE_TOKEN || '',
      modelName: options.modelName || 'codellama/CodeLlama-7b-Instruct-hf',
      maxTokens: options.maxTokens || 1024,
      temperature: options.temperature || 0.2,
      timeout: options.timeout || 30000, // 30 seconds
      cachePath: options.cachePath || path.join(process.cwd(), 'test-results', 'ai-cache'),
      enableCache: options.enableCache !== false,
      logger: options.logger || console
    };
    
    // Initialize axios instance with default config
    this.client = axios.create({
      timeout: this.options.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Add Hugging Face token if available
    if (this.options.modelType === 'huggingface' && this.options.huggingFaceToken) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${this.options.huggingFaceToken}`;
    }
    
    // Initialize cache
    this.cache = {};
    if (this.options.enableCache) {
      this.initializeCache();
    }
  }
  
  /**
   * Initialize the response cache
   */
  async initializeCache() {
    try {
      // Ensure cache directory exists
      if (!fs.existsSync(this.options.cachePath)) {
        fs.mkdirSync(this.options.cachePath, { recursive: true });
      }
      
      // Load cache from disk if available
      const cachePath = path.join(this.options.cachePath, 'llm-response-cache.json');
      
      if (fs.existsSync(cachePath)) {
        const cacheData = await readFile(cachePath, 'utf8');
        this.cache = JSON.parse(cacheData);
        this.options.logger.info(`Loaded LLM response cache with ${Object.keys(this.cache).length} entries`);
      }
    } catch (error) {
      this.options.logger.error('Error initializing cache:', error);
      // Continue without cache if there's an error
      this.cache = {};
    }
  }
  
  /**
   * Save the cache to disk
   */
  async saveCache() {
    if (!this.options.enableCache) return;
    
    try {
      const cachePath = path.join(this.options.cachePath, 'llm-response-cache.json');
      await writeFile(cachePath, JSON.stringify(this.cache, null, 2));
    } catch (error) {
      this.options.logger.error('Error saving cache:', error);
    }
  }
  
  /**
   * Generate a cache key for a prompt
   * @param {string} prompt - The prompt to generate a key for
   * @returns {string} - Cache key
   */
  generateCacheKey(prompt) {
    // Simple hash function for strings
    let hash = 0;
    for (let i = 0; i < prompt.length; i++) {
      const char = prompt.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `${this.options.modelName}_${hash}`;
  }
  
  /**
   * Generate a response from the LLM model
   * @param {string} prompt - The prompt to send to the model
   * @param {Object} options - Additional options for the request
   * @returns {Promise<string>} - Generated response
   */
  async generateResponse(prompt, options = {}) {
    const requestOptions = {
      ...this.options,
      ...options
    };
    
    // Check cache first if enabled
    if (this.options.enableCache) {
      const cacheKey = this.generateCacheKey(prompt);
      if (this.cache[cacheKey]) {
        this.options.logger.info('Using cached LLM response');
        return this.cache[cacheKey];
      }
    }
    
    try {
      let response;
      
      switch (this.options.modelType) {
        case 'huggingface':
          response = await this.callHuggingFaceAPI(prompt, requestOptions);
          break;
        case 'local':
          response = await this.callLocalModel(prompt, requestOptions);
          break;
        case 'custom':
          response = await this.callCustomEndpoint(prompt, requestOptions);
          break;
        default:
          throw new Error(`Unsupported model type: ${this.options.modelType}`);
      }
      
      // Cache the response if enabled
      if (this.options.enableCache) {
        const cacheKey = this.generateCacheKey(prompt);
        this.cache[cacheKey] = response;
        await this.saveCache();
      }
      
      return response;
    } catch (error) {
      this.options.logger.error('Error generating LLM response:', error);
      throw error;
    }
  }
  
  /**
   * Call the Hugging Face Inference API
   * @param {string} prompt - The prompt to send to the model
   * @param {Object} options - Additional options for the request
   * @returns {Promise<string>} - Generated response
   */
  async callHuggingFaceAPI(prompt, options) {
    const endpoint = `https://api-inference.huggingface.co/models/${options.modelName}`;
    
    const response = await this.client.post(endpoint, {
      inputs: prompt,
      parameters: {
        max_new_tokens: options.maxTokens,
        temperature: options.temperature,
        return_full_text: false
      }
    });
    
    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      return response.data[0].generated_text;
    }
    
    throw new Error('Invalid response from Hugging Face API');
  }
  
  /**
   * Call a local LLM model
   * @param {string} prompt - The prompt to send to the model
   * @param {Object} options - Additional options for the request
   * @returns {Promise<string>} - Generated response
   */
  async callLocalModel(prompt, options) {
    // Assuming a local server running with a REST API
    const response = await this.client.post(options.modelEndpoint, {
      prompt: prompt,
      max_tokens: options.maxTokens,
      temperature: options.temperature
    });
    
    if (response.data && response.data.text) {
      return response.data.text;
    }
    
    throw new Error('Invalid response from local model');
  }
  
  /**
   * Call a custom LLM endpoint
   * @param {string} prompt - The prompt to send to the model
   * @param {Object} options - Additional options for the request
   * @returns {Promise<string>} - Generated response
   */
  async callCustomEndpoint(prompt, options) {
    // Generic implementation that can be customized
    const response = await this.client.post(options.modelEndpoint, {
      prompt: prompt,
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      // Add any other parameters needed by the custom endpoint
    });
    
    // Assuming the response has a text field, but this can be customized
    if (response.data) {
      return response.data.text || response.data.generated_text || response.data.response || response.data;
    }
    
    throw new Error('Invalid response from custom endpoint');
  }
  
  /**
   * Generate a fix for a test failure
   * @param {Object} failure - Test failure information
   * @returns {Promise<Object>} - Generated fix
   */
  async generateFix(failure) {
    const prompt = this.createFixPrompt(failure);
    
    try {
      const response = await this.generateResponse(prompt);
      return this.parseFixResponse(response);
    } catch (error) {
      this.options.logger.error('Error generating fix:', error);
      return {
        code: `// Failed to generate fix: ${error.message}\n// Please fix manually`,
        confidence: 0.1
      };
    }
  }
  
  /**
   * Create a prompt for generating a test fix
   * @param {Object} failure - Test failure information
   * @returns {string} - Generated prompt
   */
  createFixPrompt(failure) {
    const { testName, errorMessage, stackTrace, testCode, filePath } = failure;
    
    return `You are an expert JavaScript test automation engineer. Fix the following test failure:
    
Test Name: ${testName || 'Unknown'}
File Path: ${filePath || 'Unknown'}
Error Message: ${errorMessage || 'Unknown error'}
${stackTrace ? `Stack Trace:\n${stackTrace}` : ''}

${testCode ? `Test Code:\n${testCode}` : ''}

Please provide ONLY the fixed code without any explanations or markdown formatting. The code should be valid JavaScript that can be directly inserted into the test file.`;
  }
  
  /**
   * Parse the response from the LLM model
   * @param {string} response - Response from the LLM model
   * @returns {Object} - Parsed fix
   */
  parseFixResponse(response) {
    // Extract code from the response
    let code = response;
    
    // Remove any markdown code blocks
    code = code.replace(/```(?:javascript|js)?\n([\s\S]*?)\n```/g, '$1');
    
    // Remove any explanations before or after the code
    code = code.replace(/^[\s\S]*?(?=function|class|const|let|var|import|\/\/|\/\*|module\.exports)/m, '');
    
    return {
      code,
      confidence: 0.8 // Default confidence level
    };
  }
}

module.exports = LLMModelConnector;
