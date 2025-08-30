/**
 * Authentication Flow Integration Tests
 * 
 * Tests the complete authentication flow including registration, login, and token validation
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
require('@src/app');
require('@src/models\user.model');
const jwt = require('jsonwebtoken');
require('@src/config');

describe('Authentication Flow Integration', () => {
  let mongoServer;
  
  beforeAll(async () => {
    // Start in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to in-memory database
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });
  
  afterAll(async () => {
    // Disconnect and stop MongoDB server
    await mongoose.disconnect();
    await mongoServer.stop();
  });
  
  beforeEach(async () => {
    // Clear users collection before each test
    await User.deleteMany({});
  });
  
  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };
      
      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);
      
      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('username', userData.username);
      expect(response.body.user).toHaveProperty('email', userData.email);
      expect(response.body.user).not.toHaveProperty('password'); // Password should not be returned
      expect(response.body).toHaveProperty('token');
      
      // Verify user was created in database
      const userInDb = await User.findOne({ email: userData.email });
      expect(userInDb).toBeTruthy();
      expect(userInDb.username).toBe(userData.username);
    });
    
    it('should validate required fields during registration', async () => {
      // Arrange
      const incompleteUserData = {
        username: 'incomplete',
        // Missing email
        password: 'Password123!'
        // Missing confirmPassword
      };
      
      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(incompleteUserData);
      
      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      
      // Verify user was not created in database
      const userInDb = await User.findOne({ username: incompleteUserData.username });
      expect(userInDb).toBeNull();
    });
    
    it('should validate password strength during registration', async () => {
      // Arrange
      const weakPasswordData = {
        username: 'weakuser',
        email: 'weak@example.com',
        password: '12345', // Too short and simple
        confirmPassword: '12345'
      };
      
      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(weakPasswordData);
      
      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('password');
      
      // Verify user was not created in database
      const userInDb = await User.findOne({ email: weakPasswordData.email });
      expect(userInDb).toBeNull();
    });
    
    it('should prevent duplicate email registration', async () => {
      // Arrange
      const userData = {
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };
      
      // Create user first
      await User.create({
        username: userData.username,
        email: userData.email,
        password: '$2b$10$abcdefghijklmnopqrstuvwxyz12345678901234567890' // Hashed password
      });
      
      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);
      
      // Assert
      expect(response.status).toBe(409); // Conflict
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('already exists');
    });
  });
  
  describe('User Login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: '$2b$10$abcdefghijklmnopqrstuvwxyz12345678901234567890', // Hashed 'password123'
        role: 'user'
      });
    });
    
    it('should login successfully with valid credentials', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', loginData.email);
      expect(response.body).toHaveProperty('token');
      
      // Verify token is valid
      const decodedToken = jwt.verify(response.body.token, config.auth.jwtSecret);
      expect(decodedToken).toHaveProperty('userId');
      expect(decodedToken).toHaveProperty('email', loginData.email);
    });
    
    it('should reject login with incorrect password', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };
      
      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);
      
      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid credentials');
      expect(response.body).not.toHaveProperty('token');
    });
    
    it('should reject login for non-existent user', async () => {
      // Arrange
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };
      
      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);
      
      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid credentials');
      expect(response.body).not.toHaveProperty('token');
    });
  });
  
  describe('Authentication Middleware', () => {
    let authToken;
    let testUser;
    
    beforeEach(async () => {
      // Create a test user
      testUser = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: '$2b$10$abcdefghijklmnopqrstuvwxyz12345678901234567890', // Hashed 'password123'
        role: 'user'
      });
      
      // Get auth token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      
      authToken = loginResponse.body.token;
    });
    
    it('should allow access to protected routes with valid token', async () => {
      // Act
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', testUser.email);
    });
    
    it('should deny access to protected routes without token', async () => {
      // Act
      const response = await request(app)
        .get('/api/auth/profile');
      
      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Authentication required');
    });
    
    it('should deny access with invalid token', async () => {
      // Act
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token');
      
      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should enforce role-based access control', async () => {
      // Create an admin user
      const adminUser = await User.create({
        username: 'adminuser',
        email: 'admin@example.com',
        password: '$2b$10$abcdefghijklmnopqrstuvwxyz12345678901234567890', // Hashed 'password123'
        role: 'admin'
      });
      
      // Get admin token
      const adminLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'password123'
        });
      
      const adminToken = adminLoginResponse.body.token;
      
      // Test admin-only route with regular user token
      const regularUserResponse = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${authToken}`);
      
      // Assert regular user is denied
      expect(regularUserResponse.status).toBe(403);
      expect(regularUserResponse.body).toHaveProperty('success', false);
      expect(regularUserResponse.body).toHaveProperty('error');
      expect(regularUserResponse.body.error).toContain('Access denied');
      
      // Test admin-only route with admin token
      const adminResponse = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);
      
      // Assert admin is allowed
      expect(adminResponse.status).toBe(200);
      expect(adminResponse.body).toHaveProperty('success', true);
    });
  });
  
  describe('Password Reset Flow', () => {
    beforeEach(async () => {
      // Create a test user
      await User.create({
        username: 'resetuser',
        email: 'reset@example.com',
        password: '$2b$10$abcdefghijklmnopqrstuvwxyz12345678901234567890', // Hashed 'password123'
        role: 'user'
      });
    });
    
    it('should generate a password reset token', async () => {
      // Arrange
      const resetData = {
        email: 'reset@example.com'
      };
      
      // Act
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send(resetData);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('reset link');
      
      // Verify user has reset token in database
      const userInDb = await User.findOne({ email: resetData.email });
      expect(userInDb).toHaveProperty('resetPasswordToken');
      expect(userInDb).toHaveProperty('resetPasswordExpires');
      expect(userInDb.resetPasswordExpires).toBeInstanceOf(Date);
      expect(userInDb.resetPasswordExpires.getTime()).toBeGreaterThan(Date.now());
    });
    
    it('should reset password with valid token', async () => {
      // Arrange
      const user = await User.findOne({ email: 'reset@example.com' });
      const resetToken = 'valid-reset-token';
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now
      
      // Set reset token directly in database
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = resetExpires;
      await user.save();
      
      const resetData = {
        token: resetToken,
        password: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      };
      
      // Act
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send(resetData);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('successfully');
      
      // Verify password was changed and token was cleared
      const updatedUser = await User.findOne({ email: 'reset@example.com' });
      expect(updatedUser.resetPasswordToken).toBeUndefined();
      expect(updatedUser.resetPasswordExpires).toBeUndefined();
      
      // Try logging in with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'reset@example.com',
          password: 'NewPassword123!'
        });
      
      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toHaveProperty('token');
    });
    
    it('should reject password reset with expired token', async () => {
      // Arrange
      const user = await User.findOne({ email: 'reset@example.com' });
      const resetToken = 'expired-reset-token';
      const resetExpires = new Date(Date.now() - 3600000); // 1 hour ago (expired)
      
      // Set expired reset token directly in database
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = resetExpires;
      await user.save();
      
      const resetData = {
        token: resetToken,
        password: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      };
      
      // Act
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send(resetData);
      
      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('expired');
    });
  });
});
