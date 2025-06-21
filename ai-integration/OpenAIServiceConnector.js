/**
 * @fileoverview OpenAI Service Connector for test automation framework.
 * 
 * This module provides a connector to OpenAI's API for test failure analysis
 * and fix generation.
 */

const { AIServiceConnector } = require('./AIServiceConnector');

/**
 * OpenAI service connector
 */
class OpenAIServiceConnector extends AIServiceConnector {
  /**
   * Creates a new OpenAIServiceConnector instance
   * 
   * @param {Object} options - Configuration options
   * @param {string} options.apiKey - OpenAI API key
   * @param {string} options.model - OpenAI model to use (default: gpt-4)
   * @param {number} options.maxTokens - Maximum tokens to generate (default: 2048)
   * @param {number} options.temperature - Temperature for generation (default: 0.2)
   */
  constructor(options = {}) {
    super(options);
    
    // Validate required options
    if (!options.apiKey) {
      throw new Error('OpenAI API key is required');
    }
    
    this.apiKey = options.apiKey;
    this.model = options.model || 'gpt-4';
    this.maxTokens = options.maxTokens || 2048;
    this.temperature = options.temperature || 0.2;
    this.baseUrl = options.baseUrl || 'https://api.openai.com/v1';
    
    // Load OpenAI SDK if available
    try {
      // Note: In a real implementation, you would use the OpenAI SDK
      // This is a placeholder to avoid external dependencies
      this.openai = null;
    } catch (error) {
      console.warn('OpenAI SDK not available, using fetch API instead');
      this.openai = null;
    }
  }
  
  /**
   * Sends a request to OpenAI
   * 
   * @param {Object} requestData - Data to send to OpenAI
   * @param {Array<Object>} requestData.messages - Messages for chat completion
   * @param {Object} requestData.options - Additional options for the request
   * @returns {Promise<Object>} - Promise resolving to the OpenAI response
   */
  async sendRequest(requestData) {
    const { messages, options = {} } = requestData;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error('Messages array is required and must not be empty');
    }
    
    return this._withRetry(async () => {
      // If OpenAI SDK is available, use it
      if (this.openai) {
        return await this._sendRequestWithSDK(messages, options);
      }
      
      // Otherwise use fetch API
      return await this._sendRequestWithFetch(messages, options);
    });
  }
  
  /**
   * Validates OpenAI API credentials
   * 
   * @returns {Promise<boolean>} - Promise resolving to true if credentials are valid
   */
  async validateCredentials() {
    try {
      // Send a minimal request to check if the API key is valid
      const response = await this.sendRequest({
        messages: [
          { role: 'system', content: 'You are a test assistant.' },
          { role: 'user', content: 'Hello' }
        ],
        options: {
          max_tokens: 5
        }
      });
      
      return !!response;
    } catch (error) {
      console.error('Failed to validate OpenAI credentials:', error.message);
      return false;
    }
  }
  
  /**
   * Gets the name of the AI service
   * 
   * @returns {string} - Name of the AI service
   */
  getServiceName() {
    return `OpenAI (${this.model})`;
  }
  
  /**
   * Sends a request to OpenAI using the SDK
   * 
   * @param {Array<Object>} messages - Messages for chat completion
   * @param {Object} options - Additional options for the request
   * @returns {Promise<Object>} - Promise resolving to the OpenAI response
   * @private
   */
  async _sendRequestWithSDK(messages, options) {
    // This is a placeholder for using the OpenAI SDK
    // In a real implementation, you would use the SDK directly
    throw new Error('OpenAI SDK implementation not available');
  }
  
  /**
   * Sends a request to OpenAI using the fetch API
   * 
   * @param {Array<Object>} messages - Messages for chat completion
   * @param {Object} options - Additional options for the request
   * @returns {Promise<Object>} - Promise resolving to the OpenAI response
   * @private
   */
  async _sendRequestWithFetch(messages, options) {
    const url = `${this.baseUrl}/chat/completions`;
    
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: options.model || this.model,
        messages,
        max_tokens: options.max_tokens || this.maxTokens,
        temperature: options.temperature || this.temperature,
        ...options
      })
    };
    
    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);
    requestOptions.signal = controller.signal;
    
    try {
      const response = await fetch(url, requestOptions);
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error (${response.status}): ${errorData.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      return {
        text: data.choices[0]?.message?.content || '',
        usage: data.usage,
        model: data.model,
        raw: data
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error(`OpenAI API request timed out after ${this.options.timeout}ms`);
      }
      
      throw error;
    }
  }
  
  /**
   * Checks if an error is non-retryable
   * 
   * @param {Error} error - Error to check
   * @returns {boolean} - True if the error is non-retryable
   * @protected
   */
  _isNonRetryableError(error) {
    // In addition to parent class checks, also check for OpenAI-specific errors
    if (super._isNonRetryableError(error)) {
      return true;
    }
    
    const message = error.message.toLowerCase();
    
    // Don't retry for invalid requests or rate limits
    return message.includes('invalid request') ||
           message.includes('rate limit') ||
           message.includes('maximum context length');
  }
}

module.exports = { OpenAIServiceConnector };
