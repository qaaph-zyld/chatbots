/**
 * Tenant Isolation Middleware Tests
 * 
 * Tests for the middleware that enforces tenant isolation and prevents cross-tenant data access
 */

const {
  tenantIsolation,
  tenantDataIsolation,
  tenantQueryIsolation,
  tenantHeaderIsolation,
  tenantResourceLimits
} = require('../../src/middleware/tenant-isolation.middleware');
const { TenantAccessError } = require('../../src/utils/errors');

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
      expect(next).not.toHaveBeenCalledWith(expect.any(Error));
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
});
