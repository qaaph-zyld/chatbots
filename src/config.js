/**
 * Application Configuration
 * 
 * Central configuration for the chatbot platform
 */

// Import voice configuration
const voiceConfig = require('./config/open-voice.config');

module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost'
  },
  
  // Database configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbots',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },
  
  // Authentication configuration
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
    saltRounds: 10
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'INFO', // ERROR, WARN, INFO, DEBUG
    file: process.env.LOG_FILE || 'logs/app.log',
    maxSize: process.env.LOG_MAX_SIZE || '10m',
    maxFiles: process.env.LOG_MAX_FILES || 5
  },
  
  // API configuration
  api: {
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    },
    proxy: {
      host: '104.129.196.38',
      port: 10563
    }
  },
  
  // NLP configuration
  nlp: {
    defaultLanguage: 'en',
    modelPath: process.env.NLP_MODEL_PATH || './models/nlp'
  },
  
  // Voice processing configuration
  voice: {
    sttModelPath: process.env.STT_MODEL_PATH || './models/stt',
    ttsModelPath: process.env.TTS_MODEL_PATH || './models/tts',
    // Import voice configuration from external file
    ...voiceConfig
  },
  
  // Chatbot configuration
  chatbot: {
    enabledEngines: process.env.ENABLED_ENGINES ? process.env.ENABLED_ENGINES.split(',') : ['botpress', 'huggingface'],
    defaultEngine: process.env.DEFAULT_ENGINE || 'botpress',
    fallbackEngine: 'huggingface',
    contextLength: 10,
    maxTokens: 2048,
    temperature: 0.7,
    modelPath: process.env.CHATBOT_MODEL_PATH || './models/chatbot'
  },
  
  // Storage configuration
  storage: {
    baseDir: process.env.STORAGE_BASE_DIR || './storage',
    tempDir: process.env.STORAGE_TEMP_DIR || './storage/temp',
    dataDir: process.env.STORAGE_DATA_DIR || './storage/data',
    cacheDir: process.env.STORAGE_CACHE_DIR || './storage/cache',
    modelDir: process.env.STORAGE_MODEL_DIR || './storage/models',
    maxCacheSize: process.env.STORAGE_MAX_CACHE_SIZE || 100 * 1024 * 1024, // 100MB
    allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv', 'wav', 'mp3', 'mp4']
  }
};
