const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// Register new user
router.post('/register',
  [
    body('username').trim().isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/).withMessage('Username must be 3-30 characters and contain only letters, numbers, and underscores'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('firstName').optional().trim().isLength({ max: 50 }).withMessage('First name must be less than 50 characters'),
    body('lastName').optional().trim().isLength({ max: 50 }).withMessage('Last name must be less than 50 characters')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { username, email, password, firstName, lastName } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }]
      });

      if (existingUser) {
        return res.status(409).json({
          error: 'User already exists',
          message: existingUser.email === email ? 'Email already registered' : 'Username already taken'
        });
      }

      // Create new user
      const user = new User({
        username,
        email,
        password,
        profile: {
          firstName: firstName || '',
          lastName: lastName || ''
        }
      });

      await user.save();

      // Generate email verification token
      const verificationToken = user.generateEmailVerificationToken();
      await user.save();

      // Generate JWT token
      const token = generateToken(user._id);

      logger.info('User registered', {
        userId: user._id,
        username,
        email
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            profile: user.profile,
            role: user.role
          },
          token,
          verificationToken // In production, this would be sent via email
        }
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        error: 'Registration failed',
        message: error.message
      });
    }
  }
);

// Login user
router.post('/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await User.findByEmail(email);
      if (!user || !user.isActive) {
        return res.status(401).json({
          error: 'Invalid credentials'
        });
      }

      // Check if account is locked
      if (user.isLocked) {
        return res.status(423).json({
          error: 'Account locked',
          message: 'Too many failed login attempts. Please try again later.'
        });
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        await user.incrementLoginAttempts();
        return res.status(401).json({
          error: 'Invalid credentials'
        });
      }

      // Reset login attempts on successful login
      if (user.security.loginAttempts > 0) {
        await user.resetLoginAttempts();
      }

      // Update last activity
      await user.updateUsage({ lastActivity: new Date() });

      // Generate JWT token
      const token = generateToken(user._id);

      logger.info('User logged in', {
        userId: user._id,
        username: user.username,
        email: user.email
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            profile: user.profile,
            role: user.role,
            subscription: user.subscription
          },
          token
        }
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        error: 'Login failed',
        message: error.message
      });
    }
  }
);

// Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.isActive) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          profile: user.profile,
          role: user.role,
          subscription: user.subscription,
          usage: user.usage,
          preferences: user.preferences,
          security: {
            emailVerified: user.security.emailVerified,
            phoneVerified: user.security.phoneVerified,
            twoFactorEnabled: user.security.twoFactorEnabled
          }
        }
      }
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      error: 'Failed to get profile',
      message: error.message
    });
  }
});

// Update user profile
router.put('/me', 
  auth,
  [
    body('profile.firstName').optional().trim().isLength({ max: 50 }).withMessage('First name must be less than 50 characters'),
    body('profile.lastName').optional().trim().isLength({ max: 50 }).withMessage('Last name must be less than 50 characters'),
    body('profile.bio').optional().trim().isLength({ max: 500 }).withMessage('Bio must be less than 500 characters'),
    body('profile.company').optional().trim().isLength({ max: 100 }).withMessage('Company must be less than 100 characters'),
    body('preferences.language').optional().isIn(['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko']).withMessage('Invalid language'),
    body('preferences.theme').optional().isIn(['light', 'dark', 'auto']).withMessage('Invalid theme')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user || !user.isActive) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      const allowedUpdates = ['profile', 'preferences'];
      const updates = {};

      allowedUpdates.forEach(field => {
        if (req.body[field]) {
          updates[field] = { ...user[field], ...req.body[field] };
        }
      });

      Object.assign(user, updates);
      await user.save();

      logger.info('Profile updated', {
        userId: user._id,
        updates: Object.keys(updates)
      });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            profile: user.profile,
            preferences: user.preferences
          }
        }
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({
        error: 'Failed to update profile',
        message: error.message
      });
    }
  }
);

// Change password
router.put('/password',
  auth,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await User.findById(req.user.id);
      if (!user || !user.isActive) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(401).json({
          error: 'Current password is incorrect'
        });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      logger.info('Password changed', {
        userId: user._id
      });

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      logger.error('Change password error:', error);
      res.status(500).json({
        error: 'Failed to change password',
        message: error.message
      });
    }
  }
);

// Request password reset
router.post('/forgot-password',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email } = req.body;

      const user = await User.findByEmail(email);
      if (!user || !user.isActive) {
        // Don't reveal if email exists
        return res.json({
          success: true,
          message: 'If the email exists, a password reset link has been sent'
        });
      }

      // Generate reset token
      const resetToken = user.generatePasswordResetToken();
      await user.save();

      logger.info('Password reset requested', {
        userId: user._id,
        email
      });

      // In production, send email with reset link
      res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent',
        resetToken // Remove this in production
      });
    } catch (error) {
      logger.error('Forgot password error:', error);
      res.status(500).json({
        error: 'Failed to process password reset request',
        message: error.message
      });
    }
  }
);

// Reset password
router.post('/reset-password',
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      const user = await User.findByResetToken(token);
      if (!user) {
        return res.status(400).json({
          error: 'Invalid or expired reset token'
        });
      }

      // Update password and clear reset token
      user.password = newPassword;
      user.security.passwordResetToken = undefined;
      user.security.passwordResetExpires = undefined;
      await user.save();

      logger.info('Password reset completed', {
        userId: user._id
      });

      res.json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      logger.error('Reset password error:', error);
      res.status(500).json({
        error: 'Failed to reset password',
        message: error.message
      });
    }
  }
);

// Verify email
router.post('/verify-email',
  [
    body('token').notEmpty().withMessage('Verification token is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { token } = req.body;

      const user = await User.findByVerificationToken(token);
      if (!user) {
        return res.status(400).json({
          error: 'Invalid or expired verification token'
        });
      }

      // Mark email as verified
      user.security.emailVerified = true;
      user.security.emailVerificationToken = undefined;
      user.security.emailVerificationExpires = undefined;
      await user.save();

      logger.info('Email verified', {
        userId: user._id,
        email: user.email
      });

      res.json({
        success: true,
        message: 'Email verified successfully'
      });
    } catch (error) {
      logger.error('Email verification error:', error);
      res.status(500).json({
        error: 'Failed to verify email',
        message: error.message
      });
    }
  }
);

// Logout (client-side token invalidation)
router.post('/logout', auth, (req, res) => {
  logger.info('User logged out', {
    userId: req.user.id
  });

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;
