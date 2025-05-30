/**
 * ChatbotWidget class
 * Core functionality for the embeddable chatbot widget
 */
import EventEmitter from 'eventemitter3';
import ApiClient from './utils/ApiClient';
import WidgetUI from './ui/WidgetUI';
import { generateUUID, validateConfig, mergeConfig } from './utils/helpers';

// Default configuration
const DEFAULT_CONFIG = {
  position: 'right',
  theme: 'light',
  title: 'Chatbot Assistant',
  subtitle: 'How can I help you today?',
  welcomeMessage: 'Hello! How can I assist you today?',
  primaryColor: '#2563eb',
  secondaryColor: '#f3f4f6',
  textColor: '#111827',
  apiUrl: 'https://api.chatbots-platform.example.com',
  proxyUrl: null,
  userId: null,
  userEmail: null,
  userName: null,
  enableAttachments: true,
  enableVoice: false,
  enableHistory: true,
  enableTypingIndicator: true,
  enableReadReceipts: true,
  enableUserFeedback: true,
  messageDelay: 500,
  autoOpen: false,
  persistSession: true,
  debug: false
};

/**
 * Main ChatbotWidget class
 */
class ChatbotWidget extends EventEmitter {
  /**
   * Create a new ChatbotWidget instance
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    super();
    
    // Validate required configuration
    if (!config.apiKey) {
      throw new Error('API key is required');
    }
    
    if (!config.chatbotId) {
      throw new Error('Chatbot ID is required');
    }
    
    // Merge with default configuration
    this.config = mergeConfig(DEFAULT_CONFIG, config);
    
    // Validate configuration
    validateConfig(this.config);
    
    // Initialize state
    this.state = {
      initialized: false,
      connected: false,
      open: false,
      minimized: false,
      conversationId: null,
      messages: [],
      typing: false,
      error: null,
      sessionId: this.getSessionId()
    };
    
    // Initialize API client
    this.api = new ApiClient({
      apiKey: this.config.apiKey,
      chatbotId: this.config.chatbotId,
      apiUrl: this.config.apiUrl,
      proxyUrl: this.config.proxyUrl,
      userId: this.config.userId,
      userEmail: this.config.userEmail,
      userName: this.config.userName,
      debug: this.config.debug
    });
    
    // Initialize UI (but don't render yet)
    this.ui = new WidgetUI(this.config, this);
    
    // Bind methods
    this.init = this.init.bind(this);
    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
    this.toggle = this.toggle.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.receiveMessage = this.receiveMessage.bind(this);
    this.clearConversation = this.clearConversation.bind(this);
    this.destroy = this.destroy.bind(this);
    
    // Debug logging
    if (this.config.debug) {
      console.log('ChatbotWidget initialized with config:', this.config);
      this.on('*', (event, data) => {
        console.log(`Event: ${event}`, data);
      });
    }
  }
  
  /**
   * Initialize the widget
   * @returns {ChatbotWidget} The widget instance
   */
  init() {
    if (this.state.initialized) {
      console.warn('ChatbotWidget already initialized');
      return this;
    }
    
    try {
      // Render the UI
      this.ui.render();
      
      // Load conversation history if enabled
      if (this.config.enableHistory && this.config.persistSession) {
        this.loadConversationHistory();
      }
      
      // Connect to the API
      this.connectToApi()
        .then(() => {
          this.state.connected = true;
          this.emit('connected');
          
          // Auto open if configured
          if (this.config.autoOpen) {
            this.open();
          }
        })
        .catch(error => {
          console.error('Failed to connect to API:', error);
          this.state.error = 'Connection failed';
          this.emit('error', { type: 'connection', message: 'Failed to connect to API', error });
        });
      
      // Set initialized flag
      this.state.initialized = true;
      this.emit('initialized');
      
      return this;
    } catch (error) {
      console.error('Failed to initialize ChatbotWidget:', error);
      this.state.error = 'Initialization failed';
      this.emit('error', { type: 'initialization', message: 'Failed to initialize widget', error });
      throw error;
    }
  }
  
  /**
   * Connect to the API
   * @returns {Promise} Promise that resolves when connected
   * @private
   */
  async connectToApi() {
    try {
      // Verify API connection and get chatbot info
      const chatbotInfo = await this.api.getChatbotInfo(this.config.chatbotId);
      
      // Update widget with chatbot info if available
      if (chatbotInfo) {
        if (chatbotInfo.name && !this.config.title) {
          this.config.title = chatbotInfo.name;
          this.ui.updateTitle(chatbotInfo.name);
        }
        
        if (chatbotInfo.description && !this.config.subtitle) {
          this.config.subtitle = chatbotInfo.description;
          this.ui.updateSubtitle(chatbotInfo.description);
        }
        
        if (chatbotInfo.welcomeMessage && !this.config.welcomeMessage) {
          this.config.welcomeMessage = chatbotInfo.welcomeMessage;
        }
        
        if (chatbotInfo.theme) {
          this.ui.updateTheme(chatbotInfo.theme);
        }
      }
      
      // Create or resume conversation
      if (this.state.conversationId) {
        // Resume existing conversation
        await this.api.getConversation(this.state.conversationId);
      } else {
        // Create new conversation
        const conversation = await this.api.createConversation(this.config.chatbotId, {
          sessionId: this.state.sessionId,
          userId: this.config.userId,
          userEmail: this.config.userEmail,
          userName: this.config.userName
        });
        
        this.state.conversationId = conversation.id;
        
        // Save conversation ID if persistence is enabled
        if (this.config.persistSession) {
          localStorage.setItem('chatbot_conversation_id', conversation.id);
        }
        
        // Add welcome message if configured
        if (this.config.welcomeMessage) {
          this.receiveMessage({
            id: generateUUID(),
            type: 'text',
            content: this.config.welcomeMessage,
            sender: 'bot',
            timestamp: new Date().toISOString()
          });
        }
      }
      
      return true;
    } catch (error) {
      console.error('API connection error:', error);
      throw error;
    }
  }
  
  /**
   * Get or create a session ID
   * @returns {String} Session ID
   * @private
   */
  getSessionId() {
    if (this.config.persistSession) {
      // Try to get existing session ID from localStorage
      const sessionId = localStorage.getItem('chatbot_session_id');
      if (sessionId) {
        return sessionId;
      }
      
      // Create and store new session ID
      const newSessionId = generateUUID();
      localStorage.setItem('chatbot_session_id', newSessionId);
      return newSessionId;
    } else {
      // Create a new session ID for this instance
      return generateUUID();
    }
  }
  
  /**
   * Load conversation history from localStorage
   * @private
   */
  loadConversationHistory() {
    if (!this.config.persistSession) return;
    
    try {
      // Get conversation ID
      const conversationId = localStorage.getItem('chatbot_conversation_id');
      if (conversationId) {
        this.state.conversationId = conversationId;
      }
      
      // Get messages
      const messages = localStorage.getItem('chatbot_messages');
      if (messages) {
        this.state.messages = JSON.parse(messages);
        
        // Update UI with messages
        this.ui.renderMessages(this.state.messages);
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error);
    }
  }
  
  /**
   * Save messages to localStorage
   * @private
   */
  saveMessages() {
    if (!this.config.persistSession) return;
    
    try {
      localStorage.setItem('chatbot_messages', JSON.stringify(this.state.messages));
    } catch (error) {
      console.error('Failed to save messages:', error);
    }
  }
  
  /**
   * Open the widget
   * @returns {ChatbotWidget} The widget instance
   */
  open() {
    if (!this.state.initialized) {
      console.warn('Cannot open widget before initialization');
      return this;
    }
    
    this.state.open = true;
    this.state.minimized = false;
    this.ui.open();
    this.emit('open');
    return this;
  }
  
  /**
   * Close the widget
   * @returns {ChatbotWidget} The widget instance
   */
  close() {
    this.state.open = false;
    this.ui.close();
    this.emit('close');
    return this;
  }
  
  /**
   * Toggle the widget open/closed state
   * @returns {ChatbotWidget} The widget instance
   */
  toggle() {
    return this.state.open ? this.close() : this.open();
  }
  
  /**
   * Send a message
   * @param {String|Object} message - Message text or object
   * @returns {Promise} Promise that resolves with the sent message
   */
  async sendMessage(message) {
    if (!this.state.connected) {
      throw new Error('Cannot send message: not connected to API');
    }
    
    // Handle string messages
    if (typeof message === 'string') {
      message = {
        type: 'text',
        content: message
      };
    }
    
    // Create message object
    const messageObj = {
      id: generateUUID(),
      type: message.type || 'text',
      content: message.content,
      sender: 'user',
      timestamp: new Date().toISOString(),
      status: 'sending'
    };
    
    // Add to messages
    this.state.messages.push(messageObj);
    
    // Update UI
    this.ui.addMessage(messageObj);
    
    // Emit event
    this.emit('messageSent', messageObj);
    
    try {
      // Send to API
      const response = await this.api.sendMessage(
        this.state.conversationId,
        messageObj
      );
      
      // Update message status
      messageObj.status = 'sent';
      this.ui.updateMessageStatus(messageObj.id, 'sent');
      
      // Save messages
      this.saveMessages();
      
      // Show typing indicator
      if (this.config.enableTypingIndicator) {
        this.state.typing = true;
        this.ui.showTypingIndicator();
      }
      
      // Process bot response
      if (response.messages && response.messages.length > 0) {
        // Hide typing indicator
        if (this.config.enableTypingIndicator) {
          setTimeout(() => {
            this.state.typing = false;
            this.ui.hideTypingIndicator();
          }, this.config.messageDelay);
        }
        
        // Add each response message with delay
        response.messages.forEach((responseMessage, index) => {
          setTimeout(() => {
            this.receiveMessage({
              id: responseMessage.id || generateUUID(),
              type: responseMessage.type || 'text',
              content: responseMessage.content,
              sender: 'bot',
              timestamp: responseMessage.timestamp || new Date().toISOString()
            });
          }, this.config.messageDelay * (index + 1));
        });
      }
      
      return messageObj;
    } catch (error) {
      // Update message status to error
      messageObj.status = 'error';
      this.ui.updateMessageStatus(messageObj.id, 'error');
      
      // Emit error event
      this.emit('error', { 
        type: 'message', 
        message: 'Failed to send message', 
        messageId: messageObj.id,
        error 
      });
      
      throw error;
    }
  }
  
  /**
   * Receive a message from the bot
   * @param {Object} message - Message object
   * @returns {Object} The received message
   */
  receiveMessage(message) {
    // Add to messages
    this.state.messages.push(message);
    
    // Update UI
    this.ui.addMessage(message);
    
    // Save messages
    this.saveMessages();
    
    // Emit event
    this.emit('messageReceived', message);
    
    return message;
  }
  
  /**
   * Clear the conversation
   * @returns {ChatbotWidget} The widget instance
   */
  clearConversation() {
    // Clear messages
    this.state.messages = [];
    
    // Update UI
    this.ui.clearMessages();
    
    // Clear localStorage if persistence is enabled
    if (this.config.persistSession) {
      localStorage.removeItem('chatbot_messages');
      localStorage.removeItem('chatbot_conversation_id');
    }
    
    // Create new conversation
    this.connectToApi()
      .then(() => {
        // Add welcome message if configured
        if (this.config.welcomeMessage) {
          this.receiveMessage({
            id: generateUUID(),
            type: 'text',
            content: this.config.welcomeMessage,
            sender: 'bot',
            timestamp: new Date().toISOString()
          });
        }
      })
      .catch(error => {
        console.error('Failed to create new conversation:', error);
        this.emit('error', { 
          type: 'connection', 
          message: 'Failed to create new conversation', 
          error 
        });
      });
    
    // Emit event
    this.emit('conversationCleared');
    
    return this;
  }
  
  /**
   * Destroy the widget
   */
  destroy() {
    // Clean up UI
    this.ui.destroy();
    
    // Remove event listeners
    this.removeAllListeners();
    
    // Reset state
    this.state.initialized = false;
    this.state.connected = false;
    
    // Emit event
    this.emit('destroyed');
  }
}

export default ChatbotWidget;
