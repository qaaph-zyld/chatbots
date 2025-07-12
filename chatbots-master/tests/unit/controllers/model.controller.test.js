/**
 * Tests for Model Controller
 */

const modelController = require('../../../api/controllers/model.controller');
const localModelService = require('../../../services/local-model.service');

// Mock dependencies
jest.mock('../../../services/local-model.service');

describe('Model Controller', () => {
  let req, res;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock request and response
    req = {
      params: {},
      query: {},
      body: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
    
    // No proxy configuration needed
  });

  describe('getAvailableModels', () => {
    it('should return available models', async () => {
      // Arrange
      const mockModels = [
        { id: 'model1', name: 'Model 1', size: 100, sizeUnit: 'MB' },
        { id: 'model2', name: 'Model 2', size: 200, sizeUnit: 'MB' }
      ];
      
      localModelService.getAvailableModels.mockResolvedValue(mockModels);
      
      // Act
      await modelController.getAvailableModels(req, res);
      
      // Assert
      expect(localModelService.getAvailableModels).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ models: mockModels });
    });
    
    it('should handle errors and return 500 status', async () => {
      // Arrange
      localModelService.getAvailableModels.mockRejectedValue(new Error('Test error'));
      
      // Act
      await modelController.getAvailableModels(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to get available models',
        message: 'Test error'
      });
    });
  });

  describe('downloadModel', () => {
    it('should download model and return success response', async () => {
      // Arrange
      req.body = {
        modelId: 'test-model',
        modelUrl: 'https://example.com/models/test-model.zip'
      };
      
      localModelService.downloadModel.mockResolvedValue(true);
      
      // Act
      await modelController.downloadModel(req, res);
      
      // Assert
      expect(localModelService.downloadModel).toHaveBeenCalledWith(
        'test-model',
        'https://example.com/models/test-model.zip'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Model test-model downloaded successfully'
      });
    });
    
    it('should handle download failure and return 400 status', async () => {
      // Arrange
      req.body = {
        modelId: 'test-model',
        modelUrl: 'https://example.com/models/test-model.zip'
      };
      
      localModelService.downloadModel.mockResolvedValue(false);
      
      // Act
      await modelController.downloadModel(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to download model test-model'
      });
    });
    
    it('should validate required fields and return 400 if missing', async () => {
      // Arrange - missing modelUrl
      req.body = {
        modelId: 'test-model'
      };
      
      // Act
      await modelController.downloadModel(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Missing required fields',
        message: 'modelId and modelUrl are required'
      });
      expect(localModelService.downloadModel).not.toHaveBeenCalled();
    });
    
    it('should handle errors and return 500 status', async () => {
      // Arrange
      req.body = {
        modelId: 'test-model',
        modelUrl: 'https://example.com/models/test-model.zip'
      };
      
      localModelService.downloadModel.mockRejectedValue(new Error('Test error'));
      
      // Act
      await modelController.downloadModel(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to download model',
        message: 'Test error'
      });
    });
  });

  describe('deleteModel', () => {
    it('should delete model and return success response', async () => {
      // Arrange
      req.params.modelId = 'test-model';
      
      localModelService.deleteModel.mockResolvedValue(true);
      
      // Act
      await modelController.deleteModel(req, res);
      
      // Assert
      expect(localModelService.deleteModel).toHaveBeenCalledWith('test-model');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Model test-model deleted successfully'
      });
    });
    
    it('should handle deletion failure and return 400 status', async () => {
      // Arrange
      req.params.modelId = 'test-model';
      
      localModelService.deleteModel.mockResolvedValue(false);
      
      // Act
      await modelController.deleteModel(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to delete model test-model'
      });
    });
    
    it('should validate modelId parameter and return 400 if missing', async () => {
      // Arrange - missing modelId
      req.params = {};
      
      // Act
      await modelController.deleteModel(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Missing required parameter',
        message: 'modelId is required'
      });
      expect(localModelService.deleteModel).not.toHaveBeenCalled();
    });
    
    it('should handle errors and return 500 status', async () => {
      // Arrange
      req.params.modelId = 'test-model';
      
      localModelService.deleteModel.mockRejectedValue(new Error('Test error'));
      
      // Act
      await modelController.deleteModel(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to delete model',
        message: 'Test error'
      });
    });
  });

  describe('getModelStatus', () => {
    it('should return model status', async () => {
      // Arrange
      req.params.modelId = 'test-model';
      
      const mockStatus = {
        id: 'test-model',
        status: 'loaded',
        memory: 1024,
        uptime: 3600
      };
      
      localModelService.getModelStatus.mockResolvedValue(mockStatus);
      
      // Act
      await modelController.getModelStatus(req, res);
      
      // Assert
      expect(localModelService.getModelStatus).toHaveBeenCalledWith('test-model');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockStatus);
    });
    
    it('should handle model not found and return 404 status', async () => {
      // Arrange
      req.params.modelId = 'non-existent-model';
      
      localModelService.getModelStatus.mockResolvedValue(null);
      
      // Act
      await modelController.getModelStatus(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Model not found',
        message: 'Model non-existent-model not found'
      });
    });
    
    it('should validate modelId parameter and return 400 if missing', async () => {
      // Arrange - missing modelId
      req.params = {};
      
      // Act
      await modelController.getModelStatus(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Missing required parameter',
        message: 'modelId is required'
      });
      expect(localModelService.getModelStatus).not.toHaveBeenCalled();
    });
    
    it('should handle errors and return 500 status', async () => {
      // Arrange
      req.params.modelId = 'test-model';
      
      localModelService.getModelStatus.mockRejectedValue(new Error('Test error'));
      
      // Act
      await modelController.getModelStatus(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to get model status',
        message: 'Test error'
      });
    });
  });
});
