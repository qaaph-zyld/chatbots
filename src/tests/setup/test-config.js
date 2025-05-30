/**
 * Test Configuration
 * 
 * Provides mock configuration for tests to prevent undefined errors
 */

// Create a mock configuration object for tests
const testConfig = {
  storage: {
    baseDir: './test-storage',
    tempDir: './test-storage/temp',
    dataDir: './test-storage/data',
    cacheDir: './test-storage/cache',
    modelDir: './test-storage/models'
  },
  stt: {
    modelPath: './test-storage/models/stt'
  },
  tts: {
    modelPath: './test-storage/models/tts'
  },
  recognition: {
    modelPath: './test-storage/models/recognition'
  },
  nlp: {
    modelPath: './test-storage/models/nlp'
  },
  chatbot: {
    modelPath: './test-storage/models/chatbot'
  },
  auth: {
    jwtSecret: 'test-secret-key',
    jwtExpiresIn: '1h',
    saltRounds: 10
  },
  database: {
    uri: 'mongodb://localhost:27017/chatbots-test',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },
  server: {
    port: 3001,
    host: 'localhost'
  },
  logging: {
    level: 'ERROR',
    file: './test-logs/app.log'
  },
  api: {
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 100
    },
    proxy: {
      host: '104.129.196.38',
      port: 10563
    }
  }
};

module.exports = testConfig;
