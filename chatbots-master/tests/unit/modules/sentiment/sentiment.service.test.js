/**
 * Sentiment Analysis Service Unit Tests
 * 
 * Tests for the message sentiment analysis functionality
 */

// Register module aliases before any other imports
require('@src/core/module-alias');

// Import the service and repository
const { SentimentService } = require('@modules/sentiment/services/sentiment.service');
const { SentimentRepository } = require('@modules/sentiment/repositories/sentiment.repository');

// Mock the repository
jest.mock('@modules/sentiment/repositories/sentiment.repository');

describe('SentimentService', () => {
  let sentimentService;
  let mockSentimentRepository;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create a new instance of the mock repository
    mockSentimentRepository = new SentimentRepository();
    
    // Create a new instance of the service with the mock repository
    sentimentService = new SentimentService(mockSentimentRepository);
  });

  describe('analyzeSentiment', () => {
    it('should analyze sentiment of a message', async () => {
      // Arrange
      const message = 'I am very happy with the service';
      const mockSentimentResult = {
        text: message,
        sentiment: 'positive',
        score: 0.8,
        confidence: 0.9,
        language: 'en'
      };
      
      // Mock the repository method
      mockSentimentRepository.analyzeSentiment.mockResolvedValue(mockSentimentResult);
      
      // Act
      const result = await sentimentService.analyzeSentiment(message);
      
      // Assert
      expect(result).toEqual(mockSentimentResult);
      expect(mockSentimentRepository.analyzeSentiment).toHaveBeenCalledWith(message);
    });

    it('should handle neutral sentiment', async () => {
      // Arrange
      const message = 'This is a regular message with no strong emotions';
      const mockSentimentResult = {
        text: message,
        sentiment: 'neutral',
        score: 0.1,
        confidence: 0.7,
        language: 'en'
      };
      
      // Mock the repository method
      mockSentimentRepository.analyzeSentiment.mockResolvedValue(mockSentimentResult);
      
      // Act
      const result = await sentimentService.analyzeSentiment(message);
      
      // Assert
      expect(result).toEqual(mockSentimentResult);
      expect(result.sentiment).toBe('neutral');
    });

    it('should handle negative sentiment', async () => {
      // Arrange
      const message = 'I am very disappointed with the service';
      const mockSentimentResult = {
        text: message,
        sentiment: 'negative',
        score: -0.7,
        confidence: 0.85,
        language: 'en'
      };
      
      // Mock the repository method
      mockSentimentRepository.analyzeSentiment.mockResolvedValue(mockSentimentResult);
      
      // Act
      const result = await sentimentService.analyzeSentiment(message);
      
      // Assert
      expect(result).toEqual(mockSentimentResult);
      expect(result.sentiment).toBe('negative');
    });

    it('should handle empty messages', async () => {
      // Arrange
      const message = '';
      const mockSentimentResult = {
        text: message,
        sentiment: 'neutral',
        score: 0,
        confidence: 0,
        language: 'unknown'
      };
      
      // Mock the repository method
      mockSentimentRepository.analyzeSentiment.mockResolvedValue(mockSentimentResult);
      
      // Act
      const result = await sentimentService.analyzeSentiment(message);
      
      // Assert
      expect(result).toEqual(mockSentimentResult);
    });

    it('should throw an error when repository fails', async () => {
      // Arrange
      const message = 'Test message';
      const errorMessage = 'Sentiment analysis service unavailable';
      
      // Mock the repository method to throw an error
      mockSentimentRepository.analyzeSentiment.mockRejectedValue(new Error(errorMessage));
      
      // Act & Assert
      await expect(sentimentService.analyzeSentiment(message))
        .rejects
        .toThrow(errorMessage);
    });
  });

  describe('analyzeBatchSentiment', () => {
    it('should analyze sentiment of multiple messages', async () => {
      // Arrange
      const messages = [
        'I am very happy with the service',
        'This is a regular message',
        'I am very disappointed with the service'
      ];
      
      const mockSentimentResults = [
        {
          text: messages[0],
          sentiment: 'positive',
          score: 0.8,
          confidence: 0.9,
          language: 'en'
        },
        {
          text: messages[1],
          sentiment: 'neutral',
          score: 0.1,
          confidence: 0.7,
          language: 'en'
        },
        {
          text: messages[2],
          sentiment: 'negative',
          score: -0.7,
          confidence: 0.85,
          language: 'en'
        }
      ];
      
      // Mock the repository method
      mockSentimentRepository.analyzeBatchSentiment.mockResolvedValue(mockSentimentResults);
      
      // Act
      const results = await sentimentService.analyzeBatchSentiment(messages);
      
      // Assert
      expect(results).toEqual(mockSentimentResults);
      expect(mockSentimentRepository.analyzeBatchSentiment).toHaveBeenCalledWith(messages);
      expect(results.length).toBe(3);
    });

    it('should handle empty array', async () => {
      // Arrange
      const messages = [];
      
      // Mock the repository method
      mockSentimentRepository.analyzeBatchSentiment.mockResolvedValue([]);
      
      // Act
      const results = await sentimentService.analyzeBatchSentiment(messages);
      
      // Assert
      expect(results).toEqual([]);
      expect(mockSentimentRepository.analyzeBatchSentiment).toHaveBeenCalledWith(messages);
    });

    it('should throw an error when repository fails for batch analysis', async () => {
      // Arrange
      const messages = ['Message 1', 'Message 2'];
      const errorMessage = 'Batch sentiment analysis failed';
      
      // Mock the repository method to throw an error
      mockSentimentRepository.analyzeBatchSentiment.mockRejectedValue(new Error(errorMessage));
      
      // Act & Assert
      await expect(sentimentService.analyzeBatchSentiment(messages))
        .rejects
        .toThrow(errorMessage);
    });
  });
});
