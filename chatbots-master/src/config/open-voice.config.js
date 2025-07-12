/**
 * Open Voice Configuration
 * Configuration settings for voice processing capabilities
 */

module.exports = {
  // Speech-to-Text configuration
  stt: {
    provider: process.env.VOICE_STT_PROVIDER || 'google',
    apiKeys: {
      google: process.env.GOOGLE_SPEECH_API_KEY,
      azure: process.env.AZURE_SPEECH_KEY,
      aws: process.env.AWS_ACCESS_KEY_ID
    },
    defaultLanguage: 'en-US',
    sampleRate: 16000,
    encoding: 'LINEAR16',
    modelPath: './models/stt/',
    tempDir: './temp/audio',
    maxDuration: 60, // seconds
    timeout: 15000 // ms
  },
  
  // Text-to-Speech configuration
  tts: {
    provider: process.env.VOICE_TTS_PROVIDER || 'google',
    apiKeys: {
      google: process.env.GOOGLE_TTS_API_KEY,
      azure: process.env.AZURE_SPEECH_KEY,
      aws: process.env.AWS_ACCESS_KEY_ID
    },
    defaultVoice: 'en-US-Wavenet-F',
    fallbackVoice: 'en-US-Standard-B',
    outputFormat: 'mp3',
    sampleRate: 24000,
    modelPath: './models/tts/',
    cacheEnabled: true,
    cacheDir: './cache/tts'
  },
  
  // Audio processing configuration
  audio: {
    tempDir: './temp/audio',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFormats: ['wav', 'mp3', 'ogg', 'flac'],
    normalizeAudio: true,
    noiseReduction: true,
    silenceThreshold: 0.05,
    silenceDuration: 0.5 // seconds
  },
  
  // Voice interface configuration
  interface: {
    wakeWord: 'hey assistant',
    endPhrase: 'thank you',
    continuousListening: false,
    responseDelay: 200, // ms
    maxResponseTime: 5000, // ms
    interactionTimeout: 30000 // ms
  }
};
