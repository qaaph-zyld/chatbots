/**
 * Main API Routes
 * 
 * Centralizes all API routes for the chatbot platform.
 */

const express = require('express');
const router = express.Router();

// Import route modules
const openVoiceRoutes = require('./open-voice.routes');
const modelManagerRoutes = require('./model-manager.routes');
const voiceRecognitionRoutes = require('./voice-recognition.routes');
const languageDetectorRoutes = require('./language-detector.routes');
const audioProcessorRoutes = require('./audio-processor.routes');

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

// Export router
module.exports = router;
