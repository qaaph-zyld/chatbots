/**
 * Audio Processor Controller Tests
 * 
 * Tests for the audio processor controller.
 */

const request = require('supertest');
const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
require('@src/controllers\audio-processor.controller');
require('@src/utils\audio-processor');

// Mock audio processor
jest.mock('../../src/utils/audio-processor', () => ({
  initialize: jest.fn().mockResolvedValue(true),
  processAudio: jest.fn().mockImplementation(() => {
    return Promise.resolve(Buffer.from('processed audio'));
  }),
  convertFormat: jest.fn().mockImplementation(() => {
    return Promise.resolve(Buffer.from('converted audio'));
  }),
  detectVoiceActivity: jest.fn().mockImplementation(() => {
    return Promise.resolve({
      hasSpeech: true,
      segments: [{ start: 0.1, end: 1.5 }]
    });
  }),
  getAudioInfo: jest.fn().mockImplementation(() => {
    return Promise.resolve({
      format: 'wav',
      duration: 2.5,
      sampleRate: 16000,
      channels: 1,
      bitrate: 256000
    });
  })
}));

// Create test app
const app = express();
app.use(express.json());

// Setup routes
app.post('/api/audio-processor/process', audioProcessorController.processAudio);
app.post('/api/audio-processor/convert', audioProcessorController.convertFormat);
app.post('/api/audio-processor/vad', audioProcessorController.detectVoiceActivity);
app.post('/api/audio-processor/info', audioProcessorController.getAudioInfo);

// Create test directory if it doesn't exist
const testDir = path.join(process.cwd(), 'tests', 'temp');
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

describe('Audio Processor Controller', () => {
  beforeAll(async () => {
    // Create a test audio file
    const testAudioPath = path.join(testDir, 'test_controller.wav');
    if (!fs.existsSync(testAudioPath)) {
      // Create a simple WAV file
      const buffer = Buffer.alloc(44 + 16000 * 2); // 1 second of audio
      fs.writeFileSync(testAudioPath, buffer);
    }
  });
  
  describe('Process Audio', () => {
    test('should process audio file', async () => {
      const testAudioPath = path.join(testDir, 'test_controller.wav');
      
      const response = await request(app)
        .post('/api/audio-processor/process')
        .attach('audio', testAudioPath)
        .field('sampleRate', '16000')
        .field('channels', '1')
        .field('normalize', 'true');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(audioProcessor.processAudio).toHaveBeenCalled();
    });
    
    test('should handle missing audio file', async () => {
      const response = await request(app)
        .post('/api/audio-processor/process')
        .field('sampleRate', '16000');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('Convert Format', () => {
    test('should convert audio format', async () => {
      const testAudioPath = path.join(testDir, 'test_controller.wav');
      
      const response = await request(app)
        .post('/api/audio-processor/convert')
        .attach('audio', testAudioPath)
        .field('format', 'mp3')
        .field('sampleRate', '16000')
        .field('channels', '1');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(audioProcessor.convertFormat).toHaveBeenCalled();
    });
    
    test('should handle missing format', async () => {
      const testAudioPath = path.join(testDir, 'test_controller.wav');
      
      const response = await request(app)
        .post('/api/audio-processor/convert')
        .attach('audio', testAudioPath);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('Voice Activity Detection', () => {
    test('should detect voice activity', async () => {
      const testAudioPath = path.join(testDir, 'test_controller.wav');
      
      const response = await request(app)
        .post('/api/audio-processor/vad')
        .attach('audio', testAudioPath)
        .field('threshold', '0.01');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('result');
      expect(response.body.result).toHaveProperty('hasSpeech');
      expect(response.body.result).toHaveProperty('segments');
      expect(audioProcessor.detectVoiceActivity).toHaveBeenCalled();
    });
  });
  
  describe('Audio Information', () => {
    test('should get audio information', async () => {
      const testAudioPath = path.join(testDir, 'test_controller.wav');
      
      const response = await request(app)
        .post('/api/audio-processor/info')
        .attach('audio', testAudioPath);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('info');
      expect(audioProcessor.getAudioInfo).toHaveBeenCalled();
    });
  });
});
