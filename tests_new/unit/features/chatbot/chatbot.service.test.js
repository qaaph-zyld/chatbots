/**
 * Chatbot Service Tests
 */

const ChatbotService = require('../../../../src_new/features/chatbot/chatbot.service');

describe('ChatbotService', () => {
  let chatbotService;

  beforeEach(() => {
    chatbotService = new ChatbotService();
    // Register a mock engine for testing
    const mockEngine = {
      processMessage: jest.fn().mockResolvedValue({ content: 'Mock response' }),
      initialize: jest.fn().mockResolvedValue(true)
    };
    chatbotService.registerEngine('default', mockEngine);
  });

  describe('createChatbot', () => {
    it('should create a new chatbot successfully', async () => {
      const chatbotData = {
        name: 'Test Bot',
        description: 'A test chatbot',
        engine: 'default'
      };

      const result = await chatbotService.createChatbot(chatbotData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Test Bot');
      expect(result.description).toBe('A test chatbot');
      expect(result.engine).toBe('default');
      expect(result.isActive).toBe(true);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should throw error for non-existent engine', async () => {
      const chatbotData = {
        name: 'Test Bot',
        engine: 'non-existent'
      };

      await expect(chatbotService.createChatbot(chatbotData))
        .rejects.toThrow("Engine 'non-existent' not found");
    });
  });

  describe('getChatbot', () => {
    it('should return chatbot by ID', async () => {
      const chatbotData = { name: 'Test Bot', engine: 'default' };
      const created = await chatbotService.createChatbot(chatbotData);
      
      const result = chatbotService.getChatbot(created.id);
      
      expect(result).toBeDefined();
      expect(result.id).toBe(created.id);
    });

    it('should return null for non-existent ID', () => {
      const result = chatbotService.getChatbot('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('updateChatbot', () => {
    it('should update chatbot successfully', async () => {
      const chatbotData = { name: 'Test Bot', engine: 'default' };
      const created = await chatbotService.createChatbot(chatbotData);
      
      const updates = { name: 'Updated Bot', isActive: false };
      const result = await chatbotService.updateChatbot(created.id, updates);
      
      expect(result.name).toBe('Updated Bot');
      expect(result.isActive).toBe(false);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw error for non-existent chatbot', async () => {
      await expect(chatbotService.updateChatbot('non-existent', {}))
        .rejects.toThrow("Chatbot with ID 'non-existent' not found");
    });
  });

  describe('deleteChatbot', () => {
    it('should delete chatbot successfully', async () => {
      const chatbotData = { name: 'Test Bot', engine: 'default' };
      const created = await chatbotService.createChatbot(chatbotData);
      
      const result = await chatbotService.deleteChatbot(created.id);
      
      expect(result).toBe(true);
      expect(chatbotService.getChatbot(created.id)).toBeNull();
    });
  });

  describe('processMessage', () => {
    it('should process message successfully', async () => {
      const chatbotData = { name: 'Test Bot', engine: 'default' };
      const created = await chatbotService.createChatbot(chatbotData);
      
      const result = await chatbotService.processMessage(created.id, 'Hello');
      
      expect(result).toBeDefined();
      expect(result.content).toBe('Mock response');
    });

    it('should throw error for inactive chatbot', async () => {
      const chatbotData = { name: 'Test Bot', engine: 'default', isActive: false };
      const created = await chatbotService.createChatbot(chatbotData);
      
      await expect(chatbotService.processMessage(created.id, 'Hello'))
        .rejects.toThrow("Chatbot 'Test Bot' is not active");
    });
  });
});
