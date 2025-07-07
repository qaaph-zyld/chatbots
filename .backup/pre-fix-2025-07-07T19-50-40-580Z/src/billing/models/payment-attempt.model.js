/**
 * Payment Attempt Model
 * 
 * Represents a payment retry attempt for a failed subscription payment
 * Tracks retry scheduling, status, and error details
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PaymentAttemptSchema = new Schema({
  // Reference to the subscription
  subscriptionId: {
    type: Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true,
    index: true
  },
  
  // Reference to the user
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Stripe invoice ID
  invoiceId: {
    type: String,
    required: true,
    index: true
  },
  
  // Attempt number (1, 2, 3, etc.)
  attemptNumber: {
    type: Number,
    required: true,
    min: 1
  },
  
  // When the retry is scheduled to occur
  scheduledAt: {
    type: Date,
    required: true,
    index: true
  },
  
  // When the retry was actually processed
  processedAt: {
    type: Date,
    default: null
  },
  
  // Status of the payment attempt
  // scheduled: waiting to be processed
  // processing: currently being processed
  // succeeded: payment was successful
  // failed: payment failed
  // cancelled: attempt was cancelled (e.g. payment made through other means)
  status: {
    type: String,
    enum: ['scheduled', 'processing', 'succeeded', 'failed', 'cancelled'],
    required: true,
    default: 'scheduled',
    index: true
  },
  
  // Error details if the payment failed
  errorDetails: {
    type: Object,
    default: null
  },
  
  // Amount that was attempted to be charged
  amount: {
    type: Number,
    default: null
  },
  
  // Currency of the amount
  currency: {
    type: String,
    default: null
  },
  
  // Payment method used for the attempt
  paymentMethodId: {
    type: String,
    default: null
  },
  
  // Notes or additional information
  notes: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Compound index for efficient querying of scheduled attempts
PaymentAttemptSchema.index({ status: 1, scheduledAt: 1 });

// Compound index for user's payment history
PaymentAttemptSchema.index({ userId: 1, createdAt: -1 });

// Method to get formatted status with timestamp
PaymentAttemptSchema.methods.getFormattedStatus = function() {
  let timestamp;
  
  switch (this.status) {
    case 'scheduled':
      timestamp = this.scheduledAt;
      break;
    case 'processing':
    case 'succeeded':
    case 'failed':
    case 'cancelled':
      timestamp = this.processedAt || this.updatedAt;
      break;
    default:
      timestamp = this.updatedAt;
  }
  
  return {
    status: this.status,
    timestamp: timestamp,
    attemptNumber: this.attemptNumber
  };
};

// Static method to get pending attempts for a subscription
PaymentAttemptSchema.statics.getPendingAttempts = async function(subscriptionId) {
  return this.find({
    subscriptionId,
    status: 'scheduled'
  }).sort({ scheduledAt: 1 });
};

// Static method to get attempt history for a subscription
PaymentAttemptSchema.statics.getAttemptHistory = async function(subscriptionId) {
  return this.find({
    subscriptionId
  }).sort({ createdAt: -1 });
};

// Static method to cancel all pending attempts for an invoice
PaymentAttemptSchema.statics.cancelPendingAttempts = async function(invoiceId) {
  return this.updateMany(
    { 
      invoiceId, 
      status: 'scheduled' 
    },
    { 
      status: 'cancelled',
      updatedAt: new Date(),
      notes: 'Cancelled due to manual payment or other resolution'
    }
  );
};

module.exports = mongoose.model('PaymentAttempt', PaymentAttemptSchema);
