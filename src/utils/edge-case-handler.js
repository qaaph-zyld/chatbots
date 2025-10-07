/**
 * Edge Case Handler
 *
 * Helper utilities for working safely with optional data, validation and
 * defensive conversions across the chatbot platform.
 */

const logger = require('./logger');
const { ValidationError, NotFoundError } = require('./errors');

function safeGet(obj, path, defaultValue = undefined) {
  if (obj === null || obj === undefined) {
    return defaultValue;
  }

  const keys = Array.isArray(path) ? path : String(path || '').split('.');
  let current = obj;

  for (const key of keys) {
    if (current === null || typeof current !== 'object') {
      return defaultValue;
    }
    current = current[key];
    if (current === undefined) {
      return defaultValue;
    }
  }

  return current;
}

function safeSet(obj, path, value) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  const keys = Array.isArray(path) ? path : String(path || '').split('.');
  if (!keys.length) {
    return obj;
  }

  let current = obj;
  for (let i = 0; i < keys.length - 1; i += 1) {
    const key = keys[i];
    if (current[key] === undefined || current[key] === null) {
      current[key] = {};
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
  return obj;
}

function safeJsonParse(str, defaultValue = {}) {
  try {
    if (!str) {
      return defaultValue;
    }
    return JSON.parse(str);
  } catch (error) {
    logger.warn(`Failed to parse JSON: ${error.message}`);
    return defaultValue;
  }
}

function safeJsonStringify(obj, defaultValue = '{}') {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    logger.warn(`Failed to stringify object: ${error.message}`);
    return defaultValue;
  }
}

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

function validateRequiredFields(obj, requiredFields) {
  const missing = requiredFields.filter((field) => {
    const value = safeGet(obj, field);
    return value === undefined || value === null || value === '';
  });

  if (missing.length) {
    throw new ValidationError(
      `Missing required fields: ${missing.join(', ')}`,
      missing.reduce((acc, field) => {
        acc[field] = 'Required field is missing';
        return acc;
      }, {})
    );
  }
}

function validateFieldTypes(obj, typeDefinitions) {
  const typeErrors = {};

  for (const [field, expected] of Object.entries(typeDefinitions)) {
    const value = safeGet(obj, field);

    if (value === undefined || value === null) {
      continue;
    }

    let isValid = false;
    switch (expected) {
      case 'string':
        isValid = typeof value === 'string';
        break;
      case 'number':
        isValid = typeof value === 'number' && !Number.isNaN(value);
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
        isValid = value instanceof Date || (typeof value === 'string' && !Number.isNaN(Date.parse(value)));
        break;
      case 'email':
        isValid = typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        break;
      case 'url':
        isValid = typeof value === 'string' && /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i.test(value);
        break;
      default:
        isValid = typeof value === 'object' && value !== null;
    }

    if (!isValid) {
      typeErrors[field] = `Expected type '${expected}', got '${typeof value}'`;
    }
  }

  if (Object.keys(typeErrors).length) {
    throw new ValidationError('Type validation failed', typeErrors);
  }
}

function safeNumber(value, defaultValue = 0) {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }

  const num = Number(value);
  return Number.isNaN(num) ? defaultValue : num;
}

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
    const normalised = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y', 'on'].includes(normalised)) {
      return true;
    }
    if (['false', '0', 'no', 'n', 'off'].includes(normalised)) {
      return false;
    }
  }

  return defaultValue;
}

function safeDate(value, defaultValue = null) {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? defaultValue : value;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? defaultValue : date;
}

function safeTruncate(str, maxLength = 100, suffix = '...') {
  if (typeof str !== 'string') {
    return '';
  }

  if (str.length <= maxLength) {
    return str;
  }

  return `${str.slice(0, Math.max(0, maxLength - suffix.length))}${suffix}`;
}

function safeArrayGet(arr, index, defaultValue = null) {
  if (!Array.isArray(arr) || index < 0 || index >= arr.length) {
    return defaultValue;
  }
  return arr[index];
}

function safeObjectId(id, ObjectId) {
  if (!id || typeof ObjectId !== 'function') {
    return null;
  }
  try {
    return new ObjectId(id);
  } catch (error) {
    logger.warn(`Invalid ObjectId: ${id}`);
    return null;
  }
}

async function findByIdOrThrow(model, id, entityName) {
  const document = await model.findById(id);
  if (!document) {
    throw new NotFoundError(`${entityName} not found`, entityName);
  }
  return document;
}

async function findOneOrThrow(model, query, entityName) {
  const document = await model.findOne(query);
  if (!document) {
    throw new NotFoundError(`${entityName} not found`, entityName);
  }
  return document;
}

function normalizePagination(query = {}) {
  const page = Math.max(1, safeNumber(query.page, 1));
  const limit = Math.min(100, Math.max(1, safeNumber(query.limit, 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function normalizeSort(query = {}, defaultSort = { createdAt: -1 }) {
  const sortParam = query.sort;
  if (!sortParam) {
    return defaultSort;
  }

  try {
    if (typeof sortParam === 'string') {
      return sortParam.split(',').reduce((acc, part) => {
        const [field, direction] = part.split(':');
        if (field) {
          acc[field.trim()] = direction && direction.trim().toLowerCase().startsWith('desc') ? -1 : 1;
        }
        return acc;
      }, {});
    }

    if (typeof sortParam === 'object' && !Array.isArray(sortParam)) {
      return sortParam;
    }
  } catch (error) {
    logger.warn(`Invalid sort parameter: ${error.message}`);
  }

  return defaultSort;
}

function normalizeFilters(query = {}, allowedFields = []) {
  return allowedFields.reduce((acc, field) => {
    if (query[field] !== undefined) {
      acc[field] = query[field];
    }
    return acc;
  }, {});
}

function sanitizeObject(obj, fieldsToRemove = []) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const clone = { ...obj };
  fieldsToRemove.forEach((field) => delete clone[field]);
  return clone;
}

function createSearchQuery(searchText, searchFields = []) {
  if (!searchText || !searchFields.length) {
    return {};
  }

  const escaped = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escaped, 'i');
  return {
    $or: searchFields.map((field) => ({ [field]: regex }))
  };
}

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
