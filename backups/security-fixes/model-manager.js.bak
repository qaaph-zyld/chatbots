/**
 * Model Manager
 * 
 * Handles downloading, managing, and validating voice models for
 * the open-source voice interface.
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const AdmZip = require('adm-zip');
const { createHash } = require('crypto');
const { spawn } = require('child_process');
const logger = require('./logger');
const config = require('../config/open-voice.config');

class ModelManager {
  constructor() {
    this.modelRegistry = {
      stt: {
        deepspeech: {
          models: [
            {
              name: 'DeepSpeech English (0.9.3)',
              version: '0.9.3',
              language: 'en-US',
              url: 'https://github.com/mozilla/DeepSpeech/releases/download/v0.9.3/deepspeech-0.9.3-models.pbmm',
              size: 188915987,
              sha256: '67e4b6e89f35fd9420a0a3e2a5ba9c5c8d5da9f180b5fbf9a3ea8c8ee754f5d2',
              type: 'file',
              path: 'deepspeech-0.9.3-models.pbmm'
            },
            {
              name: 'DeepSpeech English Scorer (0.9.3)',
              version: '0.9.3',
              language: 'en-US',
              url: 'https://github.com/mozilla/DeepSpeech/releases/download/v0.9.3/deepspeech-0.9.3-models.scorer',
              size: 953363776,
              sha256: '1e1c25eb7191df9a99086ef8211634a73cd9daff0b22a8a35e31b5d5b56e116a',
              type: 'file',
              path: 'deepspeech-0.9.3-models.scorer'
            }
          ]
        },
        vosk: {
          models: [
            {
              name: 'Vosk English Small (0.15)',
              version: '0.15',
              language: 'en-US',
              url: 'https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip',
              size: 40960000,
              sha256: '30f26242c0a5b2aeb7e1a46b9f38b7d6c0ce27d59c2c9296a9a35aa75d0306db',
              type: 'zip',
              path: 'vosk-model-small-en-us-0.15'
            },
            {
              name: 'Vosk English (0.22)',
              version: '0.22',
              language: 'en-US',
              url: 'https://alphacephei.com/vosk/models/vosk-model-en-us-0.22.zip',
              size: 1768710000,
              sha256: '2d7b49a19f15f32b6a8c3f7a94c2a7a3c1436a0c8cd6fb9f6945c1e4d13cd60b',
              type: 'zip',
              path: 'vosk-model-en-us-0.22'
            }
          ]
        }
      },
      tts: {
        coqui: {
          models: [
            {
              name: 'Coqui TTS LJSpeech Glow-TTS',
              version: '1.0',
              language: 'en-US',
              url: 'https://github.com/coqui-ai/TTS/releases/download/v0.0.13/tts_models--en--ljspeech--glow-tts.zip',
              size: 167772160,
              sha256: 'b65a0b1c3cd7225ebdce4d3a70b0ec7fd7b626db5f1d89c3ca6aa5a7c8147c6c',
              type: 'zip',
              path: 'tts_models--en--ljspeech--glow-tts'
            },
            {
              name: 'Coqui TTS LJSpeech Tacotron2',
              version: '1.0',
              language: 'en-US',
              url: 'https://github.com/coqui-ai/TTS/releases/download/v0.0.13/tts_models--en--ljspeech--tacotron2-DDC.zip',
              size: 350000000,
              sha256: '9bce5764e21beacd45cda78e6b8c048c5d4aff9c6359c99641f1a45069be9ebd',
              type: 'zip',
              path: 'tts_models--en--ljspeech--tacotron2-DDC'
            }
          ]
        }
      },
      recognition: {
        models: [
          {
            name: 'Speaker Recognition Model',
            version: '1.0',
            url: 'https://example.com/speaker-recognition-model.zip',
            size: 52428800,
            sha256: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
            type: 'zip',
            path: 'speaker-recognition-model'
          }
        ]
      }
    };
    
    // Ensure model directories exist
    this.ensureDirectories();
  }
  
  /**
   * Ensure model directories exist
   */
  ensureDirectories() {
    const dirs = [
      config.storage.modelDir,
      config.stt.modelPath,
      config.tts.modelPath,
      config.recognition.modelPath
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.info(`Created model directory: ${dir}`);
      }
    });
  }
  
  /**
   * Get available models
   * @param {String} type - Model type ('stt', 'tts', 'recognition')
   * @param {String} engine - Engine name (e.g., 'deepspeech', 'vosk', 'coqui')
   * @returns {Array} Available models
   */
  getAvailableModels(type, engine = null) {
    try {
      if (type === 'stt' || type === 'tts') {
        if (!engine) {
          // Combine all engines for the type
          const allModels = [];
          Object.keys(this.modelRegistry[type]).forEach(engineName => {
            this.modelRegistry[type][engineName].models.forEach(model => {
              allModels.push({
                ...model,
                engine: engineName
              });
            });
          });
          return allModels;
        } else if (this.modelRegistry[type][engine]) {
          return this.modelRegistry[type][engine].models.map(model => ({
            ...model,
            engine
          }));
        }
      } else if (type === 'recognition' && this.modelRegistry.recognition) {
        return this.modelRegistry.recognition.models;
      }
      
      return [];
    } catch (error) {
      logger.error(`Error getting available models for ${type}${engine ? '/' + engine : ''}`, error);
      return [];
    }
  }
  
  /**
   * Get installed models
   * @param {String} type - Model type ('stt', 'tts', 'recognition')
   * @param {String} engine - Engine name (optional)
   * @returns {Promise<Array>} Installed models
   */
  async getInstalledModels(type, engine = null) {
    try {
      const installedModels = [];
      const availableModels = this.getAvailableModels(type, engine);
      
      for (const model of availableModels) {
        const modelPath = this.getModelPath(type, model);
        const isInstalled = await this.isModelInstalled(modelPath, model);
        
        if (isInstalled) {
          installedModels.push({
            ...model,
            installed: true,
            path: modelPath
          });
        }
      }
      
      return installedModels;
    } catch (error) {
      logger.error(`Error getting installed models for ${type}${engine ? '/' + engine : ''}`, error);
      return [];
    }
  }
  
  /**
   * Check if a model is installed
   * @param {String} modelPath - Path to the model
   * @param {Object} model - Model information
   * @returns {Promise<Boolean>} Whether the model is installed
   */
  async isModelInstalled(modelPath, model) {
    try {
      if (model.type === 'file') {
        return fs.existsSync(modelPath);
      } else if (model.type === 'zip') {
        // For zip files, check if the directory exists
        const dirPath = modelPath.replace(/\.zip$/, '');
        return fs.existsSync(dirPath);
      }
      
      return false;
    } catch (error) {
      logger.error(`Error checking if model is installed: ${modelPath}`, error);
      return false;
    }
  }
  
  /**
   * Get model path
   * @param {String} type - Model type ('stt', 'tts', 'recognition')
   * @param {Object} model - Model information
   * @returns {String} Model path
   */
  getModelPath(type, model) {
    let basePath;
    
    if (type === 'stt') {
      basePath = config.stt.modelPath;
    } else if (type === 'tts') {
      basePath = config.tts.modelPath;
    } else if (type === 'recognition') {
      basePath = config.recognition.modelPath;
    } else {
      throw new Error(`Invalid model type: ${type}`);
    }
    
    return path.join(basePath, model.path);
  }
  
  /**
   * Download a model
   * @param {String} type - Model type ('stt', 'tts', 'recognition')
   * @param {String} modelId - Model ID (path)
   * @param {Function} progressCallback - Progress callback
   * @returns {Promise<Object>} Download result
   */
  async downloadModel(type, modelId, progressCallback = null) {
    try {
      // Find model
      const availableModels = this.getAvailableModels(type);
      const model = availableModels.find(m => m.path === modelId);
      
      if (!model) {
        throw new Error(`Model not found: ${modelId}`);
      }
      
      // Get model path
      const modelPath = this.getModelPath(type, model);
      
      // Check if already installed
      const isInstalled = await this.isModelInstalled(modelPath, model);
      
      if (isInstalled) {
        logger.info(`Model already installed: ${modelId}`);
        return {
          success: true,
          message: 'Model already installed',
          model
        };
      }
      
      // Create temporary download path
      const downloadPath = `${modelPath}.download`;
      
      // Download file
      logger.info(`Downloading model: ${model.name} from ${model.url}`);
      
      const response = await axios({
        method: 'GET',
        url: model.url,
        responseType: 'stream',
        onDownloadProgress: progressEvent => {
          if (progressCallback) {
            const progress = Math.round((progressEvent.loaded / model.size) * 100);
            progressCallback(progress);
          }
        }
      });
      
      // Save to file
      const writer = fs.createWriteStream(downloadPath);
      
      response.data.pipe(writer);
      
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
      
      // Verify hash
      logger.info(`Verifying hash for ${modelId}`);
      
      const fileHash = await this.calculateFileHash(downloadPath);
      
      if (fileHash !== model.sha256) {
        fs.unlinkSync(downloadPath);
        throw new Error(`Hash mismatch for ${modelId}: expected ${model.sha256}, got ${fileHash}`);
      }
      
      // Extract if needed
      if (model.type === 'zip') {
        logger.info(`Extracting ${modelId}`);
        
        const extractDir = path.dirname(modelPath);
        await this.extractZip(downloadPath, extractDir);
        
        // Clean up zip file
        fs.unlinkSync(downloadPath);
      } else {
        // Rename download to final path
        fs.renameSync(downloadPath, modelPath);
      }
      
      logger.info(`Model downloaded successfully: ${modelId}`);
      
      return {
        success: true,
        message: 'Model downloaded successfully',
        model
      };
    } catch (error) {
      logger.error(`Error downloading model: ${modelId}`, error);
      
      return {
        success: false,
        message: `Error downloading model: ${error.message}`,
        error
      };
    }
  }
  
  /**
   * Calculate file hash
   * @param {String} filePath - Path to file
   * @returns {Promise<String>} File hash
   */
  async calculateFileHash(filePath) {
    return new Promise((resolve, reject) => {
      try {
        const hash = createHash('sha256');
        const stream = fs.createReadStream(filePath);
        
        stream.on('data', data => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', error => reject(error));
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Extract zip file
   * @param {String} zipPath - Path to zip file
   * @param {String} extractDir - Directory to extract to
   * @returns {Promise<void>}
   */
  async extractZip(zipPath, extractDir) {
    try {
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(extractDir, true);
    } catch (error) {
      logger.error(`Error extracting zip: ${zipPath}`, error);
      throw error;
    }
  }
  
  /**
   * Delete a model
   * @param {String} type - Model type ('stt', 'tts', 'recognition')
   * @param {String} modelId - Model ID (path)
   * @returns {Promise<Object>} Delete result
   */
  async deleteModel(type, modelId) {
    try {
      // Find model
      const availableModels = this.getAvailableModels(type);
      const model = availableModels.find(m => m.path === modelId);
      
      if (!model) {
        throw new Error(`Model not found: ${modelId}`);
      }
      
      // Get model path
      const modelPath = this.getModelPath(type, model);
      
      // Check if installed
      const isInstalled = await this.isModelInstalled(modelPath, model);
      
      if (!isInstalled) {
        logger.info(`Model not installed: ${modelId}`);
        return {
          success: true,
          message: 'Model not installed',
          model
        };
      }
      
      // Delete model
      logger.info(`Deleting model: ${modelId}`);
      
      if (model.type === 'file') {
        fs.unlinkSync(modelPath);
      } else if (model.type === 'zip') {
        const dirPath = modelPath.replace(/\.zip$/, '');
        this.deleteDirectory(dirPath);
      }
      
      logger.info(`Model deleted successfully: ${modelId}`);
      
      return {
        success: true,
        message: 'Model deleted successfully',
        model
      };
    } catch (error) {
      logger.error(`Error deleting model: ${modelId}`, error);
      
      return {
        success: false,
        message: `Error deleting model: ${error.message}`,
        error
      };
    }
  }
  
  /**
   * Delete directory recursively
   * @param {String} dirPath - Directory path
   */
  deleteDirectory(dirPath) {
    if (fs.existsSync(dirPath)) {
      fs.readdirSync(dirPath).forEach(file => {
        const curPath = path.join(dirPath, file);
        
        if (fs.lstatSync(curPath).isDirectory()) {
          this.deleteDirectory(curPath);
        } else {
          fs.unlinkSync(curPath);
        }
      });
      
      fs.rmdirSync(dirPath);
    }
  }
  
  /**
   * Install dependencies for a model
   * @param {String} type - Model type ('stt', 'tts', 'recognition')
   * @param {String} engine - Engine name
   * @returns {Promise<Object>} Installation result
   */
  async installDependencies(type, engine) {
    try {
      logger.info(`Installing dependencies for ${type}/${engine}`);
      
      let packageName;
      
      if (type === 'stt') {
        if (engine === 'deepspeech') {
          packageName = 'deepspeech';
        } else if (engine === 'vosk') {
          packageName = 'vosk';
        }
      } else if (type === 'tts') {
        if (engine === 'coqui') {
          packageName = 'tts-coqui';
        } else if (engine === 'espeak') {
          packageName = 'node-espeak';
        }
      }
      
      if (!packageName) {
        throw new Error(`Unknown engine: ${type}/${engine}`);
      }
      
      // Install package
      const result = await this.installPackage(packageName);
      
      return {
        success: result.success,
        message: result.message,
        engine,
        type
      };
    } catch (error) {
      logger.error(`Error installing dependencies for ${type}/${engine}`, error);
      
      return {
        success: false,
        message: `Error installing dependencies: ${error.message}`,
        error,
        engine,
        type
      };
    }
  }
  
  /**
   * Install package using npm
   * @param {String} packageName - Package name
   * @returns {Promise<Object>} Installation result
   */
  async installPackage(packageName) {
    return new Promise((resolve, reject) => {
      logger.info(`Installing package: ${packageName}`);
      
      const npm = spawn('npm', ['install', packageName, '--save']);
      
      let stdout = '';
      let stderr = '';
      
      npm.stdout.on('data', data => {
        stdout += data.toString();
        logger.debug(`npm stdout: ${data}`);
      });
      
      npm.stderr.on('data', data => {
        stderr += data.toString();
        logger.debug(`npm stderr: ${data}`);
      });
      
      npm.on('close', code => {
        if (code === 0) {
          logger.info(`Successfully installed ${packageName}`);
          
          resolve({
            success: true,
            message: `Successfully installed ${packageName}`,
            stdout,
            stderr
          });
        } else {
          const error = new Error(`Failed to install ${packageName}, exit code: ${code}`);
          logger.error(error);
          
          reject({
            success: false,
            message: `Failed to install ${packageName}`,
            stdout,
            stderr,
            code
          });
        }
      });
    });
  }
  
  /**
   * Get model status
   * @returns {Promise<Object>} Model status
   */
  async getModelStatus() {
    try {
      const sttModels = await this.getInstalledModels('stt');
      const ttsModels = await this.getInstalledModels('tts');
      const recognitionModels = await this.getInstalledModels('recognition');
      
      return {
        stt: {
          installed: sttModels,
          available: this.getAvailableModels('stt'),
          defaultEngine: config.stt.engine
        },
        tts: {
          installed: ttsModels,
          available: this.getAvailableModels('tts'),
          defaultEngine: config.tts.engine
        },
        recognition: {
          installed: recognitionModels,
          available: this.getAvailableModels('recognition'),
          enabled: config.recognition.enabled
        }
      };
    } catch (error) {
      logger.error('Error getting model status', error);
      throw error;
    }
  }
}

module.exports = new ModelManager();
