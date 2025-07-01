/**
 * Trial Controller
 * 
 * API endpoints for managing free trials
 */

const trialService = require('../services/trial.service');
const { asyncPaymentHandler } = require('../../middleware/payment-error.middleware');
const logger = require('../../utils/logger');

/**
 * Create a new free trial
 * @route POST /api/billing/trial
 */
const createTrial = asyncPaymentHandler(async (req, res) => {
  const { planId, companyInfo, usageInfo } = req.body;
  const tenantId = req.tenantId;
  
  // Check if tenant is eligible for a trial
  const isEligible = await trialService.isEligibleForTrial(tenantId);
  
  if (!isEligible) {
    return res.status(400).json({
      success: false,
      error: 'This account is not eligible for a free trial.'
    });
  }
  
  // Create the trial
  const trial = await trialService.createTrial(tenantId, planId, {
    companyInfo,
    usageInfo
  });
  
  if (!trial.success && trial.error) {
    // Error response is already formatted by the error handler
    return res.status(400).json(trial);
  }
  
  // Log the trial creation
  logger.info(`Trial created for tenant ${tenantId}`, {
    tenantId,
    planId,
    trialId: trial._id
  });
  
  return res.status(201).json({
    success: true,
    trial: {
      id: trial._id,
      status: trial.status,
      trialStart: trial.trialStart,
      trialEnd: trial.trialEnd,
      planId: trial.planId
    }
  });
});

/**
 * Check trial eligibility
 * @route GET /api/billing/trial/eligibility
 */
const checkEligibility = asyncPaymentHandler(async (req, res) => {
  const tenantId = req.tenantId;
  
  const isEligible = await trialService.isEligibleForTrial(tenantId);
  
  return res.json({
    success: true,
    eligible: isEligible
  });
});

/**
 * Get trial status
 * @route GET /api/billing/trial/status
 */
const getTrialStatus = asyncPaymentHandler(async (req, res) => {
  const tenantId = req.tenantId;
  
  // Get remaining trial days
  const remainingDays = await trialService.getRemainingTrialDays(tenantId);
  
  // Find active trial subscription
  const Subscription = require('../models/subscription.model');
  const trialSubscription = await Subscription.findOne({
    tenantId,
    status: 'trialing'
  });
  
  if (!trialSubscription) {
    return res.json({
      success: true,
      active: false,
      remainingDays: 0
    });
  }
  
  // Get plan details
  const Plan = require('../models/plan.model');
  const plan = await Plan.findById(trialSubscription.planId);
  
  return res.json({
    success: true,
    active: true,
    remainingDays,
    trialStart: trialSubscription.trialStart,
    trialEnd: trialSubscription.trialEnd,
    plan: plan ? {
      id: plan._id,
      name: plan.name,
      price: plan.price
    } : null
  });
});

/**
 * Convert trial to paid subscription
 * @route POST /api/billing/trial/convert
 */
const convertTrial = asyncPaymentHandler(async (req, res) => {
  const { paymentMethodId } = req.body;
  const tenantId = req.tenantId;
  
  if (!paymentMethodId) {
    return res.status(400).json({
      success: false,
      error: 'Payment method is required'
    });
  }
  
  // Convert trial to paid subscription
  const subscription = await trialService.convertTrialToPaid(tenantId, paymentMethodId);
  
  if (!subscription.success && subscription.error) {
    // Error response is already formatted by the error handler
    return res.status(400).json(subscription);
  }
  
  // Log the conversion
  logger.info(`Trial converted to paid subscription for tenant ${tenantId}`, {
    tenantId,
    subscriptionId: subscription._id,
    stripeSubscriptionId: subscription.stripeSubscriptionId
  });
  
  return res.json({
    success: true,
    subscription: {
      id: subscription._id,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      planId: subscription.planId
    }
  });
});

module.exports = {
  createTrial,
  checkEligibility,
  getTrialStatus,
  convertTrial
};
