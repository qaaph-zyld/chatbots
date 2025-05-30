/**
 * Chatbots Platform API Client for Node.js
 * 
 * A simple client library for interacting with the Chatbots Platform External REST API
 */

const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');

class ChatbotsClient {
  /**
   * Create a new ChatbotsClient instance
   * @param {Object} options - Client options
   * @param {String} options.apiKey - API key for authentication
   * @param {String} options.baseUrl - Base URL for the API (default: https://api.chatbots-platform.example.com/api/external)
   * @param {String} options.version - API version (default: v1)
   * @param {String} options.proxyUrl - Proxy URL (default: 104.129.196.38:10563)
   * @param {Boolean} options.useProxy - Whether to use the proxy (default: true)
   */
  constructor(options) {
    if (!options.apiKey) {
      throw new Error('API key is required');
    }
    
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl || 'https://api.chatbots-platform.example.com/api/external';
    this.version = options.version || 'v1';
    this.proxyUrl = options.proxyUrl || '104.129.196.38:10563';
    this.useProxy = options.useProxy !== undefined ? options.useProxy : true;
    
    // Create axios instance
    this.client = axios.create({
      baseURL: `${this.baseUrl}/${this.version}`,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Configure proxy if enabled
    if (this.useProxy && this.proxyUrl) {
      this.client.defaults.httpsAgent = new HttpsProxyAgent(`http://${this.proxyUrl}`);
      
      // Set HTTP_PROXY environment variable for Node.js environments
      if (typeof process !== 'undefined' && process.env) {
        process.env.HTTP_PROXY = this.proxyUrl;
      }
    }
    
    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response.data,
      error => {
        const errorResponse = error.response?.data || {
          success: false,
          error: {
            message: error.message,
            code: 'NETWORK_ERROR'
          }
        };
        
        return Promise.reject(errorResponse);
      }
    );
  }
  
  /**
   * Get all accessible chatbots
   * @returns {Promise} Promise resolving to list of chatbots
   */
  async getChatbots() {
    return this.client.get('/chatbots');
  }
  
  /**
   * Get a specific chatbot
   * @param {String} chatbotId - ID of the chatbot
   * @returns {Promise} Promise resolving to chatbot details
   */
  async getChatbot(chatbotId) {
    return this.client.get(`/chatbots/${chatbotId}`);
  }
  
  /**
   * Get all conversations
   * @param {Object} options - Query options
   * @param {String} options.chatbotId - Filter by chatbot ID
   * @param {Number} options.limit - Maximum number of conversations to return
   * @param {Number} options.page - Page number for pagination
   * @returns {Promise} Promise resolving to list of conversations
   */
  async getConversations(options = {}) {
    return this.client.get('/conversations', { params: options });
  }
  
  /**
   * Create a new conversation
   * @param {String} chatbotId - ID of the chatbot
   * @param {Object} metadata - Optional metadata
   * @returns {Promise} Promise resolving to new conversation
   */
  async createConversation(chatbotId, metadata = {}) {
    return this.client.post('/conversations', {
      chatbotId,
      metadata
    });
  }
  
  /**
   * Get a specific conversation
   * @param {String} conversationId - ID of the conversation
   * @returns {Promise} Promise resolving to conversation details
   */
  async getConversation(conversationId) {
    return this.client.get(`/conversations/${conversationId}`);
  }
  
  /**
   * Get messages in a conversation
   * @param {String} conversationId - ID of the conversation
   * @param {Object} options - Query options
   * @param {Number} options.limit - Maximum number of messages to return
   * @param {String} options.before - Get messages before this timestamp
   * @param {String} options.after - Get messages after this timestamp
   * @returns {Promise} Promise resolving to list of messages
   */
  async getMessages(conversationId, options = {}) {
    return this.client.get(`/conversations/${conversationId}/messages`, {
      params: options
    });
  }
  
  /**
   * Send a message in a conversation
   * @param {String} conversationId - ID of the conversation
   * @param {String} content - Message content
   * @param {String} type - Message type (default: text)
   * @param {Object} metadata - Optional metadata
   * @returns {Promise} Promise resolving to user message and bot response
   */
  async sendMessage(conversationId, content, type = 'text', metadata = {}) {
    return this.client.post(`/conversations/${conversationId}/messages`, {
      content,
      type,
      metadata
    });
  }
  
  /**
   * Search the knowledge base
   * @param {String} chatbotId - ID of the chatbot
   * @param {String} query - Search query
   * @returns {Promise} Promise resolving to search results
   */
  async searchKnowledge(chatbotId, query) {
    return this.client.get(`/chatbots/${chatbotId}/knowledge`, {
      params: { query }
    });
  }
  
  /**
   * Convenience method to create a conversation and send a message
   * @param {String} chatbotId - ID of the chatbot
   * @param {String} message - Message to send
   * @param {Object} metadata - Optional metadata
   * @returns {Promise} Promise resolving to user message and bot response
   */
  async chat(chatbotId, message, metadata = {}) {
    // Create a conversation
    const conversationResponse = await this.createConversation(chatbotId, metadata);
    const conversationId = conversationResponse.data.id;
    
    // Send a message
    const messageResponse = await this.sendMessage(conversationId, message);
    
    return {
      conversationId,
      ...messageResponse
    };
  }
}

module.exports = ChatbotsClient;
