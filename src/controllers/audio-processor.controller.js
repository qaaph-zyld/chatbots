/**
 * Audio Processor Controller
 * 
 * Handles API requests for audio processing.
 */

const audioProcessor = require('../utils/audio-processor');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const config = require('../config/open-voice.config');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(process.cwd(), 'temp', 'audio');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    cb(null, `upload_${Date.now()}${path.extname(file.originalname)}`);
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
 * Process audio file
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.processAudio = async (req, res) => {
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
      
      // Get processing options from request
      const options = req.body || {};
      
      // Initialize audio processor if not already initialized
      if (!audioProcessor.initialized) {
        await audioProcessor.initialize();
      }
      
      try {
        // Process audio
        const processedAudio = await audioProcessor.processAudio(req.file.path, {
          sampleRate: parseInt(options.sampleRate) || 16000,
          channels: parseInt(options.channels) || 1,
          format: options.format || 'wav',
          bitDepth: parseInt(options.bitDepth) || 16,
          normalize: options.normalize !== 'false',
          removeSilence: options.removeSilence !== 'false',
          noiseReduction: options.noiseReduction !== 'false',
          gainDb: parseFloat(options.gainDb) || 0
        });
        
        // Generate output filename
        const outputFilename = `processed_${Date.now()}.wav`;
        const outputPath = path.join(process.cwd(), 'temp', 'audio', outputFilename);
        
        // Write processed audio to file
        await fs.promises.writeFile(outputPath, processedAudio);
        
        // Set response headers
        res.setHeader('Content-Type', 'audio/wav');
        res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);
        
        // Send processed audio
        res.send(processedAudio);
        
        // Clean up files
        setTimeout(async () => {
          try {
            await fs.promises.unlink(req.file.path);
            await fs.promises.unlink(outputPath);
          } catch (error) {
            logger.error('Error cleaning up temporary files', error);
          }
        }, 5000);
      } catch (error) {
        logger.error('Error processing audio', error);
        
        res.status(500).json({
          success: false,
          message: 'Error processing audio',
          error: error.message
        });
      }
    });
  } catch (error) {
    logger.error('Error in processAudio controller', error);
    
    res.status(500).json({
      success: false,
      message: 'Error processing audio',
      error: error.message
    });
  }
};

/**
 * Convert audio format
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.convertFormat = async (req, res) => {
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
      
      const { format } = req.body;
      
      if (!format) {
        return res.status(400).json({
          success: false,
          message: 'Format is required'
        });
      }
      
      // Get conversion options from request
      const options = {
        sampleRate: parseInt(req.body.sampleRate) || 16000,
        channels: parseInt(req.body.channels) || 1,
        bitrate: parseInt(req.body.bitrate) || 128
      };
      
      // Initialize audio processor if not already initialized
      if (!audioProcessor.initialized) {
        await audioProcessor.initialize();
      }
      
      try {
        // Convert audio format
        const convertedAudio = await audioProcessor.convertFormat(req.file.path, format, options);
        
        // Generate output filename
        const outputFilename = `converted_${Date.now()}.${format}`;
        
        // Set response headers
        res.setHeader('Content-Type', `audio/${format}`);
        res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);
        
        // Send converted audio
        res.send(convertedAudio);
        
        // Clean up files
        setTimeout(async () => {
          try {
            await fs.promises.unlink(req.file.path);
          } catch (error) {
            logger.error('Error cleaning up temporary files', error);
          }
        }, 5000);
      } catch (error) {
        logger.error('Error converting audio format', error);
        
        res.status(500).json({
          success: false,
          message: 'Error converting audio format',
          error: error.message
        });
      }
    });
  } catch (error) {
    logger.error('Error in convertFormat controller', error);
    
    res.status(500).json({
      success: false,
      message: 'Error converting audio format',
      error: error.message
    });
  }
};

/**
 * Get audio information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAudioInfo = async (req, res) => {
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
      
      // Initialize audio processor if not already initialized
      if (!audioProcessor.initialized) {
        await audioProcessor.initialize();
      }
      
      try {
        // Get audio information
        const audioInfo = await audioProcessor.getAudioInfo(req.file.path);
        
        res.json({
          success: true,
          info: audioInfo
        });
        
        // Clean up files
        setTimeout(async () => {
          try {
            await fs.promises.unlink(req.file.path);
          } catch (error) {
            logger.error('Error cleaning up temporary files', error);
          }
        }, 5000);
      } catch (error) {
        logger.error('Error getting audio information', error);
        
        res.status(500).json({
          success: false,
          message: 'Error getting audio information',
          error: error.message
        });
      }
    });
  } catch (error) {
    logger.error('Error in getAudioInfo controller', error);
    
    res.status(500).json({
      success: false,
      message: 'Error getting audio information',
      error: error.message
    });
  }
};

/**
 * Detect voice activity
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.detectVoiceActivity = async (req, res) => {
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
      
      // Get detection options from request
      const options = {
        threshold: parseFloat(req.body.threshold) || 0.01,
        frameDuration: parseFloat(req.body.frameDuration) || 0.01,
        minSpeechDuration: parseFloat(req.body.minSpeechDuration) || 0.1
      };
      
      // Initialize audio processor if not already initialized
      if (!audioProcessor.initialized) {
        await audioProcessor.initialize();
      }
      
      try {
        // Detect voice activity
        const result = await audioProcessor.detectVoiceActivity(req.file.path, options);
        
        res.json({
          success: true,
          ...result
        });
        
        // Clean up files
        setTimeout(async () => {
          try {
            await fs.promises.unlink(req.file.path);
          } catch (error) {
            logger.error('Error cleaning up temporary files', error);
          }
        }, 5000);
      } catch (error) {
        logger.error('Error detecting voice activity', error);
        
        res.status(500).json({
          success: false,
          message: 'Error detecting voice activity',
          error: error.message
        });
      }
    });
  } catch (error) {
    logger.error('Error in detectVoiceActivity controller', error);
    
    res.status(500).json({
      success: false,
      message: 'Error detecting voice activity',
      error: error.message
    });
  }
};
