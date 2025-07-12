/**
 * Unit tests for the Training Controller
 */

const { expect } = require('chai');
const sinon = require('sinon');
const httpMocks = require('node-mocks-http');

// Mock dependencies
const trainingService = require('../../../training/training.service');
const { logger } = require('../../../utils');

// Import the controller to test
const trainingController = require('../../../training/training.controller');

describe('Training Controller', () => {
  let sandbox;
  let mockReq;
  let mockRes;
  
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    
    // Mock logger
    sandbox.stub(logger, 'error');
    
    // Setup request and response mocks
    mockReq = httpMocks.createRequest();
    mockRes = httpMocks.createResponse({
      eventEmitter: require('events').EventEmitter
    });
    
    // Add json method spy
    mockRes.json = sandbox.spy();
    mockRes.status = sandbox.stub().returns(mockRes);
  });
  
  afterEach(() => {
    sandbox.restore();
  });
  
  describe('Domain Management', () => {
    it('should get all domains', async () => {
      // Setup
      mockReq.query = {
        language: 'en',
        search: 'customer',
        sort: 'name:asc',
        limit: '10',
        offset: '0'
      };
      
      const expectedDomains = [
        {
          id: '123',
          name: 'Customer Support',
          description: 'Domain for customer support chatbots',
          language: 'en'
        }
      ];
      
      sandbox.stub(trainingService, 'getAllDomains').resolves(expectedDomains);
      
      // Execute
      await trainingController.getAllDomains(mockReq, mockRes);
      
      // Verify
      expect(trainingService.getAllDomains.calledOnce).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      expect(mockRes.json.firstCall.args[0]).to.deep.include({
        success: true,
        data: expectedDomains
      });
    });
    
    it('should handle errors when getting domains', async () => {
      // Setup
      const error = new Error('Database error');
      sandbox.stub(trainingService, 'getAllDomains').rejects(error);
      
      // Execute
      await trainingController.getAllDomains(mockReq, mockRes);
      
      // Verify
      expect(logger.error.calledOnce).to.be.true;
      expect(mockRes.status.calledWith(500)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      expect(mockRes.json.firstCall.args[0]).to.deep.include({
        success: false,
        error: 'Failed to retrieve domains'
      });
    });
    
    it('should get domain by ID', async () => {
      // Setup
      const domainId = '123';
      mockReq.params = { id: domainId };
      
      const expectedDomain = {
        id: domainId,
        name: 'Customer Support',
        description: 'Domain for customer support chatbots',
        language: 'en'
      };
      
      sandbox.stub(trainingService, 'getDomainById').resolves(expectedDomain);
      
      // Execute
      await trainingController.getDomainById(mockReq, mockRes);
      
      // Verify
      expect(trainingService.getDomainById.calledWith(domainId)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      expect(mockRes.json.firstCall.args[0]).to.deep.include({
        success: true,
        data: expectedDomain
      });
    });
    
    it('should handle domain not found', async () => {
      // Setup
      const domainId = '999';
      mockReq.params = { id: domainId };
      
      sandbox.stub(trainingService, 'getDomainById').resolves(null);
      
      // Execute
      await trainingController.getDomainById(mockReq, mockRes);
      
      // Verify
      expect(mockRes.status.calledWith(404)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      expect(mockRes.json.firstCall.args[0]).to.deep.include({
        success: false,
        error: 'Domain not found'
      });
    });
    
    it('should create a new domain', async () => {
      // Setup
      const domainData = {
        name: 'Customer Support',
        description: 'Domain for customer support chatbots',
        language: 'en'
      };
      
      mockReq.body = domainData;
      
      const createdDomain = {
        id: '123',
        ...domainData,
        created_at: Date.now(),
        updated_at: Date.now()
      };
      
      sandbox.stub(trainingService, 'createDomain').resolves(createdDomain);
      
      // Execute
      await trainingController.createDomain(mockReq, mockRes);
      
      // Verify
      expect(trainingService.createDomain.calledWith(domainData)).to.be.true;
      expect(mockRes.status.calledWith(201)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      expect(mockRes.json.firstCall.args[0]).to.deep.include({
        success: true,
        data: createdDomain,
        message: 'Domain created successfully'
      });
    });
    
    it('should handle validation errors when creating domain', async () => {
      // Setup
      mockReq.body = {}; // Empty body
      
      // Execute
      await trainingController.createDomain(mockReq, mockRes);
      
      // Verify
      expect(mockRes.status.calledWith(400)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      expect(mockRes.json.firstCall.args[0]).to.deep.include({
        success: false,
        error: 'Invalid request'
      });
    });
    
    it('should update an existing domain', async () => {
      // Setup
      const domainId = '123';
      const updateData = {
        name: 'Updated Customer Support',
        description: 'Updated description'
      };
      
      mockReq.params = { id: domainId };
      mockReq.body = updateData;
      
      const updatedDomain = {
        id: domainId,
        ...updateData,
        language: 'en',
        updated_at: Date.now()
      };
      
      sandbox.stub(trainingService, 'updateDomain').resolves(updatedDomain);
      
      // Execute
      await trainingController.updateDomain(mockReq, mockRes);
      
      // Verify
      expect(trainingService.updateDomain.calledWith(domainId, updateData)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      expect(mockRes.json.firstCall.args[0]).to.deep.include({
        success: true,
        data: updatedDomain,
        message: 'Domain updated successfully'
      });
    });
    
    it('should delete a domain', async () => {
      // Setup
      const domainId = '123';
      mockReq.params = { id: domainId };
      
      sandbox.stub(trainingService, 'deleteDomain').resolves(true);
      
      // Execute
      await trainingController.deleteDomain(mockReq, mockRes);
      
      // Verify
      expect(trainingService.deleteDomain.calledWith(domainId)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      expect(mockRes.json.firstCall.args[0]).to.deep.include({
        success: true,
        message: 'Domain deleted successfully'
      });
    });
  });
  
  describe('Dataset Management', () => {
    it('should get all datasets', async () => {
      // Setup
      mockReq.query = {
        domain_id: '123',
        framework: 'rasa',
        search: 'customer',
        sort: 'created_at:desc',
        limit: '10',
        offset: '0'
      };
      
      const expectedDatasets = [
        {
          id: '456',
          name: 'Customer Support Dataset',
          description: 'Dataset for customer support chatbots',
          domain_id: '123',
          framework: 'rasa'
        }
      ];
      
      sandbox.stub(trainingService, 'getAllDatasets').resolves(expectedDatasets);
      
      // Execute
      await trainingController.getAllDatasets(mockReq, mockRes);
      
      // Verify
      expect(trainingService.getAllDatasets.calledOnce).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      expect(mockRes.json.firstCall.args[0]).to.deep.include({
        success: true,
        data: expectedDatasets
      });
    });
    
    it('should get dataset by ID', async () => {
      // Setup
      const datasetId = '456';
      mockReq.params = { id: datasetId };
      
      const expectedDataset = {
        id: datasetId,
        name: 'Customer Support Dataset',
        description: 'Dataset for customer support chatbots',
        domain_id: '123',
        framework: 'rasa'
      };
      
      sandbox.stub(trainingService, 'getDatasetById').resolves(expectedDataset);
      
      // Execute
      await trainingController.getDatasetById(mockReq, mockRes);
      
      // Verify
      expect(trainingService.getDatasetById.calledWith(datasetId)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      expect(mockRes.json.firstCall.args[0]).to.deep.include({
        success: true,
        data: expectedDataset
      });
    });
    
    it('should create a new dataset', async () => {
      // Setup
      const datasetData = {
        name: 'Customer Support Dataset',
        description: 'Dataset for customer support chatbots',
        domain_id: '123',
        framework: 'rasa'
      };
      
      mockReq.body = datasetData;
      mockReq.file = {
        buffer: Buffer.from('test file content'),
        originalname: 'training_data.yml'
      };
      
      const createdDataset = {
        id: '456',
        ...datasetData,
        files: ['training_data.yml'],
        created_at: Date.now(),
        updated_at: Date.now()
      };
      
      sandbox.stub(trainingService, 'createDataset').resolves(createdDataset);
      
      // Execute
      await trainingController.createDataset(mockReq, mockRes);
      
      // Verify
      expect(trainingService.createDataset.calledOnce).to.be.true;
      expect(mockRes.status.calledWith(201)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      expect(mockRes.json.firstCall.args[0]).to.deep.include({
        success: true,
        data: createdDataset,
        message: 'Dataset created successfully'
      });
    });
    
    it('should get dataset file', async () => {
      // Setup
      const datasetId = '456';
      const fileName = 'training_data.yml';
      mockReq.params = { id: datasetId, fileName };
      
      const fileContent = Buffer.from('test file content');
      
      sandbox.stub(trainingService, 'getDatasetFile').resolves(fileContent);
      
      // Mock res.set and res.send
      mockRes.set = sandbox.spy();
      mockRes.send = sandbox.spy();
      
      // Execute
      await trainingController.getDatasetFile(mockReq, mockRes);
      
      // Verify
      expect(trainingService.getDatasetFile.calledWith(datasetId, fileName)).to.be.true;
      expect(mockRes.set.calledWith('Content-Type', 'application/yaml')).to.be.true;
      expect(mockRes.send.calledWith(fileContent)).to.be.true;
    });
  });
  
  describe('Training', () => {
    it('should train a bot with a dataset', async () => {
      // Setup
      const botId = '789';
      const datasetId = '456';
      mockReq.params = { botId, datasetId };
      
      const trainingResult = {
        id: '001',
        bot_id: botId,
        dataset_id: datasetId,
        status: 'pending'
      };
      
      sandbox.stub(trainingService, 'trainBot').resolves(trainingResult);
      
      // Execute
      await trainingController.trainBot(mockReq, mockRes);
      
      // Verify
      expect(trainingService.trainBot.calledWith(botId, datasetId)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      expect(mockRes.json.firstCall.args[0]).to.deep.include({
        success: true,
        data: trainingResult,
        message: 'Bot trained successfully'
      });
    });
    
    it('should get all training jobs', async () => {
      // Setup
      mockReq.query = {
        bot_id: '789',
        status: 'completed',
        sort: 'created_at:desc',
        limit: '10',
        offset: '0'
      };
      
      const expectedJobs = [
        {
          id: '001',
          bot_id: '789',
          dataset_id: '456',
          status: 'completed'
        }
      ];
      
      sandbox.stub(trainingService, 'getAllTrainingJobs').resolves(expectedJobs);
      
      // Execute
      await trainingController.getAllTrainingJobs(mockReq, mockRes);
      
      // Verify
      expect(trainingService.getAllTrainingJobs.calledOnce).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      expect(mockRes.json.firstCall.args[0]).to.deep.include({
        success: true,
        data: expectedJobs
      });
    });
    
    it('should get training job by ID', async () => {
      // Setup
      const jobId = '001';
      mockReq.params = { id: jobId };
      
      const expectedJob = {
        id: jobId,
        bot_id: '789',
        dataset_id: '456',
        status: 'completed'
      };
      
      sandbox.stub(trainingService, 'getTrainingJobById').resolves(expectedJob);
      
      // Execute
      await trainingController.getTrainingJobById(mockReq, mockRes);
      
      // Verify
      expect(trainingService.getTrainingJobById.calledWith(jobId)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      expect(mockRes.json.firstCall.args[0]).to.deep.include({
        success: true,
        data: expectedJob
      });
    });
    
    it('should get available training frameworks', async () => {
      // Setup
      const frameworks = [
        { id: 'rasa', name: 'Rasa' },
        { id: 'deeppavlov', name: 'DeepPavlov' },
        { id: 'botpress', name: 'Botpress' }
      ];
      
      sandbox.stub(trainingService, 'getFrameworks').returns(frameworks);
      
      // Execute
      await trainingController.getFrameworks(mockReq, mockRes);
      
      // Verify
      expect(trainingService.getFrameworks.calledOnce).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      expect(mockRes.json.firstCall.args[0]).to.deep.include({
        success: true,
        data: frameworks
      });
    });
  });
});
