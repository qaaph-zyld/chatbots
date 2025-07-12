/**
 * Voice Interface Configuration
 * 
 * Configuration settings for the voice interface
 */

module.exports = {
  // Speech-to-Text configuration
  stt: {
    // Default provider
    provider: process.env.VOICE_STT_PROVIDER || 'google',
    
    // API keys for providers
    apiKeys: {
      google: process.env.GOOGLE_SPEECH_API_KEY,
      azure: process.env.AZURE_SPEECH_KEY,
      aws: process.env.AWS_ACCESS_KEY_ID
    },
    
    // Region settings
    regions: {
      azure: process.env.AZURE_SPEECH_REGION || 'eastus',
      aws: process.env.AWS_REGION || 'us-east-1'
    },
    
    // Default language
    language: process.env.VOICE_STT_LANGUAGE || 'en-US',
    
    // Alternative languages to try if primary fails
    alternativeLanguages: ['en-GB', 'en-AU'],
    
    // Maximum duration for audio input (seconds)
    maxDuration: 60,
    
    // Sample rate for audio (Hz)
    sampleRate: 16000,
    
    // Audio encoding format
    encoding: 'LINEAR16',
    
    // Recognition model to use
    model: 'default'
  },
  
  // Text-to-Speech configuration
  tts: {
    // Default provider
    provider: process.env.VOICE_TTS_PROVIDER || 'google',
    
    // API keys for providers
    apiKeys: {
      google: process.env.GOOGLE_SPEECH_API_KEY,
      azure: process.env.AZURE_SPEECH_KEY,
      aws: process.env.AWS_ACCESS_KEY_ID
    },
    
    // Region settings
    regions: {
      azure: process.env.AZURE_SPEECH_REGION || 'eastus',
      aws: process.env.AWS_REGION || 'us-east-1'
    },
    
    // Default language
    language: process.env.VOICE_TTS_LANGUAGE || 'en-US',
    
    // Default voice
    voice: process.env.VOICE_TTS_VOICE || 'en-US-Neural2-F',
    
    // Speaking rate (1.0 is normal speed)
    speakingRate: parseFloat(process.env.VOICE_TTS_SPEAKING_RATE || '1.0'),
    
    // Pitch adjustment (-20.0 to 20.0, 0.0 is normal)
    pitch: parseFloat(process.env.VOICE_TTS_PITCH || '0.0'),
    
    // Volume gain in dB (-96.0 to 16.0, 0.0 is normal)
    volumeGainDb: parseFloat(process.env.VOICE_TTS_VOLUME_GAIN || '0.0'),
    
    // Audio encoding format
    audioEncoding: process.env.VOICE_TTS_AUDIO_ENCODING || 'MP3'
  },
  
  // Storage configuration
  storage: {
    // Temporary directory for voice files
    tempDir: process.env.VOICE_TEMP_DIR || 'temp/voice',
    
    // Maximum age for temporary files (seconds)
    maxAge: parseInt(process.env.VOICE_TEMP_MAX_AGE || '3600', 10),
    
    // Maximum file size for uploads (bytes)
    maxFileSize: parseInt(process.env.VOICE_MAX_FILE_SIZE || '10485760', 10) // 10MB
  },
  
  // Voice recognition configuration
  recognition: {
    // Whether voice recognition is enabled
    enabled: process.env.VOICE_RECOGNITION_ENABLED === 'true',
    
    // Minimum confidence threshold for recognition
    minConfidence: parseFloat(process.env.VOICE_RECOGNITION_MIN_CONFIDENCE || '0.7'),
    
    // Path to voice recognition model
    modelPath: process.env.VOICE_RECOGNITION_MODEL_PATH || 'models/voice-recognition'
  }
};
