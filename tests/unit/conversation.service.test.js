/**
 * Conversation Service Tests
 * 
 * Unit tests for the conversation service
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const conversationService = require('../../services/conversation.service');
const Conversation = require('../../database/schemas/conversation.schema');

// Mock logger to prevent console output during tests
jest.mock('../../utils', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

describe('Conversation Service', () => {
  let mongoServer;
  
  // Set up in-memory MongoDB server before tests
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    await mongoose.connect(uri, {
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
    await Conversation.deleteMany({});
  });
  
  describe('createConversation', () => {
    it('should create a new conversation', async () => {
      const chatbotId = new mongoose.Types.ObjectId().toString();
      const userId = 'test-user';
      const initialContext = { language: 'en' };
      
      const conversation = await conversationService.createConversation(
        chatbotId,
        userId,
        initialContext
      );
      
      expect(conversation).toBeDefined();
      expect(conversation.chatbotId.toString()).toBe(chatbotId);
      expect(conversation.userId).toBe(userId);
      expect(conversation.context).toEqual(initialContext);
      expect(conversation.messages).toHaveLength(0);
      expect(conversation.isActive).toBe(true);
      expect(conversation.sessionId).toBeDefined();
    });
  });
  
  describe('getConversationById', () => {
    it('should retrieve a conversation by ID', async () => {
      // Create a conversation
      const chatbotId = new mongoose.Types.ObjectId().toString();
      const createdConversation = await conversationService.createConversation(chatbotId);
      
      // Retrieve the conversation
      const retrievedConversation = await conversationService.getConversationById(
        createdConversation._id
      );
      
      expect(retrievedConversation).toBeDefined();
      expect(retrievedConversation._id.toString()).toBe(createdConversation._id.toString());
    });
    
    it('should return null for non-existent conversation ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const conversation = await conversationService.getConversationById(nonExistentId);
      
      expect(conversation).toBeNull();
    });
  });
  
  describe('getConversationBySessionId', () => {
    it('should retrieve a conversation by session ID', async () => {
      // Create a conversation
      const chatbotId = new mongoose.Types.ObjectId().toString();
      const createdConversation = await conversationService.createConversation(chatbotId);
      
      // Retrieve the conversation by session ID
      const retrievedConversation = await conversationService.getConversationBySessionId(
        createdConversation.sessionId
      );
      
      expect(retrievedConversation).toBeDefined();
      expect(retrievedConversation.sessionId).toBe(createdConversation.sessionId);
    });
    
    it('should return null for non-existent session ID', async () => {
      const nonExistentSessionId = 'non-existent-session';
      const conversation = await conversationService.getConversationBySessionId(nonExistentSessionId);
      
      expect(conversation).toBeNull();
    });
  });
  
  describe('addMessage', () => {
    it('should add a message to the conversation', async () => {
      // Create a conversation
      const chatbotId = new mongoose.Types.ObjectId().toString();
      const createdConversation = await conversationService.createConversation(chatbotId);
      
      // Add a message
      const messageText = 'Hello, chatbot!';
      const sender = 'user';
      const metadata = { timestamp: new Date().toISOString() };
      
      const updatedConversation = await conversationService.addMessage(
        createdConversation._id,
        messageText,
        sender,
        metadata
      );
      
      expect(updatedConversation.messages).toHaveLength(1);
      expect(updatedConversation.messages[0].text).toBe(messageText);
      expect(updatedConversation.messages[0].sender).toBe(sender);
      expect(updatedConversation.messages[0].metadata).toEqual(metadata);
    });
    
    it('should throw an error for non-existent conversation ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      
      await expect(
        conversationService.addMessage(nonExistentId, 'Hello', 'user')
      ).rejects.toThrow();
    });
  });
  
  describe('updateContext', () => {
    it('should update the conversation context', async () => {
      // Create a conversation with initial context
      const chatbotId = new mongoose.Types.ObjectId().toString();
      const initialContext = { language: 'en' };
      const createdConversation = await conversationService.createConversation(
        chatbotId,
        'test-user',
        initialContext
      );
      
      // Update the context
      const contextUpdate = { topic: 'weather', location: 'New York' };
      const updatedConversation = await conversationService.updateContext(
        createdConversation._id,
        contextUpdate,
        true // Merge with existing context
      );
      
      // Check that context was merged correctly
      expect(updatedConversation.context).toEqual({
        language: 'en',
        topic: 'weather',
        location: 'New York'
      });
    });
    
    it('should replace the conversation context when merge is false', async () => {
      // Create a conversation with initial context
      const chatbotId = new mongoose.Types.ObjectId().toString();
      const initialContext = { language: 'en' };
      const createdConversation = await conversationService.createConversation(
        chatbotId,
        'test-user',
        initialContext
      );
      
      // Replace the context
      const newContext = { topic: 'weather', location: 'New York' };
      const updatedConversation = await conversationService.updateContext(
        createdConversation._id,
        newContext,
        false // Replace existing context
      );
      
      // Check that context was replaced
      expect(updatedConversation.context).toEqual(newContext);
      expect(updatedConversation.context.language).toBeUndefined();
    });
  });
  
  describe('endConversation', () => {
    it('should mark a conversation as inactive', async () => {
      // Create a conversation
      const chatbotId = new mongoose.Types.ObjectId().toString();
      const createdConversation = await conversationService.createConversation(chatbotId);
      
      // End the conversation
      const endedConversation = await conversationService.endConversation(createdConversation._id);
      
      expect(endedConversation.isActive).toBe(false);
    });
  });
  
  describe('deleteConversation', () => {
    it('should delete a conversation', async () => {
      // Create a conversation
      const chatbotId = new mongoose.Types.ObjectId().toString();
      const createdConversation = await conversationService.createConversation(chatbotId);
      
      // Delete the conversation
      const result = await conversationService.deleteConversation(createdConversation._id);
      
      expect(result).toBe(true);
      
      // Verify the conversation was deleted
      const deletedConversation = await conversationService.getConversationById(createdConversation._id);
      expect(deletedConversation).toBeNull();
    });
    
    it('should return false when trying to delete a non-existent conversation', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const result = await conversationService.deleteConversation(nonExistentId);
      
      expect(result).toBe(false);
    });
  });
});
