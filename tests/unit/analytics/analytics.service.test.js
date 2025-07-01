/**
 * Unit Tests for Analytics Service
 * 
 * Tests the core functionality of the analytics service
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const analyticsService = require('../../../src/analytics/services/analytics.service');
const AnalyticsEvent = require('../../../src/analytics/models/analytics-event.model');
const UserSession = require('../../../src/analytics/models/user-session.model');

// Mock dependencies
jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn()
}));

// Setup in-memory MongoDB for testing
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clear all collections before each test
  await AnalyticsEvent.deleteMany({});
  await UserSession.deleteMany({});
});

describe('Analytics Service', () => {
  describe('trackEvent', () => {
    it('should successfully track an event', async () => {
      // Arrange
      const eventData = {
        tenantId: '60d21b4667d0d8992e610c85',
        userId: '60d21b4667d0d8992e610c86',
        sessionId: '60d21b4667d0d8992e610c87',
        eventType: 'conversation_started',
        eventData: {
          conversationId: '60d21b4667d0d8992e610c88',
          templateId: '60d21b4667d0d8992e610c89'
        }
      };

      // Act
      const result = await analyticsService.trackEvent(eventData);

      // Assert
      expect(result).toBeTruthy();
      expect(result._id).toBeDefined();
      expect(result.tenantId.toString()).toBe(eventData.tenantId);
      expect(result.userId.toString()).toBe(eventData.userId);
      expect(result.sessionId.toString()).toBe(eventData.sessionId);
      expect(result.eventType).toBe(eventData.eventType);
      expect(result.eventData).toEqual(eventData.eventData);
      expect(result.timestamp).toBeDefined();
    });

    it('should handle missing required fields', async () => {
      // Arrange
      const incompleteEventData = {
        userId: '60d21b4667d0d8992e610c86',
        eventType: 'conversation_started'
      };

      // Act & Assert
      await expect(analyticsService.trackEvent(incompleteEventData))
        .rejects.toThrow();
    });

    it('should handle invalid event types', async () => {
      // Arrange
      const invalidEventData = {
        tenantId: '60d21b4667d0d8992e610c85',
        userId: '60d21b4667d0d8992e610c86',
        sessionId: '60d21b4667d0d8992e610c87',
        eventType: 'invalid_event_type',
        eventData: {}
      };

      // Act
      const result = await analyticsService.trackEvent(invalidEventData);

      // Assert
      expect(result).toBeTruthy();
      expect(result.eventType).toBe('invalid_event_type');
    });
  });

  describe('getEventsByTenant', () => {
    beforeEach(async () => {
      // Seed test data
      await AnalyticsEvent.create([
        {
          tenantId: '60d21b4667d0d8992e610c85',
          userId: '60d21b4667d0d8992e610c86',
          sessionId: '60d21b4667d0d8992e610c87',
          eventType: 'conversation_started',
          eventData: { conversationId: '1' },
          timestamp: new Date('2025-06-01T10:00:00Z')
        },
        {
          tenantId: '60d21b4667d0d8992e610c85',
          userId: '60d21b4667d0d8992e610c86',
          sessionId: '60d21b4667d0d8992e610c87',
          eventType: 'message_sent',
          eventData: { conversationId: '1', messageId: '1' },
          timestamp: new Date('2025-06-01T10:05:00Z')
        },
        {
          tenantId: '60d21b4667d0d8992e610c85',
          userId: '60d21b4667d0d8992e610c88',
          sessionId: '60d21b4667d0d8992e610c89',
          eventType: 'conversation_started',
          eventData: { conversationId: '2' },
          timestamp: new Date('2025-06-02T10:00:00Z')
        },
        {
          tenantId: '70d21b4667d0d8992e610c85', // Different tenant
          userId: '70d21b4667d0d8992e610c86',
          sessionId: '70d21b4667d0d8992e610c87',
          eventType: 'conversation_started',
          eventData: { conversationId: '3' },
          timestamp: new Date('2025-06-01T10:00:00Z')
        }
      ]);
    });

    it('should return events for a specific tenant', async () => {
      // Act
      const events = await analyticsService.getEventsByTenant('60d21b4667d0d8992e610c85');

      // Assert
      expect(events).toHaveLength(3);
      events.forEach(event => {
        expect(event.tenantId.toString()).toBe('60d21b4667d0d8992e610c85');
      });
    });

    it('should filter events by date range', async () => {
      // Act
      const events = await analyticsService.getEventsByTenant(
        '60d21b4667d0d8992e610c85',
        new Date('2025-06-01T00:00:00Z'),
        new Date('2025-06-01T23:59:59Z')
      );

      // Assert
      expect(events).toHaveLength(2);
      events.forEach(event => {
        const eventDate = new Date(event.timestamp);
        expect(eventDate >= new Date('2025-06-01T00:00:00Z')).toBeTruthy();
        expect(eventDate <= new Date('2025-06-01T23:59:59Z')).toBeTruthy();
      });
    });

    it('should filter events by event type', async () => {
      // Act
      const events = await analyticsService.getEventsByTenant(
        '60d21b4667d0d8992e610c85',
        null,
        null,
        'conversation_started'
      );

      // Assert
      expect(events).toHaveLength(2);
      events.forEach(event => {
        expect(event.eventType).toBe('conversation_started');
      });
    });

    it('should return empty array for non-existent tenant', async () => {
      // Act
      const events = await analyticsService.getEventsByTenant('nonexistentid');

      // Assert
      expect(events).toHaveLength(0);
    });
  });

  describe('getUserSessions', () => {
    beforeEach(async () => {
      // Seed test data
      await UserSession.create([
        {
          tenantId: '60d21b4667d0d8992e610c85',
          userId: '60d21b4667d0d8992e610c86',
          sessionId: '60d21b4667d0d8992e610c87',
          startTime: new Date('2025-06-01T10:00:00Z'),
          endTime: new Date('2025-06-01T10:30:00Z'),
          duration: 1800, // 30 minutes in seconds
          device: 'desktop',
          browser: 'chrome',
          location: 'US'
        },
        {
          tenantId: '60d21b4667d0d8992e610c85',
          userId: '60d21b4667d0d8992e610c86',
          sessionId: '60d21b4667d0d8992e610c88',
          startTime: new Date('2025-06-02T10:00:00Z'),
          endTime: new Date('2025-06-02T10:15:00Z'),
          duration: 900, // 15 minutes in seconds
          device: 'mobile',
          browser: 'safari',
          location: 'UK'
        },
        {
          tenantId: '70d21b4667d0d8992e610c85', // Different tenant
          userId: '70d21b4667d0d8992e610c86',
          sessionId: '70d21b4667d0d8992e610c87',
          startTime: new Date('2025-06-01T10:00:00Z'),
          endTime: new Date('2025-06-01T10:30:00Z'),
          duration: 1800,
          device: 'desktop',
          browser: 'firefox',
          location: 'CA'
        }
      ]);
    });

    it('should return sessions for a specific tenant', async () => {
      // Act
      const sessions = await analyticsService.getUserSessions('60d21b4667d0d8992e610c85');

      // Assert
      expect(sessions).toHaveLength(2);
      sessions.forEach(session => {
        expect(session.tenantId.toString()).toBe('60d21b4667d0d8992e610c85');
      });
    });

    it('should filter sessions by user', async () => {
      // Act
      const sessions = await analyticsService.getUserSessions(
        '60d21b4667d0d8992e610c85',
        '60d21b4667d0d8992e610c86'
      );

      // Assert
      expect(sessions).toHaveLength(2);
      sessions.forEach(session => {
        expect(session.userId.toString()).toBe('60d21b4667d0d8992e610c86');
      });
    });

    it('should filter sessions by date range', async () => {
      // Act
      const sessions = await analyticsService.getUserSessions(
        '60d21b4667d0d8992e610c85',
        null,
        new Date('2025-06-01T00:00:00Z'),
        new Date('2025-06-01T23:59:59Z')
      );

      // Assert
      expect(sessions).toHaveLength(1);
      const session = sessions[0];
      expect(new Date(session.startTime) >= new Date('2025-06-01T00:00:00Z')).toBeTruthy();
      expect(new Date(session.endTime) <= new Date('2025-06-01T23:59:59Z')).toBeTruthy();
    });

    it('should return empty array for non-existent tenant', async () => {
      // Act
      const sessions = await analyticsService.getUserSessions('nonexistentid');

      // Assert
      expect(sessions).toHaveLength(0);
    });
  });

  describe('generateAnalyticsReport', () => {
    beforeEach(async () => {
      // Seed events
      await AnalyticsEvent.create([
        {
          tenantId: '60d21b4667d0d8992e610c85',
          userId: '60d21b4667d0d8992e610c86',
          sessionId: '60d21b4667d0d8992e610c87',
          eventType: 'conversation_started',
          eventData: { conversationId: '1' },
          timestamp: new Date('2025-06-01T10:00:00Z')
        },
        {
          tenantId: '60d21b4667d0d8992e610c85',
          userId: '60d21b4667d0d8992e610c86',
          sessionId: '60d21b4667d0d8992e610c87',
          eventType: 'message_sent',
          eventData: { conversationId: '1', messageId: '1' },
          timestamp: new Date('2025-06-01T10:05:00Z')
        },
        {
          tenantId: '60d21b4667d0d8992e610c85',
          userId: '60d21b4667d0d8992e610c86',
          sessionId: '60d21b4667d0d8992e610c87',
          eventType: 'message_received',
          eventData: { conversationId: '1', messageId: '2' },
          timestamp: new Date('2025-06-01T10:06:00Z')
        },
        {
          tenantId: '60d21b4667d0d8992e610c85',
          userId: '60d21b4667d0d8992e610c88',
          sessionId: '60d21b4667d0d8992e610c89',
          eventType: 'conversation_started',
          eventData: { conversationId: '2' },
          timestamp: new Date('2025-06-02T10:00:00Z')
        }
      ]);

      // Seed sessions
      await UserSession.create([
        {
          tenantId: '60d21b4667d0d8992e610c85',
          userId: '60d21b4667d0d8992e610c86',
          sessionId: '60d21b4667d0d8992e610c87',
          startTime: new Date('2025-06-01T10:00:00Z'),
          endTime: new Date('2025-06-01T10:30:00Z'),
          duration: 1800,
          device: 'desktop',
          browser: 'chrome',
          location: 'US'
        },
        {
          tenantId: '60d21b4667d0d8992e610c85',
          userId: '60d21b4667d0d8992e610c88',
          sessionId: '60d21b4667d0d8992e610c89',
          startTime: new Date('2025-06-02T10:00:00Z'),
          endTime: new Date('2025-06-02T10:15:00Z'),
          duration: 900,
          device: 'mobile',
          browser: 'safari',
          location: 'UK'
        }
      ]);
    });

    it('should generate a complete analytics report', async () => {
      // Act
      const report = await analyticsService.generateAnalyticsReport(
        '60d21b4667d0d8992e610c85',
        new Date('2025-06-01T00:00:00Z'),
        new Date('2025-06-02T23:59:59Z')
      );

      // Assert
      expect(report).toBeDefined();
      expect(report.totalEvents).toBe(4);
      expect(report.totalSessions).toBe(2);
      expect(report.uniqueUsers).toBe(2);
      expect(report.eventBreakdown).toBeDefined();
      expect(report.eventBreakdown.conversation_started).toBe(2);
      expect(report.eventBreakdown.message_sent).toBe(1);
      expect(report.eventBreakdown.message_received).toBe(1);
      expect(report.sessionMetrics).toBeDefined();
      expect(report.sessionMetrics.averageDuration).toBe(1350); // (1800 + 900) / 2
      expect(report.deviceBreakdown).toBeDefined();
      expect(report.deviceBreakdown.desktop).toBe(1);
      expect(report.deviceBreakdown.mobile).toBe(1);
    });

    it('should return empty report for non-existent tenant', async () => {
      // Act
      const report = await analyticsService.generateAnalyticsReport('nonexistentid');

      // Assert
      expect(report).toBeDefined();
      expect(report.totalEvents).toBe(0);
      expect(report.totalSessions).toBe(0);
      expect(report.uniqueUsers).toBe(0);
      expect(report.eventBreakdown).toEqual({});
      expect(report.sessionMetrics.averageDuration).toBe(0);
      expect(report.deviceBreakdown).toEqual({});
    });
  });
});
