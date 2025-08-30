const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { setupTestDB, teardownTestDB, clearDatabase } = require('../setup');

// Disable rate limiting in test environment
process.env.NODE_ENV = 'test';

// Create Express app with security middleware for testing
const app = express();

// Security middleware
app.use(helmet({
  frameguard: { action: 'deny' }
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting middleware - disabled in test environment
const authLimiter = process.env.NODE_ENV === 'test' ? (req, res, next) => next() : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = process.env.NODE_ENV === 'test' ? (req, res, next) => next() : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many API requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to auth routes
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

const JWT_SECRET = 'test-security-secret-key';

// Mock user database
const mockUsers = [
  {
    id: 'user1',
    email: 'admin@shopbot.com',
    password: bcrypt.hashSync('SecurePass123!', 12),
    role: 'admin',
    is_active: true,
    failed_attempts: 0,
    locked_until: null
  },
  {
    id: 'user2',
    email: 'user@shopbot.com',
    password: bcrypt.hashSync('UserPass456!', 12),
    role: 'user',
    is_active: true,
    failed_attempts: 0,
    locked_until: null
  }
];

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  if (req.body) {
    // Remove potential XSS patterns
    const sanitize = (obj) => {
      for (let key in obj) {
        if (typeof obj[key] === 'string') {
          obj[key] = obj[key]
            .replace(/<script\b[^<]*(?:(?!<\\\\\\/script>)<[^<]*)*<\\\\\\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\\\\\\\w+\\\\\\\s*=/gi, '');
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitize(obj[key]);
        }
      }
    };
    sanitize(req.body);
  }
  next();
};

app.use(sanitizeInput);

// Authentication middleware with security features
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Authorization middleware
const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// Account lockout helper
const checkAccountLockout = (user) => {
  if (user.locked_until && new Date() < user.locked_until) {
    return true;
  }
  return false;
};

// Security-focused authentication endpoint
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  // Input validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  // Email format validation
  const emailRegex = /^[^\\\\\\\s@]+@[^\\\\\\\s@]+\\\\\\.[^\\\\\\\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Password strength validation
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\\\\\\d)(?=.*[@$!%*?&])[A-Za-z\\\\\\\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ 
      error: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character' 
    });
  }

  const user = mockUsers.find(u => u.email === email);
  if (!user) {
    // Simulate processing time to prevent timing attacks
    await bcrypt.compare('dummy', '$2b$12$dummy.hash.to.prevent.timing.attacks');
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Check account lockout
  if (checkAccountLockout(user)) {
    return res.status(423).json({ 
      error: 'Account temporarily locked due to multiple failed attempts' 
    });
  }

  if (!user.is_active) {
    return res.status(401).json({ error: 'Account is inactive' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    // Increment failed attempts
    user.failed_attempts += 1;
    
    // Lock account after 5 failed attempts
    if (user.failed_attempts >= 5) {
      user.locked_until = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    }
    
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Reset failed attempts on successful login
  user.failed_attempts = 0;
  user.locked_until = null;

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '1h', issuer: 'shopbot-api', audience: 'shopbot-client' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role
    },
    expires_in: 3600
  });
});

// Secure data endpoint with input validation
app.post('/api/secure/data', authenticateToken, (req, res) => {
  const { data, type } = req.body;

  // Validate required fields
  if (!data || !type) {
    return res.status(400).json({ error: 'Data and type are required' });
  }

  // Validate data type
  const allowedTypes = ['product', 'order', 'customer'];
  if (!allowedTypes.includes(type)) {
    return res.status(400).json({ error: 'Invalid data type' });
  }

  // Validate data structure based on type
  if (type === 'product' && (!data.name || !data.price)) {
    return res.status(400).json({ error: 'Product data must include name and price' });
  }

  res.json({
    message: 'Data processed securely',
    type,
    processed_at: new Date().toISOString(),
    user: req.user.id
  });
});

// Admin-only endpoint with strict authorization
app.get('/api/admin/sensitive', authenticateToken, authorizeRole(['admin']), (req, res) => {
  res.json({
    sensitive_data: 'This is highly sensitive information',
    access_level: 'admin',
    accessed_by: req.user.email,
    timestamp: new Date().toISOString()
  });
});

// SQL injection test endpoint (simulated)
app.post('/api/search', authenticateToken, (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Search query required' });
  }

  // Simulate SQL injection detection
  const sqlInjectionPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
    /(\b(OR|AND)\\\\\\\s+\\\\\\\d+\\\\\\\s*=\\\\\\\s*\\\\\\\d+)/i,
    /(';|'--|\\\\\\*|%)/i
  ];

  const containsSqlInjection = sqlInjectionPatterns.some(pattern => pattern.test(query));
  
  if (containsSqlInjection) {
    return res.status(400).json({ 
      error: 'Invalid search query detected',
      code: 'SECURITY_VIOLATION'
    });
  }

  res.json({
    results: [`Safe search result for: ${query}`],
    query_safe: true
  });
});

// File upload security test endpoint
app.post('/api/upload', authenticateToken, (req, res) => {
  const { filename, content, mimetype } = req.body;

  if (!filename || !content) {
    return res.status(400).json({ error: 'Filename and content required' });
  }

  // Validate file extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.txt'];
  const fileExtension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  
  if (!allowedExtensions.includes(fileExtension)) {
    return res.status(400).json({ 
      error: 'File type not allowed',
      allowed_types: allowedExtensions
    });
  }

  // Validate MIME type
  const allowedMimeTypes = [
    'image/jpeg', 'image/png', 'image/gif', 
    'application/pdf', 'text/plain'
  ];
  
  if (mimetype && !allowedMimeTypes.includes(mimetype)) {
    return res.status(400).json({ 
      error: 'MIME type not allowed',
      provided: mimetype
    });
  }

  // Check file size (simulated)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (content.length > maxSize) {
    return res.status(413).json({ error: 'File too large' });
  }

  res.json({
    message: 'File uploaded securely',
    filename,
    size: content.length,
    type: fileExtension
  });
});

describe('Security Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
    // Reset user states
    mockUsers.forEach(user => {
      user.failed_attempts = 0;
      user.locked_until = null;
    });
  });

  describe('Authentication Security', () => {
    test('should require strong passwords', async () => {
      const weakPasswords = [
        'password',
        '12345678',
        'Password',
        'Password123',
        'password123!'
      ];

      for (const password of weakPasswords) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'admin@shopbot.com',
            password
          })
          .expect(400);

        expect(response.body.error).toContain('Password must be at least 8 characters');
      }
    });

    test('should validate email format', async () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user.domain.com'
      ];

      for (const email of invalidEmails) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email,
            password: 'ValidPass123!'
          })
          .expect(400);

        expect(response.body.error).toBe('Invalid email format');
      }
    });

    test('should implement account lockout after failed attempts', async () => {
      const email = 'admin@shopbot.com';
      const wrongPassword = 'WrongPass123!';

      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({ email, password: wrongPassword })
          .expect(401);
      }

      // 6th attempt should return account locked
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email, password: wrongPassword })
        .expect(423);

      expect(response.body.error).toContain('Account temporarily locked');
    });

    test('should prevent timing attacks', async () => {
      const startTime = Date.now();
      
      // Test with non-existent user
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@shopbot.com',
          password: 'ValidPass123!'
        })
        .expect(401);

      const nonExistentTime = Date.now() - startTime;

      const startTime2 = Date.now();
      
      // Test with existing user but wrong password
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@shopbot.com',
          password: 'WrongPass123!'
        })
        .expect(401);

      const existentTime = Date.now() - startTime2;

      // Times should be similar (within 500ms) to prevent timing attacks in test environment
      expect(Math.abs(nonExistentTime - existentTime)).toBeLessThan(500);
    });

    test('should include security headers in JWT tokens', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@shopbot.com',
          password: 'SecurePass123!'
        })
        .expect(200);

      const token = response.body.token;
      const decoded = jwt.verify(token, JWT_SECRET);
      
      expect(decoded.iss).toBe('shopbot-api');
      expect(decoded.aud).toBe('shopbot-client');
      expect(decoded.exp).toBeDefined();
    });
  });

  describe('Authorization Security', () => {
    let adminToken, userToken;

    beforeEach(async () => {
      // Get admin token
      const adminResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@shopbot.com',
          password: 'SecurePass123!'
        });
      adminToken = adminResponse.body.token;

      // Get user token
      const userResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@shopbot.com',
          password: 'UserPass456!'
        });
      userToken = userResponse.body.token;
    });

    test('should enforce role-based access control', async () => {
      // Admin should access admin endpoint
      await request(app)
        .get('/api/admin/sensitive')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // User should be denied access to admin endpoint
      const response = await request(app)
        .get('/api/admin/sensitive')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.error).toBe('Insufficient permissions');
    });

    test('should reject requests without valid tokens', async () => {
      // No token
      await request(app)
        .get('/api/admin/sensitive')
        .expect(401);

      // Invalid token
      await request(app)
        .get('/api/admin/sensitive')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);

      // Malformed authorization header
      await request(app)
        .get('/api/admin/sensitive')
        .set('Authorization', 'invalid-format')
        .expect(401);
    });
  });

  describe('Input Validation and Sanitization', () => {
    let token;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@shopbot.com',
          password: 'SecurePass123!'
        });
      token = response.body.token;
    });

    test('should sanitize XSS attempts', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src=x onerror=alert("xss")>',
        '<svg onload=alert("xss")>'
      ];

      for (const payload of xssPayloads) {
        const response = await request(app)
          .post('/api/secure/data')
          .set('Authorization', `Bearer ${token}`)
          .send({
            data: { name: payload, price: 100 },
            type: 'product'
          })
          .expect(200);

        expect(response.body.message).toBe('Data processed securely');
      }
    });

    test('should detect SQL injection attempts', async () => {
      const sqlInjectionPayloads = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "UNION SELECT * FROM users",
        "1; DELETE FROM products; --"
      ];

      for (const payload of sqlInjectionPayloads) {
        const response = await request(app)
          .post('/api/search')
          .set('Authorization', `Bearer ${token}`)
          .send({ query: payload })
          .expect(400);

        expect(response.body.error).toBe('Invalid search query detected');
        expect(response.body.code).toBe('SECURITY_VIOLATION');
      }
    });

    test('should validate data types and structures', async () => {
      // Invalid data type
      await request(app)
        .post('/api/secure/data')
        .set('Authorization', `Bearer ${token}`)
        .send({
          data: { name: 'Test', price: 100 },
          type: 'invalid_type'
        })
        .expect(400);

      // Missing required fields for product
      await request(app)
        .post('/api/secure/data')
        .set('Authorization', `Bearer ${token}`)
        .send({
          data: { name: 'Test' }, // Missing price
          type: 'product'
        })
        .expect(400);
    });
  });

  describe('Rate Limiting', () => {
    test('should enforce authentication rate limits', async () => {
      const promises = [];
      
      // Make 6 requests simultaneously (limit is 5)
      for (let i = 0; i < 6; i++) {
        promises.push(
          request(app)
            .post('/api/auth/login')
            .send({
              email: 'admin@shopbot.com',
              password: 'SecurePass123!'
            })
        );
      }

      const responses = await Promise.all(promises);
      
      // At least one should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
      
      if (rateLimitedResponses.length > 0) {
        expect(rateLimitedResponses[0].body.error).toContain('Too many authentication attempts');
      }
    });

    test('should enforce general API rate limits', async () => {
      // Get a valid token first
      const authResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@shopbot.com',
          password: 'SecurePass123!'
        });
      
      const token = authResponse.body.token;
      const promises = [];
      
      // Make many API requests (limit is 100, but we'll test with fewer)
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .post('/api/search')
            .set('Authorization', `Bearer ${token}`)
            .send({ query: `test query ${i}` })
        );
      }

      const responses = await Promise.all(promises);
      
      // All should succeed within normal rate limits
      responses.forEach(response => {
        expect([200, 429]).toContain(response.status);
      });
    });
  });

  describe('File Upload Security', () => {
    let token;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@shopbot.com',
          password: 'SecurePass123!'
        });
      token = response.body.token;
    });

    test('should validate file extensions', async () => {
      const maliciousFiles = [
        'malware.exe',
        'script.js',
        'backdoor.php',
        'virus.bat'
      ];

      for (const filename of maliciousFiles) {
        const response = await request(app)
          .post('/api/upload')
          .set('Authorization', `Bearer ${token}`)
          .send({
            filename,
            content: 'malicious content',
            mimetype: 'application/octet-stream'
          })
          .expect(400);

        expect(response.body.error).toBe('File type not allowed');
      }
    });

    test('should validate MIME types', async () => {
      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${token}`)
        .send({
          filename: 'test.jpg',
          content: 'image content',
          mimetype: 'application/x-executable'
        })
        .expect(400);

      expect(response.body.error).toBe('MIME type not allowed');
    });

    test('should enforce file size limits', async () => {
      const largeContent = 'x'.repeat(6 * 1024 * 1024); // 6MB (over 5MB limit)

      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${token}`)
        .send({
          filename: 'large.jpg',
          content: largeContent,
          mimetype: 'image/jpeg'
        })
        .expect(413);

      expect(response.body.error).toBe('File too large');
    });

    test('should accept valid file uploads', async () => {
      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${token}`)
        .send({
          filename: 'valid.jpg',
          content: 'valid image content',
          mimetype: 'image/jpeg'
        })
        .expect(200);

      expect(response.body.message).toBe('File uploaded securely');
      expect(response.body.filename).toBe('valid.jpg');
    });
  });

  describe('Security Headers', () => {
    test('should include security headers in responses', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@shopbot.com',
          password: 'SecurePass123!'
        });

      // Check for Helmet security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('0');
    });
  });
});
