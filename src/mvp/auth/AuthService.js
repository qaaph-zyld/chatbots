/**
 * Authentication Service - MVP Implementation
 * Simple authentication without external dependencies
 */

const SimpleDB = require('../database/SimpleDB');
const crypto = require('crypto');

class AuthService {
  constructor() {
    this.db = new SimpleDB('./data');
    this.sessions = new Map(); // Active sessions cache
  }

  // Hash password (simple implementation for MVP)
  hashPassword(password, salt) {
    if (!salt) {
      salt = crypto.randomBytes(16).toString('hex');
    }
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return { hash, salt };
  }

  // Verify password
  verifyPassword(password, hash, salt) {
    const { hash: newHash } = this.hashPassword(password, salt);
    return hash === newHash;
  }

  // Generate session token
  generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Register new user
  async register(userData) {
    const { email, password, name } = userData;

    // Validate input
    if (!email || !password || !name) {
      return {
        success: false,
        error: 'Email, password, and name are required'
      };
    }

    // Check if user already exists
    const existingUser = this.db.findOne('users', { email });
    if (existingUser) {
      return {
        success: false,
        error: 'User with this email already exists'
      };
    }

    // Hash password
    const { hash, salt } = this.hashPassword(password);

    // Create user
    const user = {
      email,
      name,
      passwordHash: hash,
      passwordSalt: salt,
      role: 'customer',
      isActive: true,
      preferences: {
        newsletter: false,
        notifications: true
      },
      profile: {
        firstName: name.split(' ')[0] || name,
        lastName: name.split(' ').slice(1).join(' ') || '',
        phone: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'US'
        }
      }
    };

    const savedUser = this.db.insert('users', user);

    if (savedUser) {
      // Remove sensitive data from response
      const { passwordHash, passwordSalt, ...userResponse } = savedUser;
      
      return {
        success: true,
        user: userResponse,
        message: 'User registered successfully'
      };
    }

    return {
      success: false,
      error: 'Failed to register user'
    };
  }

  // Login user
  async login(email, password) {
    // Validate input
    if (!email || !password) {
      return {
        success: false,
        error: 'Email and password are required'
      };
    }

    // Find user
    const user = this.db.findOne('users', { email });
    if (!user) {
      return {
        success: false,
        error: 'Invalid credentials'
      };
    }

    // Check if user is active
    if (!user.isActive) {
      return {
        success: false,
        error: 'Account is deactivated'
      };
    }

    // Verify password
    if (!this.verifyPassword(password, user.passwordHash, user.passwordSalt)) {
      return {
        success: false,
        error: 'Invalid credentials'
      };
    }

    // Generate session
    const sessionToken = this.generateSessionToken();
    const session = {
      userId: user.id,
      token: sessionToken,
      email: user.email,
      name: user.name,
      role: user.role,
      loginAt: new Date(),
      lastActivity: new Date(),
      isActive: true
    };

    // Save session
    const savedSession = this.db.insert('sessions', session);
    
    if (savedSession) {
      // Cache session
      this.sessions.set(sessionToken, savedSession);

      // Update user last login
      this.db.updateById('users', user.id, { lastLoginAt: new Date() });

      // Remove sensitive data from response
      const { passwordHash, passwordSalt, ...userResponse } = user;

      return {
        success: true,
        user: userResponse,
        session: {
          token: sessionToken,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        },
        message: 'Login successful'
      };
    }

    return {
      success: false,
      error: 'Failed to create session'
    };
  }

  // Logout user
  async logout(sessionToken) {
    if (!sessionToken) {
      return {
        success: false,
        error: 'Session token required'
      };
    }

    // Remove from cache
    this.sessions.delete(sessionToken);

    // Deactivate session in database
    const session = this.db.findOne('sessions', { token: sessionToken });
    if (session) {
      this.db.updateById('sessions', session.id, { 
        isActive: false,
        logoutAt: new Date()
      });
    }

    return {
      success: true,
      message: 'Logout successful'
    };
  }

  // Verify session
  verifySession(sessionToken) {
    if (!sessionToken) {
      return null;
    }

    // Check cache first
    if (this.sessions.has(sessionToken)) {
      const session = this.sessions.get(sessionToken);
      
      // Update last activity
      session.lastActivity = new Date();
      this.db.updateById('sessions', session.id, { lastActivity: session.lastActivity });
      
      return session;
    }

    // Check database
    const session = this.db.findOne('sessions', { token: sessionToken, isActive: true });
    if (session) {
      // Check if session is expired (24 hours)
      const expirationTime = new Date(session.loginAt.getTime() + 24 * 60 * 60 * 1000);
      if (new Date() > expirationTime) {
        // Session expired
        this.db.updateById('sessions', session.id, { isActive: false });
        return null;
      }

      // Cache session
      this.sessions.set(sessionToken, session);
      
      // Update last activity
      session.lastActivity = new Date();
      this.db.updateById('sessions', session.id, { lastActivity: session.lastActivity });
      
      return session;
    }

    return null;
  }

  // Get user by ID
  getUserById(userId) {
    const user = this.db.findById('users', userId);
    if (user) {
      const { passwordHash, passwordSalt, ...userResponse } = user;
      return userResponse;
    }
    return null;
  }

  // Update user profile
  updateProfile(userId, profileData) {
    const user = this.db.findById('users', userId);
    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    // Update allowed fields
    const allowedFields = ['name', 'profile', 'preferences'];
    const updateData = {};
    
    allowedFields.forEach(field => {
      if (profileData[field] !== undefined) {
        if (field === 'profile' || field === 'preferences') {
          updateData[field] = { ...user[field], ...profileData[field] };
        } else {
          updateData[field] = profileData[field];
        }
      }
    });

    const updatedUser = this.db.updateById('users', userId, updateData);
    
    if (updatedUser) {
      const { passwordHash, passwordSalt, ...userResponse } = updatedUser;
      return {
        success: true,
        user: userResponse,
        message: 'Profile updated successfully'
      };
    }

    return {
      success: false,
      error: 'Failed to update profile'
    };
  }

  // Change password
  changePassword(userId, currentPassword, newPassword) {
    const user = this.db.findById('users', userId);
    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    // Verify current password
    if (!this.verifyPassword(currentPassword, user.passwordHash, user.passwordSalt)) {
      return {
        success: false,
        error: 'Current password is incorrect'
      };
    }

    // Hash new password
    const { hash, salt } = this.hashPassword(newPassword);

    // Update password
    const updated = this.db.updateById('users', userId, {
      passwordHash: hash,
      passwordSalt: salt,
      passwordChangedAt: new Date()
    });

    if (updated) {
      return {
        success: true,
        message: 'Password changed successfully'
      };
    }

    return {
      success: false,
      error: 'Failed to change password'
    };
  }

  // Clean up expired sessions
  cleanupExpiredSessions() {
    const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    const expiredSessions = this.db.find('sessions', { isActive: true });
    let cleanedCount = 0;
    
    expiredSessions.forEach(session => {
      const loginAt = new Date(session.loginAt);
      if (loginAt < cutoffDate) {
        this.db.updateById('sessions', session.id, { isActive: false });
        this.sessions.delete(session.token);
        cleanedCount++;
      }
    });
    
    console.log(`Cleaned up ${cleanedCount} expired sessions`);
    return cleanedCount;
  }

  // Get authentication statistics
  getStats() {
    const allUsers = this.db.find('users', {});
    const activeSessions = this.db.find('sessions', { isActive: true });
    const activeUsers = allUsers.filter(user => user.isActive);
    
    return {
      totalUsers: allUsers.length,
      activeUsers: activeUsers.length,
      activeSessions: activeSessions.length,
      newUsersToday: allUsers.filter(user => {
        const createdAt = new Date(user.createdAt);
        const today = new Date();
        return createdAt.toDateString() === today.toDateString();
      }).length
    };
  }
}

module.exports = AuthService;
