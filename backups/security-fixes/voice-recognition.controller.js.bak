/**
 * Voice Recognition Controller
 * 
 * Handles API requests for voice recognition features.
 */

const voiceRecognitionService = require('../services/voice-recognition.service');
const logger = require('../utils/logger');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config/open-voice.config');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.recognition.tempPath);
  },
  filename: (req, file, cb) => {
    cb(null, `voice_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept only audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

/**
 * Initialize voice recognition service
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.initialize = async (req, res) => {
  try {
    const result = await voiceRecognitionService.initialize();
    
    res.json({
      success: result,
      message: result ? 'Voice recognition service initialized successfully' : 'Failed to initialize voice recognition service'
    });
  } catch (error) {
    logger.error('Error initializing voice recognition service', error);
    
    res.status(500).json({
      success: false,
      message: 'Error initializing voice recognition service',
      error: error.message
    });
  }
};

/**
 * Get speaker profiles
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getSpeakerProfiles = async (req, res) => {
  try {
    // Initialize if not already initialized
    if (!voiceRecognitionService.isInitialized) {
      await voiceRecognitionService.initialize();
    }
    
    const profiles = voiceRecognitionService.getSpeakerProfiles();
    
    res.json({
      success: true,
      profiles
    });
  } catch (error) {
    logger.error('Error getting speaker profiles', error);
    
    res.status(500).json({
      success: false,
      message: 'Error getting speaker profiles',
      error: error.message
    });
  }
};

/**
 * Create speaker profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createSpeakerProfile = async (req, res) => {
  try {
    const { speakerId, name, metadata } = req.body;
    
    if (!speakerId || !name) {
      return res.status(400).json({
        success: false,
        message: 'Speaker ID and name are required'
      });
    }
    
    // Initialize if not already initialized
    if (!voiceRecognitionService.isInitialized) {
      await voiceRecognitionService.initialize();
    }
    
    const result = await voiceRecognitionService.createSpeakerProfile(speakerId, name, metadata);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    logger.error('Error creating speaker profile', error);
    
    res.status(500).json({
      success: false,
      message: 'Error creating speaker profile',
      error: error.message
    });
  }
};

/**
 * Delete speaker profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteSpeakerProfile = async (req, res) => {
  try {
    const { speakerId } = req.params;
    
    if (!speakerId) {
      return res.status(400).json({
        success: false,
        message: 'Speaker ID is required'
      });
    }
    
    // Initialize if not already initialized
    if (!voiceRecognitionService.isInitialized) {
      await voiceRecognitionService.initialize();
    }
    
    const result = await voiceRecognitionService.deleteSpeakerProfile(speakerId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    logger.error('Error deleting speaker profile', error);
    
    res.status(500).json({
      success: false,
      message: 'Error deleting speaker profile',
      error: error.message
    });
  }
};

/**
 * Enroll speaker
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.enrollSpeaker = async (req, res) => {
  try {
    // Handle file upload
    upload.single('audio')(req, res, async (err) => {
      if (err) {
        logger.error('Error uploading audio file', err);
        
        return res.status(400).json({
          success: false,
          message: 'Error uploading audio file',
          error: err.message
        });
      }
      
      const { speakerId } = req.params;
      
      if (!speakerId) {
        return res.status(400).json({
          success: false,
          message: 'Speaker ID is required'
        });
      }
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Audio file is required'
        });
      }
      
      // Initialize if not already initialized
      if (!voiceRecognitionService.isInitialized) {
        await voiceRecognitionService.initialize();
      }
      
      // Read audio file
      const audioData = await fs.promises.readFile(req.file.path);
      
      // Enroll speaker
      const result = await voiceRecognitionService.enrollSpeaker(speakerId, audioData);
      
      // Clean up temporary file
      await fs.promises.unlink(req.file.path);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    });
  } catch (error) {
    logger.error('Error enrolling speaker', error);
    
    res.status(500).json({
      success: false,
      message: 'Error enrolling speaker',
      error: error.message
    });
  }
};

/**
 * Identify speaker
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.identifySpeaker = async (req, res) => {
  try {
    // Handle file upload
    upload.single('audio')(req, res, async (err) => {
      if (err) {
        logger.error('Error uploading audio file', err);
        
        return res.status(400).json({
          success: false,
          message: 'Error uploading audio file',
          error: err.message
        });
      }
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Audio file is required'
        });
      }
      
      // Initialize if not already initialized
      if (!voiceRecognitionService.isInitialized) {
        await voiceRecognitionService.initialize();
      }
      
      // Read audio file
      const audioData = await fs.promises.readFile(req.file.path);
      
      // Identify speaker
      const result = await voiceRecognitionService.identifySpeaker(audioData);
      
      // Clean up temporary file
      await fs.promises.unlink(req.file.path);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    });
  } catch (error) {
    logger.error('Error identifying speaker', error);
    
    res.status(500).json({
      success: false,
      message: 'Error identifying speaker',
      error: error.message
    });
  }
};

/**
 * Verify speaker
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.verifySpeaker = async (req, res) => {
  try {
    // Handle file upload
    upload.single('audio')(req, res, async (err) => {
      if (err) {
        logger.error('Error uploading audio file', err);
        
        return res.status(400).json({
          success: false,
          message: 'Error uploading audio file',
          error: err.message
        });
      }
      
      const { speakerId } = req.params;
      
      if (!speakerId) {
        return res.status(400).json({
          success: false,
          message: 'Speaker ID is required'
        });
      }
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Audio file is required'
        });
      }
      
      // Initialize if not already initialized
      if (!voiceRecognitionService.isInitialized) {
        await voiceRecognitionService.initialize();
      }
      
      // Read audio file
      const audioData = await fs.promises.readFile(req.file.path);
      
      // Verify speaker
      const result = await voiceRecognitionService.verifySpeaker(speakerId, audioData);
      
      // Clean up temporary file
      await fs.promises.unlink(req.file.path);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    });
  } catch (error) {
    logger.error('Error verifying speaker', error);
    
    res.status(500).json({
      success: false,
      message: 'Error verifying speaker',
      error: error.message
    });
  }
};
