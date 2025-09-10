/**
 * Configuration Service
 * Centralized configuration management
 */

const path = require('path');
const fs = require('fs');

class ConfigService {
  constructor() {
    this.config = {};
    this.environment = process.env.NODE_ENV || 'development';
    this.initialize();
  }

  initialize() {
    try {
      // Load base configuration
      const baseConfigPath = path.join(__dirname, '../../../config/app.js');
      if (fs.existsSync(baseConfigPath)) {
        this.config = require(baseConfigPath);
      }

      // Load environment-specific configuration
      const envConfigPath = path.join(__dirname, `../../../config/environments/${this.environment}.js`);
      if (fs.existsSync(envConfigPath)) {
        const envConfig = require(envConfigPath);
        this.config = { ...this.config, ...envConfig };
      }

      // Override with environment variables
      this.loadEnvironmentVariables();
    } catch (error) {
      console.error('Failed to initialize configuration:', error.message);
    }
  }

  loadEnvironmentVariables() {
    // Database configuration
    if (process.env.DATABASE_URL) {
      this.config.database = this.config.database || {};
      this.config.database.url = process.env.DATABASE_URL;
    }

    // Redis configuration
    if (process.env.REDIS_URL) {
      this.config.cache = this.config.cache || {};
      this.config.cache.url = process.env.REDIS_URL;
    }

    // Port configuration
    if (process.env.PORT) {
      this.config.port = parseInt(process.env.PORT, 10);
    }

    // API keys
    if (process.env.OPENAI_API_KEY) {
      this.config.openai = this.config.openai || {};
      this.config.openai.apiKey = process.env.OPENAI_API_KEY;
    }
  }

  get(key, defaultValue = null) {
    const keys = key.split('.');
    let value = this.config;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }

    return value;
  }

  set(key, value) {
    const keys = key.split('.');
    let current = this.config;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current) || typeof current[k] !== 'object') {
        current[k] = {};
      }
      current = current[k];
    }

    current[keys[keys.length - 1]] = value;
  }

  getAll() {
    return { ...this.config };
  }

  getEnvironment() {
    return this.environment;
  }

  isDevelopment() {
    return this.environment === 'development';
  }

  isProduction() {
    return this.environment === 'production';
  }

  isTest() {
    return this.environment === 'test';
  }
}

// Export singleton instance
module.exports = new ConfigService();
