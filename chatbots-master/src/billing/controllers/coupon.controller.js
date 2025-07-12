/**
 * Coupon Controller
 * 
 * API endpoints for managing coupons and promotional codes
 */

const couponService = require('../services/coupon.service');
const logger = require('../../utils/logger');
const { isAdmin } = require('../../middleware/auth.middleware');

/**
 * Create a new coupon
 * @route POST /api/billing/coupons
 * @access Admin only
 */
const createCoupon = async (req, res) => {
  try {
    // Verify admin access
    if (!req.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const couponData = req.body;
    
    // Validate required fields
    if (!couponData.code || !couponData.type || couponData.value === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: code, type, value'
      });
    }
    
    // Create coupon
    const coupon = await couponService.createCoupon(couponData);
    
    return res.status(201).json({
      success: true,
      coupon
    });
  } catch (error) {
    logger.error(`Error creating coupon: ${error.message}`, { error });
    
    // Handle duplicate code error
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to create coupon'
    });
  }
};

/**
 * Get coupon by code
 * @route GET /api/billing/coupons/:code
 * @access Admin only
 */
const getCouponByCode = async (req, res) => {
  try {
    // Verify admin access
    if (!req.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const { code } = req.params;
    
    // Get coupon
    const coupon = await couponService.getCouponByCode(code);
    
    return res.status(200).json({
      success: true,
      coupon
    });
  } catch (error) {
    logger.error(`Error getting coupon: ${error.message}`, { error });
    
    // Handle not found error
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to get coupon'
    });
  }
};

/**
 * Validate coupon
 * @route POST /api/billing/coupons/validate
 * @access Authenticated
 */
const validateCoupon = async (req, res) => {
  try {
    const { code, planId } = req.body;
    const { tenantId } = req;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Coupon code is required'
      });
    }
    
    // Validate coupon
    const validationResult = await couponService.validateCoupon(code, tenantId, planId);
    
    return res.status(200).json({
      success: true,
      ...validationResult
    });
  } catch (error) {
    logger.error(`Error validating coupon: ${error.message}`, { error });
    
    return res.status(500).json({
      success: false,
      error: 'Failed to validate coupon'
    });
  }
};

/**
 * Apply coupon to subscription
 * @route POST /api/billing/subscriptions/:subscriptionId/apply-coupon
 * @access Authenticated
 */
const applyCoupon = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { code } = req.body;
    const { tenantId } = req;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Coupon code is required'
      });
    }
    
    // Apply coupon
    const subscription = await couponService.applyCoupon(code, subscriptionId);
    
    return res.status(200).json({
      success: true,
      subscription
    });
  } catch (error) {
    logger.error(`Error applying coupon: ${error.message}`, { error });
    
    // Handle specific errors
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('not valid') || error.message.includes('not applicable')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to apply coupon'
    });
  }
};

/**
 * Remove coupon from subscription
 * @route DELETE /api/billing/subscriptions/:subscriptionId/coupon
 * @access Authenticated
 */
const removeCoupon = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { tenantId } = req;
    
    // Remove coupon
    const subscription = await couponService.removeCoupon(subscriptionId);
    
    return res.status(200).json({
      success: true,
      subscription
    });
  } catch (error) {
    logger.error(`Error removing coupon: ${error.message}`, { error });
    
    // Handle specific errors
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('does not have a coupon')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to remove coupon'
    });
  }
};

/**
 * List coupons
 * @route GET /api/billing/coupons
 * @access Admin only
 */
const listCoupons = async (req, res) => {
  try {
    // Verify admin access
    if (!req.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    // Parse query parameters
    const filters = {
      includeExpired: req.query.includeExpired === 'true',
      includeFullyRedeemed: req.query.includeFullyRedeemed === 'true'
    };
    
    // List coupons
    const coupons = await couponService.listCoupons(filters);
    
    return res.status(200).json({
      success: true,
      coupons
    });
  } catch (error) {
    logger.error(`Error listing coupons: ${error.message}`, { error });
    
    return res.status(500).json({
      success: false,
      error: 'Failed to list coupons'
    });
  }
};

/**
 * Update coupon
 * @route PUT /api/billing/coupons/:id
 * @access Admin only
 */
const updateCoupon = async (req, res) => {
  try {
    // Verify admin access
    if (!req.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const { id } = req.params;
    const updateData = req.body;
    
    // Update coupon
    const coupon = await couponService.updateCoupon(id, updateData);
    
    return res.status(200).json({
      success: true,
      coupon
    });
  } catch (error) {
    logger.error(`Error updating coupon: ${error.message}`, { error });
    
    // Handle specific errors
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to update coupon'
    });
  }
};

/**
 * Delete coupon
 * @route DELETE /api/billing/coupons/:id
 * @access Admin only
 */
const deleteCoupon = async (req, res) => {
  try {
    // Verify admin access
    if (!req.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const { id } = req.params;
    
    // Delete coupon
    await couponService.deleteCoupon(id);
    
    return res.status(200).json({
      success: true,
      message: 'Coupon deleted successfully'
    });
  } catch (error) {
    logger.error(`Error deleting coupon: ${error.message}`, { error });
    
    // Handle specific errors
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('in use')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to delete coupon'
    });
  }
};

module.exports = {
  createCoupon,
  getCouponByCode,
  validateCoupon,
  applyCoupon,
  removeCoupon,
  listCoupons,
  updateCoupon,
  deleteCoupon
};
