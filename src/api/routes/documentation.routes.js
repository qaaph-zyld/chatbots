/**
 * Documentation Routes
 * 
 * API routes for documentation management
 */

const express = require('express');
const router = express.Router();
const documentationController = require('../controllers/documentation.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Get all documentation categories
router.get('/categories', documentationController.getCategories);

// Get documentation items by category
router.get('/category/:category', documentationController.getDocumentationByCategory);

// Get documentation item by ID
router.get('/item/:id', documentationController.getDocumentationItem);

// Create or update documentation item (requires authentication and admin role)
router.post('/item', authenticate, authorize(['admin']), documentationController.saveDocumentationItem);

// Delete documentation item (requires authentication and admin role)
router.delete('/item/:id', authenticate, authorize(['admin']), documentationController.deleteDocumentationItem);

// Search documentation
router.get('/search', documentationController.searchDocumentation);

// Export documentation to static HTML (requires authentication and admin role)
router.post('/export', authenticate, authorize(['admin']), documentationController.exportDocumentation);

// Generate table of contents for content
router.post('/toc', documentationController.generateTableOfContents);

module.exports = router;
