/**
 * Subscription Model
 * 
 * MongoDB model for user subscriptions
 */

const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  planId: {
    type: String,
    required: true,
    enum: ['starter', 'professional', 'enterprise'],
    index: true
  },
  stripeSubscriptionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  stripeCustomerId: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'trialing', 'past_due', 'cancelled', 'unpaid'],
    default: 'trialing',
    index: true
  },
  currentPeriodStart: {
    type: Date,
    required: true
  },
  currentPeriodEnd: {
    type: Date,
    required: true
  },
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  lastPaymentAt: {
    type: Date,
    default: null
  },
  limits: {
    chatbots: {
      type: Number,
      required: true,
      default: 3
    },
    conversations: {
      type: Number,
      required: true,
      default: 1000
    },
    knowledgeEntries: {
      type: Number,
      required: true,
      default: 100
    },
    teamMembers: {
      type: Number,
      required: true,
      default: 1
    },
    apiCalls: {
      type: Number,
      required: true,
      default: 0
    }
  },
  features: {
    apiAccess: {
      type: Boolean,
      default: false
    },
    customIntegrations: {
      type: Boolean,
      default: false
    },
    advancedAnalytics: {
      type: Boolean,
      default: false
    },
    abtesting: {
      type: Boolean,
      default: false
    },
    whiteLabel: {
      type: Boolean,
      default: false
    },
    prioritySupport: {
      type: Boolean,
      default: false
    },
    dedicatedSupport: {
      type: Boolean,
      default: false
    },
    customSLA: {
      type: Boolean,
      default: false
    }
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ stripeSubscriptionId: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 });

// Virtual for days remaining in current period
subscriptionSchema.virtual('daysRemaining').get(function() {
  if (!this.currentPeriodEnd) return 0;
  const now = new Date();
  const diff = this.currentPeriodEnd.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

// Virtual for subscription age
subscriptionSchema.virtual('subscriptionAge').get(function() {
  if (!this.createdAt) return 0;
  const now = new Date();
  const diff = now.getTime() - this.createdAt.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

// Instance methods
subscriptionSchema.methods.isActive = function() {
  return ['active', 'trialing'].includes(this.status);
};

subscriptionSchema.methods.isPastDue = function() {
  return this.status === 'past_due';
};

subscriptionSchema.methods.isCancelled = function() {
  return this.status === 'cancelled';
};

subscriptionSchema.methods.hasFeature = function(feature) {
  return this.features[feature] === true;
};

subscriptionSchema.methods.getLimit = function(resource) {
  return this.limits[resource] || 0;
};

subscriptionSchema.methods.isUnlimited = function(resource) {
  return this.limits[resource] === -1;
};

// Static methods
subscriptionSchema.statics.findActiveByUser = function(userId) {
  return this.findOne({
    userId,
    status: { $in: ['active', 'trialing'] }
  });
};

subscriptionSchema.statics.findExpiringSoon = function(days = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    status: 'active',
    currentPeriodEnd: { $lte: futureDate },
    cancelAtPeriodEnd: false
  });
};

subscriptionSchema.statics.findPastDue = function() {
  return this.find({
    status: 'past_due'
  });
};

// Pre-save middleware
subscriptionSchema.pre('save', function(next) {
  // Set cancelled timestamp
  if (this.isModified('status') && this.status === 'cancelled' && !this.cancelledAt) {
    this.cancelledAt = new Date();
  }
  
  // Set last payment timestamp
  if (this.isModified('status') && this.status === 'active' && !this.lastPaymentAt) {
    this.lastPaymentAt = new Date();
  }
  
  next();
});

// Post-save middleware for logging
subscriptionSchema.post('save', function(doc) {
  console.log(`Subscription ${doc._id} saved with status: ${doc.status}`);
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
