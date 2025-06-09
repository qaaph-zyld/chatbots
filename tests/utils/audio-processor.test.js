/**
 * Audio Processor Tests
 * 
 * Tests for the audio processor utility.
 */

const path = require('path');
const fs = require('fs');
require('@src/utils\audio-processor');

// Create test directory if it doesn't exist
const testDir = path.join(process.cwd(), 'tests', 'temp');
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

describe('Audio Processor', () => {
  beforeAll(async () => {
    // Initialize audio processor
    await audioProcessor.initialize();
  });
  
  describe('Initialization', () => {
    test('should initialize successfully', async () => {
      const result = await audioProcessor.initialize();
      expect(result).toBe(true);
      expect(audioProcessor.initialized).toBe(true);
    });
  });
  
  describe('Audio Processing', () => {
    test('should process audio file', async () => {
      // Create a test WAV file
      const testWavPath = path.join(testDir, 'test.wav');
      
      // If test file doesn't exist, create a simple WAV file
      if (!fs.existsSync(testWavPath)) {
        // Create a simple WAV file with silence
        const sampleRate = 16000;
        const channels = 1;
        const duration = 1; // seconds
        const amplitude = 0.1;
        
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
        
        // Generate sine wave
        for (let i = 0; i < numSamples; i++) {
          const sample = Math.sin(i / (sampleRate / 440) * Math.PI * 2) * amplitude * 32767;
          buffer.writeInt16LE(Math.floor(sample), 44 + i * 2);
        }
        
        fs.writeFileSync(testWavPath, buffer);
      }
      
      // Process the test file
      const processedBuffer = await audioProcessor.processAudio(testWavPath, {
        sampleRate: 16000,
        channels: 1,
        normalize: true
      });
      
      // Verify the processed audio
      expect(Buffer.isBuffer(processedBuffer)).toBe(true);
      expect(processedBuffer.length).toBeGreaterThan(0);
      
      // Clean up
      if (fs.existsSync(testWavPath)) {
        fs.unlinkSync(testWavPath);
      }
    }, 10000); // Increase timeout for audio processing
  });
  
  describe('Voice Activity Detection', () => {
    test('should detect voice activity', async () => {
      // Create a test WAV file with "speech"
      const testWavPath = path.join(testDir, 'test_vad.wav');
      
      // If test file doesn't exist, create a simple WAV file with "speech"
      if (!fs.existsSync(testWavPath)) {
        // Create a simple WAV file with a sine wave (simulating speech)
        const sampleRate = 16000;
        const channels = 1;
        const duration = 2; // seconds
        const amplitude = 0.5; // Higher amplitude to simulate speech
        
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
        
        // Generate "speech" (sine wave with silence at beginning and end)
        for (let i = 0; i < numSamples; i++) {
          let sample = 0;
          
          // Add silence at beginning and end
          if (i > sampleRate * 0.5 && i < sampleRate * 1.5) {
            sample = Math.sin(i / (sampleRate / 440) * Math.PI * 2) * amplitude * 32767;
          }
          
          buffer.writeInt16LE(Math.floor(sample), 44 + i * 2);
        }
        
        fs.writeFileSync(testWavPath, buffer);
      }
      
      // Detect voice activity
      const result = await audioProcessor.detectVoiceActivity(testWavPath, {
        threshold: 0.01,
        frameDuration: 0.01,
        minSpeechDuration: 0.1
      });
      
      // Verify the result
      expect(result).toHaveProperty('hasSpeech');
      expect(result).toHaveProperty('segments');
      
      // Clean up
      if (fs.existsSync(testWavPath)) {
        fs.unlinkSync(testWavPath);
      }
    }, 10000); // Increase timeout for audio processing
  });
  
  describe('Audio Information', () => {
    test('should get audio information', async () => {
      // Create a test WAV file
      const testWavPath = path.join(testDir, 'test_info.wav');
      
      // If test file doesn't exist, create a simple WAV file
      if (!fs.existsSync(testWavPath)) {
        // Create a simple WAV file
        const sampleRate = 16000;
        const channels = 1;
        const duration = 1; // seconds
        
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
        
        // Generate silence
        for (let i = 0; i < numSamples; i++) {
          buffer.writeInt16LE(0, 44 + i * 2);
        }
        
        fs.writeFileSync(testWavPath, buffer);
      }
      
      // Get audio information
      const info = await audioProcessor.getAudioInfo(testWavPath);
      
      // Verify the information
      expect(info).toBeDefined();
      
      // Clean up
      if (fs.existsSync(testWavPath)) {
        fs.unlinkSync(testWavPath);
      }
    }, 10000); // Increase timeout for audio processing
  });
});
