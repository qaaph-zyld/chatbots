/**
 * Multi-modal Input Service
 * 
 * Provides capabilities for processing different types of inputs beyond text
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
require('@src/utils');

/**
 * Input types
 * @enum {string}
 */
const InputType = {
  TEXT: 'text',
  IMAGE: 'image',
  AUDIO: 'audio',
  VIDEO: 'video',
  FILE: 'file',
  LOCATION: 'location'
};

/**
 * Base class for multi-modal input handlers
 */
class InputHandler {
  /**
   * Constructor
   * @param {Object} options - Handler options
   */
  constructor(options = {}) {
    this.options = options;
  }
  
  /**
   * Check if this handler can process the given input
   * @param {Object} input - Input to check
   * @returns {boolean} - True if this handler can process the input
   */
  canProcess(input) {
    throw new Error('Method not implemented');
  }
  
  /**
   * Process the input
   * @param {Object} input - Input to process
   * @returns {Promise<Object>} - Processed input
   */
  async process(input) {
    throw new Error('Method not implemented');
  }
}

/**
 * Text input handler
 */
class TextInputHandler extends InputHandler {
  /**
   * Check if this handler can process the given input
   * @param {Object} input - Input to check
   * @returns {boolean} - True if this handler can process the input
   */
  canProcess(input) {
    return input.type === InputType.TEXT && typeof input.content === 'string';
  }
  
  /**
   * Process the text input
   * @param {Object} input - Input to process
   * @returns {Promise<Object>} - Processed input
   */
  async process(input) {
    // Text inputs don't need special processing
    return {
      type: InputType.TEXT,
      content: input.content,
      processed: true,
      metadata: input.metadata || {}
    };
  }
}

/**
 * Image input handler
 */
class ImageInputHandler extends InputHandler {
  /**
   * Constructor
   * @param {Object} options - Handler options
   */
  constructor(options = {}) {
    super(options);
    this.options = {
      uploadDir: process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'),
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      visionApiUrl: process.env.VISION_API_URL,
      visionApiKey: process.env.VISION_API_KEY,
      ...options
    };
    
    // Create upload directory if it doesn't exist
    if (!fs.existsSync(this.options.uploadDir)) {
      fs.mkdirSync(this.options.uploadDir, { recursive: true });
    }
  }
  
  /**
   * Check if this handler can process the given input
   * @param {Object} input - Input to check
   * @returns {boolean} - True if this handler can process the input
   */
  canProcess(input) {
    return input.type === InputType.IMAGE && 
      (input.content || input.url || input.file || input.base64);
  }
  
  /**
   * Process the image input
   * @param {Object} input - Input to process
   * @returns {Promise<Object>} - Processed input with image analysis
   */
  async process(input) {
    try {
      // Handle different input formats
      let imagePath;
      
      if (input.file) {
        // Input is a file path
        imagePath = input.file;
      } else if (input.url) {
        // Input is a URL, download it
        imagePath = await this._downloadImage(input.url);
      } else if (input.base64) {
        // Input is base64 data
        imagePath = await this._saveBase64Image(input.base64);
      } else if (input.content && typeof input.content === 'string') {
        // Assume content is a URL or base64
        if (input.content.startsWith('http')) {
          imagePath = await this._downloadImage(input.content);
        } else if (input.content.startsWith('data:image')) {
          imagePath = await this._saveBase64Image(input.content);
        } else {
          throw new Error('Invalid image content format');
        }
      } else {
        throw new Error('Invalid image input format');
      }
      
      // Analyze image if vision API is configured
      let analysis = {};
      if (this.options.visionApiUrl && this.options.visionApiKey) {
        analysis = await this._analyzeImage(imagePath);
      }
      
      return {
        type: InputType.IMAGE,
        content: input.content || input.url || input.file || 'Image processed',
        path: imagePath,
        analysis,
        processed: true,
        metadata: {
          ...input.metadata || {},
          filename: path.basename(imagePath),
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Error processing image input:', error.message);
      throw error;
    }
  }
  
  /**
   * Download image from URL
   * @param {string} url - Image URL
   * @returns {Promise<string>} - Path to downloaded image
   * @private
   */
  async _downloadImage(url) {
    try {
      const response = await axios({
        method: 'get',
        url,
        responseType: 'arraybuffer'
      });
      
      const contentType = response.headers['content-type'];
      const extension = contentType.split('/')[1] || 'jpg';
      const filename = `${uuidv4()}.${extension}`;
      const filePath = path.join(this.options.uploadDir, filename);
      
      fs.writeFileSync(filePath, response.data);
      
      return filePath;
    } catch (error) {
      logger.error('Error downloading image:', error.message);
      throw error;
    }
  }
  
  /**
   * Save base64 image data
   * @param {string} base64Data - Base64 image data
   * @returns {Promise<string>} - Path to saved image
   * @private
   */
  async _saveBase64Image(base64Data) {
    try {
      // Extract data and format from base64 string
      let format = 'jpg';
      let data = base64Data;
      
      if (base64Data.includes(';base64,')) {
        const matches = base64Data.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          format = matches[1];
          data = matches[2];
        } else {
          data = base64Data.split(';base64,')[1];
        }
      }
      
      const filename = `${uuidv4()}.${format}`;
      const filePath = path.join(this.options.uploadDir, filename);
      
      fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
      
      return filePath;
    } catch (error) {
      logger.error('Error saving base64 image:', error.message);
      throw error;
    }
  }
  
  /**
   * Analyze image using vision API
   * @param {string} imagePath - Path to image
   * @returns {Promise<Object>} - Image analysis results
   * @private
   */
  async _analyzeImage(imagePath) {
    try {
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      
      const response = await axios({
        method: 'post',
        url: this.options.visionApiUrl,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.options.visionApiKey}`
        },
        data: {
          image: {
            content: base64Image
          },
          features: [
            { type: 'LABEL_DETECTION' },
            { type: 'TEXT_DETECTION' },
            { type: 'FACE_DETECTION' },
            { type: 'OBJECT_LOCALIZATION' }
          ]
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error('Error analyzing image:', error.message);
      return { error: error.message };
    }
  }
}

/**
 * Audio input handler
 */
class AudioInputHandler extends InputHandler {
  /**
   * Constructor
   * @param {Object} options - Handler options
   */
  constructor(options = {}) {
    super(options);
    this.options = {
      uploadDir: process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'),
      maxSize: 50 * 1024 * 1024, // 50MB
      allowedFormats: ['mp3', 'wav', 'ogg', 'm4a'],
      speechToTextApiUrl: process.env.SPEECH_TO_TEXT_API_URL,
      speechToTextApiKey: process.env.SPEECH_TO_TEXT_API_KEY,
      ...options
    };
    
    // Create upload directory if it doesn't exist
    if (!fs.existsSync(this.options.uploadDir)) {
      fs.mkdirSync(this.options.uploadDir, { recursive: true });
    }
  }
  
  /**
   * Check if this handler can process the given input
   * @param {Object} input - Input to check
   * @returns {boolean} - True if this handler can process the input
   */
  canProcess(input) {
    return input.type === InputType.AUDIO && 
      (input.content || input.url || input.file || input.base64);
  }
  
  /**
   * Process the audio input
   * @param {Object} input - Input to process
   * @returns {Promise<Object>} - Processed input with transcription
   */
  async process(input) {
    try {
      // Handle different input formats
      let audioPath;
      
      if (input.file) {
        // Input is a file path
        audioPath = input.file;
      } else if (input.url) {
        // Input is a URL, download it
        audioPath = await this._downloadAudio(input.url);
      } else if (input.base64) {
        // Input is base64 data
        audioPath = await this._saveBase64Audio(input.base64);
      } else if (input.content && typeof input.content === 'string') {
        // Assume content is a URL
        if (input.content.startsWith('http')) {
          audioPath = await this._downloadAudio(input.content);
        } else {
          throw new Error('Invalid audio content format');
        }
      } else {
        throw new Error('Invalid audio input format');
      }
      
      // Transcribe audio if speech-to-text API is configured
      let transcription = '';
      if (this.options.speechToTextApiUrl && this.options.speechToTextApiKey) {
        transcription = await this._transcribeAudio(audioPath);
      }
      
      return {
        type: InputType.AUDIO,
        content: input.content || input.url || input.file || 'Audio processed',
        path: audioPath,
        transcription,
        processed: true,
        metadata: {
          ...input.metadata || {},
          filename: path.basename(audioPath),
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Error processing audio input:', error.message);
      throw error;
    }
  }
  
  /**
   * Download audio from URL
   * @param {string} url - Audio URL
   * @returns {Promise<string>} - Path to downloaded audio
   * @private
   */
  async _downloadAudio(url) {
    try {
      const response = await axios({
        method: 'get',
        url,
        responseType: 'arraybuffer'
      });
      
      const contentType = response.headers['content-type'];
      const extension = contentType.split('/')[1] || 'mp3';
      const filename = `${uuidv4()}.${extension}`;
      const filePath = path.join(this.options.uploadDir, filename);
      
      fs.writeFileSync(filePath, response.data);
      
      return filePath;
    } catch (error) {
      logger.error('Error downloading audio:', error.message);
      throw error;
    }
  }
  
  /**
   * Save base64 audio data
   * @param {string} base64Data - Base64 audio data
   * @returns {Promise<string>} - Path to saved audio
   * @private
   */
  async _saveBase64Audio(base64Data) {
    try {
      // Extract data and format from base64 string
      let format = 'mp3';
      let data = base64Data;
      
      if (base64Data.includes(';base64,')) {
        const matches = base64Data.match(/^data:audio\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          format = matches[1];
          data = matches[2];
        } else {
          data = base64Data.split(';base64,')[1];
        }
      }
      
      const filename = `${uuidv4()}.${format}`;
      const filePath = path.join(this.options.uploadDir, filename);
      
      fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
      
      return filePath;
    } catch (error) {
      logger.error('Error saving base64 audio:', error.message);
      throw error;
    }
  }
  
  /**
   * Transcribe audio using speech-to-text API
   * @param {string} audioPath - Path to audio file
   * @returns {Promise<string>} - Transcription text
   * @private
   */
  async _transcribeAudio(audioPath) {
    try {
      const audioBuffer = fs.readFileSync(audioPath);
      const base64Audio = audioBuffer.toString('base64');
      
      const response = await axios({
        method: 'post',
        url: this.options.speechToTextApiUrl,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.options.speechToTextApiKey}`
        },
        data: {
          audio: {
            content: base64Audio
          },
          config: {
            encoding: 'LINEAR16',
            sampleRateHertz: 16000,
            languageCode: 'en-US'
          }
        }
      });
      
      if (response.data && response.data.results) {
        return response.data.results
          .map(result => result.alternatives[0].transcript)
          .join(' ');
      }
      
      return '';
    } catch (error) {
      logger.error('Error transcribing audio:', error.message);
      return '';
    }
  }
}

/**
 * Location input handler
 */
class LocationInputHandler extends InputHandler {
  /**
   * Check if this handler can process the given input
   * @param {Object} input - Input to check
   * @returns {boolean} - True if this handler can process the input
   */
  canProcess(input) {
    return input.type === InputType.LOCATION && 
      input.content && 
      (
        (input.content.latitude !== undefined && input.content.longitude !== undefined) ||
        (input.content.lat !== undefined && input.content.lng !== undefined) ||
        (typeof input.content === 'string')
      );
  }
  
  /**
   * Process the location input
   * @param {Object} input - Input to process
   * @returns {Promise<Object>} - Processed input with normalized location data
   */
  async process(input) {
    try {
      let latitude, longitude, address;
      
      if (typeof input.content === 'string') {
        // Assume it's a comma-separated "lat,lng" or an address
        if (input.content.match(/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/)) {
          // It's a "lat,lng" string
          const [lat, lng] = input.content.split(',').map(coord => parseFloat(coord.trim()));
          latitude = lat;
          longitude = lng;
          
          // Try to get address from coordinates
          address = await this._getAddressFromCoordinates(latitude, longitude);
        } else {
          // It's an address, try to geocode it
          const geocodeResult = await this._geocodeAddress(input.content);
          if (geocodeResult) {
            latitude = geocodeResult.latitude;
            longitude = geocodeResult.longitude;
            address = input.content;
          } else {
            throw new Error('Could not geocode address');
          }
        }
      } else {
        // It's an object with coordinates
        latitude = input.content.latitude !== undefined ? input.content.latitude : input.content.lat;
        longitude = input.content.longitude !== undefined ? input.content.longitude : input.content.lng;
        address = input.content.address || await this._getAddressFromCoordinates(latitude, longitude);
      }
      
      return {
        type: InputType.LOCATION,
        content: {
          latitude,
          longitude,
          address
        },
        processed: true,
        metadata: {
          ...input.metadata || {},
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Error processing location input:', error.message);
      throw error;
    }
  }
  
  /**
   * Get address from coordinates using reverse geocoding
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @returns {Promise<string>} - Address
   * @private
   */
  async _getAddressFromCoordinates(latitude, longitude) {
    try {
      // This would normally use a geocoding API like Google Maps
      // For now, we'll just return the coordinates as a string
      return `${latitude}, ${longitude}`;
    } catch (error) {
      logger.error('Error getting address from coordinates:', error.message);
      return `${latitude}, ${longitude}`;
    }
  }
  
  /**
   * Geocode address to coordinates
   * @param {string} address - Address to geocode
   * @returns {Promise<Object>} - Geocoding result with latitude and longitude
   * @private
   */
  async _geocodeAddress(address) {
    try {
      // This would normally use a geocoding API like Google Maps
      // For now, we'll just return null
      return null;
    } catch (error) {
      logger.error('Error geocoding address:', error.message);
      return null;
    }
  }
}

/**
 * Multi-modal Input Service class
 */
class InputService {
  /**
   * Constructor
   * @param {Object} options - Service options
   */
  constructor(options = {}) {
    this.options = options;
    
    // Initialize handlers
    this.handlers = [
      new TextInputHandler(options.text),
      new ImageInputHandler(options.image),
      new AudioInputHandler(options.audio),
      new LocationInputHandler(options.location)
    ];
    
    logger.info('Multi-modal Input Service initialized');
  }
  
  /**
   * Register a new input handler
   * @param {InputHandler} handler - Handler to register
   * @returns {InputService} - This instance for chaining
   */
  registerHandler(handler) {
    if (handler instanceof InputHandler) {
      this.handlers.push(handler);
    } else {
      throw new Error('Handler must be an instance of InputHandler');
    }
    
    return this;
  }
  
  /**
   * Process an input
   * @param {Object} input - Input to process
   * @returns {Promise<Object>} - Processed input
   */
  async processInput(input) {
    try {
      // Find a handler that can process this input
      for (const handler of this.handlers) {
        if (handler.canProcess(input)) {
          return await handler.process(input);
        }
      }
      
      throw new Error(`No handler found for input type: ${input.type}`);
    } catch (error) {
      logger.error('Error processing input:', error.message);
      throw error;
    }
  }
  
  /**
   * Process multiple inputs
   * @param {Array<Object>} inputs - Inputs to process
   * @returns {Promise<Array<Object>>} - Processed inputs
   */
  async processInputs(inputs) {
    try {
      const results = [];
      
      for (const input of inputs) {
        try {
          const result = await this.processInput(input);
          results.push(result);
        } catch (error) {
          logger.error(`Error processing input ${input.type}:`, error.message);
          results.push({
            type: input.type,
            error: error.message,
            processed: false
          });
        }
      }
      
      return results;
    } catch (error) {
      logger.error('Error processing inputs:', error.message);
      throw error;
    }
  }
}

// Create singleton instance
const inputService = new InputService();

module.exports = {
  inputService,
  InputType,
  InputHandler,
  TextInputHandler,
  ImageInputHandler,
  AudioInputHandler,
  LocationInputHandler
};
