/**
 * Main JavaScript for Chatbot UI
 * 
 * Handles the client-side functionality for the chatbot interface
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const chatContainer = document.getElementById('chat-container');
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');
  const chatMessages = document.getElementById('chat-messages');
  
  // Chatbot configuration
  let chatbotId = null;
  let conversationId = null;
  const apiUrl = '/api/chatbots';
  
  /**
   * Initialize the chatbot
   */
  async function initChatbot() {
    try {
      // Get the first available chatbot or use the one specified in the URL
      const urlParams = new URLSearchParams(window.location.search);
      chatbotId = urlParams.get('id');
      
      if (!chatbotId) {
        const response = await fetch(apiUrl);
        const chatbots = await response.json();
        
        if (chatbots && chatbots.length > 0) {
          chatbotId = chatbots[0].id;
        } else {
          showError('No chatbots available');
          return;
        }
      }
      
      // Create a new conversation
      const conversationResponse = await fetch(`${apiUrl}/${chatbotId}/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const conversationData = await conversationResponse.json();
      conversationId = conversationData.id;
      
      // Add welcome message
      addMessage('bot', 'Hello! How can I help you today?');
    } catch (error) {
      console.error('Error initializing chatbot:', error);
      showError('Failed to initialize chatbot');
    }
  }
  
  /**
   * Send a message to the chatbot
   * @param {string} message - The message to send
   */
  async function sendMessage(message) {
    if (!message.trim()) return;
    
    try {
      // Add user message to chat
      addMessage('user', message);
      
      // Clear input field
      messageInput.value = '';
      
      // Show typing indicator
      showTypingIndicator();
      
      // Send message to API
      const response = await fetch(`${apiUrl}/${chatbotId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          conversationId
        })
      });
      
      // Hide typing indicator
      hideTypingIndicator();
      
      if (!response.ok) {
        throw new Error('Failed to get response');
      }
      
      const data = await response.json();
      
      // Add bot response to chat
      addMessage('bot', data.response);
    } catch (error) {
      console.error('Error sending message:', error);
      hideTypingIndicator();
      addMessage('error', 'Sorry, I encountered an error. Please try again.');
    }
  }
  
  /**
   * Add a message to the chat
   * @param {string} sender - 'user', 'bot', or 'error'
   * @param {string} message - The message content
   */
  function addMessage(sender, message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);
    
    const contentElement = document.createElement('div');
    contentElement.classList.add('message-content');
    contentElement.textContent = message;
    
    messageElement.appendChild(contentElement);
    chatMessages.appendChild(messageElement);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  /**
   * Show typing indicator
   */
  function showTypingIndicator() {
    const typingElement = document.createElement('div');
    typingElement.classList.add('message', 'bot', 'typing');
    typingElement.id = 'typing-indicator';
    
    const dotsElement = document.createElement('div');
    dotsElement.classList.add('typing-dots');
    
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('span');
      dotsElement.appendChild(dot);
    }
    
    typingElement.appendChild(dotsElement);
    chatMessages.appendChild(typingElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  /**
   * Hide typing indicator
   */
  function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }
  
  /**
   * Show error message
   * @param {string} message - The error message
   */
  function showError(message) {
    const errorElement = document.createElement('div');
    errorElement.classList.add('error-message');
    errorElement.textContent = message;
    
    chatContainer.prepend(errorElement);
    
    setTimeout(() => {
      errorElement.remove();
    }, 5000);
  }
  
  // Event listeners
  sendButton.addEventListener('click', () => {
    sendMessage(messageInput.value);
  });
  
  messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      sendMessage(messageInput.value);
    }
  });
  
  // Initialize chatbot
  initChatbot();
});
