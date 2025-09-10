/**
 * Main API Routes
 * Central routing configuration for all API endpoints
 */

const express = require('express');
const chatbotRoutes = require('../../features/chatbot/chatbot.routes');
const conversationRoutes = require('../../features/conversation/conversation.routes');
const analyticsRoutes = require('../../features/analytics/analytics.routes');
const { authenticate, optionalAuth } = require('../../infrastructure/middleware/auth.middleware');
const { notFound } = require('../../infrastructure/middleware/error.middleware');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Public routes (no authentication required)
router.use('/chatbots', optionalAuth, chatbotRoutes);

// Protected routes (authentication required)
router.use('/conversations', authenticate, conversationRoutes);
router.use('/analytics', authenticate, analyticsRoutes);

// Handle 404 for API routes
router.use('*', notFound);

module.exports = router;
