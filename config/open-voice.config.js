/**
 * Open-Source Voice Interface Configuration
 * 
 * Configuration settings for the open-source voice interface
 * using only free and open-source components.
 */

module.exports = {
  // Speech-to-Text configuration
  stt: {
    // Default engine - options: 'deepspeech', 'vosk'
    engine: process.env.OPEN_VOICE_STT_ENGINE || 'deepspeech',
    
    // Path to STT models
    modelPath: process.env.OPEN_VOICE_STT_MODEL_PATH || 'models/stt',
    
    // Default language
    language: process.env.OPEN_VOICE_STT_LANGUAGE || 'en-US',
    
    // Alternative languages to try if primary fails
    alternativeLanguages: ['en-GB', 'en-AU'],
    
    // Maximum duration for audio input (seconds)
    maxDuration: 60,
    
    // Sample rate for audio (Hz)
    sampleRate: 16000,
    
    // Auto-download models if not present
    autoDownload: process.env.OPEN_VOICE_STT_AUTO_DOWNLOAD !== 'false',
    
    // Engine-specific settings
    deepspeech: {
      // Model version
      version: process.env.OPEN_VOICE_DEEPSPEECH_VERSION || '0.9.3',
      
      // Beam width for decoding
      beamWidth: parseInt(process.env.OPEN_VOICE_DEEPSPEECH_BEAM_WIDTH || '500', 10),
      
      // Model download URL
      modelUrl: process.env.OPEN_VOICE_DEEPSPEECH_MODEL_URL || 
        'https://github.com/mozilla/DeepSpeech/releases/download/v0.9.3/deepspeech-0.9.3-models.pbmm',
      
      // Scorer download URL
      scorerUrl: process.env.OPEN_VOICE_DEEPSPEECH_SCORER_URL || 
        'https://github.com/mozilla/DeepSpeech/releases/download/v0.9.3/deepspeech-0.9.3-models.scorer'
    },
    
    vosk: {
      // Model version
      version: process.env.OPEN_VOICE_VOSK_VERSION || '0.15',
      
      // Model size - options: 'small', 'medium', 'large'
      modelSize: process.env.OPEN_VOICE_VOSK_MODEL_SIZE || 'small',
      
      // Model download URL
      modelUrl: process.env.OPEN_VOICE_VOSK_MODEL_URL || 
        'https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip'
    }
  },
  
  // Text-to-Speech configuration
  tts: {
    // Default engine - options: 'coqui', 'espeak'
    engine: process.env.OPEN_VOICE_TTS_ENGINE || 'coqui',
    
    // Path to TTS models
    modelPath: process.env.OPEN_VOICE_TTS_MODEL_PATH || 'models/tts',
    
    // Default language
    language: process.env.OPEN_VOICE_TTS_LANGUAGE || 'en-US',
    
    // Default voice
    voice: process.env.OPEN_VOICE_TTS_VOICE || 'ljspeech',
    
    // Speaking rate (1.0 is normal speed)
    speakingRate: parseFloat(process.env.OPEN_VOICE_TTS_SPEAKING_RATE || '1.0'),
    
    // Pitch adjustment (-20.0 to 20.0, 0.0 is normal)
    pitch: parseFloat(process.env.OPEN_VOICE_TTS_PITCH || '0.0'),
    
    // Auto-download models if not present
    autoDownload: process.env.OPEN_VOICE_TTS_AUTO_DOWNLOAD !== 'false',
    
    // Engine-specific settings
    coqui: {
      // Model type - options: 'glow-tts', 'tacotron2'
      modelType: process.env.OPEN_VOICE_COQUI_MODEL_TYPE || 'glow-tts',
      
      // Vocoder type - options: 'hifigan', 'wavernn'
      vocoderType: process.env.OPEN_VOICE_COQUI_VOCODER_TYPE || 'hifigan',
      
      // Model download URL
      modelUrl: process.env.OPEN_VOICE_COQUI_MODEL_URL || 
        'https://github.com/coqui-ai/TTS/releases/download/v0.0.13/tts_models--en--ljspeech--glow-tts.zip'
    },
    
    espeak: {
      // Voice variant
      variant: process.env.OPEN_VOICE_ESPEAK_VARIANT || '',
      
      // Word gap (pause between words in ms)
      wordGap: parseInt(process.env.OPEN_VOICE_ESPEAK_WORD_GAP || '10', 10),
      
      // Capital letter pitch increase (0-100)
      capitalPitch: parseInt(process.env.OPEN_VOICE_ESPEAK_CAPITAL_PITCH || '20', 10)
    }
  },
  
  // Storage configuration
  storage: {
    // Temporary directory for voice files
    tempDir: process.env.OPEN_VOICE_TEMP_DIR || 'temp/voice',
    
    // Maximum age for temporary files (seconds)
    maxAge: parseInt(process.env.OPEN_VOICE_TEMP_MAX_AGE || '3600', 10),
    
    // Directory for models
    modelDir: process.env.OPEN_VOICE_MODEL_DIR || 'models',
    
    // Maximum file size for uploads (bytes)
    maxFileSize: parseInt(process.env.OPEN_VOICE_MAX_FILE_SIZE || '10485760', 10) // 10MB
  },
  
  // Voice recognition configuration (speaker identification)
  recognition: {
    // Whether voice recognition is enabled
    enabled: process.env.OPEN_VOICE_RECOGNITION_ENABLED === 'true',
    
    // Minimum confidence threshold for recognition
    minConfidence: parseFloat(process.env.OPEN_VOICE_RECOGNITION_MIN_CONFIDENCE || '0.7'),
    
    // Path to voice recognition model
    modelPath: process.env.OPEN_VOICE_RECOGNITION_MODEL_PATH || 'models/recognition',
    
    // Path to speaker profiles
    profilePath: process.env.OPEN_VOICE_RECOGNITION_PROFILE_PATH || 'data/speaker-profiles',
    
    // Temporary path for audio processing
    tempPath: process.env.OPEN_VOICE_RECOGNITION_TEMP_PATH || 'temp/recognition',
    
    // Recognition threshold (0.0 to 1.0)
    threshold: parseFloat(process.env.OPEN_VOICE_RECOGNITION_THRESHOLD || '0.75'),
    
    // Auto-download models if not present
    autoDownload: process.env.OPEN_VOICE_RECOGNITION_AUTO_DOWNLOAD !== 'false',
    
    // Maximum number of enrollments per speaker
    maxEnrollments: parseInt(process.env.OPEN_VOICE_RECOGNITION_MAX_ENROLLMENTS || '5', 10),
    
    // Minimum audio duration for enrollment (seconds)
    minEnrollmentDuration: parseFloat(process.env.OPEN_VOICE_RECOGNITION_MIN_ENROLLMENT_DURATION || '3.0'),
    
    // Model download URL
    modelUrl: process.env.OPEN_VOICE_RECOGNITION_MODEL_URL || 'https://example.com/speaker-recognition-model.zip'
  },
  
  // Processing configuration
  processing: {
    // Number of worker threads for processing
    workers: parseInt(process.env.OPEN_VOICE_PROCESSING_WORKERS || '2', 10),
    
    // Processing timeout (seconds)
    timeout: parseInt(process.env.OPEN_VOICE_PROCESSING_TIMEOUT || '30', 10),
    
    // Whether to use GPU acceleration if available
    useGpu: process.env.OPEN_VOICE_PROCESSING_USE_GPU === 'true',
    
    // Memory limit for processing (MB)
    memoryLimit: parseInt(process.env.OPEN_VOICE_PROCESSING_MEMORY_LIMIT || '1024', 10)
  },
  
  // Language configuration
  language: {
    // Default language
    default: process.env.OPEN_VOICE_LANGUAGE_DEFAULT || 'en-US',
    
    // Auto-detect language from input
    autoDetect: process.env.OPEN_VOICE_LANGUAGE_AUTO_DETECT === 'true',
    
    // Minimum confidence for language detection
    minConfidence: parseFloat(process.env.OPEN_VOICE_LANGUAGE_MIN_CONFIDENCE || '0.6'),
    
    // Minimum text length for reliable language detection
    minLength: parseInt(process.env.OPEN_VOICE_LANGUAGE_MIN_LENGTH || '20', 10),
    
    // Language detection timeout (ms)
    timeout: parseInt(process.env.OPEN_VOICE_LANGUAGE_TIMEOUT || '1000', 10),
    
    // Supported languages (override default supported languages)
    supported: process.env.OPEN_VOICE_LANGUAGE_SUPPORTED ? 
      process.env.OPEN_VOICE_LANGUAGE_SUPPORTED.split(',') : 
      null
  }
};
