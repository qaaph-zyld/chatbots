/**
 * Tenant Isolation Middleware
 * 
 * Enforces strict multi-tenant isolation by validating tenant access permissions
 * and preventing cross-tenant data access
 * 
 * Enhanced with additional security features for production-ready multi-tenancy:
 * - Deep object traversal for nested tenant IDs
 * - Request fingerprinting for audit trails
 * - Rate limiting per tenant
 * - Tenant-specific encryption key handling
 * - Resource access validation
 */

const { logger } = require('../utils/logger');
const { TenantAccessError, SecurityViolationError } = require('../utils/errors');
const crypto = require('crypto');
const Tenant = require('../tenancy/models/tenant.model');
const cache = require('../utils/cache');
const { performance } = require('perf_hooks');

/**
 * Middleware to enforce tenant isolation
 * Ensures users can only access resources belonging to their tenant
 * 
 * @param {Object} options - Configuration options
 * @param {string} [options.tenantIdParam='tenantId'] - Name of the tenant ID parameter in request
 * @param {boolean} [options.allowSuperAdmin=false] - Whether to allow super admins to bypass tenant isolation
 * @param {Array<string>} [options.excludePaths=[]] - Paths to exclude from tenant isolation checks
 * @param {boolean} [options.strictMode=false] - Enforce strict tenant isolation (reject requests without tenant ID)
 * @param {boolean} [options.auditTrail=false] - Enable detailed audit trail for tenant access
 * @param {number} [options.maxDepth=10] - Maximum depth for nested object traversal
 * @param {boolean} [options.validateTenantExists=false] - Validate that tenant exists in database
 * @returns {Function} Express middleware function
 */
function tenantIsolation(options = {}) {
  const {
    tenantIdParam = 'tenantId',
    allowSuperAdmin = false,
    excludePaths = [],
    strictMode = false,
    auditTrail = false,
    maxDepth = 10,
    validateTenantExists = false,
    validateTenantStatus = false,
    allowedStatuses = ['active'],
    performanceMonitoring = false,
    allowCacheBypass = false,
    encryptionEnabled = false
  } = options;

  return async (req, res, next) => {
    const startTime = performance.now();
    const requestId = crypto.randomUUID();
    
    // Generate request fingerprint for audit trail if enabled
    if (auditTrail) {
      const fingerprintData = {
        ip: req.ip,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
        userId: req.user?.id,
        tenantId: req.user?.tenantId
      };
      req.requestFingerprint = crypto.createHash('sha256')
        .update(JSON.stringify(fingerprintData))
        .digest('hex');
    }
    
    try {
      // Skip tenant isolation for excluded paths
      if (excludePaths.some(path => req.path.startsWith(path))) {
        return next();
      }

      // Skip if no user or tenant information is available
      if (!req.user || !req.user.tenantId) {
        logger.warn('Tenant isolation middleware: No user or tenant information available', {
          requestId,
          path: req.path,
          method: req.method,
          ip: req.ip
        });
        
        if (strictMode) {
          return next(new TenantAccessError('Tenant information not available'));
        } else {
          // In non-strict mode, allow the request but mark it as potentially unsafe
          req.tenantIsolationStatus = 'UNSAFE_NO_TENANT';
          return next();
        }
      }
      
      // Validate that the tenant exists if required
      if (validateTenantExists) {
        // Check if cache bypass is requested and allowed
        const bypassCache = allowCacheBypass && req.headers['x-bypass-cache'] === 'true';
        
        let tenant;
        if (bypassCache) {
          tenant = await Tenant.findById(req.user.tenantId);
        } else {
          tenant = await cache.wrap(
            `tenant_${req.user.tenantId}`,
            async () => {
              return await Tenant.findById(req.user.tenantId);
            },
            60 * 5 // Cache for 5 minutes
          );
        }
        
        if (!tenant) {
          logger.error('Tenant isolation middleware: Tenant does not exist', {
            requestId,
            tenantId: req.user.tenantId,
            path: req.path,
            method: req.method
          });
          return next(new TenantAccessError('Invalid tenant'));
        }
        
        // Validate tenant status if required
        if (validateTenantStatus && !allowedStatuses.includes(tenant.status)) {
          logger.error('Tenant isolation middleware: Tenant has invalid status', {
            requestId,
            tenantId: req.user.tenantId,
            tenantStatus: tenant.status,
            allowedStatuses,
            path: req.path,
            method: req.method
          });
          return next(new TenantAccessError(`Tenant is ${tenant.status} and cannot access resources`));
        }
      }

      // Allow super admins to bypass tenant isolation if configured
      if (allowSuperAdmin && req.user.role === 'superadmin') {
        logger.debug('Tenant isolation middleware: Super admin bypass', {
          requestId,
          userId: req.user.id,
          tenantId: req.user.tenantId,
          path: req.path
        });
        
        // Mark the request as admin-bypassed for audit purposes
        req.tenantIsolationStatus = 'ADMIN_BYPASS';
        
        // Create audit trail if enabled
        if (auditTrail) {
          createAuditTrail(req, 'ADMIN_BYPASS', requestId);
        }
        
        return next();
      }

      // Get tenant ID from request parameters, body, or query with deep traversal
      let resourceTenantId = null;
      
      // Check in URL parameters
      if (req.params && req.params[tenantIdParam]) {
        resourceTenantId = req.params[tenantIdParam];
      } 
      // Check in query parameters
      else if (req.query && req.query[tenantIdParam]) {
        resourceTenantId = req.query[tenantIdParam];
      }
      // Deep search in request body
      else if (req.body) {
        resourceTenantId = findTenantIdInObject(req.body, tenantIdParam, maxDepth);
      }
      // Check headers for tenant information
      else if (req.headers && req.headers['x-tenant-id']) {
        resourceTenantId = req.headers['x-tenant-id'];
      }

      // If no resource tenant ID is found in strict mode, reject the request
      if (!resourceTenantId) {
        if (strictMode) {
          logger.warn('Tenant isolation middleware: No resource tenant ID found in strict mode', {
            requestId,
            path: req.path,
            method: req.method,
            userTenantId: req.user.tenantId
          });
          return next(new TenantAccessError('Resource tenant ID not found'));
        } else {
          // In non-strict mode, use the user's tenant ID
          resourceTenantId = req.user.tenantId;
          req.tenantIsolationStatus = 'ASSUMED_TENANT';
        }
      }

      // Validate tenant access
      if (resourceTenantId !== req.user.tenantId) {
        // Security violation - attempted cross-tenant access
        logger.warn('Tenant isolation violation detected', {
          requestId,
          userTenantId: req.user.tenantId,
          resourceTenantId,
          path: req.path,
          method: req.method,
          ip: req.ip,
          userId: req.user.id
        });
        
        // Create security audit trail
        if (auditTrail) {
          createAuditTrail(req, 'VIOLATION', requestId, {
            resourceTenantId,
            violationType: 'CROSS_TENANT_ACCESS'
          });
        }
        
        return next(new SecurityViolationError('Access denied to resource from another tenant'));
      }

      // Add tenant context to the request for downstream middleware and handlers
      req.tenantContext = {
        tenantId: req.user.tenantId,
        requestId,
        isolationVerified: true,
        verificationTime: new Date().toISOString()
      };
      
      // Create audit trail if enabled
      if (auditTrail) {
        createAuditTrail(req, 'ACCESS_GRANTED', requestId);
      }
      
      // Add tenant isolation headers to response
      res.setHeader('X-Tenant-Isolation-Verified', 'true');
      res.setHeader('X-Request-ID', requestId);
      
      // Record performance metrics
      const endTime = performance.now();
      logger.debug('Tenant isolation check completed', {
        requestId,
        tenantId: req.user.tenantId,
        path: req.path,
        processingTimeMs: endTime - startTime
      });
      
      // Tenant access is valid
      next();
    } catch (error) {
      logger.error('Tenant isolation middleware error', {
        requestId,
        error: error.message,
        stack: error.stack,
        path: req.path
      });
      return next(new SecurityViolationError('Tenant isolation error'));
    } finally {
      // Record performance metrics if enabled
      if (performanceMonitoring) {
        const endTime = performance.now();
        req.tenantIsolationPerformance = endTime - startTime;
        
        logger.debug('Tenant isolation middleware performance', {
          requestId,
          executionTimeMs: req.tenantIsolationPerformance,
          path: req.path
        });
      }
      
      next(error);
    }
  };
}

/**
 * Helper function to find tenant ID in nested objects
 * @param {Object} obj - Object to search in
 * @param {string} key - Key to search for
 * @param {number} maxDepth - Maximum depth to search
 * @param {number} currentDepth - Current depth in the search
 * @returns {string|null} Found tenant ID or null
 */
function findTenantIdInObject(obj, key, maxDepth, currentDepth = 0) {
  // Prevent excessive recursion
  if (currentDepth >= maxDepth || !obj || typeof obj !== 'object') {
    return null;
  }
  
  // Check if the key exists at this level
  if (obj[key] !== undefined && obj[key] !== null) {
    return obj[key];
  }
  
  // Search in nested objects
  for (const prop in obj) {
    if (obj.hasOwnProperty(prop) && typeof obj[prop] === 'object' && obj[prop] !== null) {
      const result = findTenantIdInObject(obj[prop], key, maxDepth, currentDepth + 1);
      if (result) {
        return result;
      }
    }
  }
  
  return null;
}

/**
 * Create audit trail entry for tenant access
 * @param {Object} req - Express request object
 * @param {string} action - Action performed
 * @param {string} requestId - Unique request ID
 * @param {Object} additionalData - Additional data to log
 */
async function createAuditTrail(req, action, requestId, additionalData = {}) {
  try {
    // This would typically write to a database or secure audit log
    // For now, we'll just log it
    logger.info('Tenant access audit trail', {
      timestamp: new Date().toISOString(),
      requestId,
      action,
      userId: req.user?.id,
      tenantId: req.user?.tenantId,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      ...additionalData
    });
    
    // In a production implementation, this would save to a secure audit database
    // await AuditLog.create({ ... });
  } catch (error) {
    logger.error('Failed to create audit trail', {
      error: error.message,
      requestId
    });
  }
}
}

/**
 * Middleware to enforce tenant data isolation in request body
 * Ensures tenantId in request body matches the user's tenant
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} [options.allowSuperAdmin=false] - Whether to allow super admins to bypass tenant isolation
 * @param {boolean} [options.deepInspection=false] - Perform deep inspection of nested objects
 * @param {boolean} [options.sanitizeBody=false] - Remove any cross-tenant data from body
 * @param {boolean} [options.auditTrail=false] - Enable detailed audit trail for data access
 * @param {number} [options.maxDepth=10] - Maximum depth for nested object traversal
 * @returns {Function} Express middleware function
 */
function tenantDataIsolation(options = {}) {
  const { 
    allowSuperAdmin = false,
    deepInspection = false,
    sanitizeBody = false,
    auditTrail = false,
    maxDepth = 10
  } = options;

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

/**
 * Middleware to enforce tenant encryption key isolation
 * Ensures proper encryption key management per tenant
 * 
 * @param {Object} options - Configuration options
 * @param {Function} options.getEncryptionKey - Function to retrieve tenant-specific encryption key
 * @returns {Function} Express middleware function
 */
function tenantEncryptionKeyIsolation(options = {}) {
  const { getEncryptionKey } = options;
  
  if (!getEncryptionKey || typeof getEncryptionKey !== 'function') {
    throw new Error('getEncryptionKey function is required for tenantEncryptionKeyIsolation middleware');
  }
  
  return async (req, res, next) => {
    try {
      // Skip if no user or tenant information is available
      if (!req.user || !req.user.tenantId) {
        return next(new TenantAccessError('Tenant information not available for encryption'));
      }
      
      // Get tenant-specific encryption key
      const encryptionKey = await getEncryptionKey(req.user.tenantId);
      
      if (!encryptionKey) {
        logger.error('Failed to retrieve tenant encryption key', {
          tenantId: req.user.tenantId
        });
        return next(new SecurityViolationError('Encryption key not available'));
      }
      
      // Attach encryption key to request for use in route handlers
      req.tenantEncryption = {
        key: encryptionKey,
        encrypt: (data) => {
          const cipher = crypto.createCipher('aes-256-cbc', encryptionKey);
          let encrypted = cipher.update(data, 'utf8', 'hex');
          encrypted += cipher.final('hex');
          return encrypted;
        },
        decrypt: (encryptedData) => {
          const decipher = crypto.createDecipher('aes-256-cbc', encryptionKey);
          let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
          decrypted += decipher.final('utf8');
          return decrypted;
        }
      };
      
      next();
    } catch (error) {
      logger.error('Tenant encryption key isolation error', {
        error: error.message,
        tenantId: req.user?.tenantId
      });
      next(error);
    }
  };
}

module.exports = {
  tenantIsolation,
  tenantDataIsolation,
  tenantQueryIsolation,
  tenantHeaderIsolation,
  tenantResourceLimits,
  tenantEncryptionKeyIsolation,
  findTenantIdInObject // Export helper function for testing
};
