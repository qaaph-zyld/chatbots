/**
 * External REST API v1 Router
 * 
 * This module provides the v1 endpoints for the external REST API.
 */

const express = require('express');
const router = express.Router();

// Import controllers
const chatbotController = require('./controllers/chatbot.controller');
const conversationController = require('./controllers/conversation.controller');
const messageController = require('./controllers/message.controller');
const knowledgeBaseController = require('./controllers/knowledgeBase.controller');

// API documentation
/**
 * @swagger
 * tags:
 *   name: External API v1
 *   description: External REST API v1 endpoints
 */

// Chatbot endpoints
/**
 * @swagger
 * /external/v1/chatbots:
 *   get:
 *     summary: Get all accessible chatbots
 *     tags: [External API v1, Chatbots]
 *     responses:
 *       200:
 *         description: List of chatbots
 */
router.get('/chatbots', chatbotController.getAllChatbots);

/**
 * @swagger
 * /external/v1/chatbots/{id}:
 *   get:
 *     summary: Get a specific chatbot
 *     tags: [External API v1, Chatbots]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chatbot details
 *       404:
 *         description: Chatbot not found
 */
router.get('/chatbots/:id', chatbotController.getChatbotById);

// Conversation endpoints
/**
 * @swagger
 * /external/v1/conversations:
 *   get:
 *     summary: Get all conversations
 *     tags: [External API v1, Conversations]
 *     responses:
 *       200:
 *         description: List of conversations
 */
router.get('/conversations', conversationController.getAllConversations);

/**
 * @swagger
 * /external/v1/conversations:
 *   post:
 *     summary: Create a new conversation
 *     tags: [External API v1, Conversations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - chatbotId
 *             properties:
 *               chatbotId:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Conversation created
 *       400:
 *         description: Invalid request
 */
router.post('/conversations', conversationController.createConversation);

/**
 * @swagger
 * /external/v1/conversations/{id}:
 *   get:
 *     summary: Get a specific conversation
 *     tags: [External API v1, Conversations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Conversation details
 *       404:
 *         description: Conversation not found
 */
router.get('/conversations/:id', conversationController.getConversationById);

// Message endpoints
/**
 * @swagger
 * /external/v1/conversations/{conversationId}/messages:
 *   get:
 *     summary: Get messages in a conversation
 *     tags: [External API v1, Messages]
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of messages
 *       404:
 *         description: Conversation not found
 */
router.get('/conversations/:conversationId/messages', messageController.getMessages);

/**
 * @swagger
 * /external/v1/conversations/{conversationId}/messages:
 *   post:
 *     summary: Send a message in a conversation
 *     tags: [External API v1, Messages]
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [text, image, file]
 *                 default: text
 *     responses:
 *       201:
 *         description: Message sent
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Conversation not found
 */
router.post('/conversations/:conversationId/messages', messageController.sendMessage);

// Knowledge Base endpoints
/**
 * @swagger
 * /external/v1/chatbots/{chatbotId}/knowledge:
 *   get:
 *     summary: Search the knowledge base
 *     tags: [External API v1, Knowledge Base]
 *     parameters:
 *       - in: path
 *         name: chatbotId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results
 *       404:
 *         description: Chatbot not found
 */
router.get('/chatbots/:chatbotId/knowledge', knowledgeBaseController.searchKnowledge);

module.exports = router;
