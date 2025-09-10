/**
 * Chatbot Routes
 * Express routes for chatbot endpoints
 */

const express = require('express');
const ChatbotController = require('./chatbot.controller');

const router = express.Router();
const chatbotController = new ChatbotController();

// Create chatbot
router.post('/', (req, res) => chatbotController.createChatbot(req, res));

// Get chatbot by ID
router.get('/:id', (req, res) => chatbotController.getChatbot(req, res));

// Update chatbot
router.put('/:id', (req, res) => chatbotController.updateChatbot(req, res));

// Delete chatbot
router.delete('/:id', (req, res) => chatbotController.deleteChatbot(req, res));

// List chatbots
router.get('/', (req, res) => chatbotController.listChatbots(req, res));

// Process message
router.post('/:id/message', (req, res) => chatbotController.processMessage(req, res));

module.exports = router;
