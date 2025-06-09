/**
 * API Routes Index
 * 
 * Centralizes and exports all API routes
 */

const express = require('express');
const router = express.Router();
require('@src/api\routes\chatbot.routes');
require('@src/api\routes\component.routes');
require('@src/api\routes\marketplace.routes');
require('@src/api\routes\translation.routes');
require('@src/api\routes\multilingual-kb.routes');
require('@src/api\routes\model.routes');
require('@src/api\routes\documentation.routes');
const conversationRoutes = require('@api/external/v1/routes/conversation.routes');

// Mount routes
router.use('/chatbots', chatbotRoutes);
router.use('/components', componentRoutes);
router.use('/marketplace', marketplaceRoutes);
router.use('/translations', translationRoutes);
router.use('/multilingual-kb', multilingualKbRoutes);
router.use('/models', modelRoutes);
router.use('/documentation', documentationRoutes);
router.use('/conversations', conversationRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
