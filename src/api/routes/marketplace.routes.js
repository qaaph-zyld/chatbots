/**
 * Marketplace Routes
 * 
 * API routes for the component marketplace
 */

const express = require('express');
const router = express.Router();
const marketplaceController = require('../controllers/marketplace.controller');
const { authenticateUser } = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authenticateUser);

// Get all marketplace components
router.get('/', marketplaceController.getComponents);

// Get a marketplace component by ID
router.get('/:id', marketplaceController.getComponent);

// Install a component from the marketplace
router.post('/:id/install', marketplaceController.installComponent);

// Publish a component to the marketplace
router.post('/publish/:componentName', marketplaceController.publishComponent);

// Rate a marketplace component
router.post('/:id/rate', marketplaceController.rateComponent);

// Get ratings for a marketplace component
router.get('/:id/ratings', marketplaceController.getComponentRatings);

module.exports = router;
