/**
 * Authentication API Integration Tests
 */

const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { app } = require('../../../app');
const User = require('../../../models/user.model');
require('@tests/utils\test-helpers');

describe('Authentication API', () => {
  let testUser;
  
  // Setup before all tests
  beforeAll(async () => {
    // Create test user with hashed password
    const hashedPassword = await bcrypt.hash('password123', 10);
    testUser = await createTestUser({
      email: 'auth-test@example.com',
      password: hashedPassword,
      permissions: ['chatbot:read', 'chatbot:write']
    });
  });
  
  // Clean up after all tests
  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({ email: 'auth-test@example.com' });
  });
  
  // Test user registration
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      // User data
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123'
      };
      
      // Make request
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);
      
      // Check response
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).toHaveProperty('_id');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.username).toBe(userData.username);
      expect(response.body.data.user).not.toHaveProperty('password');
      
      // Check that user was created in database
      const user = await User.findOne({ email: userData.email });
      expect(user).not.toBeNull();
      expect(user.username).toBe(userData.username);
      
      // Clean up
      await User.deleteOne({ email: userData.email });
    });
    
    it('should return 400 if email already exists', async () => {
      // User data with existing email
      const userData = {
        username: 'duplicateuser',
        email: testUser.email, // Use existing email
        password: 'password123'
      };
      
      // Make request
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);
      
      // Check response
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('already exists');
    });
    
    it('should return 400 if required fields are missing', async () => {
      // User data with missing fields
      const userData = {
        username: 'incompleteuser',
        // Missing email
        password: 'password123'
      };
      
      // Make request
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);
      
      // Check response
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('required fields');
    });
    
    it('should return 400 if password is too short', async () => {
      // User data with short password
      const userData = {
        username: 'weakpassuser',
        email: 'weak@example.com',
        password: '123' // Too short
      };
      
      // Make request
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);
      
      // Check response
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('password');
    });
  });
  
  // Test user login
  describe('POST /api/auth/login', () => {
    it('should login a user with valid credentials', async () => {
      // Login data
      const loginData = {
        email: testUser.email,
        password: 'password123' // Plain password
      };
      
      // Make request
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);
      
      // Check response
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).toHaveProperty('_id');
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user).not.toHaveProperty('password');
    });
    
    it('should return 401 with invalid password', async () => {
      // Login data with wrong password
      const loginData = {
        email: testUser.email,
        password: 'wrongpassword'
      };
      
      // Make request
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);
      
      // Check response
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Invalid credentials');
    });
    
    it('should return 404 with non-existent email', async () => {
      // Login data with non-existent email
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };
      
      // Make request
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(404);
      
      // Check response
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('User not found');
    });
  });
  
  // Test token verification
  describe('GET /api/auth/verify', () => {
    it('should verify a valid token', async () => {
      // Generate token
      const token = generateToken(testUser);
      
      // Make request
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      // Check response
      expect(response.body.status).toBe('success');
      expect(response.body.data.valid).toBe(true);
      expect(response.body.data.user).toHaveProperty('_id');
      expect(response.body.data.user.email).toBe(testUser.email);
    });
    
    it('should return 401 with invalid token', async () => {
      // Invalid token
      const invalidToken = 'invalid.token.here';
      
      // Make request
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);
      
      // Check response
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Invalid token');
    });
    
    it('should return 401 with missing token', async () => {
      // Make request without token
      const response = await request(app)
        .get('/api/auth/verify')
        .expect(401);
      
      // Check response
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('No token provided');
    });
  });
  
  // Test password reset request
  describe('POST /api/auth/reset-password-request', () => {
    it('should generate a password reset token', async () => {
      // Request data
      const requestData = {
        email: testUser.email
      };
      
      // Make request
      const response = await request(app)
        .post('/api/auth/reset-password-request')
        .send(requestData)
        .expect(200);
      
      // Check response
      expect(response.body.status).toBe('success');
      expect(response.body.message).toContain('Password reset email sent');
      
      // Check that reset token was generated in database
      const user = await User.findById(testUser._id);
      expect(user.resetPasswordToken).toBeDefined();
      expect(user.resetPasswordExpires).toBeDefined();
    });
    
    it('should return 404 for non-existent email', async () => {
      // Request data with non-existent email
      const requestData = {
        email: 'nonexistent@example.com'
      };
      
      // Make request
      const response = await request(app)
        .post('/api/auth/reset-password-request')
        .send(requestData)
        .expect(404);
      
      // Check response
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('User not found');
    });
  });
  
  // Test password reset
  describe('POST /api/auth/reset-password', () => {
    let resetToken;
    
    // Generate reset token before test
    beforeEach(async () => {
      // Generate a reset token
      resetToken = 'test-reset-token-' + Date.now();
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now
      
      // Update user with reset token
      await User.findByIdAndUpdate(testUser._id, {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires
      });
    });
    
    it('should reset password with valid token', async () => {
      // Reset data
      const resetData = {
        token: resetToken,
        password: 'newpassword123'
      };
      
      // Make request
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send(resetData)
        .expect(200);
      
      // Check response
      expect(response.body.status).toBe('success');
      expect(response.body.message).toContain('Password has been reset');
      
      // Check that password was updated and token cleared
      const user = await User.findById(testUser._id);
      expect(user.resetPasswordToken).toBeUndefined();
      expect(user.resetPasswordExpires).toBeUndefined();
      
      // Verify new password works
      const isMatch = await bcrypt.compare('newpassword123', user.password);
      expect(isMatch).toBe(true);
      
      // Reset password back for other tests
      const hashedPassword = await bcrypt.hash('password123', 10);
      await User.findByIdAndUpdate(testUser._id, { password: hashedPassword });
    });
    
    it('should return 400 with invalid token', async () => {
      // Reset data with invalid token
      const resetData = {
        token: 'invalid-token',
        password: 'newpassword123'
      };
      
      // Make request
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send(resetData)
        .expect(400);
      
      // Check response
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Invalid or expired token');
    });
    
    it('should return 400 with expired token', async () => {
      // Update user with expired reset token
      await User.findByIdAndUpdate(testUser._id, {
        resetPasswordExpires: new Date(Date.now() - 3600000) // 1 hour ago
      });
      
      // Reset data
      const resetData = {
        token: resetToken,
        password: 'newpassword123'
      };
      
      // Make request
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send(resetData)
        .expect(400);
      
      // Check response
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Invalid or expired token');
    });
  });
});
