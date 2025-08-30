/**
 * Voice Interface Routes
 * 
 * Defines API endpoints for voice interface functionality
 */

const express = require('express');
const router = express.Router();
require('@src/controllers\voice.controller');
require('@src/auth\auth.middleware');

// Process voice input and get chatbot response
router.post(
  '/chatbots/:chatbotId/conversation',
  [authenticateApiKey, authenticateToken], // Allow API key or token auth
  voiceController.uploadAudio,
  voiceController.processVoiceInput
);

// Convert text to speech
router.post(
  '/tts',
  [authenticateApiKey, authenticateToken], // Allow API key or token auth
  voiceController.textToSpeech
);

// Convert speech to text
router.post(
  '/stt',
  [authenticateApiKey, authenticateToken], // Allow API key or token auth
  voiceController.uploadAudio,
  voiceController.speechToText
);

// Serve audio file
router.get(
  '/audio/:fileName',
  voiceController.serveAudio
);

// Get available voices
router.get(
  '/voices',
  voiceController.getVoices
);

// Get voice settings for a chatbot
router.get(
  '/chatbots/:chatbotId/settings',
  [authenticateToken, hasPermission('chatbot:read')],
  voiceController.getVoiceSettings
);

// Update voice settings for a chatbot
router.put(
  '/chatbots/:chatbotId/settings',
  [authenticateToken, hasPermission('chatbot:write')],
  voiceController.updateVoiceSettings
);

module.exports = router;
