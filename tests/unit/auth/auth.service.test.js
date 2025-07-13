/**
 * Auth Service Tests
 */

// Mock dependencies before importing the auth service
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-token'),
  verify: jest.fn().mockImplementation((token, secret) => {
    if (token === 'valid-token') {
      return { userId: 'user123', role: 'user' };
    } else {
      throw new Error('Invalid token');
    }
  })
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockImplementation((password, hash) => {
    return Promise.resolve(password === 'correct-password');
  })
}));

jest.mock('../../../src/models/user.model', () => ({
  findById: jest.fn().mockImplementation(id => {
    if (id === 'user123') {
      return Promise.resolve({
        _id: 'user123',
        email: 'test@example.com',
        password: 'hashed-password',
        role: 'user'
      });
    }
    return Promise.resolve(null);
  }),
  findOne: jest.fn().mockImplementation(query => {
    if (query.email === 'test@example.com') {
      return Promise.resolve({
        _id: 'user123',
        email: 'test@example.com',
        password: 'hashed-password',
        role: 'user'
      });
    }
    return Promise.resolve(null);
  })
}));

jest.mock('../../../src/utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

jest.mock('../../../src/config', () => ({
  auth: {
    jwtSecret: 'test-secret',
    jwtExpiration: '1h',
    saltRounds: 10,
    issuer: 'customizable-chatbots',
    audience: 'chatbot-users',
    refreshTokenSecret: 'refresh-test-secret'
  }
}));

// Import mocked dependencies
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../../src/models/user.model');
const config = require('../../../src/config');
const logger = require('../../../src/utils/logger');

// Import the auth service class AFTER mocks are set up
// Important: we're importing the class, not the singleton instance
const { AuthService } = require('../../../src/services/auth.service');

// Create a new instance of AuthService for testing
let authService;

describe('Auth Service', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    // Create a fresh instance for each test
    authService = new AuthService();
  });

  describe('generateToken', () => {
    it('should generate a JWT token for a user', async () => {
      // Arrange
      const user = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'user'
      };

      // Act
      const token = await authService.generateToken(user);

      // Assert
      expect(token).toBe('mock-token');
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ 
          userId: 'user123', 
          email: 'test@example.com', 
          role: 'user' 
        }),
        config.auth.jwtSecret,
        expect.objectContaining({
          expiresIn: config.auth.jwtExpiration
        })
      );
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', async () => {
      // Arrange
      const token = 'valid-token';

      // Act
      const result = await authService.verifyToken(token);

      // Assert
      expect(result).toEqual({ userId: 'user123', role: 'user' });
      expect(jwt.verify).toHaveBeenCalledWith(token, config.auth.jwtSecret);
    });

    it('should reject an invalid token', async () => {
      // Arrange
      const token = 'invalid-token';

      // Act & Assert
      await expect(authService.verifyToken(token)).rejects.toThrow('Invalid token');
      expect(jwt.verify).toHaveBeenCalledWith(token, config.auth.jwtSecret);
    });
  });

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      // Arrange
      const password = 'password123';

      // Act
      const hashedPassword = await authService.hashPassword(password);

      // Assert
      expect(hashedPassword).toBe('hashed-password');
      expect(bcrypt.hash).toHaveBeenCalledWith(password, config.auth.saltRounds);
    });
  });

  describe('comparePasswords', () => {
    it('should return true for matching passwords', async () => {
      // Arrange
      const password = 'correct-password';
      const hashedPassword = 'hashed-password';

      // Act
      const result = await authService.comparePasswords(password, hashedPassword);

      // Assert
      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });

    it('should return false for non-matching passwords', async () => {
      // Arrange
      const password = 'wrong-password';
      const hashedPassword = 'hashed-password';

      // Act
      const result = await authService.comparePasswords(password, hashedPassword);

      // Assert
      expect(result).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });
  });

  describe('authenticateUser', () => {
    it('should authenticate a user with valid credentials', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'correct-password';
      
      // Act
      const result = await authService.authenticateUser(email, password);

      // Assert
      expect(result).toEqual({
        user: {
          _id: 'user123',
          email: 'test@example.com',
          role: 'user'
        },
        token: 'mock-token'
      });
      expect(User.findOne).toHaveBeenCalledWith({ email });
      // We're testing the actual implementation which calls comparePasswords internally
      expect(bcrypt.compare).toHaveBeenCalledWith(password, 'hashed-password');
    });

    it('should reject authentication with invalid email', async () => {
      // Arrange
      const email = 'wrong@example.com';
      const password = 'password123';

      // Act & Assert
      await expect(authService.authenticateUser(email, password)).rejects.toThrow('Invalid credentials');
      expect(User.findOne).toHaveBeenCalledWith({ email });
    });

    it('should reject authentication with invalid password', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'wrong-password';
      
      // Act & Assert
      await expect(authService.authenticateUser(email, password)).rejects.toThrow('Invalid credentials');
      expect(User.findOne).toHaveBeenCalledWith({ email });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, 'hashed-password');
    });
  });

  describe('getUserById', () => {
    it('should return a user by ID', async () => {
      // Arrange
      const userId = 'user123';

      // Act
      const user = await authService.getUserById(userId);

      // Assert
      expect(user).toEqual({
        _id: 'user123',
        email: 'test@example.com',
        password: 'hashed-password',
        role: 'user'
      });
      expect(User.findById).toHaveBeenCalledWith(userId);
    });

    it('should return null for non-existent user', async () => {
      // Arrange
      const userId = 'nonexistent';

      // Act
      const user = await authService.getUserById(userId);

      // Assert
      expect(user).toBeNull();
      expect(User.findById).toHaveBeenCalledWith(userId);
    });
  });

  describe('validatePermissions', () => {
    it('should return true when user has sufficient permissions', async () => {
      // Arrange
      const userId = 'user123';
      const requiredRole = 'user';

      // Act
      const result = await authService.validatePermissions(userId, requiredRole);

      // Assert
      expect(result).toBe(true);
      // validatePermissions calls getUserById which calls User.findById
      expect(User.findById).toHaveBeenCalledWith(userId);
    });

    it('should return false when user has insufficient permissions', async () => {
      // Arrange
      const userId = 'user123';
      const requiredRole = 'admin';

      // Act
      const result = await authService.validatePermissions(userId, requiredRole);

      // Assert
      expect(result).toBe(false);
      // validatePermissions calls getUserById which calls User.findById
      expect(User.findById).toHaveBeenCalledWith(userId);
    });

    it('should return false when user does not exist', async () => {
      // Arrange
      const userId = 'nonexistent';
      const requiredRole = 'user';

      // Act
      const result = await authService.validatePermissions(userId, requiredRole);

      // Assert
      expect(result).toBe(false);
      expect(User.findById).toHaveBeenCalledWith(userId);
    });
  });
});
