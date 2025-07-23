const User = require('../models/User');
const Conversation = require('../models/Conversation');

class AdminController {
  // Dashboard statistics
  static async getDashboardStats(req, res) {
    try {
      const [totalUsers, activeUsers, totalConversations, recentConversations] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isActive: true }),
        Conversation.countDocuments(),
        Conversation.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('userId', 'email')
      ]);

      res.json({
        stats: {
          totalUsers,
          activeUsers,
          totalConversations,
          activeConversations: 0, // Will be implemented with real-time tracking
          avgResponseTime: 0 // Will be implemented with analytics
        },
        recentActivity: recentConversations
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
  }

  // User management
  static async getUsers(req, res) {
    try {
      const users = await User.find({}, '-password');
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  static async getUser(req, res) {
    try {
      const user = await User.findById(req.params.id, '-password');
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  }

  static async updateUser(req, res) {
    try {
      const { role, isActive } = req.body;
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { role, isActive },
        { new: true, select: '-password' }
      );
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update user' });
    }
  }

  static async deleteUser(req, res) {
    try {
      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }

  // Conversation monitoring
  static async getConversations(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const conversations = await Conversation.find()
        .sort({ updatedAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('userId', 'email');
      
      res.json({
        conversations,
        totalPages: Math.ceil(await Conversation.countDocuments() / limit),
        currentPage: page
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch conversations' });
    }
  }

  static async getConversation(req, res) {
    try {
      const conversation = await Conversation.findById(req.params.id)
        .populate('userId', 'email')
        .populate('messages');
      if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
      res.json(conversation);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch conversation' });
    }
  }

  // Analytics
  static async getUsageAnalytics(req, res) {
    try {
      // Will be implemented with actual analytics
      res.json({
        dailyActiveUsers: 0,
        messagesPerDay: 0,
        userRetention: 0
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch usage analytics' });
    }
  }

  static async getPerformanceMetrics(req, res) {
    try {
      // Will be implemented with actual metrics
      res.json({
        avgResponseTime: 0,
        successRate: 0,
        errorRate: 0
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch performance metrics' });
    }
  }
}

module.exports = AdminController;
