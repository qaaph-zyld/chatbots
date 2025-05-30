/**
 * API Client for the Chatbots Platform
 * Handles communication with the Chatbots Platform API
 */

import axios from 'axios';

class ApiClient {
  /**
   * Create a new ApiClient instance
   * @param {Object} config - Configuration options
   */
  constructor(config) {
    this.config = config;
    this.baseUrl = config.apiUrl || 'https://api.chatbots-platform.example.com';
    this.apiKey = config.apiKey;
    this.chatbotId = config.chatbotId;
    
    // Initialize axios instance
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'X-Chatbot-ID': this.chatbotId
      },
      timeout: 30000 // 30 seconds
    });
    
    // Configure proxy if provided
    if (config.proxyUrl) {
      // Set HTTP_PROXY environment variable for Node.js environments
      if (typeof process !== 'undefined' && process.env) {
        process.env.HTTP_PROXY = config.proxyUrl;
      }
      
      // For browser environments, configure axios to use proxy
      this.client.defaults.proxy = {
        host: config.proxyUrl.split(':')[0],
        port: parseInt(config.proxyUrl.split(':')[1], 10)
      };
    }
    
    // Add request interceptor for additional headers
    this.client.interceptors.request.use((config) => {
      // Add user info if available
      if (this.config.userId) {
        config.headers['X-User-ID'] = this.config.userId;
      }
      
      if (this.config.userEmail) {
        config.headers['X-User-Email'] = this.config.userEmail;
      }
      
      if (this.config.userName) {
        config.headers['X-User-Name'] = this.config.userName;
      }
      
      // Add session ID if available
      if (this.sessionId) {
        config.headers['X-Session-ID'] = this.sessionId;
      }
      
      return config;
    });
    
    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        // Log error in debug mode
        if (this.config.debug) {
          console.error('API Error:', error);
        }
        
        // Handle session expiration
        if (error.response && error.response.status === 401) {
          this.sessionId = null;
          // Attempt to refresh session
          return this.createSession().then(() => {
            // Retry the original request
            const originalRequest = error.config;
            originalRequest.headers['X-Session-ID'] = this.sessionId;
            return this.client(originalRequest);
          });
        }
        
        return Promise.reject(error);
      }
    );
    
    // Bind methods
    this.createSession = this.createSession.bind(this);
    this.endSession = this.endSession.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.getConversationHistory = this.getConversationHistory.bind(this);
    this.clearConversation = this.clearConversation.bind(this);
    this.getChatbotInfo = this.getChatbotInfo.bind(this);
    this.uploadAttachment = this.uploadAttachment.bind(this);
    this.getHealthStatus = this.getHealthStatus.bind(this);
  }
  
  /**
   * Create a new session
   * @returns {Promise} Promise resolving to session data
   */
  async createSession() {
    try {
      const response = await this.client.post('/v1/sessions', {
        chatbotId: this.chatbotId,
        userId: this.config.userId,
        userEmail: this.config.userEmail,
        userName: this.config.userName,
        metadata: {
          userAgent: navigator.userAgent,
          referrer: document.referrer,
          url: window.location.href
        }
      });
      
      this.sessionId = response.data.sessionId;
      return response.data;
    } catch (error) {
      if (this.config.debug) {
        console.error('Failed to create session:', error);
      }
      throw error;
    }
  }
  
  /**
   * End the current session
   * @returns {Promise} Promise resolving to success status
   */
  async endSession() {
    if (!this.sessionId) {
      return Promise.resolve({ success: true });
    }
    
    try {
      const response = await this.client.delete(`/v1/sessions/${this.sessionId}`);
      this.sessionId = null;
      return response.data;
    } catch (error) {
      if (this.config.debug) {
        console.error('Failed to end session:', error);
      }
      throw error;
    }
  }
  
  /**
   * Send a message to the chatbot
   * @param {String|Object} message - Message to send
   * @returns {Promise} Promise resolving to response data
   */
  async sendMessage(message) {
    // Ensure we have a session
    if (!this.sessionId) {
      await this.createSession();
    }
    
    // Format message
    const messageData = typeof message === 'string'
      ? { content: message, type: 'text' }
      : message;
    
    try {
      const response = await this.client.post(`/v1/sessions/${this.sessionId}/messages`, {
        message: messageData,
        timestamp: new Date().toISOString()
      });
      
      return response.data;
    } catch (error) {
      if (this.config.debug) {
        console.error('Failed to send message:', error);
      }
      throw error;
    }
  }
  
  /**
   * Get conversation history
   * @param {Object} options - Options for fetching history
   * @param {Number} options.limit - Maximum number of messages to retrieve
   * @param {String} options.before - Get messages before this timestamp
   * @param {String} options.after - Get messages after this timestamp
   * @returns {Promise} Promise resolving to conversation history
   */
  async getConversationHistory(options = {}) {
    // Ensure we have a session
    if (!this.sessionId) {
      await this.createSession();
    }
    
    try {
      const response = await this.client.get(`/v1/sessions/${this.sessionId}/messages`, {
        params: {
          limit: options.limit || 50,
          before: options.before,
          after: options.after
        }
      });
      
      return response.data;
    } catch (error) {
      if (this.config.debug) {
        console.error('Failed to get conversation history:', error);
      }
      throw error;
    }
  }
  
  /**
   * Clear the conversation history
   * @returns {Promise} Promise resolving to success status
   */
  async clearConversation() {
    // Ensure we have a session
    if (!this.sessionId) {
      await this.createSession();
    }
    
    try {
      const response = await this.client.delete(`/v1/sessions/${this.sessionId}/messages`);
      return response.data;
    } catch (error) {
      if (this.config.debug) {
        console.error('Failed to clear conversation:', error);
      }
      throw error;
    }
  }
  
  /**
   * Get chatbot information
   * @returns {Promise} Promise resolving to chatbot info
   */
  async getChatbotInfo() {
    try {
      const response = await this.client.get(`/v1/chatbots/${this.chatbotId}`);
      return response.data;
    } catch (error) {
      if (this.config.debug) {
        console.error('Failed to get chatbot info:', error);
      }
      throw error;
    }
  }
  
  /**
   * Upload an attachment
   * @param {File} file - File to upload
   * @returns {Promise} Promise resolving to attachment data
   */
  async uploadAttachment(file) {
    // Ensure we have a session
    if (!this.sessionId) {
      await this.createSession();
    }
    
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await this.client.post(
        `/v1/sessions/${this.sessionId}/attachments`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      if (this.config.debug) {
        console.error('Failed to upload attachment:', error);
      }
      throw error;
    }
  }
  
  /**
   * Get API health status
   * @returns {Promise} Promise resolving to health status
   */
  async getHealthStatus() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      if (this.config.debug) {
        console.error('Failed to get health status:', error);
      }
      throw error;
    }
  }
}

export default ApiClient;
