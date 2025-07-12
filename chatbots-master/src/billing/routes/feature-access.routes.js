/**
 * Feature Access Routes
 * 
 * API routes for checking feature access based on subscription
 */

const express = require('express');
const router = express.Router();
const featureAccessController = require('../controllers/feature-access.controller');
const authMiddleware = require('../../auth/middleware/auth.middleware');

/**
 * @route GET /billing/feature-access/:featureKey
 * @desc Check if the current tenant has access to a specific feature
 * @access Private
 */
router.get('/:featureKey', authMiddleware.authenticate, featureAccessController.checkFeatureAccess);

/**
 * @route GET /billing/feature-access
 * @desc Get all features available to the current tenant
 * @access Private
 */
router.get('/', authMiddleware.authenticate, featureAccessController.getAllFeatures);

module.exports = router;
