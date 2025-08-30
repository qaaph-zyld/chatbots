const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  store_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Store',
    required: true,
    index: true
  },
  order_number: { 
    type: String, 
    required: true,
    index: true
  },
  platform_order_id: {
    type: String,
    required: true,
    index: true
  },
  customer_email: { 
    type: String, 
    required: true,
    index: true,
    validate: {
      validator: function(v) {
        return /^[\\\\\\\w-\\\\\\.]+@([\\\\\\\w-]+\\\\\\.)+[\\\\\\\w-]{2,4}$/.test(v);
      },
      message: 'Please enter a valid email'
    }
  },
  customer_name: {
    type: String,
    trim: true
  },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'returned'],
    default: 'pending',
    index: true
  },
  financial_status: {
    type: String,
    enum: ['pending', 'authorized', 'partially_paid', 'paid', 'partially_refunded', 'refunded', 'voided'],
    default: 'pending',
    index: true
  },
  fulfillment_status: {
    type: String,
    enum: ['unfulfilled', 'partial', 'fulfilled', 'restocked'],
    default: 'unfulfilled',
    index: true
  },
  total_price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'USD',
    maxlength: 3
  },
  line_items: [{
    platform_item_id: String,
    title: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    sku: String,
    variant_id: String,
    product_id: String
  }],
  shipping_address: {
    first_name: String,
    last_name: String,
    company: String,
    address1: String,
    address2: String,
    city: String,
    province: String,
    country: String,
    zip: String,
    phone: String
  },
  billing_address: {
    first_name: String,
    last_name: String,
    company: String,
    address1: String,
    address2: String,
    city: String,
    province: String,
    country: String,
    zip: String,
    phone: String
  },
  tracking_numbers: [{
    carrier: String,
    tracking_number: String,
    tracking_url: String,
    shipped_date: Date,
    estimated_delivery: Date
  }],
  refunds: [{
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    reason: String,
    processed_at: {
      type: Date,
      default: Date.now
    },
    refund_id: String,
    status: {
      type: String,
      enum: ['pending', 'success', 'failure', 'cancelled'],
      default: 'pending'
    }
  }],
  notes: [{
    content: {
      type: String,
      required: true
    },
    author: String,
    author_type: {
      type: String,
      enum: ['system', 'customer', 'agent', 'bot'],
      default: 'system'
    },
    is_customer_visible: {
      type: Boolean,
      default: false
    },
    created_at: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  data: { 
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  synced_at: { 
    type: Date,
    index: true
  },
  last_updated_at: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Compound indexes
orderSchema.index({ store_id: 1, order_number: 1 }, { unique: true });
orderSchema.index({ store_id: 1, customer_email: 1 });
orderSchema.index({ store_id: 1, status: 1 });
orderSchema.index({ store_id: 1, createdAt: -1 });
orderSchema.index({ customer_email: 1, createdAt: -1 });

// Methods
orderSchema.methods.isPaid = function() {
  return ['paid', 'partially_refunded', 'refunded'].includes(this.financial_status);
};

orderSchema.methods.isFulfilled = function() {
  return this.fulfillment_status === 'fulfilled';
};

orderSchema.methods.isShipped = function() {
  return ['shipped', 'delivered'].includes(this.status);
};

orderSchema.methods.isDelivered = function() {
  return this.status === 'delivered';
};

orderSchema.methods.isCancelled = function() {
  return this.status === 'cancelled';
};

orderSchema.methods.isRefunded = function() {
  return this.status === 'refunded' || this.financial_status === 'refunded';
};

orderSchema.methods.addRefund = function(amount, reason, refundId) {
  this.refunds.push({
    amount: amount,
    reason: reason,
    refund_id: refundId,
    status: 'pending'
  });
  return this.save();
};

orderSchema.methods.updateRefundStatus = function(refundId, status) {
  const refund = this.refunds.find(r => r.refund_id === refundId);
  if (refund) {
    refund.status = status;
    return this.save();
  }
  return Promise.resolve(this);
};

orderSchema.methods.addNote = function(content, author, authorType, isCustomerVisible = false) {
  this.notes.push({
    content: content,
    author: author,
    author_type: authorType,
    is_customer_visible: isCustomerVisible
  });
  return this.save();
};

orderSchema.methods.addTrackingNumber = function(carrier, trackingNumber, trackingUrl, estimatedDelivery) {
  this.tracking_numbers.push({
    carrier: carrier,
    tracking_number: trackingNumber,
    tracking_url: trackingUrl,
    shipped_date: new Date(),
    estimated_delivery: estimatedDelivery
  });
  
  // Update status if not already shipped
  if (!this.isShipped()) {
    this.status = 'shipped';
  }
  
  return this.save();
};

orderSchema.methods.addTag = function(tag) {
  if (!this.tags.includes(tag)) {
    this.tags.push(tag);
    return this.save();
  }
  return Promise.resolve(this);
};

orderSchema.methods.removeTag = function(tag) {
  this.tags = this.tags.filter(t => t !== tag);
  return this.save();
};

orderSchema.methods.updateStatus = function(status, financialStatus, fulfillmentStatus) {
  if (status) this.status = status;
  if (financialStatus) this.financial_status = financialStatus;
  if (fulfillmentStatus) this.fulfillment_status = fulfillmentStatus;
  this.last_updated_at = new Date();
  return this.save();
};

orderSchema.methods.markAsDelivered = function() {
  this.status = 'delivered';
  this.last_updated_at = new Date();
  return this.save();
};

orderSchema.methods.updateSyncTime = function() {
  this.synced_at = new Date();
  return this.save();
};

// Static methods
orderSchema.statics.findByStore = function(storeId, options = {}) {
  const query = { store_id: storeId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.customer_email) {
    query.customer_email = options.customer_email;
  }
  
  if (options.order_number) {
    query.order_number = options.order_number;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

orderSchema.statics.findByCustomer = function(customerEmail, storeId) {
  return this.find({ 
    customer_email: customerEmail,
    store_id: storeId 
  }).sort({ createdAt: -1 });
};

orderSchema.statics.findByOrderNumber = function(orderNumber, storeId) {
  return this.findOne({ 
    order_number: orderNumber,
    store_id: storeId 
  });
};

orderSchema.statics.findPendingSync = function(storeId, olderThan = 5) {
  const syncTime = new Date(Date.now() - olderThan * 60 * 1000);
  const query = {
    $or: [
      { synced_at: { $lt: syncTime } },
      { synced_at: { $exists: false } }
    ]
  };
  
  if (storeId) {
    query.store_id = storeId;
  }
  
  return this.find(query);
};

orderSchema.statics.getAnalytics = function(storeId, startDate, endDate) {
  const match = { store_id: mongoose.Types.ObjectId(storeId) };
  
  if (startDate && endDate) {
    match.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        total_orders: { $sum: 1 },
        total_revenue: { $sum: '$total_price' },
        pending_orders: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        shipped_orders: { $sum: { $cond: [{ $eq: ['$status', 'shipped'] }, 1, 0] } },
        delivered_orders: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
        cancelled_orders: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        refunded_orders: { $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0] } },
        avg_order_value: { $avg: '$total_price' }
      }
    }
  ]);
};

orderSchema.statics.getRevenueByPeriod = function(storeId, period = 'day', startDate, endDate) {
  const match = { 
    store_id: mongoose.Types.ObjectId(storeId),
    financial_status: 'paid'
  };
  
  if (startDate && endDate) {
    match.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  let dateFormat;
  switch (period) {
    case 'hour':
      dateFormat = '%Y-%m-%d-%H';
      break;
    case 'day':
      dateFormat = '%Y-%m-%d';
      break;
    case 'week':
      dateFormat = '%Y-%U';
      break;
    case 'month':
      dateFormat = '%Y-%m';
      break;
    default:
      dateFormat = '%Y-%m-%d';
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
        revenue: { $sum: '$total_price' },
        order_count: { $sum: 1 }
      }
    },
    { $sort: { '_id': 1 } }
  ]);
};

// Virtual for customer display name
orderSchema.virtual('customerDisplayName').get(function() {
  return this.customer_name || this.customer_email;
});

// Virtual for total refunded amount
orderSchema.virtual('totalRefunded').get(function() {
  return this.refunds.reduce((total, refund) => {
    return refund.status === 'success' ? total + refund.amount : total;
  }, 0);
});

// Virtual for item count
orderSchema.virtual('itemCount').get(function() {
  return this.line_items.reduce((total, item) => total + item.quantity, 0);
});

// Pre-save middleware
orderSchema.pre('save', function(next) {
  this.last_updated_at = new Date();
  next();
});

// Ensure virtual fields are serialized
orderSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Order', orderSchema);
