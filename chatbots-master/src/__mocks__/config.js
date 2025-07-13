// Mock configuration for tests
module.exports = {
  app: {
    env: 'test',
    port: 3001,
    baseUrl: 'http://localhost:3001',
    cors: {
      origin: ['http://localhost:3000'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true,
      maxAge: 3600
    }
  },
  database: {
    url: process.env.TEST_DATABASE_URL || 'mongodb://localhost:27017/chatbot-test',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false
    }
  },
  jwt: {
    secret: 'test-jwt-secret',
    expiresIn: '1h',
    refreshExpiresIn: '7d'
  },
  storage: {
    baseDir: 'storage',
    tempDir: 'storage/temp',
    dataDir: 'storage/data',
    cacheDir: 'storage/cache',
    modelDir: 'storage/models'
  }
}
