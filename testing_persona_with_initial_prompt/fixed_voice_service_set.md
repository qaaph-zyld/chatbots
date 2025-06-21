// tests/unit/services/voice.service.test.js
const fs = require('fs').promises;
const path = require('path');
const VoiceService = require('../../../src/services/voice.service');

// Set test environment
process.env.NODE_ENV = 'test';

describe('Voice Service', () => {
  let voiceService;
  let inputServiceMock;
  let outputServiceMock;

  beforeEach(() => {
    // Create mocked dependencies
    inputServiceMock = {
      processAudio: jest.fn()
    };

    outputServiceMock = {
      synthesizeSpeech: jest.fn()
    };

    // Initialize service with mocked dependencies
    voiceService = new VoiceService(inputServiceMock, outputServiceMock);
  });

  // Clean up after each test
  afterEach(async () => {
    if (voiceService) {
      await voiceService.shutdown();
    }
  });

  describe('saveAudioFile', () => {
    it('should save audio data to a file and create directories', async () => {
      const audioData = Buffer.from('test audio data');
      const filename = 'test-audio.wav';

      const filePath = await voiceService.saveAudioFile(audioData, filename);

      expect(filePath).toContain(filename);
      expect(filePath).toContain('temp/audio');

      // Verify file was created
      const savedData = await fs.readFile(filePath);
      expect(savedData.equals(audioData)).toBe(true);

      // Cleanup
      await fs.unlink(filePath);
    });

    it('should handle save errors', async () => {
      const audioData = Buffer.from('test data');
      const invalidFilename = '/invalid/path/file.wav';

      await expect(
        voiceService.saveAudioFile(audioData, invalidFilename)
      ).rejects.toThrow('Failed to save audio file');
    });
  });

  describe('loadAudioFile', () => {
    it('should load audio data from a file', async () => {
      const audioData = Buffer.from('test audio data');
      const filename = 'load-test.wav';

      // First save the file
      await voiceService.saveAudioFile(audioData, filename);

      // Then load it
      const loadedData = await voiceService.loadAudioFile(filename);

      expect(loadedData.equals(audioData)).toBe(true);

      // Cleanup
      const filePath = path.join(voiceService.tempDir, filename);
      await fs.unlink(filePath);
    });

    it('should handle load errors', async () => {
      const nonExistentFile = 'non-existent.wav';

      await expect(
        voiceService.loadAudioFile(nonExistentFile)
      ).rejects.toThrow('Failed to load audio file');
    });
  });

  describe('speechToText', () => {
    it('should convert speech to text', async () => {
      const audioData = Buffer.from('audio data');
      const expectedText = 'Hello world';

      inputServiceMock.processAudio.mockResolvedValue({ text: expectedText });

      const result = await voiceService.speechToText(audioData);

      expect(result).toBe(expectedText);
      expect(inputServiceMock.processAudio).toHaveBeenCalledWith(audioData);
    });

    it('should handle conversion errors', async () => {
      const audioData = Buffer.from('audio data');

      inputServiceMock.processAudio.mockRejectedValue(new Error('Processing failed'));

      await expect(
        voiceService.speechToText(audioData)
      ).rejects.toThrow('Speech to text conversion failed');
    });

    it('should handle missing input service', async () => {
      const voiceServiceWithoutInput = new VoiceService(null, outputServiceMock);
      const audioData = Buffer.from('audio data');

      await expect(
        voiceServiceWithoutInput.speechToText(audioData)
      ).rejects.toThrow('Input service not properly configured');

      await voiceServiceWithoutInput.shutdown();
    });
  });

  describe('textToSpeech', () => {
    it('should convert text to speech', async () => {
      const text = 'Hello world';
      const expectedAudio = Buffer.from('audio data');

      outputServiceMock.synthesizeSpeech.mockResolvedValue(expectedAudio);

      const result = await voiceService.textToSpeech(text);

      expect(result).toBe(expectedAudio);
      expect(outputServiceMock.synthesizeSpeech).toHaveBeenCalledWith(text);
    });

    it('should handle synthesis errors', async () => {
      const text = 'Hello world';

      outputServiceMock.synthesizeSpeech.mockRejectedValue(new Error('Synthesis failed'));

      await expect(
        voiceService.textToSpeech(text)
      ).rejects.toThrow('Text to speech synthesis failed');
    });

    it('should handle missing output service', async () => {
      const voiceServiceWithoutOutput = new VoiceService(inputServiceMock, null);
      const text = 'Hello world';

      await expect(
        voiceServiceWithoutOutput.textToSpeech(text)
      ).rejects.toThrow('Output service not properly configured');

      await voiceServiceWithoutOutput.shutdown();
    });
  });

  describe('cleanup functionality', () => {
    it('should clean up old temporary files', async () => {
      const audioData = Buffer.from('test data');
      const filename = 'cleanup-test.wav';

      // Save a file
      const filePath = await voiceService.saveAudioFile(audioData, filename);

      // Verify file exists
      let fileExists = true;
      try {
        await fs.access(filePath);
      } catch {
        fileExists = false;
      }
      expect(fileExists).toBe(true);

      // Clean up with maxAge 0 (should remove all files)
      await voiceService.cleanupTempFiles(0);

      // Verify file was removed
      fileExists = true;
      try {
        await fs.access(filePath);
      } catch {
        fileExists = false;
      }
      expect(fileExists).toBe(false);
    });

    it('should not start cleanup interval in test environment', () => {
      const newService = new VoiceService(inputServiceMock, outputServiceMock);
      expect(newService.cleanupInterval).toBeNull();
      newService.shutdown();
    });
  });
});