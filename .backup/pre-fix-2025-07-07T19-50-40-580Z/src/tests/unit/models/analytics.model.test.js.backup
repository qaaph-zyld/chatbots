/**
 * Analytics Model Tests
 */

const mongoose = require('mongoose');
require('@src/models\analytics.model');

describe('Analytics Model', () => {
  // Test data
  const validAnalyticsData = {
    chatbotId: new mongoose.Types.ObjectId(),
    period: 'daily',
    date: new Date('2025-01-01'),
    metrics: {
      conversations: {
        total: 100,
        new: 75,
        completed: 60,
        abandoned: 15
      },
      messages: {
        total: 500,
        user: 250,
        bot: 250
      },
      users: {
        total: 80,
        new: 30,
        returning: 50
      },
      engagement: {
        averageConversationLength: 5,
        averageResponseTime: 1.2,
        averageUserRating: 4.5
      },
      performance: {
        successRate: 0.85,
        handoffRate: 0.15,
        responseTimeAverage: 0.8
      }
    }
  };

  beforeEach(async () => {
    // Clear all analytics records before each test
    await Analytics.deleteMany({});
  });

  describe('Validation', () => {
    it('should validate a valid analytics record', async () => {
      // Arrange & Act
      const analytics = new Analytics(validAnalyticsData);
      const validationError = analytics.validateSync();

      // Assert
      expect(validationError).toBeUndefined();
    });

    it('should require chatbotId field', async () => {
      // Arrange
      const analyticsWithoutChatbot = { ...validAnalyticsData };
      delete analyticsWithoutChatbot.chatbotId;

      // Act
      const analytics = new Analytics(analyticsWithoutChatbot);
      const validationError = analytics.validateSync();

      // Assert
      expect(validationError).toBeDefined();
      expect(validationError.errors.chatbotId).toBeDefined();
      expect(validationError.errors.chatbotId.kind).toBe('required');
    });

    it('should require period field', async () => {
      // Arrange
      const analyticsWithoutPeriod = { ...validAnalyticsData };
      delete analyticsWithoutPeriod.period;

      // Act
      const analytics = new Analytics(analyticsWithoutPeriod);
      const validationError = analytics.validateSync();

      // Assert
      expect(validationError).toBeDefined();
      expect(validationError.errors.period).toBeDefined();
      expect(validationError.errors.period.kind).toBe('required');
    });

    it('should validate period enum values', async () => {
      // Arrange
      const analyticsWithInvalidPeriod = { 
        ...validAnalyticsData,
        period: 'invalid-period'
      };

      // Act
      const analytics = new Analytics(analyticsWithInvalidPeriod);
      const validationError = analytics.validateSync();

      // Assert
      expect(validationError).toBeDefined();
      expect(validationError.errors.period).toBeDefined();
      expect(validationError.errors.period.kind).toBe('enum');
    });

    it('should require date field', async () => {
      // Arrange
      const analyticsWithoutDate = { ...validAnalyticsData };
      delete analyticsWithoutDate.date;

      // Act
      const analytics = new Analytics(analyticsWithoutDate);
      const validationError = analytics.validateSync();

      // Assert
      expect(validationError).toBeDefined();
      expect(validationError.errors.date).toBeDefined();
      expect(validationError.errors.date.kind).toBe('required');
    });

    it('should set default values for metrics', async () => {
      // Arrange
      const minimalAnalyticsData = {
        chatbotId: new mongoose.Types.ObjectId(),
        period: 'daily',
        date: new Date()
      };

      // Act
      const analytics = new Analytics(minimalAnalyticsData);

      // Assert
      expect(analytics.metrics.conversations.total).toBe(0);
      expect(analytics.metrics.messages.total).toBe(0);
      expect(analytics.metrics.users.total).toBe(0);
    });
  });

  describe('Statics', () => {
    beforeEach(async () => {
      // Create test data for static method tests
      const chatbotId = new mongoose.Types.ObjectId();
      
      // Create analytics records with different dates
      await Analytics.create({
        chatbotId,
        period: 'daily',
        date: new Date('2025-01-01'),
        metrics: {
          conversations: { total: 100 },
          messages: { total: 500 }
        }
      });
      
      await Analytics.create({
        chatbotId,
        period: 'daily',
        date: new Date('2025-01-02'),
        metrics: {
          conversations: { total: 120 },
          messages: { total: 600 }
        }
      });
      
      await Analytics.create({
        chatbotId,
        period: 'daily',
        date: new Date('2025-01-03'),
        metrics: {
          conversations: { total: 90 },
          messages: { total: 450 }
        }
      });
      
      // Create weekly records
      await Analytics.create({
        chatbotId,
        period: 'weekly',
        date: new Date('2025-01-01'),
        metrics: {
          conversations: { total: 700 },
          messages: { total: 3500 }
        }
      });
    });

    it('should find analytics by date range', async () => {
      // Arrange
      const chatbotId = mongoose.Types.ObjectId.createFromTime(1);
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-02');

      // Act
      const results = await Analytics.findByDateRange(chatbotId, startDate, endDate);

      // Assert
      expect(results).toHaveLength(2);
      expect(results[0].date.toISOString().split('T')[0]).toBe('2025-01-01');
      expect(results[1].date.toISOString().split('T')[0]).toBe('2025-01-02');
    });

    it('should find analytics by date range and specific period', async () => {
      // Arrange
      const chatbotId = mongoose.Types.ObjectId.createFromTime(1);
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-03');
      const period = 'weekly';

      // Act
      const results = await Analytics.findByDateRange(chatbotId, startDate, endDate, period);

      // Assert
      expect(results).toHaveLength(1);
      expect(results[0].period).toBe('weekly');
    });

    it('should get latest analytics by period with limit', async () => {
      // Arrange
      const chatbotId = mongoose.Types.ObjectId.createFromTime(1);
      const period = 'daily';
      const limit = 2;

      // Act
      const results = await Analytics.getLatestByPeriod(chatbotId, period, limit);

      // Assert
      expect(results).toHaveLength(2);
      // Should be sorted by date descending
      expect(results[0].date.getTime()).toBeGreaterThan(results[1].date.getTime());
    });
  });

  describe('Indexes', () => {
    it('should create compound index on chatbotId, period, and date', async () => {
      // This test verifies that the necessary indexes exist
      const indexes = await Analytics.collection.indexes();
      
      // Convert indexes to a more easily testable format
      const indexFields = indexes.map(index => Object.keys(index.key));
      
      // Check for expected compound index
      const hasCompoundIndex = indexFields.some(fields => 
        fields.includes('chatbotId') && 
        fields.includes('period') && 
        fields.includes('date')
      );
      
      expect(hasCompoundIndex).toBe(true);
    });
  });
});
