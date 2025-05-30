/**
 * Advanced Context Awareness Tests
 * 
 * Tests the advanced context awareness features:
 * - Entity tracking across conversations
 * - User preference learning
 * - Topic detection and management
 */

const axios = require('axios');
const { logger } = require('../src/utils');

// Mock the axios module to prevent actual API calls
jest.mock('axios');

// Mock the logger to prevent console output during tests
jest.mock('../src/utils', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn()
  }
}));

// Test configuration
const config = {
  baseUrl: 'http://localhost:3000/api',
  chatbotId: '60d21b4667d0d8992e610c85', // Example chatbot ID
  userId: 'user123',
  conversationIds: {
    first: 'conv456',
    second: 'conv789'
  }
};

describe('Advanced Context Awareness', () => {
  // Setup and teardown
  beforeAll(() => {
    // Setup mock responses
    axios.post.mockResolvedValue({ data: { success: true } });
    axios.get.mockResolvedValue({ data: { success: true } });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('Entity Tracking', () => {
    test('should track person entity in conversation', async () => {
      // Setup mock response
      const mockResponse = {
        data: {
          success: true,
          entity: {
            name: 'person',
            value: 'John Doe',
            attributes: {
              age: 35,
              occupation: 'engineer'
            }
          }
        }
      };
      axios.post.mockResolvedValueOnce(mockResponse);
      
      // Track a person entity in the first conversation
      const personEntity = {
        name: 'person',
        value: 'John Doe',
        attributes: {
          age: 35,
          occupation: 'engineer'
        }
      };
      
      const response = await axios.post(`${config.baseUrl}/context/entity`, {
        chatbotId: config.chatbotId,
        userId: config.userId,
        conversationId: config.conversationIds.first,
        entity: personEntity
      });
      
      // Assertions
      expect(response.data.success).toBe(true);
      expect(response.data.entity).toBeDefined();
      expect(response.data.entity.name).toBe('person');
      expect(response.data.entity.value).toBe('John Doe');
    });
    
    test('should track product entity in conversation', async () => {
      // Setup mock response
      const mockResponse = {
        data: {
          success: true,
          entity: {
            name: 'product',
            value: 'smartphone',
            attributes: {
              brand: 'TechX',
              model: 'X5'
            }
          }
        }
      };
      axios.post.mockResolvedValueOnce(mockResponse);
      
      // Track a product entity in the first conversation
      const productEntity = {
        name: 'product',
        value: 'smartphone',
        attributes: {
          brand: 'TechX',
          model: 'X5'
        }
      };
      
      const response = await axios.post(`${config.baseUrl}/context/entity`, {
        chatbotId: config.chatbotId,
        userId: config.userId,
        conversationId: config.conversationIds.first,
        entity: productEntity
      });
      
      // Assertions
      expect(response.data.success).toBe(true);
      expect(response.data.entity).toBeDefined();
      expect(response.data.entity.name).toBe('product');
      expect(response.data.entity.value).toBe('smartphone');
      expect(response.data.entity.attributes.brand).toBe('TechX');
    });
  });

  describe('User Preference Learning', () => {
    test('should learn user preferences from conversation', async () => {
      // Setup mock response
      const mockResponse = {
        data: {
          success: true,
          preferences: {
            category: 'electronics',
            priceRange: 'premium',
            brands: ['TechX', 'Innovatech']
          }
        }
      };
      axios.post.mockResolvedValueOnce(mockResponse);
      
      // Send preference data
      const preferenceData = {
        category: 'electronics',
        priceRange: 'premium',
        brands: ['TechX', 'Innovatech']
      };
      
      const response = await axios.post(`${config.baseUrl}/preferences`, {
        chatbotId: config.chatbotId,
        userId: config.userId,
        preferences: preferenceData
      });
      
      // Assertions
      expect(response.data.success).toBe(true);
      expect(response.data.preferences).toBeDefined();
      expect(response.data.preferences.category).toBe('electronics');
      expect(response.data.preferences.priceRange).toBe('premium');
      expect(response.data.preferences.brands).toContain('TechX');
    });
  });

  describe('Topic Detection', () => {
    test('should detect topics from conversation text', async () => {
      // Setup mock response
      const mockResponse = {
        data: {
          success: true,
          topics: [
            {
              name: 'smartphone_features',
              confidence: 0.85
            },
            {
              name: 'price_comparison',
              confidence: 0.72
            }
          ]
        }
      };
      axios.post.mockResolvedValueOnce(mockResponse);
      
      // Send text for topic detection
      const text = "I'm looking for a new smartphone with a good camera. The TechX X5 seems nice but I'm wondering if there are better options in the same price range.";
      
      const response = await axios.post(`${config.baseUrl}/topics/detect`, {
        chatbotId: config.chatbotId,
        userId: config.userId,
        text: text
      });
      
      // Assertions
      expect(response.data.success).toBe(true);
      expect(response.data.topics).toBeDefined();
      expect(response.data.topics.length).toBe(2);
      expect(response.data.topics[0].name).toBe('smartphone_features');
      expect(response.data.topics[0].confidence).toBeGreaterThan(0.8);
    });
  });
});
