/**
 * Subscription Model
 * 
 * Defines the schema and methods for managing user subscriptions
 * in the chatbot platform.
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define subscription tiers based on the pricing model
const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  STARTER: 'starter',
  PROFESSIONAL: 'professional',
  ENTERPRISE: 'enterprise'
};

// Define subscription tier limits
const TIER_LIMITS = {
  [SUBSCRIPTION_TIERS.FREE]: {
    conversationsPerMonth: 1000,
    chatbots: 1,
    knowledgeBases: 1,
    supportLevel: 'community',
    price: 0
  },
  [SUBSCRIPTION_TIERS.STARTER]: {
    conversationsPerMonth: 10000,
    chatbots: 5,
    knowledgeBases: 3,
    supportLevel: 'email',
    price: 49
  },
  [SUBSCRIPTION_TIERS.PROFESSIONAL]: {
    conversationsPerMonth: 50000,
    chatbots: -1, // Unlimited
    knowledgeBases: 10,
    supportLevel: 'priority',
    price: 199
  },
  [SUBSCRIPTION_TIERS.ENTERPRISE]: {
    conversationsPerMonth: -1, // Unlimited
    chatbots: -1, // Unlimited
    knowledgeBases: -1, // Unlimited
    supportLevel: 'dedicated',
    price: 999
  }
};

// Define subscription schema
const subscriptionSchema = new Schema({
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  tier: {
    type: String,
    enum: Object.values(SUBSCRIPTION_TIERS),
    default: SUBSCRIPTION_TIERS.FREE,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'past_due', 'canceled', 'trialing'],
    default: 'active',
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  endDate: {
    type: Date,
    required: false
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'annual'],
    default: 'monthly'
  },
  autoRenew: {
    type: Boolean,
    default: true
  },
  paymentMethod: {
    type: Schema.Types.ObjectId,
    ref: 'PaymentMethod',
    required: false
  },
  customLimits: {
    conversationsPerMonth: Number,
    chatbots: Number,
    knowledgeBases: Number
  },
  usageStats: {
    currentPeriodStart: {
      type: Date,
      default: Date.now
    },
    currentPeriodEnd: Date,
    conversationsUsed: {
      type: Number,
      default: 0
    },
    chatbotsCreated: {
      type: Number,
      default: 0
    },
    knowledgeBasesCreated: {
      type: Number,
      default: 0
    }
  },
  billingHistory: [{
    date: Date,
    amount: Number,
    status: {
      type: String,
      enum: ['paid', 'pending', 'failed']
    },
    invoiceUrl: String
  }],
  metadata: {
    type: Map,
    of: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
subscriptionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Get subscription limits based on tier or custom limits
subscriptionSchema.methods.getLimits = function() {
  if (this.customLimits) {
    return {
      ...TIER_LIMITS[this.tier],
      ...this.customLimits
    };
  }
  return TIER_LIMITS[this.tier];
};

// Check if subscription has exceeded conversation limits
subscriptionSchema.methods.hasExceededConversationLimit = function() {
  const limits = this.getLimits();
  if (limits.conversationsPerMonth === -1) {
    return false; // Unlimited
  }
  return this.usageStats.conversationsUsed >= limits.conversationsPerMonth;
};

// Check if subscription has exceeded chatbot limits
subscriptionSchema.methods.hasExceededChatbotLimit = function() {
  const limits = this.getLimits();
  if (limits.chatbots === -1) {
    return false; // Unlimited
  }
  return this.usageStats.chatbotsCreated >= limits.chatbots;
};

// Check if subscription has exceeded knowledge base limits
subscriptionSchema.methods.hasExceededKnowledgeBaseLimit = function() {
  const limits = this.getLimits();
  if (limits.knowledgeBases === -1) {
    return false; // Unlimited
  }
  return this.usageStats.knowledgeBasesCreated >= limits.knowledgeBases;
};

// Calculate overage charges
subscriptionSchema.methods.calculateOverageCharges = function() {
  const limits = this.getLimits();
  let overageCharges = 0;
  
  // Only calculate overages for paid tiers
  if (this.tier !== SUBSCRIPTION_TIERS.FREE) {
    // Conversation overages
    if (limits.conversationsPerMonth !== -1 && 
        this.usageStats.conversationsUsed > limits.conversationsPerMonth) {
      const overageCount = this.usageStats.conversationsUsed - limits.conversationsPerMonth;
      // $0.005 per conversation overage
      overageCharges += overageCount * 0.005;
    }
  }
  
  return overageCharges;
};

// Reset usage stats for new billing period
subscriptionSchema.methods.resetUsageStats = function() {
  const now = new Date();
  this.usageStats.currentPeriodStart = now;
  
  // Set end date based on billing cycle
  const endDate = new Date(now);
  if (this.billingCycle === 'monthly') {
    endDate.setMonth(endDate.getMonth() + 1);
  } else {
    endDate.setFullYear(endDate.getFullYear() + 1);
  }
  
  this.usageStats.currentPeriodEnd = endDate;
  this.usageStats.conversationsUsed = 0;
  
  return this.save();
};

// Increment conversation usage
subscriptionSchema.methods.incrementConversationUsage = function(count = 1) {
  this.usageStats.conversationsUsed += count;
  return this.save();
};

// Increment chatbot count
subscriptionSchema.methods.incrementChatbotCount = function() {
  this.usageStats.chatbotsCreated += 1;
  return this.save();
};

// Increment knowledge base count
subscriptionSchema.methods.incrementKnowledgeBaseCount = function() {
  this.usageStats.knowledgeBasesCreated += 1;
  return this.save();
};

// Add billing record
subscriptionSchema.methods.addBillingRecord = function(amount, status, invoiceUrl) {
  this.billingHistory.push({
    date: new Date(),
    amount,
    status,
    invoiceUrl
  });
  
  return this.save();
};

// Upgrade subscription tier
subscriptionSchema.methods.upgradeTier = function(newTier) {
  if (!Object.values(SUBSCRIPTION_TIERS).includes(newTier)) {
    throw new Error(`Invalid subscription tier: ${newTier}`);
  }
  
  this.tier = newTier;
  return this.save();
};

// Cancel subscription
subscriptionSchema.methods.cancel = function() {
  this.status = 'canceled';
  this.autoRenew = false;
  
  // Set end date if not already set
  if (!this.endDate) {
    this.endDate = this.usageStats.currentPeriodEnd;
  }
  
  return this.save();
};

// Static method to get tier information
subscriptionSchema.statics.getTierLimits = function(tier) {
  return TIER_LIMITS[tier] || null;
};

// Static method to get all tier information
subscriptionSchema.statics.getAllTiers = function() {
  return TIER_LIMITS;
};

// Create model
const Subscription = mongoose.model('Subscription', subscriptionSchema);

// Export model and constants
module.exports = {
  Subscription,
  SUBSCRIPTION_TIERS,
  TIER_LIMITS
};
