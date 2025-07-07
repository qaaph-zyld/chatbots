/**
 * Demo Data Generator for Analytics Dashboard
 * 
 * Utility to generate realistic demo data for testing the analytics dashboard
 * Creates sample events, sessions, and user interactions
 */

const mongoose = require('mongoose');
const AnalyticsEvent = require('../models/analytics-event.model');
const UserSession = require('../models/user-session.model');
const logger = require('../../utils/logger');

// Event types for demo data
const EVENT_TYPES = [
  'conversation_started',
  'message_sent',
  'message_received',
  'conversation_ended',
  'template_selected',
  'knowledge_base_queried',
  'feedback_submitted',
  'chatbot_created',
  'chatbot_edited',
  'chatbot_deleted',
  'user_login',
  'user_logout',
  'subscription_viewed',
  'plan_changed',
  'payment_method_updated'
];

// Device types for demo data
const DEVICES = ['desktop', 'mobile', 'tablet'];

// Browsers for demo data
const BROWSERS = ['chrome', 'firefox', 'safari', 'edge'];

// Locations for demo data
const LOCATIONS = ['US', 'UK', 'CA', 'DE', 'FR', 'JP', 'AU', 'BR', 'IN'];

/**
 * Generate a random date within a range
 * @param {Date} start - Start date
 * @param {Date} end - End date
 * @returns {Date} Random date within the range
 */
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

/**
 * Generate a random integer within a range
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @returns {number} Random integer
 */
const randomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Generate a random item from an array
 * @param {Array} array - Array to select from
 * @returns {*} Random item from the array
 */
const randomItem = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

/**
 * Generate a random ObjectId
 * @returns {mongoose.Types.ObjectId} Random ObjectId
 */
const randomObjectId = () => {
  return new mongoose.Types.ObjectId();
};

/**
 * Generate demo analytics events
 * @param {Object} options - Options for generating events
 * @param {string} options.tenantId - Tenant ID
 * @param {Array<string>} options.userIds - Array of user IDs
 * @param {number} options.count - Number of events to generate
 * @param {Date} options.startDate - Start date for events
 * @param {Date} options.endDate - End date for events
 * @returns {Promise<Array>} Generated events
 */
const generateEvents = async (options) => {
  const {
    tenantId,
    userIds,
    count = 100,
    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate = new Date()
  } = options;
  
  const events = [];
  const sessions = {};
  
  // Create sessions for each user
  userIds.forEach(userId => {
    const sessionCount = randomInt(1, 5);
    sessions[userId] = [];
    
    for (let i = 0; i < sessionCount; i++) {
      sessions[userId].push(randomObjectId());
    }
  });
  
  // Generate events
  for (let i = 0; i < count; i++) {
    const userId = randomItem(userIds);
    const sessionId = randomItem(sessions[userId]);
    const eventType = randomItem(EVENT_TYPES);
    const timestamp = randomDate(startDate, endDate);
    
    // Generate event data based on event type
    let eventData = {};
    
    switch (eventType) {
      case 'conversation_started':
        eventData = {
          conversationId: randomObjectId(),
          templateId: randomObjectId()
        };
        break;
      case 'message_sent':
      case 'message_received':
        eventData = {
          conversationId: randomObjectId(),
          messageId: randomObjectId(),
          messageLength: randomInt(10, 200)
        };
        break;
      case 'conversation_ended':
        eventData = {
          conversationId: randomObjectId(),
          duration: randomInt(30, 900), // 30 seconds to 15 minutes
          messageCount: randomInt(2, 20)
        };
        break;
      case 'template_selected':
        eventData = {
          templateId: randomObjectId(),
          templateName: `Template ${randomInt(1, 10)}`
        };
        break;
      case 'knowledge_base_queried':
        eventData = {
          query: `Sample query ${randomInt(1, 100)}`,
          resultCount: randomInt(0, 10)
        };
        break;
      case 'feedback_submitted':
        eventData = {
          rating: randomInt(1, 5),
          comment: randomInt(1, 10) > 3 ? `Feedback comment ${randomInt(1, 100)}` : null
        };
        break;
      case 'subscription_viewed':
        eventData = {
          planId: randomObjectId(),
          planName: `${randomItem(['Basic', 'Pro', 'Enterprise'])} Plan`
        };
        break;
      default:
        eventData = {
          metadata: `Sample metadata for ${eventType}`
        };
    }
    
    events.push({
      tenantId,
      userId,
      sessionId,
      eventType,
      eventData,
      timestamp
    });
  }
  
  try {
    // Insert events in batches
    const batchSize = 100;
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      await AnalyticsEvent.insertMany(batch);
    }
    
    logger.info(`Generated ${events.length} demo analytics events`);
    return events;
  } catch (error) {
    logger.error(`Error generating demo events: ${error.message}`, { error });
    throw error;
  }
};

/**
 * Generate demo user sessions
 * @param {Object} options - Options for generating sessions
 * @param {string} options.tenantId - Tenant ID
 * @param {Array<string>} options.userIds - Array of user IDs
 * @param {number} options.count - Number of sessions to generate
 * @param {Date} options.startDate - Start date for sessions
 * @param {Date} options.endDate - End date for sessions
 * @returns {Promise<Array>} Generated sessions
 */
const generateSessions = async (options) => {
  const {
    tenantId,
    userIds,
    count = 50,
    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate = new Date()
  } = options;
  
  const sessions = [];
  
  // Generate sessions
  for (let i = 0; i < count; i++) {
    const userId = randomItem(userIds);
    const sessionId = randomObjectId();
    const startTime = randomDate(startDate, endDate);
    const durationSeconds = randomInt(60, 3600); // 1 minute to 1 hour
    const endTime = new Date(startTime.getTime() + durationSeconds * 1000);
    
    sessions.push({
      tenantId,
      userId,
      sessionId,
      startTime,
      endTime,
      duration: durationSeconds,
      device: randomItem(DEVICES),
      browser: randomItem(BROWSERS),
      location: randomItem(LOCATIONS),
      metadata: {
        ipAddress: `192.168.${randomInt(1, 255)}.${randomInt(1, 255)}`,
        userAgent: `Mozilla/5.0 Demo User Agent ${randomInt(1, 100)}`
      }
    });
  }
  
  try {
    // Insert sessions in batches
    const batchSize = 50;
    for (let i = 0; i < sessions.length; i += batchSize) {
      const batch = sessions.slice(i, i + batchSize);
      await UserSession.insertMany(batch);
    }
    
    logger.info(`Generated ${sessions.length} demo user sessions`);
    return sessions;
  } catch (error) {
    logger.error(`Error generating demo sessions: ${error.message}`, { error });
    throw error;
  }
};

/**
 * Generate a complete set of demo data for a tenant
 * @param {Object} options - Options for generating data
 * @param {string} options.tenantId - Tenant ID
 * @param {number} options.userCount - Number of users to generate
 * @param {number} options.eventCount - Number of events to generate
 * @param {number} options.sessionCount - Number of sessions to generate
 * @param {Date} options.startDate - Start date for data
 * @param {Date} options.endDate - End date for data
 * @returns {Promise<Object>} Generated data summary
 */
const generateDemoData = async (options) => {
  const {
    tenantId,
    userCount = 5,
    eventCount = 500,
    sessionCount = 50,
    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate = new Date()
  } = options;
  
  try {
    // Generate user IDs
    const userIds = [];
    for (let i = 0; i < userCount; i++) {
      userIds.push(randomObjectId());
    }
    
    // Generate sessions
    const sessions = await generateSessions({
      tenantId,
      userIds,
      count: sessionCount,
      startDate,
      endDate
    });
    
    // Generate events
    const events = await generateEvents({
      tenantId,
      userIds,
      count: eventCount,
      startDate,
      endDate
    });
    
    return {
      tenantId,
      userCount,
      eventCount: events.length,
      sessionCount: sessions.length,
      dateRange: {
        start: startDate,
        end: endDate
      }
    };
  } catch (error) {
    logger.error(`Error generating demo data: ${error.message}`, { error });
    throw error;
  }
};

/**
 * Clear all demo data for a tenant
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<Object>} Summary of deleted data
 */
const clearDemoData = async (tenantId) => {
  try {
    const eventsResult = await AnalyticsEvent.deleteMany({ tenantId });
    const sessionsResult = await UserSession.deleteMany({ tenantId });
    
    logger.info(`Cleared demo data for tenant ${tenantId}`, {
      deletedEvents: eventsResult.deletedCount,
      deletedSessions: sessionsResult.deletedCount
    });
    
    return {
      deletedEvents: eventsResult.deletedCount,
      deletedSessions: sessionsResult.deletedCount
    };
  } catch (error) {
    logger.error(`Error clearing demo data: ${error.message}`, { error, tenantId });
    throw error;
  }
};

module.exports = {
  generateEvents,
  generateSessions,
  generateDemoData,
  clearDemoData
};
