const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { setupTestDB, teardownTestDB, clearDatabase } = require('../setup');

// Mock User model for authentication testing
const mockUsers = [
  {
    id: 'user1',
    email: 'admin@shopbot.com',
    password: bcrypt.hashSync('admin123', 10),
    role: 'admin',
    is_active: true
  },
  {
    id: 'user2',
    email: 'user@shopbot.com',
    password: bcrypt.hashSync('user123', 10),
    role: 'user',
    is_active: true
  },
  {
    id: 'user3',
    email: 'inactive@shopbot.com',
    password: bcrypt.hashSync('inactive123', 10),
    role: 'user',
    is_active: false
  }
];

// Create Express app for auth testing
const app = express();
app.use(express.json());

const JWT_SECRET = 'test-secret-key';

// Helper function to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Authentication middleware
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

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const user = mockUsers.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (!user.is_active) {
    return res.status(401).json({ error: 'Account is inactive' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = generateToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role
    }
  });
});

app.post('/api/auth/refresh', authenticateToken, (req, res) => {
  const newToken = generateToken(req.user);
  res.json({ token: newToken });
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
  // In a real app, you'd blacklist the token
  res.json({ message: 'Logged out successfully' });
});

// Protected routes
app.get('/api/profile', authenticateToken, (req, res) => {
  res.json({
    user: req.user,
    message: 'Profile accessed successfully'
  });
});

app.get('/api/admin/users', authenticateToken, authorizeRole(['admin']), (req, res) => {
  res.json({
    users: mockUsers.map(u => ({
      id: u.id,
      email: u.email,
      role: u.role,
      is_active: u.is_active
    }))
  });
});

app.post('/api/admin/users', authenticateToken, authorizeRole(['admin']), (req, res) => {
  const { email, password, role } = req.body;
  
  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Email, password, and role required' });
  }

  res.status(201).json({
    id: 'new-user-id',
    email,
    role,
    is_active: true,
    created_at: new Date().toISOString()
  });
});

describe('Authentication and Authorization Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('Authentication', () => {
    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@shopbot.com',
          password: 'admin123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('admin@shopbot.com');
      expect(response.body.user.role).toBe('admin');
    });

    test('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@shopbot.com',
          password: 'admin123'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    test('should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@shopbot.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    test('should reject inactive user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'inactive@shopbot.com',
          password: 'inactive123'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Account is inactive');
    });

    test('should require email and password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Email and password required');
    });

    test('should refresh token for authenticated user', async () => {
      const user = mockUsers[0];
      const token = generateToken(user);

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.token).not.toBe(token); // Should be a new token
    });

    test('should logout authenticated user', async () => {
      const user = mockUsers[0];
      const token = generateToken(user);

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Logged out successfully');
    });
  });

  describe('Authorization', () => {
    test('should access profile with valid token', async () => {
      const user = mockUsers[0];
      const token = generateToken(user);

      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(user.email);
    });

    test('should reject access without token', async () => {
      const response = await request(app)
        .get('/api/profile')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });

    test('should reject access with invalid token', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Invalid or expired token');
    });

    test('should allow admin access to admin routes', async () => {
      const adminUser = mockUsers.find(u => u.role === 'admin');
      const token = generateToken(adminUser);

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBe(true);
    });

    test('should deny user access to admin routes', async () => {
      const regularUser = mockUsers.find(u => u.role === 'user');
      const token = generateToken(regularUser);

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Insufficient permissions');
    });

    test('should allow admin to create users', async () => {
      const adminUser = mockUsers.find(u => u.role === 'admin');
      const token = generateToken(adminUser);

      const newUser = {
        email: 'newuser@shopbot.com',
        password: 'newuser123',
        role: 'user'
      };

      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${token}`)
        .send(newUser)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(newUser.email);
      expect(response.body.role).toBe(newUser.role);
    });

    test('should validate required fields for user creation', async () => {
      const adminUser = mockUsers.find(u => u.role === 'admin');
      const token = generateToken(adminUser);

      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'incomplete@shopbot.com' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Email, password, and role required');
    });
  });

  describe('Token Management', () => {
    test('should generate valid JWT tokens', () => {
      const user = mockUsers[0];
      const token = generateToken(user);
      
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
      
      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded.id).toBe(user.id);
      expect(decoded.email).toBe(user.email);
      expect(decoded.role).toBe(user.role);
    });

    test('should handle expired tokens', (done) => {
      const user = mockUsers[0];
      const expiredToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '1ms' } // Expires immediately
      );

      setTimeout(() => {
        request(app)
          .get('/api/profile')
          .set('Authorization', `Bearer ${expiredToken}`)
          .expect(403)
          .end((err, res) => {
            if (err) return done(err);
            expect(res.body).toHaveProperty('error', 'Invalid or expired token');
            done();
          });
      }, 10); // Wait 10ms to ensure token expires
    });

    test('should handle malformed tokens', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', 'Bearer malformed.token.here')
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Invalid or expired token');
    });
  });
});
