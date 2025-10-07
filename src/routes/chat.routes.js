/**
 * Chat Routes - MVP Implementation
 * Defines chat endpoints for ShopBot MVP
 */

const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');

// Chat endpoints
router.post('/message', chatController.sendMessage);
router.get('/history/:sessionId', chatController.getChatHistory);

// Health check for chat service
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'ShopBot Chat Service',
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
