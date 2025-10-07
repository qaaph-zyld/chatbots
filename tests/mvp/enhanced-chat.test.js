/**
 * Enhanced Chat Handler Tests
 */

const ChatHandler = require('../../src/mvp/chat/ChatHandler');

describe('Enhanced Chat Handler', () => {
  let chatHandler;

  beforeEach(() => {
    chatHandler = new ChatHandler();
  });

  test('generates unique session IDs', () => {
    const id1 = chatHandler.generateSessionId();
    const id2 = chatHandler.generateSessionId();
    
    expect(id1).toMatch(/^session_\d+_[a-z0-9]+$/);
    expect(id2).toMatch(/^session_\d+_[a-z0-9]+$/);
    expect(id1).not.toBe(id2);
  });

  test('updates session data correctly', () => {
    const sessionId = 'test-session';
    const message = 'Hello';
    
    chatHandler.updateSession(sessionId, message);
    const session = chatHandler.getSessionInfo(sessionId);
    
    expect(session).toBeDefined();
    expect(session.id).toBe(sessionId);
    expect(session.messages).toHaveLength(1);
    expect(session.messages[0].content).toBe(message);
    expect(session.messages[0].type).toBe('user');
  });

  test('provides enhanced laptop pricing response', () => {
    const response = chatHandler.generateResponse('How much does a gaming laptop cost?', 'test-session');
    
    expect(response).toContain('💻');
    expect(response).toContain('Gaming/Professional');
    expect(response).toContain('$1200-3000+');
    expect(response).toContain('Current Deals');
  });

  test('provides enhanced phone pricing response', () => {
    const response = chatHandler.generateResponse('smartphone prices', 'test-session');
    
    expect(response).toContain('📱');
    expect(response).toContain('Flagship Models');
    expect(response).toContain('iPhone 15');
    expect(response).toContain('Samsung Galaxy S24');
  });

  test('provides enhanced audio device pricing', () => {
    const response = chatHandler.generateResponse('audio device prices', 'test-session');
    
    expect(response).toContain('🎧');
    expect(response).toContain('Sony, Bose, Apple AirPods');
    expect(response).toContain('Premium/Pro Audio');
  });

  test('provides detailed shipping information', () => {
    const response = chatHandler.generateResponse('shipping options', 'test-session');
    
    expect(response).toContain('🚚');
    expect(response).toContain('Standard Delivery');
    expect(response).toContain('Express Delivery');
    expect(response).toContain('Same-Day Delivery');
    expect(response).toContain('FREE on orders $50+');
  });

  test('provides detailed return policy', () => {
    const response = chatHandler.generateResponse('return policy', 'test-session');
    
    expect(response).toContain('🔄');
    expect(response).toContain('30-day return policy');
    expect(response).toContain('Free return shipping');
    expect(response).toContain('No restocking fees');
  });

  test('provides comprehensive help information', () => {
    const response = chatHandler.generateResponse('I need help', 'test-session');
    
    expect(response).toContain('🤝');
    expect(response).toContain('Product recommendations');
    expect(response).toContain('Order tracking');
    expect(response).toContain('Technical support');
  });

  test('provides laptop product recommendations', () => {
    const response = chatHandler.generateResponse('I want to buy a laptop', 'test-session');
    
    expect(response).toContain('💻');
    expect(response).toContain('Dell XPS 13');
    expect(response).toContain('MacBook Air M2');
    expect(response).toContain('For Work');
    expect(response).toContain('For Gaming');
  });

  test('provides smartphone recommendations', () => {
    const response = chatHandler.generateResponse('looking for a smartphone', 'test-session');
    
    expect(response).toContain('📱');
    expect(response).toContain('iPhone 15 Pro');
    expect(response).toContain('Samsung Galaxy S24');
    expect(response).toContain('Google Pixel 8');
  });

  test('recognizes returning users', () => {
    const sessionId = 'returning-user-session';
    
    // First interaction
    chatHandler.updateSession(sessionId, 'Hello');
    const firstResponse = chatHandler.generateResponse('Hello', sessionId);
    
    // Second interaction
    chatHandler.updateSession(sessionId, 'Hi again');
    const secondResponse = chatHandler.generateResponse('Hi again', sessionId);
    
    expect(secondResponse).toContain('Welcome back');
    expect(secondResponse).not.toBe(firstResponse);
  });

  test('provides enhanced default response with context', () => {
    const response = chatHandler.generateResponse('random question about stuff', 'test-session');
    
    expect(response).toContain('random question about stuff');
    expect(response).toContain('🛍️');
    expect(response).toContain('Product Search & Recommendations');
    expect(response).toContain('💰');
    expect(response).toContain('Pricing & Deals');
  });

  test('cleans up old sessions', () => {
    const sessionId = 'old-session';
    chatHandler.updateSession(sessionId, 'test message');
    
    // Manually set old timestamp
    const session = chatHandler.getSessionInfo(sessionId);
    session.lastActivity = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
    
    chatHandler.cleanupSessions();
    
    expect(chatHandler.getSessionInfo(sessionId)).toBeNull();
  });

  test('handles multiple messages in session', () => {
    const sessionId = 'multi-message-session';
    
    chatHandler.updateSession(sessionId, 'First message');
    chatHandler.updateSession(sessionId, 'Second message');
    chatHandler.updateSession(sessionId, 'Third message');
    
    const session = chatHandler.getSessionInfo(sessionId);
    expect(session.messages).toHaveLength(3);
    expect(session.messages[0].content).toBe('First message');
    expect(session.messages[2].content).toBe('Third message');
  });
});
