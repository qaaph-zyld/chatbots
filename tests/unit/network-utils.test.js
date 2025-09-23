/**
 * Network Utilities Unit Tests
 */

describe('Network Utilities', () => {
  test('should handle IP address validation', () => {
    const isValidIPv4 = (ip) => {
      const parts = ip.split('.');
      if (parts.length !== 4) return false;
      return parts.every(part => {
        const num = parseInt(part, 10);
        return num >= 0 && num <= 255 && part === num.toString();
      });
    };

    expect(isValidIPv4('192.168.1.1')).toBe(true);
    expect(isValidIPv4('255.255.255.255')).toBe(true);
    expect(isValidIPv4('256.1.1.1')).toBe(false);
    expect(isValidIPv4('192.168.1')).toBe(false);
  });

  test('should handle URL parsing', () => {
    const parseURL = (urlString) => {
      try {
        const url = new URL(urlString);
        return {
          protocol: url.protocol,
          hostname: url.hostname,
          port: url.port,
          pathname: url.pathname,
          search: url.search,
          hash: url.hash
        };
      } catch {
        return null;
      }
    };

    const parsed = parseURL('https://example.com:8080/path?query=value#section');
    expect(parsed.protocol).toBe('https:');
    expect(parsed.hostname).toBe('example.com');
    expect(parsed.port).toBe('8080');
    expect(parsed.pathname).toBe('/path');
  });

  test('should handle query string operations', () => {
    const parseQuery = (queryString) => {
      const params = new URLSearchParams(queryString);
      const result = {};
      for (const [key, value] of params) {
        result[key] = value;
      }
      return result;
    };

    const buildQuery = (params) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        searchParams.set(key, value);
      });
      return searchParams.toString();
    };

    const parsed = parseQuery('name=test&age=25&active=true');
    expect(parsed).toEqual({ name: 'test', age: '25', active: 'true' });

    const built = buildQuery({ name: 'test', age: 25 });
    expect(built).toBe('name=test&age=25');
  });

  test('should handle HTTP status code classification', () => {
    const classifyStatus = (code) => {
      if (code >= 200 && code < 300) return 'success';
      if (code >= 300 && code < 400) return 'redirect';
      if (code >= 400 && code < 500) return 'client_error';
      if (code >= 500 && code < 600) return 'server_error';
      return 'unknown';
    };

    expect(classifyStatus(200)).toBe('success');
    expect(classifyStatus(301)).toBe('redirect');
    expect(classifyStatus(404)).toBe('client_error');
    expect(classifyStatus(500)).toBe('server_error');
  });

  test('should handle MIME type detection', () => {
    const getMimeType = (filename) => {
      const ext = filename.split('.').pop().toLowerCase();
      const mimeTypes = {
        'txt': 'text/plain',
        'html': 'text/html',
        'css': 'text/css',
        'js': 'application/javascript',
        'json': 'application/json',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'pdf': 'application/pdf'
      };
      return mimeTypes[ext] || 'application/octet-stream';
    };

    expect(getMimeType('document.pdf')).toBe('application/pdf');
    expect(getMimeType('image.png')).toBe('image/png');
    expect(getMimeType('script.js')).toBe('application/javascript');
    expect(getMimeType('unknown.xyz')).toBe('application/octet-stream');
  });
});
