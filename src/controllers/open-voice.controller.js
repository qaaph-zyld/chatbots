/**
 * Open-Source Voice Controller
 * 
 * Handles API requests related to the open-source voice interface functionality
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const openVoiceService = require('../services/open-voice.service');
const chatbotService = require('../bot/core');
const logger = require('../utils/logger');
const config = require('../config/open-voice.config');

// Configure multer for audio file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../temp/voice/uploads');
    
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

// File filter for audio files
const fileFilter = (req, file, cb) => {
  // Accept audio files
  if (file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new Error('Only audio files are allowed'), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.storage?.maxFileSize || 10 * 1024 * 1024 // 10MB default
  }
});

/**
 * Upload middleware
 */
exports.uploadAudio = upload.single('audio');

/**
 * Process voice input and get chatbot response
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.processVoiceInput = async (req, res) => {
  try {
    // Validate request
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No audio file provided'
      });
    }
    
    const chatbotId = req.params.chatbotId;
    if (!chatbotId) {
      return res.status(400).json({
        success: false,
        message: 'Chatbot ID is required'
      });
    }
    
    // Get user ID from authenticated user or use anonymous
    const userId = req.user?.id || 'anonymous';
    
    // Get or create conversation ID
    const conversationId = req.body.conversationId || uuidv4();
    
    // Get options from request
    const options = {
      stt: {
        language: req.body.language || req.query.language,
        engine: req.body.sttEngine || req.query.sttEngine
      },
      tts: {
        voice: req.body.voice || req.query.voice,
        language: req.body.language || req.query.language,
        engine: req.body.ttsEngine || req.query.ttsEngine
      },
      input: {
        userId,
        conversationId
      }
    };
    
    // Process voice input
    logger.info(`Processing voice input for chatbot ${chatbotId}`);
    const processedInput = await openVoiceService.processVoiceInput(req.file.path, options);
    
    // Process with chatbot
    const chatbotResponse = await chatbotService.processMessage(
      chatbotId,
      processedInput.text,
      userId,
      conversationId,
      {
        inputType: 'voice',
        processedInput
      }
    );
    
    // Generate voice response
    const voiceResponse = await openVoiceService.processVoiceOutput(chatbotResponse, options);
    
    // Return response
    res.status(200).json({
      success: true,
      input: {
        text: processedInput.text,
        audioUrl: `/api/open-voice/audio/${path.basename(req.file.path)}`,
        engine: processedInput.engine
      },
      response: {
        text: chatbotResponse.text,
        audioUrl: `/api/open-voice/audio/${path.basename(voiceResponse.voice.audioUrl.replace('file://', ''))}`,
        engine: voiceResponse.voice.engine
      },
      conversationId
    });
    
    // Clean up input file after processing
    setTimeout(() => {
      try {
        fs.unlinkSync(req.file.path);
      } catch (error) {
        logger.error(`Error deleting input file: ${req.file.path}`, error);
      }
    }, 60000); // Delete after 1 minute
  } catch (error) {
    logger.error('Error processing voice input', error);
    
    res.status(500).json({
      success: false,
      message: 'Error processing voice input',
      error: error.message
    });
  }
};

/**
 * Convert text to speech
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.textToSpeech = async (req, res) => {
  try {
    // Validate request
    if (!req.body.text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }
    
    // Get options from request
    const options = {
      voice: req.body.voice || req.query.voice,
      language: req.body.language || req.query.language,
      engine: req.body.engine || req.query.engine,
      speakingRate: req.body.speakingRate,
      pitch: req.body.pitch
    };
    
    // Convert text to speech
    logger.info('Converting text to speech with open-source engine');
    const ttsResult = await openVoiceService.textToSpeech(req.body.text, options);
    
    // Return response
    res.status(200).json({
      success: true,
      text: req.body.text,
      audioUrl: `/api/open-voice/audio/${path.basename(ttsResult.filePath)}`,
      engine: ttsResult.engine,
      voice: ttsResult.voice,
      language: ttsResult.languageCode
    });
  } catch (error) {
    logger.error('Error converting text to speech', error);
    
    res.status(500).json({
      success: false,
      message: 'Error converting text to speech',
      error: error.message
    });
  }
};

/**
 * Convert speech to text
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.speechToText = async (req, res) => {
  try {
    // Validate request
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No audio file provided'
      });
    }
    
    // Get options from request
    const options = {
      language: req.body.language || req.query.language,
      engine: req.body.engine || req.query.engine
    };
    
    // Convert speech to text
    logger.info('Converting speech to text with open-source engine');
    const sttResult = await openVoiceService.speechToText(req.file.path, options);
    
    // Return response
    res.status(200).json({
      success: true,
      text: sttResult.text,
      confidence: sttResult.confidence,
      engine: sttResult.engine,
      language: sttResult.languageCode
    });
    
    // Clean up input file after processing
    setTimeout(() => {
      try {
        fs.unlinkSync(req.file.path);
      } catch (error) {
        logger.error(`Error deleting input file: ${req.file.path}`, error);
      }
    }, 60000); // Delete after 1 minute
  } catch (error) {
    logger.error('Error converting speech to text', error);
    
    res.status(500).json({
      success: false,
      message: 'Error converting speech to text',
      error: error.message
    });
  }
};

/**
 * Serve audio file
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.serveAudio = (req, res) => {
  try {
    const fileName = req.params.fileName;
    if (!fileName) {
      return res.status(400).json({
        success: false,
        message: 'File name is required'
      });
    }
    
    // Prevent directory traversal
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file name'
      });
    }
    
    // Check if file exists in voice temp directory
    const filePath = path.join(__dirname, '../../temp/voice', fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Audio file not found'
      });
    }
    
    // Determine content type
    const ext = path.extname(fileName).toLowerCase();
    let contentType = 'audio/mpeg'; // Default
    
    if (ext === '.wav') {
      contentType = 'audio/wav';
    } else if (ext === '.ogg') {
      contentType = 'audio/ogg';
    } else if (ext === '.flac') {
      contentType = 'audio/flac';
    }
    
    // Set headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    
    // Stream file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    logger.error('Error serving audio file', error);
    
    res.status(500).json({
      success: false,
      message: 'Error serving audio file',
      error: error.message
    });
  }
};

/**
 * Get available voices
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getVoices = async (req, res) => {
  try {
    // Get engine and language from request
    const engine = req.query.engine;
    const language = req.query.language;
    
    // Get available voices
    const voices = await openVoiceService.getAvailableVoices(engine, language);
    
    // Return response
    res.status(200).json({
      success: true,
      engine: engine || config.tts.engine,
      voices
    });
  } catch (error) {
    logger.error('Error getting voices', error);
    
    res.status(500).json({
      success: false,
      message: 'Error getting voices',
      error: error.message
    });
  }
};

/**
 * Get voice settings
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getVoiceSettings = async (req, res) => {
  try {
    // Get chatbot ID from request
    const chatbotId = req.params.chatbotId;
    
    if (!chatbotId) {
      return res.status(400).json({
        success: false,
        message: 'Chatbot ID is required'
      });
    }
    
    // In a real implementation, we would fetch voice settings for the chatbot
    // For now, we'll return default settings
    
    res.status(200).json({
      success: true,
      chatbotId,
      settings: {
        enabled: true,
        stt: {
          engine: config.stt.engine,
          language: config.stt.language
        },
        tts: {
          engine: config.tts.engine,
          voice: config.tts.voice,
          language: config.tts.language,
          speakingRate: config.tts.speakingRate,
          pitch: config.tts.pitch
        }
      }
    });
  } catch (error) {
    logger.error('Error getting voice settings', error);
    
    res.status(500).json({
      success: false,
      message: 'Error getting voice settings',
      error: error.message
    });
  }
};

/**
 * Update voice settings
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.updateVoiceSettings = async (req, res) => {
  try {
    // Get chatbot ID from request
    const chatbotId = req.params.chatbotId;
    
    if (!chatbotId) {
      return res.status(400).json({
        success: false,
        message: 'Chatbot ID is required'
      });
    }
    
    // Validate settings
    if (!req.body.settings) {
      return res.status(400).json({
        success: false,
        message: 'Settings are required'
      });
    }
    
    // In a real implementation, we would update voice settings for the chatbot
    // For now, we'll just return the provided settings
    
    res.status(200).json({
      success: true,
      chatbotId,
      settings: req.body.settings,
      message: 'Voice settings updated successfully'
    });
  } catch (error) {
    logger.error('Error updating voice settings', error);
    
    res.status(500).json({
      success: false,
      message: 'Error updating voice settings',
      error: error.message
    });
  }
};

/**
 * Get model information
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getModelInfo = async (req, res) => {
  try {
    // Get model information
    const modelInfo = await openVoiceService.getModelInfo();
    
    // Return response
    res.status(200).json({
      success: true,
      ...modelInfo
    });
  } catch (error) {
    logger.error('Error getting model information', error);
    
    res.status(500).json({
      success: false,
      message: 'Error getting model information',
      error: error.message
    });
  }
};
