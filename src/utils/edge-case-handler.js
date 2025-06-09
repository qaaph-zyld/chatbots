/**
 * Edge Case Handler
 * 
 * A utility for handling common edge cases in the chatbot platform.
 * Provides standardized approaches for dealing with edge cases and improving robustness.
 */

require('@src/utils\logger');
require('@src/utils\error-handler');

/**
 * Safely access nested object properties
 * @param {Object} obj - The object to access
 * @param {string|Array} path - The path to the property (string with dots or array)
 * @param {*} defaultValue - Default value if property doesn't exist
 * @returns {*} - The property value or default value
 */
function safeGet(obj, path, defaultValue = undefined) {
  if (obj === null || obj === undefined) {
    return defaultValue;
  }
  
  const keys = Array.isArray(path) ? path : path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === null || result === undefined || typeof result !== 'object') {
      return defaultValue;
    }
    result = result[key];
  }
  
  return result === undefined ? defaultValue : result;
}

/**
 * Safely set nested object properties
 * @param {Object} obj - The object to modify
 * @param {string|Array} path - The path to the property (string with dots or array)
 * @param {*} value - The value to set
 * @returns {Object} - The modified object
 */
function safeSet(obj, path, value) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  const keys = Array.isArray(path) ? path : path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (current[key] === undefined || current[key] === null) {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[keys[keys.length - 1]] = value;
  return obj;
}

/**
 * Safely parse JSON
 * @param {string} str - JSON string to parse
 * @param {*} defaultValue - Default value if parsing fails
 * @returns {*} - Parsed object or default value
 */
function safeJsonParse(str, defaultValue = {}) {
  try {
    if (!str) return defaultValue;
    return JSON.parse(str);
  } catch (error) {
    logger.warn(`Failed to parse JSON: ${error.message}`);
    return defaultValue;
  }
}

/**
 * Safely stringify JSON
 * @param {*} obj - Object to stringify
 * @param {string} defaultValue - Default value if stringification fails
 * @returns {string} - JSON string or default value
 */
function safeJsonStringify(obj, defaultValue = '{}') {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    logger.warn(`Failed to stringify object: ${error.message}`);
    return defaultValue;
  }
}

/**
 * Safely execute a function and handle errors
 * @param {Function} fn - Function to execute
 * @param {*} defaultValue - Default value if function throws
 * @param {Function} errorHandler - Optional error handler
 * @returns {*} - Function result or default value
 */
function safeExecute(fn, defaultValue = null, errorHandler = null) {
  try {
    return fn();
  } catch (error) {
    if (errorHandler) {
      errorHandler(error);
    } else {
      logger.warn(`Error in safeExecute: ${error.message}`);
    }
    return defaultValue;
  }
}

/**
 * Safely execute an async function and handle errors
 * @param {Function} fn - Async function to execute
 * @param {*} defaultValue - Default value if function throws
 * @param {Function} errorHandler - Optional error handler
 * @returns {Promise<*>} - Promise resolving to function result or default value
 */
async function safeExecuteAsync(fn, defaultValue = null, errorHandler = null) {
  try {
    return await fn();
  } catch (error) {
    if (errorHandler) {
      errorHandler(error);
    } else {
      logger.warn(`Error in safeExecuteAsync: ${error.message}`);
    }
    return defaultValue;
  }
}

/**
 * Validate required fields in an object
 * @param {Object} obj - Object to validate
 * @param {Array<string>} requiredFields - List of required field names
 * @throws {ValidationError} - If any required fields are missing
 */
function validateRequiredFields(obj, requiredFields) {
  const missingFields = requiredFields.filter(field => {
    const value = safeGet(obj, field);
    return value === undefined || value === null || value === '';
  });
  
  if (missingFields.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missingFields.join(', ')}`,
      missingFields.reduce((acc, field) => {
        acc[field] = 'Required field is missing';
        return acc;
      }, {})
    );
  }
}

/**
 * Validate field types in an object
 * @param {Object} obj - Object to validate
 * @param {Object} typeDefinitions - Map of field names to expected types
 * @throws {ValidationError} - If any fields have incorrect types
 */
function validateFieldTypes(obj, typeDefinitions) {
  const typeErrors = {};
  
  for (const [field, expectedType] of Object.entries(typeDefinitions)) {
    const value = safeGet(obj, field);
    
    // Skip validation for undefined or null values
    if (value === undefined || value === null) {
      continue;
    }
    
    let isValid = false;
    
    switch (expectedType) {
      case 'string':
        isValid = typeof value === 'string';
        break;
      case 'number':
        isValid = typeof value === 'number' && !isNaN(value);
        break;
      case 'boolean':
        isValid = typeof value === 'boolean';
        break;
      case 'array':
        isValid = Array.isArray(value);
        break;
      case 'object':
        isValid = typeof value === 'object' && !Array.isArray(value);
        break;
      case 'date':
        isValid = value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)));
        break;
      case 'email':
        isValid = typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        break;
      case 'url':
        isValid = typeof value === 'string' && /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i.test(value);
        break;
      default:
        // For custom types (like 'user', 'chatbot', etc.), just check if it's an object
        isValid = typeof value === 'object' && value !== null;
    }
    
    if (!isValid) {
      typeErrors[field] = `Expected type '${expectedType}', got '${typeof value}'`;
    }
  }
  
  if (Object.keys(typeErrors).length > 0) {
    throw new ValidationError('Type validation failed', typeErrors);
  }
}

/**
 * Safely convert a value to a number
 * @param {*} value - Value to convert
 * @param {number} defaultValue - Default value if conversion fails
 * @returns {number} - Converted number or default value
 */
function safeNumber(value, defaultValue = 0) {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Safely convert a value to a boolean
 * @param {*} value - Value to convert
 * @param {boolean} defaultValue - Default value if conversion is ambiguous
 * @returns {boolean} - Converted boolean or default value
 */
function safeBoolean(value, defaultValue = false) {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  
  if (typeof value === 'boolean') {
    return value;
  }
  
  if (typeof value === 'number') {
    return value !== 0;
  }
  
  if (typeof value === 'string') {
    const lowercased = value.toLowerCase().trim();
    if (['true', 'yes', 'y', '1', 'on'].includes(lowercased)) {
      return true;
    }
    if (['false', 'no', 'n', '0', 'off'].includes(lowercased)) {
      return false;
    }
  }
  
  return defaultValue;
}

/**
 * Safely convert a value to a date
 * @param {*} value - Value to convert
 * @param {Date|null} defaultValue - Default value if conversion fails
 * @returns {Date|null} - Converted date or default value
 */
function safeDate(value, defaultValue = null) {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  
  if (value instanceof Date) {
    return value;
  }
  
  try {
    const date = new Date(value);
    return isNaN(date.getTime()) ? defaultValue : date;
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Safely truncate a string to a maximum length
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix to add if truncated
 * @returns {string} - Truncated string
 */
function safeTruncate(str, maxLength = 100, suffix = '...') {
  if (!str || typeof str !== 'string') {
    return '';
  }
  
  if (str.length <= maxLength) {
    return str;
  }
  
  return str.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Safely get a value from an array by index
 * @param {Array} arr - Array to access
 * @param {number} index - Index to access
 * @param {*} defaultValue - Default value if index is out of bounds
 * @returns {*} - Value at index or default value
 */
function safeArrayGet(arr, index, defaultValue = null) {
  if (!Array.isArray(arr) || index < 0 || index >= arr.length) {
    return defaultValue;
  }
  
  return arr[index];
}

/**
 * Safely create a MongoDB ObjectId
 * @param {string} id - ID string
 * @param {Function} ObjectId - MongoDB ObjectId constructor
 * @returns {Object|null} - ObjectId instance or null
 */
function safeObjectId(id, ObjectId) {
  try {
    if (!id) return null;
    return new ObjectId(id);
  } catch (error) {
    logger.warn(`Invalid ObjectId: ${id}`);
    return null;
  }
}

/**
 * Safely find a document by ID
 * @param {Object} model - Mongoose model
 * @param {string} id - Document ID
 * @param {string} entityName - Entity name for error message
 * @returns {Promise<Object>} - Found document
 * @throws {NotFoundError} - If document not found
 */
async function findByIdOrThrow(model, id, entityName) {
  const document = await model.findById(id);
  
  if (!document) {
    throw new NotFoundError(`${entityName} not found`, entityName);
  }
  
  return document;
}

/**
 * Safely find a document by query
 * @param {Object} model - Mongoose model
 * @param {Object} query - Query object
 * @param {string} entityName - Entity name for error message
 * @returns {Promise<Object>} - Found document
 * @throws {NotFoundError} - If document not found
 */
async function findOneOrThrow(model, query, entityName) {
  const document = await model.findOne(query);
  
  if (!document) {
    throw new NotFoundError(`${entityName} not found`, entityName);
  }
  
  return document;
}

/**
 * Safely handle pagination parameters
 * @param {Object} query - Query parameters
 * @returns {Object} - Normalized pagination parameters
 */
function normalizePagination(query) {
  const page = Math.max(1, safeNumber(query.page, 1));
  const limit = Math.min(100, Math.max(1, safeNumber(query.limit, 10)));
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
}

/**
 * Safely handle sorting parameters
 * @param {Object} query - Query parameters
 * @param {Object} defaultSort - Default sort object
 * @returns {Object} - Sort object for MongoDB
 */
function normalizeSort(query, defaultSort = { createdAt: -1 }) {
  if (!query.sort) {
    return defaultSort;
  }
  
  try {
    // Handle string format like "field:asc,another:-1"
    if (typeof query.sort === 'string') {
      return query.sort.split(',').reduce((sort, part) => {
        const [field, direction] = part.split(':');
        if (field) {
          sort[field.trim()] = direction === 'desc' || direction === '-1' ? -1 : 1;
        }
        return sort;
      }, {});
    }
    
    // Handle object format
    if (typeof query.sort === 'object' && !Array.isArray(query.sort)) {
      return query.sort;
    }
  } catch (error) {
    logger.warn(`Invalid sort parameter: ${error.message}`);
  }
  
  return defaultSort;
}

/**
 * Safely handle filtering parameters
 * @param {Object} query - Query parameters
 * @param {Array<string>} allowedFields - Allowed fields for filtering
 * @returns {Object} - Filter object for MongoDB
 */
function normalizeFilters(query, allowedFields = []) {
  const filters = {};
  
  for (const field of allowedFields) {
    if (query[field] !== undefined) {
      filters[field] = query[field];
    }
  }
  
  return filters;
}

/**
 * Safely sanitize an object by removing specified fields
 * @param {Object} obj - Object to sanitize
 * @param {Array<string>} fieldsToRemove - Fields to remove
 * @returns {Object} - Sanitized object
 */
function sanitizeObject(obj, fieldsToRemove = []) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const sanitized = { ...obj };
  
  for (const field of fieldsToRemove) {
    delete sanitized[field];
  }
  
  return sanitized;
}

/**
 * Safely handle a text search query
 * @param {string} searchText - Search text
 * @param {Array<string>} searchFields - Fields to search in
 * @returns {Object} - MongoDB search query
 */
function createSearchQuery(searchText, searchFields = []) {
  if (!searchText || !searchFields.length) {
    return {};
  }
  
  const searchRegex = new RegExp(searchText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
  
  return {
    $or: searchFields.map(field => ({ [field]: searchRegex }))
  };
}

// Export all utility functions
module.exports = {
  safeGet,
  safeSet,
  safeJsonParse,
  safeJsonStringify,
  safeExecute,
  safeExecuteAsync,
  validateRequiredFields,
  validateFieldTypes,
  safeNumber,
  safeBoolean,
  safeDate,
  safeTruncate,
  safeArrayGet,
  safeObjectId,
  findByIdOrThrow,
  findOneOrThrow,
  normalizePagination,
  normalizeSort,
  normalizeFilters,
  sanitizeObject,
  createSearchQuery
};
