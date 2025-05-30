/**
 * Language Detector Routes
 * 
 * API routes for language detection.
 */

const express = require('express');
const router = express.Router();
const languageDetectorController = require('../controllers/language-detector.controller');

/**
 * @route POST /api/language-detector/detect
 * @desc Detect language from text
 * @access Public
 */
router.post('/detect', languageDetectorController.detectLanguage);

/**
 * @route GET /api/language-detector/languages
 * @desc Get supported languages
 * @access Public
 */
router.get('/languages', languageDetectorController.getSupportedLanguages);

/**
 * @route GET /api/language-detector/supported/:language
 * @desc Check if language is supported
 * @access Public
 */
router.get('/supported/:language', languageDetectorController.isLanguageSupported);

/**
 * @route GET /api/language-detector/locale/:language
 * @desc Get best locale for language
 * @access Public
 */
router.get('/locale/:language', languageDetectorController.getBestLocale);

module.exports = router;
