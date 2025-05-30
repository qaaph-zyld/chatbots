/**
 * Preference Service Unit Tests
 */

const mongoose = require('mongoose');
const sinon = require('sinon');
const { mockDeep } = require('jest-mock-extended');

// Import the service to test
const preferenceService = require('../../../services/preference.service');

// Import models and dependencies
const Preference = require('../../../models/preference.model');
const { logger } = require('../../../utils');

// Import test utilities
const { createMockModel } = require('../../utils/mock-factory');

// Mock dependencies
jest.mock('../../../models/preference.model');
jest.mock('../../../utils', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('Preference Service', () => {
  // Setup before each test
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  // Test setting a user preference
  describe('setPreference', () => {
    it('should set a new preference successfully', async () => {
      // Arrange
      const preferenceData = {
        chatbotId: new mongoose.Types.ObjectId(),
        userId: 'user123',
        category: 'communication',
        key: 'responseStyle',
        value: 'concise',
        source: 'explicit'
      };
      
      // Mock that preference doesn't exist yet
      Preference.findOne = jest.fn().mockResolvedValue(null);
      
      const savedPreference = {
        ...preferenceData,
        _id: new mongoose.Types.ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      Preference.prototype.save = jest.fn().mockResolvedValue(savedPreference);
      
      // Act
      const result = await preferenceService.setPreference(preferenceData);
      
      // Assert
      expect(Preference.findOne).toHaveBeenCalledWith({
        chatbotId: preferenceData.chatbotId,
        userId: preferenceData.userId,
        category: preferenceData.category,
        key: preferenceData.key
      });
      expect(Preference.prototype.save).toHaveBeenCalled();
      expect(result).toEqual(savedPreference);
      expect(logger.info).toHaveBeenCalledWith(`Preference set: ${savedPreference._id}`);
    });
    
    it('should update an existing preference', async () => {
      // Arrange
      const preferenceData = {
        chatbotId: new mongoose.Types.ObjectId(),
        userId: 'user123',
        category: 'communication',
        key: 'responseStyle',
        value: 'detailed',
        source: 'explicit'
      };
      
      const existingPreference = {
        _id: new mongoose.Types.ObjectId(),
        chatbotId: preferenceData.chatbotId,
        userId: preferenceData.userId,
        category: preferenceData.category,
        key: preferenceData.key,
        value: 'concise',
        source: 'implicit',
        createdAt: new Date(Date.now() - 86400000), // 1 day ago
        updatedAt: new Date(Date.now() - 86400000),
        save: jest.fn()
      };
      
      Preference.findOne = jest.fn().mockResolvedValue(existingPreference);
      
      const updatedPreference = {
        ...existingPreference,
        value: preferenceData.value,
        source: preferenceData.source,
        updatedAt: new Date()
      };
      
      existingPreference.save.mockResolvedValue(updatedPreference);
      
      // Act
      const result = await preferenceService.setPreference(preferenceData);
      
      // Assert
      expect(Preference.findOne).toHaveBeenCalledWith({
        chatbotId: preferenceData.chatbotId,
        userId: preferenceData.userId,
        category: preferenceData.category,
        key: preferenceData.key
      });
      expect(existingPreference.save).toHaveBeenCalled();
      expect(existingPreference.value).toBe(preferenceData.value);
      expect(existingPreference.source).toBe(preferenceData.source);
      expect(result).toEqual(updatedPreference);
    });
  });
  
  // Test getting user preferences
  describe('getUserPreferences', () => {
    it('should get all preferences for a user', async () => {
      // Arrange
      const chatbotId = new mongoose.Types.ObjectId();
      const userId = 'user123';
      
      const mockPreferences = [
        {
          _id: new mongoose.Types.ObjectId(),
          chatbotId,
          userId,
          category: 'communication',
          key: 'responseStyle',
          value: 'concise',
          source: 'explicit'
        },
        {
          _id: new mongoose.Types.ObjectId(),
          chatbotId,
          userId,
          category: 'interface',
          key: 'theme',
          value: 'dark',
          source: 'implicit'
        }
      ];
      
      Preference.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockPreferences)
        })
      });
      
      // Act
      const result = await preferenceService.getUserPreferences(chatbotId, userId);
      
      // Assert
      expect(Preference.find).toHaveBeenCalledWith({ chatbotId, userId });
      expect(result).toEqual(mockPreferences);
    });
    
    it('should get preferences for a specific category', async () => {
      // Arrange
      const chatbotId = new mongoose.Types.ObjectId();
      const userId = 'user123';
      const category = 'communication';
      
      const mockPreferences = [
        {
          _id: new mongoose.Types.ObjectId(),
          chatbotId,
          userId,
          category,
          key: 'responseStyle',
          value: 'concise',
          source: 'explicit'
        },
        {
          _id: new mongoose.Types.ObjectId(),
          chatbotId,
          userId,
          category,
          key: 'language',
          value: 'en',
          source: 'explicit'
        }
      ];
      
      Preference.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockPreferences)
        })
      });
      
      // Act
      const result = await preferenceService.getUserPreferences(chatbotId, userId, category);
      
      // Assert
      expect(Preference.find).toHaveBeenCalledWith({ chatbotId, userId, category });
      expect(result).toEqual(mockPreferences);
    });
  });
  
  // Test getting a specific preference
  describe('getPreference', () => {
    it('should get a specific preference by key', async () => {
      // Arrange
      const chatbotId = new mongoose.Types.ObjectId();
      const userId = 'user123';
      const category = 'communication';
      const key = 'responseStyle';
      
      const mockPreference = {
        _id: new mongoose.Types.ObjectId(),
        chatbotId,
        userId,
        category,
        key,
        value: 'concise',
        source: 'explicit'
      };
      
      Preference.findOne = jest.fn().mockResolvedValue(mockPreference);
      
      // Act
      const result = await preferenceService.getPreference(chatbotId, userId, category, key);
      
      // Assert
      expect(Preference.findOne).toHaveBeenCalledWith({ chatbotId, userId, category, key });
      expect(result).toEqual(mockPreference);
    });
    
    it('should return null when preference not found', async () => {
      // Arrange
      const chatbotId = new mongoose.Types.ObjectId();
      const userId = 'user123';
      const category = 'communication';
      const key = 'nonExistentKey';
      
      Preference.findOne = jest.fn().mockResolvedValue(null);
      
      // Act
      const result = await preferenceService.getPreference(chatbotId, userId, category, key);
      
      // Assert
      expect(Preference.findOne).toHaveBeenCalledWith({ chatbotId, userId, category, key });
      expect(result).toBeNull();
    });
  });
});
