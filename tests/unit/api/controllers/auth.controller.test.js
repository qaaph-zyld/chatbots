/**
 * Unit tests for authentication controller
 */

// Mock dependencies - must be at the top level before imports
jest.mock('@src/auth/auth.service', () => ({
  registerUser: jest.fn(),
  loginUser: jest.fn(),
  refreshToken: jest.fn(),
  logoutUser: jest.fn(),
  requestPasswordReset: jest.fn(),
  resetPassword: jest.fn(),
  generateApiKey: jest.fn()
}));

jest.mock('@src/models/user.model', () => ({
  User: {
    findById: jest.fn().mockReturnThis(),
    findOne: jest.fn().mockReturnThis(),
    find: jest.fn().mockReturnThis(),
    findByIdAndUpdate: jest.fn().mockReturnThis(),
    findByIdAndDelete: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    exec: jest.fn(),
    save: jest.fn()
  }
}));

jest.mock('@src/utils/token.service', () => ({
  generateAuthTokens: jest.fn(),
  verifyRefreshToken: jest.fn(),
  clearTokens: jest.fn()
}));

jest.mock('@src/utils/apiError', () => ({
  NotFoundError: jest.fn(message => ({
    name: 'NotFoundError',
    message,
    statusCode: 404
  })),
  BadRequestError: jest.fn(message => ({
    name: 'BadRequestError',
    message,
    statusCode: 400
  })),
  UnauthorizedError: jest.fn(message => ({
    name: 'UnauthorizedError',
    message,
    statusCode: 401
  })),
  ForbiddenError: jest.fn(message => ({
    name: 'ForbiddenError',
    message,
    statusCode: 403
  }))
}));

jest.mock('@src/utils', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn()
  }
}));

const httpMocks = require('node-mocks-http');

describe('Authentication Controller', () => {
  let authController;
  let authService;
  let userModel;
  let tokenService;
  let apiError;
  let logger;
  
  beforeEach(() => {
    // Get the mocked modules
    authService = require('@src/auth/auth.service');
    userModel = require('@src/models/user.model').User;
    tokenService = require('@src/utils/token.service');
    apiError = require('@src/utils/apiError');
    logger = require('@src/utils').logger;
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Load the controller module
    authController = require('../../../../src/api/controllers/auth.controller');
  });
  
  describe('register', () => {
    it('should register a new user and return 201 status code', async () => {
      // Arrange
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!'
      };
      
      const createdUser = {
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        createdAt: new Date()
      };
      
      const req = httpMocks.createRequest({
        body: userData
      });
      
      const res = httpMocks.createResponse();
      const next = jest.fn();
      
      authService.registerUser.mockResolvedValue(createdUser);
      
      // Act
      await authController.register(req, res, next);
      const responseData = JSON.parse(res._getData());
      
      // Assert
      expect(res._getStatusCode()).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toEqual(createdUser);
      
      expect(authService.registerUser).toHaveBeenCalledWith(userData);
    });
    
    it('should handle duplicate user error with 409 status code', async () => {
      // Arrange
      const userData = {
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'Password123!'
      };
      
      const req = httpMocks.createRequest({
        body: userData
      });
      
      const res = httpMocks.createResponse();
      const next = jest.fn();
      
      const duplicateError = new Error('User with this email already exists');
      authService.registerUser.mockRejectedValue(duplicateError);
      
      // Act
      await authController.register(req, res, next);
      const responseData = JSON.parse(res._getData());
      
      // Assert
      expect(res._getStatusCode()).toBe(409);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('User with this email already exists');
      
      expect(logger.error).toHaveBeenCalledWith('Error in register:', 'User with this email already exists');
    });
    
    it('should handle other errors with next middleware', async () => {
      // Arrange
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!'
      };
      
      const req = httpMocks.createRequest({
        body: userData
      });
      
      const res = httpMocks.createResponse();
      const next = jest.fn();
      
      const error = new Error('Database connection error');
      authService.registerUser.mockRejectedValue(error);
      
      // Act
      await authController.register(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(logger.error).toHaveBeenCalledWith('Error in register:', 'Database connection error');
    });
  });
  
  describe('login', () => {
    it('should login user and return tokens with 200 status code', async () => {
      // Arrange
      const loginData = {
        username: 'testuser',
        password: 'Password123!'
      };
      
      const user = {
        id: '123',
        username: 'testuser',
        email: 'test@example.com'
      };
      
      const tokens = {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123'
      };
      
      const req = httpMocks.createRequest({
        body: loginData
      });
      
      const res = httpMocks.createResponse();
      const next = jest.fn();
      
      authService.loginUser.mockResolvedValue({ user, tokens });
      
      // Act
      await authController.login(req, res, next);
      const responseData = JSON.parse(res._getData());
      
      // Assert
      expect(res._getStatusCode()).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.user).toEqual(user);
      expect(responseData.data.tokens).toEqual(tokens);
      
      expect(authService.loginUser).toHaveBeenCalledWith(loginData.username, loginData.password);
    });
    
    it('should return 400 when username or password is missing', async () => {
      // Arrange
      const req = httpMocks.createRequest({
        body: {
          username: 'testuser'
          // Missing password
        }
      });
      
      const res = httpMocks.createResponse();
      const next = jest.fn();
      
      // Act
      await authController.login(req, res, next);
      const responseData = JSON.parse(res._getData());
      
      // Assert
      expect(res._getStatusCode()).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Username and password are required');
    });
    
    it('should handle invalid credentials with 401 status code', async () => {
      // Arrange
      const loginData = {
        username: 'testuser',
        password: 'wrongpassword'
      };
      
      const req = httpMocks.createRequest({
        body: loginData
      });
      
      const res = httpMocks.createResponse();
      const next = jest.fn();
      
      const authError = new Error('Invalid credentials');
      authError.statusCode = 401;
      authService.loginUser.mockRejectedValue(authError);
      
      // Act
      await authController.login(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(authError);
    });
  });
  
  describe('refreshToken', () => {
    it('should refresh tokens and return new tokens with 200 status code', async () => {
      // Arrange
      const refreshToken = 'refresh-token-123';
      
      const newTokens = {
        accessToken: 'new-access-token-123',
        refreshToken: 'new-refresh-token-123'
      };
      
      const req = httpMocks.createRequest({
        body: { refreshToken }
      });
      
      const res = httpMocks.createResponse();
      const next = jest.fn();
      
      authService.refreshToken.mockResolvedValue(newTokens);
      
      // Act
      await authController.refreshToken(req, res, next);
      const responseData = JSON.parse(res._getData());
      
      // Assert
      expect(res._getStatusCode()).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toEqual(newTokens);
      
      expect(authService.refreshToken).toHaveBeenCalledWith(refreshToken);
    });
    
    it('should return 400 when refresh token is missing', async () => {
      // Arrange
      const req = httpMocks.createRequest({
        body: {}
      });
      
      const res = httpMocks.createResponse();
      const next = jest.fn();
      
      // Act
      await authController.refreshToken(req, res, next);
      const responseData = JSON.parse(res._getData());
      
      // Assert
      expect(res._getStatusCode()).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Refresh token is required');
    });
    
    it('should handle invalid refresh token with next middleware', async () => {
      // Arrange
      const refreshToken = 'invalid-refresh-token';
      
      const req = httpMocks.createRequest({
        body: { refreshToken }
      });
      
      const res = httpMocks.createResponse();
      const next = jest.fn();
      
      const tokenError = new Error('Invalid refresh token');
      authService.refreshToken.mockRejectedValue(tokenError);
      
      // Act
      await authController.refreshToken(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(tokenError);
    });
  });
  
  describe('logout', () => {
    it('should logout user and return 200 status code', async () => {
      // Arrange
      const refreshToken = 'refresh-token-123';
      
      const req = httpMocks.createRequest({
        body: { refreshToken }
      });
      
      const res = httpMocks.createResponse();
      const next = jest.fn();
      
      // Act
      await authController.logout(req, res, next);
      const responseData = JSON.parse(res._getData());
      
      // Assert
      expect(res._getStatusCode()).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe('Logged out successfully');
      
      expect(authService.logoutUser).toHaveBeenCalledWith(refreshToken);
    });
    
    it('should return 400 when refresh token is missing', async () => {
      // Arrange
      const req = httpMocks.createRequest({
        body: {}
      });
      
      const res = httpMocks.createResponse();
      const next = jest.fn();
      
      // Act
      await authController.logout(req, res, next);
      const responseData = JSON.parse(res._getData());
      
      // Assert
      expect(res._getStatusCode()).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Refresh token is required');
    });
    
    it('should handle errors with next middleware', async () => {
      // Arrange
      const refreshToken = 'refresh-token-123';
      
      const req = httpMocks.createRequest({
        body: { refreshToken }
      });
      
      const res = httpMocks.createResponse();
      const next = jest.fn();
      
      const error = new Error('Logout error');
      authService.logoutUser.mockRejectedValue(error);
      
      // Act
      await authController.logout(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(error);
    });
  });
  
  describe('getCurrentUser', () => {
    it('should return current user with 200 status code', async () => {
      // Arrange
      const user = {
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user'
      };
      
      const req = httpMocks.createRequest({
        user
      });
      
      const res = httpMocks.createResponse();
      const next = jest.fn();
      
      // Act
      await authController.getCurrentUser(req, res, next);
      const responseData = JSON.parse(res._getData());
      
      // Assert
      expect(res._getStatusCode()).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toEqual(user);
    });
    
    it('should handle errors with next middleware', async () => {
      // Arrange
      const req = httpMocks.createRequest({
        user: null
      });
      
      const res = httpMocks.createResponse();
      const next = jest.fn();
      
      const error = new Error('User not found');
      
      // Mock the error by making req.user access throw an error
      Object.defineProperty(req, 'user', {
        get: () => { throw error; }
      });
      
      // Act
      await authController.getCurrentUser(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(error);
    });
  });
  
  describe('generateApiKey', () => {
    it('should generate API key and return with 200 status code', async () => {
      // Arrange
      const userId = '123';
      const apiKey = {
        key: 'api-key-123',
        userId: '123',
        createdAt: new Date()
      };
      
      const req = httpMocks.createRequest({
        user: { id: userId }
      });
      
      const res = httpMocks.createResponse();
      const next = jest.fn();
      
      authService.generateApiKey.mockResolvedValue(apiKey);
      
      // Act
      await authController.generateApiKey(req, res, next);
      const responseData = JSON.parse(res._getData());
      
      // Assert
      expect(res._getStatusCode()).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toEqual(apiKey);
      
      expect(authService.generateApiKey).toHaveBeenCalledWith(userId);
    });
    
    it('should handle errors with next middleware', async () => {
      // Arrange
      const userId = '123';
      
      const req = httpMocks.createRequest({
        user: { id: userId }
      });
      
      const res = httpMocks.createResponse();
      const next = jest.fn();
      
      const error = new Error('API key generation error');
      authService.generateApiKey.mockRejectedValue(error);
      
      // Act
      await authController.generateApiKey(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(error);
    });
  });
  
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });
});
