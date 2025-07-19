const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Verify JWT token
exports.verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(403).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Check if user is admin
exports.isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Failed to verify admin status' });
  }
};

// Check if user is authenticated
exports.isAuthenticated = [this.verifyToken];

// Check if user is admin (combines both auth and admin check)
exports.isAdminAuth = [this.verifyToken, this.isAdmin];
