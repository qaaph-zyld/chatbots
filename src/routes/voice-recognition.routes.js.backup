/**
 * Voice Recognition Routes
 * 
 * API routes for voice recognition features.
 */

const express = require('express');
const router = express.Router();
require('@src/controllers\voice-recognition.controller');

/**
 * @route POST /api/voice-recognition/initialize
 * @desc Initialize voice recognition service
 * @access Private
 */
router.post('/initialize', voiceRecognitionController.initialize);

/**
 * @route GET /api/voice-recognition/profiles
 * @desc Get speaker profiles
 * @access Private
 */
router.get('/profiles', voiceRecognitionController.getSpeakerProfiles);

/**
 * @route POST /api/voice-recognition/profiles
 * @desc Create speaker profile
 * @access Private
 */
router.post('/profiles', voiceRecognitionController.createSpeakerProfile);

/**
 * @route DELETE /api/voice-recognition/profiles/:speakerId
 * @desc Delete speaker profile
 * @access Private
 */
router.delete('/profiles/:speakerId', voiceRecognitionController.deleteSpeakerProfile);

/**
 * @route POST /api/voice-recognition/profiles/:speakerId/enroll
 * @desc Enroll speaker
 * @access Private
 */
router.post('/profiles/:speakerId/enroll', voiceRecognitionController.enrollSpeaker);

/**
 * @route POST /api/voice-recognition/identify
 * @desc Identify speaker
 * @access Private
 */
router.post('/identify', voiceRecognitionController.identifySpeaker);

/**
 * @route POST /api/voice-recognition/profiles/:speakerId/verify
 * @desc Verify speaker
 * @access Private
 */
router.post('/profiles/:speakerId/verify', voiceRecognitionController.verifySpeaker);

module.exports = router;
