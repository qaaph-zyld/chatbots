/**
 * Widget UI class
 * Handles the user interface for the chatbot widget
 */
class WidgetUI {
  /**
   * Create a new WidgetUI instance
   * @param {Object} config - Configuration options
   * @param {ChatbotWidget} widget - Parent widget instance
   */
  constructor(config, widget) {
    this.config = config;
    this.widget = widget;
    this.elements = {};
    
    // Bind methods
    this.render = this.render.bind(this);
    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
    this.addMessage = this.addMessage.bind(this);
    this.renderMessages = this.renderMessages.bind(this);
    this.clearMessages = this.clearMessages.bind(this);
    this.showTypingIndicator = this.showTypingIndicator.bind(this);
    this.hideTypingIndicator = this.hideTypingIndicator.bind(this);
    this.updateMessageStatus = this.updateMessageStatus.bind(this);
    this.updateTitle = this.updateTitle.bind(this);
    this.updateSubtitle = this.updateSubtitle.bind(this);
    this.updateTheme = this.updateTheme.bind(this);
    this.destroy = this.destroy.bind(this);
  }
  
  /**
   * Render the widget UI
   */
  render() {
    // Create container
    this.elements.container = document.createElement('div');
    this.elements.container.className = `chatbot-widget chatbot-widget--${this.config.position} chatbot-widget--${this.config.theme}`;
    this.elements.container.setAttribute('data-chatbot-widget', 'container');
    
    // Apply custom colors if provided
    if (this.config.primaryColor) {
      this.elements.container.style.setProperty('--primary-color', this.config.primaryColor);
    }
    
    if (this.config.secondaryColor) {
      this.elements.container.style.setProperty('--secondary-color', this.config.secondaryColor);
    }
    
    if (this.config.textColor) {
      this.elements.container.style.setProperty('--text-color', this.config.textColor);
    }
    
    // Create toggle button
    this.elements.toggleButton = document.createElement('button');
    this.elements.toggleButton.className = 'chatbot-widget__toggle';
    this.elements.toggleButton.setAttribute('aria-label', 'Toggle chat widget');
    this.elements.toggleButton.innerHTML = `
      <svg class="chatbot-widget__toggle-icon chatbot-widget__toggle-icon--open" viewBox="0 0 24 24">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
        <path d="M7 9h10M7 13h7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <svg class="chatbot-widget__toggle-icon chatbot-widget__toggle-icon--close" viewBox="0 0 24 24">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
      </svg>
    `;
    
    // Create chat window
    this.elements.chatWindow = document.createElement('div');
    this.elements.chatWindow.className = 'chatbot-widget__window';
    
    // Create header
    this.elements.header = document.createElement('div');
    this.elements.header.className = 'chatbot-widget__header';
    
    this.elements.headerTitle = document.createElement('div');
    this.elements.headerTitle.className = 'chatbot-widget__header-title';
    this.elements.headerTitle.textContent = this.config.title;
    
    this.elements.headerSubtitle = document.createElement('div');
    this.elements.headerSubtitle.className = 'chatbot-widget__header-subtitle';
    this.elements.headerSubtitle.textContent = this.config.subtitle;
    
    this.elements.headerActions = document.createElement('div');
    this.elements.headerActions.className = 'chatbot-widget__header-actions';
    
    this.elements.clearButton = document.createElement('button');
    this.elements.clearButton.className = 'chatbot-widget__header-button';
    this.elements.clearButton.setAttribute('aria-label', 'Clear conversation');
    this.elements.clearButton.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
      </svg>
    `;
    
    this.elements.closeButton = document.createElement('button');
    this.elements.closeButton.className = 'chatbot-widget__header-button';
    this.elements.closeButton.setAttribute('aria-label', 'Close chat');
    this.elements.closeButton.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
      </svg>
    `;
    
    // Create messages container
    this.elements.messagesContainer = document.createElement('div');
    this.elements.messagesContainer.className = 'chatbot-widget__messages';
    
    // Create typing indicator
    this.elements.typingIndicator = document.createElement('div');
    this.elements.typingIndicator.className = 'chatbot-widget__typing-indicator';
    this.elements.typingIndicator.innerHTML = `
      <span class="chatbot-widget__typing-dot"></span>
      <span class="chatbot-widget__typing-dot"></span>
      <span class="chatbot-widget__typing-dot"></span>
    `;
    this.elements.typingIndicator.style.display = 'none';
    
    // Create input area
    this.elements.inputArea = document.createElement('div');
    this.elements.inputArea.className = 'chatbot-widget__input-area';
    
    this.elements.messageInput = document.createElement('textarea');
    this.elements.messageInput.className = 'chatbot-widget__input';
    this.elements.messageInput.placeholder = 'Type a message...';
    this.elements.messageInput.setAttribute('rows', '1');
    this.elements.messageInput.setAttribute('aria-label', 'Message');
    
    this.elements.sendButton = document.createElement('button');
    this.elements.sendButton.className = 'chatbot-widget__send-button';
    this.elements.sendButton.setAttribute('aria-label', 'Send message');
    this.elements.sendButton.innerHTML = `
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
      </svg>
    `;
    
    // Assemble UI
    this.elements.header.appendChild(this.elements.headerTitle);
    this.elements.header.appendChild(this.elements.headerSubtitle);
    this.elements.headerActions.appendChild(this.elements.clearButton);
    this.elements.headerActions.appendChild(this.elements.closeButton);
    this.elements.header.appendChild(this.elements.headerActions);
    
    this.elements.inputArea.appendChild(this.elements.messageInput);
    this.elements.inputArea.appendChild(this.elements.sendButton);
    
    this.elements.chatWindow.appendChild(this.elements.header);
    this.elements.chatWindow.appendChild(this.elements.messagesContainer);
    this.elements.chatWindow.appendChild(this.elements.typingIndicator);
    this.elements.chatWindow.appendChild(this.elements.inputArea);
    
    this.elements.container.appendChild(this.elements.toggleButton);
    this.elements.container.appendChild(this.elements.chatWindow);
    
    // Add to document
    document.body.appendChild(this.elements.container);
    
    // Add event listeners
    this.elements.toggleButton.addEventListener('click', this.widget.toggle);
    this.elements.closeButton.addEventListener('click', this.widget.close);
    this.elements.clearButton.addEventListener('click', this.widget.clearConversation);
    
    this.elements.messageInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        const message = this.elements.messageInput.value.trim();
        if (message) {
          this.widget.sendMessage(message);
          this.elements.messageInput.value = '';
        }
      }
    });
    
    this.elements.sendButton.addEventListener('click', () => {
      const message = this.elements.messageInput.value.trim();
      if (message) {
        this.widget.sendMessage(message);
        this.elements.messageInput.value = '';
      }
    });
    
    // Auto-resize textarea
    this.elements.messageInput.addEventListener('input', () => {
      this.elements.messageInput.style.height = 'auto';
      this.elements.messageInput.style.height = `${this.elements.messageInput.scrollHeight}px`;
    });
    
    // Initial state
    if (this.widget.state.open) {
      this.open();
    } else {
      this.close();
    }
  }
  
  /**
   * Open the chat window
   */
  open() {
    this.elements.container.classList.add('chatbot-widget--open');
    this.elements.messageInput.focus();
    
    // Scroll to bottom of messages
    this.scrollToBottom();
  }
  
  /**
   * Close the chat window
   */
  close() {
    this.elements.container.classList.remove('chatbot-widget--open');
  }
  
  /**
   * Add a message to the chat
   * @param {Object} message - Message to add
   */
  addMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = `chatbot-widget__message chatbot-widget__message--${message.sender}`;
    messageElement.setAttribute('data-message-id', message.id);
    
    const contentElement = document.createElement('div');
    contentElement.className = 'chatbot-widget__message-content';
    
    // Handle different message types
    switch (message.type) {
      case 'text':
        contentElement.textContent = message.content;
        break;
      case 'html':
        contentElement.innerHTML = message.content;
        break;
      case 'image':
        const img = document.createElement('img');
        img.src = message.content;
        img.alt = message.alt || 'Image';
        img.className = 'chatbot-widget__message-image';
        contentElement.appendChild(img);
        break;
      default:
        contentElement.textContent = message.content;
    }
    
    // Add status for user messages
    if (message.sender === 'user' && message.status) {
      const statusElement = document.createElement('div');
      statusElement.className = `chatbot-widget__message-status chatbot-widget__message-status--${message.status}`;
      statusElement.setAttribute('data-status', message.status);
      
      let statusIcon = '';
      switch (message.status) {
        case 'sending':
          statusIcon = '⏱️';
          break;
        case 'sent':
          statusIcon = '✓';
          break;
        case 'delivered':
          statusIcon = '✓✓';
          break;
        case 'read':
          statusIcon = '✓✓';
          break;
        case 'error':
          statusIcon = '⚠️';
          break;
      }
      
      statusElement.textContent = statusIcon;
      messageElement.appendChild(statusElement);
    }
    
    // Add timestamp
    const timestampElement = document.createElement('div');
    timestampElement.className = 'chatbot-widget__message-timestamp';
    
    const messageDate = new Date(message.timestamp);
    timestampElement.textContent = messageDate.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    messageElement.appendChild(contentElement);
    messageElement.appendChild(timestampElement);
    
    this.elements.messagesContainer.appendChild(messageElement);
    
    // Scroll to bottom
    this.scrollToBottom();
  }
  
  /**
   * Render all messages
   * @param {Array} messages - Messages to render
   */
  renderMessages(messages) {
    // Clear existing messages
    this.clearMessages();
    
    // Add each message
    messages.forEach(message => {
      this.addMessage(message);
    });
  }
  
  /**
   * Clear all messages
   */
  clearMessages() {
    this.elements.messagesContainer.innerHTML = '';
  }
  
  /**
   * Show typing indicator
   */
  showTypingIndicator() {
    this.elements.typingIndicator.style.display = 'flex';
    this.scrollToBottom();
  }
  
  /**
   * Hide typing indicator
   */
  hideTypingIndicator() {
    this.elements.typingIndicator.style.display = 'none';
  }
  
  /**
   * Update message status
   * @param {String} messageId - ID of the message
   * @param {String} status - New status
   */
  updateMessageStatus(messageId, status) {
    const messageElement = this.elements.messagesContainer.querySelector(`[data-message-id="${messageId}"]`);
    if (!messageElement) return;
    
    const statusElement = messageElement.querySelector('.chatbot-widget__message-status');
    if (statusElement) {
      statusElement.setAttribute('data-status', status);
      statusElement.className = `chatbot-widget__message-status chatbot-widget__message-status--${status}`;
      
      let statusIcon = '';
      switch (status) {
        case 'sending':
          statusIcon = '⏱️';
          break;
        case 'sent':
          statusIcon = '✓';
          break;
        case 'delivered':
          statusIcon = '✓✓';
          break;
        case 'read':
          statusIcon = '✓✓';
          break;
        case 'error':
          statusIcon = '⚠️';
          break;
      }
      
      statusElement.textContent = statusIcon;
    }
  }
  
  /**
   * Update widget title
   * @param {String} title - New title
   */
  updateTitle(title) {
    this.elements.headerTitle.textContent = title;
  }
  
  /**
   * Update widget subtitle
   * @param {String} subtitle - New subtitle
   */
  updateSubtitle(subtitle) {
    this.elements.headerSubtitle.textContent = subtitle;
  }
  
  /**
   * Update widget theme
   * @param {String} theme - New theme
   */
  updateTheme(theme) {
    this.elements.container.classList.remove(`chatbot-widget--${this.config.theme}`);
    this.elements.container.classList.add(`chatbot-widget--${theme}`);
    this.config.theme = theme;
  }
  
  /**
   * Scroll to bottom of messages
   */
  scrollToBottom() {
    this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
  }
  
  /**
   * Destroy the UI
   */
  destroy() {
    // Remove event listeners
    this.elements.toggleButton.removeEventListener('click', this.widget.toggle);
    this.elements.closeButton.removeEventListener('click', this.widget.close);
    this.elements.clearButton.removeEventListener('click', this.widget.clearConversation);
    
    // Remove from DOM
    if (this.elements.container && this.elements.container.parentNode) {
      this.elements.container.parentNode.removeChild(this.elements.container);
    }
  }
}

export default WidgetUI;
