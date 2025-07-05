/**
 * Database Indexes Configuration
 * 
 * This file defines the indexes for MongoDB collections to optimize query performance.
 * These indexes should be created during application startup.
 */

const createIndexes = async (db) => {
  console.log('Creating database indexes...');
  
  try {
    // Users collection indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ 'apiKeys.key': 1 });
    await db.collection('users').createIndex({ createdAt: 1 });
    await db.collection('users').createIndex({ role: 1 });
    
    // Chatbots collection indexes
    await db.collection('chatbots').createIndex({ userId: 1 });
    await db.collection('chatbots').createIndex({ name: 1 });
    await db.collection('chatbots').createIndex({ status: 1 });
    await db.collection('chatbots').createIndex({ 'integrations.type': 1 });
    await db.collection('chatbots').createIndex({ createdAt: 1 });
    await db.collection('chatbots').createIndex({ updatedAt: 1 });
    
    // Compound index for filtering chatbots by user and status
    await db.collection('chatbots').createIndex({ userId: 1, status: 1 });
    
    // Knowledge base indexes
    await db.collection('knowledge').createIndex({ chatbotId: 1 });
    await db.collection('knowledge').createIndex({ tags: 1 });
    await db.collection('knowledge').createIndex({ updatedAt: 1 });
    
    // Text index for searching knowledge base
    await db.collection('knowledge').createIndex(
      { question: 'text', answer: 'text' },
      { weights: { question: 3, answer: 1 }, name: 'knowledge_text_search' }
    );
    
    // Conversations indexes
    await db.collection('conversations').createIndex({ chatbotId: 1 });
    await db.collection('conversations').createIndex({ userId: 1 });
    await db.collection('conversations').createIndex({ startedAt: 1 });
    await db.collection('conversations').createIndex({ endedAt: 1 });
    await db.collection('conversations').createIndex({ channel: 1 });
    
    // Compound index for conversation analytics
    await db.collection('conversations').createIndex({ chatbotId: 1, startedAt: 1 });
    await db.collection('conversations').createIndex({ chatbotId: 1, channel: 1 });
    
    // Messages indexes
    await db.collection('messages').createIndex({ conversationId: 1 });
    await db.collection('messages').createIndex({ timestamp: 1 });
    await db.collection('messages').createIndex({ sender: 1 });
    
    // Compound index for message retrieval
    await db.collection('messages').createIndex({ conversationId: 1, timestamp: 1 });
    
    // Analytics indexes
    await db.collection('analytics').createIndex({ chatbotId: 1 });
    await db.collection('analytics').createIndex({ timestamp: 1 });
    await db.collection('analytics').createIndex({ metricType: 1 });
    
    // Compound index for analytics queries
    await db.collection('analytics').createIndex({ chatbotId: 1, timestamp: 1, metricType: 1 });
    
    // Alerts indexes
    await db.collection('alerts').createIndex({ status: 1 });
    await db.collection('alerts').createIndex({ severity: 1 });
    await db.collection('alerts').createIndex({ triggeredAt: 1 });
    
    // Webhooks indexes
    await db.collection('webhooks').createIndex({ userId: 1 });
    await db.collection('webhooks').createIndex({ 'events': 1 });
    
    // TTL index for session expiration
    await db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    
    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Error creating database indexes:', error);
    throw error;
  }
};

module.exports = { createIndexes };
