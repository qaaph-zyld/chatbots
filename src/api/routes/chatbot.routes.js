/**
 * Chatbot Routes
 * 
 * Defines API routes for chatbot operations
 */

const express = require('express');
const router = express.Router();
require('@src/api\controllers\chatbot.controller');
require('@src/middleware');

// Get all chatbots
router.get('/', chatbotController.getAllChatbots);

// Get chatbot by ID
router.get('/:id', chatbotController.getChatbotById);

// Create new chatbot
router.post('/', checkRole('admin'), chatbotController.createChatbot);

// Update chatbot
router.put('/:id', checkRole('admin'), chatbotController.updateChatbot);

// Delete chatbot
router.delete('/:id', checkRole('admin'), chatbotController.deleteChatbot);

// Process message
router.post('/:id/message', chatbotController.processMessage);

// Get conversation history
router.get('/:id/conversations', chatbotController.getConversationHistory);

module.exports = router;
