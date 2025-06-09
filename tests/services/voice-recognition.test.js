/**
 * Voice Recognition Service Tests
 * 
 * Tests for the voice recognition service.
 */

const path = require('path');
const fs = require('fs');
require('@src/services\voice-recognition.service');

// Create test directory if it doesn't exist
const testDir = path.join(process.cwd(), 'tests', 'temp');
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

// Mock functions
jest.mock('fs', () => {
  const originalFs = jest.requireActual('fs');
  return {
    ...originalFs,
    existsSync: jest.fn().mockImplementation(path => {
      // Mock specific paths
      if (path.includes('speaker-profiles')) {
        return true;
      }
      if (path.includes('profiles.json')) {
        return false;
      }
      return originalFs.existsSync(path);
    }),
    promises: {
      ...originalFs.promises,
      writeFile: jest.fn().mockResolvedValue(undefined),
      readFile: jest.fn().mockImplementation(path => {
        if (path.includes('.embedding')) {
          return Promise.resolve(JSON.stringify(Array(192).fill(0.1)));
        }
        return Promise.resolve(Buffer.from('test'));
      }),
      unlink: jest.fn().mockResolvedValue(undefined)
    }
  };
});

describe('Voice Recognition Service', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Reset speaker profiles
    voiceRecognitionService.speakerProfiles = {};
    global.speakerProfiles = {};
  });
  
  describe('Initialization', () => {
    test('should initialize successfully', async () => {
      const result = await voiceRecognitionService.initialize();
      
      expect(result).toBe(true);
      expect(voiceRecognitionService.isInitialized).toBe(true);
    });
    
    test('should load speaker profiles', async () => {
      // Mock readFile to return empty profiles
      fs.promises.readFile.mockImplementationOnce(() => {
        return Promise.resolve('{}');
      });
      
      await voiceRecognitionService.loadSpeakerProfiles();
      
      expect(fs.promises.readFile).toHaveBeenCalled();
      expect(voiceRecognitionService.speakerProfiles).toEqual({});
    });
    
    test('should save speaker profiles', async () => {
      await voiceRecognitionService.saveSpeakerProfiles();
      
      expect(fs.promises.writeFile).toHaveBeenCalled();
    });
  });
  
  describe('Speaker Profile Management', () => {
    test('should create speaker profile', async () => {
      const result = await voiceRecognitionService.createSpeakerProfile('test-speaker', 'Test Speaker');
      
      expect(result.success).toBe(true);
      expect(result.profile).toBeDefined();
      expect(result.profile.id).toBe('test-speaker');
      expect(result.profile.name).toBe('Test Speaker');
      
      expect(voiceRecognitionService.speakerProfiles['test-speaker']).toBeDefined();
      expect(global.speakerProfiles['test-speaker']).toBeDefined();
    });
    
    test('should not create duplicate speaker profile', async () => {
      // Create profile first
      await voiceRecognitionService.createSpeakerProfile('test-speaker', 'Test Speaker');
      
      // Try to create again
      const result = await voiceRecognitionService.createSpeakerProfile('test-speaker', 'Test Speaker');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('already exists');
    });
    
    test('should delete speaker profile', async () => {
      // Create profile first
      await voiceRecognitionService.createSpeakerProfile('test-speaker', 'Test Speaker');
      
      // Delete profile
      const result = await voiceRecognitionService.deleteSpeakerProfile('test-speaker');
      
      expect(result.success).toBe(true);
      expect(voiceRecognitionService.speakerProfiles['test-speaker']).toBeUndefined();
      expect(global.speakerProfiles['test-speaker']).toBeUndefined();
    });
    
    test('should not delete non-existent speaker profile', async () => {
      const result = await voiceRecognitionService.deleteSpeakerProfile('non-existent');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });
  });
  
  describe('Speaker Enrollment and Verification', () => {
    beforeEach(async () => {
      // Create test profile
      await voiceRecognitionService.createSpeakerProfile('test-speaker', 'Test Speaker');
    });
    
    test('should enroll speaker', async () => {
      const audioData = Buffer.from('test audio data');
      
      const result = await voiceRecognitionService.enrollSpeaker('test-speaker', audioData);
      
      expect(result.success).toBe(true);
      expect(result.speakerId).toBe('test-speaker');
      expect(result.enrollments).toBe(1);
      
      expect(fs.promises.writeFile).toHaveBeenCalled();
    });
    
    test('should not enroll non-existent speaker', async () => {
      const audioData = Buffer.from('test audio data');
      
      const result = await voiceRecognitionService.enrollSpeaker('non-existent', audioData);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });
    
    test('should verify speaker', async () => {
      const audioData = Buffer.from('test audio data');
      
      // Enroll speaker first
      await voiceRecognitionService.enrollSpeaker('test-speaker', audioData);
      
      // Verify speaker
      const result = await voiceRecognitionService.verifySpeaker('test-speaker', audioData);
      
      expect(result.success).toBe(true);
      expect(result.verified).toBeDefined();
      expect(result.score).toBeDefined();
      expect(result.speakerId).toBe('test-speaker');
      expect(result.name).toBe('Test Speaker');
    });
    
    test('should not verify non-existent speaker', async () => {
      const audioData = Buffer.from('test audio data');
      
      const result = await voiceRecognitionService.verifySpeaker('non-existent', audioData);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });
  });
  
  describe('Speaker Identification', () => {
    beforeEach(async () => {
      // Create test profiles
      await voiceRecognitionService.createSpeakerProfile('speaker1', 'Speaker One');
      await voiceRecognitionService.createSpeakerProfile('speaker2', 'Speaker Two');
      
      // Enroll speakers
      const audioData = Buffer.from('test audio data');
      await voiceRecognitionService.enrollSpeaker('speaker1', audioData);
      await voiceRecognitionService.enrollSpeaker('speaker2', audioData);
    });
    
    test('should identify speaker', async () => {
      const audioData = Buffer.from('test audio data');
      
      const result = await voiceRecognitionService.identifySpeaker(audioData);
      
      expect(result.success).toBe(true);
      expect(result.identified).toBeDefined();
      expect(result.speakers).toBeDefined();
      expect(Array.isArray(result.speakers)).toBe(true);
      
      if (result.identified) {
        expect(result.bestMatch).toBeDefined();
        expect(result.bestMatch.speakerId).toBeDefined();
        expect(result.bestMatch.name).toBeDefined();
        expect(result.bestMatch.score).toBeDefined();
      }
    });
    
    test('should handle no profiles', async () => {
      // Clear profiles
      voiceRecognitionService.speakerProfiles = {};
      global.speakerProfiles = {};
      
      const audioData = Buffer.from('test audio data');
      
      const result = await voiceRecognitionService.identifySpeaker(audioData);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('No speaker profiles');
    });
  });
  
  describe('Utility Functions', () => {
    test('should extract embedding', async () => {
      const audioPath = path.join(testDir, 'test_audio.wav');
      
      // Create test audio file if it doesn't exist
      if (!fs.existsSync(audioPath)) {
        fs.writeFileSync(audioPath, Buffer.from('test audio data'));
      }
      
      const result = await voiceRecognitionService.extractEmbedding(audioPath);
      
      expect(result.success).toBe(true);
      expect(result.embedding).toBeDefined();
      expect(Array.isArray(result.embedding)).toBe(true);
      expect(result.embedding.length).toBeGreaterThan(0);
    });
    
    test('should compare embeddings', () => {
      const embedding1 = Array(192).fill(0.1);
      const embedding2 = Array(192).fill(0.2);
      
      const similarity = voiceRecognitionService.compareEmbeddings(embedding1, embedding2);
      
      expect(similarity).toBeDefined();
      expect(typeof similarity).toBe('number');
      expect(similarity).toBeGreaterThanOrEqual(0);
      expect(similarity).toBeLessThanOrEqual(1);
    });
    
    test('should get speaker profiles', async () => {
      // Create test profiles
      await voiceRecognitionService.createSpeakerProfile('speaker1', 'Speaker One');
      await voiceRecognitionService.createSpeakerProfile('speaker2', 'Speaker Two');
      
      const profiles = voiceRecognitionService.getSpeakerProfiles();
      
      expect(profiles).toBeDefined();
      expect(Array.isArray(profiles)).toBe(true);
      expect(profiles.length).toBe(2);
      
      expect(profiles[0]).toHaveProperty('id');
      expect(profiles[0]).toHaveProperty('name');
      expect(profiles[0]).toHaveProperty('enrollments');
    });
  });
});
