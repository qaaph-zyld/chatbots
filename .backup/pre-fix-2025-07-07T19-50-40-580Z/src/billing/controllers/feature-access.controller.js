/**
 * Feature Access Controller
 * 
 * Handles API endpoints for feature access management
 * Provides endpoints for checking feature access and limits
 */

const express = require('express');
const router = express.Router();
const featureAccessService = require('../services/feature-access.service');
const authMiddleware = require('../../middleware/auth');
const adminMiddleware = require('../../middleware/admin');
const logger = require('../../utils/logger');

/**
 * @route GET /api/billing/features/access/:featureKey
 * @desc Check if tenant has access to a specific feature
 * @access Private
 */
router.get('/access/:featureKey', authMiddleware, async (req, res) => {
  try {
    const { featureKey } = req.params;
    const tenantId = req.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }
    
    const hasAccess = await featureAccessService.hasFeatureAccess(tenantId, featureKey);
    
    res.json({ 
      feature: featureKey,
      hasAccess 
    });
  } catch (error) {
    logger.error(`Error checking feature access: ${error.message}`, { error });
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/billing/features/limits/:featureKey
 * @desc Get limits for a specific feature
 * @access Private
 */
router.get('/limits/:featureKey', authMiddleware, async (req, res) => {
  try {
    const { featureKey } = req.params;
    const tenantId = req.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }
    
    const limits = await featureAccessService.getFeatureLimits(tenantId, featureKey);
    
    res.json({ 
      feature: featureKey,
      limits 
    });
  } catch (error) {
    logger.error(`Error getting feature limits: ${error.message}`, { error });
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/billing/features/all
 * @desc Get all features available to the tenant
 * @access Private
 */
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }
    
    const features = await featureAccessService.getTenantFeatures(tenantId);
    
    res.json({ features });
  } catch (error) {
    logger.error(`Error getting tenant features: ${error.message}`, { error });
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/billing/features/invalidate-cache/:tenantId
 * @desc Invalidate feature access cache for a tenant
 * @access Admin
 */
router.post('/invalidate-cache/:tenantId', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    await featureAccessService.invalidateCache(tenantId);
    
    res.json({ 
      success: true,
      message: `Cache invalidated for tenant ${tenantId}`
    });
  } catch (error) {
    logger.error(`Error invalidating feature access cache: ${error.message}`, { error });
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/billing/features/check-multiple
 * @desc Check access to multiple features at once
 * @access Private
 */
router.post('/check-multiple', authMiddleware, async (req, res) => {
  try {
    const { features } = req.body;
    const tenantId = req.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }
    
    if (!features || !Array.isArray(features) || features.length === 0) {
      return res.status(400).json({ error: 'Features array is required' });
    }
    
    const results = {};
    
    // Check access for each feature
    for (const featureKey of features) {
      results[featureKey] = await featureAccessService.hasFeatureAccess(tenantId, featureKey);
    }
    
    res.json({ results });
  } catch (error) {
    logger.error(`Error checking multiple features: ${error.message}`, { error });
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
