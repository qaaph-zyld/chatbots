/**
 * Input Service Tests
 */

const inputService = require('../../../services/input.service');
const logger = require('../../../utils/logger');

// Mock dependencies
jest.mock('../../../utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

describe('Input Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('processTextInput', () => {
    it('should process text input correctly', async () => {
      // Arrange
      const text = 'Hello world';
      const options = { userId: '123' };

      // Act
      const result = await inputService.processTextInput(text, options);

      // Assert
      expect(result).toHaveProperty('original', text);
      expect(result).toHaveProperty('normalized', 'hello world');
      expect(result).toHaveProperty('tokens', ['hello', 'world']);
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('metadata', options);
      expect(logger.debug).toHaveBeenCalledWith('Processing text input:', { text, options });
    });

    it('should handle empty text input', async () => {
      // Arrange
      const text = '';

      // Act
      const result = await inputService.processTextInput(text);

      // Assert
      expect(result).toHaveProperty('original', '');
      expect(result).toHaveProperty('normalized', '');
      expect(result).toHaveProperty('tokens', ['']);
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('metadata', {});
    });

    it('should handle text with extra whitespace', async () => {
      // Arrange
      const text = '  hello  world  ';

      // Act
      const result = await inputService.processTextInput(text);

      // Assert
      expect(result).toHaveProperty('original', '  hello  world  ');
      expect(result).toHaveProperty('normalized', 'hello  world');
      expect(result).toHaveProperty('tokens', ['hello', 'world']);
    });
  });

  describe('processVoiceInput', () => {
    it('should process voice input correctly', async () => {
      // Arrange
      const audioData = Buffer.from('test audio data');
      const options = { format: 'mp3', duration: 5 };

      // Act
      const result = await inputService.processVoiceInput(audioData, options);

      // Assert
      expect(result).toHaveProperty('original', audioData);
      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('timestamp');
      expect(result.metadata).toHaveProperty('format', 'mp3');
      expect(result.metadata).toHaveProperty('duration', 5);
      expect(logger.debug).toHaveBeenCalledWith('Processing voice input', { options });
    });

    it('should use default values when options are not provided', async () => {
      // Arrange
      const audioData = Buffer.from('test audio data');

      // Act
      const result = await inputService.processVoiceInput(audioData);

      // Assert
      expect(result.metadata).toHaveProperty('format', 'wav');
      expect(result.metadata).toHaveProperty('duration', 0);
    });
  });

  describe('processFileInput', () => {
    it('should process file input correctly', async () => {
      // Arrange
      const fileData = Buffer.from('test file data');
      const fileType = 'text/plain';
      const options = { filename: 'test.txt' };

      // Act
      const result = await inputService.processFileInput(fileData, fileType, options);

      // Assert
      expect(result).toHaveProperty('original', fileData);
      expect(result).toHaveProperty('type', fileType);
      expect(result).toHaveProperty('size', fileData.length);
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('metadata', options);
      expect(logger.debug).toHaveBeenCalledWith('Processing file input', { fileType, options });
    });

    it('should handle file input without options', async () => {
      // Arrange
      const fileData = Buffer.from('test file data');
      const fileType = 'application/json';

      // Act
      const result = await inputService.processFileInput(fileData, fileType);

      // Assert
      expect(result).toHaveProperty('original', fileData);
      expect(result).toHaveProperty('type', fileType);
      expect(result).toHaveProperty('metadata', {});
    });
  });
});
