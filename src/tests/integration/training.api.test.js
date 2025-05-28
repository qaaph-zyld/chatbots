/**
 * Training API Integration Tests
 * 
 * Tests for the training API endpoints
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const TrainingDataset = require('../../database/schemas/training.schema');
const Chatbot = require('../../database/schemas/chatbot.schema');
const { connectDB, disconnectDB } = require('../../database/connection');

describe('Training API', () => {
  let testChatbot;
  let testTrainingDataset;

  // Connect to test database before running tests
  beforeAll(async () => {
    await connectDB();
    
    // Create a test chatbot
    testChatbot = await Chatbot.create({
      name: 'Test Chatbot',
      description: 'A chatbot for testing training API',
      engine: 'botpress',
      engineConfig: {
        botId: 'test-bot-id',
        apiKey: 'test-api-key'
      }
    });
  });

  // Clean up test database after running tests
  afterAll(async () => {
    await Chatbot.deleteMany({});
    await TrainingDataset.deleteMany({});
    await disconnectDB();
  });

  // Clean up test data after each test
  afterEach(async () => {
    await TrainingDataset.deleteMany({});
  });

  describe('POST /api/chatbots/:chatbotId/training-datasets', () => {
    it('should create a new training dataset', async () => {
      const datasetData = {
        name: 'Test Training Dataset',
        description: 'A training dataset for testing',
        domain: 'test_domain'
      };

      const res = await request(app)
        .post(`/api/chatbots/${testChatbot._id}/training-datasets`)
        .send(datasetData);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data.name).toBe('Test Training Dataset');
      expect(res.body.data.domain).toBe('test_domain');
      expect(res.body.data.chatbotId.toString()).toBe(testChatbot._id.toString());
    });

    it('should return 400 if name is missing', async () => {
      const datasetData = {
        description: 'A training dataset for testing',
        domain: 'test_domain'
      };

      const res = await request(app)
        .post(`/api/chatbots/${testChatbot._id}/training-datasets`)
        .send(datasetData);

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Training dataset name is required');
    });

    it('should return 400 if domain is missing', async () => {
      const datasetData = {
        name: 'Test Training Dataset',
        description: 'A training dataset for testing'
      };

      const res = await request(app)
        .post(`/api/chatbots/${testChatbot._id}/training-datasets`)
        .send(datasetData);

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Training domain is required');
    });
  });

  describe('GET /api/chatbots/:chatbotId/training-datasets', () => {
    it('should get all training datasets for a chatbot', async () => {
      // Create test training datasets
      await TrainingDataset.create([
        {
          name: 'Test Training Dataset 1',
          description: 'A training dataset for testing',
          domain: 'test_domain_1',
          chatbotId: testChatbot._id
        },
        {
          name: 'Test Training Dataset 2',
          description: 'Another training dataset for testing',
          domain: 'test_domain_2',
          chatbotId: testChatbot._id
        }
      ]);

      const res = await request(app)
        .get(`/api/chatbots/${testChatbot._id}/training-datasets`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0]).toHaveProperty('name');
      expect(res.body.data[1]).toHaveProperty('name');
    });

    it('should return empty array if no training datasets exist', async () => {
      const res = await request(app)
        .get(`/api/chatbots/${testChatbot._id}/training-datasets`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(0);
      expect(res.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/training-datasets/:id', () => {
    it('should get a training dataset by ID', async () => {
      // Create test training dataset
      testTrainingDataset = await TrainingDataset.create({
        name: 'Test Training Dataset',
        description: 'A training dataset for testing',
        domain: 'test_domain',
        chatbotId: testChatbot._id
      });

      const res = await request(app)
        .get(`/api/training-datasets/${testTrainingDataset._id}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data.name).toBe('Test Training Dataset');
    });

    it('should return 404 if training dataset not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const res = await request(app)
        .get(`/api/training-datasets/${fakeId}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(`Training dataset with ID ${fakeId} not found`);
    });
  });

  describe('PUT /api/training-datasets/:id', () => {
    it('should update a training dataset', async () => {
      // Create test training dataset
      testTrainingDataset = await TrainingDataset.create({
        name: 'Test Training Dataset',
        description: 'A training dataset for testing',
        domain: 'test_domain',
        chatbotId: testChatbot._id
      });

      const updateData = {
        name: 'Updated Training Dataset',
        description: 'An updated training dataset',
        domain: 'updated_domain'
      };

      const res = await request(app)
        .put(`/api/training-datasets/${testTrainingDataset._id}`)
        .send(updateData);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Training Dataset');
      expect(res.body.data.description).toBe('An updated training dataset');
      expect(res.body.data.domain).toBe('updated_domain');
    });

    it('should return 404 if training dataset not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const res = await request(app)
        .put(`/api/training-datasets/${fakeId}`)
        .send({ name: 'Updated Name' });

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(`Training dataset with ID ${fakeId} not found`);
    });
  });

  describe('DELETE /api/training-datasets/:id', () => {
    it('should delete a training dataset', async () => {
      // Create test training dataset
      testTrainingDataset = await TrainingDataset.create({
        name: 'Test Training Dataset',
        description: 'A training dataset for testing',
        domain: 'test_domain',
        chatbotId: testChatbot._id
      });

      const res = await request(app)
        .delete(`/api/training-datasets/${testTrainingDataset._id}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe(`Training dataset with ID ${testTrainingDataset._id} successfully deleted`);

      // Verify training dataset is deleted
      const dataset = await TrainingDataset.findById(testTrainingDataset._id);
      expect(dataset).toBeNull();
    });

    it('should return 404 if training dataset not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const res = await request(app)
        .delete(`/api/training-datasets/${fakeId}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(`Training dataset with ID ${fakeId} not found`);
    });
  });

  describe('POST /api/training-datasets/:id/examples', () => {
    it('should add a training example to a dataset', async () => {
      // Create test training dataset
      testTrainingDataset = await TrainingDataset.create({
        name: 'Test Training Dataset',
        description: 'A training dataset for testing',
        domain: 'test_domain',
        chatbotId: testChatbot._id
      });

      const exampleData = {
        input: 'Test input',
        output: 'Test output',
        metadata: {
          category: 'test',
          priority: 'high'
        }
      };

      const res = await request(app)
        .post(`/api/training-datasets/${testTrainingDataset._id}/examples`)
        .send(exampleData);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.examples).toHaveLength(1);
      expect(res.body.data.examples[0].input).toBe('Test input');
      expect(res.body.data.examples[0].output).toBe('Test output');
      expect(res.body.data.examples[0].metadata.category).toBe('test');
      expect(res.body.data.examples[0].metadata.priority).toBe('high');
    });

    it('should return 400 if input or output is missing', async () => {
      // Create test training dataset
      testTrainingDataset = await TrainingDataset.create({
        name: 'Test Training Dataset',
        description: 'A training dataset for testing',
        domain: 'test_domain',
        chatbotId: testChatbot._id
      });

      const exampleData = {
        input: 'Test input'
        // Missing output
      };

      const res = await request(app)
        .post(`/api/training-datasets/${testTrainingDataset._id}/examples`)
        .send(exampleData);

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Training example input and output are required');
    });
  });

  describe('DELETE /api/training-datasets/:id/examples/:index', () => {
    it('should remove a training example from a dataset', async () => {
      // Create test training dataset with examples
      testTrainingDataset = await TrainingDataset.create({
        name: 'Test Training Dataset',
        description: 'A training dataset for testing',
        domain: 'test_domain',
        chatbotId: testChatbot._id,
        examples: [
          {
            input: 'Test input 1',
            output: 'Test output 1'
          },
          {
            input: 'Test input 2',
            output: 'Test output 2'
          }
        ]
      });

      const res = await request(app)
        .delete(`/api/training-datasets/${testTrainingDataset._id}/examples/0`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.examples).toHaveLength(1);
      expect(res.body.data.examples[0].input).toBe('Test input 2');
    });

    it('should return 404 if training dataset not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const res = await request(app)
        .delete(`/api/training-datasets/${fakeId}/examples/0`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(`Training dataset with ID ${fakeId} not found`);
    });
  });

  // Note: We can't easily test the actual training process in integration tests
  // as it requires a running chatbot instance, but we can test the API endpoint
  describe('POST /api/training-datasets/:id/train', () => {
    it('should return 404 if training dataset not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const res = await request(app)
        .post(`/api/training-datasets/${fakeId}/train`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(`Training dataset with ID ${fakeId} not found`);
    });
  });
});
