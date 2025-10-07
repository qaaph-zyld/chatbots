/**
 * Usage Model
 * 
 * Stores usage metrics for billing and analytics
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const usageSchema = new Schema({
  // User ID (owner of the subscription)
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Resource type being tracked
  resource: {
    type: String,
    enum: ['conversations', 'apiCalls', 'storage', 'chatbots', 'knowledgeEntries'],
    required: true,
    index: true
  },
  
  // Usage amount
  amount: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  
  // Billing period (month start)
  period: {
    type: Date,
    required: true,
    index: true
  },
  
  // Additional metadata for tracking
  metadata: {
    chatbotId: {
      type: Schema.Types.ObjectId,
      ref: 'Chatbot'
    },
    source: {
      type: String,
      enum: ['api', 'web', 'integration', 'system']
    },
    details: {
      type: Schema.Types.Mixed
    }
  }
}, {
  timestamps: true
});

// Create compound indexes for billing queries
usageSchema.index({ userId: 1, resource: 1, period: 1 }, { unique: true });
usageSchema.index({ userId: 1, period: 1 });
usageSchema.index({ period: 1, updatedAt: -1 });

// Static methods for usage tracking
usageSchema.statics.recordUsage = async function(userId, resource, amount, metadata = {}) {
  const now = new Date();
  const period = new Date(now.getFullYear(), now.getMonth(), 1);
  
  return this.findOneAndUpdate(
    { userId, resource, period },
    { 
      $inc: { amount },
      $set: { 
        metadata,
        updatedAt: now 
      }
    },
    { upsert: true, new: true }
  );
};

usageSchema.statics.getUsageForPeriod = async function(userId, resource, period) {
  const usage = await this.findOne({ userId, resource, period });
  return usage ? usage.amount : 0;
};

usageSchema.statics.getCurrentMonthUsage = async function(userId, resource) {
  const now = new Date();
  const period = new Date(now.getFullYear(), now.getMonth(), 1);
  return this.getUsageForPeriod(userId, resource, period);
};

usageSchema.statics.getUserUsageSummary = async function(userId, period) {
  const usage = await this.find({ userId, period });
  const summary = {};
  
  usage.forEach(u => {
    summary[u.resource] = u.amount;
  });
  
  return summary;
};

module.exports = mongoose.model('Usage', usageSchema);
