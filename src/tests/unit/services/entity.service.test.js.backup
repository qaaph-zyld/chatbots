/**
 * Entity Service Unit Tests
 */

const mongoose = require('mongoose');
const sinon = require('sinon');
const { mockDeep } = require('jest-mock-extended');

// Import the service to test
require('@src/services\entity.service');

// Import models and dependencies
require('@src/models\entity.model');
require('@src/models\entity-relation.model');
require('@src/models\entity-reference.model');
require('@src/utils');

// Import test utilities
require('@src/tests\utils\mock-factory');

// Mock dependencies
jest.mock('../../../models/entity.model');
jest.mock('../../../models/entity-relation.model');
jest.mock('../../../models/entity-reference.model');
jest.mock('../../../utils', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('Entity Service', () => {
  // Setup before each test
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  // Test creating an entity
  describe('createEntity', () => {
    it('should create an entity successfully', async () => {
      // Arrange
      const entityData = {
        chatbotId: new mongoose.Types.ObjectId(),
        userId: 'user123',
        name: 'Test Entity',
        type: 'person',
        attributes: { age: 30, occupation: 'developer' }
      };
      
      const savedEntity = {
        ...entityData,
        _id: new mongoose.Types.ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      Entity.prototype.save = jest.fn().mockResolvedValue(savedEntity);
      
      // Act
      const result = await entityService.createEntity(entityData);
      
      // Assert
      expect(Entity.prototype.save).toHaveBeenCalled();
      expect(result).toEqual(savedEntity);
      expect(logger.info).toHaveBeenCalledWith(`Entity created: ${savedEntity._id}`);
    });
    
    it('should handle errors when creating an entity', async () => {
      // Arrange
      const entityData = {
        chatbotId: new mongoose.Types.ObjectId(),
        userId: 'user123',
        name: 'Test Entity',
        type: 'person'
      };
      
      const error = new Error('Database error');
      Entity.prototype.save = jest.fn().mockRejectedValue(error);
      
      // Act & Assert
      await expect(entityService.createEntity(entityData)).rejects.toThrow(error);
      expect(logger.error).toHaveBeenCalledWith(`Error creating entity: ${error.message}`, error);
    });
  });
  
  // Test getting entities by user
  describe('getEntitiesByUser', () => {
    it('should get all entities for a user', async () => {
      // Arrange
      const chatbotId = new mongoose.Types.ObjectId();
      const userId = 'user123';
      
      const mockEntities = [
        {
          _id: new mongoose.Types.ObjectId(),
          chatbotId,
          userId,
          name: 'Entity 1',
          type: 'person',
          attributes: { age: 30 }
        },
        {
          _id: new mongoose.Types.ObjectId(),
          chatbotId,
          userId,
          name: 'Entity 2',
          type: 'location',
          attributes: { country: 'USA' }
        }
      ];
      
      Entity.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockEntities)
        })
      });
      
      // Act
      const result = await entityService.getEntitiesByUser(chatbotId, userId);
      
      // Assert
      expect(Entity.find).toHaveBeenCalledWith({ chatbotId, userId });
      expect(result).toEqual(mockEntities);
    });
  });
  
  // Test adding entity relation
  describe('addEntityRelation', () => {
    it('should create a relation between two entities', async () => {
      // Arrange
      const relationData = {
        chatbotId: new mongoose.Types.ObjectId(),
        userId: 'user123',
        sourceEntityId: new mongoose.Types.ObjectId(),
        targetEntityId: new mongoose.Types.ObjectId(),
        relationType: 'friend',
        strength: 0.8
      };
      
      const savedRelation = {
        ...relationData,
        _id: new mongoose.Types.ObjectId(),
        createdAt: new Date()
      };
      
      EntityRelation.prototype.save = jest.fn().mockResolvedValue(savedRelation);
      
      // Act
      const result = await entityService.addEntityRelation(relationData);
      
      // Assert
      expect(EntityRelation.prototype.save).toHaveBeenCalled();
      expect(result).toEqual(savedRelation);
    });
  });
  
  // Test adding entity reference
  describe('addEntityReference', () => {
    it('should add a reference to an entity in a conversation', async () => {
      // Arrange
      const referenceData = {
        chatbotId: new mongoose.Types.ObjectId(),
        userId: 'user123',
        entityId: new mongoose.Types.ObjectId(),
        conversationId: new mongoose.Types.ObjectId(),
        messageId: new mongoose.Types.ObjectId(),
        mentionIndex: 1
      };
      
      const savedReference = {
        ...referenceData,
        _id: new mongoose.Types.ObjectId(),
        timestamp: new Date()
      };
      
      EntityReference.prototype.save = jest.fn().mockResolvedValue(savedReference);
      
      // Act
      const result = await entityService.addEntityReference(referenceData);
      
      // Assert
      expect(EntityReference.prototype.save).toHaveBeenCalled();
      expect(result).toEqual(savedReference);
    });
  });
});
