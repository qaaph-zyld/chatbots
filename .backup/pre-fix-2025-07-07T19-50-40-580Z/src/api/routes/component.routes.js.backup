/**
 * Component Routes
 * 
 * API routes for managing custom components
 */

const express = require('express');
const router = express.Router();
require('@src/api\controllers\component.controller');
require('@src/api\middleware\auth.middleware');

// Apply authentication middleware to all routes
router.use(authenticateUser);

// Get all components
router.get('/', componentController.getAllComponents);

// Get components by type
router.get('/type/:type', componentController.getComponentsByType);

// Get a component by name and version
router.get('/:name/:version?', componentController.getComponent);

// Create a new component
router.post('/', componentController.createComponent);

// Delete a component
router.delete('/:name/:version', componentController.deleteComponent);

// Get all component types
router.get('/types', componentController.getComponentTypes);

// Add a new component type
router.post('/types', componentController.addComponentType);

module.exports = router;
