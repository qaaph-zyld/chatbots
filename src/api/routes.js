/**
 * API Routes
 * 
 * Defines all API endpoints for the application
 */

const express = require('express');
const router = express.Router();

// Import controllers
// These will be implemented as we progress through the roadmap
const chatbotController = require('./controllers/chatbot.controller');
const templateController = require('./controllers/template.controller');
const integrationController = require('./controllers/integration.controller');

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Chatbot routes
router.get('/chatbots', chatbotController.getAllChatbots);
router.post('/chatbots', chatbotController.createChatbot);
router.get('/chatbots/:id', chatbotController.getChatbotById);
router.put('/chatbots/:id', chatbotController.updateChatbot);
router.delete('/chatbots/:id', chatbotController.deleteChatbot);

// Conversation routes
router.post('/chatbots/:id/conversation', chatbotController.sendMessage);
router.get('/chatbots/:id/conversation/history', chatbotController.getConversationHistory);

// Template routes
router.get('/templates', templateController.getAllTemplates);
router.post('/templates', templateController.createTemplate);
router.get('/templates/:id', templateController.getTemplateById);

// Integration routes
router.get('/integrations', integrationController.getAllIntegrations);
router.post('/integrations', integrationController.createIntegration);

// Export router
module.exports = router;
