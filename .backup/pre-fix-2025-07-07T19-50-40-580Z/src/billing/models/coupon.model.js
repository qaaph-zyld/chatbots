/**
 * Coupon Model
 * 
 * Schema for coupons and promotional codes
 */

const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
  // Coupon code (unique)
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  
  // Coupon type: 'percentage', 'fixed_amount', 'free_trial'
  type: {
    type: String,
    required: true,
    enum: ['percentage', 'fixed_amount', 'free_trial']
  },
  
  // Discount value (percentage or fixed amount)
  value: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Currency for fixed amount discounts
  currency: {
    type: String,
    default: 'USD'
  },
  
  // Description of the coupon
  description: {
    type: String,
    trim: true
  },
  
  // Maximum number of redemptions allowed (null for unlimited)
  maxRedemptions: {
    type: Number,
    default: null
  },
  
  // Current number of redemptions
  redemptionCount: {
    type: Number,
    default: 0
  },
  
  // Duration of the coupon: 'once', 'repeating', 'forever'
  duration: {
    type: String,
    required: true,
    enum: ['once', 'repeating', 'forever'],
    default: 'once'
  },
  
  // Number of months the coupon applies (for 'repeating' duration)
  durationInMonths: {
    type: Number,
    default: null
  },
  
  // Whether the coupon is active
  active: {
    type: Boolean,
    default: true
  },
  
  // Expiration date
  expiresAt: {
    type: Date,
    default: null
  },
  
  // Creation date
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  // Stripe coupon ID (if synced with Stripe)
  stripeCouponId: {
    type: String,
    default: null
  },
  
  // Specific plan IDs this coupon applies to (null for all plans)
  applicablePlans: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan'
  }],
  
  // Minimum purchase amount required (for fixed_amount coupons)
  minimumAmount: {
    type: Number,
    default: 0
  },
  
  // First-time customers only
  firstTimeOnly: {
    type: Boolean,
    default: false
  },
  
  // Metadata for additional information
  metadata: {
    type: Object,
    default: {}
  }
});

// Index for faster lookups
CouponSchema.index({ code: 1 });
CouponSchema.index({ active: 1 });
CouponSchema.index({ expiresAt: 1 });

/**
 * Check if coupon is valid
 * @returns {boolean} Whether the coupon is valid
 */
CouponSchema.methods.isValid = function() {
  // Check if active
  if (!this.active) {
    return false;
  }
  
  // Check if expired
  if (this.expiresAt && new Date() > this.expiresAt) {
    return false;
  }
  
  // Check if max redemptions reached
  if (this.maxRedemptions !== null && this.redemptionCount >= this.maxRedemptions) {
    return false;
  }
  
  return true;
};

/**
 * Calculate discount amount
 * @param {number} amount - Original amount
 * @returns {number} Discount amount
 */
CouponSchema.methods.calculateDiscount = function(amount) {
  if (!this.isValid()) {
    return 0;
  }
  
  if (this.type === 'percentage') {
    return (amount * this.value) / 100;
  } else if (this.type === 'fixed_amount') {
    return Math.min(amount, this.value);
  }
  
  return 0;
};

/**
 * Increment redemption count
 * @returns {Promise<void>}
 */
CouponSchema.methods.redeem = async function() {
  this.redemptionCount += 1;
  await this.save();
};

/**
 * Check if coupon is applicable to a plan
 * @param {string} planId - Plan ID
 * @returns {boolean} Whether the coupon is applicable
 */
CouponSchema.methods.isApplicableToPlan = function(planId) {
  // If no specific plans are set, coupon applies to all plans
  if (!this.applicablePlans || this.applicablePlans.length === 0) {
    return true;
  }
  
  // Check if plan is in applicable plans
  return this.applicablePlans.some(p => p.toString() === planId.toString());
};

const Coupon = mongoose.model('Coupon', CouponSchema);

module.exports = Coupon;
