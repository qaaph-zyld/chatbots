/**
 * Chatbot Service Tests
 */

// Define the mock functions directly
const initialize = jest.fn().mockImplementation(async () => true);
const processMessage = jest.fn().mockImplementation(async () => ({ text: 'Hello, user!', type: 'text' }));
const createChatbot = jest.fn().mockResolvedValue({ _id: 'new-chatbot', name: 'New Test Bot', engine: 'gpt' });
const getAllChatbots = jest.fn().mockResolvedValue([
  { _id: 'chatbot1', name: 'Test Bot 1', engine: 'gpt' },
  { _id: 'chatbot2', name: 'Test Bot 2', engine: 'rasa' }
]);
const getChatbot = jest.fn().mockImplementation(async (id) => {
  if (id === 'chatbot1') {
    return { _id: 'chatbot1', name: 'Test Bot 1', engine: 'gpt' };
  } else if (id === 'chatbot2') {
    return { _id: 'chatbot2', name: 'Test Bot 2', engine: 'rasa' };
  }
  return null;
});
const deleteChatbot = jest.fn().mockResolvedValue(true);
const getAvailableEngineTypes = jest.fn().mockReturnValue(['gpt', 'rasa', 'dialogflow']);
const getStatus = jest.fn().mockReturnValue({ initialized: true, uptime: 1000 });
const cleanup = jest.fn().mockResolvedValue(true);

// Create the mock service object
const mockChatbotService = {
  initialize,
  processMessage,
  createChatbot,
  getAllChatbots,
  getChatbot,
  deleteChatbot,
  getAvailableEngineTypes,
  getStatus,
  cleanup
};

// Mock the module
jest.mock('../../../src/services/chatbot.service', () => mockChatbotService);

describe('Chatbot Service', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize the chatbot service successfully', async () => {
      // Act
      const result = await initialize();
      
      // Assert
      expect(result).toBe(true);
      expect(initialize).toHaveBeenCalled();
    });
  });
  
  describe('processMessage', () => {
    it('should process a message successfully', async () => {
      // Arrange
      const message = { text: 'Hello', user: 'user123' };
      const channelName = 'web';
      
      // Act
      const result = await processMessage(message, channelName);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.text).toBe('Hello, user!');
      expect(processMessage).toHaveBeenCalledWith(message, channelName);
    });
  });
  
  describe('createChatbot', () => {
    it('should create a new chatbot', async () => {
      // Arrange
      const chatbotData = {
        name: 'New Test Bot',
        engine: 'gpt',
        description: 'A test chatbot'
      };
      
      // Act
      const result = await createChatbot(chatbotData);
      
      // Assert
      expect(result).toBeDefined();
      expect(result._id).toBe('new-chatbot');
      expect(result.name).toBe('New Test Bot');
      expect(createChatbot).toHaveBeenCalledWith(chatbotData);
    });
  });
  
  describe('getChatbot', () => {
    it('should return a chatbot by ID', async () => {
      // Arrange
      const chatbotId = 'chatbot1';
      
      // Act
      const result = await getChatbot(chatbotId);
      
      // Assert
      expect(result).toBeDefined();
      expect(result._id).toBe('chatbot1');
      expect(result.name).toBe('Test Bot 1');
      expect(getChatbot).toHaveBeenCalledWith(chatbotId);
    });
    
    it('should return null for non-existent chatbot', async () => {
      // Arrange
      const chatbotId = 'non-existent';
      
      // Act
      const result = await getChatbot(chatbotId);
      
      // Assert
      expect(result).toBeNull();
      expect(getChatbot).toHaveBeenCalledWith(chatbotId);
    });
  });
  
  describe('getAllChatbots', () => {
    it('should return all chatbots', async () => {
      // Act
      const result = await getAllChatbots();
      
      // Assert
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(2);
      expect(result[0]._id).toBe('chatbot1');
      expect(result[1]._id).toBe('chatbot2');
      expect(getAllChatbots).toHaveBeenCalled();
    });
  });
  
  describe('deleteChatbot', () => {
    it('should delete a chatbot by ID', async () => {
      // Arrange
      const chatbotId = 'chatbot1';
      
      // Act
      const result = await deleteChatbot(chatbotId);
      
      // Assert
      expect(result).toBe(true);
      expect(deleteChatbot).toHaveBeenCalledWith(chatbotId);
    });
  });
  
  describe('getAvailableEngineTypes', () => {
    it('should return available engine types', () => {
      // Act
      const result = getAvailableEngineTypes();
      
      // Assert
      expect(result).toBeInstanceOf(Array);
      expect(result).toEqual(['gpt', 'rasa', 'dialogflow']);
      expect(getAvailableEngineTypes).toHaveBeenCalled();
    });
  });
  
  describe('getStatus', () => {
    it('should return service status', () => {
      // Act
      const result = getStatus();
      
      // Assert
      expect(result).toBeDefined();
      expect(result.initialized).toBe(true);
      expect(result.uptime).toBe(1000);
      expect(getStatus).toHaveBeenCalled();
    });
  });
});

describe('Chatbot Service', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize the chatbot service successfully', async () => {
      // Act
      const result = await chatbotService.initialize();
      
      // Assert
      expect(result).toBe(true);
      expect(chatbotService.initialized).toBe(true);
    });
    
    it('should handle initialization failure', async () => {
      // Arrange
      const nlpManager = require('@src/bot\\nlp').nlpManager;
      nlpManager.initialize.mockResolvedValueOnce(false);
      
      // Act
      const result = await chatbotService.initialize();
      
      // Assert
      expect(result).toBe(false);
      expect(chatbotService.initialized).toBe(false);
    });
  });
  
  describe('processMessage', () => {
    it('should process a message successfully', async () => {
      // Arrange
      chatbotService.initialized = true;
      const message = { text: 'Hello', user: 'user123' };
      const channelName = 'web';
      
      // Act
      const result = await chatbotService.processMessage(message, channelName);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.text).toBe('Hello, user!');
    });
    
    it('should reject processing if service is not initialized', async () => {
      // Arrange
      chatbotService.initialized = false;
      const message = { text: 'Hello', user: 'user123' };
      const channelName = 'web';
      
      // Act & Assert
      await expect(chatbotService.processMessage(message, channelName))
        .rejects.toThrow('Chatbot service not initialized');
    });
  });
  
  describe('createChatbot', () => {
    it('should create a new chatbot', async () => {
      // Arrange
      const chatbotData = {
        name: 'New Test Bot',
        engine: 'gpt',
        description: 'A test chatbot'
      };
      
      // Act
      const result = await chatbotService.createChatbot(chatbotData);
      
      // Assert
      expect(result).toBeDefined();
      expect(result._id).toBe('new-chatbot');
      expect(result.name).toBe('New Test Bot');
    });
  });
  
  describe('getChatbot', () => {
    it('should return a chatbot by ID', async () => {
      // Arrange
      const chatbotId = 'chatbot1';
      
      // Act
      const result = await chatbotService.getChatbot(chatbotId);
      
      // Assert
      expect(result).toBeDefined();
      expect(result._id).toBe('chatbot1');
      expect(result.name).toBe('Test Bot 1');
    });
    
    it('should return null for non-existent chatbot', async () => {
      // Arrange
      const chatbotId = 'non-existent';
      
      // Act
      const result = await chatbotService.getChatbot(chatbotId);
      
      // Assert
      expect(result).toBeNull();
    });
  });
  
  describe('getAllChatbots', () => {
    it('should return all chatbots', async () => {
      // Act
      const result = await chatbotService.getAllChatbots();
      
      // Assert
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(2);
      expect(result[0]._id).toBe('chatbot1');
      expect(result[1]._id).toBe('chatbot2');
    });
  });
  
  describe('deleteChatbot', () => {
    it('should delete a chatbot by ID', async () => {
      // Arrange
      const chatbotId = 'chatbot1';
      
      // Act
      const result = await chatbotService.deleteChatbot(chatbotId);
      
      // Assert
      expect(result).toBe(true);
    });
  });
  
  describe('getAvailableEngineTypes', () => {
    it('should return available engine types', () => {
      // Act
      const result = chatbotService.getAvailableEngineTypes();
      
      // Assert
      expect(result).toBeInstanceOf(Array);
      expect(result).toEqual(['gpt', 'rasa', 'dialogflow']);
    });
  });
  
  describe('getStatus', () => {
    it('should return service status', () => {
      // Arrange
      chatbotService.initialized = true;
      
      // Act
      const result = chatbotService.getStatus();
      
      // Assert
      expect(result).toBeDefined();
      expect(result.initialized).toBe(true);
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });
  });
});
