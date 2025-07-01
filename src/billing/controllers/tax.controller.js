/**
 * Tax Controller
 * 
 * Handles tax-related API endpoints
 */

const express = require('express');
const router = express.Router();
const taxService = require('../services/tax.service');
const authMiddleware = require('../../middleware/auth');
const logger = require('../../utils/logger');
const Tenant = require('../../tenancy/models/tenant.model');

/**
 * @route GET /api/billing/tax/calculation/:subscriptionId
 * @desc Calculate tax for a subscription
 * @access Private
 */
router.get('/calculation/:subscriptionId', authMiddleware, async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    
    // Calculate tax
    const taxCalculation = await taxService.calculateTax(subscriptionId);
    
    res.json(taxCalculation);
  } catch (error) {
    logger.error(`Error calculating tax: ${error.message}`, { error });
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/billing/tax/apply/:subscriptionId
 * @desc Apply tax to a subscription
 * @access Private
 */
router.post('/apply/:subscriptionId', authMiddleware, async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    
    // Apply tax
    const subscription = await taxService.applyTax(subscriptionId);
    
    res.json(subscription);
  } catch (error) {
    logger.error(`Error applying tax: ${error.message}`, { error });
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route PUT /api/billing/tax/details
 * @desc Update tenant tax details
 * @access Private
 */
router.put('/details', authMiddleware, async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { taxId, exempt, exemptionCertificate } = req.body;
    
    // Get tenant
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    // Validate tax ID if provided
    if (taxId) {
      const country = tenant.organizationDetails?.address?.country || 'US';
      const isValid = await taxService.validateTaxId(taxId, country);
      if (!isValid) {
        return res.status(400).json({ error: 'Invalid tax ID format' });
      }
    }
    
    // Update tax details
    tenant.taxDetails = {
      ...tenant.taxDetails,
      taxId: taxId || tenant.taxDetails?.taxId,
      exempt: exempt !== undefined ? exempt : tenant.taxDetails?.exempt || false,
      exemptionCertificate: exemptionCertificate || tenant.taxDetails?.exemptionCertificate
    };
    
    // Save tenant
    await tenant.save();
    
    res.json({
      taxDetails: tenant.taxDetails
    });
  } catch (error) {
    logger.error(`Error updating tax details: ${error.message}`, { error });
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/billing/tax/details
 * @desc Get tenant tax details
 * @access Private
 */
router.get('/details', authMiddleware, async (req, res) => {
  try {
    const { tenantId } = req.user;
    
    // Get tenant
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    res.json({
      taxDetails: tenant.taxDetails || {}
    });
  } catch (error) {
    logger.error(`Error getting tax details: ${error.message}`, { error });
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/billing/tax/validate
 * @desc Validate a tax ID
 * @access Private
 */
router.post('/validate', authMiddleware, async (req, res) => {
  try {
    const { taxId, country } = req.body;
    
    if (!taxId) {
      return res.status(400).json({ error: 'Tax ID is required' });
    }
    
    // Validate tax ID
    const isValid = await taxService.validateTaxId(taxId, country || 'US');
    
    res.json({
      taxId,
      country,
      isValid
    });
  } catch (error) {
    logger.error(`Error validating tax ID: ${error.message}`, { error });
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
