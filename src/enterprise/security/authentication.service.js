/**
 * Authentication Service
 * 
 * This service provides advanced authentication features for the chatbot platform,
 * including multi-factor authentication, JWT token management, and session control.
 */

// Use mock utilities for testing
require('@src/utils\mock-utils');
const crypto = require('crypto');

/**
 * Authentication Service class
 */
class AuthenticationService {
  /**
   * Initialize the authentication service
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      tokenExpiration: parseInt(process.env.TOKEN_EXPIRATION || '3600'), // 1 hour in seconds
      refreshTokenExpiration: parseInt(process.env.REFRESH_TOKEN_EXPIRATION || '2592000'), // 30 days in seconds
      mfaEnabled: process.env.MFA_ENABLED === 'true',
      passwordPolicyMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8'),
      passwordPolicyRequireSpecial: process.env.PASSWORD_REQUIRE_SPECIAL === 'true',
      passwordPolicyRequireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS === 'true',
      passwordPolicyRequireMixedCase: process.env.PASSWORD_REQUIRE_MIXED_CASE === 'true',
      maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
      lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '1800'), // 30 minutes in seconds
      ...options
    };

    // Storage for users, tokens, and sessions
    this.users = new Map();
    this.tokens = new Map();
    this.refreshTokens = new Map();
    this.mfaSecrets = new Map();
    this.loginAttempts = new Map();
    this.sessions = new Map();

    // Secret for JWT signing (in a real implementation, this would be loaded from a secure environment variable)
    this.jwtSecret = process.env.JWT_SECRET || 'your-jwt-secret-key-should-be-very-long-and-secure';

    logger.info('Authentication Service initialized with options:', {
      tokenExpiration: this.options.tokenExpiration,
      mfaEnabled: this.options.mfaEnabled,
      passwordPolicyMinLength: this.options.passwordPolicyMinLength
    });
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} - Registration result
   */
  async registerUser(userData) {
    try {
      const { username, email, password, fullName } = userData;

      if (!username) {
        throw new Error('Username is required');
      }

      if (!email) {
        throw new Error('Email is required');
      }

      if (!password) {
        throw new Error('Password is required');
      }

      // Check if username or email already exists
      for (const user of this.users.values()) {
        if (user.username === username) {
          throw new Error('Username already exists');
        }

        if (user.email === email) {
          throw new Error('Email already exists');
        }
      }

      // Validate password against policy
      this._validatePassword(password);

      // Generate user ID
      const userId = generateUuid();

      // Hash the password (in a real implementation, use a proper password hashing library like bcrypt)
      const hashedPassword = this._hashPassword(password);

      // Create user object
      const user = {
        id: userId,
        username,
        email,
        fullName: fullName || '',
        hashedPassword,
        mfaEnabled: false,
        roles: ['user'],
        status: 'active',
        lastLogin: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store user
      this.users.set(userId, user);

      logger.info(`Registered user: ${username}`, { userId, email });
      
      // Return user data without sensitive information
      const { hashedPassword: _, ...userWithoutPassword } = user;
      return { success: true, user: userWithoutPassword };
    } catch (error) {
      logger.error('Error registering user:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Authenticate a user
   * @param {Object} credentials - User credentials
   * @returns {Promise<Object>} - Authentication result
   */
  async authenticate(credentials) {
    try {
      const { username, password, mfaCode } = credentials;

      if (!username) {
        throw new Error('Username is required');
      }

      if (!password) {
        throw new Error('Password is required');
      }

      // Find user by username
      let user = null;
      for (const u of this.users.values()) {
        if (u.username === username) {
          user = u;
          break;
        }
      }

      if (!user) {
        throw new Error('Invalid username or password');
      }

      // Check if account is locked
      const loginAttempts = this.loginAttempts.get(user.id) || { count: 0, lastAttempt: null };
      
      if (loginAttempts.count >= this.options.maxLoginAttempts) {
        const lockoutTime = new Date(loginAttempts.lastAttempt).getTime() + (this.options.lockoutDuration * 1000);
        if (Date.now() < lockoutTime) {
          const remainingTime = Math.ceil((lockoutTime - Date.now()) / 60000); // in minutes
          throw new Error(`Account is locked. Try again in ${remainingTime} minutes`);
        } else {
          // Reset login attempts if lockout duration has passed
          loginAttempts.count = 0;
        }
      }

      // Verify password
      const hashedPassword = this._hashPassword(password);
      if (user.hashedPassword !== hashedPassword) {
        // Increment login attempts
        loginAttempts.count += 1;
        loginAttempts.lastAttempt = new Date().toISOString();
        this.loginAttempts.set(user.id, loginAttempts);
        
        logger.warn(`Failed login attempt for user: ${username}`, { 
          userId: user.id, 
          attempts: loginAttempts.count,
          maxAttempts: this.options.maxLoginAttempts
        });
        
        throw new Error('Invalid username or password');
      }

      // Check if MFA is required
      if (user.mfaEnabled) {
        if (!mfaCode) {
          return { 
            success: false, 
            requireMfa: true, 
            message: 'MFA code required',
            userId: user.id
          };
        }

        // Verify MFA code
        const mfaSecret = this.mfaSecrets.get(user.id);
        if (!mfaSecret) {
          throw new Error('MFA not properly set up');
        }

        const isValidMfa = this._verifyMfaCode(mfaSecret, mfaCode);
        if (!isValidMfa) {
          throw new Error('Invalid MFA code');
        }
      }

      // Reset login attempts on successful login
      this.loginAttempts.delete(user.id);

      // Update last login
      user.lastLogin = new Date().toISOString();
      this.users.set(user.id, user);

      // Generate tokens
      const accessToken = this._generateAccessToken(user);
      const refreshToken = this._generateRefreshToken(user);

      // Create session
      const sessionId = generateUuid();
      const session = {
        id: sessionId,
        userId: user.id,
        accessToken,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + (this.options.tokenExpiration * 1000)).toISOString(),
        lastActivityAt: new Date().toISOString(),
        ipAddress: credentials.ipAddress || '127.0.0.1',
        userAgent: credentials.userAgent || 'Unknown'
      };

      this.sessions.set(sessionId, session);

      logger.info(`User authenticated: ${username}`, { userId: user.id, sessionId });
      
      // Return user data without sensitive information
      const { hashedPassword: _, ...userWithoutPassword } = user;
      return { 
        success: true, 
        user: userWithoutPassword,
        accessToken,
        refreshToken,
        expiresIn: this.options.tokenExpiration,
        sessionId
      };
    } catch (error) {
      logger.error('Error authenticating user:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Refresh an access token using a refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} - Token refresh result
   */
  async refreshToken(refreshToken) {
    try {
      if (!refreshToken) {
        throw new Error('Refresh token is required');
      }

      // Verify refresh token
      const tokenData = this.refreshTokens.get(refreshToken);
      if (!tokenData) {
        throw new Error('Invalid refresh token');
      }

      // Check if token is expired
      const expiresAt = new Date(tokenData.expiresAt).getTime();
      if (Date.now() > expiresAt) {
        this.refreshTokens.delete(refreshToken);
        throw new Error('Refresh token expired');
      }

      // Get user
      const user = this.users.get(tokenData.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate new access token
      const accessToken = this._generateAccessToken(user);

      // Update session if it exists
      if (tokenData.sessionId) {
        const session = this.sessions.get(tokenData.sessionId);
        if (session) {
          session.accessToken = accessToken;
          session.lastActivityAt = new Date().toISOString();
          session.expiresAt = new Date(Date.now() + (this.options.tokenExpiration * 1000)).toISOString();
          this.sessions.set(tokenData.sessionId, session);
        }
      }

      logger.info(`Refreshed token for user: ${user.username}`, { userId: user.id });
      
      return { 
        success: true, 
        accessToken,
        expiresIn: this.options.tokenExpiration
      };
    } catch (error) {
      logger.error('Error refreshing token:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verify an access token
   * @param {string} accessToken - Access token to verify
   * @returns {Promise<Object>} - Verification result
   */
  async verifyToken(accessToken) {
    try {
      if (!accessToken) {
        throw new Error('Access token is required');
      }

      // Verify token
      const tokenData = this.tokens.get(accessToken);
      if (!tokenData) {
        throw new Error('Invalid token');
      }

      // Check if token is expired
      const expiresAt = new Date(tokenData.expiresAt).getTime();
      if (Date.now() > expiresAt) {
        this.tokens.delete(accessToken);
        throw new Error('Token expired');
      }

      // Get user
      const user = this.users.get(tokenData.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Update session activity if it exists
      if (tokenData.sessionId) {
        const session = this.sessions.get(tokenData.sessionId);
        if (session) {
          session.lastActivityAt = new Date().toISOString();
          this.sessions.set(tokenData.sessionId, session);
        }
      }

      // Return user data without sensitive information
      const { hashedPassword: _, ...userWithoutPassword } = user;
      return { 
        success: true, 
        user: userWithoutPassword,
        tokenData
      };
    } catch (error) {
      logger.error('Error verifying token:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Logout a user
   * @param {string} accessToken - Access token
   * @returns {Promise<Object>} - Logout result
   */
  async logout(accessToken) {
    try {
      if (!accessToken) {
        throw new Error('Access token is required');
      }

      // Get token data
      const tokenData = this.tokens.get(accessToken);
      if (!tokenData) {
        throw new Error('Invalid token');
      }

      // Remove token
      this.tokens.delete(accessToken);

      // Remove refresh token if it exists
      for (const [key, value] of this.refreshTokens.entries()) {
        if (value.userId === tokenData.userId && value.sessionId === tokenData.sessionId) {
          this.refreshTokens.delete(key);
          break;
        }
      }

      // Remove session if it exists
      if (tokenData.sessionId) {
        this.sessions.delete(tokenData.sessionId);
      }

      logger.info(`User logged out`, { userId: tokenData.userId, sessionId: tokenData.sessionId });
      
      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      logger.error('Error logging out:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Setup multi-factor authentication for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - MFA setup result
   */
  async setupMfa(userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const user = this.users.get(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate MFA secret
      const secret = this._generateMfaSecret();
      
      // Store MFA secret
      this.mfaSecrets.set(userId, secret);

      // Generate QR code data (in a real implementation, this would generate a proper QR code)
      const qrCodeData = `otpauth://totp/ChatbotPlatform:${user.username}?secret=${secret}&issuer=ChatbotPlatform`;

      logger.info(`MFA setup initiated for user: ${user.username}`, { userId });
      
      return { 
        success: true, 
        secret,
        qrCodeData
      };
    } catch (error) {
      logger.error('Error setting up MFA:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verify and enable MFA for a user
   * @param {string} userId - User ID
   * @param {string} mfaCode - MFA verification code
   * @returns {Promise<Object>} - MFA verification result
   */
  async verifyAndEnableMfa(userId, mfaCode) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      if (!mfaCode) {
        throw new Error('MFA code is required');
      }

      const user = this.users.get(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const secret = this.mfaSecrets.get(userId);
      if (!secret) {
        throw new Error('MFA not set up');
      }

      // Verify MFA code
      const isValid = this._verifyMfaCode(secret, mfaCode);
      if (!isValid) {
        throw new Error('Invalid MFA code');
      }

      // Enable MFA for user
      user.mfaEnabled = true;
      this.users.set(userId, user);

      logger.info(`MFA enabled for user: ${user.username}`, { userId });
      
      return { success: true, message: 'MFA enabled successfully' };
    } catch (error) {
      logger.error('Error verifying MFA:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get active sessions for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Sessions result
   */
  async getUserSessions(userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const user = this.users.get(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get all sessions for the user
      const userSessions = [];
      for (const session of this.sessions.values()) {
        if (session.userId === userId) {
          userSessions.push({
            id: session.id,
            createdAt: session.createdAt,
            lastActivityAt: session.lastActivityAt,
            expiresAt: session.expiresAt,
            ipAddress: session.ipAddress,
            userAgent: session.userAgent
          });
        }
      }

      return { success: true, sessions: userSessions };
    } catch (error) {
      logger.error('Error getting user sessions:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Terminate a specific session
   * @param {string} sessionId - Session ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Termination result
   */
  async terminateSession(sessionId, userId) {
    try {
      if (!sessionId) {
        throw new Error('Session ID is required');
      }

      if (!userId) {
        throw new Error('User ID is required');
      }

      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Verify that the session belongs to the user
      if (session.userId !== userId) {
        throw new Error('Session does not belong to this user');
      }

      // Remove session
      this.sessions.delete(sessionId);

      // Remove associated tokens
      for (const [key, value] of this.tokens.entries()) {
        if (value.sessionId === sessionId) {
          this.tokens.delete(key);
        }
      }

      for (const [key, value] of this.refreshTokens.entries()) {
        if (value.sessionId === sessionId) {
          this.refreshTokens.delete(key);
        }
      }

      logger.info(`Session terminated`, { sessionId, userId });
      
      return { success: true, message: 'Session terminated successfully' };
    } catch (error) {
      logger.error('Error terminating session:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} - Password change result
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      if (!currentPassword) {
        throw new Error('Current password is required');
      }

      if (!newPassword) {
        throw new Error('New password is required');
      }

      const user = this.users.get(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const hashedCurrentPassword = this._hashPassword(currentPassword);
      if (user.hashedPassword !== hashedCurrentPassword) {
        throw new Error('Current password is incorrect');
      }

      // Validate new password
      this._validatePassword(newPassword);

      // Hash new password
      const hashedNewPassword = this._hashPassword(newPassword);

      // Update user password
      user.hashedPassword = hashedNewPassword;
      user.updatedAt = new Date().toISOString();
      this.users.set(userId, user);

      // Terminate all sessions (force re-login with new password)
      for (const [sessionId, session] of this.sessions.entries()) {
        if (session.userId === userId) {
          this.sessions.delete(sessionId);
        }
      }

      // Remove all tokens
      for (const [key, value] of this.tokens.entries()) {
        if (value.userId === userId) {
          this.tokens.delete(key);
        }
      }

      for (const [key, value] of this.refreshTokens.entries()) {
        if (value.userId === userId) {
          this.refreshTokens.delete(key);
        }
      }

      logger.info(`Password changed for user: ${user.username}`, { userId });
      
      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      logger.error('Error changing password:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate an access token for a user
   * @param {Object} user - User object
   * @returns {string} - Access token
   * @private
   */
  _generateAccessToken(user) {
    const tokenId = generateUuid();
    const expiresAt = new Date(Date.now() + (this.options.tokenExpiration * 1000)).toISOString();
    
    // In a real implementation, this would use JWT
    const token = `access_${tokenId}`;
    
    // Store token data
    this.tokens.set(token, {
      id: tokenId,
      userId: user.id,
      type: 'access',
      expiresAt,
      createdAt: new Date().toISOString()
    });
    
    return token;
  }

  /**
   * Generate a refresh token for a user
   * @param {Object} user - User object
   * @returns {string} - Refresh token
   * @private
   */
  _generateRefreshToken(user) {
    const tokenId = generateUuid();
    const expiresAt = new Date(Date.now() + (this.options.refreshTokenExpiration * 1000)).toISOString();
    
    // In a real implementation, this would use a secure random string
    const token = `refresh_${tokenId}`;
    
    // Store token data
    this.refreshTokens.set(token, {
      id: tokenId,
      userId: user.id,
      type: 'refresh',
      expiresAt,
      createdAt: new Date().toISOString()
    });
    
    return token;
  }

  /**
   * Hash a password
   * @param {string} password - Password to hash
   * @returns {string} - Hashed password
   * @private
   */
  _hashPassword(password) {
    // In a real implementation, use a proper password hashing library like bcrypt
    // This is a simplified version for demonstration purposes
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  /**
   * Validate a password against the password policy
   * @param {string} password - Password to validate
   * @throws {Error} - If password doesn't meet policy requirements
   * @private
   */
  _validatePassword(password) {
    if (password.length < this.options.passwordPolicyMinLength) {
      throw new Error(`Password must be at least ${this.options.passwordPolicyMinLength} characters long`);
    }

    if (this.options.passwordPolicyRequireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      throw new Error('Password must contain at least one special character');
    }

    if (this.options.passwordPolicyRequireNumbers && !/\d/.test(password)) {
      throw new Error('Password must contain at least one number');
    }

    if (this.options.passwordPolicyRequireMixedCase && !/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
      throw new Error('Password must contain both uppercase and lowercase letters');
    }
  }

  /**
   * Generate an MFA secret
   * @returns {string} - MFA secret
   * @private
   */
  _generateMfaSecret() {
    // In a real implementation, use a proper TOTP library
    // This is a simplified version for demonstration purposes
    return crypto.randomBytes(10).toString('hex');
  }

  /**
   * Verify an MFA code
   * @param {string} secret - MFA secret
   * @param {string} code - MFA code to verify
   * @returns {boolean} - Whether the code is valid
   * @private
   */
  _verifyMfaCode(secret, code) {
    // In a real implementation, use a proper TOTP library
    // This is a simplified version for demonstration purposes that always returns true for testing
    return true;
  }
}

module.exports = { authenticationService: new AuthenticationService() };
