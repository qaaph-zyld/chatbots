/**
 * Output Service Tests
 */

const outputService = require('../../../services/output.service');
const logger = require('../../../utils/logger');

// Mock dependencies
jest.mock('../../../utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

describe('Output Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('formatTextOutput', () => {
    it('should format text output correctly', async () => {
      // Arrange
      const text = 'Hello world';
      const options = { userId: '123' };

      // Act
      const result = await outputService.formatTextOutput(text, options);

      // Assert
      expect(result).toHaveProperty('text', text);
      expect(result).toHaveProperty('format', 'plain');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('metadata', options);
      expect(logger.debug).toHaveBeenCalledWith('Formatting text output:', { text, options });
    });

    it('should use custom format when provided', async () => {
      // Arrange
      const text = 'Hello world';
      const options = { format: 'markdown' };

      // Act
      const result = await outputService.formatTextOutput(text, options);

      // Assert
      expect(result).toHaveProperty('format', 'markdown');
    });

    it('should handle empty text', async () => {
      // Arrange
      const text = '';

      // Act
      const result = await outputService.formatTextOutput(text);

      // Assert
      expect(result).toHaveProperty('text', '');
      expect(result).toHaveProperty('format', 'plain');
      expect(result).toHaveProperty('metadata', {});
    });
  });

  describe('textToSpeech', () => {
    it('should convert text to speech correctly', async () => {
      // Arrange
      const text = 'Hello world';
      const options = { voice: 'female', speed: 1.2, pitch: 0.8 };

      // Act
      const result = await outputService.textToSpeech(text, options);

      // Assert
      expect(result).toHaveProperty('text', text);
      expect(result).toHaveProperty('audioData');
      expect(result).toHaveProperty('format', 'wav');
      expect(result).toHaveProperty('timestamp');
      expect(result.metadata).toHaveProperty('voice', 'female');
      expect(result.metadata).toHaveProperty('speed', 1.2);
      expect(result.metadata).toHaveProperty('pitch', 0.8);
      expect(logger.debug).toHaveBeenCalledWith('Converting text to speech:', { text, options });
    });

    it('should use default values when options are not provided', async () => {
      // Arrange
      const text = 'Hello world';

      // Act
      const result = await outputService.textToSpeech(text);

      // Assert
      expect(result.metadata).toHaveProperty('voice', 'default');
      expect(result.metadata).toHaveProperty('speed', 1.0);
      expect(result.metadata).toHaveProperty('pitch', 1.0);
    });
  });

  describe('prepareMultimodalOutput', () => {
    it('should prepare multimodal output correctly', async () => {
      // Arrange
      const content = {
        text: 'Hello world',
        media: [{ type: 'image', url: 'https://example.com/image.jpg' }],
        links: [{ text: 'Example', url: 'https://example.com' }],
        actions: [{ type: 'button', text: 'Click me' }]
      };
      const options = { theme: 'dark' };

      // Act
      const result = await outputService.prepareMultimodalOutput(content, options);

      // Assert
      expect(result).toHaveProperty('text', content.text);
      expect(result).toHaveProperty('media', content.media);
      expect(result).toHaveProperty('links', content.links);
      expect(result).toHaveProperty('actions', content.actions);
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('metadata', options);
      expect(logger.debug).toHaveBeenCalledWith('Preparing multimodal output', { content, options });
    });

    it('should handle empty content', async () => {
      // Arrange
      const content = {};

      // Act
      const result = await outputService.prepareMultimodalOutput(content);

      // Assert
      expect(result).toHaveProperty('text', '');
      expect(result).toHaveProperty('media', []);
      expect(result).toHaveProperty('links', []);
      expect(result).toHaveProperty('actions', []);
      expect(result).toHaveProperty('metadata', {});
    });
  });
});
