/**
 * API Routes Index
 * 
 * Centralizes and exports all API routes
 */

const express = require('express');
const router = express.Router();

// Import routes
const chatbotRoutes = require('@api/external/v1/routes/chatbot.routes');
const componentRoutes = require('@api/external/v1/routes/component.routes');
const marketplaceRoutes = require('@api/external/v1/routes/marketplace.routes');
const translationRoutes = require('@api/external/v1/routes/translation.routes');
const multilingualKbRoutes = require('@api/external/v1/routes/multilingual-kb.routes');
const modelRoutes = require('@api/external/v1/routes/model.routes');
const documentationRoutes = require('@api/external/v1/routes/documentation.routes');
const conversationRoutes = require('@api/external/v1/routes/conversation.routes');
const sentimentRoutes = require('@api/external/v1/routes/sentiment.routes');

// Mount routes
router.use('/chatbots', chatbotRoutes);
router.use('/components', componentRoutes);
router.use('/marketplace', marketplaceRoutes);
router.use('/translations', translationRoutes);
router.use('/multilingual-kb', multilingualKbRoutes);
router.use('/models', modelRoutes);
router.use('/documentation', documentationRoutes);
router.use('/conversations', conversationRoutes);
router.use('/sentiment', sentimentRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
