/**
 * API Client for the Chatbots Platform
 * Handles communication with the backend API
 */
import axios from 'axios';

class ApiClient {
  /**
   * Create a new API client
   * @param {Object} config - Configuration options
   * @param {String} config.apiKey - API key for authentication
   * @param {String} config.baseUrl - Base URL for API requests
   * @param {String} config.proxyUrl - Optional proxy URL for API requests
   * @param {Boolean} config.debug - Enable debug logging
   */
  constructor(config) {
    this.config = config;
    
    // Create axios instance with default configuration
    this.client = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': config.apiKey
      },
      // Configure proxy if provided
      ...(config.proxyUrl ? {
        proxy: {
          host: config.proxyUrl.split(':')[0],
          port: parseInt(config.proxyUrl.split(':')[1])
        }
      } : {})
    });
    
    // Default to the configured proxy if available
    if (process.env.HTTP_PROXY && !config.proxyUrl) {
      this.client.defaults.proxy = {
        host: process.env.HTTP_PROXY.split(':')[0],
        port: parseInt(process.env.HTTP_PROXY.split(':')[1])
      };
    }
    
    // Add request interceptor for logging
    if (config.debug) {
      this.client.interceptors.request.use(request => {
        console.log('API Request:', request);
        return request;
      });
      
      this.client.interceptors.response.use(
        response => {
          console.log('API Response:', response);
          return response;
        },
        error => {
          console.error('API Error:', error);
          return Promise.reject(error);
        }
      );
    }
  }
  
  /**
   * Get information about a chatbot
   * @param {String} chatbotId - ID of the chatbot
   * @returns {Promise<Object>} Chatbot information
   */
  async getChatbotInfo(chatbotId) {
    try {
      const response = await this.client.get(`/api/chatbots/${chatbotId}`);
      return response.data.data;
    } catch (error) {
      console.error('Failed to get chatbot info:', error);
      throw error;
    }
  }
  
  /**
   * Create a new conversation
   * @param {String} chatbotId - ID of the chatbot
   * @param {Object} metadata - Additional metadata for the conversation
   * @returns {Promise<Object>} Created conversation
   */
  async createConversation(chatbotId, metadata = {}) {
    try {
      const response = await this.client.post('/api/conversations', {
        chatbotId,
        metadata
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      throw error;
    }
  }
  
  /**
   * Get a conversation by ID
   * @param {String} conversationId - ID of the conversation
   * @returns {Promise<Object>} Conversation data
   */
  async getConversation(conversationId) {
    try {
      const response = await this.client.get(`/api/conversations/${conversationId}`);
      return response.data.data;
    } catch (error) {
      console.error('Failed to get conversation:', error);
      throw error;
    }
  }
  
  /**
   * Get messages for a conversation
   * @param {String} conversationId - ID of the conversation
   * @param {Object} options - Query options
   * @returns {Promise<Array>} List of messages
   */
  async getMessages(conversationId, options = {}) {
    try {
      const response = await this.client.get(`/api/conversations/${conversationId}/messages`, {
        params: options
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to get messages:', error);
      throw error;
    }
  }
  
  /**
   * Send a message in a conversation
   * @param {String} conversationId - ID of the conversation
   * @param {Object} message - Message to send
   * @returns {Promise<Object>} Response with bot messages
   */
  async sendMessage(conversationId, message) {
    try {
      const payload = {
        type: message.type || 'text',
        content: message.content
      };
      
      // Add additional fields if present
      if (message.attachments) {
        payload.attachments = message.attachments;
      }
      
      if (message.metadata) {
        payload.metadata = message.metadata;
      }
      
      const response = await this.client.post(
        `/api/conversations/${conversationId}/messages`,
        payload
      );
      
      return response.data.data;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }
  
  /**
   * Upload a file attachment
   * @param {File} file - File to upload
   * @returns {Promise<Object>} Uploaded file information
   */
  async uploadAttachment(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await this.client.post('/api/attachments', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data.data;
    } catch (error) {
      console.error('Failed to upload attachment:', error);
      throw error;
    }
  }
  
  /**
   * Submit user feedback for a conversation
   * @param {String} conversationId - ID of the conversation
   * @param {Object} feedback - Feedback data
   * @returns {Promise<Object>} Feedback submission result
   */
  async submitFeedback(conversationId, feedback) {
    try {
      const response = await this.client.post(
        `/api/conversations/${conversationId}/feedback`,
        feedback
      );
      
      return response.data.data;
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      throw error;
    }
  }
  
  /**
   * Get speech-to-text transcription
   * @param {Blob} audioBlob - Audio blob to transcribe
   * @returns {Promise<Object>} Transcription result
   */
  async transcribeAudio(audioBlob) {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      
      const response = await this.client.post('/api/voice/stt', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data.data;
    } catch (error) {
      console.error('Failed to transcribe audio:', error);
      throw error;
    }
  }
  
  /**
   * Get text-to-speech audio
   * @param {String} text - Text to convert to speech
   * @param {Object} options - TTS options
   * @returns {Promise<Blob>} Audio blob
   */
  async synthesizeSpeech(text, options = {}) {
    try {
      const response = await this.client.post('/api/voice/tts', {
        text,
        ...options
      }, {
        responseType: 'blob'
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to synthesize speech:', error);
      throw error;
    }
  }
}

export default ApiClient;
