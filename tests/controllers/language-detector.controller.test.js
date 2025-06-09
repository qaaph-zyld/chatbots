/**
 * Language Detector Controller Tests
 * 
 * Tests for the language detector controller.
 */

const request = require('supertest');
const express = require('express');
require('@src/controllers\language-detector.controller');
require('@src/utils\language-detector');

// Mock language detector
jest.mock('../../src/utils/language-detector', () => ({
  initialize: jest.fn().mockResolvedValue(true),
  detectLanguage: jest.fn().mockImplementation((text) => {
    if (!text) {
      return Promise.resolve({
        detected: false,
        language: null,
        confidence: 0,
        message: 'Text is empty'
      });
    }
    
    if (text.includes('English')) {
      return Promise.resolve({
        detected: true,
        language: 'en-US',
        confidence: 0.95
      });
    }
    
    if (text.includes('français')) {
      return Promise.resolve({
        detected: true,
        language: 'fr-FR',
        confidence: 0.92
      });
    }
    
    return Promise.resolve({
      detected: true,
      language: 'en-US',
      confidence: 0.7
    });
  }),
  getSupportedLanguages: jest.fn().mockReturnValue({
    'en': { name: 'English', locales: ['en-US', 'en-GB'] },
    'fr': { name: 'French', locales: ['fr-FR'] },
    'es': { name: 'Spanish', locales: ['es-ES'] },
    'de': { name: 'German', locales: ['de-DE'] }
  }),
  isLanguageSupported: jest.fn().mockImplementation((lang) => {
    return ['en', 'fr', 'es', 'de', 'en-US', 'fr-FR', 'es-ES', 'de-DE'].includes(lang);
  }),
  getBestLocale: jest.fn().mockImplementation((lang) => {
    const locales = {
      'en': 'en-US',
      'fr': 'fr-FR',
      'es': 'es-ES',
      'de': 'de-DE'
    };
    return locales[lang] || lang;
  })
}));

// Create test app
const app = express();
app.use(express.json());

// Setup routes
app.post('/api/language-detector/detect', languageDetectorController.detectLanguage);
app.get('/api/language-detector/supported', languageDetectorController.getSupportedLanguages);

describe('Language Detector Controller', () => {
  describe('Detect Language', () => {
    test('should detect English language', async () => {
      const response = await request(app)
        .post('/api/language-detector/detect')
        .send({ text: 'This is a sample text in English' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('result');
      expect(response.body.result).toHaveProperty('detected', true);
      expect(response.body.result).toHaveProperty('language', 'en-US');
      expect(response.body.result).toHaveProperty('confidence');
      expect(languageDetector.detectLanguage).toHaveBeenCalled();
    });
    
    test('should detect French language', async () => {
      const response = await request(app)
        .post('/api/language-detector/detect')
        .send({ text: 'Ceci est un exemple de texte en français' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('result');
      expect(response.body.result).toHaveProperty('detected', true);
      expect(response.body.result).toHaveProperty('language', 'fr-FR');
      expect(response.body.result).toHaveProperty('confidence');
      expect(languageDetector.detectLanguage).toHaveBeenCalled();
    });
    
    test('should handle empty text', async () => {
      const response = await request(app)
        .post('/api/language-detector/detect')
        .send({ text: '' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('result');
      expect(response.body.result).toHaveProperty('detected', false);
      expect(response.body.result).toHaveProperty('message');
      expect(languageDetector.detectLanguage).toHaveBeenCalled();
    });
    
    test('should handle missing text', async () => {
      const response = await request(app)
        .post('/api/language-detector/detect')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });
    
    test('should handle options', async () => {
      const response = await request(app)
        .post('/api/language-detector/detect')
        .send({ 
          text: 'This is a sample text',
          options: {
            minLength: 10,
            algorithm: 'franc'
          }
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(languageDetector.detectLanguage).toHaveBeenCalledWith(
        'This is a sample text',
        expect.objectContaining({
          minLength: 10,
          algorithm: 'franc'
        })
      );
    });
  });
  
  describe('Get Supported Languages', () => {
    test('should get supported languages', async () => {
      const response = await request(app)
        .get('/api/language-detector/supported');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('languages');
      expect(Object.keys(response.body.languages).length).toBeGreaterThan(0);
      expect(languageDetector.getSupportedLanguages).toHaveBeenCalled();
    });
  });
});
