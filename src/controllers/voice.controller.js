/**
 * Voice Controller
 * 
 * Handles API requests related to voice interface functionality
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const voiceService = require('../services/voice.service');
const chatbotService = require('../bot/core');
const logger = require('../utils/logger');
const config = require('../config');

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
    fileSize: config.voice?.maxFileSize || 10 * 1024 * 1024 // 10MB default
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
        provider: req.body.sttProvider || req.query.sttProvider
      },
      tts: {
        voice: req.body.voice || req.query.voice,
        language: req.body.language || req.query.language,
        provider: req.body.ttsProvider || req.query.ttsProvider
      },
      input: {
        userId,
        conversationId
      }
    };
    
    // Process voice input
    logger.info(`Processing voice input for chatbot ${chatbotId}`);
    const processedInput = await voiceService.processVoiceInput(req.file.path, options);
    
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
    const voiceResponse = await voiceService.processVoiceOutput(chatbotResponse, options);
    
    // Return response
    res.status(200).json({
      success: true,
      input: {
        text: processedInput.text,
        audioUrl: `/api/voice/audio/${path.basename(req.file.path)}`
      },
      response: {
        text: chatbotResponse.text,
        audioUrl: `/api/voice/audio/${path.basename(voiceResponse.voice.audioUrl.replace('file://', ''))}`
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
      tts: {
        voice: req.body.voice || req.query.voice,
        language: req.body.language || req.query.language,
        provider: req.body.provider || req.query.provider,
        speakingRate: req.body.speakingRate,
        pitch: req.body.pitch
      }
    };
    
    // Convert text to speech
    logger.info('Converting text to speech');
    const ttsResult = await voiceService.textToSpeech(req.body.text, options.tts);
    
    // Return response
    res.status(200).json({
      success: true,
      text: req.body.text,
      audioUrl: `/api/voice/audio/${path.basename(ttsResult.filePath)}`,
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
      provider: req.body.provider || req.query.provider
    };
    
    // Convert speech to text
    logger.info('Converting speech to text');
    const sttResult = await voiceService.speechToText(req.file.path, options);
    
    // Return response
    res.status(200).json({
      success: true,
      text: sttResult.text,
      confidence: sttResult.confidence,
      alternatives: sttResult.alternatives,
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
    // Get provider from request
    const provider = req.query.provider || config.voice?.tts?.provider || 'google';
    const language = req.query.language;
    
    // In a real implementation, we would fetch available voices from the provider
    // For now, we'll return a simulated list
    
    let voices = [];
    
    if (provider === 'google') {
      voices = [
        { id: 'en-US-Neural2-A', name: 'Male (A)', language: 'en-US', gender: 'MALE' },
        { id: 'en-US-Neural2-C', name: 'Male (C)', language: 'en-US', gender: 'MALE' },
        { id: 'en-US-Neural2-D', name: 'Male (D)', language: 'en-US', gender: 'MALE' },
        { id: 'en-US-Neural2-F', name: 'Female (F)', language: 'en-US', gender: 'FEMALE' },
        { id: 'en-US-Neural2-G', name: 'Female (G)', language: 'en-US', gender: 'FEMALE' },
        { id: 'en-US-Neural2-H', name: 'Female (H)', language: 'en-US', gender: 'FEMALE' },
        { id: 'en-GB-Neural2-A', name: 'Male (A)', language: 'en-GB', gender: 'MALE' },
        { id: 'en-GB-Neural2-B', name: 'Male (B)', language: 'en-GB', gender: 'MALE' },
        { id: 'en-GB-Neural2-C', name: 'Female (C)', language: 'en-GB', gender: 'FEMALE' },
        { id: 'en-GB-Neural2-D', name: 'Female (D)', language: 'en-GB', gender: 'FEMALE' }
      ];
    } else if (provider === 'azure') {
      voices = [
        { id: 'en-US-AriaNeural', name: 'Aria', language: 'en-US', gender: 'Female' },
        { id: 'en-US-GuyNeural', name: 'Guy', language: 'en-US', gender: 'Male' },
        { id: 'en-US-JennyNeural', name: 'Jenny', language: 'en-US', gender: 'Female' },
        { id: 'en-GB-LibbyNeural', name: 'Libby', language: 'en-GB', gender: 'Female' },
        { id: 'en-GB-RyanNeural', name: 'Ryan', language: 'en-GB', gender: 'Male' }
      ];
    } else if (provider === 'aws') {
      voices = [
        { id: 'Joanna', name: 'Joanna', language: 'en-US', gender: 'Female' },
        { id: 'Matthew', name: 'Matthew', language: 'en-US', gender: 'Male' },
        { id: 'Amy', name: 'Amy', language: 'en-GB', gender: 'Female' },
        { id: 'Brian', name: 'Brian', language: 'en-GB', gender: 'Male' }
      ];
    }
    
    // Filter by language if provided
    if (language) {
      voices = voices.filter(voice => voice.language === language);
    }
    
    // Return response
    res.status(200).json({
      success: true,
      provider,
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
          provider: config.voice?.stt?.provider || 'google',
          language: config.voice?.stt?.language || 'en-US'
        },
        tts: {
          provider: config.voice?.tts?.provider || 'google',
          voice: config.voice?.tts?.voice || 'en-US-Neural2-F',
          language: config.voice?.tts?.language || 'en-US',
          speakingRate: config.voice?.tts?.speakingRate || 1.0,
          pitch: config.voice?.tts?.pitch || 0
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
