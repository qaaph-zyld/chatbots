/**
 * Subscription Model
 * 
 * Defines the schema for subscription plans and billing information
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Plan Schema
 * Defines the available subscription plans
 */
const PlanSchema = new Schema({
  name: {
    type: String,
    required: true,
    enum: ['free', 'starter', 'professional', 'enterprise'],
    default: 'free'
  },
  price: {
    type: Number,
    required: true,
    default: 0
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'annual', 'custom'],
    default: 'monthly'
  },
  features: {
    conversationsPerMonth: {
      type: Number,
      required: true,
      default: 1000
    },
    chatbots: {
      type: Number,
      required: true,
      default: 1
    },
    knowledgeBaseSize: {
      type: Number, // in MB
      required: true,
      default: 100
    },
    advancedAnalytics: {
      type: Boolean,
      default: false
    },
    customIntegrations: {
      type: Boolean,
      default: false
    },
    prioritySupport: {
      type: Boolean,
      default: false
    },
    whiteLabel: {
      type: Boolean,
      default: false
    },
    sla: {
      type: Boolean,
      default: false
    }
  },
  active: {
    type: Boolean,
    default: true
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

/**
 * Subscription Schema
 * Tracks tenant subscriptions and billing information
 */
const SubscriptionSchema = new Schema({
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  plan: {
    type: PlanSchema,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'past_due', 'canceled', 'trialing', 'paused'],
    default: 'active',
    required: true
  },
  customerId: {
    type: String, // Payment provider customer ID
    required: false
  },
  paymentMethodId: {
    type: String,
    required: false
  },
  subscriptionId: {
    type: String, // Payment provider subscription ID
    required: false
  },
  currentPeriodStart: {
    type: Date,
    required: true,
    default: Date.now
  },
  currentPeriodEnd: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  },
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false
  },
  trialStart: {
    type: Date
  },
  trialEnd: {
    type: Date
  },
  usage: {
    conversations: {
      type: Number,
      default: 0
    },
    storage: {
      type: Number, // in bytes
      default: 0
    },
    apiCalls: {
      type: Number,
      default: 0
    }
  },
  billingDetails: {
    name: String,
    email: String,
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String
    },
    vatId: String,
    companyName: String
  },
  invoices: [{
    invoiceId: String,
    amount: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    status: {
      type: String,
      enum: ['draft', 'open', 'paid', 'uncollectible', 'void']
    },
    date: Date,
    pdfUrl: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to update the updatedAt field
SubscriptionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes for performance
SubscriptionSchema.index({ 'tenantId': 1, 'status': 1 });
SubscriptionSchema.index({ 'currentPeriodEnd': 1 });

// Static method to find active subscriptions
SubscriptionSchema.statics.findActive = function() {
  return this.find({ status: 'active' });
};

// Static method to find subscriptions expiring soon
SubscriptionSchema.statics.findExpiringSoon = function(days = 7) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);
  
  return this.find({
    status: 'active',
    currentPeriodEnd: { $lte: expiryDate }
  });
};

// Method to check if subscription is in trial
SubscriptionSchema.methods.isInTrial = function() {
  if (!this.trialEnd) return false;
  return new Date() < this.trialEnd;
};

// Method to check if subscription has exceeded usage limits
SubscriptionSchema.methods.hasExceededLimits = function() {
  return this.usage.conversations > this.plan.features.conversationsPerMonth;
};

// Method to calculate overage charges
SubscriptionSchema.methods.calculateOverage = function() {
  if (!this.hasExceededLimits()) return 0;
  
  const overageConversations = this.usage.conversations - this.plan.features.conversationsPerMonth;
  // $0.005 per conversation over the limit
  return overageConversations * 0.005;
};

const Subscription = mongoose.model('Subscription', SubscriptionSchema);
module.exports = Subscription;
