/**
 * Voice Interface Service
 * 
 * This service provides voice interface capabilities for chatbots,
 * including speech-to-text and text-to-speech functionality.
 */

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('@src/utils/logger');
const config = require('@src/config');
const inputService = require('@src/services/input.service');
const outputService = require('@src/services/output.service');

class VoiceService {
  constructor(inputService, outputService) {
    this.inputService = inputService;
    this.outputService = outputService;
    this.tempDir = path.join(process.cwd(), 'temp', 'audio');
    this.cleanupInterval = null;
    
    // Only schedule cleanup in production, not during tests
    if (process.env.NODE_ENV !== 'test') {
      this.scheduleCleanup();
    }
  }

  /**
   * Initialize the service and create necessary directories
   */
  async initialize() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create temp directory:', error);
    }
  }

  /**
   * Save audio data to file
   */
  async saveAudioFile(audioData, filename) {
    try {
      // Ensure temp directory exists
      await fs.mkdir(this.tempDir, { recursive: true });
      
      const filePath = path.join(this.tempDir, filename);
      await fs.writeFile(filePath, audioData);
      
      return filePath;
    } catch (error) {
      throw new Error(`Failed to save audio file: ${error.message}`);
    }
  }

  /**
   * Load audio data from file
   */
  async loadAudioFile(filename) {
    try {
      const filePath = path.join(this.tempDir, filename);
      const audioData = await fs.readFile(filePath);
      
      return audioData;
    } catch (error) {
      throw new Error(`Failed to load audio file: ${error.message}`);
    }
  }

  /**
   * Convert speech to text using input service
   */
  async speechToText(audioData) {
    try {
      if (!this.inputService || typeof this.inputService.processAudio !== 'function') {
        throw new Error('Input service not properly configured');
      }
      
      const result = await this.inputService.processAudio(audioData);
      return result.text || result;
    } catch (error) {
      throw new Error(`Speech to text conversion failed: ${error.message}`);
    }
  }

  /**
   * Convert text to speech using output service
   */
  async textToSpeech(text) {
    try {
      if (!this.outputService || typeof this.outputService.synthesizeSpeech !== 'function') {
        throw new Error('Output service not properly configured');
      }
      
      const audioData = await this.outputService.synthesizeSpeech(text);
      return audioData;
    } catch (error) {
      throw new Error(`Text to speech synthesis failed: ${error.message}`);
    }
  }

  /**
   * Schedule cleanup of temporary files
   */
  scheduleCleanup() {
    const cleanupInterval = 3600000; // 1 hour

    this.cleanupInterval = setInterval(() => {
      this.cleanupTempFiles();
    }, cleanupInterval);
  }

  /**
   * Clean up temporary files older than specified time
   */
  async cleanupTempFiles(maxAge = 3600000) { // 1 hour default
    try {
      const files = await fs.readdir(this.tempDir);
      const now = Date.now();

      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
        }
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  /**
   * Shutdown the service and cleanup resources
   */
  async shutdown() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    // Perform final cleanup
    await this.cleanupTempFiles(0); // Clean all files
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
      const sttResult = await this.speechToText(audioData);
      
      // Process as input for chatbot
      const input = {
        type: 'voice',
        text: sttResult,
        originalAudio: audioData,
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
      const ttsResult = await this.textToSpeech(text);
      
      // Create voice output
      const voiceOutput = {
        ...output,
        voice: {
          audioData: ttsResult,
        }
      };
      
      // Use output service to process
      return await outputService.processOutput(voiceOutput);
    } catch (error) {
      logger.error('Error processing voice output', error);
      throw error;
    }
  }
}

module.exports = VoiceService;
