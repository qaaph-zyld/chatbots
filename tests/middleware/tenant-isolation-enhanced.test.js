/**
 * Enhanced Tenant Isolation Middleware Tests
 * 
 * Additional tests for advanced security features in the tenant isolation middleware
 * Focuses on production-ready multi-tenancy features:
 * - Advanced encryption
 * - Audit trails
 * - Request fingerprinting
 * - Tenant validation
 * - Rate limiting
 */

const {
  tenantIsolation,
  tenantDataIsolation,
  tenantEncryptionKeyIsolation
} = require('../../src/middleware/tenant-isolation.middleware');
const { TenantAccessError, SecurityViolationError } = require('../../src/utils/errors');
const cache = require('../../src/utils/cache');
const crypto = require('crypto');

// Mock the Tenant model
jest.mock('../../src/tenancy/models/tenant.model', () => ({
  findById: jest.fn().mockImplementation((id) => {
    if (id === 'tenant-123' || id === 'tenant-456') {
      return Promise.resolve({ id, name: `Test Tenant ${id}`, status: 'active' });
    }
    if (id === 'tenant-suspended') {
      return Promise.resolve({ id, name: 'Suspended Tenant', status: 'suspended' });
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

// Mock the cache module
jest.mock('../../src/utils/cache', () => {
  const originalModule = jest.requireActual('../../src/utils/cache');
  return {
    ...originalModule,
    wrap: jest.fn().mockImplementation((key, fn) => fn()),
    get: jest.fn(),
    set: jest.fn()
  };
});

describe('Enhanced Tenant Isolation Middleware', () => {
  let req;
  let res;
  let next;
  let mockEncryptionKey;
  let mockDecryptedData;
  let mockEncryptedData;

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
      headers: {},
      path: '/api/resources',
      ip: '192.168.1.1',
      method: 'GET'
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn()
    };

    next = jest.fn();
    
    // Mock encryption data
    mockEncryptionKey = Buffer.from('0123456789abcdef0123456789abcdef');
    mockDecryptedData = { sensitive: 'data', tenantId: 'tenant-123' };
    mockEncryptedData = Buffer.from('encrypted-data').toString('base64');
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Advanced Tenant Validation', () => {
    it('should validate tenant exists when validateTenantExists is true', async () => {
      req.params.tenantId = 'tenant-123';
      
      await tenantIsolation({ validateTenantExists: true })(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeUndefined();
    });
    
    it('should reject when tenant does not exist and validateTenantExists is true', async () => {
      req.params.tenantId = 'non-existent-tenant';
      req.user.tenantId = 'non-existent-tenant';
      
      await tenantIsolation({ validateTenantExists: true })(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(TenantAccessError);
    });
    
    it('should check tenant status when validateTenantStatus is true', async () => {
      req.params.tenantId = 'tenant-suspended';
      req.user.tenantId = 'tenant-suspended';
      
      await tenantIsolation({ 
        validateTenantExists: true,
        validateTenantStatus: true,
        allowedStatuses: ['active']
      })(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(TenantAccessError);
      expect(next.mock.calls[0][0].message).toContain('suspended');
    });
  });

  describe('Request Fingerprinting', () => {
    it('should generate request fingerprint when auditTrail is true', async () => {
      req.params.tenantId = 'tenant-123';
      
      await tenantIsolation({ auditTrail: true })(req, res, next);
      
      expect(req).toHaveProperty('requestFingerprint');
      expect(typeof req.requestFingerprint).toBe('string');
      expect(req.requestFingerprint.length).toBeGreaterThan(0);
    });
    
    it('should include IP, path, method, and timestamp in fingerprint', async () => {
      req.params.tenantId = 'tenant-123';
      
      await tenantIsolation({ auditTrail: true })(req, res, next);
      
      // Decode the fingerprint (in a real implementation this would be a hash)
      const fingerprint = req.requestFingerprint;
      
      expect(fingerprint).toContain(req.ip);
      expect(fingerprint).toContain(req.path);
      expect(fingerprint).toContain(req.method);
    });
  });

  describe('Enhanced Encryption Key Isolation', () => {
    it('should retrieve and use tenant-specific encryption keys', async () => {
      const getEncryptionKey = jest.fn().mockResolvedValue(mockEncryptionKey);
      const decrypt = jest.fn().mockResolvedValue(mockDecryptedData);
      
      req.body = {
        encryptedData: mockEncryptedData
      };
      
      await tenantEncryptionKeyIsolation({
        getEncryptionKey,
        decrypt,
        encryptedFields: ['encryptedData']
      })(req, res, next);
      
      expect(getEncryptionKey).toHaveBeenCalledWith('tenant-123');
      expect(decrypt).toHaveBeenCalledWith(mockEncryptedData, mockEncryptionKey);
      expect(req.body.encryptedData).toEqual(mockDecryptedData);
      expect(next).toHaveBeenCalled();
    });
    
    it('should reject if encrypted data contains different tenant ID', async () => {
      const getEncryptionKey = jest.fn().mockResolvedValue(mockEncryptionKey);
      const decrypt = jest.fn().mockResolvedValue({ 
        sensitive: 'data', 
        tenantId: 'different-tenant' 
      });
      
      req.body = {
        encryptedData: mockEncryptedData
      };
      
      await tenantEncryptionKeyIsolation({
        getEncryptionKey,
        decrypt,
        encryptedFields: ['encryptedData'],
        validateTenantId: true
      })(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(SecurityViolationError);
      expect(next.mock.calls[0][0].message).toContain('tenant mismatch');
    });
  });

  describe('Tenant Data Isolation with Deep Inspection', () => {
    it('should detect tenant ID mismatch in deeply nested objects', () => {
      req.body = {
        level1: {
          level2: {
            level3: {
              level4: {
                tenantId: 'different-tenant'
              }
            }
          }
        }
      };
      
      tenantDataIsolation({ 
        deepInspection: true,
        maxDepth: 5
      })(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(TenantAccessError);
    });
    
    it('should sanitize body when sanitizeBody is true', () => {
      req.body = {
        name: 'Test',
        tenantId: 'tenant-123',
        nestedObject: {
          data: 'value',
          tenantId: 'different-tenant'
        }
      };
      
      tenantDataIsolation({ 
        deepInspection: true,
        sanitizeBody: true
      })(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeUndefined();
      expect(req.body.nestedObject.tenantId).toBe('tenant-123');
    });
  });

  describe('Cache Integration', () => {
    it('should use cache for tenant validation', async () => {
      req.params.tenantId = 'tenant-123';
      cache.wrap.mockImplementationOnce((key, fn) => {
        expect(key).toBe('tenant_exists_tenant-123');
        return Promise.resolve(true);
      });
      
      await tenantIsolation({ validateTenantExists: true })(req, res, next);
      
      expect(cache.wrap).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeUndefined();
    });
    
    it('should bypass cache when bypassCache is true', async () => {
      req.params.tenantId = 'tenant-123';
      req.headers['x-bypass-cache'] = 'true';
      
      await tenantIsolation({ 
        validateTenantExists: true,
        allowCacheBypass: true
      })(req, res, next);
      
      expect(cache.wrap).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Performance Monitoring', () => {
    it('should track execution time when performanceMonitoring is true', async () => {
      req.params.tenantId = 'tenant-123';
      
      await tenantIsolation({ performanceMonitoring: true })(req, res, next);
      
      expect(req).toHaveProperty('tenantIsolationPerformance');
      expect(typeof req.tenantIsolationPerformance).toBe('number');
      expect(req.tenantIsolationPerformance).toBeGreaterThan(0);
    });
  });
});
