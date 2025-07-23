const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { isAdmin } = require('../middleware/auth');

// Apply admin middleware to all routes
router.use(isAdmin);

// Dashboard routes
router.get('/dashboard', AdminController.getDashboardStats);

// User management
router.get('/users', AdminController.getUsers);
router.get('/users/:id', AdminController.getUser);
router.put('/users/:id', AdminController.updateUser);
router.delete('/users/:id', AdminController.deleteUser);

// Conversation monitoring
router.get('/conversations', AdminController.getConversations);
router.get('/conversations/:id', AdminController.getConversation);

// Analytics
router.get('/analytics/usage', AdminController.getUsageAnalytics);
router.get('/analytics/performance', AdminController.getPerformanceMetrics);

module.exports = router;
