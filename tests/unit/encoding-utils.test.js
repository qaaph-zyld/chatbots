/**
 * Encoding Utilities Unit Tests
 */

describe('Encoding Utilities', () => {
  test('should handle base64 encoding and decoding', () => {
    const base64Utils = {
      encode: (str) => {
        return btoa(unescape(encodeURIComponent(str)));
      },
      
      decode: (base64) => {
        return decodeURIComponent(escape(atob(base64)));
      },
      
      encodeBytes: (bytes) => {
        const chars = [];
        for (let i = 0; i < bytes.length; i++) {
          chars.push(String.fromCharCode(bytes[i]));
        }
        return btoa(chars.join(''));
      },
      
      decodeBytes: (base64) => {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
      }
    };

    const text = 'Hello, World! 🌍';
    const encoded = base64Utils.encode(text);
    const decoded = base64Utils.decode(encoded);
    
    expect(decoded).toBe(text);
    expect(encoded).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);
    
    const bytes = new Uint8Array([72, 101, 108, 108, 111]);
    const encodedBytes = base64Utils.encodeBytes(bytes);
    const decodedBytes = base64Utils.decodeBytes(encodedBytes);
    
    expect(Array.from(decodedBytes)).toEqual([72, 101, 108, 108, 111]);
  });

  test('should handle URL encoding and decoding', () => {
    const urlUtils = {
      encode: (str) => {
        return encodeURIComponent(str);
      },
      
      decode: (encoded) => {
        return decodeURIComponent(encoded);
      },
      
      encodeQuery: (params) => {
        return Object.entries(params)
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
          .join('&');
      },
      
      decodeQuery: (queryString) => {
        const params = {};
        const pairs = queryString.replace(/^\?/, '').split('&');
        
        pairs.forEach(pair => {
          const [key, value] = pair.split('=');
          if (key) {
            params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
          }
        });
        
        return params;
      }
    };

    const text = 'Hello World & Special Characters: @#$%^&*()';
    const encoded = urlUtils.encode(text);
    const decoded = urlUtils.decode(encoded);
    
    expect(decoded).toBe(text);
    expect(encoded).toContain('%20'); // Space encoded
    expect(encoded).toContain('%26'); // & encoded
    
    const params = { name: 'John Doe', age: '25', city: 'New York' };
    const queryString = urlUtils.encodeQuery(params);
    const decodedParams = urlUtils.decodeQuery(queryString);
    
    expect(decodedParams).toEqual(params);
  });

  test('should handle hex encoding and decoding', () => {
    const hexUtils = {
      encode: (str) => {
        return Array.from(new TextEncoder().encode(str))
          .map(byte => byte.toString(16).padStart(2, '0'))
          .join('');
      },
      
      decode: (hex) => {
        const bytes = [];
        for (let i = 0; i < hex.length; i += 2) {
          bytes.push(parseInt(hex.substr(i, 2), 16));
        }
        return new TextDecoder().decode(new Uint8Array(bytes));
      },
      
      encodeBytes: (bytes) => {
        return Array.from(bytes)
          .map(byte => byte.toString(16).padStart(2, '0'))
          .join('');
      },
      
      decodeBytes: (hex) => {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
          bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        return bytes;
      }
    };

    const text = 'Hello';
    const encoded = hexUtils.encode(text);
    const decoded = hexUtils.decode(encoded);
    
    expect(decoded).toBe(text);
    expect(encoded).toBe('48656c6c6f');
    
    const bytes = new Uint8Array([255, 128, 0]);
    const encodedBytes = hexUtils.encodeBytes(bytes);
    const decodedBytes = hexUtils.decodeBytes(encodedBytes);
    
    expect(encodedBytes).toBe('ff8000');
    expect(Array.from(decodedBytes)).toEqual([255, 128, 0]);
  });

  test('should handle binary encoding and decoding', () => {
    const binaryUtils = {
      encode: (str) => {
        return Array.from(new TextEncoder().encode(str))
          .map(byte => byte.toString(2).padStart(8, '0'))
          .join('');
      },
      
      decode: (binary) => {
        const bytes = [];
        for (let i = 0; i < binary.length; i += 8) {
          bytes.push(parseInt(binary.substr(i, 8), 2));
        }
        return new TextDecoder().decode(new Uint8Array(bytes));
      },
      
      encodeNumber: (num) => {
        return num.toString(2);
      },
      
      decodeNumber: (binary) => {
        return parseInt(binary, 2);
      }
    };

    const text = 'Hi';
    const encoded = binaryUtils.encode(text);
    const decoded = binaryUtils.decode(encoded);
    
    expect(decoded).toBe(text);
    expect(encoded).toBe('0100100001101001'); // 'H' = 72, 'i' = 105
    
    expect(binaryUtils.encodeNumber(42)).toBe('101010');
    expect(binaryUtils.decodeNumber('101010')).toBe(42);
  });

  test('should handle custom alphabet encoding', () => {
    const createCustomEncoder = (alphabet) => {
      const base = alphabet.length;
      
      return {
        encode: (num) => {
          if (num === 0) return alphabet[0];
          
          let result = '';
          while (num > 0) {
            result = alphabet[num % base] + result;
            num = Math.floor(num / base);
          }
          return result;
        },
        
        decode: (encoded) => {
          let result = 0;
          for (let i = 0; i < encoded.length; i++) {
            const char = encoded[encoded.length - 1 - i];
            const value = alphabet.indexOf(char);
            if (value === -1) throw new Error(`Invalid character: ${char}`);
            result += value * Math.pow(base, i);
          }
          return result;
        }
      };
    };

    // Base62 encoder (0-9, A-Z, a-z)
    const base62 = createCustomEncoder('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz');
    
    expect(base62.encode(0)).toBe('0');
    expect(base62.encode(61)).toBe('z');
    expect(base62.encode(62)).toBe('10');
    expect(base62.encode(3844)).toBe('100'); // 62^2
    
    expect(base62.decode('0')).toBe(0);
    expect(base62.decode('z')).toBe(61);
    expect(base62.decode('10')).toBe(62);
    expect(base62.decode('100')).toBe(3844);
    
    // Custom alphabet
    const customEncoder = createCustomEncoder('ABCDEF');
    expect(customEncoder.encode(5)).toBe('F');
    expect(customEncoder.encode(6)).toBe('BA');
    expect(customEncoder.decode('F')).toBe(5);
    expect(customEncoder.decode('BA')).toBe(6);
  });

  test('should handle escape sequence encoding', () => {
    const escapeUtils = {
      escapeHtml: (str) => {
        const escapeMap = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '/': '&#x2F;'
        };
        
        return str.replace(/[&<>"'/]/g, (char) => escapeMap[char]);
      },
      
      unescapeHtml: (str) => {
        const unescapeMap = {
          '&amp;': '&',
          '&lt;': '<',
          '&gt;': '>',
          '&quot;': '"',
          '&#x27;': "'",
          '&#x2F;': '/'
        };
        
        return str.replace(/&(amp|lt|gt|quot|#x27|#x2F);/g, (match) => unescapeMap[match]);
      },
      
      escapeJson: (str) => {
        const escapeMap = {
          '"': '\\"',
          '\\': '\\\\',
          '\b': '\\b',
          '\f': '\\f',
          '\n': '\\n',
          '\r': '\\r',
          '\t': '\\t'
        };
        
        return str.replace(/["\\\/\b\f\n\r\t]/g, (char) => escapeMap[char] || char);
      },
      
      escapeCsv: (str) => {
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }
    };

    const htmlText = '<script>alert("XSS")</script>';
    const escapedHtml = escapeUtils.escapeHtml(htmlText);
    const unescapedHtml = escapeUtils.unescapeHtml(escapedHtml);
    
    expect(escapedHtml).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
    expect(unescapedHtml).toBe(htmlText);
    
    const jsonText = 'Line 1\nLine 2\t"Quote"';
    const escapedJson = escapeUtils.escapeJson(jsonText);
    expect(escapedJson).toBe('Line 1\\nLine 2\\t\\"Quote\\"');
    
    const csvText = 'Value with, comma and "quotes"';
    const escapedCsv = escapeUtils.escapeCsv(csvText);
    expect(escapedCsv).toBe('"Value with, comma and ""quotes"""');
  });
});
