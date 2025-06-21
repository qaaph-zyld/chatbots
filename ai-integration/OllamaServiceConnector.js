/**
 * @fileoverview Ollama Service Connector for test automation framework.
 * 
 * This module provides a connector to Ollama's API for test failure analysis
 * and fix generation using open-source LLMs like CodeLlama.
 */

const { AIServiceConnector } = require('./AIServiceConnector');
const http = require('http');
const https = require('https');

/**
 * Ollama service connector for open-source LLM integration
 */
class OllamaServiceConnector extends AIServiceConnector {
  /**
   * Creates a new OllamaServiceConnector instance
   * 
   * @param {Object} options - Configuration options
   * @param {string} options.baseUrl - Ollama API base URL (default: http://localhost:11434)
   * @param {string} options.model - Ollama model to use (default: codellama:7b-instruct)
   * @param {number} options.maxTokens - Maximum tokens to generate (default: 2048)
   * @param {number} options.temperature - Temperature for generation (default: 0.2)
   * @param {number} options.topP - Top-p sampling (default: 0.95)
   * @param {number} options.topK - Top-k sampling (default: 40)
   */
  constructor(options = {}) {
    super(options);
    
    this.baseUrl = options.baseUrl || 'http://localhost:11434';
    this.model = options.model || 'codellama:7b-instruct';
    this.maxTokens = options.maxTokens || 2048;
    this.temperature = options.temperature || 0.2;
    this.topP = options.topP || 0.95;
    this.topK = options.topK || 40;
    
    // Remove trailing slash from baseUrl if present
    if (this.baseUrl.endsWith('/')) {
      this.baseUrl = this.baseUrl.slice(0, -1);
    }
  }
  
  /**
   * Sends a request to Ollama
   * 
   * @param {Object} requestData - Data to send to Ollama
   * @param {string} requestData.prompt - The prompt to send to the model
   * @param {Object} requestData.options - Additional options for the request
   * @returns {Promise<Object>} - Promise resolving to the Ollama response
   */
  async sendRequest(requestData) {
    const { prompt, options = {} } = requestData;
    
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      throw new Error('Prompt is required and must be a non-empty string');
    }
    
    return this._withRetry(async () => {
      return await this._sendRequestToOllama(prompt, options);
    });
  }
  
  /**
   * Validates Ollama API availability
   * 
   * @returns {Promise<boolean>} - Promise resolving to true if the API is available
   */
  async validateCredentials() {
    try {
      // Send a minimal request to check if Ollama is available
      const response = await this._makeRequest(`${this.baseUrl}/api/tags`, 'GET');
      
      // Check if the model we want to use is available
      const models = response.models || [];
      const modelExists = models.some(model => model.name === this.model);
      
      if (!modelExists) {
        console.warn(`Model ${this.model} not found in Ollama. Available models: ${models.map(m => m.name).join(', ')}`);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to validate Ollama API:', error.message);
      return false;
    }
  }
  
  /**
   * Gets the name of the AI service
   * 
   * @returns {string} - Name of the AI service
   */
  getServiceName() {
    return `Ollama (${this.model})`;
  }
  
  /**
   * Sends a request to Ollama
   * 
   * @param {string} prompt - The prompt to send to the model
   * @param {Object} options - Additional options for the request
   * @returns {Promise<Object>} - Promise resolving to the Ollama response
   * @private
   */
  async _sendRequestToOllama(prompt, options) {
    const url = `${this.baseUrl}/api/generate`;
    
    const requestBody = {
      model: options.model || this.model,
      prompt,
      stream: false,
      options: {
        num_predict: options.max_tokens || this.maxTokens,
        temperature: options.temperature || this.temperature,
        top_p: options.top_p || this.topP,
        top_k: options.top_k || this.topK,
        ...options.model_options
      },
      system: options.system || "You are a helpful AI assistant specialized in analyzing and fixing software test failures."
    };
    
    try {
      const response = await this._makeRequest(url, 'POST', requestBody);
      
      return {
        text: response.response || '',
        model: response.model,
        usage: {
          prompt_tokens: response.prompt_eval_count || 0,
          completion_tokens: response.eval_count || 0,
          total_tokens: (response.prompt_eval_count || 0) + (response.eval_count || 0)
        },
        raw: response
      };
    } catch (error) {
      throw new Error(`Ollama API error: ${error.message}`);
    }
  }
  
  /**
   * Makes an HTTP request to the Ollama API
   * 
   * @param {string} url - The URL to request
   * @param {string} method - The HTTP method to use
   * @param {Object} body - The request body (for POST requests)
   * @returns {Promise<Object>} - Promise resolving to the response body
   * @private
   */
  async _makeRequest(url, method, body = null) {
    return new Promise((resolve, reject) => {
      const isHttps = url.startsWith('https:');
      const httpModule = isHttps ? https : http;
      
      const urlObj = new URL(url);
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: `${urlObj.pathname}${urlObj.search}`,
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };
      
      // Add timeout
      const timeout = this.options.timeout || 30000;
      
      // Create request
      const req = httpModule.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsedData = JSON.parse(data);
              resolve(parsedData);
            } catch (error) {
              reject(new Error(`Failed to parse response: ${error.message}`));
            }
          } else {
            let errorMessage;
            try {
              const errorData = JSON.parse(data);
              errorMessage = errorData.error || `HTTP error ${res.statusCode}`;
            } catch (e) {
              errorMessage = `HTTP error ${res.statusCode}: ${data}`;
            }
            reject(new Error(errorMessage));
          }
        });
      });
      
      // Set timeout
      req.setTimeout(timeout, () => {
        req.destroy();
        reject(new Error(`Request timed out after ${timeout}ms`));
      });
      
      // Handle errors
      req.on('error', (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });
      
      // Send body if provided
      if (body) {
        req.write(JSON.stringify(body));
      }
      
      req.end();
    });
  }
  
  /**
   * Checks if an error is non-retryable
   * 
   * @param {Error} error - Error to check
   * @returns {boolean} - True if the error is non-retryable
   * @protected
   */
  _isNonRetryableError(error) {
    // In addition to parent class checks, also check for Ollama-specific errors
    if (super._isNonRetryableError(error)) {
      return true;
    }
    
    const message = error.message.toLowerCase();
    
    // Don't retry for model not found or invalid request errors
    return message.includes('model not found') ||
           message.includes('invalid request') ||
           message.includes('invalid model');
  }
}

module.exports = { OllamaServiceConnector };
