/**
 * Audio Processor Routes
 * 
 * API routes for audio processing.
 */

const express = require('express');
const router = express.Router();
require('@src/controllers\audio-processor.controller');

/**
 * @route POST /api/audio-processor/process
 * @desc Process audio file
 * @access Public
 */
router.post('/process', audioProcessorController.processAudio);

/**
 * @route POST /api/audio-processor/convert
 * @desc Convert audio format
 * @access Public
 */
router.post('/convert', audioProcessorController.convertFormat);

/**
 * @route POST /api/audio-processor/info
 * @desc Get audio information
 * @access Public
 */
router.post('/info', audioProcessorController.getAudioInfo);

/**
 * @route POST /api/audio-processor/vad
 * @desc Detect voice activity
 * @access Public
 */
router.post('/vad', audioProcessorController.detectVoiceActivity);

module.exports = router;
