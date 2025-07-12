/**
 * Conversation Service Unit Tests
 * 
 * Tests for the conversation history pagination functionality
 */

// Register module aliases before any other imports
require('@src/core/module-alias');

// Import the service and repository
const { ConversationService } = require('@modules/conversation/services/conversation.service');
const { ConversationRepository } = require('@modules/conversation/repositories/conversation.repository');

// Mock the repository
jest.mock('@modules/conversation/repositories/conversation.repository');

describe('ConversationService', () => {
  let conversationService;
  let mockConversationRepository;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create a new instance of the mock repository
    mockConversationRepository = new ConversationRepository();
    
    // Create a new instance of the service with the mock repository
    conversationService = new ConversationService(mockConversationRepository);
  });

  describe('getConversationHistory', () => {
    it('should get paginated conversation history', async () => {
      // Arrange
      const userId = 'user123';
      const chatbotId = 'bot456';
      const page = 1;
      const limit = 10;
      
      const mockConversations = {
        conversations: [
          { 
            _id: 'conv1', 
            userId, 
            chatbotId, 
            messages: [
              { content: 'Hello', sender: 'user', timestamp: new Date() }
            ],
            createdAt: new Date(),
            updatedAt: new Date()
          },
          { 
            _id: 'conv2', 
            userId, 
            chatbotId, 
            messages: [
              { content: 'Hi there', sender: 'user', timestamp: new Date() }
            ],
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          pages: 1
        }
      };
      
      // Mock the repository method
      mockConversationRepository.getConversationHistory.mockResolvedValue(mockConversations);
      
      // Act
      const result = await conversationService.getConversationHistory(userId, chatbotId, page, limit);
      
      // Assert
      expect(result).toEqual(mockConversations);
      expect(mockConversationRepository.getConversationHistory).toHaveBeenCalledWith(userId, chatbotId, page, limit);
    });

    it('should use default pagination values when not provided', async () => {
      // Arrange
      const userId = 'user123';
      const chatbotId = 'bot456';
      
      const mockConversations = {
        conversations: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 20,
          pages: 0
        }
      };
      
      // Mock the repository method
      mockConversationRepository.getConversationHistory.mockResolvedValue(mockConversations);
      
      // Act
      const result = await conversationService.getConversationHistory(userId, chatbotId);
      
      // Assert
      expect(result).toEqual(mockConversations);
      expect(mockConversationRepository.getConversationHistory).toHaveBeenCalledWith(userId, chatbotId, 1, 20);
    });

    it('should throw an error when repository fails', async () => {
      // Arrange
      const userId = 'user123';
      const chatbotId = 'bot456';
      const errorMessage = 'Database error';
      
      // Mock the repository method to throw an error
      mockConversationRepository.getConversationHistory.mockRejectedValue(new Error(errorMessage));
      
      // Act & Assert
      await expect(conversationService.getConversationHistory(userId, chatbotId))
        .rejects
        .toThrow(errorMessage);
    });
  });
});
