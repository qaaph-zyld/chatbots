/**
 * Chat Controller - MVP Implementation
 * Handles basic chat functionality for ShopBot MVP
 */

const axios = require('axios');

class ChatController {
  /**
   * Process a chat message and return AI response
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async sendMessage(req, res) {
    try {
      const { message, sessionId } = req.body;

      if (!message || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Message is required'
        });
      }

      // Generate session ID if not provided
      const chatSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // For MVP, we'll use a simple response system
      // In production, this would integrate with OpenAI or other AI services
      const response = await this.generateResponse(message);

      // Store conversation (for now, just in memory - in production use database)
      const conversation = {
        sessionId: chatSessionId,
        userMessage: message,
        botResponse: response,
        timestamp: new Date().toISOString()
      };

      // Return response
      res.json({
        success: true,
        data: {
          sessionId: chatSessionId,
          userMessage: message,
          botResponse: response,
          timestamp: conversation.timestamp
        }
      });

    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process message',
        details: error.message
      });
    }
  }

  /**
   * Generate AI response (MVP implementation)
   * @param {string} message - User message
   * @returns {string} Bot response
   */
  async generateResponse(message) {
    // MVP: Simple rule-based responses
    // In production, integrate with OpenAI API
    
    const lowerMessage = message.toLowerCase();

    // Shopping-related responses
    if (lowerMessage.includes('product') || lowerMessage.includes('buy') || lowerMessage.includes('shop')) {
      return "I can help you find products! What are you looking for today?";
    }
    
    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('how much')) {
      return "I'd be happy to help you with pricing information. Could you tell me which product you're interested in?";
    }
    
    if (lowerMessage.includes('shipping') || lowerMessage.includes('delivery')) {
      return "We offer fast shipping options! Standard delivery is 3-5 business days, and express delivery is 1-2 business days.";
    }
    
    if (lowerMessage.includes('return') || lowerMessage.includes('refund')) {
      return "Our return policy allows returns within 30 days of purchase. Would you like me to help you with a return?";
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
      return "I'm here to help! I can assist with product information, pricing, shipping, returns, and general shopping questions. What would you like to know?";
    }
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return "Hello! Welcome to ShopBot. I'm your shopping assistant. How can I help you today?";
    }
    
    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
      return "You're welcome! Is there anything else I can help you with?";
    }
    
    if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
      return "Goodbye! Thanks for using ShopBot. Have a great day!";
    }

    // Default response
    return "I understand you're asking about: '" + message + "'. I'm ShopBot, your shopping assistant. I can help with products, pricing, shipping, and returns. What specific information would you like?";
  }

  /**
   * Get chat history for a session
   * @param {Object} req - Express request object  
   * @param {Object} res - Express response object
   */
  async getChatHistory(req, res) {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Session ID is required'
        });
      }

      // For MVP, return empty history (in production, fetch from database)
      res.json({
        success: true,
        data: {
          sessionId,
          messages: [],
          message: 'Chat history feature coming soon'
        }
      });

    } catch (error) {
      console.error('Chat history error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve chat history'
      });
    }
  }
}

module.exports = new ChatController();
