/**
 * Feature Access Service
 * 
 * Handles feature gating based on subscription tiers
 * Enforces access control to premium features based on subscription status
 */

const Subscription = require('../models/subscription.model');
const Plan = require('../models/plan.model');
const logger = require('../../utils/logger');
const cache = require('../../utils/cache');

// Cache TTL in seconds
const CACHE_TTL = 300; // 5 minutes

/**
 * Service for managing feature access based on subscription tiers
 */
class FeatureAccessService {
  /**
   * Check if a tenant has access to a specific feature
   * @param {string} tenantId - The tenant ID
   * @param {string} featureKey - The feature key to check
   * @returns {Promise<boolean>} - Whether the tenant has access to the feature
   */
  async hasFeatureAccess(tenantId, featureKey) {
    try {
      // Check cache first
      const cacheKey = `feature_access:${tenantId}:${featureKey}`;
      const cachedResult = await cache.get(cacheKey);
      
      if (cachedResult !== null) {
        return cachedResult === 'true';
      }
      
      // Get active subscription for tenant
      const subscription = await Subscription.findOne({
        tenantId,
        status: 'active'
      }).populate('plan');
      
      // If no active subscription, deny access to premium features
      if (!subscription) {
        // Cache the negative result
        await cache.set(cacheKey, 'false', CACHE_TTL);
        return false;
      }
      
      // Check if the feature is included in the subscription plan
      const hasAccess = this._planHasFeature(subscription.plan, featureKey);
      
      // Cache the result
      await cache.set(cacheKey, hasAccess ? 'true' : 'false', CACHE_TTL);
      
      return hasAccess;
    } catch (error) {
      logger.error(`Error checking feature access: ${error.message}`, { error, tenantId, featureKey });
      // Default to denying access on error
      return false;
    }
  }
  
  /**
   * Get all features available to a tenant based on their subscription
   * @param {string} tenantId - The tenant ID
   * @returns {Promise<Object>} - Object with feature keys and access status
   */
  async getTenantFeatures(tenantId) {
    try {
      // Check cache first
      const cacheKey = `tenant_features:${tenantId}`;
      const cachedFeatures = await cache.get(cacheKey);
      
      if (cachedFeatures) {
        return JSON.parse(cachedFeatures);
      }
      
      // Get active subscription for tenant
      const subscription = await Subscription.findOne({
        tenantId,
        status: 'active'
      }).populate('plan');
      
      // Get all available features
      const allFeatures = await this._getAllFeatures();
      
      // If no active subscription, return all features as false
      if (!subscription) {
        const features = {};
        allFeatures.forEach(feature => {
          features[feature] = false;
        });
        
        // Cache the result
        await cache.set(cacheKey, JSON.stringify(features), CACHE_TTL);
        
        return features;
      }
      
      // Determine which features the tenant has access to
      const features = {};
      allFeatures.forEach(feature => {
        features[feature] = this._planHasFeature(subscription.plan, feature);
      });
      
      // Cache the result
      await cache.set(cacheKey, JSON.stringify(features), CACHE_TTL);
      
      return features;
    } catch (error) {
      logger.error(`Error getting tenant features: ${error.message}`, { error, tenantId });
      return {};
    }
  }
  
  /**
   * Invalidate feature access cache for a tenant
   * @param {string} tenantId - The tenant ID
   */
  async invalidateCache(tenantId) {
    try {
      // Delete tenant features cache
      await cache.del(`tenant_features:${tenantId}`);
      
      // Get all features to delete individual feature access caches
      const allFeatures = await this._getAllFeatures();
      
      // Delete individual feature access caches
      for (const feature of allFeatures) {
        await cache.del(`feature_access:${tenantId}:${feature}`);
      }
    } catch (error) {
      logger.error(`Error invalidating feature access cache: ${error.message}`, { error, tenantId });
    }
  }
  
  /**
   * Get all available features across all plans
   * @returns {Promise<Array<string>>} - Array of feature keys
   * @private
   */
  async _getAllFeatures() {
    try {
      // Check cache first
      const cacheKey = 'all_features';
      const cachedFeatures = await cache.get(cacheKey);
      
      if (cachedFeatures) {
        return JSON.parse(cachedFeatures);
      }
      
      // Get all plans
      const plans = await Plan.find();
      
      // Extract unique features from all plans
      const features = new Set();
      
      plans.forEach(plan => {
        if (plan.features && Array.isArray(plan.features)) {
          plan.features.forEach(feature => {
            if (typeof feature === 'string') {
              features.add(feature);
            } else if (feature.key) {
              features.add(feature.key);
            }
          });
        }
      });
      
      const featureArray = Array.from(features);
      
      // Cache the result
      await cache.set(cacheKey, JSON.stringify(featureArray), CACHE_TTL * 2);
      
      return featureArray;
    } catch (error) {
      logger.error(`Error getting all features: ${error.message}`, { error });
      return [];
    }
  }
  
  /**
   * Check if a plan includes a specific feature
   * @param {Object} plan - The subscription plan
   * @param {string} featureKey - The feature key to check
   * @returns {boolean} - Whether the plan includes the feature
   * @private
   */
  _planHasFeature(plan, featureKey) {
    // If no plan or features, deny access
    if (!plan || !plan.features || !Array.isArray(plan.features)) {
      return false;
    }
    
    // Check if the feature is included in the plan
    return plan.features.some(feature => {
      if (typeof feature === 'string') {
        return feature === featureKey;
      }
      return feature.key === featureKey;
    });
  }
  
  /**
   * Get feature limits for a tenant based on their subscription
   * @param {string} tenantId - The tenant ID
   * @param {string} featureKey - The feature key to check
   * @returns {Promise<Object|null>} - Feature limits or null if not available
   */
  async getFeatureLimits(tenantId, featureKey) {
    try {
      // Check cache first
      const cacheKey = `feature_limits:${tenantId}:${featureKey}`;
      const cachedLimits = await cache.get(cacheKey);
      
      if (cachedLimits) {
        return JSON.parse(cachedLimits);
      }
      
      // Get active subscription for tenant
      const subscription = await Subscription.findOne({
        tenantId,
        status: 'active'
      }).populate('plan');
      
      // If no active subscription, return null
      if (!subscription) {
        await cache.set(cacheKey, JSON.stringify(null), CACHE_TTL);
        return null;
      }
      
      // Find the feature in the plan
      const feature = subscription.plan.features.find(f => {
        if (typeof f === 'string') {
          return f === featureKey;
        }
        return f.key === featureKey;
      });
      
      // If feature not found or is just a string (no limits), return null
      if (!feature || typeof feature === 'string') {
        await cache.set(cacheKey, JSON.stringify(null), CACHE_TTL);
        return null;
      }
      
      // Return the feature limits
      const limits = {
        key: feature.key,
        name: feature.name || feature.key,
        limits: feature.limits || {}
      };
      
      // Cache the result
      await cache.set(cacheKey, JSON.stringify(limits), CACHE_TTL);
      
      return limits;
    } catch (error) {
      logger.error(`Error getting feature limits: ${error.message}`, { error, tenantId, featureKey });
      return null;
    }
  }
}

module.exports = new FeatureAccessService();
