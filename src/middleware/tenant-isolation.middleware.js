/**
 * Tenant Isolation Middleware
 * 
 * Enforces strict multi-tenant isolation by validating tenant access permissions
 * and preventing cross-tenant data access
 */

const { logger } = require('../utils/logger');
const { TenantAccessError } = require('../utils/errors');

/**
 * Middleware to enforce tenant isolation
 * Ensures users can only access resources belonging to their tenant
 * 
 * @param {Object} options - Configuration options
 * @param {string} [options.tenantIdParam='tenantId'] - Name of the tenant ID parameter in request
 * @param {boolean} [options.allowSuperAdmin=false] - Whether to allow super admins to bypass tenant isolation
 * @param {Array<string>} [options.excludePaths=[]] - Paths to exclude from tenant isolation checks
 * @returns {Function} Express middleware function
 */
function tenantIsolation(options = {}) {
  const {
    tenantIdParam = 'tenantId',
    allowSuperAdmin = false,
    excludePaths = []
  } = options;

  return (req, res, next) => {
    try {
      // Skip tenant isolation for excluded paths
      if (excludePaths.some(path => req.path.startsWith(path))) {
        return next();
      }

      // Skip if no user or tenant information is available
      if (!req.user || !req.user.tenantId) {
        logger.warn('Tenant isolation middleware: No user or tenant information available');
        return next(new TenantAccessError('Tenant information not available'));
      }

      // Allow super admins to bypass tenant isolation if configured
      if (allowSuperAdmin && req.user.role === 'superadmin') {
        logger.debug('Tenant isolation middleware: Super admin bypass');
        return next();
      }

      // Get tenant ID from request parameters, body, or query
      let resourceTenantId = null;
      
      if (req.params && req.params[tenantIdParam]) {
        resourceTenantId = req.params[tenantIdParam];
      } else if (req.body && req.body[tenantIdParam]) {
        resourceTenantId = req.body[tenantIdParam];
      } else if (req.query && req.query[tenantIdParam]) {
        resourceTenantId = req.query[tenantIdParam];
      }

      // If no resource tenant ID is found, we can't validate - let the route handler deal with it
      if (!resourceTenantId) {
        return next();
      }

      // Validate tenant access
      if (resourceTenantId !== req.user.tenantId) {
        logger.warn(`Tenant isolation violation: User from tenant ${req.user.tenantId} attempted to access resource from tenant ${resourceTenantId}`);
        return next(new TenantAccessError('Access denied to resource from another tenant'));
      }

      // Tenant access is valid
      next();
    } catch (error) {
      logger.error(`Tenant isolation middleware error: ${error.message}`, { error });
      next(error);
    }
  };
}

/**
 * Middleware to enforce tenant data isolation in request body
 * Ensures tenantId in request body matches the user's tenant
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} [options.allowSuperAdmin=false] - Whether to allow super admins to bypass tenant isolation
 * @returns {Function} Express middleware function
 */
function tenantDataIsolation(options = {}) {
  const { allowSuperAdmin = false } = options;

  return (req, res, next) => {
    try {
      // Skip if no request body or user information
      if (!req.body || !req.user || !req.user.tenantId) {
        return next();
      }

      // Allow super admins to bypass tenant isolation if configured
      if (allowSuperAdmin && req.user.role === 'superadmin') {
        return next();
      }

      // If request body contains tenantId, ensure it matches the user's tenant
      if (req.body.tenantId && req.body.tenantId !== req.user.tenantId) {
        logger.warn(`Tenant data isolation violation: User from tenant ${req.user.tenantId} attempted to set tenantId to ${req.body.tenantId}`);
        return next(new TenantAccessError('Cannot set tenantId to a different tenant'));
      }

      // If request contains an array of items with tenantIds, validate each one
      if (Array.isArray(req.body)) {
        for (let i = 0; i < req.body.length; i++) {
          if (req.body[i].tenantId && req.body[i].tenantId !== req.user.tenantId) {
            logger.warn(`Tenant data isolation violation in array item ${i}: User from tenant ${req.user.tenantId} attempted to set tenantId to ${req.body[i].tenantId}`);
            return next(new TenantAccessError('Cannot set tenantId to a different tenant'));
          }
        }
      }

      // Force set tenantId to user's tenant for create operations
      if (['POST', 'PUT'].includes(req.method) && !req.body.tenantId) {
        req.body.tenantId = req.user.tenantId;
        logger.debug(`Tenant data isolation: Set tenantId to ${req.user.tenantId} for ${req.method} request`);
      }

      next();
    } catch (error) {
      logger.error(`Tenant data isolation middleware error: ${error.message}`, { error });
      next(error);
    }
  };
}

/**
 * Middleware to enforce tenant query isolation
 * Ensures tenantId is added to database queries
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} [options.allowSuperAdmin=false] - Whether to allow super admins to bypass tenant isolation
 * @returns {Function} Express middleware function
 */
function tenantQueryIsolation(options = {}) {
  const { allowSuperAdmin = false } = options;

  return (req, res, next) => {
    try {
      // Skip if no user information
      if (!req.user || !req.user.tenantId) {
        return next();
      }

      // Allow super admins to bypass tenant isolation if configured
      if (allowSuperAdmin && req.user.role === 'superadmin') {
        return next();
      }

      // Ensure query parameters include tenantId
      if (!req.query) {
        req.query = {};
      }

      // Don't override if already set (and matches user's tenant)
      if (req.query.tenantId && req.query.tenantId !== req.user.tenantId) {
        logger.warn(`Tenant query isolation violation: User from tenant ${req.user.tenantId} attempted to query with tenantId ${req.query.tenantId}`);
        return next(new TenantAccessError('Cannot query with a different tenant ID'));
      }

      // Set tenantId in query parameters
      req.query.tenantId = req.user.tenantId;
      logger.debug(`Tenant query isolation: Set tenantId to ${req.user.tenantId} for query`);

      next();
    } catch (error) {
      logger.error(`Tenant query isolation middleware error: ${error.message}`, { error });
      next(error);
    }
  };
}

/**
 * Middleware to enforce tenant header isolation
 * Ensures X-Tenant-ID header matches the user's tenant
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} [options.allowSuperAdmin=false] - Whether to allow super admins to bypass tenant isolation
 * @returns {Function} Express middleware function
 */
function tenantHeaderIsolation(options = {}) {
  const { allowSuperAdmin = false } = options;

  return (req, res, next) => {
    try {
      // Skip if no user information
      if (!req.user || !req.user.tenantId) {
        return next();
      }

      // Allow super admins to bypass tenant isolation if configured
      if (allowSuperAdmin && req.user.role === 'superadmin') {
        return next();
      }

      // Check X-Tenant-ID header if present
      const headerTenantId = req.headers['x-tenant-id'];
      if (headerTenantId && headerTenantId !== req.user.tenantId) {
        logger.warn(`Tenant header isolation violation: User from tenant ${req.user.tenantId} used header X-Tenant-ID: ${headerTenantId}`);
        return next(new TenantAccessError('Invalid tenant ID in header'));
      }

      // Set X-Tenant-ID header for downstream services
      res.setHeader('X-Tenant-ID', req.user.tenantId);

      next();
    } catch (error) {
      logger.error(`Tenant header isolation middleware error: ${error.message}`, { error });
      next(error);
    }
  };
}

/**
 * Middleware to enforce tenant resource limits
 * Ensures tenants don't exceed their resource allocation
 * 
 * @param {Object} options - Configuration options
 * @param {Function} options.getLimits - Function to get tenant resource limits
 * @param {Function} options.getCurrentUsage - Function to get current resource usage
 * @param {string} options.resourceType - Type of resource being limited
 * @returns {Function} Express middleware function
 */
function tenantResourceLimits(options) {
  const { getLimits, getCurrentUsage, resourceType } = options;

  if (!getLimits || !getCurrentUsage || !resourceType) {
    throw new Error('Missing required options for tenant resource limits middleware');
  }

  return async (req, res, next) => {
    try {
      // Skip if no user information
      if (!req.user || !req.user.tenantId) {
        return next();
      }

      // Get tenant resource limits
      const limits = await getLimits(req.user.tenantId);
      
      // If no limits defined, allow the request
      if (!limits || !limits[resourceType]) {
        return next();
      }

      // Get current resource usage
      const usage = await getCurrentUsage(req.user.tenantId, resourceType);
      
      // Check if limit would be exceeded
      if (usage >= limits[resourceType]) {
        logger.warn(`Tenant resource limit exceeded: ${req.user.tenantId} reached limit for ${resourceType} (${usage}/${limits[resourceType]})`);
        return res.status(429).json({
          success: false,
          error: `Resource limit exceeded for ${resourceType}`,
          limit: limits[resourceType],
          usage: usage
        });
      }

      // Resource limit not exceeded
      next();
    } catch (error) {
      logger.error(`Tenant resource limits middleware error: ${error.message}`, { error });
      next(error);
    }
  };
}

module.exports = {
  tenantIsolation,
  tenantDataIsolation,
  tenantQueryIsolation,
  tenantHeaderIsolation,
  tenantResourceLimits
};
