/**
 * Authentication Controller
 * 
 * API endpoints for user authentication and management
 */

require('@src/auth\auth.service');
require('@src/utils');

/**
 * Register a new user
 */
exports.register = async (req, res, next) => {
  try {
    const userData = req.body;
    
    // Register user
    const user = await authService.registerUser(userData);
    
    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Error in register:', error.message);
    
    // Handle duplicate key errors
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }
    
    next(error);
  }
};

/**
 * Login user
 */
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }
    
    // Login user
    const result = await authService.loginUser(username, password);
    
    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.status(200).json({
      success: true,
      data: {
        accessToken: result.accessToken,
        user: result.user
      }
    });
  } catch (error) {
    logger.error('Error in login:', error.message);
    
    // Handle authentication errors
    if (error.message.includes('Invalid username or password') || 
        error.message.includes('Account is disabled')) {
      return res.status(401).json({
        success: false,
        error: error.message
      });
    }
    
    next(error);
  }
};

/**
 * Refresh access token
 */
exports.refreshToken = async (req, res, next) => {
  try {
    // Get refresh token from cookie
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token is required'
      });
    }
    
    // Refresh token
    const result = await authService.refreshToken(refreshToken);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error in refreshToken:', error.message);
    
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired refresh token'
    });
  }
};

/**
 * Logout user
 */
exports.logout = async (req, res, next) => {
  try {
    // Get access token
    const authHeader = req.headers.authorization;
    const accessToken = authHeader && authHeader.split(' ')[1];
    
    if (accessToken) {
      // Logout user
      await authService.logoutUser(accessToken);
    }
    
    // Clear refresh token cookie
    res.clearCookie('refreshToken');
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Error in logout:', error.message);
    next(error);
  }
};

/**
 * Get current user
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    // User is added to request by auth middleware
    const userId = req.user.id;
    
    // Get user
    const user = await authService.getUserById(userId);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Error in getCurrentUser:', error.message);
    next(error);
  }
};

/**
 * Update current user
 */
exports.updateCurrentUser = async (req, res, next) => {
  try {
    // User is added to request by auth middleware
    const userId = req.user.id;
    
    // Update user
    const user = await authService.updateUser(userId, req.body);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Error in updateCurrentUser:', error.message);
    
    // Handle duplicate key errors
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }
    
    next(error);
  }
};

/**
 * Generate API key
 */
exports.generateApiKey = async (req, res, next) => {
  try {
    // User is added to request by auth middleware
    const userId = req.user.id;
    
    // Generate API key
    const apiKey = await authService.generateApiKey(userId);
    
    res.status(200).json({
      success: true,
      data: { apiKey }
    });
  } catch (error) {
    logger.error('Error in generateApiKey:', error.message);
    next(error);
  }
};

/**
 * Request password reset
 */
exports.requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }
    
    // Request password reset
    const result = await authService.requestPasswordReset(email);
    
    // In a real application, send email with reset link
    // For this implementation, we'll just return the token
    
    res.status(200).json({
      success: true,
      message: 'Password reset email sent',
      data: process.env.NODE_ENV === 'development' ? result : undefined
    });
  } catch (error) {
    logger.error('Error in requestPasswordReset:', error.message);
    
    // Don't reveal if user exists
    res.status(200).json({
      success: true,
      message: 'If the email exists, a password reset link will be sent'
    });
  }
};

/**
 * Reset password
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;
    
    if (!resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Reset token and new password are required'
      });
    }
    
    // Reset password
    await authService.resetPassword(resetToken, newPassword);
    
    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    logger.error('Error in resetPassword:', error.message);
    
    return res.status(400).json({
      success: false,
      error: 'Invalid or expired reset token'
    });
  }
};

/**
 * Get all users (admin only)
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const options = req.query;
    
    // Get users
    const users = await authService.getAllUsers(options);
    
    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    logger.error('Error in getAllUsers:', error.message);
    next(error);
  }
};

/**
 * Get user by ID (admin only)
 */
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get user
    const user = await authService.getUserById(id);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Error in getUserById:', error.message);
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    next(error);
  }
};

/**
 * Update user (admin only)
 */
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Add admin action flag
    const updateData = {
      ...req.body,
      adminAction: true
    };
    
    // Update user
    const user = await authService.updateUser(id, updateData);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Error in updateUser:', error.message);
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Handle duplicate key errors
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }
    
    next(error);
  }
};

/**
 * Delete user (admin only)
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Delete user
    await authService.deleteUser(id);
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    logger.error('Error in deleteUser:', error.message);
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    next(error);
  }
};
