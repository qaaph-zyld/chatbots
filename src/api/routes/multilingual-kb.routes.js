/**
 * Multilingual Knowledge Base Routes
 * 
 * API routes for managing multilingual knowledge bases
 */

const express = require('express');
const router = express.Router();
const multilingualKbController = require('../controllers/multilingual-kb.controller');
const { authMiddleware } = require('../../middleware');

// Get knowledge base in a specific language
router.get('/:kbId', authMiddleware, multilingualKbController.getKnowledgeBase);

// Save knowledge base in a specific language
router.put('/:kbId/:langCode', authMiddleware, multilingualKbController.saveKnowledgeBase);

// Get available languages for a knowledge base
router.get('/:kbId/languages', authMiddleware, multilingualKbController.getAvailableLanguages);

// Delete a language-specific knowledge base
router.delete('/:kbId/:langCode', authMiddleware, multilingualKbController.deleteLanguageKnowledgeBase);

// Translate a knowledge base to multiple languages
router.post('/:kbId/translate', authMiddleware, multilingualKbController.translateKnowledgeBase);

// Search across multilingual knowledge bases
router.post('/search', authMiddleware, multilingualKbController.searchMultilingualKnowledgeBases);

module.exports = router;
