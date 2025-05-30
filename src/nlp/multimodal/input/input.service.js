/**
 * Multi-Modal Input Service
 * 
 * This service provides capabilities for processing various types of input
 * beyond text, including images, audio, and location data.
 * 
 * It uses open-source libraries for processing these inputs locally when possible,
 * with fallback to remote processing when necessary.
 */

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { logger } = require('../../../utils');

/**
 * Multi-Modal Input Service class
 */
class InputService {
  /**
   * Initialize the input service
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      tempDir: process.env.TEMP_DIR || path.join(process.cwd(), 'temp'),
      pythonPath: process.env.PYTHON_PATH || 'python',
      modelPath: process.env.MODEL_PATH || path.join(process.cwd(), 'models'),
      preferLocalProcessing: process.env.PREFER_LOCAL_PROCESSING === 'true' || true,
      imageProcessingEnabled: process.env.IMAGE_PROCESSING_ENABLED === 'true' || true,
      audioProcessingEnabled: process.env.AUDIO_PROCESSING_ENABLED === 'true' || true,
      locationProcessingEnabled: process.env.LOCATION_PROCESSING_ENABLED === 'true' || true,
      maxImageSize: parseInt(process.env.MAX_IMAGE_SIZE || '10485760', 10), // 10MB
      maxAudioSize: parseInt(process.env.MAX_AUDIO_SIZE || '20971520', 10), // 20MB
      supportedImageFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      supportedAudioFormats: ['mp3', 'wav', 'ogg', 'flac', 'm4a'],
      ...options
    };

    // Create temp directory if it doesn't exist
    if (!fs.existsSync(this.options.tempDir)) {
      fs.mkdirSync(this.options.tempDir, { recursive: true });
    }

    // Create model directory if it doesn't exist
    if (!fs.existsSync(this.options.modelPath)) {
      fs.mkdirSync(this.options.modelPath, { recursive: true });
    }

    // Initialize services
    this.initialized = false;
    this.imageProcessingInitialized = false;
    this.audioProcessingInitialized = false;
    this.locationProcessingInitialized = false;

    logger.info('Multi-Modal Input Service initialized with options:', {
      preferLocalProcessing: this.options.preferLocalProcessing,
      imageProcessingEnabled: this.options.imageProcessingEnabled,
      audioProcessingEnabled: this.options.audioProcessingEnabled,
      locationProcessingEnabled: this.options.locationProcessingEnabled
    });
  }

  /**
   * Initialize the input service
   * @returns {Promise<boolean>} - True if initialization was successful
   */
  async initialize() {
    try {
      // Initialize image processing if enabled
      if (this.options.imageProcessingEnabled) {
        this.imageProcessingInitialized = await this._initializeImageProcessing();
      }

      // Initialize audio processing if enabled
      if (this.options.audioProcessingEnabled) {
        this.audioProcessingInitialized = await this._initializeAudioProcessing();
      }

      // Initialize location processing if enabled
      if (this.options.locationProcessingEnabled) {
        this.locationProcessingInitialized = await this._initializeLocationProcessing();
      }

      this.initialized = true;
      logger.info('Multi-Modal Input Service fully initialized');
      return true;
    } catch (error) {
      logger.error('Error initializing Multi-Modal Input Service:', error.message);
      return false;
    }
  }

  /**
   * Initialize image processing capabilities
   * @private
   * @returns {Promise<boolean>} - True if initialization was successful
   */
  async _initializeImageProcessing() {
    try {
      // Check if Python is available
      await this._checkPythonAvailability();

      // Check if required Python packages are installed
      const pythonScript = path.join(__dirname, '../python/check_image_dependencies.py');
      const result = await this._runPythonScript(pythonScript, []);
      
      if (result.error) {
        logger.error('Error checking image processing dependencies:', result.error);
        return false;
      }

      logger.info('Image processing initialized successfully');
      return true;
    } catch (error) {
      logger.error('Error initializing image processing:', error.message);
      return false;
    }
  }

  /**
   * Initialize audio processing capabilities
   * @private
   * @returns {Promise<boolean>} - True if initialization was successful
   */
  async _initializeAudioProcessing() {
    try {
      // Check if Python is available
      await this._checkPythonAvailability();

      // Check if required Python packages are installed
      const pythonScript = path.join(__dirname, '../python/check_audio_dependencies.py');
      const result = await this._runPythonScript(pythonScript, []);
      
      if (result.error) {
        logger.error('Error checking audio processing dependencies:', result.error);
        return false;
      }

      logger.info('Audio processing initialized successfully');
      return true;
    } catch (error) {
      logger.error('Error initializing audio processing:', error.message);
      return false;
    }
  }

  /**
   * Initialize location processing capabilities
   * @private
   * @returns {Promise<boolean>} - True if initialization was successful
   */
  async _initializeLocationProcessing() {
    try {
      // Location processing is handled in JavaScript, so we just need to check
      // if the required packages are installed
      logger.info('Location processing initialized successfully');
      return true;
    } catch (error) {
      logger.error('Error initializing location processing:', error.message);
      return false;
    }
  }

  /**
   * Check if Python is available
   * @private
   * @returns {Promise<boolean>} - True if Python is available
   */
  async _checkPythonAvailability() {
    return new Promise((resolve, reject) => {
      const python = spawn(this.options.pythonPath, ['--version']);
      
      python.on('error', (error) => {
        reject(new Error(`Python not found: ${error.message}`));
      });
      
      python.on('close', (code) => {
        if (code === 0) {
          resolve(true);
        } else {
          reject(new Error(`Python check failed with code ${code}`));
        }
      });
    });
  }

  /**
   * Run a Python script
   * @private
   * @param {string} scriptPath - Path to the Python script
   * @param {Array} args - Arguments to pass to the script
   * @param {Object} data - Data to pass to the script via stdin
   * @returns {Promise<Object>} - Script output
   */
  async _runPythonScript(scriptPath, args = [], data = null) {
    return new Promise((resolve, reject) => {
      const python = spawn(this.options.pythonPath, [scriptPath, ...args]);
      let stdout = '';
      let stderr = '';
      
      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      python.on('error', (error) => {
        reject(new Error(`Error running Python script: ${error.message}`));
      });
      
      python.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (error) {
            resolve({ output: stdout });
          }
        } else {
          resolve({ error: stderr || `Script exited with code ${code}` });
        }
      });
      
      if (data) {
        python.stdin.write(JSON.stringify(data));
        python.stdin.end();
      }
    });
  }

  /**
   * Process an image input
   * @param {Object} imageData - Image data to process
   * @param {string} imageData.url - URL of the image (optional)
   * @param {string} imageData.base64 - Base64-encoded image data (optional)
   * @param {string} imageData.path - Path to the image file (optional)
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} - Processing result
   */
  async processImage(imageData, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.imageProcessingInitialized) {
      throw new Error('Image processing is not initialized');
    }

    const processingOptions = {
      detectObjects: options.detectObjects || true,
      detectFaces: options.detectFaces || false,
      detectText: options.detectText || false,
      detectLabels: options.detectLabels || true,
      confidenceThreshold: options.confidenceThreshold || 0.5,
      ...options
    };

    try {
      // Get image data from URL, base64, or path
      const imageBuffer = await this._getImageData(imageData);
      
      // Save image to temp file
      const tempFilePath = await this._saveTempFile(imageBuffer, 'image');
      
      // Process image with Python script
      const pythonScript = path.join(__dirname, '../python/process_image.py');
      const result = await this._runPythonScript(pythonScript, [
        tempFilePath,
        JSON.stringify(processingOptions)
      ]);
      
      // Clean up temp file
      this._cleanupTempFile(tempFilePath);
      
      if (result.error) {
        throw new Error(`Error processing image: ${result.error}`);
      }
      
      return result;
    } catch (error) {
      logger.error('Error processing image:', error.message);
      throw error;
    }
  }

  /**
   * Process audio input (speech-to-text)
   * @param {Object} audioData - Audio data to process
   * @param {string} audioData.url - URL of the audio file (optional)
   * @param {string} audioData.base64 - Base64-encoded audio data (optional)
   * @param {string} audioData.path - Path to the audio file (optional)
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} - Processing result with transcription
   */
  async processAudio(audioData, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.audioProcessingInitialized) {
      throw new Error('Audio processing is not initialized');
    }

    const processingOptions = {
      language: options.language || 'en',
      model: options.model || 'default',
      enhanceAudio: options.enhanceAudio || false,
      ...options
    };

    try {
      // Get audio data from URL, base64, or path
      const audioBuffer = await this._getAudioData(audioData);
      
      // Save audio to temp file
      const tempFilePath = await this._saveTempFile(audioBuffer, 'audio');
      
      // Process audio with Python script
      const pythonScript = path.join(__dirname, '../python/process_audio.py');
      const result = await this._runPythonScript(pythonScript, [
        tempFilePath,
        JSON.stringify(processingOptions)
      ]);
      
      // Clean up temp file
      this._cleanupTempFile(tempFilePath);
      
      if (result.error) {
        throw new Error(`Error processing audio: ${result.error}`);
      }
      
      return result;
    } catch (error) {
      logger.error('Error processing audio:', error.message);
      throw error;
    }
  }

  /**
   * Process location data
   * @param {Object} locationData - Location data to process
   * @param {number} locationData.latitude - Latitude
   * @param {number} locationData.longitude - Longitude
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} - Processing result with location information
   */
  async processLocation(locationData, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.locationProcessingInitialized) {
      throw new Error('Location processing is not initialized');
    }

    const processingOptions = {
      includeAddressDetails: options.includeAddressDetails || true,
      includePointsOfInterest: options.includePointsOfInterest || false,
      radiusMeters: options.radiusMeters || 1000,
      ...options
    };

    try {
      // Validate location data
      if (!locationData.latitude || !locationData.longitude) {
        throw new Error('Invalid location data: latitude and longitude are required');
      }
      
      // Process location with JavaScript
      const locationInfo = await this._processLocationData(locationData, processingOptions);
      
      return locationInfo;
    } catch (error) {
      logger.error('Error processing location:', error.message);
      throw error;
    }
  }

  /**
   * Process location data with JavaScript
   * @private
   * @param {Object} locationData - Location data
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} - Location information
   */
  async _processLocationData(locationData, options) {
    // In a real implementation, this would use a geocoding service
    // For now, we'll return a simple response
    return {
      coordinates: {
        latitude: locationData.latitude,
        longitude: locationData.longitude
      },
      address: {
        formatted: 'Sample Address',
        components: {
          street: 'Sample Street',
          city: 'Sample City',
          state: 'Sample State',
          country: 'Sample Country',
          postalCode: '12345'
        }
      },
      pointsOfInterest: options.includePointsOfInterest ? [
        {
          name: 'Sample POI 1',
          type: 'restaurant',
          distance: 100
        },
        {
          name: 'Sample POI 2',
          type: 'park',
          distance: 200
        }
      ] : [],
      timezone: {
        name: 'UTC',
        offset: 0
      }
    };
  }

  /**
   * Get image data from URL, base64, or path
   * @private
   * @param {Object} imageData - Image data
   * @returns {Promise<Buffer>} - Image buffer
   */
  async _getImageData(imageData) {
    if (imageData.url) {
      // Get image from URL
      const response = await axios.get(imageData.url, { responseType: 'arraybuffer' });
      return Buffer.from(response.data);
    } else if (imageData.base64) {
      // Get image from base64
      return Buffer.from(imageData.base64, 'base64');
    } else if (imageData.path) {
      // Get image from file
      return fs.promises.readFile(imageData.path);
    } else {
      throw new Error('Invalid image data: url, base64, or path is required');
    }
  }

  /**
   * Get audio data from URL, base64, or path
   * @private
   * @param {Object} audioData - Audio data
   * @returns {Promise<Buffer>} - Audio buffer
   */
  async _getAudioData(audioData) {
    if (audioData.url) {
      // Get audio from URL
      const response = await axios.get(audioData.url, { responseType: 'arraybuffer' });
      return Buffer.from(response.data);
    } else if (audioData.base64) {
      // Get audio from base64
      return Buffer.from(audioData.base64, 'base64');
    } else if (audioData.path) {
      // Get audio from file
      return fs.promises.readFile(audioData.path);
    } else {
      throw new Error('Invalid audio data: url, base64, or path is required');
    }
  }

  /**
   * Save data to a temporary file
   * @private
   * @param {Buffer} data - Data to save
   * @param {string} type - Type of data (image, audio)
   * @returns {Promise<string>} - Path to the temporary file
   */
  async _saveTempFile(data, type) {
    const extension = type === 'image' ? 'jpg' : 'wav';
    const tempFilePath = path.join(this.options.tempDir, `${uuidv4()}.${extension}`);
    await fs.promises.writeFile(tempFilePath, data);
    return tempFilePath;
  }

  /**
   * Clean up a temporary file
   * @private
   * @param {string} filePath - Path to the temporary file
   */
  _cleanupTempFile(filePath) {
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      logger.warn(`Error cleaning up temp file ${filePath}:`, error.message);
    }
  }
}

// Create and export input service instance
const inputService = new InputService();

module.exports = {
  InputService,
  inputService
};
