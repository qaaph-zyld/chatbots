/**
 * Model Manager Controller
 * 
 * Handles API requests for managing voice models.
 */

require('@src/utils\model-manager');
require('@src/utils\logger');
require('@src/config\open-voice.config');
const path = require('path');
const fs = require('fs');

/**
 * Get model status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getModelStatus = async (req, res) => {
  try {
    const status = await modelManager.getModelStatus();
    
    res.json({
      success: true,
      status
    });
  } catch (error) {
    logger.error('Error getting model status', error);
    
    res.status(500).json({
      success: false,
      message: 'Error getting model status',
      error: error.message
    });
  }
};

/**
 * Get available models
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAvailableModels = (req, res) => {
  try {
    const { type, engine } = req.query;
    
    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Type is required'
      });
    }
    
    const models = modelManager.getAvailableModels(type, engine);
    
    res.json({
      success: true,
      models
    });
  } catch (error) {
    logger.error('Error getting available models', error);
    
    res.status(500).json({
      success: false,
      message: 'Error getting available models',
      error: error.message
    });
  }
};

/**
 * Get installed models
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getInstalledModels = async (req, res) => {
  try {
    const { type, engine } = req.query;
    
    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Type is required'
      });
    }
    
    const models = await modelManager.getInstalledModels(type, engine);
    
    res.json({
      success: true,
      models
    });
  } catch (error) {
    logger.error('Error getting installed models', error);
    
    res.status(500).json({
      success: false,
      message: 'Error getting installed models',
      error: error.message
    });
  }
};

/**
 * Download model
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.downloadModel = async (req, res) => {
  try {
    const { type, modelId } = req.body;
    
    if (!type || !modelId) {
      return res.status(400).json({
        success: false,
        message: 'Type and modelId are required'
      });
    }
    
    // Start download in background
    res.json({
      success: true,
      message: 'Model download started',
      type,
      modelId
    });
    
    // Download model
    const result = await modelManager.downloadModel(type, modelId);
    
    // Log result
    if (result.success) {
      logger.info(`Model downloaded successfully: ${modelId}`);
    } else {
      logger.error(`Error downloading model: ${modelId}`, result.error);
    }
  } catch (error) {
    logger.error('Error downloading model', error);
    
    // Since we've already sent a response, we can't send another one
    // This error will be logged but not sent to the client
  }
};

/**
 * Delete model
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteModel = async (req, res) => {
  try {
    const { type, modelId } = req.params;
    
    if (!type || !modelId) {
      return res.status(400).json({
        success: false,
        message: 'Type and modelId are required'
      });
    }
    
    const result = await modelManager.deleteModel(type, modelId);
    
    res.json(result);
  } catch (error) {
    logger.error('Error deleting model', error);
    
    res.status(500).json({
      success: false,
      message: 'Error deleting model',
      error: error.message
    });
  }
};

/**
 * Get model download progress
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getModelDownloadProgress = (req, res) => {
  try {
    const { type, modelId } = req.params;
    
    if (!type || !modelId) {
      return res.status(400).json({
        success: false,
        message: 'Type and modelId are required'
      });
    }
    
    // Get download progress from cache
    const progress = global.modelDownloadProgress?.[`${type}/${modelId}`] || 0;
    
    res.json({
      success: true,
      progress,
      type,
      modelId
    });
  } catch (error) {
    logger.error('Error getting model download progress', error);
    
    res.status(500).json({
      success: false,
      message: 'Error getting model download progress',
      error: error.message
    });
  }
};

/**
 * Install dependencies
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.installDependencies = async (req, res) => {
  try {
    const { type, engine } = req.body;
    
    if (!type || !engine) {
      return res.status(400).json({
        success: false,
        message: 'Type and engine are required'
      });
    }
    
    // Start installation in background
    res.json({
      success: true,
      message: 'Dependency installation started',
      type,
      engine
    });
    
    // Install dependencies
    const result = await modelManager.installDependencies(type, engine);
    
    // Log result
    if (result.success) {
      logger.info(`Dependencies installed successfully: ${type}/${engine}`);
    } else {
      logger.error(`Error installing dependencies: ${type}/${engine}`, result.error);
    }
  } catch (error) {
    logger.error('Error installing dependencies', error);
    
    // Since we've already sent a response, we can't send another one
    // This error will be logged but not sent to the client
  }
};

/**
 * Get model disk usage
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getModelDiskUsage = async (req, res) => {
  try {
    const sttPath = config.stt.modelPath;
    const ttsPath = config.tts.modelPath;
    const recognitionPath = config.recognition.modelPath;
    
    const sttSize = await getDirSize(sttPath);
    const ttsSize = await getDirSize(ttsPath);
    const recognitionSize = await getDirSize(recognitionPath);
    
    res.json({
      success: true,
      usage: {
        stt: {
          path: sttPath,
          size: sttSize
        },
        tts: {
          path: ttsPath,
          size: ttsSize
        },
        recognition: {
          path: recognitionPath,
          size: recognitionSize
        },
        total: sttSize + ttsSize + recognitionSize
      }
    });
  } catch (error) {
    logger.error('Error getting model disk usage', error);
    
    res.status(500).json({
      success: false,
      message: 'Error getting model disk usage',
      error: error.message
    });
  }
};

/**
 * Get directory size
 * @param {String} dirPath - Directory path
 * @returns {Promise<Number>} Directory size in bytes
 */
async function getDirSize(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      return 0;
    }
    
    const files = await fs.promises.readdir(dirPath);
    const stats = await Promise.all(
      files.map(file => {
        const filePath = path.join(dirPath, file);
        return fs.promises.stat(filePath);
      })
    );
    
    return stats.reduce((total, { size, isDirectory }) => {
      return total + size;
    }, 0);
  } catch (error) {
    logger.error(`Error getting directory size: ${dirPath}`, error);
    return 0;
  }
}
