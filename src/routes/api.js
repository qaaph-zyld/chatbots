/**
 * Main API Routes
 * 
 * Centralizes all API routes for the chatbot platform.
 */

const express = require('express');
const router = express.Router();

// Import route modules
const openVoiceRoutes = require('./api/open-voice');
const modelManagerRoutes = require('./api/model-manager');
const voiceRecognitionRoutes = require('./api/voice-recognition');
const languageDetectorRoutes = require('./api/language-detector');
const audioProcessorRoutes = require('./api/audio-processor');
const cacheEfficiencyRoutes = require('./api/cache-efficiency');

// Open Voice routes
router.use('/open-voice', openVoiceRoutes);

// Model Manager routes
router.use('/model-manager', modelManagerRoutes);

// Voice Recognition routes
router.use('/voice-recognition', voiceRecognitionRoutes);

// Language Detector routes
router.use('/language-detector', languageDetectorRoutes);

// Audio Processor routes
router.use('/audio-processor', audioProcessorRoutes);

// Cache Efficiency routes
router.use('/cache-efficiency', cacheEfficiencyRoutes);

// Export router
module.exports = router;
