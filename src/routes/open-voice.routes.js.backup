/**
 * Open-Source Voice Interface Routes
 * 
 * Defines API endpoints for open-source voice interface functionality
 */

const express = require('express');
const router = express.Router();
require('@src/controllers\open-voice.controller');
require('@src/auth\auth.middleware');

// Process voice input and get chatbot response
router.post(
  '/chatbots/:chatbotId/conversation',
  [authenticateApiKey, authenticateToken], // Allow API key or token auth
  openVoiceController.uploadAudio,
  openVoiceController.processVoiceInput
);

// Convert text to speech
router.post(
  '/tts',
  [authenticateApiKey, authenticateToken], // Allow API key or token auth
  openVoiceController.textToSpeech
);

// Convert speech to text
router.post(
  '/stt',
  [authenticateApiKey, authenticateToken], // Allow API key or token auth
  openVoiceController.uploadAudio,
  openVoiceController.speechToText
);

// Serve audio file
router.get(
  '/audio/:fileName',
  openVoiceController.serveAudio
);

// Get available voices
router.get(
  '/voices',
  openVoiceController.getVoices
);

// Get voice settings for a chatbot
router.get(
  '/chatbots/:chatbotId/settings',
  [authenticateToken, hasPermission('chatbot:read')],
  openVoiceController.getVoiceSettings
);

// Update voice settings for a chatbot
router.put(
  '/chatbots/:chatbotId/settings',
  [authenticateToken, hasPermission('chatbot:write')],
  openVoiceController.updateVoiceSettings
);

// Get model information
router.get(
  '/models',
  openVoiceController.getModelInfo
);

module.exports = router;
