/**
 * Unit tests for the Training Service
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { v4: uuidv4 } = require('uuid');

// Mock dependencies
require('@src/storage\local-storage.service');
const fs = require('fs').promises;
const path = require('path');

// Import the service to test
require('@src/training\training.service');

describe('Training Service', () => {
  let sandbox;
  let mockStorage;
  let mockFs;
  
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    
    // Mock local storage service
    mockStorage = {
      getCollection: sandbox.stub(),
      findOne: sandbox.stub(),
      find: sandbox.stub(),
      insertOne: sandbox.stub(),
      updateOne: sandbox.stub(),
      deleteOne: sandbox.stub(),
      createIndex: sandbox.stub()
    };
    
    sandbox.stub(localStorageService, 'getCollection').returns(mockStorage);
    
    // Mock fs.promises
    mockFs = {
      mkdir: sandbox.stub().resolves(),
      writeFile: sandbox.stub().resolves(),
      readFile: sandbox.stub().resolves(Buffer.from('test file content')),
      unlink: sandbox.stub().resolves(),
      readdir: sandbox.stub().resolves(['file1.json', 'file2.json']),
      stat: sandbox.stub().resolves({ isDirectory: () => false })
    };
    
    sandbox.stub(fs, 'mkdir').callsFake(mockFs.mkdir);
    sandbox.stub(fs, 'writeFile').callsFake(mockFs.writeFile);
    sandbox.stub(fs, 'readFile').callsFake(mockFs.readFile);
    sandbox.stub(fs, 'unlink').callsFake(mockFs.unlink);
    sandbox.stub(fs, 'readdir').callsFake(mockFs.readdir);
    sandbox.stub(fs, 'stat').callsFake(mockFs.stat);
  });
  
  afterEach(() => {
    sandbox.restore();
  });
  
  describe('Domain Management', () => {
    it('should create a new domain', async () => {
      // Setup
      const domainData = {
        name: 'Customer Support',
        description: 'Domain for customer support chatbots',
        language: 'en'
      };
      
      const expectedDomain = {
        id: '123',
        ...domainData,
        created_at: Date.now(),
        updated_at: Date.now()
      };
      
      mockStorage.insertOne.resolves(expectedDomain);
      
      // Execute
      const result = await trainingService.createDomain(domainData);
      
      // Verify
      expect(mockStorage.insertOne.calledOnce).to.be.true;
      expect(result).to.deep.equal(expectedDomain);
    });
    
    it('should validate domain data before creation', async () => {
      // Setup
      const invalidDomain = {
        description: 'Missing required fields'
      };
      
      // Execute & Verify
      try {
        await trainingService.createDomain(invalidDomain);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('required');
      }
    });
    
    it('should get a domain by ID', async () => {
      // Setup
      const domainId = '123';
      const expectedDomain = {
        id: domainId,
        name: 'Customer Support',
        description: 'Domain for customer support chatbots',
        language: 'en',
        created_at: Date.now(),
        updated_at: Date.now()
      };
      
      mockStorage.findOne.resolves(expectedDomain);
      
      // Execute
      const result = await trainingService.getDomainById(domainId);
      
      // Verify
      expect(mockStorage.findOne.calledOnce).to.be.true;
      expect(mockStorage.findOne.firstCall.args[0]).to.deep.equal({ id: domainId });
      expect(result).to.deep.equal(expectedDomain);
    });
    
    it('should get all domains with filtering and pagination', async () => {
      // Setup
      const query = { language: 'en' };
      const options = { limit: 10, offset: 0, sort: { name: 1 } };
      
      const expectedDomains = [
        {
          id: '123',
          name: 'Customer Support',
          description: 'Domain for customer support chatbots',
          language: 'en',
          created_at: Date.now(),
          updated_at: Date.now()
        },
        {
          id: '456',
          name: 'E-Commerce',
          description: 'Domain for e-commerce chatbots',
          language: 'en',
          created_at: Date.now(),
          updated_at: Date.now()
        }
      ];
      
      mockStorage.find.resolves(expectedDomains);
      
      // Execute
      const result = await trainingService.getAllDomains(query, options);
      
      // Verify
      expect(mockStorage.find.calledOnce).to.be.true;
      expect(mockStorage.find.firstCall.args[0]).to.deep.equal(query);
      expect(mockStorage.find.firstCall.args[1]).to.deep.equal(options);
      expect(result).to.deep.equal(expectedDomains);
    });
    
    it('should update a domain', async () => {
      // Setup
      const domainId = '123';
      const updateData = {
        name: 'Updated Customer Support',
        description: 'Updated description'
      };
      
      const existingDomain = {
        id: domainId,
        name: 'Customer Support',
        description: 'Domain for customer support chatbots',
        language: 'en',
        created_at: 1621234567890,
        updated_at: 1621234567890
      };
      
      const expectedDomain = {
        ...existingDomain,
        ...updateData,
        updated_at: Date.now()
      };
      
      mockStorage.findOne.resolves(existingDomain);
      mockStorage.updateOne.resolves(expectedDomain);
      
      // Execute
      const result = await trainingService.updateDomain(domainId, updateData);
      
      // Verify
      expect(mockStorage.findOne.calledOnce).to.be.true;
      expect(mockStorage.updateOne.calledOnce).to.be.true;
      expect(result).to.deep.equal(expectedDomain);
    });
    
    it('should delete a domain', async () => {
      // Setup
      const domainId = '123';
      
      mockStorage.findOne.resolves({ id: domainId });
      mockStorage.deleteOne.resolves(true);
      
      // Execute
      const result = await trainingService.deleteDomain(domainId);
      
      // Verify
      expect(mockStorage.findOne.calledOnce).to.be.true;
      expect(mockStorage.deleteOne.calledOnce).to.be.true;
      expect(result).to.be.true;
    });
  });
  
  describe('Dataset Management', () => {
    it('should create a new dataset', async () => {
      // Setup
      const datasetData = {
        name: 'Customer Support Dataset',
        description: 'Dataset for customer support chatbots',
        domain_id: '123',
        framework: 'rasa'
      };
      
      const fileData = Buffer.from('test file content');
      const fileName = 'training_data.yml';
      
      const expectedDataset = {
        id: '456',
        ...datasetData,
        files: [fileName],
        created_at: Date.now(),
        updated_at: Date.now()
      };
      
      mockStorage.findOne.resolves({ id: '123' }); // Domain exists
      mockStorage.insertOne.resolves(expectedDataset);
      
      // Execute
      const result = await trainingService.createDataset(datasetData, fileData, fileName);
      
      // Verify
      expect(mockStorage.findOne.calledOnce).to.be.true;
      expect(mockStorage.insertOne.calledOnce).to.be.true;
      expect(mockFs.mkdir.calledOnce).to.be.true;
      expect(mockFs.writeFile.calledOnce).to.be.true;
      expect(result).to.deep.equal(expectedDataset);
    });
    
    it('should validate dataset data before creation', async () => {
      // Setup
      const invalidDataset = {
        description: 'Missing required fields'
      };
      
      // Execute & Verify
      try {
        await trainingService.createDataset(invalidDataset);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('required');
      }
    });
    
    it('should get a dataset by ID', async () => {
      // Setup
      const datasetId = '456';
      const expectedDataset = {
        id: datasetId,
        name: 'Customer Support Dataset',
        description: 'Dataset for customer support chatbots',
        domain_id: '123',
        framework: 'rasa',
        files: ['training_data.yml'],
        created_at: Date.now(),
        updated_at: Date.now()
      };
      
      mockStorage.findOne.resolves(expectedDataset);
      
      // Execute
      const result = await trainingService.getDatasetById(datasetId);
      
      // Verify
      expect(mockStorage.findOne.calledOnce).to.be.true;
      expect(mockStorage.findOne.firstCall.args[0]).to.deep.equal({ id: datasetId });
      expect(result).to.deep.equal(expectedDataset);
    });
    
    it('should get dataset file', async () => {
      // Setup
      const datasetId = '456';
      const fileName = 'training_data.yml';
      const expectedContent = Buffer.from('test file content');
      
      mockStorage.findOne.resolves({
        id: datasetId,
        files: [fileName]
      });
      
      mockFs.readFile.resolves(expectedContent);
      
      // Execute
      const result = await trainingService.getDatasetFile(datasetId, fileName);
      
      // Verify
      expect(mockStorage.findOne.calledOnce).to.be.true;
      expect(mockFs.readFile.calledOnce).to.be.true;
      expect(result).to.deep.equal(expectedContent);
    });
  });
  
  describe('Training Jobs', () => {
    it('should train a bot with a dataset', async () => {
      // Setup
      const botId = '789';
      const datasetId = '456';
      
      const bot = {
        id: botId,
        name: 'Support Bot'
      };
      
      const dataset = {
        id: datasetId,
        name: 'Customer Support Dataset',
        domain_id: '123',
        framework: 'rasa',
        files: ['training_data.yml']
      };
      
      const domain = {
        id: '123',
        name: 'Customer Support'
      };
      
      const expectedJob = {
        id: uuidv4(),
        bot_id: botId,
        dataset_id: datasetId,
        domain_id: '123',
        framework: 'rasa',
        status: 'pending',
        created_at: Date.now(),
        updated_at: Date.now()
      };
      
      // Mock bot service
      const botService = {
        getBotById: sandbox.stub().resolves(bot),
        updateBot: sandbox.stub().resolves(true)
      };
      
      // Inject bot service
      trainingService.setBotService(botService);
      
      mockStorage.findOne.onFirstCall().resolves(dataset);
      mockStorage.findOne.onSecondCall().resolves(domain);
      mockStorage.insertOne.resolves(expectedJob);
      
      // Execute
      const result = await trainingService.trainBot(botId, datasetId);
      
      // Verify
      expect(botService.getBotById.calledOnce).to.be.true;
      expect(mockStorage.findOne.calledTwice).to.be.true;
      expect(mockStorage.insertOne.calledOnce).to.be.true;
      expect(result).to.deep.equal(expectedJob);
    });
    
    it('should get all training jobs with filtering and pagination', async () => {
      // Setup
      const query = { bot_id: '789' };
      const options = { limit: 10, offset: 0, sort: { created_at: -1 } };
      
      const expectedJobs = [
        {
          id: '001',
          bot_id: '789',
          dataset_id: '456',
          domain_id: '123',
          framework: 'rasa',
          status: 'completed',
          created_at: Date.now() - 3600000,
          updated_at: Date.now() - 3500000,
          completed_at: Date.now() - 3500000
        },
        {
          id: '002',
          bot_id: '789',
          dataset_id: '456',
          domain_id: '123',
          framework: 'rasa',
          status: 'running',
          created_at: Date.now(),
          updated_at: Date.now()
        }
      ];
      
      mockStorage.find.resolves(expectedJobs);
      
      // Execute
      const result = await trainingService.getAllTrainingJobs(query, options);
      
      // Verify
      expect(mockStorage.find.calledOnce).to.be.true;
      expect(mockStorage.find.firstCall.args[0]).to.deep.equal(query);
      expect(mockStorage.find.firstCall.args[1]).to.deep.equal(options);
      expect(result).to.deep.equal(expectedJobs);
    });
    
    it('should get a training job by ID', async () => {
      // Setup
      const jobId = '001';
      const expectedJob = {
        id: jobId,
        bot_id: '789',
        dataset_id: '456',
        domain_id: '123',
        framework: 'rasa',
        status: 'completed',
        created_at: Date.now() - 3600000,
        updated_at: Date.now() - 3500000,
        completed_at: Date.now() - 3500000
      };
      
      mockStorage.findOne.resolves(expectedJob);
      
      // Execute
      const result = await trainingService.getTrainingJobById(jobId);
      
      // Verify
      expect(mockStorage.findOne.calledOnce).to.be.true;
      expect(mockStorage.findOne.firstCall.args[0]).to.deep.equal({ id: jobId });
      expect(result).to.deep.equal(expectedJob);
    });
  });
  
  describe('Frameworks', () => {
    it('should return available training frameworks', () => {
      // Execute
      const result = trainingService.getFrameworks();
      
      // Verify
      expect(result).to.be.an('array');
      expect(result.length).to.be.at.least(3); // At least Rasa, DeepPavlov, and Botpress
      expect(result.map(f => f.id)).to.include.members(['rasa', 'deeppavlov', 'botpress']);
    });
  });
});
