/**
 * Payment Method Model
 * 
 * Represents a stored payment method in the system
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PaymentMethodSchema = new Schema({
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
  paymentMethodId: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    required: true,
    enum: ['card', 'bank_account', 'paypal', 'other'],
    default: 'card'
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'inactive', 'expired', 'failed'],
    default: 'active'
  },
  // Card-specific fields
  card: {
    brand: String,
    last4: String,
    expMonth: Number,
    expYear: Number,
    fingerprint: String,
    country: String,
    funding: String
  },
  // Bank account-specific fields
  bankAccount: {
    bankName: String,
    last4: String,
    country: String,
    currency: String,
    routingNumber: String
  },
  // PayPal-specific fields
  paypal: {
    email: String
  },
  billingDetails: {
    name: String,
    email: String,
    phone: String,
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String
    }
  },
  metadata: {
    type: Object,
    default: {}
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
PaymentMethodSchema.index({ userId: 1, isDefault: 1 });
PaymentMethodSchema.index({ tenantId: 1, status: 1 });

/**
 * Pre-save hook to update timestamps
 */
PaymentMethodSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

/**
 * Pre-save hook to ensure only one default payment method per user
 */
PaymentMethodSchema.pre('save', async function(next) {
  if (this.isDefault) {
    // Find all other payment methods for this user and set isDefault to false
    await this.constructor.updateMany(
      { 
        userId: this.userId, 
        _id: { $ne: this._id },
        isDefault: true 
      },
      { isDefault: false }
    );
  }
  next();
});

/**
 * Instance method to set as default
 * @returns {Promise<Object>} - Updated payment method document
 */
PaymentMethodSchema.methods.setAsDefault = async function() {
  this.isDefault = true;
  return this.save();
};

/**
 * Instance method to update status
 * @param {String} status - New status
 * @returns {Promise<Object>} - Updated payment method document
 */
PaymentMethodSchema.methods.updateStatus = async function(status) {
  this.status = status;
  return this.save();
};

/**
 * Static method to find default payment method for a user
 * @param {String} userId - User ID
 * @returns {Promise<Object>} - Default payment method document
 */
PaymentMethodSchema.statics.findDefaultForUser = function(userId) {
  return this.findOne({ userId, isDefault: true });
};

/**
 * Static method to find active payment methods for a user
 * @param {String} userId - User ID
 * @returns {Promise<Array>} - Array of active payment method documents
 */
PaymentMethodSchema.statics.findActiveForUser = function(userId) {
  return this.find({ userId, status: 'active' }).sort({ isDefault: -1, createdAt: -1 });
};

/**
 * Static method to find payment method by ID and validate ownership
 * @param {String} paymentMethodId - Payment method ID
 * @param {String} userId - User ID
 * @returns {Promise<Object>} - Payment method document
 */
PaymentMethodSchema.statics.findByIdAndValidateOwner = function(paymentMethodId, userId) {
  return this.findOne({ paymentMethodId, userId });
};

const PaymentMethod = mongoose.model('PaymentMethod', PaymentMethodSchema);

module.exports = PaymentMethod;
