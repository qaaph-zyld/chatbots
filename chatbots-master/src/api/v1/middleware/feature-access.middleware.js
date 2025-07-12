/**
 * Feature Access Middleware
 * 
 * Middleware to enforce feature access control based on subscription tiers
 * Restricts access to premium features based on tenant's subscription status
 */

const featureAccessService = require('../billing/services/feature-access.service');
const logger = require('../utils/logger');

/**
 * Middleware to check if a tenant has access to a specific feature
 * @param {string} featureKey - The feature key to check
 * @returns {Function} - Express middleware function
 */
const requireFeatureAccess = (featureKey) => {
  return async (req, res, next) => {
    try {
      // Get tenant ID from request
      const tenantId = req.tenantId;
      
      if (!tenantId) {
        logger.warn('Feature access check failed: No tenant ID in request');
        return res.status(403).json({
          error: 'Access denied',
          message: 'Tenant identification required'
        });
      }
      
      // Check if tenant has access to the feature
      const hasAccess = await featureAccessService.hasFeatureAccess(tenantId, featureKey);
      
      if (!hasAccess) {
        logger.info(`Feature access denied: Tenant ${tenantId} attempted to access ${featureKey}`);
        return res.status(403).json({
          error: 'Subscription required',
          message: `Your current plan does not include access to this feature`,
          feature: featureKey,
          upgradeUrl: '/billing/plans'
        });
      }
      
      // Add feature limits to request object if available
      const featureLimits = await featureAccessService.getFeatureLimits(tenantId, featureKey);
      if (featureLimits) {
        req.featureLimits = featureLimits;
      }
      
      // Access granted, continue to the next middleware
      next();
    } catch (error) {
      logger.error(`Error in feature access middleware: ${error.message}`, { error, featureKey });
      
      // Default to denying access on error
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Could not verify feature access'
      });
    }
  };
};

/**
 * Middleware to check if a tenant has access to any of the specified features
 * @param {Array<string>} featureKeys - The feature keys to check
 * @returns {Function} - Express middleware function
 */
const requireAnyFeatureAccess = (featureKeys) => {
  return async (req, res, next) => {
    try {
      // Get tenant ID from request
      const tenantId = req.tenantId;
      
      if (!tenantId) {
        logger.warn('Feature access check failed: No tenant ID in request');
        return res.status(403).json({
          error: 'Access denied',
          message: 'Tenant identification required'
        });
      }
      
      // Check if tenant has access to any of the features
      let hasAccessToAny = false;
      
      for (const featureKey of featureKeys) {
        const hasAccess = await featureAccessService.hasFeatureAccess(tenantId, featureKey);
        if (hasAccess) {
          hasAccessToAny = true;
          break;
        }
      }
      
      if (!hasAccessToAny) {
        logger.info(`Feature access denied: Tenant ${tenantId} attempted to access features: ${featureKeys.join(', ')}`);
        return res.status(403).json({
          error: 'Subscription required',
          message: `Your current plan does not include access to any of the required features`,
          features: featureKeys,
          upgradeUrl: '/billing/plans'
        });
      }
      
      // Access granted, continue to the next middleware
      next();
    } catch (error) {
      logger.error(`Error in feature access middleware: ${error.message}`, { error, featureKeys });
      
      // Default to denying access on error
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Could not verify feature access'
      });
    }
  };
};

/**
 * Middleware to check if a tenant has access to all of the specified features
 * @param {Array<string>} featureKeys - The feature keys to check
 * @returns {Function} - Express middleware function
 */
const requireAllFeaturesAccess = (featureKeys) => {
  return async (req, res, next) => {
    try {
      // Get tenant ID from request
      const tenantId = req.tenantId;
      
      if (!tenantId) {
        logger.warn('Feature access check failed: No tenant ID in request');
        return res.status(403).json({
          error: 'Access denied',
          message: 'Tenant identification required'
        });
      }
      
      // Check if tenant has access to all of the features
      const missingFeatures = [];
      
      for (const featureKey of featureKeys) {
        const hasAccess = await featureAccessService.hasFeatureAccess(tenantId, featureKey);
        if (!hasAccess) {
          missingFeatures.push(featureKey);
        }
      }
      
      if (missingFeatures.length > 0) {
        logger.info(`Feature access denied: Tenant ${tenantId} missing access to features: ${missingFeatures.join(', ')}`);
        return res.status(403).json({
          error: 'Subscription required',
          message: `Your current plan does not include access to all required features`,
          missingFeatures,
          upgradeUrl: '/billing/plans'
        });
      }
      
      // Access granted, continue to the next middleware
      next();
    } catch (error) {
      logger.error(`Error in feature access middleware: ${error.message}`, { error, featureKeys });
      
      // Default to denying access on error
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Could not verify feature access'
      });
    }
  };
};

/**
 * Middleware to check usage limits for a feature
 * @param {string} featureKey - The feature key to check
 * @param {Function} usageCalculator - Function that returns current usage count
 * @param {string} limitType - The type of limit to check (e.g., 'monthly', 'total')
 * @returns {Function} - Express middleware function
 */
const checkFeatureUsageLimit = (featureKey, usageCalculator, limitType = 'monthly') => {
  return async (req, res, next) => {
    try {
      // Get tenant ID from request
      const tenantId = req.tenantId;
      
      if (!tenantId) {
        logger.warn('Feature usage check failed: No tenant ID in request');
        return res.status(403).json({
          error: 'Access denied',
          message: 'Tenant identification required'
        });
      }
      
      // Get feature limits
      const featureLimits = await featureAccessService.getFeatureLimits(tenantId, featureKey);
      
      // If no limits defined, allow access
      if (!featureLimits || !featureLimits.limits || !featureLimits.limits[limitType]) {
        return next();
      }
      
      // Get current usage
      const currentUsage = await usageCalculator(tenantId);
      const limit = featureLimits.limits[limitType];
      
      // Check if usage exceeds limit
      if (currentUsage >= limit) {
        logger.info(`Usage limit exceeded: Tenant ${tenantId} reached ${limitType} limit for ${featureKey}`);
        return res.status(403).json({
          error: 'Usage limit exceeded',
          message: `You have reached your ${limitType} limit for this feature`,
          feature: featureKey,
          limit,
          currentUsage,
          upgradeUrl: '/billing/plans'
        });
      }
      
      // Add usage info to request object
      req.featureUsage = {
        feature: featureKey,
        limitType,
        limit,
        currentUsage,
        remaining: limit - currentUsage
      };
      
      // Limit not exceeded, continue to the next middleware
      next();
    } catch (error) {
      logger.error(`Error in feature usage middleware: ${error.message}`, { error, featureKey, limitType });
      
      // Default to allowing access on error
      next();
    }
  };
};

module.exports = {
  requireFeatureAccess,
  requireAnyFeatureAccess,
  requireAllFeaturesAccess,
  checkFeatureUsageLimit
};
