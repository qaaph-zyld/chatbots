/**
 * Chat Interface
 * 
 * Provides a user interface for interacting with chatbots
 */

class ChatInterface {
  /**
   * Constructor
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      container: '#chat-container',
      apiEndpoint: '/api/chatbots',
      chatbotId: null,
      userId: `user-${Date.now()}`,
      conversationId: null,
      enableMultiModal: true,
      enableRating: true,
      ...options
    };
    
    this.messages = [];
    this.isProcessing = false;
    
    this.init();
  }
  
  /**
   * Initialize the chat interface
   * @private
   */
  async init() {
    // Get container
    this.container = document.querySelector(this.options.container);
    if (!this.container) {
      console.error('Chat container not found:', this.options.container);
      return;
    }
    
    // Create chat interface
    this.render();
    
    // Initialize response rating component if enabled
    if (this.options.enableRating) {
      this.initRatingComponent();
    }
    
    // Add event listeners
    this.addEventListeners();
    
    // Load chatbot info if ID is provided
    if (this.options.chatbotId) {
      await this.loadChatbotInfo();
    }
    
    // Add welcome message
    this.addSystemMessage('Welcome! How can I help you today?');
  }
  
  /**
   * Render the chat interface
   * @private
   */
  render() {
    this.container.innerHTML = `
      <div class="chat-header">
        <div class="chatbot-info">
          <div class="chatbot-avatar">
            <i class="material-icons">smart_toy</i>
          </div>
          <div class="chatbot-details">
            <h2 class="chatbot-name">Chatbot</h2>
            <div class="chatbot-status">Online</div>
          </div>
        </div>
        <div class="chat-actions">
          <button class="clear-chat-btn" title="Clear Chat">
            <i class="material-icons">delete_sweep</i>
          </button>
        </div>
      </div>
      
      <div class="chat-messages"></div>
      
      <div class="chat-input-container">
        <div class="input-actions">
          <button class="upload-btn" title="Upload Image">
            <i class="material-icons">image</i>
          </button>
          <button class="mic-btn" title="Voice Input">
            <i class="material-icons">mic</i>
          </button>
          <button class="location-btn" title="Share Location">
            <i class="material-icons">location_on</i>
          </button>
        </div>
        <div class="input-wrapper">
          <textarea class="chat-input" placeholder="Type your message..."></textarea>
          <button class="send-btn" title="Send Message">
            <i class="material-icons">send</i>
          </button>
        </div>
      </div>
      
      <div class="chat-upload-preview">
        <div class="preview-content"></div>
        <button class="close-preview-btn">
          <i class="material-icons">close</i>
        </button>
      </div>
      
      <div class="chat-rating-container"></div>
    `;
    
    // Store elements
    this.messagesEl = this.container.querySelector('.chat-messages');
    this.inputEl = this.container.querySelector('.chat-input');
    this.sendBtn = this.container.querySelector('.send-btn');
    this.uploadBtn = this.container.querySelector('.upload-btn');
    this.micBtn = this.container.querySelector('.mic-btn');
    this.locationBtn = this.container.querySelector('.location-btn');
    this.clearChatBtn = this.container.querySelector('.clear-chat-btn');
    this.uploadPreviewEl = this.container.querySelector('.chat-upload-preview');
    this.previewContentEl = this.container.querySelector('.preview-content');
    this.closePreviewBtn = this.container.querySelector('.close-preview-btn');
    this.ratingContainerEl = this.container.querySelector('.chat-rating-container');
    
    // Hide upload preview initially
    this.uploadPreviewEl.style.display = 'none';
    
    // Disable multi-modal buttons if not enabled
    if (!this.options.enableMultiModal) {
      this.uploadBtn.style.display = 'none';
      this.micBtn.style.display = 'none';
      this.locationBtn.style.display = 'none';
    }
  }
  
  /**
   * Initialize the response rating component
   * @private
   */
  initRatingComponent() {
    // Create rating component
    this.ratingComponent = new ResponseRatingComponent({
      container: '.chat-rating-container',
      chatbotId: this.options.chatbotId,
      conversationId: this.options.conversationId,
      onRating: (rating, comment) => {
        console.log('Response rated:', rating, comment);
      }
    });
    
    // Hide initially
    this.ratingComponent.hide();
  }
  
  /**
   * Add event listeners
   * @private
   */
  addEventListeners() {
    // Send message on button click
    this.sendBtn.addEventListener('click', () => this.sendMessage());
    
    // Send message on Enter key (but allow Shift+Enter for new line)
    this.inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    
    // Clear chat
    this.clearChatBtn.addEventListener('click', () => this.clearChat());
    
    // Upload image
    if (this.options.enableMultiModal) {
      this.uploadBtn.addEventListener('click', () => this.openImageUpload());
      this.micBtn.addEventListener('click', () => this.startVoiceInput());
      this.locationBtn.addEventListener('click', () => this.shareLocation());
      this.closePreviewBtn.addEventListener('click', () => this.closePreview());
    }
  }
  
  /**
   * Load chatbot information
   * @private
   */
  async loadChatbotInfo() {
    try {
      const response = await fetch(`${this.options.apiEndpoint}/${this.options.chatbotId}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        // Update chatbot info in UI
        const chatbotNameEl = this.container.querySelector('.chatbot-name');
        if (chatbotNameEl) {
          chatbotNameEl.textContent = data.data.name;
        }
      }
    } catch (error) {
      console.error('Error loading chatbot info:', error);
    }
  }
  
  /**
   * Send a message to the chatbot
   * @private
   */
  async sendMessage() {
    // Get message text
    const message = this.inputEl.value.trim();
    
    // Check if there's a message or attachment
    if (!message && !this.currentAttachment) {
      return;
    }
    
    // Prevent sending while processing
    if (this.isProcessing) {
      return;
    }
    
    this.isProcessing = true;
    
    // Clear input
    this.inputEl.value = '';
    
    // Prepare message data
    let messageData = {
      message,
      userId: this.options.userId
    };
    
    // Add conversation ID if available
    if (this.options.conversationId) {
      messageData.conversationId = this.options.conversationId;
    }
    
    // Add attachment if available
    if (this.currentAttachment) {
      messageData = {
        ...messageData,
        ...this.currentAttachment
      };
      
      // Clear attachment
      this.currentAttachment = null;
      this.closePreview();
    }
    
    // Add user message to UI
    this.addUserMessage(message, messageData);
    
    try {
      // Show typing indicator
      this.addTypingIndicator();
      
      // Send message to API
      const response = await fetch(`${this.options.apiEndpoint}/${this.options.chatbotId}/conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      });
      
      const data = await response.json();
      
      // Remove typing indicator
      this.removeTypingIndicator();
      
      if (data.success) {
        // Store conversation ID
        if (data.conversationId) {
          this.options.conversationId = data.conversationId;
          
          // Update rating component
          if (this.ratingComponent) {
            this.ratingComponent.update({
              conversationId: data.conversationId,
              query: message,
              response: typeof data.response === 'string' ? data.response : JSON.stringify(data.response)
            });
          }
        }
        
        // Add bot response to UI
        this.addBotMessage(data.response);
        
        // Show rating component after bot response
        if (this.ratingComponent) {
          this.ratingComponent.show();
        }
      } else {
        // Add error message
        this.addSystemMessage('Sorry, there was an error processing your message. Please try again.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove typing indicator
      this.removeTypingIndicator();
      
      // Add error message
      this.addSystemMessage('Sorry, there was an error connecting to the server. Please try again later.');
    }
    
    this.isProcessing = false;
  }
  
  /**
   * Add a user message to the chat
   * @param {string} message - Message text
   * @param {Object} data - Additional message data
   * @private
   */
  addUserMessage(message, data = {}) {
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = 'chat-message user-message';
    
    let messageContent = '';
    
    // Add text message if available
    if (message) {
      messageContent += `<div class="message-text">${this.formatMessageText(message)}</div>`;
    }
    
    // Add attachment preview if available
    if (data.input && data.input.type) {
      switch (data.input.type) {
        case 'image':
          messageContent += `<div class="message-attachment image-attachment">
            <img src="${data.input.url || data.input.data}" alt="Image">
          </div>`;
          break;
        case 'audio':
          messageContent += `<div class="message-attachment audio-attachment">
            <audio controls src="${data.input.url || data.input.data}"></audio>
          </div>`;
          break;
        case 'location':
          messageContent += `<div class="message-attachment location-attachment">
            <div class="location-info">
              <i class="material-icons">location_on</i>
              <span>Location shared: ${data.input.content?.address || 'Unknown location'}</span>
            </div>
          </div>`;
          break;
      }
    }
    
    messageEl.innerHTML = `
      <div class="message-content">
        ${messageContent}
      </div>
      <div class="message-info">
        <span class="message-time">${this.formatTime(new Date())}</span>
        <span class="message-status">
          <i class="material-icons">check</i>
        </span>
      </div>
    `;
    
    // Add to messages container
    this.messagesEl.appendChild(messageEl);
    
    // Scroll to bottom
    this.scrollToBottom();
    
    // Store message
    this.messages.push({
      type: 'user',
      content: message,
      data,
      timestamp: new Date()
    });
  }
  
  /**
   * Add a bot message to the chat
   * @param {string|Object} message - Message content
   * @private
   */
  addBotMessage(message) {
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = 'chat-message bot-message';
    
    let messageContent = '';
    
    // Process different message types
    if (typeof message === 'string') {
      // Simple text message
      messageContent = `<div class="message-text">${this.formatMessageText(message)}</div>`;
    } else if (Array.isArray(message)) {
      // Multiple message parts
      messageContent = message.map(part => this.renderMessagePart(part)).join('');
    } else if (typeof message === 'object') {
      // Single rich message
      messageContent = this.renderMessagePart(message);
    }
    
    messageEl.innerHTML = `
      <div class="message-avatar">
        <i class="material-icons">smart_toy</i>
      </div>
      <div class="message-content">
        ${messageContent}
      </div>
      <div class="message-info">
        <span class="message-time">${this.formatTime(new Date())}</span>
      </div>
    `;
    
    // Add to messages container
    this.messagesEl.appendChild(messageEl);
    
    // Scroll to bottom
    this.scrollToBottom();
    
    // Store message
    this.messages.push({
      type: 'bot',
      content: message,
      timestamp: new Date()
    });
  }
  
  /**
   * Render a message part based on its type
   * @param {Object} part - Message part
   * @returns {string} - HTML for the message part
   * @private
   */
  renderMessagePart(part) {
    if (!part || !part.type) {
      return '';
    }
    
    switch (part.type) {
      case 'text':
        return `<div class="message-text">${this.formatMessageText(part.content)}</div>`;
        
      case 'image':
        return `<div class="message-attachment image-attachment">
          <img src="${part.url}" alt="${part.alt || 'Image'}">
          ${part.caption ? `<div class="attachment-caption">${part.caption}</div>` : ''}
        </div>`;
        
      case 'audio':
        return `<div class="message-attachment audio-attachment">
          <audio controls src="${part.url}"></audio>
          ${part.caption ? `<div class="attachment-caption">${part.caption}</div>` : ''}
        </div>`;
        
      case 'card':
        return `<div class="message-card">
          ${part.content.imageUrl ? `<div class="card-image">
            <img src="${part.content.imageUrl}" alt="${part.content.title || 'Card'}">
          </div>` : ''}
          <div class="card-content">
            ${part.content.title ? `<h3 class="card-title">${part.content.title}</h3>` : ''}
            ${part.content.subtitle ? `<div class="card-subtitle">${part.content.subtitle}</div>` : ''}
            ${part.content.text ? `<div class="card-text">${this.formatMessageText(part.content.text)}</div>` : ''}
            ${part.content.buttons && part.content.buttons.length > 0 ? `
              <div class="card-buttons">
                ${part.content.buttons.map(button => `
                  <button class="card-button" data-action="${button.action || ''}" data-value="${button.value || ''}">
                    ${button.text}
                  </button>
                `).join('')}
              </div>
            ` : ''}
          </div>
        </div>`;
        
      case 'carousel':
        return `<div class="message-carousel">
          <div class="carousel-items">
            ${part.content.map(item => `
              <div class="carousel-item">
                ${item.imageUrl ? `<div class="item-image">
                  <img src="${item.imageUrl}" alt="${item.title || 'Item'}">
                </div>` : ''}
                <div class="item-content">
                  ${item.title ? `<h3 class="item-title">${item.title}</h3>` : ''}
                  ${item.subtitle ? `<div class="item-subtitle">${item.subtitle}</div>` : ''}
                  ${item.text ? `<div class="item-text">${this.formatMessageText(item.text)}</div>` : ''}
                  ${item.buttons && item.buttons.length > 0 ? `
                    <div class="item-buttons">
                      ${item.buttons.map(button => `
                        <button class="item-button" data-action="${button.action || ''}" data-value="${button.value || ''}">
                          ${button.text}
                        </button>
                      `).join('')}
                    </div>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
          <div class="carousel-controls">
            <button class="carousel-prev">
              <i class="material-icons">chevron_left</i>
            </button>
            <div class="carousel-dots"></div>
            <button class="carousel-next">
              <i class="material-icons">chevron_right</i>
            </button>
          </div>
        </div>`;
        
      case 'quick_reply':
        return `<div class="message-quick-replies">
          ${part.content.text ? `<div class="quick-replies-text">${this.formatMessageText(part.content.text)}</div>` : ''}
          <div class="quick-reply-buttons">
            ${part.content.replies.map(reply => `
              <button class="quick-reply-button" data-value="${reply.value || reply.text}">
                ${reply.text}
              </button>
            `).join('')}
          </div>
        </div>`;
        
      default:
        return '';
    }
  }
  
  /**
   * Add a system message to the chat
   * @param {string} message - Message text
   * @private
   */
  addSystemMessage(message) {
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = 'chat-message system-message';
    
    messageEl.innerHTML = `
      <div class="message-content">
        <div class="message-text">${this.formatMessageText(message)}</div>
      </div>
    `;
    
    // Add to messages container
    this.messagesEl.appendChild(messageEl);
    
    // Scroll to bottom
    this.scrollToBottom();
    
    // Store message
    this.messages.push({
      type: 'system',
      content: message,
      timestamp: new Date()
    });
  }
  
  /**
   * Add typing indicator
   * @private
   */
  addTypingIndicator() {
    // Remove existing indicator if any
    this.removeTypingIndicator();
    
    // Create indicator element
    const indicatorEl = document.createElement('div');
    indicatorEl.className = 'chat-message bot-message typing-indicator';
    
    indicatorEl.innerHTML = `
      <div class="message-avatar">
        <i class="material-icons">smart_toy</i>
      </div>
      <div class="message-content">
        <div class="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `;
    
    // Add to messages container
    this.messagesEl.appendChild(indicatorEl);
    
    // Scroll to bottom
    this.scrollToBottom();
  }
  
  /**
   * Remove typing indicator
   * @private
   */
  removeTypingIndicator() {
    const indicator = this.messagesEl.querySelector('.typing-indicator');
    if (indicator) {
      indicator.remove();
    }
  }
  
  /**
   * Format message text (convert URLs, line breaks, etc.)
   * @param {string} text - Message text
   * @returns {string} - Formatted text
   * @private
   */
  formatMessageText(text) {
    if (!text) return '';
    
    // Convert URLs to links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    text = text.replace(urlRegex, url => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
    
    // Convert line breaks to <br>
    text = text.replace(/\n/g, '<br>');
    
    return text;
  }
  
  /**
   * Format time
   * @param {Date} date - Date object
   * @returns {string} - Formatted time
   * @private
   */
  formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  /**
   * Scroll chat to bottom
   * @private
   */
  scrollToBottom() {
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }
  
  /**
   * Clear chat history
   * @private
   */
  clearChat() {
    // Clear UI
    this.messagesEl.innerHTML = '';
    
    // Clear messages array
    this.messages = [];
    
    // Add welcome message
    this.addSystemMessage('Chat cleared. How can I help you today?');
    
    // Reset conversation ID
    this.options.conversationId = null;
    
    // Hide rating component
    if (this.ratingComponent) {
      this.ratingComponent.hide();
    }
  }
  
  /**
   * Open image upload dialog
   * @private
   */
  openImageUpload() {
    // Create file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    
    // Add to body
    document.body.appendChild(fileInput);
    
    // Add event listener
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.handleImageUpload(file);
      }
      
      // Remove input
      document.body.removeChild(fileInput);
    });
    
    // Trigger click
    fileInput.click();
  }
  
  /**
   * Handle image upload
   * @param {File} file - Image file
   * @private
   */
  handleImageUpload(file) {
    // Create file reader
    const reader = new FileReader();
    
    // Add event listener
    reader.addEventListener('load', (e) => {
      const imageData = e.target.result;
      
      // Show preview
      this.showPreview('image', imageData);
      
      // Store attachment
      this.currentAttachment = {
        input: {
          type: 'image',
          data: imageData,
          filename: file.name,
          mimeType: file.type
        }
      };
    });
    
    // Read file
    reader.readAsDataURL(file);
  }
  
  /**
   * Start voice input
   * @private
   */
  startVoiceInput() {
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.addSystemMessage('Sorry, your browser does not support voice input.');
      return;
    }
    
    // Create recognition instance
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    // Add event listeners
    recognition.onstart = () => {
      // Show recording indicator
      this.micBtn.classList.add('recording');
      this.addSystemMessage('Listening...');
    };
    
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      
      // Add to input
      this.inputEl.value = transcript;
      
      // Focus input
      this.inputEl.focus();
    };
    
    recognition.onerror = (e) => {
      console.error('Speech recognition error:', e.error);
      this.addSystemMessage(`Voice input error: ${e.error}`);
    };
    
    recognition.onend = () => {
      // Remove recording indicator
      this.micBtn.classList.remove('recording');
    };
    
    // Start recognition
    recognition.start();
  }
  
  /**
   * Share location
   * @private
   */
  async shareLocation() {
    // Check if browser supports geolocation
    if (!navigator.geolocation) {
      this.addSystemMessage('Sorry, your browser does not support location sharing.');
      return;
    }
    
    try {
      // Show loading indicator
      this.locationBtn.classList.add('loading');
      
      // Get current position
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });
      
      // Get location data
      const { latitude, longitude } = position.coords;
      
      // Try to get address using reverse geocoding
      let address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await response.json();
        if (data && data.display_name) {
          address = data.display_name;
        }
      } catch (error) {
        console.warn('Error getting address:', error);
      }
      
      // Show preview
      this.showPreview('location', { latitude, longitude, address });
      
      // Store attachment
      this.currentAttachment = {
        input: {
          type: 'location',
          content: {
            latitude,
            longitude,
            address
          }
        }
      };
    } catch (error) {
      console.error('Error getting location:', error);
      this.addSystemMessage('Sorry, there was an error getting your location. Please try again.');
    } finally {
      // Remove loading indicator
      this.locationBtn.classList.remove('loading');
    }
  }
  
  /**
   * Show attachment preview
   * @param {string} type - Attachment type
   * @param {*} data - Attachment data
   * @private
   */
  showPreview(type, data) {
    // Clear previous preview
    this.previewContentEl.innerHTML = '';
    
    // Create preview based on type
    switch (type) {
      case 'image':
        this.previewContentEl.innerHTML = `
          <div class="image-preview">
            <img src="${data}" alt="Image Preview">
          </div>
        `;
        break;
        
      case 'audio':
        this.previewContentEl.innerHTML = `
          <div class="audio-preview">
            <audio controls src="${data}"></audio>
          </div>
        `;
        break;
        
      case 'location':
        this.previewContentEl.innerHTML = `
          <div class="location-preview">
            <div class="location-info">
              <i class="material-icons">location_on</i>
              <span>${data.address}</span>
            </div>
          </div>
        `;
        break;
    }
    
    // Show preview
    this.uploadPreviewEl.style.display = 'flex';
  }
  
  /**
   * Close attachment preview
   * @private
   */
  closePreview() {
    // Hide preview
    this.uploadPreviewEl.style.display = 'none';
    
    // Clear preview content
    this.previewContentEl.innerHTML = '';
    
    // Clear attachment
    this.currentAttachment = null;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChatInterface;
}
