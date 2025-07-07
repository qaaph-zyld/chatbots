/**
 * Pricing Controller
 * 
 * Handles HTTP requests related to pricing plans and tiers
 */

const express = require('express');
const router = express.Router();
const pricingService = require('../services/pricing.service');
const { authenticate, authorize } = require('../../middleware/auth');
const { logger } = require('../../utils/logger');

/**
 * @swagger
 * /api/pricing/public:
 *   get:
 *     summary: Get public pricing information
 *     description: Retrieves public pricing information for display on pricing page
 *     tags: [Pricing]
 *     responses:
 *       200:
 *         description: Public pricing information
 *       500:
 *         description: Server error
 */
router.get('/public', async (req, res) => {
  try {
    const pricingInfo = await pricingService.getPublicPricingInfo();
    
    res.json({
      success: true,
      data: pricingInfo
    });
  } catch (error) {
    logger.error(`Error getting public pricing info: ${error.message}`);
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve pricing information'
    });
  }
});

/**
 * @swagger
 * /api/pricing/calculate:
 *   get:
 *     summary: Calculate price for a subscription
 *     description: Calculates the price for a subscription based on tier and billing cycle
 *     tags: [Pricing]
 *     parameters:
 *       - in: query
 *         name: tierName
 *         schema:
 *           type: string
 *         required: true
 *         description: Name of the pricing tier
 *       - in: query
 *         name: billingCycle
 *         schema:
 *           type: string
 *           enum: [monthly, annual]
 *         description: Billing cycle (monthly/annual)
 *     responses:
 *       200:
 *         description: Price calculation
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.get('/calculate', async (req, res) => {
  try {
    const { tierName, billingCycle = 'monthly' } = req.query;
    
    if (!tierName) {
      return res.status(400).json({
        success: false,
        error: 'Tier name is required'
      });
    }
    
    const priceInfo = await pricingService.calculatePrice(tierName, billingCycle);
    
    res.json({
      success: true,
      data: priceInfo
    });
  } catch (error) {
    logger.error(`Error calculating price: ${error.message}`);
    
    res.status(500).json({
      success: false,
      error: 'Failed to calculate price'
    });
  }
});

/**
 * @swagger
 * /api/pricing/plans:
 *   get:
 *     summary: Get all pricing plans
 *     description: Retrieves all pricing plans (admin only)
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of pricing plans
 *       403:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/plans', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const active = req.query.active === 'true' ? true : 
                  req.query.active === 'false' ? false : undefined;
    
    const plans = await pricingService.getAllPricingPlans({ active });
    
    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    logger.error(`Error getting pricing plans: ${error.message}`);
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve pricing plans'
    });
  }
});

/**
 * @swagger
 * /api/pricing/plans/{planId}:
 *   get:
 *     summary: Get pricing plan by ID
 *     description: Retrieves a specific pricing plan (admin only)
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         schema:
 *           type: string
 *         required: true
 *         description: Pricing plan ID
 *     responses:
 *       200:
 *         description: Pricing plan
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Plan not found
 *       500:
 *         description: Server error
 */
router.get('/plans/:planId', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const plan = await pricingService.getPricingPlan(req.params.planId);
    
    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    logger.error(`Error getting pricing plan: ${error.message}`);
    
    if (error.message === 'Pricing plan not found') {
      return res.status(404).json({
        success: false,
        error: 'Pricing plan not found'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve pricing plan'
    });
  }
});

/**
 * @swagger
 * /api/pricing/plans:
 *   post:
 *     summary: Create pricing plan
 *     description: Creates a new pricing plan (admin only)
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               active:
 *                 type: boolean
 *               effectiveFrom:
 *                 type: string
 *                 format: date-time
 *               effectiveTo:
 *                 type: string
 *                 format: date-time
 *               tiers:
 *                 type: array
 *     responses:
 *       201:
 *         description: Created pricing plan
 *       400:
 *         description: Bad request
 *       403:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/plans', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const planData = req.body;
    
    // Add creator
    planData.createdBy = req.user.id;
    
    const plan = await pricingService.createPricingPlan(planData);
    
    res.status(201).json({
      success: true,
      data: plan
    });
  } catch (error) {
    logger.error(`Error creating pricing plan: ${error.message}`);
    
    if (error.message.includes('already exists')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create pricing plan'
    });
  }
});

/**
 * @swagger
 * /api/pricing/plans/{planId}:
 *   put:
 *     summary: Update pricing plan
 *     description: Updates a pricing plan (admin only)
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         schema:
 *           type: string
 *         required: true
 *         description: Pricing plan ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Updated pricing plan
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Plan not found
 *       500:
 *         description: Server error
 */
router.put('/plans/:planId', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const plan = await pricingService.updatePricingPlan(req.params.planId, req.body);
    
    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    logger.error(`Error updating pricing plan: ${error.message}`);
    
    if (error.message === 'Pricing plan not found') {
      return res.status(404).json({
        success: false,
        error: 'Pricing plan not found'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update pricing plan'
    });
  }
});

/**
 * @swagger
 * /api/pricing/plans/{planId}/tiers:
 *   post:
 *     summary: Add tier to pricing plan
 *     description: Adds a new tier to a pricing plan (admin only)
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         schema:
 *           type: string
 *         required: true
 *         description: Pricing plan ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Updated pricing plan with new tier
 *       400:
 *         description: Bad request
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Plan not found
 *       500:
 *         description: Server error
 */
router.post('/plans/:planId/tiers', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const plan = await pricingService.addTierToPlan(req.params.planId, req.body);
    
    res.status(201).json({
      success: true,
      data: plan
    });
  } catch (error) {
    logger.error(`Error adding tier to pricing plan: ${error.message}`);
    
    if (error.message === 'Pricing plan not found') {
      return res.status(404).json({
        success: false,
        error: 'Pricing plan not found'
      });
    }
    
    if (error.message.includes('already exists')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to add tier to pricing plan'
    });
  }
});

/**
 * @swagger
 * /api/pricing/plans/{planId}/tiers/{tierId}:
 *   put:
 *     summary: Update tier in pricing plan
 *     description: Updates a tier in a pricing plan (admin only)
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         schema:
 *           type: string
 *         required: true
 *         description: Pricing plan ID
 *       - in: path
 *         name: tierId
 *         schema:
 *           type: string
 *         required: true
 *         description: Tier ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Updated pricing plan
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Plan or tier not found
 *       500:
 *         description: Server error
 */
router.put('/plans/:planId/tiers/:tierId', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const plan = await pricingService.updateTier(req.params.planId, req.params.tierId, req.body);
    
    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    logger.error(`Error updating tier in pricing plan: ${error.message}`);
    
    if (error.message === 'Pricing plan not found' || error.message === 'Tier not found in pricing plan') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update tier in pricing plan'
    });
  }
});

/**
 * @swagger
 * /api/pricing/plans/{planId}/tiers/{tierId}:
 *   delete:
 *     summary: Remove tier from pricing plan
 *     description: Removes a tier from a pricing plan (admin only)
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         schema:
 *           type: string
 *         required: true
 *         description: Pricing plan ID
 *       - in: path
 *         name: tierId
 *         schema:
 *           type: string
 *         required: true
 *         description: Tier ID
 *     responses:
 *       200:
 *         description: Updated pricing plan
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Plan or tier not found
 *       500:
 *         description: Server error
 */
router.delete('/plans/:planId/tiers/:tierId', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const plan = await pricingService.removeTierFromPlan(req.params.planId, req.params.tierId);
    
    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    logger.error(`Error removing tier from pricing plan: ${error.message}`);
    
    if (error.message === 'Pricing plan not found' || error.message === 'Tier not found in pricing plan') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('Cannot remove tier')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to remove tier from pricing plan'
    });
  }
});

/**
 * @swagger
 * /api/pricing/usage:
 *   post:
 *     summary: Calculate usage charges
 *     description: Calculates charges based on usage (admin only)
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tenantId:
 *                 type: string
 *               usage:
 *                 type: object
 *     responses:
 *       200:
 *         description: Usage charges
 *       400:
 *         description: Bad request
 *       403:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/usage', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { tenantId, usage } = req.body;
    
    if (!tenantId || !usage) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID and usage data are required'
      });
    }
    
    const charges = await pricingService.calculateUsageCharges(tenantId, usage);
    
    res.json({
      success: true,
      data: charges
    });
  } catch (error) {
    logger.error(`Error calculating usage charges: ${error.message}`);
    
    if (error.message.includes('No active subscription found')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to calculate usage charges'
    });
  }
});

/**
 * @swagger
 * /api/pricing/initialize:
 *   post:
 *     summary: Initialize default pricing plan
 *     description: Creates default pricing plan if none exists (admin only)
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Default pricing plan
 *       403:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/initialize', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const plan = await pricingService.initializeDefaultPricingPlan();
    
    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    logger.error(`Error initializing default pricing plan: ${error.message}`);
    
    res.status(500).json({
      success: false,
      error: 'Failed to initialize default pricing plan'
    });
  }
});

module.exports = router;
