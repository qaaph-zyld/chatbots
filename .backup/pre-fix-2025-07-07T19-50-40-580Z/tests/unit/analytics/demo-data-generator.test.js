/**
 * Demo Data Generator Unit Tests
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const demoDataGenerator = require('../../../src/analytics/utils/demo-data-generator');
const AnalyticsEvent = require('../../../src/analytics/models/analytics-event.model');
const UserSession = require('../../../src/analytics/models/user-session.model');

// Mock dependencies
jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

describe('Demo Data Generator', () => {
  let mongoServer;
  
  // Setup MongoDB Memory Server
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });
  
  // Clean up after tests
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });
  
  // Clear database between tests
  beforeEach(async () => {
    await AnalyticsEvent.deleteMany({});
    await UserSession.deleteMany({});
  });
  
  describe('generateEvents', () => {
    it('should generate the specified number of events', async () => {
      const tenantId = new mongoose.Types.ObjectId().toString();
      const userIds = [
        new mongoose.Types.ObjectId().toString(),
        new mongoose.Types.ObjectId().toString()
      ];
      
      const options = {
        tenantId,
        userIds,
        count: 50,
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31')
      };
      
      const events = await demoDataGenerator.generateEvents(options);
      
      expect(events).toBeDefined();
      expect(events.length).toBe(50);
      
      // Check that events were saved to the database
      const savedEvents = await AnalyticsEvent.find({ tenantId });
      expect(savedEvents.length).toBe(50);
      
      // Check event properties
      const event = savedEvents[0];
      expect(event.tenantId.toString()).toBe(tenantId);
      expect(userIds).toContain(event.userId.toString());
      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.timestamp).toBeGreaterThanOrEqual(options.startDate);
      expect(event.timestamp).toBeLessThanOrEqual(options.endDate);
      expect(event.eventData).toBeDefined();
    });
    
    it('should use default values when options are not provided', async () => {
      const tenantId = new mongoose.Types.ObjectId().toString();
      const userIds = [new mongoose.Types.ObjectId().toString()];
      
      const options = {
        tenantId,
        userIds
      };
      
      const events = await demoDataGenerator.generateEvents(options);
      
      expect(events).toBeDefined();
      expect(events.length).toBe(100); // Default count
      
      // Check that events were saved to the database
      const savedEvents = await AnalyticsEvent.find({ tenantId });
      expect(savedEvents.length).toBe(100);
    });
    
    it('should handle errors gracefully', async () => {
      // Force an error by providing invalid data
      const options = {
        tenantId: 'invalid-id',
        userIds: ['invalid-id'],
        count: 10
      };
      
      await expect(demoDataGenerator.generateEvents(options)).rejects.toThrow();
    });
  });
  
  describe('generateSessions', () => {
    it('should generate the specified number of sessions', async () => {
      const tenantId = new mongoose.Types.ObjectId().toString();
      const userIds = [
        new mongoose.Types.ObjectId().toString(),
        new mongoose.Types.ObjectId().toString()
      ];
      
      const options = {
        tenantId,
        userIds,
        count: 20,
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31')
      };
      
      const sessions = await demoDataGenerator.generateSessions(options);
      
      expect(sessions).toBeDefined();
      expect(sessions.length).toBe(20);
      
      // Check that sessions were saved to the database
      const savedSessions = await UserSession.find({ tenantId });
      expect(savedSessions.length).toBe(20);
      
      // Check session properties
      const session = savedSessions[0];
      expect(session.tenantId.toString()).toBe(tenantId);
      expect(userIds).toContain(session.userId.toString());
      expect(session.startTime).toBeInstanceOf(Date);
      expect(session.startTime).toBeGreaterThanOrEqual(options.startDate);
      expect(session.startTime).toBeLessThanOrEqual(options.endDate);
      expect(session.endTime).toBeInstanceOf(Date);
      expect(session.endTime).toBeGreaterThan(session.startTime);
      expect(session.deviceInfo).toBeDefined();
    });
    
    it('should use default values when options are not provided', async () => {
      const tenantId = new mongoose.Types.ObjectId().toString();
      const userIds = [new mongoose.Types.ObjectId().toString()];
      
      const options = {
        tenantId,
        userIds
      };
      
      const sessions = await demoDataGenerator.generateSessions(options);
      
      expect(sessions).toBeDefined();
      expect(sessions.length).toBe(50); // Default count
      
      // Check that sessions were saved to the database
      const savedSessions = await UserSession.find({ tenantId });
      expect(savedSessions.length).toBe(50);
    });
  });
  
  describe('generateDemoData', () => {
    it('should generate a complete set of demo data', async () => {
      const tenantId = new mongoose.Types.ObjectId().toString();
      
      const options = {
        tenantId,
        userCount: 5,
        eventCount: 100,
        sessionCount: 30,
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31')
      };
      
      const result = await demoDataGenerator.generateDemoData(options);
      
      expect(result).toBeDefined();
      expect(result.userIds).toBeDefined();
      expect(result.userIds.length).toBe(5);
      expect(result.events).toBeDefined();
      expect(result.events.length).toBe(100);
      expect(result.sessions).toBeDefined();
      expect(result.sessions.length).toBe(30);
      
      // Check that data was saved to the database
      const savedEvents = await AnalyticsEvent.find({ tenantId });
      expect(savedEvents.length).toBe(100);
      
      const savedSessions = await UserSession.find({ tenantId });
      expect(savedSessions.length).toBe(30);
    });
    
    it('should use default values when options are not provided', async () => {
      const tenantId = new mongoose.Types.ObjectId().toString();
      
      const options = {
        tenantId
      };
      
      const result = await demoDataGenerator.generateDemoData(options);
      
      expect(result).toBeDefined();
      expect(result.userIds).toBeDefined();
      expect(result.userIds.length).toBe(10); // Default user count
      expect(result.events).toBeDefined();
      expect(result.sessions).toBeDefined();
    });
  });
  
  describe('clearDemoData', () => {
    it('should clear all demo data for a tenant', async () => {
      const tenantId = new mongoose.Types.ObjectId().toString();
      
      // Generate some demo data
      await demoDataGenerator.generateDemoData({
        tenantId,
        userCount: 3,
        eventCount: 50,
        sessionCount: 15
      });
      
      // Verify data was created
      const eventsBeforeClear = await AnalyticsEvent.find({ tenantId });
      const sessionsBeforeClear = await UserSession.find({ tenantId });
      expect(eventsBeforeClear.length).toBe(50);
      expect(sessionsBeforeClear.length).toBe(15);
      
      // Clear the data
      const result = await demoDataGenerator.clearDemoData(tenantId);
      
      expect(result).toBeDefined();
      expect(result.deletedEvents).toBe(50);
      expect(result.deletedSessions).toBe(15);
      
      // Verify data was cleared
      const eventsAfterClear = await AnalyticsEvent.find({ tenantId });
      const sessionsAfterClear = await UserSession.find({ tenantId });
      expect(eventsAfterClear.length).toBe(0);
      expect(sessionsAfterClear.length).toBe(0);
    });
    
    it('should handle case when no data exists', async () => {
      const tenantId = new mongoose.Types.ObjectId().toString();
      
      // Clear data for a tenant with no data
      const result = await demoDataGenerator.clearDemoData(tenantId);
      
      expect(result).toBeDefined();
      expect(result.deletedEvents).toBe(0);
      expect(result.deletedSessions).toBe(0);
    });
  });
});
