/**
 * Coupon Service
 * 
 * Service for managing coupons and promotional codes
 */

const Coupon = require('../models/coupon.model');
const Subscription = require('../models/subscription.model');
const stripe = require('../config/stripe');
const logger = require('../../utils/logger');

/**
 * Service for managing coupons and promotions
 */
class CouponService {
  /**
   * Create a new coupon
   * @param {Object} couponData - Coupon data
   * @returns {Promise<Object>} Created coupon
   */
  async createCoupon(couponData) {
    try {
      // Check if coupon code already exists
      const existingCoupon = await Coupon.findOne({ code: couponData.code.toUpperCase() });
      if (existingCoupon) {
        throw new Error(`Coupon code ${couponData.code} already exists`);
      }
      
      // Create coupon in Stripe if integration is enabled
      let stripeCouponId = null;
      if (process.env.STRIPE_INTEGRATION_ENABLED === 'true') {
        const stripeData = this._mapToStripeCoupon(couponData);
        const stripeCoupon = await stripe.coupons.create(stripeData);
        stripeCouponId = stripeCoupon.id;
      }
      
      // Create coupon in database
      const coupon = await Coupon.create({
        ...couponData,
        code: couponData.code.toUpperCase(),
        stripeCouponId
      });
      
      logger.info(`Created coupon: ${coupon.code}`, { couponId: coupon._id });
      
      return coupon;
    } catch (error) {
      logger.error(`Error creating coupon: ${error.message}`, { error, couponData });
      throw error;
    }
  }
  
  /**
   * Get coupon by code
   * @param {string} code - Coupon code
   * @returns {Promise<Object>} Coupon
   */
  async getCouponByCode(code) {
    try {
      const coupon = await Coupon.findOne({ code: code.toUpperCase() });
      
      if (!coupon) {
        throw new Error(`Coupon not found: ${code}`);
      }
      
      return coupon;
    } catch (error) {
      logger.error(`Error getting coupon: ${error.message}`, { error, code });
      throw error;
    }
  }
  
  /**
   * Validate coupon for a tenant and plan
   * @param {string} code - Coupon code
   * @param {string} tenantId - Tenant ID
   * @param {string} planId - Plan ID
   * @returns {Promise<Object>} Validation result
   */
  async validateCoupon(code, tenantId, planId) {
    try {
      // Find coupon
      const coupon = await Coupon.findOne({ code: code.toUpperCase() });
      
      if (!coupon) {
        return {
          valid: false,
          message: 'Invalid coupon code'
        };
      }
      
      // Check if coupon is valid
      if (!coupon.isValid()) {
        return {
          valid: false,
          message: coupon.expiresAt && new Date() > coupon.expiresAt
            ? 'Coupon has expired'
            : coupon.maxRedemptions !== null && coupon.redemptionCount >= coupon.maxRedemptions
              ? 'Coupon has reached maximum redemptions'
              : 'Coupon is not active'
        };
      }
      
      // Check if coupon is applicable to the plan
      if (planId && !coupon.isApplicableToPlan(planId)) {
        return {
          valid: false,
          message: 'Coupon is not applicable to the selected plan'
        };
      }
      
      // Check if first-time customer only
      if (coupon.firstTimeOnly && tenantId) {
        const existingSubscriptions = await Subscription.find({ tenantId });
        if (existingSubscriptions.length > 0) {
          return {
            valid: false,
            message: 'Coupon is for first-time customers only'
          };
        }
      }
      
      // Coupon is valid
      return {
        valid: true,
        coupon: {
          id: coupon._id,
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          duration: coupon.duration,
          durationInMonths: coupon.durationInMonths,
          description: coupon.description
        }
      };
    } catch (error) {
      logger.error(`Error validating coupon: ${error.message}`, { error, code, tenantId, planId });
      throw error;
    }
  }
  
  /**
   * Apply coupon to a subscription
   * @param {string} code - Coupon code
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<Object>} Updated subscription
   */
  async applyCoupon(code, subscriptionId) {
    try {
      // Find coupon
      const coupon = await Coupon.findOne({ code: code.toUpperCase() });
      
      if (!coupon) {
        throw new Error(`Coupon not found: ${code}`);
      }
      
      // Check if coupon is valid
      if (!coupon.isValid()) {
        throw new Error('Coupon is not valid');
      }
      
      // Find subscription
      const subscription = await Subscription.findById(subscriptionId);
      
      if (!subscription) {
        throw new Error(`Subscription not found: ${subscriptionId}`);
      }
      
      // Check if coupon is applicable to the plan
      if (!coupon.isApplicableToPlan(subscription.planId)) {
        throw new Error('Coupon is not applicable to the subscription plan');
      }
      
      // Apply coupon in Stripe if integration is enabled
      if (process.env.STRIPE_INTEGRATION_ENABLED === 'true' && subscription.stripeSubscriptionId) {
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          coupon: coupon.stripeCouponId
        });
      }
      
      // Update subscription with coupon
      const updatedSubscription = await Subscription.findByIdAndUpdate(
        subscriptionId,
        {
          couponId: coupon._id,
          couponCode: coupon.code,
          couponData: {
            type: coupon.type,
            value: coupon.value,
            duration: coupon.duration,
            durationInMonths: coupon.durationInMonths,
            appliedAt: new Date()
          }
        },
        { new: true }
      );
      
      // Increment coupon redemption count
      await coupon.redeem();
      
      logger.info(`Applied coupon ${coupon.code} to subscription ${subscriptionId}`, {
        couponId: coupon._id,
        subscriptionId
      });
      
      return updatedSubscription;
    } catch (error) {
      logger.error(`Error applying coupon: ${error.message}`, { error, code, subscriptionId });
      throw error;
    }
  }
  
  /**
   * Remove coupon from a subscription
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<Object>} Updated subscription
   */
  async removeCoupon(subscriptionId) {
    try {
      // Find subscription
      const subscription = await Subscription.findById(subscriptionId);
      
      if (!subscription) {
        throw new Error(`Subscription not found: ${subscriptionId}`);
      }
      
      // Check if subscription has a coupon
      if (!subscription.couponId) {
        throw new Error('Subscription does not have a coupon applied');
      }
      
      // Remove coupon in Stripe if integration is enabled
      if (process.env.STRIPE_INTEGRATION_ENABLED === 'true' && subscription.stripeSubscriptionId) {
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          coupon: null
        });
      }
      
      // Update subscription to remove coupon
      const updatedSubscription = await Subscription.findByIdAndUpdate(
        subscriptionId,
        {
          $unset: {
            couponId: "",
            couponCode: "",
            couponData: ""
          }
        },
        { new: true }
      );
      
      logger.info(`Removed coupon from subscription ${subscriptionId}`, { subscriptionId });
      
      return updatedSubscription;
    } catch (error) {
      logger.error(`Error removing coupon: ${error.message}`, { error, subscriptionId });
      throw error;
    }
  }
  
  /**
   * List active coupons
   * @param {Object} filters - Filters for listing coupons
   * @returns {Promise<Array>} List of coupons
   */
  async listCoupons(filters = {}) {
    try {
      const query = { active: true, ...filters };
      
      // Don't show expired coupons
      if (!filters.includeExpired) {
        query.expiresAt = { $gt: new Date() };
      }
      
      // Don't show fully redeemed coupons
      if (!filters.includeFullyRedeemed) {
        query.$or = [
          { maxRedemptions: null },
          { $expr: { $lt: ["$redemptionCount", "$maxRedemptions"] } }
        ];
      }
      
      const coupons = await Coupon.find(query).sort({ createdAt: -1 });
      
      return coupons;
    } catch (error) {
      logger.error(`Error listing coupons: ${error.message}`, { error, filters });
      throw error;
    }
  }
  
  /**
   * Update coupon
   * @param {string} couponId - Coupon ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated coupon
   */
  async updateCoupon(couponId, updateData) {
    try {
      // Find coupon
      const coupon = await Coupon.findById(couponId);
      
      if (!coupon) {
        throw new Error(`Coupon not found: ${couponId}`);
      }
      
      // Don't allow updating code if already in use
      if (updateData.code && updateData.code !== coupon.code) {
        const existingCoupon = await Coupon.findOne({ code: updateData.code.toUpperCase() });
        if (existingCoupon) {
          throw new Error(`Coupon code ${updateData.code} already exists`);
        }
      }
      
      // Update coupon in Stripe if integration is enabled
      if (process.env.STRIPE_INTEGRATION_ENABLED === 'true' && coupon.stripeCouponId) {
        // Note: Stripe has limited update capabilities for coupons
        // We can only update metadata and active status
        await stripe.coupons.update(coupon.stripeCouponId, {
          metadata: updateData.metadata || coupon.metadata,
          active: updateData.active !== undefined ? updateData.active : coupon.active
        });
      }
      
      // Update coupon in database
      const updatedCoupon = await Coupon.findByIdAndUpdate(
        couponId,
        {
          ...updateData,
          code: updateData.code ? updateData.code.toUpperCase() : coupon.code
        },
        { new: true }
      );
      
      logger.info(`Updated coupon: ${updatedCoupon.code}`, { couponId });
      
      return updatedCoupon;
    } catch (error) {
      logger.error(`Error updating coupon: ${error.message}`, { error, couponId, updateData });
      throw error;
    }
  }
  
  /**
   * Delete coupon
   * @param {string} couponId - Coupon ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteCoupon(couponId) {
    try {
      // Find coupon
      const coupon = await Coupon.findById(couponId);
      
      if (!coupon) {
        throw new Error(`Coupon not found: ${couponId}`);
      }
      
      // Check if coupon is in use
      const subscriptionsWithCoupon = await Subscription.countDocuments({ couponId });
      
      if (subscriptionsWithCoupon > 0) {
        throw new Error(`Cannot delete coupon: it is currently in use by ${subscriptionsWithCoupon} subscriptions`);
      }
      
      // Delete coupon in Stripe if integration is enabled
      if (process.env.STRIPE_INTEGRATION_ENABLED === 'true' && coupon.stripeCouponId) {
        await stripe.coupons.del(coupon.stripeCouponId);
      }
      
      // Delete coupon from database
      await Coupon.findByIdAndDelete(couponId);
      
      logger.info(`Deleted coupon: ${coupon.code}`, { couponId });
      
      return true;
    } catch (error) {
      logger.error(`Error deleting coupon: ${error.message}`, { error, couponId });
      throw error;
    }
  }
  
  /**
   * Map coupon data to Stripe coupon format
   * @param {Object} couponData - Coupon data
   * @returns {Object} Stripe coupon data
   * @private
   */
  _mapToStripeCoupon(couponData) {
    const stripeData = {
      id: `COUPON_${couponData.code.toUpperCase()}`,
      name: couponData.description || `Coupon ${couponData.code}`,
      metadata: {
        source: 'platform',
        ...couponData.metadata
      }
    };
    
    // Set discount type
    if (couponData.type === 'percentage') {
      stripeData.percent_off = couponData.value;
    } else if (couponData.type === 'fixed_amount') {
      stripeData.amount_off = couponData.value * 100; // Convert to cents
      stripeData.currency = couponData.currency || 'USD';
    }
    
    // Set duration
    stripeData.duration = couponData.duration;
    if (couponData.duration === 'repeating' && couponData.durationInMonths) {
      stripeData.duration_in_months = couponData.durationInMonths;
    }
    
    // Set max redemptions
    if (couponData.maxRedemptions !== null) {
      stripeData.max_redemptions = couponData.maxRedemptions;
    }
    
    // Set expiration
    if (couponData.expiresAt) {
      stripeData.redeem_by = Math.floor(new Date(couponData.expiresAt).getTime() / 1000);
    }
    
    return stripeData;
  }
}

module.exports = new CouponService();
