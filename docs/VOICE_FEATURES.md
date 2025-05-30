# Open-Source Voice Features Documentation

This document provides comprehensive information about the open-source voice interface implemented in the chatbot platform. It covers all components, their functionality, configuration options, and usage examples.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Components](#components)
   - [Audio Processing](#audio-processing)
   - [Language Detection](#language-detection)
   - [Model Management](#model-management)
   - [Voice Recognition](#voice-recognition)
4. [API Reference](#api-reference)
5. [Configuration](#configuration)
6. [Usage Examples](#usage-examples)
7. [Troubleshooting](#troubleshooting)

## Overview

The open-source voice interface provides a complete solution for integrating voice capabilities into the chatbot platform. It includes features for audio processing, language detection, model management, and voice recognition, all implemented using open-source libraries and tools to ensure accessibility and customization for businesses of all sizes.

Key features include:
- Audio preprocessing (noise reduction, normalization, silence removal)
- Multi-language support with automatic language detection
- Speaker identification and verification
- Model management for downloading and maintaining voice models
- Comprehensive API for integration with other systems

## Architecture

The voice interface follows a modular architecture, with each component designed to work independently or as part of the complete system. The main components include:

1. **Audio Processor**: Handles audio file processing, including format conversion, normalization, and voice activity detection.
2. **Language Detector**: Identifies the language of text input using open-source libraries.
3. **Model Manager**: Manages voice models, including downloading, validation, and storage.
4. **Voice Recognition Service**: Provides speaker identification and verification capabilities.

Each component exposes a set of APIs that can be accessed through HTTP endpoints or directly through the JavaScript interface.

## Components

### Audio Processing

The audio processing component handles all aspects of audio file manipulation, including:

- Format conversion (WAV, MP3, OGG, etc.)
- Audio normalization and volume adjustment
- Noise reduction and filtering
- Silence detection and removal
- Voice activity detection

#### Key Files:
- `src/utils/audio-processor.js`: Core audio processing utility
- `src/controllers/audio-processor.controller.js`: API controller
- `src/routes/audio-processor.routes.js`: API routes

#### Dependencies:
- FFmpeg: For audio format conversion and processing
- SoX: For advanced audio manipulation

#### Example Usage:

```javascript
const audioProcessor = require('../utils/audio-processor');

// Process an audio file
const processedBuffer = await audioProcessor.processAudio('/path/to/audio.wav', {
  sampleRate: 16000,
  channels: 1,
  normalize: true,
  removeNoise: true,
  removeSilence: true
});

// Convert audio format
const mp3Buffer = await audioProcessor.convertFormat('/path/to/audio.wav', 'mp3', {
  sampleRate: 16000,
  channels: 1,
  bitrate: 128
});

// Detect voice activity
const vadResult = await audioProcessor.detectVoiceActivity('/path/to/audio.wav', {
  threshold: 0.01,
  frameDuration: 0.01,
  minSpeechDuration: 0.1
});
```

### Language Detection

The language detection component identifies the language of text input, supporting multiple languages and providing confidence scores for detection results.

#### Key Files:
- `src/utils/language-detector.js`: Core language detection utility
- `src/controllers/language-detector.controller.js`: API controller
- `src/routes/language-detector.routes.js`: API routes

#### Dependencies:
- franc: For language identification
- langdetect: For additional language detection capabilities

#### Example Usage:

```javascript
const languageDetector = require('../utils/language-detector');

// Detect language
const result = await languageDetector.detectLanguage('This is a sample text');
// Returns: { detected: true, language: 'en-US', confidence: 0.95 }

// Get supported languages
const languages = languageDetector.getSupportedLanguages();

// Check if language is supported
const isSupported = languageDetector.isLanguageSupported('en-US');
```

### Model Management

The model management component handles downloading, validating, and managing voice models for speech recognition and synthesis.

#### Key Files:
- `src/utils/model-manager.js`: Core model management utility
- `src/controllers/model-manager.controller.js`: API controller
- `src/routes/model-manager.routes.js`: API routes

#### Example Usage:

```javascript
const modelManager = require('../utils/model-manager');

// Get available models
const models = modelManager.getAvailableModels('stt', 'deepspeech');

// Check if model is installed
const isInstalled = await modelManager.isModelInstalled('/path/to/model', model);

// Get model status
const status = await modelManager.getModelStatus();

// Download model
const result = await modelManager.downloadModel('stt', 'deepspeech', 'en-US');
```

### Voice Recognition

The voice recognition component provides speaker identification and verification capabilities, allowing the system to recognize and authenticate users based on their voice.

#### Key Files:
- `src/services/voice-recognition.service.js`: Core voice recognition service
- `src/controllers/voice-recognition.controller.js`: API controller
- `src/routes/voice-recognition.routes.js`: API routes

#### Example Usage:

```javascript
const voiceRecognitionService = require('../services/voice-recognition.service');

// Create speaker profile
const createResult = await voiceRecognitionService.createSpeakerProfile('user123', 'John Doe');

// Enroll speaker
const enrollResult = await voiceRecognitionService.enrollSpeaker('user123', audioBuffer);

// Verify speaker
const verifyResult = await voiceRecognitionService.verifySpeaker('user123', audioBuffer);

// Identify speaker
const identifyResult = await voiceRecognitionService.identifySpeaker(audioBuffer);
```

## API Reference

### Audio Processor API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/audio-processor/process` | POST | Process an audio file |
| `/api/audio-processor/convert` | POST | Convert audio format |
| `/api/audio-processor/vad` | POST | Detect voice activity |
| `/api/audio-processor/info` | POST | Get audio file information |

### Language Detector API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/language-detector/detect` | POST | Detect language from text |
| `/api/language-detector/supported` | GET | Get supported languages |

### Model Manager API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/model-manager/status` | GET | Get model status |
| `/api/model-manager/available` | GET | Get available models |
| `/api/model-manager/download/:type/:engine/:language` | GET | Download model |
| `/api/model-manager/delete/:type/:engine/:language` | DELETE | Delete model |

### Voice Recognition API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/voice-recognition/profiles` | GET | Get speaker profiles |
| `/api/voice-recognition/profiles` | POST | Create speaker profile |
| `/api/voice-recognition/profiles/:id` | DELETE | Delete speaker profile |
| `/api/voice-recognition/enroll/:id` | POST | Enroll speaker |
| `/api/voice-recognition/verify/:id` | POST | Verify speaker |
| `/api/voice-recognition/identify` | POST | Identify speaker |

## Configuration

The voice interface can be configured through environment variables or the configuration file (`open-voice.config.js`).

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPEN_VOICE_LANGUAGE_DEFAULT` | Default language | `en-US` |
| `OPEN_VOICE_LANGUAGE_AUTO_DETECT` | Enable automatic language detection | `true` |
| `OPEN_VOICE_PROCESSING_WORKERS` | Number of audio processing workers | `2` |
| `OPEN_VOICE_RECOGNITION_ENABLED` | Enable voice recognition | `true` |
| `OPEN_VOICE_MODEL_DIR` | Directory for storing models | `./models` |

### Configuration File

```javascript
// open-voice.config.js
module.exports = {
  language: {
    default: 'en-US',
    autoDetect: true
  },
  audio: {
    sampleRate: 16000,
    channels: 1,
    format: 'wav',
    workers: 2
  },
  models: {
    directory: './models',
    defaultEngines: {
      stt: 'deepspeech',
      tts: 'espeak'
    }
  },
  recognition: {
    enabled: true,
    threshold: 0.7,
    minEnrollments: 3
  }
};
```

## Usage Examples

### Processing Audio and Detecting Language

```javascript
const audioProcessor = require('../utils/audio-processor');
const languageDetector = require('../utils/language-detector');

async function processAudioAndDetectLanguage(audioPath) {
  // Process audio
  const processedBuffer = await audioProcessor.processAudio(audioPath, {
    sampleRate: 16000,
    channels: 1,
    normalize: true,
    removeNoise: true
  });
  
  // Convert to text (assuming you have a speech-to-text service)
  const text = await speechToText(processedBuffer);
  
  // Detect language
  const languageResult = await languageDetector.detectLanguage(text);
  
  return {
    text,
    language: languageResult.language,
    confidence: languageResult.confidence
  };
}
```

### Speaker Verification

```javascript
const voiceRecognitionService = require('../services/voice-recognition.service');
const audioProcessor = require('../utils/audio-processor');

async function verifySpeakerFromAudio(speakerId, audioPath) {
  // Process audio
  const processedBuffer = await audioProcessor.processAudio(audioPath, {
    sampleRate: 16000,
    channels: 1,
    normalize: true
  });
  
  // Detect voice activity
  const vadResult = await audioProcessor.detectVoiceActivity(processedBuffer);
  
  if (!vadResult.hasSpeech) {
    return { success: false, message: 'No speech detected in audio' };
  }
  
  // Verify speaker
  const verifyResult = await voiceRecognitionService.verifySpeaker(speakerId, processedBuffer);
  
  return verifyResult;
}
```

## Troubleshooting

### Common Issues

#### Audio Processing Fails

**Issue**: Audio processing operations fail or produce unexpected results.

**Solution**:
- Ensure FFmpeg and SoX are properly installed and available in the system PATH.
- Check that the audio file format is supported.
- Verify that the audio file is not corrupted.
- Check the audio processing parameters (sample rate, channels, etc.).

#### Language Detection Inaccurate

**Issue**: Language detection produces incorrect results or low confidence scores.

**Solution**:
- Ensure the text contains enough content for accurate detection (at least 10-20 words).
- Check if the language is supported by the language detector.
- Try using a different language detection algorithm or library.

#### Model Download Fails

**Issue**: Unable to download voice models.

**Solution**:
- Check internet connectivity.
- Verify that the model URL is correct and accessible.
- Ensure sufficient disk space for the model.
- Check file permissions for the model directory.

#### Voice Recognition Issues

**Issue**: Speaker verification or identification produces incorrect results.

**Solution**:
- Ensure the speaker has enough enrollments (at least 3 recommended).
- Check audio quality and ensure it contains clear speech.
- Adjust the verification threshold if necessary.
- Re-enroll the speaker with higher quality audio samples.

### Diagnostic Tools

The voice interface includes several diagnostic tools to help troubleshoot issues:

- **Audio Information**: Use the `getAudioInfo` method to get detailed information about audio files.
- **Model Validation**: Use the `validateModel` method to check if a model is valid and compatible.
- **Language Detection Debug**: Enable debug mode in the language detector to see detailed detection results.
- **Voice Recognition Testing**: Use the test utilities to verify voice recognition functionality.

## Conclusion

The open-source voice interface provides a comprehensive solution for integrating voice capabilities into the chatbot platform. By following the documentation and examples provided, you can effectively implement and customize the voice features to meet your specific requirements.

For additional support or to contribute to the development of the voice interface, please refer to the project repository and community resources.
