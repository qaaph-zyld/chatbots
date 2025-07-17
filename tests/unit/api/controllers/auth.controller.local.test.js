/**
 * Unit tests for authentication controller
 * Local version using only relative paths to avoid module mapping issues
 */

// Mock dependencies - must be at the top level before imports
jest.mock('../../../../src/auth/auth.service', () => ({
  registerUser: jest.fn(),
  loginUser: jest.fn(),
  refreshToken: jest.fn(),
  logoutUser: jest.fn(),
  requestPasswordReset: jest.fn(),
  resetPassword: jest.fn(),
  generateApiKey: jest.fn()
}));

jest.mock('../../../../src/models/user.model', () => ({
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

jest.mock('../../../../src/utils/token.service', () => ({
  generateAuthTokens: jest.fn(),
  verifyRefreshToken: jest.fn(),
  clearTokens: jest.fn()
}));

jest.mock('../../../../src/utils/apiError', () => ({
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

jest.mock('../../../../src/utils', () => ({
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
    authService = require('../../../../src/auth/auth.service');
    userModel = require('../../../../src/models/user.model').User;
    tokenService = require('../../../../src/utils/token.service');
    apiError = require('../../../../src/utils/apiError');
    logger = require('../../../../src/utils').logger;
    
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
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should pass error to next middleware if registration fails', async () => {
      // Arrange
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!'
      };
      
      const error = new Error('Registration failed');
      
      const req = httpMocks.createRequest({
        body: userData
      });
      
      const res = httpMocks.createResponse();
      const next = jest.fn();
      
      authService.registerUser.mockRejectedValue(error);
      
      // Act
      await authController.register(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res._getData()).toBe('');
    });
  });
  
  describe('login', () => {
    it('should login user and return tokens with 200 status code', async () => {
      // Arrange
      const loginData = {
        username: 'testuser',
        password: 'Password123!'
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
      
      authService.loginUser.mockResolvedValue(tokens);
      
      // Act
      await authController.login(req, res, next);
      const responseData = JSON.parse(res._getData());
      
      // Assert
      expect(res._getStatusCode()).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toEqual(tokens);
      expect(authService.loginUser).toHaveBeenCalledWith(loginData.username, loginData.password);
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should pass error to next middleware if login fails', async () => {
      // Arrange
      const loginData = {
        username: 'testuser',
        password: 'Password123!'
      };
      
      const error = new Error('Login failed');
      
      const req = httpMocks.createRequest({
        body: loginData
      });
      
      const res = httpMocks.createResponse();
      const next = jest.fn();
      
      authService.loginUser.mockRejectedValue(error);
      
      // Act
      await authController.login(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res._getData()).toBe('');
    });
  });
  
  describe('refresh', () => {
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
      await authController.refresh(req, res, next);
      const responseData = JSON.parse(res._getData());
      
      // Assert
      expect(res._getStatusCode()).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toEqual(newTokens);
      expect(authService.refreshToken).toHaveBeenCalledWith(refreshToken);
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should pass error to next middleware if token refresh fails', async () => {
      // Arrange
      const refreshToken = 'refresh-token-123';
      
      const error = new Error('Token refresh failed');
      
      const req = httpMocks.createRequest({
        body: { refreshToken }
      });
      
      const res = httpMocks.createResponse();
      const next = jest.fn();
      
      authService.refreshToken.mockRejectedValue(error);
      
      // Act
      await authController.refresh(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res._getData()).toBe('');
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
      
      authService.logoutUser.mockResolvedValue();
      
      // Act
      await authController.logout(req, res, next);
      const responseData = JSON.parse(res._getData());
      
      // Assert
      expect(res._getStatusCode()).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe('Logged out successfully');
      expect(authService.logoutUser).toHaveBeenCalledWith(refreshToken);
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should pass error to next middleware if logout fails', async () => {
      // Arrange
      const refreshToken = 'refresh-token-123';
      
      const error = new Error('Logout failed');
      
      const req = httpMocks.createRequest({
        body: { refreshToken }
      });
      
      const res = httpMocks.createResponse();
      const next = jest.fn();
      
      authService.logoutUser.mockRejectedValue(error);
      
      // Act
      await authController.logout(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res._getData()).toBe('');
    });
  });
  
  describe('getCurrentUser', () => {
    it('should return current user with 200 status code', async () => {
      // Arrange
      const userId = '123';
      const user = {
        id: userId,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user'
      };
      
      const req = httpMocks.createRequest({
        user: {
          id: userId
        }
      });
      
      const res = httpMocks.createResponse();
      const next = jest.fn();
      
      userModel.findById.mockReturnThis();
      userModel.select.mockReturnThis();
      userModel.exec.mockResolvedValue(user);
      
      // Act
      await authController.getCurrentUser(req, res, next);
      const responseData = JSON.parse(res._getData());
      
      // Assert
      expect(res._getStatusCode()).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toEqual(user);
      expect(userModel.findById).toHaveBeenCalledWith(userId);
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should pass error to next middleware if getting current user fails', async () => {
      // Arrange
      const userId = '123';
      const error = new Error('Failed to get user');
      
      const req = httpMocks.createRequest({
        user: {
          id: userId
        }
      });
      
      const res = httpMocks.createResponse();
      const next = jest.fn();
      
      userModel.findById.mockReturnThis();
      userModel.select.mockReturnThis();
      userModel.exec.mockRejectedValue(error);
      
      // Act
      await authController.getCurrentUser(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res._getData()).toBe('');
    });
  });
  
  describe('requestPasswordReset', () => {
    it('should request password reset and return 200 status code', async () => {
      // Arrange
      const email = 'test@example.com';
      
      const req = httpMocks.createRequest({
        body: { email }
      });
      
      const res = httpMocks.createResponse();
      const next = jest.fn();
      
      authService.requestPasswordReset.mockResolvedValue();
      
      // Act
      await authController.requestPasswordReset(req, res, next);
      const responseData = JSON.parse(res._getData());
      
      // Assert
      expect(res._getStatusCode()).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe('Password reset email sent');
      expect(authService.requestPasswordReset).toHaveBeenCalledWith(email);
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should pass error to next middleware if password reset request fails', async () => {
      // Arrange
      const email = 'test@example.com';
      
      const error = new Error('Password reset request failed');
      
      const req = httpMocks.createRequest({
        body: { email }
      });
      
      const res = httpMocks.createResponse();
      const next = jest.fn();
      
      authService.requestPasswordReset.mockRejectedValue(error);
      
      // Act
      await authController.requestPasswordReset(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res._getData()).toBe('');
    });
  });
  
  describe('resetPassword', () => {
    it('should reset password and return 200 status code', async () => {
      // Arrange
      const token = 'reset-token-123';
      const newPassword = 'NewPassword123!';
      
      const req = httpMocks.createRequest({
        body: { token, newPassword }
      });
      
      const res = httpMocks.createResponse();
      const next = jest.fn();
      
      authService.resetPassword.mockResolvedValue();
      
      // Act
      await authController.resetPassword(req, res, next);
      const responseData = JSON.parse(res._getData());
      
      // Assert
      expect(res._getStatusCode()).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe('Password reset successful');
      expect(authService.resetPassword).toHaveBeenCalledWith(token, newPassword);
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should pass error to next middleware if password reset fails', async () => {
      // Arrange
      const token = 'reset-token-123';
      const newPassword = 'NewPassword123!';
      
      const error = new Error('Password reset failed');
      
      const req = httpMocks.createRequest({
        body: { token, newPassword }
      });
      
      const res = httpMocks.createResponse();
      const next = jest.fn();
      
      authService.resetPassword.mockRejectedValue(error);
      
      // Act
      await authController.resetPassword(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res._getData()).toBe('');
    });
  });
  
  describe('generateApiKey', () => {
    it('should generate API key and return 200 status code', async () => {
      // Arrange
      const userId = '123';
      const apiKey = 'api-key-123';
      
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
      expect(responseData.data).toEqual({ apiKey });
      expect(authService.generateApiKey).toHaveBeenCalledWith(userId);
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should pass error to next middleware if API key generation fails', async () => {
      // Arrange
      const userId = '123';
      
      const error = new Error('API key generation failed');
      
      const req = httpMocks.createRequest({
        user: { id: userId }
      });
      
      const res = httpMocks.createResponse();
      const next = jest.fn();
      
      authService.generateApiKey.mockRejectedValue(error);
      
      // Act
      await authController.generateApiKey(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res._getData()).toBe('');
    });
  });
});
