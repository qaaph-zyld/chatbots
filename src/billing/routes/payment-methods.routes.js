/**
 * Payment Methods Routes
 * 
 * API routes for managing payment methods
 */

const express = require('express');
const router = express.Router();
const paymentMethodsController = require('../controllers/payment-methods.controller');
const authMiddleware = require('../../auth/middleware/auth.middleware');

/**
 * @route POST /billing/payment-methods/setup-intent
 * @desc Create a setup intent for adding a new payment method
 * @access Private
 */
router.post('/setup-intent', authMiddleware.authenticate, paymentMethodsController.createSetupIntent);

/**
 * @route GET /billing/payment-methods
 * @desc Get all payment methods for the current user
 * @access Private
 */
router.get('/', authMiddleware.authenticate, paymentMethodsController.getPaymentMethods);

/**
 * @route POST /billing/payment-methods
 * @desc Save a new payment method
 * @access Private
 */
router.post('/', authMiddleware.authenticate, paymentMethodsController.savePaymentMethod);

/**
 * @route DELETE /billing/payment-methods/:id
 * @desc Delete a payment method
 * @access Private
 */
router.delete('/:id', authMiddleware.authenticate, paymentMethodsController.deletePaymentMethod);

/**
 * @route PUT /billing/payment-methods/:id/default
 * @desc Set a payment method as default
 * @access Private
 */
router.put('/:id/default', authMiddleware.authenticate, paymentMethodsController.setDefaultPaymentMethod);

module.exports = router;
