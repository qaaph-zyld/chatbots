/**
 * Web Utilities Unit Tests
 */

describe('Web Utilities', () => {
  test('should handle URL operations', () => {
    const parseURL = (url) => {
      try {
        const parsed = new URL(url);
        return {
          protocol: parsed.protocol,
          hostname: parsed.hostname,
          port: parsed.port,
          pathname: parsed.pathname,
          search: parsed.search,
          hash: parsed.hash,
          origin: parsed.origin
        };
      } catch {
        return null;
      }
    };
    
    const buildURL = (base, params = {}) => {
      const url = new URL(base);
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
      return url.toString();
    };
    
    const extractDomain = (url) => {
      try {
        return new URL(url).hostname;
      } catch {
        return null;
      }
    };
    
    const isValidURL = (url) => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    };

    const parsed = parseURL('https://example.com:8080/path?query=1#hash');
    expect(parsed.protocol).toBe('https:');
    expect(parsed.hostname).toBe('example.com');
    expect(parsed.port).toBe('8080');
    expect(parsed.pathname).toBe('/path');
    
    expect(buildURL('https://api.com', { key: 'value', test: '123' }))
      .toBe('https://api.com/?key=value&test=123');
    
    expect(extractDomain('https://www.example.com/path')).toBe('www.example.com');
    expect(isValidURL('https://example.com')).toBe(true);
    expect(isValidURL('not-a-url')).toBe(false);
  });

  test('should handle query string operations', () => {
    const parseQueryString = (queryString) => {
      const params = {};
      const urlParams = new URLSearchParams(queryString);
      
      for (const [key, value] of urlParams) {
        if (params[key]) {
          if (Array.isArray(params[key])) {
            params[key].push(value);
          } else {
            params[key] = [params[key], value];
          }
        } else {
          params[key] = value;
        }
      }
      
      return params;
    };
    
    const buildQueryString = (params) => {
      const urlParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => urlParams.append(key, v));
        } else {
          urlParams.set(key, value);
        }
      });
      
      return urlParams.toString();
    };
    
    const addQueryParam = (url, key, value) => {
      const urlObj = new URL(url);
      urlObj.searchParams.set(key, value);
      return urlObj.toString();
    };
    
    const removeQueryParam = (url, key) => {
      const urlObj = new URL(url);
      urlObj.searchParams.delete(key);
      return urlObj.toString();
    };

    expect(parseQueryString('key1=value1&key2=value2')).toEqual({
      key1: 'value1',
      key2: 'value2'
    });
    
    expect(parseQueryString('tags=js&tags=web')).toEqual({
      tags: ['js', 'web']
    });
    
    expect(buildQueryString({ name: 'John', age: '30' })).toBe('name=John&age=30');
    
    expect(addQueryParam('https://example.com', 'test', 'value'))
      .toBe('https://example.com/?test=value');
    
    expect(removeQueryParam('https://example.com?test=value&keep=yes', 'test'))
      .toBe('https://example.com/?keep=yes');
  });

  test('should handle cookie operations', () => {
    const parseCookie = (cookieString) => {
      const cookies = {};
      
      cookieString.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
          cookies[name] = decodeURIComponent(value);
        }
      });
      
      return cookies;
    };
    
    const buildCookie = (name, value, options = {}) => {
      let cookie = `${name}=${encodeURIComponent(value)}`;
      
      if (options.expires) {
        cookie += `; expires=${options.expires.toUTCString()}`;
      }
      
      if (options.maxAge) {
        cookie += `; max-age=${options.maxAge}`;
      }
      
      if (options.domain) {
        cookie += `; domain=${options.domain}`;
      }
      
      if (options.path) {
        cookie += `; path=${options.path}`;
      }
      
      if (options.secure) {
        cookie += '; secure';
      }
      
      if (options.httpOnly) {
        cookie += '; httponly';
      }
      
      return cookie;
    };
    
    const isCookieExpired = (cookieString) => {
      const expiresMatch = cookieString.match(/expires=([^;]+)/i);
      if (!expiresMatch) return false;
      
      const expiresDate = new Date(expiresMatch[1]);
      return expiresDate < new Date();
    };

    expect(parseCookie('name=John; age=30; city=NYC')).toEqual({
      name: 'John',
      age: '30',
      city: 'NYC'
    });
    
    const cookie = buildCookie('session', 'abc123', {
      path: '/',
      secure: true,
      httpOnly: true
    });
    
    expect(cookie).toContain('session=abc123');
    expect(cookie).toContain('path=/');
    expect(cookie).toContain('secure');
    expect(cookie).toContain('httponly');
    
    const expiredCookie = 'test=value; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    expect(isCookieExpired(expiredCookie)).toBe(true);
  });

  test('should handle HTML operations', () => {
    const escapeHTML = (text) => {
      const escapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;'
      };
      
      return text.replace(/[&<>"'/]/g, char => escapeMap[char]);
    };
    
    const unescapeHTML = (html) => {
      const unescapeMap = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#x27;': "'",
        '&#x2F;': '/'
      };
      
      return html.replace(/&(amp|lt|gt|quot|#x27|#x2F);/g, entity => unescapeMap[entity]);
    };
    
    const stripHTML = (html) => {
      return html.replace(/<[^>]*>/g, '');
    };
    
    const extractLinks = (html) => {
      const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
      const links = [];
      let match;
      
      while ((match = linkRegex.exec(html)) !== null) {
        links.push({
          url: match[1],
          text: match[2]
        });
      }
      
      return links;
    };

    expect(escapeHTML('<script>alert("xss")</script>'))
      .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    
    expect(unescapeHTML('&lt;div&gt;Hello&lt;&#x2F;div&gt;'))
      .toBe('<div>Hello</div>');
    
    expect(stripHTML('<p>Hello <strong>world</strong></p>'))
      .toBe('Hello world');
    
    const html = '<a href="https://example.com">Example</a> and <a href="/local">Local</a>';
    const links = extractLinks(html);
    expect(links).toHaveLength(2);
    expect(links[0]).toEqual({ url: 'https://example.com', text: 'Example' });
  });

  test('should handle form data operations', () => {
    const serializeForm = (formData) => {
      const params = new URLSearchParams();
      
      Object.entries(formData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.set(key, value);
        }
      });
      
      return params.toString();
    };
    
    const deserializeForm = (serialized) => {
      const params = new URLSearchParams(serialized);
      const formData = {};
      
      for (const [key, value] of params) {
        if (formData[key]) {
          if (Array.isArray(formData[key])) {
            formData[key].push(value);
          } else {
            formData[key] = [formData[key], value];
          }
        } else {
          formData[key] = value;
        }
      }
      
      return formData;
    };
    
    const validateFormData = (data, rules) => {
      const errors = {};
      
      Object.entries(rules).forEach(([field, rule]) => {
        const value = data[field];
        
        if (rule.required && (!value || value.toString().trim() === '')) {
          errors[field] = 'This field is required';
        } else if (value && rule.minLength && value.length < rule.minLength) {
          errors[field] = `Minimum length is ${rule.minLength}`;
        } else if (value && rule.maxLength && value.length > rule.maxLength) {
          errors[field] = `Maximum length is ${rule.maxLength}`;
        } else if (value && rule.pattern && !rule.pattern.test(value)) {
          errors[field] = 'Invalid format';
        }
      });
      
      return { valid: Object.keys(errors).length === 0, errors };
    };

    const formData = { name: 'John', tags: ['js', 'web'], age: '30' };
    const serialized = serializeForm(formData);
    expect(serialized).toContain('name=John');
    expect(serialized).toContain('tags=js');
    expect(serialized).toContain('tags=web');
    
    const deserialized = deserializeForm('name=John&tags=js&tags=web&age=30');
    expect(deserialized.name).toBe('John');
    expect(deserialized.tags).toEqual(['js', 'web']);
    
    const validation = validateFormData(
      { name: 'Jo', email: 'invalid' },
      {
        name: { required: true, minLength: 3 },
        email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
      }
    );
    
    expect(validation.valid).toBe(false);
    expect(validation.errors.name).toContain('Minimum length');
    expect(validation.errors.email).toContain('Invalid format');
  });

  test('should handle HTTP status operations', () => {
    const getStatusText = (code) => {
      const statusTexts = {
        200: 'OK',
        201: 'Created',
        204: 'No Content',
        400: 'Bad Request',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Not Found',
        500: 'Internal Server Error',
        502: 'Bad Gateway',
        503: 'Service Unavailable'
      };
      
      return statusTexts[code] || 'Unknown Status';
    };
    
    const isSuccessStatus = (code) => code >= 200 && code < 300;
    const isRedirectStatus = (code) => code >= 300 && code < 400;
    const isClientErrorStatus = (code) => code >= 400 && code < 500;
    const isServerErrorStatus = (code) => code >= 500 && code < 600;
    
    const categorizeStatus = (code) => {
      if (isSuccessStatus(code)) return 'success';
      if (isRedirectStatus(code)) return 'redirect';
      if (isClientErrorStatus(code)) return 'client_error';
      if (isServerErrorStatus(code)) return 'server_error';
      return 'unknown';
    };
    
    const shouldRetry = (code) => {
      const retryableCodes = [408, 429, 500, 502, 503, 504];
      return retryableCodes.includes(code);
    };

    expect(getStatusText(200)).toBe('OK');
    expect(getStatusText(404)).toBe('Not Found');
    expect(getStatusText(999)).toBe('Unknown Status');
    
    expect(isSuccessStatus(200)).toBe(true);
    expect(isSuccessStatus(404)).toBe(false);
    
    expect(categorizeStatus(200)).toBe('success');
    expect(categorizeStatus(404)).toBe('client_error');
    expect(categorizeStatus(500)).toBe('server_error');
    
    expect(shouldRetry(503)).toBe(true);
    expect(shouldRetry(404)).toBe(false);
  });

  test('should handle MIME type operations', () => {
    const getMimeType = (filename) => {
      const extension = filename.split('.').pop().toLowerCase();
      
      const mimeTypes = {
        'html': 'text/html',
        'css': 'text/css',
        'js': 'application/javascript',
        'json': 'application/json',
        'xml': 'application/xml',
        'txt': 'text/plain',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'svg': 'image/svg+xml',
        'pdf': 'application/pdf',
        'zip': 'application/zip',
        'mp4': 'video/mp4',
        'mp3': 'audio/mpeg'
      };
      
      return mimeTypes[extension] || 'application/octet-stream';
    };
    
    const isTextMimeType = (mimeType) => {
      return mimeType.startsWith('text/') || 
             ['application/javascript', 'application/json', 'application/xml'].includes(mimeType);
    };
    
    const isImageMimeType = (mimeType) => {
      return mimeType.startsWith('image/');
    };
    
    const getFileCategory = (mimeType) => {
      if (mimeType.startsWith('text/') || mimeType.includes('javascript') || mimeType.includes('json')) {
        return 'text';
      } else if (mimeType.startsWith('image/')) {
        return 'image';
      } else if (mimeType.startsWith('video/')) {
        return 'video';
      } else if (mimeType.startsWith('audio/')) {
        return 'audio';
      } else {
        return 'binary';
      }
    };

    expect(getMimeType('index.html')).toBe('text/html');
    expect(getMimeType('script.js')).toBe('application/javascript');
    expect(getMimeType('image.png')).toBe('image/png');
    expect(getMimeType('unknown.xyz')).toBe('application/octet-stream');
    
    expect(isTextMimeType('text/html')).toBe(true);
    expect(isTextMimeType('application/json')).toBe(true);
    expect(isTextMimeType('image/png')).toBe(false);
    
    expect(isImageMimeType('image/jpeg')).toBe(true);
    expect(isImageMimeType('text/html')).toBe(false);
    
    expect(getFileCategory('text/html')).toBe('text');
    expect(getFileCategory('image/png')).toBe('image');
    expect(getFileCategory('application/pdf')).toBe('binary');
  });
});
