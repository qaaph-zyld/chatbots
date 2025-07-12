/**
 * Multi-modal Output Service
 * 
 * Provides capabilities for generating different types of outputs beyond text
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
require('@src/utils');

/**
 * Output types
 * @enum {string}
 */
const OutputType = {
  TEXT: 'text',
  IMAGE: 'image',
  AUDIO: 'audio',
  VIDEO: 'video',
  FILE: 'file',
  CARD: 'card',
  CAROUSEL: 'carousel',
  BUTTON: 'button',
  QUICK_REPLY: 'quick_reply',
  LOCATION: 'location',
  CUSTOM: 'custom'
};

/**
 * Base class for multi-modal output handlers
 */
class OutputHandler {
  /**
   * Constructor
   * @param {Object} options - Handler options
   */
  constructor(options = {}) {
    this.options = options;
  }
  
  /**
   * Check if this handler can process the given output
   * @param {Object} output - Output to check
   * @returns {boolean} - True if this handler can process the output
   */
  canProcess(output) {
    throw new Error('Method not implemented');
  }
  
  /**
   * Process the output
   * @param {Object} output - Output to process
   * @returns {Promise<Object>} - Processed output
   */
  async process(output) {
    throw new Error('Method not implemented');
  }
}

/**
 * Text output handler
 */
class TextOutputHandler extends OutputHandler {
  /**
   * Check if this handler can process the given output
   * @param {Object} output - Output to check
   * @returns {boolean} - True if this handler can process the output
   */
  canProcess(output) {
    return output.type === OutputType.TEXT && typeof output.content === 'string';
  }
  
  /**
   * Process the text output
   * @param {Object} output - Output to process
   * @returns {Promise<Object>} - Processed output
   */
  async process(output) {
    // Text outputs don't need special processing
    return {
      type: OutputType.TEXT,
      content: output.content,
      processed: true,
      metadata: output.metadata || {}
    };
  }
}

/**
 * Image output handler
 */
class ImageOutputHandler extends OutputHandler {
  /**
   * Constructor
   * @param {Object} options - Handler options
   */
  constructor(options = {}) {
    super(options);
    this.options = {
      outputDir: process.env.OUTPUT_DIR || path.join(process.cwd(), 'outputs'),
      imageGenerationApiUrl: process.env.IMAGE_GENERATION_API_URL,
      imageGenerationApiKey: process.env.IMAGE_GENERATION_API_KEY,
      ...options
    };
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }
  }
  
  /**
   * Check if this handler can process the given output
   * @param {Object} output - Output to check
   * @returns {boolean} - True if this handler can process the output
   */
  canProcess(output) {
    return output.type === OutputType.IMAGE && 
      (output.content || output.url || output.file || output.prompt);
  }
  
  /**
   * Process the image output
   * @param {Object} output - Output to process
   * @returns {Promise<Object>} - Processed output with image URL or path
   */
  async process(output) {
    try {
      let imageUrl;
      let imagePath;
      
      if (output.url) {
        // Output already has a URL
        imageUrl = output.url;
      } else if (output.file) {
        // Output has a file path
        imagePath = output.file;
        imageUrl = this._getPublicUrl(imagePath);
      } else if (output.prompt && this.options.imageGenerationApiUrl && this.options.imageGenerationApiKey) {
        // Generate image from prompt
        const generatedImage = await this._generateImage(output.prompt);
        imageUrl = generatedImage.url;
        imagePath = generatedImage.path;
      } else if (output.content) {
        // Assume content is a URL
        imageUrl = output.content;
      } else {
        throw new Error('Invalid image output format');
      }
      
      return {
        type: OutputType.IMAGE,
        url: imageUrl,
        path: imagePath,
        alt: output.alt || 'Image',
        processed: true,
        metadata: {
          ...output.metadata || {},
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Error processing image output:', error.message);
      throw error;
    }
  }
  
  /**
   * Generate image from prompt using image generation API
   * @param {string} prompt - Image generation prompt
   * @returns {Promise<Object>} - Generated image info
   * @private
   */
  async _generateImage(prompt) {
    try {
      const response = await axios({
        method: 'post',
        url: this.options.imageGenerationApiUrl,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.options.imageGenerationApiKey}`
        },
        data: {
          prompt,
          n: 1,
          size: '512x512',
          response_format: 'url'
        }
      });
      
      if (response.data && response.data.data && response.data.data.length > 0) {
        const imageUrl = response.data.data[0].url;
        
        // Download the generated image
        const imagePath = await this._downloadImage(imageUrl);
        
        return {
          url: imageUrl,
          path: imagePath
        };
      }
      
      throw new Error('No image generated');
    } catch (error) {
      logger.error('Error generating image:', error.message);
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
      const filePath = path.join(this.options.outputDir, filename);
      
      fs.writeFileSync(filePath, response.data);
      
      return filePath;
    } catch (error) {
      logger.error('Error downloading image:', error.message);
      throw error;
    }
  }
  
  /**
   * Get public URL for a local file path
   * @param {string} filePath - Local file path
   * @returns {string} - Public URL
   * @private
   */
  _getPublicUrl(filePath) {
    // This would normally convert a local path to a public URL
    // For now, we'll just return the filename
    const filename = path.basename(filePath);
    return `/outputs/${filename}`;
  }
}

/**
 * Audio output handler
 */
class AudioOutputHandler extends OutputHandler {
  /**
   * Constructor
   * @param {Object} options - Handler options
   */
  constructor(options = {}) {
    super(options);
    this.options = {
      outputDir: process.env.OUTPUT_DIR || path.join(process.cwd(), 'outputs'),
      textToSpeechApiUrl: process.env.TEXT_TO_SPEECH_API_URL,
      textToSpeechApiKey: process.env.TEXT_TO_SPEECH_API_KEY,
      ...options
    };
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }
  }
  
  /**
   * Check if this handler can process the given output
   * @param {Object} output - Output to check
   * @returns {boolean} - True if this handler can process the output
   */
  canProcess(output) {
    return output.type === OutputType.AUDIO && 
      (output.content || output.url || output.file || output.text);
  }
  
  /**
   * Process the audio output
   * @param {Object} output - Output to process
   * @returns {Promise<Object>} - Processed output with audio URL or path
   */
  async process(output) {
    try {
      let audioUrl;
      let audioPath;
      
      if (output.url) {
        // Output already has a URL
        audioUrl = output.url;
      } else if (output.file) {
        // Output has a file path
        audioPath = output.file;
        audioUrl = this._getPublicUrl(audioPath);
      } else if (output.text && this.options.textToSpeechApiUrl && this.options.textToSpeechApiKey) {
        // Generate audio from text
        const generatedAudio = await this._generateAudio(output.text);
        audioUrl = generatedAudio.url;
        audioPath = generatedAudio.path;
      } else if (output.content) {
        // Assume content is a URL
        audioUrl = output.content;
      } else {
        throw new Error('Invalid audio output format');
      }
      
      return {
        type: OutputType.AUDIO,
        url: audioUrl,
        path: audioPath,
        processed: true,
        metadata: {
          ...output.metadata || {},
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Error processing audio output:', error.message);
      throw error;
    }
  }
  
  /**
   * Generate audio from text using text-to-speech API
   * @param {string} text - Text to convert to speech
   * @returns {Promise<Object>} - Generated audio info
   * @private
   */
  async _generateAudio(text) {
    try {
      const response = await axios({
        method: 'post',
        url: this.options.textToSpeechApiUrl,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.options.textToSpeechApiKey}`
        },
        data: {
          input: { text },
          voice: {
            languageCode: 'en-US',
            name: 'en-US-Standard-B'
          },
          audioConfig: {
            audioEncoding: 'MP3'
          }
        },
        responseType: 'arraybuffer'
      });
      
      // Save the audio file
      const filename = `${uuidv4()}.mp3`;
      const filePath = path.join(this.options.outputDir, filename);
      
      fs.writeFileSync(filePath, response.data);
      
      return {
        url: this._getPublicUrl(filePath),
        path: filePath
      };
    } catch (error) {
      logger.error('Error generating audio:', error.message);
      throw error;
    }
  }
  
  /**
   * Get public URL for a local file path
   * @param {string} filePath - Local file path
   * @returns {string} - Public URL
   * @private
   */
  _getPublicUrl(filePath) {
    // This would normally convert a local path to a public URL
    // For now, we'll just return the filename
    const filename = path.basename(filePath);
    return `/outputs/${filename}`;
  }
}

/**
 * Card output handler
 */
class CardOutputHandler extends OutputHandler {
  /**
   * Check if this handler can process the given output
   * @param {Object} output - Output to check
   * @returns {boolean} - True if this handler can process the output
   */
  canProcess(output) {
    return output.type === OutputType.CARD && 
      output.content && 
      typeof output.content === 'object';
  }
  
  /**
   * Process the card output
   * @param {Object} output - Output to process
   * @returns {Promise<Object>} - Processed output
   */
  async process(output) {
    try {
      // Validate card content
      const content = output.content;
      
      if (!content.title) {
        throw new Error('Card must have a title');
      }
      
      return {
        type: OutputType.CARD,
        content: {
          title: content.title,
          subtitle: content.subtitle || '',
          imageUrl: content.imageUrl || '',
          buttons: Array.isArray(content.buttons) ? content.buttons : [],
          text: content.text || ''
        },
        processed: true,
        metadata: output.metadata || {}
      };
    } catch (error) {
      logger.error('Error processing card output:', error.message);
      throw error;
    }
  }
}

/**
 * Carousel output handler
 */
class CarouselOutputHandler extends OutputHandler {
  /**
   * Check if this handler can process the given output
   * @param {Object} output - Output to check
   * @returns {boolean} - True if this handler can process the output
   */
  canProcess(output) {
    return output.type === OutputType.CAROUSEL && 
      output.content && 
      Array.isArray(output.content);
  }
  
  /**
   * Process the carousel output
   * @param {Object} output - Output to process
   * @returns {Promise<Object>} - Processed output
   */
  async process(output) {
    try {
      // Validate carousel content
      const items = output.content;
      
      if (items.length === 0) {
        throw new Error('Carousel must have at least one item');
      }
      
      // Process each item as a card
      const cardHandler = new CardOutputHandler();
      const processedItems = [];
      
      for (const item of items) {
        const cardOutput = await cardHandler.process({
          type: OutputType.CARD,
          content: item
        });
        
        processedItems.push(cardOutput.content);
      }
      
      return {
        type: OutputType.CAROUSEL,
        content: processedItems,
        processed: true,
        metadata: output.metadata || {}
      };
    } catch (error) {
      logger.error('Error processing carousel output:', error.message);
      throw error;
    }
  }
}

/**
 * Quick reply output handler
 */
class QuickReplyOutputHandler extends OutputHandler {
  /**
   * Check if this handler can process the given output
   * @param {Object} output - Output to check
   * @returns {boolean} - True if this handler can process the output
   */
  canProcess(output) {
    return output.type === OutputType.QUICK_REPLY && 
      output.content && 
      (typeof output.content === 'string' || Array.isArray(output.content.replies));
  }
  
  /**
   * Process the quick reply output
   * @param {Object} output - Output to process
   * @returns {Promise<Object>} - Processed output
   */
  async process(output) {
    try {
      let text = '';
      let replies = [];
      
      if (typeof output.content === 'string') {
        // Content is just the text, replies should be in the replies field
        text = output.content;
        replies = Array.isArray(output.replies) ? output.replies : [];
      } else {
        // Content is an object with text and replies
        text = output.content.text || '';
        replies = Array.isArray(output.content.replies) ? output.content.replies : [];
      }
      
      // Validate replies
      if (replies.length === 0) {
        throw new Error('Quick reply must have at least one reply option');
      }
      
      // Normalize replies
      const normalizedReplies = replies.map(reply => {
        if (typeof reply === 'string') {
          return {
            text: reply,
            value: reply
          };
        } else if (typeof reply === 'object') {
          return {
            text: reply.text || reply.title || '',
            value: reply.value || reply.payload || reply.text || ''
          };
        }
        return null;
      }).filter(Boolean);
      
      return {
        type: OutputType.QUICK_REPLY,
        content: {
          text,
          replies: normalizedReplies
        },
        processed: true,
        metadata: output.metadata || {}
      };
    } catch (error) {
      logger.error('Error processing quick reply output:', error.message);
      throw error;
    }
  }
}

/**
 * Custom output handler
 */
class CustomOutputHandler extends OutputHandler {
  /**
   * Check if this handler can process the given output
   * @param {Object} output - Output to check
   * @returns {boolean} - True if this handler can process the output
   */
  canProcess(output) {
    return output.type === OutputType.CUSTOM && output.content !== undefined;
  }
  
  /**
   * Process the custom output
   * @param {Object} output - Output to process
   * @returns {Promise<Object>} - Processed output
   */
  async process(output) {
    // Custom outputs are passed through as-is
    return {
      type: OutputType.CUSTOM,
      content: output.content,
      processed: true,
      metadata: output.metadata || {}
    };
  }
}

/**
 * Multi-modal Output Service class
 */
class OutputService {
  /**
   * Constructor
   * @param {Object} options - Service options
   */
  constructor(options = {}) {
    this.options = options;
    
    // Initialize handlers
    this.handlers = [
      new TextOutputHandler(options.text),
      new ImageOutputHandler(options.image),
      new AudioOutputHandler(options.audio),
      new CardOutputHandler(options.card),
      new CarouselOutputHandler(options.carousel),
      new QuickReplyOutputHandler(options.quickReply),
      new CustomOutputHandler(options.custom)
    ];
    
    logger.info('Multi-modal Output Service initialized');
  }
  
  /**
   * Register a new output handler
   * @param {OutputHandler} handler - Handler to register
   * @returns {OutputService} - This instance for chaining
   */
  registerHandler(handler) {
    if (handler instanceof OutputHandler) {
      this.handlers.push(handler);
    } else {
      throw new Error('Handler must be an instance of OutputHandler');
    }
    
    return this;
  }
  
  /**
   * Process an output
   * @param {Object} output - Output to process
   * @returns {Promise<Object>} - Processed output
   */
  async processOutput(output) {
    try {
      // Find a handler that can process this output
      for (const handler of this.handlers) {
        if (handler.canProcess(output)) {
          return await handler.process(output);
        }
      }
      
      throw new Error(`No handler found for output type: ${output.type}`);
    } catch (error) {
      logger.error('Error processing output:', error.message);
      throw error;
    }
  }
  
  /**
   * Process multiple outputs
   * @param {Array<Object>} outputs - Outputs to process
   * @returns {Promise<Array<Object>>} - Processed outputs
   */
  async processOutputs(outputs) {
    try {
      const results = [];
      
      for (const output of outputs) {
        try {
          const result = await this.processOutput(output);
          results.push(result);
        } catch (error) {
          logger.error(`Error processing output ${output.type}:`, error.message);
          results.push({
            type: output.type,
            error: error.message,
            processed: false
          });
        }
      }
      
      return results;
    } catch (error) {
      logger.error('Error processing outputs:', error.message);
      throw error;
    }
  }
  
  /**
   * Create a text output
   * @param {string} text - Text content
   * @param {Object} metadata - Optional metadata
   * @returns {Object} - Text output object
   */
  createTextOutput(text, metadata = {}) {
    return {
      type: OutputType.TEXT,
      content: text,
      metadata
    };
  }
  
  /**
   * Create an image output
   * @param {Object} options - Image options
   * @returns {Object} - Image output object
   */
  createImageOutput(options) {
    return {
      type: OutputType.IMAGE,
      ...options,
      metadata: options.metadata || {}
    };
  }
  
  /**
   * Create an audio output
   * @param {Object} options - Audio options
   * @returns {Object} - Audio output object
   */
  createAudioOutput(options) {
    return {
      type: OutputType.AUDIO,
      ...options,
      metadata: options.metadata || {}
    };
  }
  
  /**
   * Create a card output
   * @param {Object} card - Card content
   * @param {Object} metadata - Optional metadata
   * @returns {Object} - Card output object
   */
  createCardOutput(card, metadata = {}) {
    return {
      type: OutputType.CARD,
      content: card,
      metadata
    };
  }
  
  /**
   * Create a carousel output
   * @param {Array<Object>} items - Carousel items
   * @param {Object} metadata - Optional metadata
   * @returns {Object} - Carousel output object
   */
  createCarouselOutput(items, metadata = {}) {
    return {
      type: OutputType.CAROUSEL,
      content: items,
      metadata
    };
  }
  
  /**
   * Create a quick reply output
   * @param {string} text - Text content
   * @param {Array<Object|string>} replies - Quick reply options
   * @param {Object} metadata - Optional metadata
   * @returns {Object} - Quick reply output object
   */
  createQuickReplyOutput(text, replies, metadata = {}) {
    return {
      type: OutputType.QUICK_REPLY,
      content: {
        text,
        replies
      },
      metadata
    };
  }
  
  /**
   * Create a custom output
   * @param {*} content - Custom content
   * @param {Object} metadata - Optional metadata
   * @returns {Object} - Custom output object
   */
  createCustomOutput(content, metadata = {}) {
    return {
      type: OutputType.CUSTOM,
      content,
      metadata
    };
  }
}

// Create singleton instance
const outputService = new OutputService();

module.exports = {
  outputService,
  OutputType,
  OutputHandler,
  TextOutputHandler,
  ImageOutputHandler,
  AudioOutputHandler,
  CardOutputHandler,
  CarouselOutputHandler,
  QuickReplyOutputHandler,
  CustomOutputHandler
};
