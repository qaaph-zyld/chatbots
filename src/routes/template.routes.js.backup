/**
 * Template Routes
 * 
 * This file defines the API routes for template management and the template gallery.
 */

const express = require('express');
const router = express.Router();
require('@src/controllers\template.controller');
require('@src/middleware\auth');

// Public routes
router.get('/featured', templateController.getFeaturedTemplates);
router.get('/popular', templateController.getPopularTemplates);
router.get('/category/:category', templateController.getTemplatesByCategory);
router.get('/search', templateController.searchTemplates);

// Protected routes (require authentication)
router.use(authenticate);

// Template CRUD operations
router.post('/', templateController.createTemplate);
router.get('/:templateId', templateController.getTemplateById);
router.put('/:templateId', templateController.updateTemplate);
router.delete('/:templateId', templateController.deleteTemplate);

// Template-specific operations
router.post('/chatbot/:chatbotId', templateController.createTemplateFromChatbot);
router.post('/:templateId/chatbot', templateController.createChatbotFromTemplate);
router.post('/:templateId/review', templateController.addReview);
router.get('/:templateId/export', templateController.exportTemplate);
router.post('/import', templateController.importTemplate);

// User templates
router.get('/user/:userId?', templateController.getUserTemplates);

module.exports = router;
