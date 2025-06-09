/**
 * Conversation Routes
 * 
 * API routes for conversation-related endpoints
 */

// Import module alias registration
require('@src/core/module-alias');

// Import dependencies
const express = require('express');
const router = express.Router();
const { getConversationHistory } = require('@modules/conversation/controllers/conversation.controller');
const { authenticate } = require('@api/middleware/auth.middleware');

/**
 * @route   GET /api/conversations
 * @desc    Get paginated conversation history
 * @access  Private
 * @query   {string} chatbotId - ID of the chatbot
 * @query   {number} [page=1] - Page number
 * @query   {number} [limit=20] - Number of items per page
 */
router.get('/', authenticate, getConversationHistory);

module.exports = router;
