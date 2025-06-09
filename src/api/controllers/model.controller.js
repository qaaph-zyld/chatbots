/**
 * Model Controller
 * 
 * Handles API requests for model management
 */

require('@src/services\local-model.service');
require('@src/utils');

/**
 * Get available models
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAvailableModels = async (req, res) => {
  try {
    const { type, language } = req.query;
    const models = localModelService.getAvailableModels(type || null);
    
    // Filter by language if specified
    let filteredModels = models;
    if (language) {
      filteredModels = models.filter(model => {
        // Check if model supports the language
        if (model.language === language) {
          return true;
        }
        
        if (model.languages && model.languages.includes(language)) {
          return true;
        }
        
        return false;
      });
    }
    
    return res.status(200).json({
      success: true,
      data: filteredModels
    });
  } catch (error) {
    logger.error('Error getting available models:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get available models'
    });
  }
};

/**
 * Get downloaded models
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDownloadedModels = async (req, res) => {
  try {
    const { type } = req.query;
    const models = await localModelService.getDownloadedModels(type || null);
    
    return res.status(200).json({
      success: true,
      data: models
    });
  } catch (error) {
    logger.error('Error getting downloaded models:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get downloaded models'
    });
  }
};

/**
 * Download a model
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const downloadModel = async (req, res) => {
  try {
    const { modelId } = req.params;
    
    if (!modelId) {
      return res.status(400).json({
        success: false,
        error: 'Model ID is required'
      });
    }
    
    // Download the model
    const model = await localModelService.downloadModel(modelId);
    
    return res.status(200).json({
      success: true,
      data: model
    });
  } catch (error) {
    logger.error(`Error downloading model ${req.params.modelId}:`, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to download model'
    });
  }
};

/**
 * Delete a model
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteModel = async (req, res) => {
  try {
    const { modelId } = req.params;
    
    if (!modelId) {
      return res.status(400).json({
        success: false,
        error: 'Model ID is required'
      });
    }
    
    // Delete the model
    const success = await localModelService.deleteModel(modelId);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Model not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Model deleted successfully'
    });
  } catch (error) {
    logger.error(`Error deleting model ${req.params.modelId}:`, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete model'
    });
  }
};

/**
 * Get model storage usage
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getStorageUsage = async (req, res) => {
  try {
    const usage = await localModelService.getStorageUsage();
    
    // Add total storage capacity (100MB for demo purposes)
    const totalStorage = 100 * 1024 * 1024; // 100MB in bytes
    
    return res.status(200).json({
      success: true,
      data: {
        used: usage.totalSize,
        total: totalStorage,
        models: usage.count,
        byType: usage.byType
      }
    });
  } catch (error) {
    logger.error('Error getting storage usage:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get storage usage'
    });
  }
};

/**
 * Get model info
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getModelInfo = async (req, res) => {
  try {
    const { modelId } = req.params;
    
    if (!modelId) {
      return res.status(400).json({
        success: false,
        error: 'Model ID is required'
      });
    }
    
    // Get model info
    const model = await localModelService.getModel(modelId);
    
    if (!model) {
      return res.status(404).json({
        success: false,
        error: 'Model not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: model
    });
  } catch (error) {
    logger.error(`Error getting model info for ${req.params.modelId}:`, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get model info'
    });
  }
};

module.exports = {
  getAvailableModels,
  getDownloadedModels,
  downloadModel,
  deleteModel,
  getStorageUsage,
  getModelInfo
};
