/**
 * Tenant Activity Monitoring Service
 * 
 * Tracks and logs tenant activities, monitors resource usage,
 * and enforces tenant-specific resource limits
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');
const redis = require('../utils/redis');
const config = require('../config');

class TenantActivityService {
  constructor() {
    this.initialized = false;
    this.activityCollection = null;
    this.resourceUsageCollection = null;
    this.tenantLimitsCollection = null;
  }

  /**
   * Initialize the tenant activity service
   * @returns {Promise<boolean>} Initialization success status
   */
  async initialize() {
    try {
      if (this.initialized) {
        return true;
      }

      // Initialize MongoDB collections if using MongoDB
      if (mongoose.connection.readyState === 1) {
        this.activityCollection = mongoose.connection.collection('tenant_activities');
        this.resourceUsageCollection = mongoose.connection.collection('tenant_resource_usage');
        this.tenantLimitsCollection = mongoose.connection.collection('tenant_limits');
        
        // Create indexes for better query performance
        await this.activityCollection.createIndex({ tenantId: 1, timestamp: -1 });
        await this.activityCollection.createIndex({ tenantId: 1, activityType: 1 });
        await this.resourceUsageCollection.createIndex({ tenantId: 1, resourceType: 1 });
      }

      this.initialized = true;
      logger.info('Tenant activity service initialized');
      return true;
    } catch (error) {
      logger.error(`Failed to initialize tenant activity service: ${error.message}`, { error });
      return false;
    }
  }

  /**
   * Log tenant activity
   * @param {Object} activity - Activity data
   * @param {string} activity.tenantId - Tenant ID
   * @param {string} activity.userId - User ID
   * @param {string} activity.activityType - Type of activity
   * @param {Object} activity.details - Activity details
   * @returns {Promise<string>} Activity ID
   */
  async logActivity(activity) {
    try {
      await this.initialize();

      const { tenantId, userId, activityType, details } = activity;
      
      if (!tenantId || !activityType) {
        throw new Error('Tenant ID and activity type are required');
      }

      const activityRecord = {
        tenantId,
        userId: userId || 'system',
        activityType,
        details: details || {},
        timestamp: new Date(),
        ipAddress: details?.ipAddress || null,
        userAgent: details?.userAgent || null
      };

      // Store in MongoDB if available
      if (this.activityCollection) {
        const result = await this.activityCollection.insertOne(activityRecord);
        logger.debug(`Logged tenant activity: ${activityType} for tenant ${tenantId}`);
        return result.insertedId.toString();
      }

      // Fallback to Redis for temporary storage
      const activityId = `activity:${tenantId}:${Date.now()}:${Math.random().toString(36).substring(2, 15)}`;
      await redis.client.set(activityId, JSON.stringify(activityRecord), 'EX', 60 * 60 * 24 * 7); // 7 days expiry
      
      logger.debug(`Logged tenant activity in Redis: ${activityType} for tenant ${tenantId}`);
      return activityId;
    } catch (error) {
      logger.error(`Failed to log tenant activity: ${error.message}`, { error });
      // Don't throw error to prevent disrupting the main application flow
      return null;
    }
  }

  /**
   * Get tenant activities with filtering and pagination
   * @param {Object} params - Query parameters
   * @param {string} params.tenantId - Tenant ID
   * @param {string} [params.userId] - Filter by user ID
   * @param {string} [params.activityType] - Filter by activity type
   * @param {Date} [params.startDate] - Filter by start date
   * @param {Date} [params.endDate] - Filter by end date
   * @param {number} [params.limit=100] - Maximum number of results
   * @param {number} [params.offset=0] - Offset for pagination
   * @returns {Promise<Array<Object>>} List of activities
   */
  async getActivities(params) {
    try {
      await this.initialize();

      const { 
        tenantId, 
        userId, 
        activityType, 
        startDate, 
        endDate, 
        limit = 100, 
        offset = 0 
      } = params;
      
      if (!tenantId) {
        throw new Error('Tenant ID is required');
      }

      // Build query filter
      const filter = { tenantId };
      
      if (userId) filter.userId = userId;
      if (activityType) filter.activityType = activityType;
      
      if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate) filter.timestamp.$gte = new Date(startDate);
        if (endDate) filter.timestamp.$lte = new Date(endDate);
      }

      // Query MongoDB if available
      if (this.activityCollection) {
        const activities = await this.activityCollection
          .find(filter)
          .sort({ timestamp: -1 })
          .skip(offset)
          .limit(limit)
          .toArray();
        
        return activities;
      }

      // Fallback to Redis (limited functionality)
      logger.warn('MongoDB not available for tenant activity queries, falling back to Redis with limited functionality');
      return [];
    } catch (error) {
      logger.error(`Failed to get tenant activities: ${error.message}`, { error });
      throw error;
    }
  }

  /**
   * Track resource usage for a tenant
   * @param {Object} usage - Resource usage data
   * @param {string} usage.tenantId - Tenant ID
   * @param {string} usage.resourceType - Type of resource (e.g., 'api_calls', 'storage', 'conversations')
   * @param {number} usage.amount - Amount of resource used
   * @param {Object} [usage.metadata] - Additional metadata
   * @returns {Promise<boolean>} Success status
   */
  async trackResourceUsage(usage) {
    try {
      await this.initialize();

      const { tenantId, resourceType, amount, metadata } = usage;
      
      if (!tenantId || !resourceType || typeof amount !== 'number') {
        throw new Error('Tenant ID, resource type, and amount are required');
      }

      const timestamp = new Date();
      const period = this._getCurrentPeriod();

      // Update MongoDB if available
      if (this.resourceUsageCollection) {
        // Update current usage for the period
        await this.resourceUsageCollection.updateOne(
          { tenantId, resourceType, period },
          { 
            $inc: { amount },
            $setOnInsert: { 
              firstUsage: timestamp,
              metadata: metadata || {}
            },
            $set: { 
              lastUsage: timestamp,
              lastUpdated: timestamp
            }
          },
          { upsert: true }
        );

        // Also update total usage (across all periods)
        await this.resourceUsageCollection.updateOne(
          { tenantId, resourceType, period: 'total' },
          { 
            $inc: { amount },
            $set: { lastUpdated: timestamp }
          },
          { upsert: true }
        );

        logger.debug(`Tracked resource usage: ${resourceType} +${amount} for tenant ${tenantId}`);
        return true;
      }

      // Fallback to Redis for temporary storage
      const key = `resource:${tenantId}:${resourceType}:${period}`;
      const totalKey = `resource:${tenantId}:${resourceType}:total`;
      
      await redis.client.incrby(key, amount);
      await redis.client.incrby(totalKey, amount);
      
      // Set expiry for period keys (not for total)
      await redis.client.expire(key, 60 * 60 * 24 * 90); // 90 days
      
      logger.debug(`Tracked resource usage in Redis: ${resourceType} +${amount} for tenant ${tenantId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to track resource usage: ${error.message}`, { error });
      // Don't throw error to prevent disrupting the main application flow
      return false;
    }
  }

  /**
   * Get current resource usage for a tenant
   * @param {string} tenantId - Tenant ID
   * @param {string} resourceType - Type of resource
   * @param {string} [period] - Period to check (current month by default)
   * @returns {Promise<number>} Current usage amount
   */
  async getCurrentUsage(tenantId, resourceType, period = null) {
    try {
      await this.initialize();

      if (!tenantId || !resourceType) {
        throw new Error('Tenant ID and resource type are required');
      }

      const queryPeriod = period || this._getCurrentPeriod();

      // Query MongoDB if available
      if (this.resourceUsageCollection) {
        const usage = await this.resourceUsageCollection.findOne(
          { tenantId, resourceType, period: queryPeriod }
        );
        
        return usage ? usage.amount : 0;
      }

      // Fallback to Redis
      const key = `resource:${tenantId}:${resourceType}:${queryPeriod}`;
      const value = await redis.client.get(key);
      
      return value ? parseInt(value, 10) : 0;
    } catch (error) {
      logger.error(`Failed to get current resource usage: ${error.message}`, { error });
      return 0;
    }
  }

  /**
   * Set resource limits for a tenant
   * @param {string} tenantId - Tenant ID
   * @param {Object} limits - Resource limits
   * @returns {Promise<boolean>} Success status
   */
  async setResourceLimits(tenantId, limits) {
    try {
      await this.initialize();

      if (!tenantId || !limits || typeof limits !== 'object') {
        throw new Error('Tenant ID and limits object are required');
      }

      // Update MongoDB if available
      if (this.tenantLimitsCollection) {
        await this.tenantLimitsCollection.updateOne(
          { tenantId },
          { 
            $set: { 
              ...limits,
              lastUpdated: new Date()
            }
          },
          { upsert: true }
        );

        logger.debug(`Set resource limits for tenant ${tenantId}`);
        return true;
      }

      // Fallback to Redis for temporary storage
      const key = `limits:${tenantId}`;
      await redis.client.set(key, JSON.stringify({
        ...limits,
        lastUpdated: new Date()
      }));
      
      logger.debug(`Set resource limits in Redis for tenant ${tenantId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to set resource limits: ${error.message}`, { error });
      throw error;
    }
  }

  /**
   * Get resource limits for a tenant
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Object>} Resource limits
   */
  async getResourceLimits(tenantId) {
    try {
      await this.initialize();

      if (!tenantId) {
        throw new Error('Tenant ID is required');
      }

      // Query MongoDB if available
      if (this.tenantLimitsCollection) {
        const limits = await this.tenantLimitsCollection.findOne({ tenantId });
        return limits || {};
      }

      // Fallback to Redis
      const key = `limits:${tenantId}`;
      const value = await redis.client.get(key);
      
      return value ? JSON.parse(value) : {};
    } catch (error) {
      logger.error(`Failed to get resource limits: ${error.message}`, { error });
      return {};
    }
  }

  /**
   * Check if a tenant has exceeded resource limits
   * @param {string} tenantId - Tenant ID
   * @param {string} resourceType - Type of resource
   * @returns {Promise<boolean>} True if limit is exceeded
   */
  async isLimitExceeded(tenantId, resourceType) {
    try {
      if (!tenantId || !resourceType) {
        throw new Error('Tenant ID and resource type are required');
      }

      // Get current limits and usage
      const limits = await this.getResourceLimits(tenantId);
      
      // If no limit is set for this resource type, assume not exceeded
      if (!limits[resourceType]) {
        return false;
      }
      
      const usage = await this.getCurrentUsage(tenantId, resourceType);
      
      // Check if usage exceeds limit
      return usage >= limits[resourceType];
    } catch (error) {
      logger.error(`Failed to check resource limit: ${error.message}`, { error });
      // In case of error, default to not exceeded to prevent blocking legitimate requests
      return false;
    }
  }

  /**
   * Get resource usage report for a tenant
   * @param {string} tenantId - Tenant ID
   * @param {Array<string>} [resourceTypes] - Resource types to include (all if not specified)
   * @param {string} [period] - Period to check (current month by default)
   * @returns {Promise<Object>} Usage report
   */
  async getUsageReport(tenantId, resourceTypes = null, period = null) {
    try {
      await this.initialize();

      if (!tenantId) {
        throw new Error('Tenant ID is required');
      }

      const queryPeriod = period || this._getCurrentPeriod();
      const report = {
        tenantId,
        period: queryPeriod,
        timestamp: new Date(),
        resources: {}
      };

      // Query MongoDB if available
      if (this.resourceUsageCollection) {
        const filter = { tenantId, period: queryPeriod };
        
        // Filter by resource types if specified
        if (resourceTypes && Array.isArray(resourceTypes) && resourceTypes.length > 0) {
          filter.resourceType = { $in: resourceTypes };
        }
        
        const usages = await this.resourceUsageCollection.find(filter).toArray();
        
        // Get limits for comparison
        const limits = await this.getResourceLimits(tenantId);
        
        // Build report
        for (const usage of usages) {
          report.resources[usage.resourceType] = {
            usage: usage.amount,
            limit: limits[usage.resourceType] || null,
            percentage: limits[usage.resourceType] 
              ? Math.round((usage.amount / limits[usage.resourceType]) * 100) 
              : null,
            lastUsage: usage.lastUsage
          };
        }
        
        return report;
      }

      // Fallback to Redis with limited functionality
      logger.warn('MongoDB not available for usage reports, falling back to Redis with limited functionality');
      
      // Get limits
      const limits = await this.getResourceLimits(tenantId);
      
      // If resource types specified, query only those
      if (resourceTypes && Array.isArray(resourceTypes)) {
        for (const type of resourceTypes) {
          const key = `resource:${tenantId}:${type}:${queryPeriod}`;
          const value = await redis.client.get(key);
          const usage = value ? parseInt(value, 10) : 0;
          
          report.resources[type] = {
            usage,
            limit: limits[type] || null,
            percentage: limits[type] ? Math.round((usage / limits[type]) * 100) : null,
            lastUsage: new Date() // Not accurate from Redis
          };
        }
      }
      
      return report;
    } catch (error) {
      logger.error(`Failed to get usage report: ${error.message}`, { error });
      throw error;
    }
  }

  /**
   * Get the current period string (YYYY-MM)
   * @private
   * @returns {string} Current period
   */
  _getCurrentPeriod() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}

module.exports = new TenantActivityService();
