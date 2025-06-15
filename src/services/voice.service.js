/**
 * Voice Interface Service
 * 
 * This service provides voice interface capabilities for chatbots,
 * including speech-to-text and text-to-speech functionality.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('@src/utils/logger');
const config = require('@src/config');
const inputService = require('@src/services/input.service');
const outputService = require('@src/services/output.service');

class VoiceService {
  constructor() {
    this.config = {
      stt: {
        provider: config.voice?.stt?.provider || 'google',
        apiKey: config.voice?.stt?.apiKey,
        region: config.voice?.stt?.region || 'global',
        language: config.voice?.stt?.language || 'en-US',
        alternativeLanguages: config.voice?.stt?.alternativeLanguages || ['en-GB', 'en-AU'],
        maxDuration: config.voice?.stt?.maxDuration || 60, // seconds
        sampleRate: config.voice?.stt?.sampleRate || 16000,
        encoding: config.voice?.stt?.encoding || 'LINEAR16',
        model: config.voice?.stt?.model || 'default'
      },
      tts: {
        provider: config.voice?.tts?.provider || 'google',
        apiKey: config.voice?.tts?.apiKey,
        region: config.voice?.tts?.region || 'global',
        language: config.voice?.tts?.language || 'en-US',
        voice: config.voice?.tts?.voice || 'en-US-Neural2-F',
        speakingRate: config.voice?.tts?.speakingRate || 1.0,
        pitch: config.voice?.tts?.pitch || 0,
        volumeGainDb: config.voice?.tts?.volumeGainDb || 0,
        audioEncoding: config.voice?.tts?.audioEncoding || 'MP3'
      },
      storage: {
        tempDir: config.voice?.storage?.tempDir || path.join(__dirname, '../../temp/voice'),
        maxAge: config.voice?.storage?.maxAge || 3600 // seconds
      },
      recognition: {
        enabled: config.voice?.recognition?.enabled || false,
        minConfidence: config.voice?.recognition?.minConfidence || 0.7,
        modelPath: config.voice?.recognition?.modelPath || path.join(__dirname, '../../models/voice-recognition')
      }
    };

    this.cleanupInterval = null;

    // Ensure temp directory exists
    if (!fs.existsSync(this.config.storage.tempDir)) {
      fs.mkdirSync(this.config.storage.tempDir, { recursive: true });
    }

    // Initialize voice recognition if enabled
    if (this.config.recognition.enabled) {
      this.initializeVoiceRecognition();
    }

    // Schedule cleanup of temp files
    this.scheduleCleanup();

    logger.info('Voice service initialized');
  }

  /**
   * Initialize voice recognition system
   */
  async initializeVoiceRecognition() {
    try {
      logger.info('Initializing voice recognition system');
      
      // This would typically load a voice recognition model
      // For now, we'll just log that it's initialized
      
      logger.info('Voice recognition system initialized');
    } catch (error) {
      logger.error('Failed to initialize voice recognition system', error);
    }
  }

  /**
   * Schedule cleanup of temporary voice files
   */
  scheduleCleanup() {
    const cleanupInterval = 3600000; // 1 hour
    
    this.cleanupInterval = setInterval(() => {
      this.cleanupTempFiles();
    }, cleanupInterval);
  }

  /**
   * Clean up temporary voice files
   */
  cleanupTempFiles() {
    try {
      logger.info('Cleaning up temporary voice files');
      
      const now = Date.now();
      const files = fs.readdirSync(this.config.storage.tempDir);
      
      let deletedCount = 0;
      
      for (const file of files) {
        const filePath = path.join(this.config.storage.tempDir, file);
        const stats = fs.statSync(filePath);
        
        const fileAge = (now - stats.mtimeMs) / 1000; // age in seconds
        
        if (fileAge > this.config.storage.maxAge) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }
      
      logger.info(`Cleaned up ${deletedCount} temporary voice files`);
    } catch (error) {
      logger.error('Error cleaning up temporary voice files', error);
    }
  }

  /**
   * Shutdown the voice service
   */
  shutdown() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      this.cleanupTempFiles();
    }
  }

  /**
   * Convert speech to text
   * @param {Buffer|String} audioData - Audio data as buffer or path to audio file
   * @param {Object} options - Speech-to-text options
   * @returns {Promise<Object>} Transcription result
   */
  async speechToText(audioData, options = {}) {
    try {
      logger.info('Converting speech to text');
      
      const sttConfig = {
        ...this.config.stt,
        ...options
      };
      
      // Handle file path or buffer
      let audioBuffer;
      if (typeof audioData === 'string') {
        audioBuffer = fs.readFileSync(audioData);
      } else {
        audioBuffer = audioData;
      }
      
      // Choose provider
      switch (sttConfig.provider.toLowerCase()) {
        case 'google':
          return await this.googleSpeechToText(audioBuffer, sttConfig);
        case 'azure':
          return await this.azureSpeechToText(audioBuffer, sttConfig);
        case 'aws':
          return await this.awsSpeechToText(audioBuffer, sttConfig);
        default:
          throw new Error(`Unsupported STT provider: ${sttConfig.provider}`);
      }
    } catch (error) {
      logger.error('Error in speech-to-text conversion', error);
      throw error;
    }
  }

  /**
   * Google Cloud Speech-to-Text implementation
   * @param {Buffer} audioBuffer - Audio data buffer
   * @param {Object} config - Configuration
   * @returns {Promise<Object>} Transcription result
   */
  async googleSpeechToText(audioBuffer, config) {
    try {
      logger.info('Using Google Speech-to-Text');
      
      // In a real implementation, we would use the Google Cloud Speech-to-Text API
      // For now, we'll simulate the response
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simulate response
      return {
        text: 'This is a simulated speech-to-text result.',
        confidence: 0.95,
        alternatives: [
          { text: 'This is a simulated speech to text result.', confidence: 0.92 },
          { text: 'This is a simulated speech-to-text result', confidence: 0.90 }
        ],
        languageCode: config.language
      };
    } catch (error) {
      logger.error('Error in Google Speech-to-Text', error);
      throw error;
    }
  }

  /**
   * Azure Speech-to-Text implementation
   * @param {Buffer} audioBuffer - Audio data buffer
   * @param {Object} config - Configuration
   * @returns {Promise<Object>} Transcription result
   */
  async azureSpeechToText(audioBuffer, config) {
    try {
      logger.info('Using Azure Speech-to-Text');
      
      // In a real implementation, we would use the Azure Speech-to-Text API
      // For now, we'll simulate the response
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simulate response
      return {
        text: 'This is a simulated speech-to-text result from Azure.',
        confidence: 0.93,
        alternatives: [
          { text: 'This is a simulated speech to text result from Azure.', confidence: 0.91 },
          { text: 'This is a simulated speech-to-text result from Azure', confidence: 0.89 }
        ],
        languageCode: config.language
      };
    } catch (error) {
      logger.error('Error in Azure Speech-to-Text', error);
      throw error;
    }
  }

  /**
   * AWS Speech-to-Text implementation
   * @param {Buffer} audioBuffer - Audio data buffer
   * @param {Object} config - Configuration
   * @returns {Promise<Object>} Transcription result
   */
  async awsSpeechToText(audioBuffer, config) {
    try {
      logger.info('Using AWS Speech-to-Text');
      
      // In a real implementation, we would use the AWS Transcribe API
      // For now, we'll simulate the response
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simulate response
      return {
        text: 'This is a simulated speech-to-text result from AWS.',
        confidence: 0.94,
        alternatives: [
          { text: 'This is a simulated speech to text result from AWS.', confidence: 0.92 },
          { text: 'This is a simulated speech-to-text result from AWS', confidence: 0.90 }
        ],
        languageCode: config.language
      };
    } catch (error) {
      logger.error('Error in AWS Speech-to-Text', error);
      throw error;
    }
  }

  /**
   * Convert text to speech
   * @param {String} text - Text to convert to speech
   * @param {Object} options - Text-to-speech options
   * @returns {Promise<Object>} Speech synthesis result
   */
  async textToSpeech(text, options = {}) {
    try {
      logger.info('Converting text to speech');
      
      const ttsConfig = {
        ...this.config.tts,
        ...options
      };
      
      // Choose provider
      let result;
      switch (ttsConfig.provider.toLowerCase()) {
        case 'google':
          result = await this.googleTextToSpeech(text, ttsConfig);
          break;
        case 'azure':
          result = await this.azureTextToSpeech(text, ttsConfig);
          break;
        case 'aws':
          result = await this.awsTextToSpeech(text, ttsConfig);
          break;
        default:
          throw new Error(`Unsupported TTS provider: ${ttsConfig.provider}`);
      }
      
      // Save audio to temp file
      const fileName = `tts-${uuidv4()}.${this.getFileExtension(ttsConfig.audioEncoding)}`;
      const filePath = path.join(this.config.storage.tempDir, fileName);
      
      fs.writeFileSync(filePath, result.audioContent);
      
      return {
        ...result,
        filePath
      };
    } catch (error) {
      logger.error('Error in text-to-speech conversion', error);
      throw error;
    }
  }

  /**
   * Google Cloud Text-to-Speech implementation
   * @param {String} text - Text to convert to speech
   * @param {Object} config - Configuration
   * @returns {Promise<Object>} Speech synthesis result
   */
  async googleTextToSpeech(text, config) {
    try {
      logger.info('Using Google Text-to-Speech');
      
      // In a real implementation, we would use the Google Cloud Text-to-Speech API
      // For now, we'll simulate the response
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simulate audio content (just a placeholder buffer)
      const audioContent = Buffer.from('Simulated audio content');
      
      return {
        audioContent,
        audioConfig: {
          audioEncoding: config.audioEncoding,
          speakingRate: config.speakingRate,
          pitch: config.pitch,
          volumeGainDb: config.volumeGainDb
        },
        voice: config.voice,
        languageCode: config.language
      };
    } catch (error) {
      logger.error('Error in Google Text-to-Speech', error);
      throw error;
    }
  }

  /**
   * Azure Text-to-Speech implementation
   * @param {String} text - Text to convert to speech
   * @param {Object} config - Configuration
   * @returns {Promise<Object>} Speech synthesis result
   */
  async azureTextToSpeech(text, config) {
    try {
      logger.info('Using Azure Text-to-Speech');
      
      // In a real implementation, we would use the Azure Text-to-Speech API
      // For now, we'll simulate the response
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simulate audio content (just a placeholder buffer)
      const audioContent = Buffer.from('Simulated audio content from Azure');
      
      return {
        audioContent,
        audioConfig: {
          audioEncoding: config.audioEncoding,
          speakingRate: config.speakingRate,
          pitch: config.pitch,
          volumeGainDb: config.volumeGainDb
        },
        voice: config.voice,
        languageCode: config.language
      };
    } catch (error) {
      logger.error('Error in Azure Text-to-Speech', error);
      throw error;
    }
  }

  /**
   * AWS Text-to-Speech implementation
   * @param {String} text - Text to convert to speech
   * @param {Object} config - Configuration
   * @returns {Promise<Object>} Speech synthesis result
   */
  async awsTextToSpeech(text, config) {
    try {
      logger.info('Using AWS Text-to-Speech');
      
      // In a real implementation, we would use the AWS Polly API
      // For now, we'll simulate the response
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simulate audio content (just a placeholder buffer)
      const audioContent = Buffer.from('Simulated audio content from AWS');
      
      return {
        audioContent,
        audioConfig: {
          audioEncoding: config.audioEncoding,
          speakingRate: config.speakingRate,
          pitch: config.pitch,
          volumeGainDb: config.volumeGainDb
        },
        voice: config.voice,
        languageCode: config.language
      };
    } catch (error) {
      logger.error('Error in AWS Text-to-Speech', error);
      throw error;
    }
  }

  /**
   * Process voice input and convert to chatbot input
   * @param {Buffer|String} audioData - Audio data as buffer or path to audio file
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Processed input
   */
  async processVoiceInput(audioData, options = {}) {
    try {
      logger.info('Processing voice input');
      
      // Convert speech to text
      const sttResult = await this.speechToText(audioData, options.stt);
      
      // Process as input for chatbot
      const input = {
        type: 'voice',
        text: sttResult.text,
        originalAudio: audioData,
        sttResult,
        ...options.input
      };
      
      // Use input service to process
      return await inputService.processInput(input);
    } catch (error) {
      logger.error('Error processing voice input', error);
      throw error;
    }
  }

  /**
   * Process chatbot output to voice
   * @param {Object} output - Chatbot output
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Processed output with voice
   */
  async processVoiceOutput(output, options = {}) {
    try {
      logger.info('Processing voice output');
      
      // Extract text from output
      let text = '';
      if (typeof output === 'string') {
        text = output;
      } else if (output.text) {
        text = output.text;
      } else if (output.message) {
        text = output.message;
      } else {
        throw new Error('No text found in output');
      }
      
      // Convert text to speech
      const ttsResult = await this.textToSpeech(text, options.tts);
      
      // Create voice output
      const voiceOutput = {
        ...output,
        voice: {
          audioUrl: `file://${ttsResult.filePath}`,
          audioType: ttsResult.audioConfig.audioEncoding.toLowerCase(),
          voice: ttsResult.voice,
          language: ttsResult.languageCode
        }
      };
      
      // Use output service to process
      return await outputService.processOutput(voiceOutput);
    } catch (error) {
      logger.error('Error processing voice output', error);
      throw error;
    }
  }

  /**
   * Recognize speaker (if enabled)
   * @param {Buffer|String} audioData - Audio data as buffer or path to audio file
   * @param {Object} options - Recognition options
   * @returns {Promise<Object>} Speaker recognition result
   */
  async recognizeSpeaker(audioData, options = {}) {
    try {
      if (!this.config.recognition.enabled) {
        logger.warn('Speaker recognition is not enabled');
        return { enabled: false };
      }
      
      logger.info('Recognizing speaker');
      
      // Handle file path or buffer
      let audioBuffer;
      if (typeof audioData === 'string') {
        audioBuffer = fs.readFileSync(audioData);
      } else {
        audioBuffer = audioData;
      }
      
      // In a real implementation, we would use a speaker recognition model
      // For now, we'll simulate the response
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Simulate response
      return {
        enabled: true,
        recognized: Math.random() > 0.3, // 70% chance of recognition
        speakerId: recognized ? 'user-123' : null,
        confidence: recognized ? 0.85 : 0.3,
        possibleSpeakers: [
          { id: 'user-123', confidence: 0.85 },
          { id: 'user-456', confidence: 0.12 }
        ]
      };
    } catch (error) {
      logger.error('Error in speaker recognition', error);
      return { 
        enabled: true,
        recognized: false,
        error: error.message
      };
    }
  }

  /**
   * Get file extension for audio encoding
   * @param {String} encoding - Audio encoding
   * @returns {String} File extension
   */
  getFileExtension(encoding) {
    const encodingMap = {
      'MP3': 'mp3',
      'WAV': 'wav',
      'OGG_OPUS': 'ogg',
      'LINEAR16': 'wav',
      'FLAC': 'flac',
      'ALAW': 'alaw',
      'MULAW': 'mulaw'
    };
    
    return encodingMap[encoding.toUpperCase()] || 'mp3';
  }
}

module.exports = new VoiceService();
