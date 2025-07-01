/**
 * Tenant Service
 * 
 * Provides business logic for tenant management in the chatbot platform
 */

const Tenant = require('../models/tenant.model');
const mongoose = require('mongoose');
const logger = require('../../utils/logger');
const slugify = require('slugify');

/**
 * Service for managing tenant operations
 */
class TenantService {
  /**
   * Create a new tenant
   * @param {Object} tenantData - Tenant data
   * @returns {Promise<Object>} Created tenant
   */
  async createTenant(tenantData) {
    try {
      // Generate slug from name
      const baseSlug = slugify(tenantData.name, { 
        lower: true,
        strict: true,
        trim: true
      });
      
      // Check if slug exists and make it unique if needed
      let slug = baseSlug;
      let counter = 1;
      
      while (await Tenant.findOne({ slug })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      
      // Create tenant
      const tenant = new Tenant({
        name: tenantData.name,
        slug,
        organizationDetails: tenantData.organizationDetails || {},
        contactDetails: {
          email: tenantData.email,
          phone: tenantData.phone,
          address: tenantData.address
        },
        settings: tenantData.settings || {},
        limits: tenantData.limits || {},
        createdBy: tenantData.createdBy
      });
      
      await tenant.save();
      
      logger.info(`Created tenant: ${tenant.name} (${tenant._id})`);
      
      return tenant;
    } catch (error) {
      logger.error(`Error creating tenant: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get tenant by ID
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Object>} Tenant
   */
  async getTenant(tenantId) {
    try {
      const tenant = await Tenant.findById(tenantId);
      
      if (!tenant) {
        throw new Error('Tenant not found');
      }
      
      return tenant;
    } catch (error) {
      logger.error(`Error getting tenant: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get tenant by slug
   * @param {string} slug - Tenant slug
   * @returns {Promise<Object>} Tenant
   */
  async getTenantBySlug(slug) {
    try {
      const tenant = await Tenant.findBySlug(slug);
      
      if (!tenant) {
        throw new Error('Tenant not found');
      }
      
      return tenant;
    } catch (error) {
      logger.error(`Error getting tenant by slug: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update tenant
   * @param {string} tenantId - Tenant ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated tenant
   */
  async updateTenant(tenantId, updateData) {
    try {
      const tenant = await Tenant.findById(tenantId);
      
      if (!tenant) {
        throw new Error('Tenant not found');
      }
      
      // Update allowed fields
      if (updateData.name) tenant.name = updateData.name;
      if (updateData.status) tenant.status = updateData.status;
      if (updateData.organizationDetails) tenant.organizationDetails = {
        ...tenant.organizationDetails,
        ...updateData.organizationDetails
      };
      if (updateData.contactDetails) tenant.contactDetails = {
        ...tenant.contactDetails,
        ...updateData.contactDetails
      };
      if (updateData.settings) tenant.settings = {
        ...tenant.settings,
        ...updateData.settings
      };
      if (updateData.limits) tenant.limits = {
        ...tenant.limits,
        ...updateData.limits
      };
      
      await tenant.save();
      
      logger.info(`Updated tenant: ${tenant.name} (${tenant._id})`);
      
      return tenant;
    } catch (error) {
      logger.error(`Error updating tenant: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete tenant
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteTenant(tenantId) {
    try {
      const tenant = await Tenant.findById(tenantId);
      
      if (!tenant) {
        throw new Error('Tenant not found');
      }
      
      // Soft delete by changing status
      tenant.status = 'deleted';
      await tenant.save();
      
      logger.info(`Deleted tenant: ${tenant.name} (${tenant._id})`);
      
      return true;
    } catch (error) {
      logger.error(`Error deleting tenant: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate API key for tenant
   * @param {string} tenantId - Tenant ID
   * @param {string} name - API key name
   * @param {Array<string>} permissions - API key permissions
   * @param {number} expiresInDays - Days until expiration
   * @returns {Promise<string>} Generated API key
   */
  async generateApiKey(tenantId, name, permissions = ['read'], expiresInDays = 365) {
    try {
      const tenant = await Tenant.findById(tenantId);
      
      if (!tenant) {
        throw new Error('Tenant not found');
      }
      
      const apiKey = await tenant.generateApiKey(name, permissions, expiresInDays);
      
      logger.info(`Generated API key for tenant: ${tenant.name} (${tenant._id})`);
      
      return apiKey;
    } catch (error) {
      logger.error(`Error generating API key: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validate API key
   * @param {string} apiKey - API key to validate
   * @returns {Promise<Object>} Validation result with tenant
   */
  async validateApiKey(apiKey) {
    try {
      // Extract tenant slug from API key (format: slug_randomhex)
      const parts = apiKey.split('_');
      if (parts.length < 2) {
        return { valid: false };
      }
      
      const slug = parts[0];
      const tenant = await Tenant.findBySlug(slug);
      
      if (!tenant) {
        return { valid: false };
      }
      
      const validation = tenant.validateApiKey(apiKey);
      
      if (!validation.valid) {
        return { valid: false };
      }
      
      return {
        valid: true,
        tenant,
        permissions: validation.permissions
      };
    } catch (error) {
      logger.error(`Error validating API key: ${error.message}`);
      return { valid: false };
    }
  }

  /**
   * Suspend tenant
   * @param {string} tenantId - Tenant ID
   * @param {string} reason - Suspension reason
   * @returns {Promise<Object>} Suspended tenant
   */
  async suspendTenant(tenantId, reason) {
    try {
      const tenant = await Tenant.findById(tenantId);
      
      if (!tenant) {
        throw new Error('Tenant not found');
      }
      
      await tenant.suspend(reason);
      
      logger.info(`Suspended tenant: ${tenant.name} (${tenant._id})`);
      
      return tenant;
    } catch (error) {
      logger.error(`Error suspending tenant: ${error.message}`);
      throw error;
    }
  }

  /**
   * Reactivate tenant
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Object>} Reactivated tenant
   */
  async reactivateTenant(tenantId) {
    try {
      const tenant = await Tenant.findById(tenantId);
      
      if (!tenant) {
        throw new Error('Tenant not found');
      }
      
      await tenant.reactivate();
      
      logger.info(`Reactivated tenant: ${tenant.name} (${tenant._id})`);
      
      return tenant;
    } catch (error) {
      logger.error(`Error reactivating tenant: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all tenants with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Tenants with pagination info
   */
  async getAllTenants(options = {}) {
    try {
      const page = options.page || 1;
      const limit = options.limit || 10;
      const skip = (page - 1) * limit;
      
      const query = {};
      if (options.status) query.status = options.status;
      if (options.search) {
        query.$or = [
          { name: { $regex: options.search, $options: 'i' } },
          { slug: { $regex: options.search, $options: 'i' } },
          { 'contactDetails.email': { $regex: options.search, $options: 'i' } }
        ];
      }
      
      const [tenants, total] = await Promise.all([
        Tenant.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Tenant.countDocuments(query)
      ]);
      
      return {
        tenants,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error(`Error getting all tenants: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update tenant limits
   * @param {string} tenantId - Tenant ID
   * @param {Object} limits - New limits
   * @returns {Promise<Object>} Updated tenant
   */
  async updateTenantLimits(tenantId, limits) {
    try {
      const tenant = await Tenant.findById(tenantId);
      
      if (!tenant) {
        throw new Error('Tenant not found');
      }
      
      tenant.limits = {
        ...tenant.limits,
        ...limits
      };
      
      await tenant.save();
      
      logger.info(`Updated limits for tenant: ${tenant.name} (${tenant._id})`);
      
      return tenant;
    } catch (error) {
      logger.error(`Error updating tenant limits: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if tenant has reached limits
   * @param {string} tenantId - Tenant ID
   * @param {string} limitType - Type of limit to check
   * @param {number} currentValue - Current value to check against limit
   * @returns {Promise<boolean>} Whether limit has been reached
   */
  async checkTenantLimit(tenantId, limitType, currentValue) {
    try {
      const tenant = await Tenant.findById(tenantId);
      
      if (!tenant) {
        throw new Error('Tenant not found');
      }
      
      // Check if limit exists
      if (!tenant.limits || !tenant.limits[limitType]) {
        return false; // No limit set
      }
      
      // Check if limit is reached
      return currentValue >= tenant.limits[limitType];
    } catch (error) {
      logger.error(`Error checking tenant limit: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new TenantService();
