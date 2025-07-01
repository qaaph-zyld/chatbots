/**
 * Pricing Model
 * 
 * Defines the schema for pricing plans and tiers
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Feature Schema
 * Defines features available in pricing plans
 */
const FeatureSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  type: {
    type: String,
    enum: ['boolean', 'numeric', 'text'],
    default: 'boolean'
  },
  value: Schema.Types.Mixed,
  included: {
    type: Boolean,
    default: true
  },
  highlight: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  }
});

/**
 * Pricing Tier Schema
 * Defines individual pricing tiers
 */
const PricingTierSchema = new Schema({
  name: {
    type: String,
    required: true,
    enum: ['free', 'starter', 'professional', 'enterprise', 'custom'],
    index: true
  },
  displayName: {
    type: String,
    required: true
  },
  description: String,
  monthlyPrice: {
    type: Number,
    required: true,
    default: 0
  },
  annualPrice: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  features: [FeatureSchema],
  limits: {
    conversationsPerMonth: {
      type: Number,
      default: 1000
    },
    chatbots: {
      type: Number,
      default: 1
    },
    knowledgeBaseSize: {
      type: Number, // in MB
      default: 100
    },
    users: {
      type: Number,
      default: 1
    },
    apiCalls: {
      type: Number,
      default: 1000
    }
  },
  overages: {
    conversationPrice: {
      type: Number, // per conversation over limit
      default: 0
    },
    knowledgeBasePrice: {
      type: Number, // per MB over limit
      default: 0
    },
    apiCallPrice: {
      type: Number, // per API call over limit
      default: 0
    }
  },
  trialDays: {
    type: Number,
    default: 0
  },
  popular: {
    type: Boolean,
    default: false
  },
  visible: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  metadata: {
    type: Map,
    of: Schema.Types.Mixed
  }
});

/**
 * Pricing Plan Schema
 * Defines the overall pricing plan with multiple tiers
 */
const PricingPlanSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  active: {
    type: Boolean,
    default: true,
    index: true
  },
  tiers: [PricingTierSchema],
  effectiveFrom: {
    type: Date,
    default: Date.now
  },
  effectiveTo: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Pre-save hook to update the updatedAt field
PricingPlanSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes for performance
PricingPlanSchema.index({ active: 1, effectiveFrom: 1, effectiveTo: 1 });

/**
 * Get current active pricing plan
 */
PricingPlanSchema.statics.getCurrentPlan = async function() {
  const now = new Date();
  
  return this.findOne({
    active: true,
    effectiveFrom: { $lte: now },
    $or: [
      { effectiveTo: { $gt: now } },
      { effectiveTo: null }
    ]
  }).sort({ effectiveFrom: -1 });
};

/**
 * Get tier by name
 */
PricingPlanSchema.methods.getTierByName = function(tierName) {
  return this.tiers.find(tier => tier.name === tierName);
};

/**
 * Calculate annual discount percentage
 */
PricingPlanSchema.methods.getAnnualDiscountPercentage = function(tierName) {
  const tier = this.getTierByName(tierName);
  
  if (!tier || !tier.monthlyPrice || tier.monthlyPrice === 0) {
    return 0;
  }
  
  const annualMonthly = tier.annualPrice / 12;
  return Math.round(((tier.monthlyPrice - annualMonthly) / tier.monthlyPrice) * 100);
};

/**
 * Calculate overage charges
 */
PricingPlanSchema.methods.calculateOverageCharges = function(tierName, usage) {
  const tier = this.getTierByName(tierName);
  
  if (!tier) {
    return 0;
  }
  
  let overageCharges = 0;
  
  // Calculate conversation overages
  if (usage.conversations > tier.limits.conversationsPerMonth) {
    const overageConversations = usage.conversations - tier.limits.conversationsPerMonth;
    overageCharges += overageConversations * tier.overages.conversationPrice;
  }
  
  // Calculate knowledge base overages
  if (usage.knowledgeBaseSize > tier.limits.knowledgeBaseSize) {
    const overageKB = usage.knowledgeBaseSize - tier.limits.knowledgeBaseSize;
    overageCharges += overageKB * tier.overages.knowledgeBasePrice;
  }
  
  // Calculate API call overages
  if (usage.apiCalls > tier.limits.apiCalls) {
    const overageAPICalls = usage.apiCalls - tier.limits.apiCalls;
    overageCharges += overageAPICalls * tier.overages.apiCallPrice;
  }
  
  return overageCharges;
};

const PricingPlan = mongoose.model('PricingPlan', PricingPlanSchema);
module.exports = PricingPlan;
