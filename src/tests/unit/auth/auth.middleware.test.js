/**
 * Auth Middleware Tests
 */

const httpMocks = require('node-mocks-http');

// Mock dependencies with inline factory functions - BEFORE imports
jest.mock('@src/auth/auth.service', () => ({
  verifyToken: jest.fn(),
  getUserById: jest.fn(),
  validatePermissions: jest.fn(),
  hasPermission: jest.fn()
}));

jest.mock('@src/utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

// Import the auth middleware after mocks
const authMiddleware = require('@src/auth/auth.middleware');
const authService = require('@src/auth/auth.service');
const logger = require('@src/utils/logger');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    // Set up request, response, and next function mocks
    req = {
      headers: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset mock implementations to avoid test interference
    authService.verifyToken.mockReset();
    authService.getUserById.mockReset();
    authService.validatePermissions.mockReset();
    authService.hasPermission.mockReset();
  });

  describe('authenticateToken', () => {
    it('should pass with valid token in Authorization header', async () => {
      // Arrange
      req.headers.authorization = 'Bearer valid-token';
      
      // Explicitly set up mocks for this test
      const mockUser = {
        _id: 'user123',
        email: 'user@example.com',
        role: 'user'
      };
      
      authService.verifyToken.mockResolvedValue({ userId: 'user123' });
      authService.getUserById.mockResolvedValue(mockUser);

      // Act
      await authMiddleware.authenticateToken(req, res, next);

      // Assert
      expect(authService.verifyToken).toHaveBeenCalledWith('valid-token');
      expect(authService.getUserById).toHaveBeenCalledWith('user123');
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should fail with missing Authorization header', async () => {
      // Act
      await authMiddleware.authenticateToken(req, res, next);

      // Assert
      expect(authService.verifyToken).not.toHaveBeenCalled();
      expect(authService.getUserById).not.toHaveBeenCalled();
      expect(req.user).toBeNull();
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
    });

    it('should fail with malformed Authorization header', async () => {
      // Arrange
      req.headers.authorization = 'invalid-format';

      // Act
      await authMiddleware.authenticateToken(req, res, next);

      // Assert
      expect(authService.verifyToken).not.toHaveBeenCalled();
      expect(authService.getUserById).not.toHaveBeenCalled();
      expect(req.user).toBeNull();
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid authorization format' });
    });

    it('should fail with invalid token', async () => {
      // Arrange
      req.headers.authorization = 'Bearer invalid-token';
      
      // Mock token verification to fail
      authService.verifyToken.mockRejectedValue(new Error('Invalid token'));

      // Act
      await authMiddleware.authenticateToken(req, res, next);

      // Assert
      expect(authService.verifyToken).toHaveBeenCalledWith('invalid-token');
      expect(authService.getUserById).not.toHaveBeenCalled();
      expect(req.user).toBeNull();
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    });

    it('should fail if user not found', async () => {
      // Arrange
      req.headers.authorization = 'Bearer valid-token';
      
      // Explicitly set up mocks for this test
      authService.verifyToken.mockResolvedValue({ userId: 'user123' });
      authService.getUserById.mockResolvedValue(null);

      // Act
      await authMiddleware.authenticateToken(req, res, next);

      // Assert
      expect(authService.verifyToken).toHaveBeenCalledWith('valid-token');
      expect(authService.getUserById).toHaveBeenCalledWith('user123');
      expect(req.user).toBeNull();
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });
  });

  describe('hasRole', () => {
    it('should pass when user has required role', async () => {
      // Arrange
      req.user = {
        _id: 'admin123',
        email: 'admin@example.com',
        role: 'admin'
      };
      const middleware = authMiddleware.hasRole('admin');

      // Act
      await middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should fail when user does not have required role', async () => {
      // Arrange
      req.user = {
        _id: 'user123',
        email: 'user@example.com',
        role: 'user'
      };
      const middleware = authMiddleware.hasRole('admin');

      // Act
      await middleware(req, res, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
    });

    it('should fail when user is not authenticated', async () => {
      // Arrange
      req.user = null;
      const middleware = authMiddleware.hasRole('admin');

      // Act
      await middleware(req, res, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
    });

    it('should pass when user has one of multiple required roles', async () => {
      // Arrange
      req.user = {
        _id: 'user123',
        email: 'user@example.com',
        role: 'user'
      };
      const middleware = authMiddleware.hasRole(['user', 'admin']);

      // Act
      await middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should handle malformed user objects gracefully', async () => {
      // Arrange
      req.user = {}; // Malformed user object without role
      const middleware = authMiddleware.hasRole('admin');

      // Act
      await middleware(req, res, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
      expect(logger.warn).toHaveBeenCalledWith('Role check failed for malformed user object', expect.any(Object));
    });
  });
});
