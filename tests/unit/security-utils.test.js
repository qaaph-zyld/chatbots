/**
 * Security Utilities Unit Tests
 */

describe('Security Utilities', () => {
  test('should handle input sanitization', () => {
    const sanitizeInput = (input) => {
      if (typeof input !== 'string') return '';
      return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                  .replace(/[<>]/g, '');
    };

    expect(sanitizeInput('<script>alert("xss")</script>hello')).toBe('hello');
    expect(sanitizeInput('normal text')).toBe('normal text');
    expect(sanitizeInput('<div>content</div>')).toBe('divcontent/div');
  });

  test('should handle password validation', () => {
    const validatePassword = (password) => {
      const minLength = password.length >= 8;
      const hasUpper = /[A-Z]/.test(password);
      const hasLower = /[a-z]/.test(password);
      const hasNumber = /\d/.test(password);
      const hasSpecial = /[!@#$%^&*]/.test(password);
      
      return {
        valid: minLength && hasUpper && hasLower && hasNumber,
        checks: { minLength, hasUpper, hasLower, hasNumber, hasSpecial }
      };
    };

    const weak = validatePassword('weak');
    expect(weak.valid).toBe(false);
    expect(weak.checks.minLength).toBe(false);

    const strong = validatePassword('Strong123!');
    expect(strong.valid).toBe(true);
    expect(strong.checks.hasSpecial).toBe(true);
  });

  test('should handle token generation', () => {
    const generateToken = (length = 32) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    const token1 = generateToken();
    const token2 = generateToken();
    
    expect(token1.length).toBe(32);
    expect(token2.length).toBe(32);
    expect(token1).not.toBe(token2);
  });

  test('should handle rate limiting simulation', () => {
    const rateLimiter = {
      requests: new Map(),
      isAllowed: function(clientId, maxRequests = 10, windowMs = 60000) {
        const now = Date.now();
        const clientRequests = this.requests.get(clientId) || [];
        
        // Remove old requests outside the window
        const validRequests = clientRequests.filter(time => now - time < windowMs);
        
        if (validRequests.length >= maxRequests) {
          return false;
        }
        
        validRequests.push(now);
        this.requests.set(clientId, validRequests);
        return true;
      }
    };

    expect(rateLimiter.isAllowed('client1')).toBe(true);
    
    // Simulate multiple requests
    for (let i = 0; i < 9; i++) {
      rateLimiter.isAllowed('client1');
    }
    
    expect(rateLimiter.isAllowed('client1')).toBe(false);
  });

  test('should handle data masking', () => {
    const maskData = {
      email: (email) => {
        const [local, domain] = email.split('@');
        return local.charAt(0) + '*'.repeat(local.length - 2) + local.slice(-1) + '@' + domain;
      },
      creditCard: (card) => {
        return '*'.repeat(card.length - 4) + card.slice(-4);
      },
      phone: (phone) => {
        return phone.replace(/\d(?=\d{4})/g, '*');
      }
    };

    expect(maskData.email('user@example.com')).toBe('u**r@example.com');
    expect(maskData.creditCard('1234567890123456')).toBe('************3456');
    expect(maskData.phone('1234567890')).toBe('******7890');
  });
});
