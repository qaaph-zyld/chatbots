/**
 * Auth Service Tests
 */

// Mock dependencies before importing the auth service
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-token'),
  verify: jest.fn().mockImplementation((token, secret, callback) => {
    if (token === 'valid-token') {
      callback(null, { userId: 'user123', role: 'user' });
    } else {
      callback(new Error('Invalid token'));
    }
  })
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockImplementation((password, hash) => {
    return Promise.resolve(password === 'correct-password');
  })
}));

jest.mock('../../../models/user.model', () => {
  return {
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
  };
});

jest.mock('../../../utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

jest.mock('../../../config', () => ({
  auth: {
    jwtSecret: 'test-secret',
    jwtExpiresIn: '1h',
    saltRounds: 10
  }
}));

// Import the auth service after mocks
const authService = require('../../../auth/auth.service');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../../../models/user.model');
const logger = require('../../../utils/logger');
const config = require('../../../config');

describe('Auth Service', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    it('should generate a JWT token for a user', () => {
      // Arrange
      const user = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'user'
      };

      // Act
      const token = authService.generateToken(user);

      // Assert
      expect(token).toBe('mock-token');
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 'user123', email: 'test@example.com', role: 'user' },
        config.auth.jwtSecret,
        { expiresIn: config.auth.jwtExpiresIn }
      );
      expect(logger.debug).toHaveBeenCalledWith('Generated JWT token for user', { userId: 'user123' });
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
      expect(jwt.verify).toHaveBeenCalledWith(
        token,
        config.auth.jwtSecret,
        expect.any(Function)
      );
      expect(logger.debug).toHaveBeenCalledWith('Verified JWT token', { userId: 'user123' });
    });

    it('should reject an invalid token', async () => {
      // Arrange
      const token = 'invalid-token';

      // Act & Assert
      await expect(authService.verifyToken(token)).rejects.toThrow('Invalid token');
      expect(jwt.verify).toHaveBeenCalledWith(
        token,
        config.auth.jwtSecret,
        expect.any(Function)
      );
      expect(logger.warn).toHaveBeenCalledWith('Invalid JWT token', expect.any(Object));
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
      expect(bcrypt.compare).toHaveBeenCalledWith(password, 'hashed-password');
      expect(jwt.sign).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('User authenticated successfully', { userId: 'user123' });
    });

    it('should reject authentication with invalid email', async () => {
      // Arrange
      const email = 'wrong@example.com';
      const password = 'password123';

      // Act & Assert
      await expect(authService.authenticateUser(email, password)).rejects.toThrow('Invalid credentials');
      expect(User.findOne).toHaveBeenCalledWith({ email });
      expect(logger.warn).toHaveBeenCalledWith('Authentication failed: User not found', { email });
    });

    it('should reject authentication with invalid password', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'wrong-password';

      // Act & Assert
      await expect(authService.authenticateUser(email, password)).rejects.toThrow('Invalid credentials');
      expect(User.findOne).toHaveBeenCalledWith({ email });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, 'hashed-password');
      expect(logger.warn).toHaveBeenCalledWith('Authentication failed: Invalid password', { userId: 'user123' });
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
});
