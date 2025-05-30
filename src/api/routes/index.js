/**
 * API Routes Index
 * 
 * Centralizes and exports all API routes
 */

const express = require('express');
const router = express.Router();
const chatbotRoutes = require('./chatbot.routes');
const componentRoutes = require('./component.routes');
const marketplaceRoutes = require('./marketplace.routes');
const translationRoutes = require('./translation.routes');
const multilingualKbRoutes = require('./multilingual-kb.routes');
const modelRoutes = require('./model.routes');
const documentationRoutes = require('./documentation.routes');

// Mount routes
router.use('/chatbots', chatbotRoutes);
router.use('/components', componentRoutes);
router.use('/marketplace', marketplaceRoutes);
router.use('/translations', translationRoutes);
router.use('/multilingual-kb', multilingualKbRoutes);
router.use('/models', modelRoutes);
router.use('/documentation', documentationRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
