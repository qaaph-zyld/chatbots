/**
 * Voice Service Tests
 */

const voiceService = require('../../../services/voice.service');
const inputService = require('../../../services/input.service');
const outputService = require('../../../services/output.service');
const logger = require('../../../utils/logger');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Mock dependencies
jest.mock('axios');
jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn().mockResolvedValue(undefined),
    readFile: jest.fn().mockResolvedValue(Buffer.from('test audio data')),
    mkdir: jest.fn().mockResolvedValue(undefined),
    access: jest.fn().mockResolvedValue(undefined)
  },
  createReadStream: jest.fn().mockReturnValue({ pipe: jest.fn() }),
  existsSync: jest.fn().mockReturnValue(true)
}));
jest.mock('path', () => ({
  join: jest.fn().mockReturnValue('/test/path'),
  dirname: jest.fn().mockReturnValue('/test')
}));
jest.mock('../../../utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));
jest.mock('../../../services/input.service', () => ({
  processVoiceInput: jest.fn().mockResolvedValue({
    text: 'Transcribed text',
    confidence: 0.95
  })
}));
jest.mock('../../../services/output.service', () => ({
  textToSpeech: jest.fn().mockResolvedValue({
    audioData: Buffer.from('synthesized audio data'),
    format: 'wav'
  })
}));

describe('Voice Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('speechToText', () => {
    it('should convert speech to text using Google provider', async () => {
      // Arrange
      const audioData = Buffer.from('test audio data');
      const options = { language: 'en-US' };
      
      // Mock axios response
      axios.post.mockResolvedValueOnce({
        data: {
          results: [
            {
              alternatives: [
                {
                  transcript: 'Transcribed text',
                  confidence: 0.95
                }
              ]
            }
          ]
        }
      });

      // Act
      const result = await voiceService.speechToText(audioData, options);

      // Assert
      expect(result).toHaveProperty('text', 'Transcribed text');
      expect(result).toHaveProperty('confidence', 0.95);
      expect(inputService.processVoiceInput).toHaveBeenCalledWith(audioData, options);
      expect(logger.info).toHaveBeenCalledWith('Speech-to-text conversion completed', expect.any(Object));
    });

    it('should handle errors during speech to text conversion', async () => {
      // Arrange
      const audioData = Buffer.from('test audio data');
      const options = { language: 'en-US' };
      
      // Mock error
      inputService.processVoiceInput.mockRejectedValueOnce(new Error('STT error'));

      // Act & Assert
      await expect(voiceService.speechToText(audioData, options)).rejects.toThrow('STT error');
      expect(logger.error).toHaveBeenCalledWith('Error in speech-to-text conversion:', expect.any(Object));
    });
  });

  describe('textToSpeech', () => {
    it('should convert text to speech using Google provider', async () => {
      // Arrange
      const text = 'Hello world';
      const options = { voice: 'en-US-Wavenet-F' };
      
      // Act
      const result = await voiceService.textToSpeech(text, options);

      // Assert
      expect(result).toHaveProperty('audioData');
      expect(outputService.textToSpeech).toHaveBeenCalledWith(text, options);
      expect(logger.info).toHaveBeenCalledWith('Text-to-speech conversion completed', expect.any(Object));
    });

    it('should handle errors during text to speech conversion', async () => {
      // Arrange
      const text = 'Hello world';
      const options = { voice: 'en-US-Wavenet-F' };
      
      // Mock error
      outputService.textToSpeech.mockRejectedValueOnce(new Error('TTS error'));

      // Act & Assert
      await expect(voiceService.textToSpeech(text, options)).rejects.toThrow('TTS error');
      expect(logger.error).toHaveBeenCalledWith('Error in text-to-speech conversion:', expect.any(Object));
    });
  });

  describe('saveAudioFile', () => {
    it('should save audio data to a file', async () => {
      // Arrange
      const audioData = Buffer.from('test audio data');
      const format = 'wav';
      
      // Act
      const result = await voiceService.saveAudioFile(audioData, format);

      // Assert
      expect(result).toMatch(/\/test\/path/);
      expect(fs.promises.mkdir).toHaveBeenCalledWith('/test', { recursive: true });
      expect(fs.promises.writeFile).toHaveBeenCalledWith('/test/path', audioData);
      expect(logger.debug).toHaveBeenCalledWith('Audio file saved:', expect.any(Object));
    });

    it('should handle errors when saving audio file', async () => {
      // Arrange
      const audioData = Buffer.from('test audio data');
      const format = 'wav';
      
      // Mock error
      fs.promises.writeFile.mockRejectedValueOnce(new Error('File write error'));

      // Act & Assert
      await expect(voiceService.saveAudioFile(audioData, format)).rejects.toThrow('File write error');
      expect(logger.error).toHaveBeenCalledWith('Error saving audio file:', expect.any(Object));
    });
  });

  describe('loadAudioFile', () => {
    it('should load audio data from a file', async () => {
      // Arrange
      const filePath = '/test/audio.wav';
      
      // Act
      const result = await voiceService.loadAudioFile(filePath);

      // Assert
      expect(result).toEqual(Buffer.from('test audio data'));
      expect(fs.promises.readFile).toHaveBeenCalledWith(filePath);
      expect(logger.debug).toHaveBeenCalledWith('Audio file loaded:', expect.any(Object));
    });

    it('should handle errors when loading audio file', async () => {
      // Arrange
      const filePath = '/test/audio.wav';
      
      // Mock error
      fs.promises.readFile.mockRejectedValueOnce(new Error('File read error'));

      // Act & Assert
      await expect(voiceService.loadAudioFile(filePath)).rejects.toThrow('File read error');
      expect(logger.error).toHaveBeenCalledWith('Error loading audio file:', expect.any(Object));
    });
  });
});
