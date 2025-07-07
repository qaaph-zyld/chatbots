/**
 * Payment Model
 * 
 * Represents a payment transaction in the system
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PaymentSchema = new Schema({
  tenantId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  subscriptionId: {
    type: Schema.Types.ObjectId,
    ref: 'Subscription',
    index: true
  },
  paymentMethodId: {
    type: String,
    required: true
  },
  paymentIntentId: {
    type: String,
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: 'usd',
    uppercase: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'succeeded', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  description: {
    type: String
  },
  metadata: {
    type: Object,
    default: {}
  },
  refundedAmount: {
    type: Number,
    default: 0
  },
  refunds: [{
    refundId: String,
    amount: Number,
    reason: String,
    status: String,
    createdAt: Date
  }],
  failureCode: {
    type: String
  },
  failureMessage: {
    type: String
  },
  receiptUrl: {
    type: String
  },
  invoiceId: {
    type: String
  },
  statementDescriptor: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  }
});

// Indexes for common queries
PaymentSchema.index({ createdAt: -1 });
PaymentSchema.index({ status: 1, createdAt: -1 });
PaymentSchema.index({ tenantId: 1, status: 1 });

/**
 * Pre-save hook to update timestamps
 */
PaymentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

/**
 * Instance method to process a refund
 * @param {Object} refundData - Refund data
 * @param {Number} refundData.amount - Amount to refund
 * @param {String} refundData.reason - Reason for refund
 * @returns {Promise<Object>} - Updated payment document
 */
PaymentSchema.methods.processRefund = async function(refundData) {
  const { amount, reason } = refundData;
  
  // Validate refund amount
  if (amount > this.amount - this.refundedAmount) {
    throw new Error('Refund amount exceeds available amount');
  }
  
  // Add refund record
  this.refunds.push({
    refundId: `ref_${Date.now()}`,
    amount,
    reason,
    status: 'succeeded',
    createdAt: new Date()
  });
  
  // Update refunded amount
  this.refundedAmount += amount;
  
  // Update status
  if (this.refundedAmount === this.amount) {
    this.status = 'refunded';
  } else if (this.refundedAmount > 0) {
    this.status = 'partially_refunded';
  }
  
  return this.save();
};

/**
 * Static method to find payments by date range
 * @param {Object} params - Query parameters
 * @param {String} params.tenantId - Tenant ID
 * @param {Date} params.startDate - Start date
 * @param {Date} params.endDate - End date
 * @returns {Promise<Array>} - Array of payment documents
 */
PaymentSchema.statics.findByDateRange = function(params) {
  const { tenantId, startDate, endDate } = params;
  
  const query = { tenantId };
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  return this.find(query).sort({ createdAt: -1 });
};

/**
 * Static method to get payment statistics
 * @param {Object} params - Query parameters
 * @param {String} params.tenantId - Tenant ID
 * @param {Date} params.startDate - Start date
 * @param {Date} params.endDate - End date
 * @returns {Promise<Object>} - Payment statistics
 */
PaymentSchema.statics.getStatistics = async function(params) {
  const { tenantId, startDate, endDate } = params;
  
  const query = { tenantId };
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  const stats = await this.aggregate([
    { $match: query },
    { $group: {
      _id: null,
      totalPayments: { $sum: 1 },
      totalAmount: { $sum: '$amount' },
      totalRefunded: { $sum: '$refundedAmount' },
      successfulPayments: {
        $sum: { $cond: [{ $eq: ['$status', 'succeeded'] }, 1, 0] }
      },
      failedPayments: {
        $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
      },
      refundedPayments: {
        $sum: { $cond: [{ $in: ['$status', ['refunded', 'partially_refunded']] }, 1, 0] }
      }
    }}
  ]);
  
  return stats.length > 0 ? stats[0] : {
    totalPayments: 0,
    totalAmount: 0,
    totalRefunded: 0,
    successfulPayments: 0,
    failedPayments: 0,
    refundedPayments: 0
  };
};

const Payment = mongoose.model('Payment', PaymentSchema);

module.exports = Payment;
