/**
 * Payment Methods Controller
 * 
 * Handles API endpoints for payment methods management
 */

const PaymentService = require('../services/payment.service');
const logger = require('../../utils/logger');

// Initialize payment service
const paymentService = new PaymentService();

/**
 * Create a setup intent for adding a new payment method
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createSetupIntent = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Create setup intent
    const setupIntent = await paymentService.createSetupIntent(userId);
    
    res.status(200).json({
      success: true,
      clientSecret: setupIntent.client_secret
    });
  } catch (error) {
    logger.error('Error creating setup intent', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to create setup intent',
      error: error.message
    });
  }
};

/**
 * Get all payment methods for the current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getPaymentMethods = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get payment methods
    const paymentMethods = await paymentService.getPaymentMethods(userId);
    
    res.status(200).json({
      success: true,
      paymentMethods
    });
  } catch (error) {
    logger.error('Error fetching payment methods', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment methods',
      error: error.message
    });
  }
};

/**
 * Save a new payment method
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.savePaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const tenantId = req.user.tenantId;
    const { paymentMethodId, isDefault } = req.body;
    
    if (!paymentMethodId) {
      return res.status(400).json({
        success: false,
        message: 'Payment method ID is required'
      });
    }
    
    // Save payment method
    const paymentMethod = await paymentService.savePaymentMethod({
      userId,
      tenantId,
      paymentMethodId,
      isDefault: isDefault || false
    });
    
    res.status(201).json({
      success: true,
      paymentMethod
    });
  } catch (error) {
    logger.error('Error saving payment method', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to save payment method',
      error: error.message
    });
  }
};

/**
 * Delete a payment method
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deletePaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const paymentMethodId = req.params.id;
    
    if (!paymentMethodId) {
      return res.status(400).json({
        success: false,
        message: 'Payment method ID is required'
      });
    }
    
    // Delete payment method
    const result = await paymentService.deletePaymentMethod(userId, paymentMethodId);
    
    res.status(200).json({
      success: true,
      deleted: result
    });
  } catch (error) {
    logger.error('Error deleting payment method', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to delete payment method',
      error: error.message
    });
  }
};

/**
 * Set a payment method as default
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.setDefaultPaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const paymentMethodId = req.params.id;
    
    if (!paymentMethodId) {
      return res.status(400).json({
        success: false,
        message: 'Payment method ID is required'
      });
    }
    
    // Set as default
    const paymentMethod = await paymentService.setDefaultPaymentMethod(userId, paymentMethodId);
    
    res.status(200).json({
      success: true,
      paymentMethod
    });
  } catch (error) {
    logger.error('Error setting default payment method', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to set default payment method',
      error: error.message
    });
  }
};
