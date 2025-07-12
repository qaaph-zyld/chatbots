/**
 * Chatbot Model Tests
 */

const mongoose = require('mongoose');
const Chatbot = require('../../../models/chatbot.model');

describe('Chatbot Model', () => {
  // Test data
  const validChatbotData = {
    name: 'Test Chatbot',
    description: 'A test chatbot for unit testing',
    ownerId: new mongoose.Types.ObjectId(),
    type: 'customer-support',
    engine: 'botpress',
    engineConfig: {
      apiKey: 'test-key',
      modelId: 'test-model'
    },
    personality: {
      tone: 'friendly',
      style: 'conversational',
      knowledge: 'technical'
    }
  };

  beforeEach(async () => {
    // Clear all chatbots before each test
    await Chatbot.deleteMany({});
  });

  describe('Validation', () => {
    it('should validate a valid chatbot', async () => {
      // Arrange & Act
      const chatbot = new Chatbot(validChatbotData);
      const validationError = chatbot.validateSync();

      // Assert
      expect(validationError).toBeUndefined();
    });

    it('should require name field', async () => {
      // Arrange
      const chatbotWithoutName = { ...validChatbotData };
      delete chatbotWithoutName.name;

      // Act
      const chatbot = new Chatbot(chatbotWithoutName);
      const validationError = chatbot.validateSync();

      // Assert
      expect(validationError).toBeDefined();
      expect(validationError.errors.name).toBeDefined();
      expect(validationError.errors.name.kind).toBe('required');
    });

    it('should require ownerId field', async () => {
      // Arrange
      const chatbotWithoutOwner = { ...validChatbotData };
      delete chatbotWithoutOwner.ownerId;

      // Act
      const chatbot = new Chatbot(chatbotWithoutOwner);
      const validationError = chatbot.validateSync();

      // Assert
      expect(validationError).toBeDefined();
      expect(validationError.errors.ownerId).toBeDefined();
      expect(validationError.errors.ownerId.kind).toBe('required');
    });

    it('should validate engine type', async () => {
      // Arrange
      const chatbotWithInvalidEngine = { 
        ...validChatbotData,
        engine: 'invalid-engine' 
      };

      // Act
      const chatbot = new Chatbot(chatbotWithInvalidEngine);
      const validationError = chatbot.validateSync();

      // Assert
      expect(validationError).toBeDefined();
      expect(validationError.errors.engine).toBeDefined();
      expect(validationError.errors.engine.kind).toBe('enum');
    });

    it('should validate chatbot type', async () => {
      // Arrange
      const chatbotWithInvalidType = { 
        ...validChatbotData,
        type: 'invalid-type' 
      };

      // Act
      const chatbot = new Chatbot(chatbotWithInvalidType);
      const validationError = chatbot.validateSync();

      // Assert
      expect(validationError).toBeDefined();
      expect(validationError.errors.type).toBeDefined();
      expect(validationError.errors.type.kind).toBe('enum');
    });

    it('should set default values', async () => {
      // Arrange
      const minimalChatbotData = {
        name: 'Minimal Chatbot',
        ownerId: new mongoose.Types.ObjectId()
      };

      // Act
      const chatbot = new Chatbot(minimalChatbotData);

      // Assert
      expect(chatbot.type).toBe('custom');
      expect(chatbot.engine).toBe('botpress');
      expect(chatbot.engineConfig).toEqual({});
      expect(chatbot.personality).toEqual({
        tone: 'professional',
        style: 'helpful',
        knowledge: 'general'
      });
      expect(chatbot.isPublic).toBe(false);
      expect(chatbot.isActive).toBe(true);
    });
  });

  describe('Methods', () => {
    it('should check if user has access to chatbot', async () => {
      // Arrange
      const ownerId = new mongoose.Types.ObjectId();
      const otherUserId = new mongoose.Types.ObjectId();
      
      const chatbot = new Chatbot({
        ...validChatbotData,
        ownerId,
        collaborators: [otherUserId]
      });

      // Act & Assert
      expect(chatbot.hasAccess(ownerId.toString())).toBe(true);
      expect(chatbot.hasAccess(otherUserId.toString())).toBe(true);
      expect(chatbot.hasAccess(new mongoose.Types.ObjectId().toString())).toBe(false);
    });

    it('should check if public chatbot is accessible to anyone', async () => {
      // Arrange
      const chatbot = new Chatbot({
        ...validChatbotData,
        isPublic: true
      });
      const randomUserId = new mongoose.Types.ObjectId().toString();

      // Act & Assert
      expect(chatbot.hasAccess(randomUserId)).toBe(true);
    });
  });

  describe('Statics', () => {
    it('should find chatbots by user', async () => {
      // Arrange
      const ownerId = new mongoose.Types.ObjectId();
      const otherUserId = new mongoose.Types.ObjectId();
      
      // Create chatbots with different owners
      await Chatbot.create({
        ...validChatbotData,
        name: 'Owner Chatbot',
        ownerId
      });
      
      await Chatbot.create({
        ...validChatbotData,
        name: 'Collaborator Chatbot',
        ownerId: otherUserId,
        collaborators: [ownerId]
      });
      
      await Chatbot.create({
        ...validChatbotData,
        name: 'Other Chatbot',
        ownerId: otherUserId
      });

      // Act
      const userChatbots = await Chatbot.findByUser(ownerId);

      // Assert
      expect(userChatbots).toHaveLength(2);
      expect(userChatbots.map(c => c.name)).toContain('Owner Chatbot');
      expect(userChatbots.map(c => c.name)).toContain('Collaborator Chatbot');
      expect(userChatbots.map(c => c.name)).not.toContain('Other Chatbot');
    });

    it('should find public chatbots', async () => {
      // Arrange
      await Chatbot.create({
        ...validChatbotData,
        name: 'Public Chatbot',
        isPublic: true
      });
      
      await Chatbot.create({
        ...validChatbotData,
        name: 'Private Chatbot',
        isPublic: false
      });

      // Act
      const publicChatbots = await Chatbot.findPublic();

      // Assert
      expect(publicChatbots).toHaveLength(1);
      expect(publicChatbots[0].name).toBe('Public Chatbot');
    });
  });

  describe('Indexes', () => {
    it('should create a compound index on ownerId and name', async () => {
      // Arrange
      const ownerId = new mongoose.Types.ObjectId();
      
      // Create a chatbot
      await Chatbot.create({
        ...validChatbotData,
        ownerId,
        name: 'Unique Name'
      });
      
      // Try to create another chatbot with the same name and owner
      const duplicateChatbot = new Chatbot({
        ...validChatbotData,
        ownerId,
        name: 'Unique Name'
      });

      // Act & Assert
      // This should fail due to the unique compound index
      await expect(duplicateChatbot.save()).rejects.toThrow();
    });
  });

  describe('Virtuals', () => {
    it('should have a displayName virtual', async () => {
      // Arrange
      const chatbot = new Chatbot({
        ...validChatbotData,
        name: 'Test Bot'
      });

      // Act & Assert
      expect(chatbot.displayName).toBe('Test Bot');
    });
  });
});
