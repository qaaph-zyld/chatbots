/**
 * API Response Optimizer
 * 
 * This module provides utilities to optimize API responses for performance,
 * including response compression, field filtering, pagination optimization,
 * and response caching.
 */

const zlib = require('zlib');
const { promisify } = require('util');
const crypto = require('crypto');

// Promisify zlib functions
const gzip = promisify(zlib.gzip);
const deflate = promisify(zlib.deflate);
const brotliCompress = promisify(zlib.brotliCompress);

/**
 * Response Field Filter
 * Allows selective inclusion/exclusion of fields in API responses
 */
class ResponseFieldFilter {
  /**
   * Create a new response field filter
   * @param {Object} options - Filter options
   */
  constructor(options = {}) {
    this.options = {
      defaultFields: options.defaultFields || [],
      maxFields: options.maxFields || 50,
      allowAllFields: options.allowAllFields !== false,
      logger: options.logger || console,
      ...options
    };
  }
  
  /**
   * Filter an object based on requested fields
   * @param {Object} obj - Object to filter
   * @param {Array<string>|string} fields - Fields to include
   * @param {Array<string>|string} exclude - Fields to exclude
   * @returns {Object} Filtered object
   */
  filter(obj, fields, exclude) {
    // Handle array input
    if (Array.isArray(obj)) {
      return obj.map(item => this.filter(item, fields, exclude));
    }
    
    // If not an object or null, return as is
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
    
    // Parse fields parameter
    let includedFields = this._parseFields(fields);
    
    // Use default fields if none specified
    if (includedFields.length === 0 && this.options.defaultFields.length > 0) {
      includedFields = [...this.options.defaultFields];
    }
    
    // Parse exclude parameter
    const excludedFields = this._parseFields(exclude);
    
    // If no fields specified and all fields allowed, return object minus excluded fields
    if (includedFields.length === 0 && this.options.allowAllFields) {
      const result = { ...obj };
      
      // Remove excluded fields
      for (const field of excludedFields) {
        delete result[field];
      }
      
      return result;
    }
    
    // Filter object based on included fields
    const result = {};
    
    for (const field of includedFields) {
      // Skip excluded fields
      if (excludedFields.includes(field)) {
        continue;
      }
      
      // Handle nested fields (e.g., 'user.name')
      if (field.includes('.')) {
        const parts = field.split('.');
        const rootField = parts[0];
        const nestedField = parts.slice(1).join('.');
        
        // Only process if root field exists
        if (obj[rootField] !== undefined) {
          // Initialize nested object if needed
          if (!result[rootField]) {
            result[rootField] = Array.isArray(obj[rootField]) ? [] : {};
          }
          
          // Filter nested object
          if (Array.isArray(obj[rootField])) {
            result[rootField] = obj[rootField].map(item => 
              this.filter(item, nestedField, null)
            );
          } else {
            result[rootField] = this.filter(obj[rootField], nestedField, null);
          }
        }
      } else if (obj[field] !== undefined) {
        // Copy field value
        result[field] = obj[field];
      }
    }
    
    return result;
  }
  
  /**
   * Parse fields parameter
   * @private
   * @param {Array<string>|string} fields - Fields parameter
   * @returns {Array<string>} Parsed fields
   */
  _parseFields(fields) {
    if (!fields) {
      return [];
    }
    
    // Handle comma-separated string
    if (typeof fields === 'string') {
      fields = fields.split(',').map(f => f.trim());
    }
    
    // Ensure array
    if (!Array.isArray(fields)) {
      return [];
    }
    
    // Limit number of fields
    return fields.slice(0, this.options.maxFields);
  }
}

/**
 * Response Compressor
 * Compresses API responses based on Accept-Encoding header
 */
class ResponseCompressor {
  /**
   * Create a new response compressor
   * @param {Object} options - Compressor options
   */
  constructor(options = {}) {
    this.options = {
      threshold: options.threshold || 1024, // Min size to compress (bytes)
      level: options.level || 6, // Compression level (0-9)
      memLevel: options.memLevel || 8, // Memory level (1-9)
      brotliQuality: options.brotliQuality || 4, // Brotli quality (0-11)
      brotliMode: options.brotliMode || 0, // Brotli mode (0-2)
      preferBrotli: options.preferBrotli !== false,
      logger: options.logger || console,
      ...options
    };
  }
  
  /**
   * Compress data based on accepted encodings
   * @param {Buffer|string} data - Data to compress
   * @param {string|Array<string>} acceptEncoding - Accept-Encoding header value
   * @returns {Promise<Object>} Compressed data and encoding
   */
  async compress(data, acceptEncoding) {
    // Convert string to buffer
    if (typeof data === 'string') {
      data = Buffer.from(data);
    }
    
    // Skip compression for small responses
    if (data.length < this.options.threshold) {
      return { data, encoding: 'identity' };
    }
    
    // Parse accepted encodings
    const encodings = this._parseAcceptEncoding(acceptEncoding);
    
    // Try compression methods in order of preference
    try {
      // Prefer Brotli if available and accepted
      if (this.options.preferBrotli && encodings.includes('br')) {
        const compressed = await brotliCompress(data, {
          params: {
            [zlib.constants.BROTLI_PARAM_QUALITY]: this.options.brotliQuality,
            [zlib.constants.BROTLI_PARAM_MODE]: this.options.brotliMode
          }
        });
        
        return { data: compressed, encoding: 'br' };
      }
      
      // Try gzip if accepted
      if (encodings.includes('gzip')) {
        const compressed = await gzip(data, {
          level: this.options.level,
          memLevel: this.options.memLevel
        });
        
        return { data: compressed, encoding: 'gzip' };
      }
      
      // Try deflate if accepted
      if (encodings.includes('deflate')) {
        const compressed = await deflate(data, {
          level: this.options.level,
          memLevel: this.options.memLevel
        });
        
        return { data: compressed, encoding: 'deflate' };
      }
      
      // Fallback to Brotli if accepted but not preferred
      if (encodings.includes('br')) {
        const compressed = await brotliCompress(data, {
          params: {
            [zlib.constants.BROTLI_PARAM_QUALITY]: this.options.brotliQuality,
            [zlib.constants.BROTLI_PARAM_MODE]: this.options.brotliMode
          }
        });
        
        return { data: compressed, encoding: 'br' };
      }
    } catch (err) {
      this.options.logger.error('Compression error:', err);
    }
    
    // Return uncompressed data if compression fails or no accepted encoding
    return { data, encoding: 'identity' };
  }
  
  /**
   * Parse Accept-Encoding header
   * @private
   * @param {string|Array<string>} acceptEncoding - Accept-Encoding header value
   * @returns {Array<string>} Accepted encodings
   */
  _parseAcceptEncoding(acceptEncoding) {
    if (!acceptEncoding) {
      return [];
    }
    
    // Handle array input
    if (Array.isArray(acceptEncoding)) {
      acceptEncoding = acceptEncoding.join(', ');
    }
    
    // Parse header
    return acceptEncoding
      .split(',')
      .map(encoding => {
        const [name] = encoding.trim().split(';');
        return name.trim().toLowerCase();
      })
      .filter(encoding => ['gzip', 'deflate', 'br'].includes(encoding));
  }
}

/**
 * Response Pagination Optimizer
 * Optimizes pagination for API responses
 */
class ResponsePaginator {
  /**
   * Create a new response paginator
   * @param {Object} options - Paginator options
   */
  constructor(options = {}) {
    this.options = {
      defaultLimit: options.defaultLimit || 20,
      maxLimit: options.maxLimit || 100,
      defaultPage: options.defaultPage || 1,
      pageParam: options.pageParam || 'page',
      limitParam: options.limitParam || 'limit',
      offsetParam: options.offsetParam || 'offset',
      cursorParam: options.cursorParam || 'cursor',
      includeTotal: options.includeTotal !== false,
      useCursor: options.useCursor || false,
      logger: options.logger || console,
      ...options
    };
  }
  
  /**
   * Paginate an array of items
   * @param {Array} items - Items to paginate
   * @param {Object} query - Query parameters
   * @returns {Object} Paginated result
   */
  paginate(items, query = {}) {
    // Handle cursor-based pagination
    if (this.options.useCursor) {
      return this._cursorPaginate(items, query);
    }
    
    // Handle offset/limit pagination
    if (query[this.options.offsetParam] !== undefined) {
      return this._offsetPaginate(items, query);
    }
    
    // Default to page/limit pagination
    return this._pagePaginate(items, query);
  }
  
  /**
   * Page-based pagination
   * @private
   * @param {Array} items - Items to paginate
   * @param {Object} query - Query parameters
   * @returns {Object} Paginated result
   */
  _pagePaginate(items, query) {
    // Parse parameters
    const page = Math.max(1, parseInt(query[this.options.pageParam]) || this.options.defaultPage);
    const limit = Math.min(this.options.maxLimit, Math.max(1, parseInt(query[this.options.limitParam]) || this.options.defaultLimit));
    
    // Calculate offset
    const offset = (page - 1) * limit;
    
    // Get page items
    const pageItems = items.slice(offset, offset + limit);
    
    // Calculate pagination info
    const total = items.length;
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    // Build result
    const result = {
      data: pageItems,
      pagination: {
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    };
    
    // Include total if requested
    if (this.options.includeTotal) {
      result.pagination.total = total;
    }
    
    return result;
  }
  
  /**
   * Offset-based pagination
   * @private
   * @param {Array} items - Items to paginate
   * @param {Object} query - Query parameters
   * @returns {Object} Paginated result
   */
  _offsetPaginate(items, query) {
    // Parse parameters
    const offset = Math.max(0, parseInt(query[this.options.offsetParam]) || 0);
    const limit = Math.min(this.options.maxLimit, Math.max(1, parseInt(query[this.options.limitParam]) || this.options.defaultLimit));
    
    // Get page items
    const pageItems = items.slice(offset, offset + limit);
    
    // Calculate pagination info
    const total = items.length;
    const hasNextPage = offset + limit < total;
    const hasPrevPage = offset > 0;
    
    // Build result
    const result = {
      data: pageItems,
      pagination: {
        offset,
        limit,
        hasNextPage,
        hasPrevPage,
        nextOffset: hasNextPage ? offset + limit : null,
        prevOffset: hasPrevPage ? Math.max(0, offset - limit) : null
      }
    };
    
    // Include total if requested
    if (this.options.includeTotal) {
      result.pagination.total = total;
    }
    
    return result;
  }
  
  /**
   * Cursor-based pagination
   * @private
   * @param {Array} items - Items to paginate
   * @param {Object} query - Query parameters
   * @returns {Object} Paginated result
   */
  _cursorPaginate(items, query) {
    // Parse parameters
    const cursor = query[this.options.cursorParam];
    const limit = Math.min(this.options.maxLimit, Math.max(1, parseInt(query[this.options.limitParam]) || this.options.defaultLimit));
    
    // Find cursor position
    let startIndex = 0;
    
    if (cursor) {
      try {
        const decodedCursor = Buffer.from(cursor, 'base64').toString('utf-8');
        const cursorData = JSON.parse(decodedCursor);
        
        if (cursorData.index !== undefined) {
          startIndex = cursorData.index;
        }
      } catch (err) {
        this.options.logger.error('Invalid cursor:', err);
      }
    }
    
    // Get page items
    const pageItems = items.slice(startIndex, startIndex + limit);
    
    // Calculate pagination info
    const hasNextPage = startIndex + limit < items.length;
    const hasPrevPage = startIndex > 0;
    
    // Create cursors
    const nextCursor = hasNextPage
      ? Buffer.from(JSON.stringify({ index: startIndex + limit })).toString('base64')
      : null;
      
    const prevCursor = hasPrevPage
      ? Buffer.from(JSON.stringify({ index: Math.max(0, startIndex - limit) })).toString('base64')
      : null;
    
    // Build result
    const result = {
      data: pageItems,
      pagination: {
        limit,
        hasNextPage,
        hasPrevPage,
        nextCursor,
        prevCursor
      }
    };
    
    // Include total if requested
    if (this.options.includeTotal) {
      result.pagination.total = items.length;
    }
    
    return result;
  }
}

/**
 * Response Cache
 * Caches API responses for improved performance
 */
class ResponseCache {
  /**
   * Create a new response cache
   * @param {Object} options - Cache options
   */
  constructor(options = {}) {
    this.options = {
      ttl: options.ttl || 60000, // 1 minute
      maxSize: options.maxSize || 100,
      namespace: options.namespace || 'api',
      keyGenerator: options.keyGenerator || this._defaultKeyGenerator,
      storage: options.storage || new Map(),
      logger: options.logger || console,
      ...options
    };
    
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0
    };
  }
  
  /**
   * Get a cached response
   * @param {string} key - Cache key
   * @returns {Object|null} Cached response or null if not found
   */
  get(key) {
    // Generate key if not provided
    if (typeof key !== 'string') {
      key = this.options.keyGenerator(key);
    }
    
    // Add namespace
    const namespacedKey = `${this.options.namespace}:${key}`;
    
    // Get from storage
    const cached = this.options.storage.get(namespacedKey);
    
    if (!cached) {
      this.stats.misses++;
      return null;
    }
    
    // Check if expired
    if (Date.now() > cached.expiresAt) {
      this.options.storage.delete(namespacedKey);
      this.stats.size = this._getStorageSize();
      this.stats.misses++;
      return null;
    }
    
    this.stats.hits++;
    return cached.value;
  }
  
  /**
   * Set a cached response
   * @param {string} key - Cache key
   * @param {Object} value - Response value
   * @param {number} ttl - Time to live in milliseconds
   * @returns {void}
   */
  set(key, value, ttl) {
    // Generate key if not provided
    if (typeof key !== 'string') {
      key = this.options.keyGenerator(key);
    }
    
    // Add namespace
    const namespacedKey = `${this.options.namespace}:${key}`;
    
    // Check if cache is full
    if (this._getStorageSize() >= this.options.maxSize) {
      // Remove oldest entry
      this._removeOldest();
    }
    
    // Set in storage
    this.options.storage.set(namespacedKey, {
      value,
      createdAt: Date.now(),
      expiresAt: Date.now() + (ttl || this.options.ttl)
    });
    
    this.stats.size = this._getStorageSize();
  }
  
  /**
   * Remove a cached response
   * @param {string} key - Cache key
   * @returns {boolean} True if removed, false otherwise
   */
  delete(key) {
    // Generate key if not provided
    if (typeof key !== 'string') {
      key = this.options.keyGenerator(key);
    }
    
    // Add namespace
    const namespacedKey = `${this.options.namespace}:${key}`;
    
    // Delete from storage
    const result = this.options.storage.delete(namespacedKey);
    
    if (result) {
      this.stats.size = this._getStorageSize();
    }
    
    return result;
  }
  
  /**
   * Clear all cached responses
   * @returns {void}
   */
  clear() {
    // Clear storage
    if (typeof this.options.storage.clear === 'function') {
      this.options.storage.clear();
    } else {
      // Fallback for storages without clear method
      for (const key of this.options.storage.keys()) {
        if (key.startsWith(`${this.options.namespace}:`)) {
          this.options.storage.delete(key);
        }
      }
    }
    
    this.stats.size = this._getStorageSize();
  }
  
  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? this.stats.hits / total : 0;
    
    return {
      ...this.stats,
      hitRate
    };
  }
  
  /**
   * Default key generator
   * @private
   * @param {Object} req - Request object
   * @returns {string} Cache key
   */
  _defaultKeyGenerator(req) {
    // Create key from method, url, and query
    const method = req.method || 'GET';
    const url = req.url || req.path || '/';
    const query = req.query || {};
    
    // Sort query parameters for consistent keys
    const sortedQuery = Object.keys(query)
      .sort()
      .reduce((acc, key) => {
        acc[key] = query[key];
        return acc;
      }, {});
    
    // Create hash
    const hash = crypto
      .createHash('md5')
      .update(`${method}:${url}:${JSON.stringify(sortedQuery)}`)
      .digest('hex');
    
    return hash;
  }
  
  /**
   * Get storage size
   * @private
   * @returns {number} Storage size
   */
  _getStorageSize() {
    // Count only keys in namespace
    let size = 0;
    
    for (const key of this.options.storage.keys()) {
      if (key.startsWith(`${this.options.namespace}:`)) {
        size++;
      }
    }
    
    return size;
  }
  
  /**
   * Remove oldest entry
   * @private
   * @returns {void}
   */
  _removeOldest() {
    let oldestKey = null;
    let oldestTime = Infinity;
    
    // Find oldest entry
    for (const [key, value] of this.options.storage.entries()) {
      if (key.startsWith(`${this.options.namespace}:`) && value.createdAt < oldestTime) {
        oldestKey = key;
        oldestTime = value.createdAt;
      }
    }
    
    // Remove oldest entry
    if (oldestKey) {
      this.options.storage.delete(oldestKey);
    }
  }
}

/**
 * Express middleware for API response optimization
 * @param {Object} options - Middleware options
 * @returns {Function} Express middleware
 */
function apiResponseOptimizer(options = {}) {
  const opts = {
    compress: options.compress !== false,
    filter: options.filter !== false,
    paginate: options.paginate !== false,
    cache: options.cache !== false,
    cacheControl: options.cacheControl || 'public, max-age=60',
    logger: options.logger || console,
    ...options
  };
  
  // Create components
  const compressor = opts.compress ? new ResponseCompressor(opts.compressOptions) : null;
  const fieldFilter = opts.filter ? new ResponseFieldFilter(opts.filterOptions) : null;
  const paginator = opts.paginate ? new ResponsePaginator(opts.paginateOptions) : null;
  const cache = opts.cache ? new ResponseCache(opts.cacheOptions) : null;
  
  return async function(req, res, next) {
    // Store original methods
    const originalJson = res.json;
    const originalSend = res.send;
    
    // Check cache if enabled
    if (opts.cache && cache) {
      const cached = cache.get(req);
      
      if (cached) {
        // Set headers from cached response
        if (cached.headers) {
          Object.entries(cached.headers).forEach(([key, value]) => {
            res.set(key, value);
          });
        }
        
        // Send cached response
        return res.status(cached.status || 200).send(cached.body);
      }
    }
    
    // Override json method
    res.json = function(body) {
      // Apply field filtering if enabled
      if (opts.filter && fieldFilter && body) {
        const fields = req.query.fields || req.query.select;
        const exclude = req.query.exclude || req.query.omit;
        
        body = fieldFilter.filter(body, fields, exclude);
      }
      
      // Apply pagination if enabled
      if (opts.paginate && paginator && Array.isArray(body)) {
        body = paginator.paginate(body, req.query);
      } else if (opts.paginate && paginator && body && Array.isArray(body.data)) {
        body.data = paginator.paginate(body.data, req.query).data;
      }
      
      // Convert to JSON string
      const jsonBody = JSON.stringify(body);
      
      // Set content type
      res.set('Content-Type', 'application/json; charset=utf-8');
      
      // Set cache control if not set
      if (opts.cacheControl && !res.get('Cache-Control')) {
        res.set('Cache-Control', opts.cacheControl);
      }
      
      // Apply compression if enabled
      if (opts.compress && compressor) {
        compressor.compress(jsonBody, req.headers['accept-encoding'])
          .then(({ data, encoding }) => {
            // Set content encoding if compressed
            if (encoding !== 'identity') {
              res.set('Content-Encoding', encoding);
            }
            
            // Cache response if enabled
            if (opts.cache && cache) {
              cache.set(req, {
                body: data,
                status: res.statusCode,
                headers: {
                  'Content-Type': 'application/json; charset=utf-8',
                  'Content-Encoding': encoding !== 'identity' ? encoding : undefined,
                  'Cache-Control': res.get('Cache-Control')
                }
              });
            }
            
            // Send response
            return originalSend.call(res, data);
          })
          .catch(err => {
            opts.logger.error('Compression error:', err);
            
            // Send uncompressed response on error
            return originalSend.call(res, jsonBody);
          });
        
        return res;
      }
      
      // Cache response if enabled
      if (opts.cache && cache) {
        cache.set(req, {
          body: jsonBody,
          status: res.statusCode,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': res.get('Cache-Control')
          }
        });
      }
      
      // Send uncompressed response
      return originalSend.call(res, jsonBody);
    };
    
    next();
  };
}

module.exports = {
  ResponseFieldFilter,
  ResponseCompressor,
  ResponsePaginator,
  ResponseCache,
  apiResponseOptimizer
};
