/**
 * Billing API Routes
 * 
 * Defines all routes related to billing, subscriptions, and payments
 */

const express = require('express');
const router = express.Router();

// Import controllers
const subscriptionController = require('../billing/controllers/subscription.controller');
const paymentController = require('../billing/controllers/payment.controller');
const webhookController = require('../billing/controllers/webhook.controller');
const planController = require('../billing/controllers/plan.controller');
const analyticsController = require('../billing/controllers/analytics.controller');
const couponController = require('../billing/controllers/coupon.controller');
const currencyController = require('../billing/controllers/currency.controller');
const trialController = require('../billing/controllers/trial.controller');

// Subscription routes
router.use('/subscriptions', subscriptionController);

// Payment routes
router.use('/payments', paymentController);

// Webhook routes (for Stripe events)
router.use('/webhooks', webhookController);

// Plan routes
router.use('/plans', planController);

// Analytics routes
router.use('/analytics', analyticsController);

// Coupon routes
router.get('/coupons', couponController.listCoupons);
router.post('/coupons', couponController.createCoupon);
router.get('/coupons/:code', couponController.getCouponByCode);
router.post('/coupons/validate', couponController.validateCoupon);
router.put('/coupons/:id', couponController.updateCoupon);
router.delete('/coupons/:id', couponController.deleteCoupon);
router.post('/subscriptions/:subscriptionId/apply-coupon', couponController.applyCoupon);
router.delete('/subscriptions/:subscriptionId/coupon', couponController.removeCoupon);

// Currency routes
router.get('/currencies', currencyController.getSupportedCurrencies);
router.get('/currencies/rates', currencyController.getExchangeRates);
router.post('/currencies/convert', currencyController.convertCurrency);
router.post('/currencies/format', currencyController.formatCurrency);
router.post('/currencies/update-rates', currencyController.updateExchangeRates);

// Trial routes
router.post('/trials', trialController.createTrial);
router.get('/trials/:tenantId', trialController.getTrialByTenant);
router.post('/trials/:trialId/convert', trialController.convertTrialToSubscription);
router.get('/trials/check-eligibility/:tenantId', trialController.checkTrialEligibility);

module.exports = router;
