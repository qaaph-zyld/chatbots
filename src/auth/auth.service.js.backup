/**
 * Authentication Service
 * 
 * Provides authentication and authorization capabilities for the chatbot platform
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
require('@src/utils');
require('@src/config');

// Define user schema
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'developer', 'user'],
    default: 'user'
  },
  apiKey: {
    type: String,
    unique: true,
    default: () => uuidv4()
  },
  permissions: [{
    type: String
  }],
  active: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
  // Only hash the password if it's modified or new
  if (!this.isModified('password')) return next();
  
  try {
    // Generate salt
    const salt = await bcrypt.genSalt(10);
    
    // Hash password
    this.password = await bcrypt.hash(this.password, salt);
    this.updatedAt = new Date();
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate JWT token
UserSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      username: this.username,
      email: this.email,
      role: this.role,
      permissions: this.permissions
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
};

// Method to generate refresh token
UserSchema.methods.generateRefreshToken = function() {
  return jwt.sign(
    { id: this._id },
    config.refreshTokenSecret,
    { expiresIn: config.refreshTokenExpiresIn }
  );
};

// Create model
const User = mongoose.model('User', UserSchema);

/**
 * Authentication Service class
 */
class AuthService {
  /**
   * Constructor
   */
  constructor() {
    this.tokenBlacklist = new Set();
    logger.info('Auth Service initialized');
  }
  
  /**
   * Register a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} - Created user
   */
  async registerUser(userData) {
    try {
      const { username, email, password, firstName, lastName, role } = userData;
      
      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [
          { username },
          { email }
        ]
      });
      
      if (existingUser) {
        if (existingUser.username === username) {
          throw new Error('Username already exists');
        } else {
          throw new Error('Email already exists');
        }
      }
      
      // Create new user
      const user = new User({
        username,
        email,
        password,
        firstName,
        lastName,
        role: role || 'user'
      });
      
      // Set default permissions based on role
      user.permissions = this.getDefaultPermissions(role || 'user');
      
      await user.save();
      logger.info(`User ${username} registered successfully`);
      
      // Return user without sensitive information
      return this.sanitizeUser(user);
    } catch (error) {
      logger.error('Error registering user:', error.message);
      throw error;
    }
  }
  
  /**
   * Login user
   * @param {string} username - Username or email
   * @param {string} password - Password
   * @returns {Promise<Object>} - Auth tokens and user data
   */
  async loginUser(username, password) {
    try {
      // Find user by username or email
      const user = await User.findOne({
        $or: [
          { username },
          { email: username }
        ]
      });
      
      if (!user) {
        throw new Error('Invalid username or password');
      }
      
      // Check if user is active
      if (!user.active) {
        throw new Error('Account is disabled');
      }
      
      // Check password
      const isMatch = await user.comparePassword(password);
      
      if (!isMatch) {
        throw new Error('Invalid username or password');
      }
      
      // Update last login
      user.lastLogin = new Date();
      await user.save();
      
      // Generate tokens
      const accessToken = user.generateAuthToken();
      const refreshToken = user.generateRefreshToken();
      
      logger.info(`User ${user.username} logged in successfully`);
      
      return {
        accessToken,
        refreshToken,
        user: this.sanitizeUser(user)
      };
    } catch (error) {
      logger.error('Error logging in user:', error.message);
      throw error;
    }
  }
  
  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} - New access token
   */
  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.refreshTokenSecret);
      
      // Get user
      const user = await User.findById(decoded.id);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Check if user is active
      if (!user.active) {
        throw new Error('Account is disabled');
      }
      
      // Generate new access token
      const accessToken = user.generateAuthToken();
      
      logger.info(`Access token refreshed for user ${user.username}`);
      
      return {
        accessToken
      };
    } catch (error) {
      logger.error('Error refreshing token:', error.message);
      throw error;
    }
  }
  
  /**
   * Logout user
   * @param {string} accessToken - Access token
   * @returns {Promise<boolean>} - True if logout successful
   */
  async logoutUser(accessToken) {
    try {
      // Add token to blacklist
      this.tokenBlacklist.add(accessToken);
      
      logger.info('User logged out successfully');
      
      return true;
    } catch (error) {
      logger.error('Error logging out user:', error.message);
      throw error;
    }
  }
  
  /**
   * Verify access token
   * @param {string} accessToken - Access token
   * @returns {Promise<Object>} - Decoded token
   */
  async verifyToken(accessToken) {
    try {
      // Check if token is blacklisted
      if (this.tokenBlacklist.has(accessToken)) {
        throw new Error('Token is blacklisted');
      }
      
      // Verify token
      const decoded = jwt.verify(accessToken, config.jwtSecret);
      
      // Get user
      const user = await User.findById(decoded.id);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Check if user is active
      if (!user.active) {
        throw new Error('Account is disabled');
      }
      
      return decoded;
    } catch (error) {
      logger.error('Error verifying token:', error.message);
      throw error;
    }
  }
  
  /**
   * Verify API key
   * @param {string} apiKey - API key
   * @returns {Promise<Object>} - User data
   */
  async verifyApiKey(apiKey) {
    try {
      // Find user by API key
      const user = await User.findOne({ apiKey });
      
      if (!user) {
        throw new Error('Invalid API key');
      }
      
      // Check if user is active
      if (!user.active) {
        throw new Error('Account is disabled');
      }
      
      return this.sanitizeUser(user);
    } catch (error) {
      logger.error('Error verifying API key:', error.message);
      throw error;
    }
  }
  
  /**
   * Generate new API key for user
   * @param {string} userId - User ID
   * @returns {Promise<string>} - New API key
   */
  async generateApiKey(userId) {
    try {
      // Find user
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Generate new API key
      user.apiKey = uuidv4();
      await user.save();
      
      logger.info(`New API key generated for user ${user.username}`);
      
      return user.apiKey;
    } catch (error) {
      logger.error('Error generating API key:', error.message);
      throw error;
    }
  }
  
  /**
   * Update user
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated user
   */
  async updateUser(userId, updateData) {
    try {
      // Find user
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Update fields
      if (updateData.firstName) user.firstName = updateData.firstName;
      if (updateData.lastName) user.lastName = updateData.lastName;
      if (updateData.email) {
        // Check if email is already in use
        const existingUser = await User.findOne({ email: updateData.email });
        
        if (existingUser && existingUser._id.toString() !== userId) {
          throw new Error('Email already exists');
        }
        
        user.email = updateData.email;
      }
      
      // Update password if provided
      if (updateData.password) {
        user.password = updateData.password;
      }
      
      // Update role if provided and user is admin
      if (updateData.role && updateData.adminAction) {
        user.role = updateData.role;
        user.permissions = this.getDefaultPermissions(updateData.role);
      }
      
      // Update permissions if provided and user is admin
      if (updateData.permissions && updateData.adminAction) {
        user.permissions = updateData.permissions;
      }
      
      // Update active status if provided and user is admin
      if (updateData.active !== undefined && updateData.adminAction) {
        user.active = updateData.active;
      }
      
      user.updatedAt = new Date();
      await user.save();
      
      logger.info(`User ${user.username} updated successfully`);
      
      return this.sanitizeUser(user);
    } catch (error) {
      logger.error('Error updating user:', error.message);
      throw error;
    }
  }
  
  /**
   * Delete user
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - True if deletion successful
   */
  async deleteUser(userId) {
    try {
      // Find and delete user
      const result = await User.deleteOne({ _id: userId });
      
      if (result.deletedCount === 0) {
        throw new Error('User not found');
      }
      
      logger.info(`User with ID ${userId} deleted successfully`);
      
      return true;
    } catch (error) {
      logger.error('Error deleting user:', error.message);
      throw error;
    }
  }
  
  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - User data
   */
  async getUserById(userId) {
    try {
      // Find user
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return this.sanitizeUser(user);
    } catch (error) {
      logger.error('Error getting user:', error.message);
      throw error;
    }
  }
  
  /**
   * Get all users
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Array of users
   */
  async getAllUsers(options = {}) {
    try {
      // Build query
      const query = {};
      
      if (options.role) {
        query.role = options.role;
      }
      
      if (options.active !== undefined) {
        query.active = options.active;
      }
      
      // Get users
      const users = await User.find(query).sort({ createdAt: -1 });
      
      return users.map(user => this.sanitizeUser(user));
    } catch (error) {
      logger.error('Error getting users:', error.message);
      throw error;
    }
  }
  
  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<Object>} - Reset token and expiry
   */
  async requestPasswordReset(email) {
    try {
      // Find user
      const user = await User.findOne({ email });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // Hash token
      const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
      
      // Set reset token and expiry
      user.passwordResetToken = hashedToken;
      user.passwordResetExpires = Date.now() + 3600000; // 1 hour
      await user.save();
      
      logger.info(`Password reset requested for user ${user.username}`);
      
      return {
        resetToken,
        email: user.email
      };
    } catch (error) {
      logger.error('Error requesting password reset:', error.message);
      throw error;
    }
  }
  
  /**
   * Reset password
   * @param {string} resetToken - Reset token
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} - True if reset successful
   */
  async resetPassword(resetToken, newPassword) {
    try {
      // Hash token
      const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
      
      // Find user
      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
      });
      
      if (!user) {
        throw new Error('Invalid or expired reset token');
      }
      
      // Update password
      user.password = newPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      
      logger.info(`Password reset successful for user ${user.username}`);
      
      return true;
    } catch (error) {
      logger.error('Error resetting password:', error.message);
      throw error;
    }
  }
  
  /**
   * Check if user has permission
   * @param {Object} user - User object
   * @param {string} permission - Permission to check
   * @returns {boolean} - True if user has permission
   */
  hasPermission(user, permission) {
    // Admin has all permissions
    if (user.role === 'admin') {
      return true;
    }
    
    // Check specific permission
    return user.permissions.includes(permission);
  }
  
  /**
   * Get default permissions for role
   * @param {string} role - User role
   * @returns {Array} - Default permissions
   * @private
   */
  getDefaultPermissions(role) {
    switch (role) {
      case 'admin':
        return [
          'user:read',
          'user:write',
          'user:delete',
          'chatbot:read',
          'chatbot:write',
          'chatbot:delete',
          'template:read',
          'template:write',
          'template:delete',
          'integration:read',
          'integration:write',
          'integration:delete',
          'plugin:read',
          'plugin:write',
          'plugin:delete',
          'analytics:read',
          'analytics:write'
        ];
      case 'developer':
        return [
          'chatbot:read',
          'chatbot:write',
          'template:read',
          'template:write',
          'integration:read',
          'integration:write',
          'plugin:read',
          'plugin:write',
          'analytics:read'
        ];
      case 'user':
      default:
        return [
          'chatbot:read',
          'chatbot:write',
          'template:read',
          'analytics:read'
        ];
    }
  }
  
  /**
   * Remove sensitive information from user object
   * @param {Object} user - User object
   * @returns {Object} - Sanitized user object
   * @private
   */
  sanitizeUser(user) {
    const sanitized = user.toObject ? user.toObject() : { ...user };
    
    // Remove sensitive fields
    delete sanitized.password;
    delete sanitized.passwordResetToken;
    delete sanitized.passwordResetExpires;
    
    return sanitized;
  }
}

// Create singleton instance
const authService = new AuthService();

module.exports = authService;
