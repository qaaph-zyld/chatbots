const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true
  },
  platform: { 
    type: String, 
    required: true,
    enum: ['shopify', 'woocommerce'],
    lowercase: true
  },
  api_credentials: { 
    type: Object, 
    required: true 
  },
  settings: { 
    type: Object,
    default: {
      business_hours: { start: '09:00', end: '17:00' },
      auto_responses: true,
      escalation_rules: {
        max_wait_time: 300,
        keywords: ['urgent', 'complaint', 'manager']
      }
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  webhook_url: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^https?:\\\\\\/\\\\\\/.+/.test(v);
      },
      message: 'Webhook URL must be a valid HTTP/HTTPS URL'
    }
  },
  last_sync: {
    type: Date
  },
  metadata: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes
storeSchema.index({ name: 1 }, { unique: true });
storeSchema.index({ platform: 1 });
storeSchema.index({ status: 1 });
storeSchema.index({ createdAt: -1 });

// Methods
storeSchema.methods.isActive = function() {
  return this.status === 'active';
};

storeSchema.methods.updateLastSync = function() {
  this.last_sync = new Date();
  return this.save();
};

storeSchema.methods.getApiCredentials = function() {
  // Return a copy to prevent modification
  return { ...this.api_credentials };
};

// Static methods
storeSchema.statics.findByPlatform = function(platform) {
  return this.find({ platform: platform.toLowerCase(), status: 'active' });
};

storeSchema.statics.findActive = function() {
  return this.find({ status: 'active' });
};

// Pre-save middleware
storeSchema.pre('save', function(next) {
  if (this.isModified('platform')) {
    this.platform = this.platform.toLowerCase();
  }
  next();
});

// Virtual for display name
storeSchema.virtual('displayName').get(function() {
  return `${this.name} (${this.platform})`;
});

// Ensure virtual fields are serialized
storeSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.api_credentials; // Don't expose credentials in JSON
    return ret;
  }
});

module.exports = mongoose.model('Store', storeSchema);
