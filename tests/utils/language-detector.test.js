/**
 * Language Detector Tests
 * 
 * Tests for the language detector utility.
 */

require('@src/utils\language-detector');

describe('Language Detector', () => {
  beforeAll(async () => {
    // Initialize language detector
    await languageDetector.initialize();
  });
  
  describe('Initialization', () => {
    test('should initialize successfully', async () => {
      const result = await languageDetector.initialize();
      expect(result).toBe(true);
      expect(languageDetector.initialized).toBe(true);
    });
  });
  
  describe('Language Detection', () => {
    test('should detect English language', async () => {
      const text = 'This is a sample text in English to test language detection.';
      const result = await languageDetector.detectLanguage(text);
      
      expect(result).toHaveProperty('detected');
      expect(result).toHaveProperty('language');
      expect(result).toHaveProperty('confidence');
      
      expect(result.detected).toBe(true);
      expect(result.language).toMatch(/en-/);
      expect(result.confidence).toBeGreaterThan(0.5);
    });
    
    test('should detect French language', async () => {
      const text = 'Ceci est un exemple de texte en français pour tester la détection de langue.';
      const result = await languageDetector.detectLanguage(text);
      
      expect(result).toHaveProperty('detected');
      expect(result).toHaveProperty('language');
      expect(result).toHaveProperty('confidence');
      
      expect(result.detected).toBe(true);
      expect(result.language).toMatch(/fr-/);
      expect(result.confidence).toBeGreaterThan(0.5);
    });
    
    test('should detect Spanish language', async () => {
      const text = 'Este es un texto de ejemplo en español para probar la detección de idioma.';
      const result = await languageDetector.detectLanguage(text);
      
      expect(result).toHaveProperty('detected');
      expect(result).toHaveProperty('language');
      expect(result).toHaveProperty('confidence');
      
      expect(result.detected).toBe(true);
      expect(result.language).toMatch(/es-/);
      expect(result.confidence).toBeGreaterThan(0.5);
    });
    
    test('should detect German language', async () => {
      const text = 'Dies ist ein Beispieltext auf Deutsch, um die Spracherkennung zu testen.';
      const result = await languageDetector.detectLanguage(text);
      
      expect(result).toHaveProperty('detected');
      expect(result).toHaveProperty('language');
      expect(result).toHaveProperty('confidence');
      
      expect(result.detected).toBe(true);
      expect(result.language).toMatch(/de-/);
      expect(result.confidence).toBeGreaterThan(0.5);
    });
    
    test('should handle short text', async () => {
      const text = 'Hello';
      const result = await languageDetector.detectLanguage(text);
      
      expect(result).toHaveProperty('detected');
      expect(result).toHaveProperty('language');
      expect(result).toHaveProperty('confidence');
      
      // Short text may not be detected reliably
      if (result.detected) {
        expect(result.confidence).toBeGreaterThan(0);
      } else {
        expect(result.message).toBeDefined();
      }
    });
    
    test('should handle empty text', async () => {
      const text = '';
      const result = await languageDetector.detectLanguage(text);
      
      expect(result).toHaveProperty('detected');
      expect(result).toHaveProperty('language');
      
      expect(result.detected).toBe(false);
      expect(result.message).toBeDefined();
    });
  });
  
  describe('Supported Languages', () => {
    test('should get supported languages', () => {
      const languages = languageDetector.getSupportedLanguages();
      
      expect(languages).toBeDefined();
      expect(Object.keys(languages).length).toBeGreaterThan(0);
      
      // Check structure of language data
      const firstLanguage = Object.values(languages)[0];
      expect(firstLanguage).toHaveProperty('name');
      expect(firstLanguage).toHaveProperty('locales');
      expect(Array.isArray(firstLanguage.locales)).toBe(true);
    });
    
    test('should check if language is supported', () => {
      // Check supported languages
      expect(languageDetector.isLanguageSupported('en')).toBe(true);
      expect(languageDetector.isLanguageSupported('en-US')).toBe(true);
      
      // Check unsupported languages
      expect(languageDetector.isLanguageSupported('xx')).toBe(false);
      expect(languageDetector.isLanguageSupported('en-XX')).toBe(false);
    });
    
    test('should get best locale for language', () => {
      // Get locale for base language
      const enLocale = languageDetector.getBestLocale('en');
      expect(enLocale).toBeDefined();
      expect(enLocale).toMatch(/en-/);
      
      // Get locale for specific locale
      const enUSLocale = languageDetector.getBestLocale('en-US');
      expect(enUSLocale).toBeDefined();
      expect(enUSLocale).toBe('en-US');
      
      // Get locale for unsupported language
      const unknownLocale = languageDetector.getBestLocale('xx');
      expect(unknownLocale).toBeDefined();
      expect(unknownLocale).toBe('en-US'); // Default to English
    });
  });
});
