#!/usr/bin/env node
// scripts/fix-voice-service.js

const fs = require('fs').promises;
const path = require('path');

async function fixVoiceService() {
  console.log('🔧 Starting Voice Service Fix Process...\n');

  // Step 1: Check current file structure
  console.log('📁 Checking file structure...');
  
  const serviceFile = 'src/services/voice.service.js';
  const testFile = 'tests/unit/services/voice.service.test.js';
  
  try {
    await fs.access(serviceFile);
    console.log('✅ Found voice service file');
  } catch {
    console.log('❌ Voice service file not found');
    return;
  }

  try {
    await fs.access(testFile);
    console.log('✅ Found test file');
  } catch {
    console.log('❌ Test file not found');
    return;
  }

  // Step 2: Backup existing files
  console.log('\n💾 Creating backups...');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = `backups/${timestamp}`;
  
  await fs.mkdir(backupDir, { recursive: true });
  
  const serviceContent = await fs.readFile(serviceFile, 'utf8');
  const testContent = await fs.readFile(testFile, 'utf8');
  
  await fs.writeFile(path.join(backupDir, 'voice.service.js'), serviceContent);
  await fs.writeFile(path.join(backupDir, 'voice.service.test.js'), testContent);
  
  console.log(`✅ Backups created in ${backupDir}`);

  // Step 3: Analyze current issues
  console.log('\n🔍 Analyzing current issues...');
  
  const issues = [];
  
  // Check for module.exports pattern
  if (!serviceContent.includes('module.exports = VoiceService')) {
    issues.push('❌ Incorrect module export pattern');
  }
  
  // Check for constructor execution
  if (serviceContent.includes('new VoiceService') && !serviceContent.includes('process.env.NODE_ENV !== \'test\'')) {
    issues.push('❌ Service executing during module load');
  }
  
  // Check test import pattern
  if (testContent.includes('const { VoiceService }')) {
    issues.push('❌ Incorrect import pattern in tests');
  }
  
  if (issues.length > 0) {
    console.log('Found issues:');
    issues.forEach(issue => console.log(`  ${issue}`));
  } else {
    console.log('✅ No obvious issues found in static analysis');
  }

  // Step 4: Apply fixes
  console.log('\n🛠️ Applying fixes...');

  // Fixed service content
  const fixedServiceContent = `// src/services/voice.service.js
const fs = require('fs').promises;
const path = require('path');

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
      throw new Error(\`Failed to save audio file: \${error.message}\`);
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
      throw new Error(\`Failed to load audio file: \${error.message}\`);
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
      throw new Error(\`Speech to text conversion failed: \${error.message}\`);
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
      throw new Error(\`Text to speech synthesis failed: \${error.message}\`);
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
}

// Export as default
module.exports = VoiceService;`;

  // Fixed test content
  const fixedTestContent = `// tests/unit/services/voice.service.test.js
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
});`;

  // Write fixed files
  await fs.writeFile(serviceFile, fixedServiceContent);
  await fs.writeFile(testFile, fixedTestContent);
  
  console.log('✅ Service file updated');
  console.log('✅ Test file updated');

  // Step 5: Verify Jest configuration
  console.log('\n⚙️ Checking Jest configuration...');
  
  try {
    const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
    
    if (!packageJson.jest) {
      console.log('⚠️ No Jest configuration found in package.json');
      
      const jestConfig = {
        testEnvironment: 'node',
        roots: ['<rootDir>/src', '<rootDir>/tests'],
        testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
        collectCoverageFrom: [
          'src/**/*.js',
          '!src/**/*.test.js'
        ],
        setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
      };
      
      packageJson.jest = jestConfig;
      await fs.writeFile('package.json', JSON.stringify(packageJson, null, 2));
      console.log('✅ Added Jest configuration to package.json');
    } else {
      console.log('✅ Jest configuration found');
    }
  } catch (error) {
    console.log('⚠️ Could not update package.json:', error.message);
  }

  // Step 6: Create test setup file if needed
  const setupFile = 'tests/setup.js';
  try {
    await fs.access(setupFile);
    console.log('✅ Test setup file exists');
  } catch {
    console.log('📝 Creating test setup file...');
    
    const setupContent = `// tests/setup.js
// Global test setup

// Set test environment
process.env.NODE_ENV = 'test';

// Increase timeout for async operations
jest.setTimeout(10000);

// Mock console methods if needed
global.console = {
  ...console,
  // Uncomment to suppress logs during testing
  // log: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};
`;
    
    await fs.mkdir(path.dirname(setupFile), { recursive: true });
    await fs.writeFile(setupFile, setupContent);
    console.log('✅ Test setup file created');
  }

  console.log('\n🎉 Voice Service fix completed!');
  console.log('\n📋 Summary of changes:');
  console.log('  ✅ Fixed module export/import pattern');
  console.log('  ✅ Prevented cleanup interval in test environment');
  console.log('  ✅ Added proper resource cleanup in tests');
  console.log('  ✅ Improved error handling');
  console.log('  ✅ Added additional test cases');
  console.log('  ✅ Created Jest configuration if missing');
  console.log('  ✅ Created test setup file');
  
  console.log('\n🚀 Next steps:');
  console.log('  1. Run: npm test tests/unit/services/voice.service.test.js');
  console.log('  2. If tests pass, run full test suite: npm test');
  console.log('  3. Check coverage: npm run test:coverage');
  
  console.log(`\n💾 Backups saved in: ${backupDir}`);
}

// Run the fix if this script is executed directly
if (require.main === module) {
  fixVoiceService().catch(console.error);
}

module.exports = { fixVoiceService };