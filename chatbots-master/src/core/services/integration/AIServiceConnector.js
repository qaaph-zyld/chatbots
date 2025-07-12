/**
 * @fileoverview AI Service Connector for test automation framework.
 * 
 * This module provides a flexible interface for connecting to different AI services
 * while keeping API keys and configuration secure.
 */

/**
 * Base class for AI service connectors
 */
class AIServiceConnector {
  /**
   * Creates a new AIServiceConnector instance
   * 
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      timeout: options.timeout || 30000,
      retryCount: options.retryCount || 3,
      retryDelay: options.retryDelay || 1000,
      ...options
    };
    
    this.lastResponse = null;
    this.lastError = null;
    this.requestCount = 0;
  }
  
  /**
   * Sends a request to the AI service
   * 
   * @param {Object} requestData - Data to send to the AI service
   * @returns {Promise<Object>} - Promise resolving to the AI service response
   */
  async sendRequest(requestData) {
    throw new Error('Method sendRequest() must be implemented by subclass');
  }
  
  /**
   * Validates API credentials
   * 
   * @returns {Promise<boolean>} - Promise resolving to true if credentials are valid
   */
  async validateCredentials() {
    throw new Error('Method validateCredentials() must be implemented by subclass');
  }
  
  /**
   * Gets the name of the AI service
   * 
   * @returns {string} - Name of the AI service
   */
  getServiceName() {
    throw new Error('Method getServiceName() must be implemented by subclass');
  }
  
  /**
   * Gets the current usage statistics
   * 
   * @returns {Object} - Usage statistics
   */
  getUsageStats() {
    return {
      requestCount: this.requestCount,
      lastResponseTime: this.lastResponse ? this.lastResponse.responseTime : null,
      lastErrorTime: this.lastError ? this.lastError.timestamp : null,
      serviceName: this.getServiceName()
    };
  }
  
  /**
   * Handles retry logic for failed requests
   * 
   * @param {Function} requestFn - Function that makes the request
   * @returns {Promise<Object>} - Promise resolving to the AI service response
   * @protected
   */
  async _withRetry(requestFn) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= this.options.retryCount + 1; attempt++) {
      try {
        const startTime = Date.now();
        const response = await requestFn();
        const endTime = Date.now();
        
        this.requestCount++;
        this.lastResponse = {
          timestamp: new Date().toISOString(),
          responseTime: endTime - startTime,
          attempt
        };
        
        return response;
      } catch (error) {
        lastError = error;
        this.lastError = {
          timestamp: new Date().toISOString(),
          message: error.message,
          attempt
        };
        
        // Don't retry if we've reached the maximum number of attempts
        if (attempt > this.options.retryCount) {
          break;
        }
        
        // Don't retry for certain types of errors
        if (this._isNonRetryableError(error)) {
          break;
        }
        
        // Wait before retrying
        const delay = this._calculateRetryDelay(attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError || new Error('Request failed after retries');
  }
  
  /**
   * Checks if an error is non-retryable
   * 
   * @param {Error} error - Error to check
   * @returns {boolean} - True if the error is non-retryable
   * @protected
   */
  _isNonRetryableError(error) {
    // By default, consider authentication errors as non-retryable
    return error.message.includes('authentication') || 
           error.message.includes('unauthorized') ||
           error.message.includes('forbidden') ||
           error.message.includes('api key');
  }
  
  /**
   * Calculates the delay before retrying
   * 
   * @param {number} attempt - Current attempt number (1-based)
   * @returns {number} - Delay in milliseconds
   * @protected
   */
  _calculateRetryDelay(attempt) {
    // Exponential backoff with jitter
    const baseDelay = this.options.retryDelay;
    const maxDelay = baseDelay * 10;
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const delay = Math.min(exponentialDelay, maxDelay);
    
    // Add jitter (±20%)
    const jitter = delay * 0.2;
    return delay + (Math.random() * jitter * 2 - jitter);
  }
}

module.exports = { AIServiceConnector };
