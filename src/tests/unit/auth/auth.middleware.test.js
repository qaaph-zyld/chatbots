/**
 * Auth Middleware Tests
 */

// Mock dependencies before importing the auth middleware
jest.mock('../../../auth/auth.service', () => ({
  verifyToken: jest.fn().mockImplementation(token => {
    if (token === 'valid-token') {
      return Promise.resolve({ userId: 'user123', role: 'user' });
    } else if (token === 'admin-token') {
      return Promise.resolve({ userId: 'admin123', role: 'admin' });
    } else {
      return Promise.reject(new Error('Invalid token'));
    }
  }),
  getUserById: jest.fn().mockImplementation(id => {
    if (id === 'user123') {
      return Promise.resolve({
        _id: 'user123',
        email: 'user@example.com',
        role: 'user'
      });
    } else if (id === 'admin123') {
      return Promise.resolve({
        _id: 'admin123',
        email: 'admin@example.com',
        role: 'admin'
      });
    } else {
      return Promise.resolve(null);
    }
  })
}));

jest.mock('../../../utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

// Import the auth middleware after mocks
require('@src/auth\auth.middleware');
require('@src/auth\auth.service');
require('@src/utils\logger');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

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
  });

  describe('authenticate', () => {
    it('should pass with valid token in Authorization header', async () => {
      // Arrange
      req.headers.authorization = 'Bearer valid-token';

      // Act
      await authenticate(req, res, next);

      // Assert
      expect(authService.verifyToken).toHaveBeenCalledWith('valid-token');
      expect(authService.getUserById).toHaveBeenCalledWith('user123');
      expect(req.user).toEqual({
        _id: 'user123',
        email: 'user@example.com',
        role: 'user'
      });
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should fail with missing Authorization header', async () => {
      // Act
      await authenticate(req, res, next);

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
      await authenticate(req, res, next);

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

      // Act
      await authenticate(req, res, next);

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
      authService.getUserById.mockResolvedValueOnce(null);

      // Act
      await authenticate(req, res, next);

      // Assert
      expect(authService.verifyToken).toHaveBeenCalledWith('valid-token');
      expect(authService.getUserById).toHaveBeenCalledWith('user123');
      expect(req.user).toBeNull();
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });
  });

  describe('requireRole', () => {
    it('should pass when user has required role', async () => {
      // Arrange
      req.user = {
        _id: 'admin123',
        email: 'admin@example.com',
        role: 'admin'
      };
      const middleware = requireRole('admin');

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
      const middleware = requireRole('admin');

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
      const middleware = requireRole('admin');

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
      const middleware = requireRole(['user', 'admin']);

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
      const middleware = requireRole('admin');

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
