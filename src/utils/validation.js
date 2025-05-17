/**
 * Validation Utility
 * 
 * Provides validation functions for various data types
 */

const logger = require('./logger');

/**
 * Validate an email address
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if email is valid
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate a URL
 * @param {string} url - URL to validate
 * @returns {boolean} - True if URL is valid
 */
function isValidUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Validate required fields in an object
 * @param {Object} data - Object to validate
 * @param {Array<string>} requiredFields - Array of required field names
 * @returns {Object} - Validation result with success flag and missing fields
 */
function validateRequiredFields(data, requiredFields) {
  if (!data || typeof data !== 'object') {
    return {
      success: false,
      missingFields: requiredFields,
      message: 'Invalid data object'
    };
  }
  
  const missingFields = requiredFields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || value === '';
  });
  
  return {
    success: missingFields.length === 0,
    missingFields,
    message: missingFields.length > 0 
      ? `Missing required fields: ${missingFields.join(', ')}` 
      : 'All required fields provided'
  };
}

/**
 * Sanitize an object by removing specified fields
 * @param {Object} data - Object to sanitize
 * @param {Array<string>} fieldsToRemove - Fields to remove
 * @returns {Object} - Sanitized object
 */
function sanitizeObject(data, fieldsToRemove) {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const sanitized = { ...data };
  
  fieldsToRemove.forEach(field => {
    delete sanitized[field];
  });
  
  return sanitized;
}

/**
 * Validate that a value is within a specified range
 * @param {number} value - Value to validate
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {boolean} - True if value is within range
 */
function isInRange(value, min, max) {
  if (typeof value !== 'number') {
    return false;
  }
  
  return value >= min && value <= max;
}

module.exports = {
  isValidEmail,
  isValidUrl,
  validateRequiredFields,
  sanitizeObject,
  isInRange
};
