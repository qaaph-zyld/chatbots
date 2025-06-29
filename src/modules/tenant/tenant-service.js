/**
 * Multi-Tenant Service Module
 * 
 * Provides tenant management capabilities for the chatbot platform,
 * enabling isolation and customization for different organizations.
 */

const mongoose = require('mongoose');
const { logger } = require('../../utils/logger');
const { v4: uuidv4 } = require('uuid');

// Initialize models
let Tenant = null;
let TenantSettings = null;

/**
 * Initialize the tenant service
 * 
 * @param {Object} db - MongoDB connection
 * @returns {Promise<void>}
 */
const initialize = async (db) => {
  try {
    // Define tenant schema
    const tenantSchema = new mongoose.Schema({
      tenantId: {
        type: String,
        required: true,
        unique: true,
        default: () => uuidv4()
      },
      name: {
        type: String,
        required: true
      },
      domain: {
        type: String,
        required: false
      },
      status: {
        type: String,
        enum: ['active', 'inactive', 'suspended', 'trial'],
        default: 'active'
      },
      plan: {
        type: String,
        enum: ['free', 'basic', 'professional', 'enterprise'],
        default: 'free'
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      updatedAt: {
        type: Date,
        default: Date.now
      },
      metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
      }
    }, { timestamps: true });

    // Define tenant settings schema
    const tenantSettingsSchema = new mongoose.Schema({
      tenantId: {
        type: String,
        required: true,
        unique: true
      },
      branding: {
        logo: String,
        primaryColor: String,
        secondaryColor: String,
        fontFamily: String
      },
      features: {
        type: Map,
        of: Boolean,
        default: {
          knowledgeBase: true,
          analytics: true,
          templates: true,
          customization: true
        }
      },
      limits: {
        maxChatbots: {
          type: Number,
          default: 5
        },
        maxConversationsPerMonth: {
          type: Number,
          default: 1000
        },
        maxStorageGB: {
          type: Number,
          default: 1
        }
      },
      integrations: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {}
      },
      security: {
        ipWhitelist: {
          type: [String],
          default: []
        },
        ssoEnabled: {
          type: Boolean,
          default: false
        },
        ssoProvider: {
          type: String,
          default: null
        },
        ssoConfig: {
          type: mongoose.Schema.Types.Mixed,
          default: {}
        }
      }
    }, { timestamps: true });

    // Create models
    Tenant = mongoose.model('Tenant', tenantSchema);
    TenantSettings = mongoose.model('TenantSettings', tenantSettingsSchema);

    logger.info('Tenant Service: Initialized successfully');
  } catch (err) {
    logger.error(`Tenant Service: Initialization failed: ${err.message}`);
    throw err;
  }
};

/**
 * Create a new tenant
 * 
 * @param {Object} tenantData - Tenant data
 * @returns {Promise<Object>} - Created tenant
 */
const createTenant = async (tenantData) => {
  if (!Tenant || !TenantSettings) {
    throw new Error('Tenant Service: Not initialized');
  }

  try {
    // Validate required fields
    if (!tenantData.name) {
      throw new Error('Missing required field: name');
    }

    // Create tenant
    const tenant = new Tenant(tenantData);
    await tenant.save();

    // Create default tenant settings
    const tenantSettings = new TenantSettings({
      tenantId: tenant.tenantId
    });
    await tenantSettings.save();

    logger.info(`Tenant Service: Created tenant ${tenant.tenantId}`);
    return tenant;
  } catch (err) {
    logger.error(`Tenant Service: Error creating tenant: ${err.message}`);
    throw err;
  }
};

/**
 * Get a tenant by ID
 * 
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<Object>} - Tenant object
 */
const getTenant = async (tenantId) => {
  if (!Tenant) {
    throw new Error('Tenant Service: Not initialized');
  }

  try {
    const tenant = await Tenant.findOne({ tenantId });
    if (!tenant) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }
    return tenant;
  } catch (err) {
    logger.error(`Tenant Service: Error retrieving tenant: ${err.message}`);
    throw err;
  }
};

/**
 * Update a tenant
 * 
 * @param {string} tenantId - Tenant ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} - Updated tenant
 */
const updateTenant = async (tenantId, updateData) => {
  if (!Tenant) {
    throw new Error('Tenant Service: Not initialized');
  }

  try {
    const tenant = await Tenant.findOneAndUpdate(
      { tenantId },
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );

    if (!tenant) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }

    logger.info(`Tenant Service: Updated tenant ${tenantId}`);
    return tenant;
  } catch (err) {
    logger.error(`Tenant Service: Error updating tenant: ${err.message}`);
    throw err;
  }
};

/**
 * Delete a tenant
 * 
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<boolean>} - True if successful
 */
const deleteTenant = async (tenantId) => {
  if (!Tenant || !TenantSettings) {
    throw new Error('Tenant Service: Not initialized');
  }

  try {
    // Delete tenant
    const result = await Tenant.deleteOne({ tenantId });
    if (result.deletedCount === 0) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }

    // Delete tenant settings
    await TenantSettings.deleteOne({ tenantId });

    logger.info(`Tenant Service: Deleted tenant ${tenantId}`);
    return true;
  } catch (err) {
    logger.error(`Tenant Service: Error deleting tenant: ${err.message}`);
    throw err;
  }
};

/**
 * List all tenants
 * 
 * @param {Object} options - List options
 * @param {number} options.limit - Maximum number of results
 * @param {number} options.offset - Offset for pagination
 * @param {Object} options.filter - Filter criteria
 * @returns {Promise<Object[]>} - List of tenants
 */
const listTenants = async (options = {}) => {
  if (!Tenant) {
    throw new Error('Tenant Service: Not initialized');
  }

  try {
    const { limit = 100, offset = 0, filter = {} } = options;

    const tenants = await Tenant.find(filter)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    const total = await Tenant.countDocuments(filter);

    return {
      tenants,
      pagination: {
        total,
        limit,
        offset
      }
    };
  } catch (err) {
    logger.error(`Tenant Service: Error listing tenants: ${err.message}`);
    throw err;
  }
};

/**
 * Get tenant settings
 * 
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<Object>} - Tenant settings
 */
const getTenantSettings = async (tenantId) => {
  if (!TenantSettings) {
    throw new Error('Tenant Service: Not initialized');
  }

  try {
    const settings = await TenantSettings.findOne({ tenantId });
    if (!settings) {
      throw new Error(`Tenant settings not found: ${tenantId}`);
    }
    return settings;
  } catch (err) {
    logger.error(`Tenant Service: Error retrieving tenant settings: ${err.message}`);
    throw err;
  }
};

/**
 * Update tenant settings
 * 
 * @param {string} tenantId - Tenant ID
 * @param {Object} updateData - Settings to update
 * @returns {Promise<Object>} - Updated tenant settings
 */
const updateTenantSettings = async (tenantId, updateData) => {
  if (!TenantSettings) {
    throw new Error('Tenant Service: Not initialized');
  }

  try {
    const settings = await TenantSettings.findOneAndUpdate(
      { tenantId },
      updateData,
      { new: true, upsert: true }
    );

    logger.info(`Tenant Service: Updated settings for tenant ${tenantId}`);
    return settings;
  } catch (err) {
    logger.error(`Tenant Service: Error updating tenant settings: ${err.message}`);
    throw err;
  }
};

/**
 * Check if a tenant has a specific feature enabled
 * 
 * @param {string} tenantId - Tenant ID
 * @param {string} featureName - Feature name
 * @returns {Promise<boolean>} - True if feature is enabled
 */
const isFeatureEnabled = async (tenantId, featureName) => {
  if (!TenantSettings) {
    throw new Error('Tenant Service: Not initialized');
  }

  try {
    const settings = await TenantSettings.findOne({ tenantId });
    if (!settings) {
      throw new Error(`Tenant settings not found: ${tenantId}`);
    }

    return settings.features.get(featureName) === true;
  } catch (err) {
    logger.error(`Tenant Service: Error checking feature: ${err.message}`);
    throw err;
  }
};

/**
 * Check if a tenant has reached a specific limit
 * 
 * @param {string} tenantId - Tenant ID
 * @param {string} limitName - Limit name
 * @param {number} currentValue - Current value to check against the limit
 * @returns {Promise<boolean>} - True if limit is reached
 */
const isLimitReached = async (tenantId, limitName, currentValue) => {
  if (!TenantSettings) {
    throw new Error('Tenant Service: Not initialized');
  }

  try {
    const settings = await TenantSettings.findOne({ tenantId });
    if (!settings) {
      throw new Error(`Tenant settings not found: ${tenantId}`);
    }

    const limit = settings.limits[limitName];
    if (limit === undefined) {
      throw new Error(`Unknown limit: ${limitName}`);
    }

    return currentValue >= limit;
  } catch (err) {
    logger.error(`Tenant Service: Error checking limit: ${err.message}`);
    throw err;
  }
};

/**
 * Create a middleware for tenant resolution
 * 
 * @returns {Function} Express middleware
 */
const tenantMiddleware = () => {
  return async (req, res, next) => {
    try {
      // Try to resolve tenant from various sources
      const tenantId = 
        req.headers['x-tenant-id'] || 
        req.query.tenantId || 
        (req.session && req.session.tenantId);
      
      if (!tenantId) {
        return next();
      }
      
      // Get tenant
      const tenant = await getTenant(tenantId);
      
      // Attach tenant to request
      req.tenant = tenant;
      
      next();
    } catch (err) {
      logger.error(`Tenant Middleware: ${err.message}`);
      next();
    }
  };
};

module.exports = {
  initialize,
  createTenant,
  getTenant,
  updateTenant,
  deleteTenant,
  listTenants,
  getTenantSettings,
  updateTenantSettings,
  isFeatureEnabled,
  isLimitReached,
  tenantMiddleware
};