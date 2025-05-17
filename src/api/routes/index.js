/**
 * API Routes Index
 * 
 * Centralizes and exports all API routes
 */

const express = require('express');
const router = express.Router();
const chatbotRoutes = require('./chatbot.routes');

// Mount routes
router.use('/chatbots', chatbotRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
