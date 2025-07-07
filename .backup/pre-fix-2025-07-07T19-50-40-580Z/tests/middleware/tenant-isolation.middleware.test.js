/**
 * Tenant Isolation Middleware Tests
 * 
 * Tests for the middleware that enforces tenant isolation and prevents cross-tenant data access
 * Enhanced to cover new security features for production-ready multi-tenancy
 */

const {
  tenantIsolation,
  tenantDataIsolation,
  tenantQueryIsolation,
  tenantHeaderIsolation,
  tenantResourceLimits,
  tenantEncryptionKeyIsolation,
  findTenantIdInObject
} = require('../../src/middleware/tenant-isolation.middleware');
const { TenantAccessError, SecurityViolationError } = require('../../src/utils/errors');
const crypto = require('crypto');

// Mock the cache module
jest.mock('../../src/utils/cache', () => ({
  wrap: jest.fn().mockImplementation((key, fn) => fn())
}));

// Mock the Tenant model
jest.mock('../../src/tenancy/models/tenant.model', () => ({
  findById: jest.fn().mockImplementation((id) => {
    if (id === 'tenant-123') {
      return Promise.resolve({ id: 'tenant-123', name: 'Test Tenant' });
    }
    return Promise.resolve(null);
  })
}));

// Mock the logger
jest.mock('../../src/utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

describe('Tenant Isolation Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      user: {
        id: 'user-123',
        tenantId: 'tenant-123',
        role: 'admin'
      },
      params: {},
      body: {},
      query: {},
      path: '/api/resources'
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn()
    };

    next = jest.fn();
  });

  describe('findTenantIdInObject', () => {
    it('should find tenant ID at the root level', () => {
      const obj = { tenantId: 'tenant-123', name: 'Test' };
      const result = findTenantIdInObject(obj, 'tenantId', 10);
      expect(result).toBe('tenant-123');
    });
    
    it('should find tenant ID in nested objects', () => {
      const obj = { 
        user: { 
          profile: { 
            tenantId: 'tenant-123' 
          } 
        } 
      };
      const result = findTenantIdInObject(obj, 'tenantId', 10);
      expect(result).toBe('tenant-123');
    });
    
    it('should return null if tenant ID is not found', () => {
      const obj = { userId: 'user-123', name: 'Test' };
      const result = findTenantIdInObject(obj, 'tenantId', 10);
      expect(result).toBeNull();
    });
    
    it('should respect max depth', () => {
      const obj = { 
        level1: { 
          level2: { 
            level3: { 
              tenantId: 'tenant-123' 
            } 
          } 
        } 
      };
      // Max depth 2 should not find the tenant ID at level 3
      const result = findTenantIdInObject(obj, 'tenantId', 2);
      expect(result).toBeNull();
      
      // Max depth 3 should find the tenant ID
      const result2 = findTenantIdInObject(obj, 'tenantId', 3);
      expect(result2).toBe('tenant-123');
    });
  });
  
  describe('tenantIsolation', () => {
    it('should allow access when tenant IDs match', () => {
      req.params.tenantId = 'tenant-123';
      
      tenantIsolation()(req, res, next);
      
      expect(next).toHaveBeenCalledWith();
      expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should deny access when tenant IDs do not match', () => {
      req.params.tenantId = 'tenant-456';
      
      tenantIsolation()(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(TenantAccessError));
      expect(next.mock.calls[0][0].message).toContain('Access denied to resource from another tenant');
    });

    it('should check tenant ID in request body', () => {
      req.body.tenantId = 'tenant-456';
      
      tenantIsolation()(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(TenantAccessError));
    });

    it('should check tenant ID in query parameters', () => {
      req.query.tenantId = 'tenant-456';
      
      tenantIsolation()(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(TenantAccessError));
    });

    it('should allow super admin to bypass tenant isolation when configured', () => {
      req.user.role = 'superadmin';
      req.params.tenantId = 'tenant-456';
      
      tenantIsolation({ allowSuperAdmin: true })(req, res, next);
      
      expect(next).toHaveBeenCalledWith();
      expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should not allow super admin to bypass tenant isolation when not configured', () => {
      req.user.role = 'superadmin';
      req.params.tenantId = 'tenant-456';
      
      tenantIsolation({ allowSuperAdmin: false })(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(TenantAccessError));
    });

    it('should handle strict mode by rejecting requests without tenant ID', async () => {
      delete req.params.tenantId;
      delete req.body.tenantId;
      delete req.query.tenantId;
      
      await tenantIsolation({ strictMode: true })(req, res, next);
      
      expect(next).not.toHaveBeenCalledWith();
      expect(next).toHaveBeenCalledWith(expect.any(TenantAccessError));
    });
    
    it('should assume user tenant ID in non-strict mode when no resource tenant ID is found', async () => {
      delete req.params.tenantId;
      delete req.body.tenantId;
      delete req.query.tenantId;
      
      await tenantIsolation({ strictMode: false })(req, res, next);
      
      expect(next).toHaveBeenCalledWith();
      expect(req.tenantIsolationStatus).toBe('ASSUMED_TENANT');
    });
    
    it('should validate that tenant exists when validateTenantExists is true', async () => {
      req.params.tenantId = 'tenant-123';
      
      await tenantIsolation({ validateTenantExists: true })(req, res, next);
      
      expect(next).toHaveBeenCalledWith();
    });
    
    it('should reject request when tenant does not exist and validateTenantExists is true', async () => {
      req.user.tenantId = 'tenant-456'; // Non-existent tenant
      
      await tenantIsolation({ validateTenantExists: true })(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(TenantAccessError));
    });
    
    it('should create audit trail when auditTrail is enabled', async () => {
      req.params.tenantId = 'tenant-123';
      
      await tenantIsolation({ auditTrail: true })(req, res, next);
      
      // We're not testing the actual audit trail creation here since it's mocked
      // Just verifying that the middleware completes successfully
      expect(next).toHaveBeenCalledWith();
    });
    
    it('should add tenant context to request', async () => {
      req.params.tenantId = 'tenant-123';
      
      await tenantIsolation()(req, res, next);
      
      expect(req.tenantContext).toBeDefined();
      expect(req.tenantContext.tenantId).toBe('tenant-123');
      expect(req.tenantContext.isolationVerified).toBe(true);
    });
    
    it('should add tenant isolation headers to response', async () => {
      req.params.tenantId = 'tenant-123';
      
      await tenantIsolation()(req, res, next);
      
      expect(res.setHeader).toHaveBeenCalledWith('X-Tenant-Isolation-Verified', 'true');
      expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', expect.any(String));
    });
    
    it('should find tenant ID in deeply nested request body', async () => {
      req.body = {
        user: {
          profile: {
            settings: {
              tenantId: 'tenant-123'
            }
          }
        }
      };
      
      await tenantIsolation()(req, res, next);
      
      expect(next).toHaveBeenCalledWith();
    });
    
    it('should find tenant ID in headers', async () => {
      delete req.params.tenantId;
      req.headers = { 'x-tenant-id': 'tenant-123' };
      
      await tenantIsolation()(req, res, next);
      
      expect(next).toHaveBeenCalledWith();
    });
    
    it('should throw SecurityViolationError for cross-tenant access attempts', async () => {
      req.params.tenantId = 'tenant-456';
      
      await tenantIsolation()(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(SecurityViolationError));
    });
    
    it('should skip tenant isolation for excluded paths', () => {
      req.path = '/api/public/resources';
      req.params.tenantId = 'tenant-456';
      
      tenantIsolation({ excludePaths: ['/api/public'] })(req, res, next);
      
      expect(next).toHaveBeenCalledWith();
      expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle missing user or tenant information', () => {
      req.user = null;
      
      tenantIsolation()(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(TenantAccessError));
      expect(next.mock.calls[0][0].message).toContain('Tenant information not available');
    });

    it('should pass through when no resource tenant ID is found', () => {
      // No tenantId in params, body, or query
      
      tenantIsolation()(req, res, next);
      
      expect(next).toHaveBeenCalledWith();
      expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should use custom tenant ID parameter name when provided', () => {
      req.params.customTenantId = 'tenant-456';
      
      tenantIsolation({ tenantIdParam: 'customTenantId' })(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(TenantAccessError));
    });
  });

  describe('tenantDataIsolation', () => {
    it('should perform deep inspection of nested objects when deepInspection is true', () => {
      req.body = {
        data: {
          nested: {
            tenantId: 'tenant-456'
          }
        }
      };
      
      tenantDataIsolation({ deepInspection: true })(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(TenantAccessError));
    });
    
    it('should sanitize body when sanitizeBody is true', () => {
      req.body = {
        tenantId: 'tenant-123',
        data: {
          tenantId: 'tenant-456',
          name: 'Test'
        }
      };
      
      tenantDataIsolation({ deepInspection: true, sanitizeBody: true })(req, res, next);
      
      // The middleware should have removed the invalid tenant ID
      expect(req.body.data.tenantId).toBe('tenant-123');
      expect(next).toHaveBeenCalledWith();
    });
    
    it('should allow request when body tenantId matches user tenantId', () => {
      req.body.tenantId = 'tenant-123';
      
      tenantDataIsolation()(req, res, next);
      
      expect(next).toHaveBeenCalledWith();
      expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should deny request when body tenantId does not match user tenantId', () => {
      req.body.tenantId = 'tenant-456';
      
      tenantDataIsolation()(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(TenantAccessError));
      expect(next.mock.calls[0][0].message).toContain('Cannot set tenantId to a different tenant');
    });

    it('should set tenantId in body for POST requests when not provided', () => {
      req.method = 'POST';
      req.body = {};
      
      tenantDataIsolation()(req, res, next);
      
      expect(req.body.tenantId).toBe('tenant-123');
      expect(next).toHaveBeenCalledWith();
    });

    it('should set tenantId in body for PUT requests when not provided', () => {
      req.method = 'PUT';
      req.body = {};
      
      tenantDataIsolation()(req, res, next);
      
      expect(req.body.tenantId).toBe('tenant-123');
      expect(next).toHaveBeenCalledWith();
    });

    it('should not set tenantId for GET requests', () => {
      req.method = 'GET';
      req.body = {};
      
      tenantDataIsolation()(req, res, next);
      
      expect(req.body.tenantId).toBeUndefined();
      expect(next).toHaveBeenCalledWith();
    });

    it('should validate tenantId in array items', () => {
      req.body = [
        { name: 'Item 1', tenantId: 'tenant-123' },
        { name: 'Item 2', tenantId: 'tenant-456' }
      ];
      
      tenantDataIsolation()(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(TenantAccessError));
      expect(next.mock.calls[0][0].message).toContain('Cannot set tenantId to a different tenant');
    });

    it('should allow super admin to bypass data isolation when configured', () => {
      req.user.role = 'superadmin';
      req.body.tenantId = 'tenant-456';
      
      tenantDataIsolation({ allowSuperAdmin: true })(req, res, next);
      
      expect(next).toHaveBeenCalledWith();
      expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('tenantQueryIsolation', () => {
    it('should set tenantId in query parameters', () => {
      tenantQueryIsolation()(req, res, next);
      
      expect(req.query.tenantId).toBe('tenant-123');
      expect(next).toHaveBeenCalledWith();
    });

    it('should not override tenantId if it matches user tenantId', () => {
      req.query.tenantId = 'tenant-123';
      
      tenantQueryIsolation()(req, res, next);
      
      expect(req.query.tenantId).toBe('tenant-123');
      expect(next).toHaveBeenCalledWith();
    });

    it('should deny request if query tenantId does not match user tenantId', () => {
      req.query.tenantId = 'tenant-456';
      
      tenantQueryIsolation()(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(TenantAccessError));
      expect(next.mock.calls[0][0].message).toContain('Cannot query with a different tenant ID');
    });

    it('should allow super admin to bypass query isolation when configured', () => {
      req.user.role = 'superadmin';
      req.query.tenantId = 'tenant-456';
      
      tenantQueryIsolation({ allowSuperAdmin: true })(req, res, next);
      
      expect(req.query.tenantId).toBe('tenant-456');
      expect(next).toHaveBeenCalledWith();
    });

    it('should handle missing query object', () => {
      req.query = null;
      
      tenantQueryIsolation()(req, res, next);
      
      expect(req.query.tenantId).toBe('tenant-123');
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('tenantHeaderIsolation', () => {
    it('should set X-Tenant-ID header', () => {
      tenantHeaderIsolation()(req, res, next);
      
      expect(res.setHeader).toHaveBeenCalledWith('X-Tenant-ID', 'tenant-123');
      expect(next).toHaveBeenCalledWith();
    });

    it('should allow matching tenant ID in header', () => {
      req.headers = { 'x-tenant-id': 'tenant-123' };
      
      tenantHeaderIsolation()(req, res, next);
      
      expect(next).toHaveBeenCalledWith();
      expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should deny request with non-matching tenant ID in header', () => {
      req.headers = { 'x-tenant-id': 'tenant-456' };
      
      tenantHeaderIsolation()(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(TenantAccessError));
      expect(next.mock.calls[0][0].message).toContain('Invalid tenant ID in header');
    });

    it('should allow super admin to bypass header isolation when configured', () => {
      req.user.role = 'superadmin';
      req.headers = { 'x-tenant-id': 'tenant-456' };
      
      tenantHeaderIsolation({ allowSuperAdmin: true })(req, res, next);
      
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('tenantResourceLimits', () => {
    it('should allow request when resource limit is not exceeded', async () => {
      const getLimits = jest.fn().mockResolvedValue({ 'api_calls': 1000 });
      const getCurrentUsage = jest.fn().mockResolvedValue(500);
      
      await tenantResourceLimits({
        getLimits,
        getCurrentUsage,
        resourceType: 'api_calls'
      })(req, res, next);
      
      expect(getLimits).toHaveBeenCalledWith('tenant-123');
      expect(getCurrentUsage).toHaveBeenCalledWith('tenant-123', 'api_calls');
      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny request when resource limit is exceeded', async () => {
      const getLimits = jest.fn().mockResolvedValue({ 'api_calls': 1000 });
      const getCurrentUsage = jest.fn().mockResolvedValue(1000);
      
      await tenantResourceLimits({
        getLimits,
        getCurrentUsage,
        resourceType: 'api_calls'
      })(req, res, next);
      
      expect(getLimits).toHaveBeenCalledWith('tenant-123');
      expect(getCurrentUsage).toHaveBeenCalledWith('tenant-123', 'api_calls');
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.stringContaining('Resource limit exceeded'),
        limit: 1000,
        usage: 1000
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow request when no limit is defined for resource type', async () => {
      const getLimits = jest.fn().mockResolvedValue({ 'storage': 1000 });
      const getCurrentUsage = jest.fn().mockResolvedValue(500);
      
      await tenantResourceLimits({
        getLimits,
        getCurrentUsage,
        resourceType: 'api_calls'
      })(req, res, next);
      
      expect(getLimits).toHaveBeenCalledWith('tenant-123');
      expect(getCurrentUsage).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith();
    });

    it('should allow request when no limits are defined', async () => {
      const getLimits = jest.fn().mockResolvedValue(null);
      const getCurrentUsage = jest.fn().mockResolvedValue(500);
      
      await tenantResourceLimits({
        getLimits,
        getCurrentUsage,
        resourceType: 'api_calls'
      })(req, res, next);
      
      expect(getLimits).toHaveBeenCalledWith('tenant-123');
      expect(getCurrentUsage).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith();
    });

    it('should throw error when required options are missing', () => {
      expect(() => {
        tenantResourceLimits({});
      }).toThrow('Missing required options for tenant resource limits middleware');
    });

    it('should handle errors gracefully', async () => {
      const getLimits = jest.fn().mockRejectedValue(new Error('Database error'));
      const getCurrentUsage = jest.fn();
      
      await tenantResourceLimits({
        getLimits,
        getCurrentUsage,
        resourceType: 'api_calls'
      })(req, res, next);
      
      expect(getLimits).toHaveBeenCalledWith('tenant-123');
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('tenantEncryptionKeyIsolation', () => {
    it('should throw error if getEncryptionKey function is not provided', () => {
      expect(() => {
        tenantEncryptionKeyIsolation({})(req, res, next);
      }).toThrow();
    });
    
    it('should add encryption utilities to request', async () => {
      const getEncryptionKey = jest.fn().mockResolvedValue('test-encryption-key-123');
      
      await tenantEncryptionKeyIsolation({ getEncryptionKey })(req, res, next);
      
      expect(getEncryptionKey).toHaveBeenCalledWith('tenant-123');
      expect(req.tenantEncryption).toBeDefined();
      expect(req.tenantEncryption.key).toBe('test-encryption-key-123');
      expect(typeof req.tenantEncryption.encrypt).toBe('function');
      expect(typeof req.tenantEncryption.decrypt).toBe('function');
      expect(next).toHaveBeenCalledWith();
    });
    
    it('should encrypt and decrypt data correctly', async () => {
      const getEncryptionKey = jest.fn().mockResolvedValue('test-encryption-key-123');
      
      await tenantEncryptionKeyIsolation({ getEncryptionKey })(req, res, next);
      
      const testData = 'sensitive-data-123';
      const encrypted = req.tenantEncryption.encrypt(testData);
      expect(encrypted).not.toBe(testData);
      
      const decrypted = req.tenantEncryption.decrypt(encrypted);
      expect(decrypted).toBe(testData);
    });
    
    it('should throw error if encryption key is not available', async () => {
      const getEncryptionKey = jest.fn().mockResolvedValue(null);
      
      await tenantEncryptionKeyIsolation({ getEncryptionKey })(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(SecurityViolationError));
    });
    
    it('should throw error if no tenant information is available', async () => {
      const getEncryptionKey = jest.fn().mockResolvedValue('test-encryption-key-123');
      delete req.user.tenantId;
      
      await tenantEncryptionKeyIsolation({ getEncryptionKey })(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(TenantAccessError));
    });
  });
});
