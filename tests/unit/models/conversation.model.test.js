/**
 * Conversation Model Tests
 */

const mongoose = require('mongoose');
const Conversation = require('../../../models/conversation.model');

describe('Conversation Model', () => {
  // Test data
  const validConversationData = {
    chatbotId: new mongoose.Types.ObjectId(),
    userId: new mongoose.Types.ObjectId(),
    sessionId: 'test-session-123',
    channel: 'web',
    metadata: {
      userAgent: 'Mozilla/5.0',
      ipAddress: '127.0.0.1'
    },
    messages: [
      {
        sender: 'bot',
        content: 'Hello! How can I help you today?',
        contentType: 'text',
        timestamp: new Date()
      }
    ]
  };

  beforeEach(async () => {
    // Clear all conversations before each test
    await Conversation.deleteMany({});
  });

  describe('Validation', () => {
    it('should validate a valid conversation', async () => {
      // Arrange & Act
      const conversation = new Conversation(validConversationData);
      const validationError = conversation.validateSync();

      // Assert
      expect(validationError).toBeUndefined();
    });

    it('should require chatbotId field', async () => {
      // Arrange
      const conversationWithoutChatbot = { ...validConversationData };
      delete conversationWithoutChatbot.chatbotId;

      // Act
      const conversation = new Conversation(conversationWithoutChatbot);
      const validationError = conversation.validateSync();

      // Assert
      expect(validationError).toBeDefined();
      expect(validationError.errors.chatbotId).toBeDefined();
      expect(validationError.errors.chatbotId.kind).toBe('required');
    });

    it('should validate message sender type', async () => {
      // Arrange
      const conversationWithInvalidSender = { 
        ...validConversationData,
        messages: [
          {
            sender: 'invalid-sender',
            content: 'Hello',
            contentType: 'text'
          }
        ]
      };

      // Act
      const conversation = new Conversation(conversationWithInvalidSender);
      const validationError = conversation.validateSync();

      // Assert
      expect(validationError).toBeDefined();
      expect(validationError.errors['messages.0.sender']).toBeDefined();
      expect(validationError.errors['messages.0.sender'].kind).toBe('enum');
    });

    it('should validate message content type', async () => {
      // Arrange
      const conversationWithInvalidContentType = { 
        ...validConversationData,
        messages: [
          {
            sender: 'user',
            content: 'Hello',
            contentType: 'invalid-type'
          }
        ]
      };

      // Act
      const conversation = new Conversation(conversationWithInvalidContentType);
      const validationError = conversation.validateSync();

      // Assert
      expect(validationError).toBeDefined();
      expect(validationError.errors['messages.0.contentType']).toBeDefined();
      expect(validationError.errors['messages.0.contentType'].kind).toBe('enum');
    });

    it('should set default values', async () => {
      // Arrange
      const minimalConversationData = {
        chatbotId: new mongoose.Types.ObjectId(),
        sessionId: 'test-session'
      };

      // Act
      const conversation = new Conversation(minimalConversationData);

      // Assert
      expect(conversation.status).toBe('active');
      expect(conversation.channel).toBe('web');
      expect(conversation.messages).toEqual([]);
      expect(conversation.context).toEqual({});
      expect(conversation.metadata).toEqual({});
      expect(conversation.feedback).toBeUndefined();
      expect(conversation.createdAt).toBeDefined();
      expect(conversation.updatedAt).toBeDefined();
    });
  });

  describe('Methods', () => {
    it('should add a message to the conversation', async () => {
      // Arrange
      const conversation = new Conversation(validConversationData);
      const newMessage = {
        sender: 'user',
        content: 'I need help with my order',
        contentType: 'text'
      };

      // Act
      await conversation.addMessage(newMessage);

      // Assert
      expect(conversation.messages).toHaveLength(2);
      expect(conversation.messages[1].sender).toBe('user');
      expect(conversation.messages[1].content).toBe('I need help with my order');
      expect(conversation.messages[1].timestamp).toBeDefined();
    });

    it('should update conversation context', async () => {
      // Arrange
      const conversation = new Conversation(validConversationData);
      const contextData = {
        orderNumber: '12345',
        productId: 'prod-789'
      };

      // Act
      await conversation.updateContext(contextData);

      // Assert
      expect(conversation.context).toEqual(contextData);
    });

    it('should merge new context with existing context', async () => {
      // Arrange
      const conversation = new Conversation({
        ...validConversationData,
        context: { userName: 'John', userEmail: 'john@example.com' }
      });
      const newContextData = {
        orderNumber: '12345',
        userName: 'John Doe' // This should override the existing value
      };

      // Act
      await conversation.updateContext(newContextData);

      // Assert
      expect(conversation.context).toEqual({
        userName: 'John Doe',
        userEmail: 'john@example.com',
        orderNumber: '12345'
      });
    });

    it('should end the conversation with specified status', async () => {
      // Arrange
      const conversation = new Conversation(validConversationData);
      
      // Act
      await conversation.endConversation('completed');
      
      // Assert
      expect(conversation.status).toBe('completed');
      expect(conversation.endedAt).toBeDefined();
    });

    it('should add feedback to the conversation', async () => {
      // Arrange
      const conversation = new Conversation(validConversationData);
      const rating = 5;
      const comment = 'Very helpful chatbot!';
      
      // Act
      await conversation.addFeedback(rating, comment);
      
      // Assert
      expect(conversation.feedback).toBeDefined();
      expect(conversation.feedback.rating).toBe(rating);
      expect(conversation.feedback.comment).toBe(comment);
      expect(conversation.feedback.timestamp).toBeDefined();
    });
  });

  describe('Statics', () => {
    it('should find conversations by user', async () => {
      // Arrange
      const userId = new mongoose.Types.ObjectId();
      const otherUserId = new mongoose.Types.ObjectId();
      
      // Create conversations for different users
      await Conversation.create({
        ...validConversationData,
        userId,
        sessionId: 'session-1'
      });
      
      await Conversation.create({
        ...validConversationData,
        userId,
        sessionId: 'session-2'
      });
      
      await Conversation.create({
        ...validConversationData,
        userId: otherUserId,
        sessionId: 'session-3'
      });

      // Act
      const userConversations = await Conversation.findByUser(userId);

      // Assert
      expect(userConversations).toHaveLength(2);
      expect(userConversations.map(c => c.sessionId)).toContain('session-1');
      expect(userConversations.map(c => c.sessionId)).toContain('session-2');
      expect(userConversations.map(c => c.sessionId)).not.toContain('session-3');
    });

    it('should find active conversations by chatbot', async () => {
      // Arrange
      const chatbotId = new mongoose.Types.ObjectId();
      
      // Create active and inactive conversations
      await Conversation.create({
        ...validConversationData,
        chatbotId,
        sessionId: 'active-1',
        status: 'active'
      });
      
      await Conversation.create({
        ...validConversationData,
        chatbotId,
        sessionId: 'active-2',
        status: 'active'
      });
      
      await Conversation.create({
        ...validConversationData,
        chatbotId,
        sessionId: 'completed-1',
        status: 'completed'
      });

      // Act
      const activeConversations = await Conversation.findActiveByChatbot(chatbotId);

      // Assert
      expect(activeConversations).toHaveLength(2);
      expect(activeConversations.map(c => c.sessionId)).toContain('active-1');
      expect(activeConversations.map(c => c.sessionId)).toContain('active-2');
      expect(activeConversations.map(c => c.sessionId)).not.toContain('completed-1');
    });

    it('should find recent conversations by chatbot with limit', async () => {
      // Arrange
      const chatbotId = new mongoose.Types.ObjectId();
      const now = new Date();
      
      // Create conversations with different timestamps
      await Conversation.create({
        ...validConversationData,
        chatbotId,
        sessionId: 'recent-1',
        createdAt: new Date(now.getTime() - 1000) // 1 second ago
      });
      
      await Conversation.create({
        ...validConversationData,
        chatbotId,
        sessionId: 'recent-2',
        createdAt: new Date(now.getTime() - 2000) // 2 seconds ago
      });
      
      await Conversation.create({
        ...validConversationData,
        chatbotId,
        sessionId: 'recent-3',
        createdAt: new Date(now.getTime() - 3000) // 3 seconds ago
      });

      // Act
      const recentConversations = await Conversation.findRecentByChatbot(chatbotId, 2);

      // Assert
      expect(recentConversations).toHaveLength(2);
      expect(recentConversations[0].sessionId).toBe('recent-1');
      expect(recentConversations[1].sessionId).toBe('recent-2');
    });
  });

  describe('Indexes', () => {
    it('should create indexes for efficient querying', async () => {
      // This test verifies that the necessary indexes exist
      // We can check the collection's indexes
      const indexes = await Conversation.collection.indexes();
      
      // Convert indexes to a more easily testable format
      const indexFields = indexes.map(index => Object.keys(index.key));
      
      // Check for expected indexes
      expect(indexFields).toEqual(
        expect.arrayContaining([
          ['_id'],
          ['chatbotId'],
          ['userId'],
          ['sessionId'],
          ['status']
        ])
      );
    });
  });
});
