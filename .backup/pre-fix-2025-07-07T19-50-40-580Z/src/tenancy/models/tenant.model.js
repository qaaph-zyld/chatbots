/**
 * Tenant Model
 * 
 * Defines the schema for multi-tenant functionality in the chatbot platform
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Tenant Schema
 * Core entity for multi-tenancy support
 */
const TenantSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'deleted'],
    default: 'active'
  },
  organizationDetails: {
    companyName: String,
    website: String,
    industry: String,
    size: String,
    logo: String
  },
  contactDetails: {
    email: {
      type: String,
      required: true
    },
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
  settings: {
    timezone: {
      type: String,
      default: 'UTC'
    },
    dateFormat: {
      type: String,
      default: 'YYYY-MM-DD'
    },
    defaultLanguage: {
      type: String,
      default: 'en'
    },
    allowedDomains: [String],
    customBranding: {
      enabled: {
        type: Boolean,
        default: false
      },
      primaryColor: String,
      secondaryColor: String,
      logoUrl: String,
      faviconUrl: String
    }
  },
  apiKeys: [{
    key: String,
    name: String,
    permissions: [String],
    createdAt: {
      type: Date,
      default: Date.now
    },
    lastUsed: Date,
    expiresAt: Date,
    active: {
      type: Boolean,
      default: true
    }
  }],
  limits: {
    maxUsers: {
      type: Number,
      default: 5
    },
    maxStorage: {
      type: Number, // in MB
      default: 1000
    },
    maxChatbots: {
      type: Number,
      default: 1
    },
    maxKnowledgeBases: {
      type: Number,
      default: 1
    }
  },
  metadata: {
    type: Map,
    of: Schema.Types.Mixed
  },
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
TenantSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes for performance
TenantSchema.index({ slug: 1 }, { unique: true });
TenantSchema.index({ 'contactDetails.email': 1 });
TenantSchema.index({ status: 1 });

/**
 * Generate a unique API key for the tenant
 */
TenantSchema.methods.generateApiKey = async function(name, permissions = ['read'], expiresInDays = 365) {
  // Generate a secure random API key
  const crypto = require('crypto');
  const key = `${this.slug}_${crypto.randomBytes(32).toString('hex')}`;
  
  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);
  
  // Add to API keys array
  this.apiKeys.push({
    key,
    name,
    permissions,
    createdAt: new Date(),
    expiresAt,
    active: true
  });
  
  await this.save();
  return key;
};

/**
 * Validate an API key
 */
TenantSchema.methods.validateApiKey = function(apiKey) {
  const key = this.apiKeys.find(k => k.key === apiKey && k.active);
  
  if (!key) {
    return false;
  }
  
  // Check if expired
  if (key.expiresAt && key.expiresAt < new Date()) {
    return false;
  }
  
  // Update last used timestamp
  key.lastUsed = new Date();
  this.save();
  
  return {
    valid: true,
    permissions: key.permissions
  };
};

/**
 * Check if tenant is active
 */
TenantSchema.methods.isActive = function() {
  return this.status === 'active';
};

/**
 * Suspend tenant
 */
TenantSchema.methods.suspend = async function(reason) {
  this.status = 'suspended';
  this.metadata = this.metadata || new Map();
  this.metadata.set('suspensionReason', reason);
  this.metadata.set('suspendedAt', new Date());
  
  await this.save();
  return this;
};

/**
 * Reactivate tenant
 */
TenantSchema.methods.reactivate = async function() {
  this.status = 'active';
  this.metadata = this.metadata || new Map();
  this.metadata.set('reactivatedAt', new Date());
  
  await this.save();
  return this;
};

/**
 * Find active tenants
 */
TenantSchema.statics.findActive = function() {
  return this.find({ status: 'active' });
};

/**
 * Find tenant by slug
 */
TenantSchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug: slug.toLowerCase() });
};

const Tenant = mongoose.model('Tenant', TenantSchema);
module.exports = Tenant;
