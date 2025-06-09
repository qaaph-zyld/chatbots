/**
 * Main API Routes
 * 
 * Centralizes all API routes for the chatbot platform.
 */

const express = require('express');
const router = express.Router();

// Import route modules
require('@src/routes\open-voice.routes');
require('@src/routes\model-manager.routes');
require('@src/routes\voice-recognition.routes');
require('@src/routes\language-detector.routes');
require('@src/routes\audio-processor.routes');

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
