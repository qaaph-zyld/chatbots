/**
 * Voice Components Integration Tests
 * 
 * Tests for the integration between different voice components.
 */

const path = require('path');
const fs = require('fs');

// Create test directory if it doesn't exist
const testDir = path.join(process.cwd(), 'tests', 'temp');
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

// Mock the config module first to prevent undefined errors
jest.mock('../../src/config', () => ({
  storage: {
    baseDir: path.join(process.cwd(), 'tests', 'temp'),
    tempDir: path.join(process.cwd(), 'tests', 'temp', 'temp'),
    dataDir: path.join(process.cwd(), 'tests', 'temp', 'data'),
    cacheDir: path.join(process.cwd(), 'tests', 'temp', 'cache'),
    modelDir: path.join(process.cwd(), 'tests', 'temp', 'models')
  },
  stt: {
    modelPath: path.join(process.cwd(), 'tests', 'temp', 'models', 'stt')
  },
  tts: {
    modelPath: path.join(process.cwd(), 'tests', 'temp', 'models', 'tts')
  },
  recognition: {
    modelPath: path.join(process.cwd(), 'tests', 'temp', 'models', 'recognition')
  }
}));

// Now import the modules after config is mocked
const audioProcessor = require('../../src/utils/audio-processor');
const languageDetector = require('../../src/utils/language-detector');
const modelManager = require('../../src/utils/model-manager');

// Mock the voice recognition service
jest.mock('../../src/services/voice-recognition.service', () => ({
  initialize: jest.fn().mockResolvedValue(true),
  recognizeSpeech: jest.fn().mockResolvedValue({
    text: 'Hello world',
    confidence: 0.95
  }),
  getAvailableModels: jest.fn().mockReturnValue(['en-US', 'fr-FR']),
  detectLanguage: jest.fn().mockResolvedValue('en-US')
}));

// Import the mocked service
const voiceRecognitionService = require('../../src/services/voice-recognition.service');

// Mock model manager
jest.mock('../../src/utils/model-manager', () => ({
  ensureDirectories: jest.fn(),
  downloadModel: jest.fn().mockResolvedValue({
    success: true,
    model: {
      name: 'Test Model',
      language: 'en-US',
      path: '/path/to/model'
    }
  }),
  isModelInstalled: jest.fn().mockReturnValue(Promise.resolve(true)),
  getModelStatus: jest.fn().mockResolvedValue({
    stt: { installed: [], available: [] },
    tts: { installed: [], available: [] }
  }),
  getAvailableModels: jest.fn().mockReturnValue([])
}));

describe('Voice Components Integration', () => {
  beforeAll(async () => {
    // Initialize all components
    await audioProcessor.initialize();
    await languageDetector.initialize();
    await modelManager.initialize();
    await voiceRecognitionService.initialize();
    
    // Create test audio file
    const testAudioPath = path.join(testDir, 'test_integration.wav');
    if (!fs.existsSync(testAudioPath)) {
      // Create a simple WAV file with speech-like content
      const sampleRate = 16000;
      const channels = 1;
      const duration = 2; // seconds
      const amplitude = 0.5;
      
      const numSamples = sampleRate * duration;
      const buffer = Buffer.alloc(44 + numSamples * 2); // 44 bytes header + 2 bytes per sample
      
      // WAV header
      buffer.write('RIFF', 0);
      buffer.writeUInt32LE(36 + numSamples * 2, 4); // File size - 8
      buffer.write('WAVE', 8);
      buffer.write('fmt ', 12);
      buffer.writeUInt32LE(16, 16); // Format chunk size
      buffer.writeUInt16LE(1, 20); // Audio format (PCM)
      buffer.writeUInt16LE(channels, 22); // Number of channels
      buffer.writeUInt32LE(sampleRate, 24); // Sample rate
      buffer.writeUInt32LE(sampleRate * channels * 2, 28); // Byte rate
      buffer.writeUInt16LE(channels * 2, 32); // Block align
      buffer.writeUInt16LE(16, 34); // Bits per sample
      buffer.write('data', 36);
      buffer.writeUInt32LE(numSamples * 2, 40); // Data chunk size
      
      // Generate speech-like audio (sine wave with varying frequency)
      for (let i = 0; i < numSamples; i++) {
        // Vary frequency over time to simulate speech
        const frequency = 150 + 100 * Math.sin(i / sampleRate * 2);
        const sample = Math.sin(i / (sampleRate / frequency) * Math.PI * 2) * amplitude * 32767;
        buffer.writeInt16LE(Math.floor(sample), 44 + i * 2);
      }
      
      fs.writeFileSync(testAudioPath, buffer);
    }
  });
  
  describe('Audio Processing and Voice Recognition', () => {
    test('should process audio and enroll speaker', async () => {
      const testAudioPath = path.join(testDir, 'test_integration.wav');
      
      // Process audio
      const processedBuffer = await audioProcessor.processAudio(testAudioPath, {
        sampleRate: 16000,
        channels: 1,
        normalize: true
      });
      
      expect(Buffer.isBuffer(processedBuffer)).toBe(true);
      expect(processedBuffer.length).toBeGreaterThan(0);
      
      // Create speaker profile
      const createResult = await voiceRecognitionService.createSpeakerProfile('test-integration', 'Test Speaker');
      expect(createResult.success).toBe(true);
      
      // Enroll speaker with processed audio
      const enrollResult = await voiceRecognitionService.enrollSpeaker('test-integration', processedBuffer);
      expect(enrollResult.success).toBe(true);
      
      // Verify speaker with processed audio
      const verifyResult = await voiceRecognitionService.verifySpeaker('test-integration', processedBuffer);
      expect(verifyResult.success).toBe(true);
      
      // Clean up
      await voiceRecognitionService.deleteSpeakerProfile('test-integration');
    }, 15000);
    
    test('should detect voice activity and identify speaker', async () => {
      const testAudioPath = path.join(testDir, 'test_integration.wav');
      
      // Detect voice activity
      const vadResult = await audioProcessor.detectVoiceActivity(testAudioPath, {
        threshold: 0.01,
        frameDuration: 0.01,
        minSpeechDuration: 0.1
      });
      
      expect(vadResult).toHaveProperty('hasSpeech');
      expect(vadResult).toHaveProperty('segments');
      
      // Create speaker profiles
      await voiceRecognitionService.createSpeakerProfile('speaker1', 'Speaker One');
      await voiceRecognitionService.createSpeakerProfile('speaker2', 'Speaker Two');
      
      // Enroll speakers
      const audioBuffer = fs.readFileSync(testAudioPath);
      await voiceRecognitionService.enrollSpeaker('speaker1', audioBuffer);
      await voiceRecognitionService.enrollSpeaker('speaker2', audioBuffer);
      
      // Identify speaker
      const identifyResult = await voiceRecognitionService.identifySpeaker(audioBuffer);
      expect(identifyResult.success).toBe(true);
      expect(identifyResult).toHaveProperty('speakers');
      
      // Clean up
      await voiceRecognitionService.deleteSpeakerProfile('speaker1');
      await voiceRecognitionService.deleteSpeakerProfile('speaker2');
    }, 15000);
  });
  
  describe('Model Management and Audio Processing', () => {
    test('should check model status and process audio', async () => {
      // Get model status
      const status = await modelManager.getModelStatus();
      expect(status).toHaveProperty('stt');
      expect(status).toHaveProperty('tts');
      
      // Process audio with model settings
      const testAudioPath = path.join(testDir, 'test_integration.wav');
      const processedBuffer = await audioProcessor.processAudio(testAudioPath, {
        sampleRate: 16000, // Match model requirements
        channels: 1,
        normalize: true
      });
      
      expect(Buffer.isBuffer(processedBuffer)).toBe(true);
      expect(processedBuffer.length).toBeGreaterThan(0);
    });
    
    test('should download model and convert audio format', async () => {
      // Download model (mocked)
      const downloadResult = await modelManager.downloadModel('stt', 'deepspeech', 'en-US');
      expect(downloadResult.success).toBe(true);
      
      // Convert audio format for model compatibility
      const testAudioPath = path.join(testDir, 'test_integration.wav');
      const convertedBuffer = await audioProcessor.convertFormat(testAudioPath, 'wav', {
        sampleRate: 16000, // Match model requirements
        channels: 1
      });
      
      expect(Buffer.isBuffer(convertedBuffer)).toBe(true);
      expect(convertedBuffer.length).toBeGreaterThan(0);
    });
  });
  
  describe('Language Detection and Voice Processing', () => {
    test('should detect language from text and process audio accordingly', async () => {
      // Detect language
      const text = 'This is a sample text in English for testing language detection.';
      const languageResult = await languageDetector.detectLanguage(text);
      
      expect(languageResult.detected).toBe(true);
      expect(languageResult.language).toMatch(/en-/);
      
      // Get appropriate model for detected language
      const models = modelManager.getAvailableModels('stt');
      const matchingModels = models.filter(model => 
        model.language && model.language.startsWith(languageResult.language.split('-')[0])
      );
      
      // Process audio with language-specific settings
      const testAudioPath = path.join(testDir, 'test_integration.wav');
      const processedBuffer = await audioProcessor.processAudio(testAudioPath, {
        sampleRate: 16000,
        channels: 1,
        normalize: true,
        // Additional language-specific processing could be added here
      });
      
      expect(Buffer.isBuffer(processedBuffer)).toBe(true);
      expect(processedBuffer.length).toBeGreaterThan(0);
    });
  });
  
  describe('End-to-End Voice Processing Pipeline', () => {
    test('should run complete voice processing pipeline', async () => {
      const testAudioPath = path.join(testDir, 'test_integration.wav');
      
      // Step 1: Process audio
      const processedBuffer = await audioProcessor.processAudio(testAudioPath, {
        sampleRate: 16000,
        channels: 1,
        normalize: true,
        removeNoise: true
      });
      
      expect(Buffer.isBuffer(processedBuffer)).toBe(true);
      
      // Step 2: Detect voice activity
      const vadResult = await audioProcessor.detectVoiceActivity(testAudioPath);
      expect(vadResult).toHaveProperty('hasSpeech');
      
      if (vadResult.hasSpeech) {
        // Step 3: Create speaker profile if not exists
        const speakerId = 'pipeline-test';
        const profileExists = voiceRecognitionService.speakerProfiles[speakerId];
        
        if (!profileExists) {
          await voiceRecognitionService.createSpeakerProfile(speakerId, 'Pipeline Test');
        }
        
        // Step 4: Verify or enroll speaker
        const verifyResult = await voiceRecognitionService.verifySpeaker(speakerId, processedBuffer);
        
        if (!verifyResult.verified) {
          // Enroll if not verified
          await voiceRecognitionService.enrollSpeaker(speakerId, processedBuffer);
        }
        
        // Step 5: Check if appropriate language model is available
        const modelAvailable = await modelManager.isModelInstalled(
          '/path/to/model', // Mock path
          { type: 'file', path: 'test-model.pbmm' }
        );
        
        if (!modelAvailable) {
          // Download model if not available (mocked)
          await modelManager.downloadModel('stt', 'deepspeech', 'en-US');
        }
        
        // Clean up
        await voiceRecognitionService.deleteSpeakerProfile(speakerId);
      }
      
      // Test completed successfully if we reached this point
      expect(true).toBe(true);
    }, 20000);
  });
});
