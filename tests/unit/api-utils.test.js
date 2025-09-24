/**
 * API Utilities Unit Tests
 */

describe('API Utilities', () => {
  test('should handle request building', () => {
    const buildRequest = (method, url, options = {}) => {
      const request = {
        method: method.toUpperCase(),
        url,
        headers: options.headers || {},
        body: options.body || null,
        timeout: options.timeout || 30000
      };
      
      if (options.params) {
        const urlObj = new URL(url);
        Object.entries(options.params).forEach(([key, value]) => {
          urlObj.searchParams.set(key, value);
        });
        request.url = urlObj.toString();
      }
      
      return request;
    };
    
    const addAuthHeader = (request, token, type = 'Bearer') => {
      return {
        ...request,
        headers: {
          ...request.headers,
          'Authorization': `${type} ${token}`
        }
      };
    };
    
    const addContentType = (request, contentType) => {
      return {
        ...request,
        headers: {
          ...request.headers,
          'Content-Type': contentType
        }
      };
    };
    
    const buildFormData = (data) => {
      const formData = new URLSearchParams();
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value);
      });
      return formData.toString();
    };

    const request = buildRequest('GET', 'https://api.example.com/users', {
      params: { page: 1, limit: 10 },
      headers: { 'Accept': 'application/json' }
    });
    
    expect(request.method).toBe('GET');
    expect(request.url).toContain('page=1');
    expect(request.url).toContain('limit=10');
    expect(request.headers.Accept).toBe('application/json');
    
    const authRequest = addAuthHeader(request, 'abc123');
    expect(authRequest.headers.Authorization).toBe('Bearer abc123');
    
    const jsonRequest = addContentType(request, 'application/json');
    expect(jsonRequest.headers['Content-Type']).toBe('application/json');
    
    const formData = buildFormData({ name: 'John', age: 30 });
    expect(formData).toBe('name=John&age=30');
  });

  test('should handle response processing', () => {
    const processResponse = (response) => {
      const processed = {
        status: response.status,
        statusText: response.statusText || 'Unknown',
        headers: response.headers || {},
        data: response.data,
        success: response.status >= 200 && response.status < 300
      };
      
      if (!processed.success) {
        processed.error = {
          code: response.status,
          message: response.statusText || 'Request failed'
        };
      }
      
      return processed;
    };
    
    const extractPagination = (response) => {
      const headers = response.headers || {};
      const linkHeader = headers.link || headers.Link;
      
      const pagination = {
        current: 1,
        total: null,
        hasNext: false,
        hasPrev: false,
        nextUrl: null,
        prevUrl: null
      };
      
      if (linkHeader) {
        const links = linkHeader.split(',');
        links.forEach(link => {
          const match = link.match(/<([^>]+)>;\s*rel="([^"]+)"/);
          if (match) {
            const [, url, rel] = match;
            if (rel === 'next') {
              pagination.nextUrl = url.trim();
              pagination.hasNext = true;
            } else if (rel === 'prev') {
              pagination.prevUrl = url.trim();
              pagination.hasPrev = true;
            }
          }
        });
      }
      
      return pagination;
    };
    
    const parseErrorResponse = (response) => {
      const error = {
        status: response.status,
        message: 'Unknown error',
        details: null
      };
      
      if (response.data) {
        if (typeof response.data === 'string') {
          error.message = response.data;
        } else if (response.data.message) {
          error.message = response.data.message;
          error.details = response.data.details || response.data.errors;
        }
      }
      
      return error;
    };

    const successResponse = { status: 200, statusText: 'OK', data: { id: 1 } };
    const processed = processResponse(successResponse);
    expect(processed.success).toBe(true);
    expect(processed.data.id).toBe(1);
    
    const errorResponse = { status: 404, statusText: 'Not Found' };
    const processedError = processResponse(errorResponse);
    expect(processedError.success).toBe(false);
    expect(processedError.error.code).toBe(404);
    
    const paginatedResponse = {
      headers: { link: '<https://api.com?page=2>; rel="next", <https://api.com?page=1>; rel="prev"' }
    };
    const pagination = extractPagination(paginatedResponse);
    expect(pagination.hasNext).toBe(true);
    expect(pagination.nextUrl).toBe('https://api.com?page=2');
    
    const apiError = { status: 400, data: { message: 'Validation failed', errors: ['Invalid email'] } };
    const parsedError = parseErrorResponse(apiError);
    expect(parsedError.message).toBe('Validation failed');
    expect(parsedError.details).toEqual(['Invalid email']);
  });

  test('should handle retry logic', () => {
    const createRetryConfig = (maxRetries = 3, baseDelay = 1000, maxDelay = 30000) => {
      return {
        maxRetries,
        baseDelay,
        maxDelay,
        retryCondition: (error) => {
          const retryableStatuses = [408, 429, 500, 502, 503, 504];
          return retryableStatuses.includes(error.status);
        },
        delayCalculator: (attempt) => {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          return Math.min(delay, maxDelay);
        }
      };
    };
    
    const shouldRetry = (error, attempt, config) => {
      if (attempt >= config.maxRetries) return false;
      return config.retryCondition(error);
    };
    
    const calculateDelay = (attempt, config) => {
      return config.delayCalculator(attempt);
    };
    
    const simulateRetryAttempts = (error, config) => {
      const attempts = [];
      let attempt = 1;
      
      while (shouldRetry(error, attempt, config)) {
        attempts.push({
          attempt,
          delay: calculateDelay(attempt, config),
          willRetry: true
        });
        attempt++;
      }
      
      if (attempt <= config.maxRetries) {
        attempts.push({
          attempt,
          delay: 0,
          willRetry: false
        });
      }
      
      return attempts;
    };

    const config = createRetryConfig(3, 1000, 10000);
    
    expect(shouldRetry({ status: 503 }, 1, config)).toBe(true);
    expect(shouldRetry({ status: 404 }, 1, config)).toBe(false);
    expect(shouldRetry({ status: 503 }, 3, config)).toBe(false);
    
    expect(calculateDelay(1, config)).toBe(1000);
    expect(calculateDelay(2, config)).toBe(2000);
    expect(calculateDelay(3, config)).toBe(4000);
    
    const attempts = simulateRetryAttempts({ status: 503 }, config);
    expect(attempts).toHaveLength(3);
    expect(attempts[0].willRetry).toBe(true);
    expect(attempts[2].willRetry).toBe(false);
  });

  test('should handle rate limiting', () => {
    const createRateLimiter = (maxRequests, windowMs) => {
      const requests = [];
      
      return {
        isAllowed: () => {
          const now = Date.now();
          const windowStart = now - windowMs;
          
          // Remove old requests
          while (requests.length > 0 && requests[0] < windowStart) {
            requests.shift();
          }
          
          return requests.length < maxRequests;
        },
        
        recordRequest: () => {
          requests.push(Date.now());
        },
        
        getStats: () => ({
          requestsInWindow: requests.length,
          maxRequests,
          windowMs,
          resetTime: requests.length > 0 ? requests[0] + windowMs : Date.now()
        }),
        
        timeUntilReset: () => {
          if (requests.length === 0) return 0;
          const oldestRequest = requests[0];
          const resetTime = oldestRequest + windowMs;
          return Math.max(0, resetTime - Date.now());
        }
      };
    };
    
    const parseRateLimitHeaders = (headers) => {
      return {
        limit: parseInt(headers['x-ratelimit-limit'] || headers['X-RateLimit-Limit'] || '0'),
        remaining: parseInt(headers['x-ratelimit-remaining'] || headers['X-RateLimit-Remaining'] || '0'),
        reset: parseInt(headers['x-ratelimit-reset'] || headers['X-RateLimit-Reset'] || '0'),
        retryAfter: parseInt(headers['retry-after'] || headers['Retry-After'] || '0')
      };
    };

    const limiter = createRateLimiter(5, 60000); // 5 requests per minute
    
    expect(limiter.isAllowed()).toBe(true);
    
    // Record 5 requests
    for (let i = 0; i < 5; i++) {
      limiter.recordRequest();
    }
    
    expect(limiter.isAllowed()).toBe(false);
    
    const stats = limiter.getStats();
    expect(stats.requestsInWindow).toBe(5);
    expect(stats.maxRequests).toBe(5);
    
    const headers = {
      'X-RateLimit-Limit': '100',
      'X-RateLimit-Remaining': '95',
      'X-RateLimit-Reset': '1640995200'
    };
    
    const rateLimitInfo = parseRateLimitHeaders(headers);
    expect(rateLimitInfo.limit).toBe(100);
    expect(rateLimitInfo.remaining).toBe(95);
  });

  test('should handle API versioning', () => {
    const buildVersionedUrl = (baseUrl, version, endpoint) => {
      const versionFormats = {
        'path': `${baseUrl}/v${version}/${endpoint}`,
        'subdomain': `${baseUrl.replace('://', `://v${version}.`)}/${endpoint}`,
        'query': `${baseUrl}/${endpoint}?version=${version}`,
        'header': `${baseUrl}/${endpoint}` // Version goes in header
      };
      
      return versionFormats.path; // Default to path versioning
    };
    
    const addVersionHeader = (request, version, headerName = 'API-Version') => {
      return {
        ...request,
        headers: {
          ...request.headers,
          [headerName]: version
        }
      };
    };
    
    const parseVersionFromUrl = (url) => {
      const pathVersionMatch = url.match(/\/v(\d+(?:\.\d+)*)\//);
      if (pathVersionMatch) return pathVersionMatch[1];
      
      const subdomainVersionMatch = url.match(/\/\/v(\d+(?:\.\d+)*)\./);
      if (subdomainVersionMatch) return subdomainVersionMatch[1];
      
      const queryVersionMatch = url.match(/[?&]version=([^&]+)/);
      if (queryVersionMatch) return queryVersionMatch[1];
      
      return null;
    };
    
    const isVersionSupported = (version, supportedVersions) => {
      return supportedVersions.includes(version);
    };

    expect(buildVersionedUrl('https://api.example.com', '2', 'users'))
      .toBe('https://api.example.com/v2/users');
    
    const request = { headers: {} };
    const versionedRequest = addVersionHeader(request, '2.1');
    expect(versionedRequest.headers['API-Version']).toBe('2.1');
    
    expect(parseVersionFromUrl('https://api.example.com/v2/users')).toBe('2');
    expect(parseVersionFromUrl('https://v1.api.example.com/users')).toBe('1');
    expect(parseVersionFromUrl('https://api.example.com/users?version=1.5')).toBe('1.5');
    
    expect(isVersionSupported('2', ['1', '2', '3'])).toBe(true);
    expect(isVersionSupported('4', ['1', '2', '3'])).toBe(false);
  });

  test('should handle request caching', () => {
    const createRequestCache = (maxSize = 100, ttlMs = 300000) => {
      const cache = new Map();
      
      const generateKey = (method, url, body) => {
        return `${method}:${url}:${body ? JSON.stringify(body) : ''}`;
      };
      
      const isExpired = (entry) => {
        return Date.now() > entry.timestamp + ttlMs;
      };
      
      return {
        get: (method, url, body) => {
          const key = generateKey(method, url, body);
          const entry = cache.get(key);
          
          if (!entry || isExpired(entry)) {
            cache.delete(key);
            return null;
          }
          
          return entry.response;
        },
        
        set: (method, url, body, response) => {
          const key = generateKey(method, url, body);
          
          // Remove oldest entries if cache is full
          if (cache.size >= maxSize) {
            const firstKey = cache.keys().next().value;
            cache.delete(firstKey);
          }
          
          cache.set(key, {
            response,
            timestamp: Date.now()
          });
        },
        
        clear: () => {
          cache.clear();
        },
        
        size: () => cache.size,
        
        cleanup: () => {
          const now = Date.now();
          for (const [key, entry] of cache.entries()) {
            if (now > entry.timestamp + ttlMs) {
              cache.delete(key);
            }
          }
        }
      };
    };
    
    const shouldCacheRequest = (method, status) => {
      const cacheableMethods = ['GET', 'HEAD'];
      const cacheableStatuses = [200, 203, 300, 301, 410];
      
      return cacheableMethods.includes(method) && cacheableStatuses.includes(status);
    };

    const cache = createRequestCache(5, 60000);
    
    expect(cache.get('GET', '/api/users')).toBeNull();
    
    cache.set('GET', '/api/users', null, { data: [{ id: 1 }] });
    expect(cache.get('GET', '/api/users')).toEqual({ data: [{ id: 1 }] });
    
    expect(cache.size()).toBe(1);
    
    expect(shouldCacheRequest('GET', 200)).toBe(true);
    expect(shouldCacheRequest('POST', 200)).toBe(false);
    expect(shouldCacheRequest('GET', 404)).toBe(false);
    
    cache.clear();
    expect(cache.size()).toBe(0);
  });
});
