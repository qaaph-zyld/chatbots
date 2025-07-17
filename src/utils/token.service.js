/**
 * Token Service
 * 
 * Handles JWT token generation, verification, and management for authentication.
 */

const jwt = require('jsonwebtoken');
const config = require('../../config');

/**
 * Generate authentication tokens (access and refresh)
 * @param {Object} user - User object containing id and role
 * @returns {Object} Object containing access and refresh tokens
 */
const generateAuthTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    config.jwt.accessTokenSecret,
    { expiresIn: config.jwt.accessTokenExpiry }
  );
  
  const refreshToken = jwt.sign(
    { id: user.id },
    config.jwt.refreshTokenSecret,
    { expiresIn: config.jwt.refreshTokenExpiry }
  );
  
  return { accessToken, refreshToken };
};

/**
 * Verify refresh token
 * @param {string} token - Refresh token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.refreshTokenSecret);
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

/**
 * Clear tokens (for logout)
 * @param {string} refreshToken - Refresh token to invalidate
 * @returns {Promise<void>}
 */
const clearTokens = async (refreshToken) => {
  // In a real implementation, this would add the token to a blacklist
  // or remove it from a whitelist in a database
  return Promise.resolve();
};

module.exports = {
  generateAuthTokens,
  verifyRefreshToken,
  clearTokens
};
