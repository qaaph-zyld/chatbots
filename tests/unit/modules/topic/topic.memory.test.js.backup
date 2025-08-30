/**
 * Topic Service Memory Server Tests
 * 
 * This file contains tests for the Topic service using MongoDB Memory Server.
 */

// Import module aliases before any other imports
require('@src/core/module-alias');

// Import mongoose and our test setup utilities
const mongoose = require('mongoose');
require('@tests/unit\setup\memory-server-setup');
const TopicModel = require('@domain/topic.model');
const TopicService = require('@modules/topic/topic.service');

// Test data
const sampleTopics = [
  {
    name: 'Weather',
    description: 'Weather-related conversations',
    keywords: ['weather', 'temperature', 'forecast', 'rain', 'sunny'],
    priority: 5
  },
  {
    name: 'Greetings',
    description: 'Greeting conversations',
    keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon'],
    priority: 10
  },
  {
    name: 'Help',
    description: 'Help-related conversations',
    keywords: ['help', 'support', 'assistance', 'guide', 'tutorial'],
    priority: 8
  }
];

describe('Topic Service with MongoDB Memory Server', () => {
  let topicService;

  // Set up before tests - MongoDB Memory Server is already started by memory-server-setup.js
  beforeAll(async () => {
    // Initialize service
    topicService = new TopicService();
  });

  // No need to clean up after tests - memory-server-setup.js handles this
  // The afterAll hook in memory-server-setup.js will disconnect and stop the server

  // Clear database and seed with test data between tests
  beforeEach(async () => {
    // Clear all collections using our utility
    await clearDatabase();
    
    // Seed with test data
    await TopicModel.insertMany(sampleTopics);
  });

  // Test cases
  describe('getAllTopics', () => {
    it('should return all topics', async () => {
      // Act
      const topics = await topicService.getAllTopics();
      
      // Assert
      expect(topics).toBeDefined();
      expect(Array.isArray(topics)).toBe(true);
      expect(topics.length).toBe(sampleTopics.length);
    });
  });

  describe('getTopicByName', () => {
    it('should return a topic by name', async () => {
      // Arrange
      const topicName = 'Weather';
      
      // Act
      const topic = await topicService.getTopicByName(topicName);
      
      // Assert
      expect(topic).toBeDefined();
      expect(topic.name).toBe(topicName);
      expect(topic.description).toBe('Weather-related conversations');
    });

    it('should return null for non-existent topic', async () => {
      // Arrange
      const topicName = 'NonExistent';
      
      // Act
      const topic = await topicService.getTopicByName(topicName);
      
      // Assert
      expect(topic).toBeNull();
    });
  });

  describe('createTopic', () => {
    it('should create a new topic', async () => {
      // Arrange
      const newTopic = {
        name: 'Sports',
        description: 'Sports-related conversations',
        keywords: ['sports', 'football', 'basketball', 'soccer', 'tennis'],
        priority: 6
      };
      
      // Act
      const createdTopic = await topicService.createTopic(newTopic);
      
      // Assert
      expect(createdTopic).toBeDefined();
      expect(createdTopic.name).toBe(newTopic.name);
      expect(createdTopic.description).toBe(newTopic.description);
      expect(createdTopic.keywords).toEqual(expect.arrayContaining(newTopic.keywords));
      expect(createdTopic.priority).toBe(newTopic.priority);
      
      // Verify it was saved to the database
      const savedTopic = await TopicModel.findOne({ name: newTopic.name });
      expect(savedTopic).toBeDefined();
      expect(savedTopic.name).toBe(newTopic.name);
    });

    it('should throw an error if topic with same name already exists', async () => {
      // Arrange
      const existingTopic = sampleTopics[0];
      
      // Act & Assert
      await expect(topicService.createTopic(existingTopic))
        .rejects
        .toThrow(/Topic with name .* already exists/);
    });
  });

  describe('updateTopic', () => {
    it('should update an existing topic', async () => {
      // Arrange
      const topicName = 'Weather';
      const updates = {
        description: 'Updated weather conversations',
        keywords: ['weather', 'climate', 'forecast', 'temperature'],
        priority: 7
      };
      
      // Act
      const updatedTopic = await topicService.updateTopic(topicName, updates);
      
      // Assert
      expect(updatedTopic).toBeDefined();
      expect(updatedTopic.name).toBe(topicName);
      expect(updatedTopic.description).toBe(updates.description);
      expect(updatedTopic.keywords).toEqual(expect.arrayContaining(updates.keywords));
      expect(updatedTopic.priority).toBe(updates.priority);
      
      // Verify it was updated in the database
      const savedTopic = await TopicModel.findOne({ name: topicName });
      expect(savedTopic.description).toBe(updates.description);
    });

    it('should throw an error if topic does not exist', async () => {
      // Arrange
      const topicName = 'NonExistent';
      const updates = { description: 'Updated description' };
      
      // Act & Assert
      await expect(topicService.updateTopic(topicName, updates))
        .rejects
        .toThrow(/Topic with name .* not found/);
    });
  });

  describe('deleteTopic', () => {
    it('should delete an existing topic', async () => {
      // Arrange
      const topicName = 'Weather';
      
      // Act
      const result = await topicService.deleteTopic(topicName);
      
      // Assert
      expect(result).toBe(true);
      
      // Verify it was deleted from the database
      const topic = await TopicModel.findOne({ name: topicName });
      expect(topic).toBeNull();
    });

    it('should return false if topic does not exist', async () => {
      // Arrange
      const topicName = 'NonExistent';
      
      // Act
      const result = await topicService.deleteTopic(topicName);
      
      // Assert
      expect(result).toBe(false);
    });
  });
});
