/**
 * @fileoverview API Key Manager for secure credential handling.
 * 
 * This module provides secure storage and retrieval of API keys and other
 * sensitive credentials needed for AI service integration.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

/**
 * API Key Manager for secure credential handling
 */
class APIKeyManager {
  /**
   * Creates a new APIKeyManager instance
   * 
   * @param {Object} options - Configuration options
   * @param {string} options.configPath - Path to the config file (default: ~/.test-automation/credentials.json)
   * @param {string} options.encryptionKey - Key used for encryption (default: environment variable)
   */
  constructor(options = {}) {
    this.configPath = options.configPath || path.join(os.homedir(), '.test-automation', 'credentials.json');
    
    // Get encryption key from options or environment variable
    // In production, this should come from a secure environment variable
    this.encryptionKey = options.encryptionKey || process.env.TEST_AUTOMATION_ENCRYPTION_KEY;
    
    // If no encryption key is provided, generate a warning
    if (!this.encryptionKey) {
      console.warn('No encryption key provided. Using a default key for development only.');
      // Default key for development only - NOT SECURE FOR PRODUCTION
      this.encryptionKey = 'dev-only-insecure-key-change-in-production';
    }
    
    // Ensure the config directory exists
    this._ensureConfigDirectoryExists();
    
    // Cache for credentials
    this.credentialsCache = null;
  }
  
  /**
   * Gets an API key for a specific service
   * 
   * @param {string} serviceName - Name of the service (e.g., 'openai')
   * @returns {string|null} - API key or null if not found
   */
  getAPIKey(serviceName) {
    const credentials = this._loadCredentials();
    const serviceCredentials = credentials[serviceName];
    
    if (!serviceCredentials || !serviceCredentials.apiKey) {
      return null;
    }
    
    return this._decrypt(serviceCredentials.apiKey);
  }
  
  /**
   * Sets an API key for a specific service
   * 
   * @param {string} serviceName - Name of the service (e.g., 'openai')
   * @param {string} apiKey - API key to store
   * @returns {boolean} - True if successful
   */
  setAPIKey(serviceName, apiKey) {
    if (!serviceName || !apiKey) {
      throw new Error('Service name and API key are required');
    }
    
    const credentials = this._loadCredentials();
    
    // Initialize service credentials if they don't exist
    if (!credentials[serviceName]) {
      credentials[serviceName] = {};
    }
    
    // Encrypt and store the API key
    credentials[serviceName].apiKey = this._encrypt(apiKey);
    credentials[serviceName].updatedAt = new Date().toISOString();
    
    return this._saveCredentials(credentials);
  }
  
  /**
   * Gets all credentials for a specific service
   * 
   * @param {string} serviceName - Name of the service (e.g., 'openai')
   * @returns {Object|null} - Service credentials or null if not found
   */
  getServiceCredentials(serviceName) {
    const credentials = this._loadCredentials();
    const serviceCredentials = credentials[serviceName];
    
    if (!serviceCredentials) {
      return null;
    }
    
    // Create a copy of the credentials
    const result = { ...serviceCredentials };
    
    // Decrypt sensitive fields
    if (result.apiKey) {
      result.apiKey = this._decrypt(result.apiKey);
    }
    
    return result;
  }
  
  /**
   * Sets credentials for a specific service
   * 
   * @param {string} serviceName - Name of the service (e.g., 'openai')
   * @param {Object} serviceCredentials - Credentials to store
   * @returns {boolean} - True if successful
   */
  setServiceCredentials(serviceName, serviceCredentials) {
    if (!serviceName || !serviceCredentials) {
      throw new Error('Service name and credentials are required');
    }
    
    const credentials = this._loadCredentials();
    
    // Create a copy of the credentials
    const encryptedCredentials = { ...serviceCredentials };
    
    // Encrypt sensitive fields
    if (encryptedCredentials.apiKey) {
      encryptedCredentials.apiKey = this._encrypt(encryptedCredentials.apiKey);
    }
    
    // Add metadata
    encryptedCredentials.updatedAt = new Date().toISOString();
    
    // Store the credentials
    credentials[serviceName] = encryptedCredentials;
    
    return this._saveCredentials(credentials);
  }
  
  /**
   * Removes credentials for a specific service
   * 
   * @param {string} serviceName - Name of the service (e.g., 'openai')
   * @returns {boolean} - True if successful
   */
  removeServiceCredentials(serviceName) {
    if (!serviceName) {
      throw new Error('Service name is required');
    }
    
    const credentials = this._loadCredentials();
    
    if (!credentials[serviceName]) {
      return false; // Nothing to remove
    }
    
    delete credentials[serviceName];
    
    return this._saveCredentials(credentials);
  }
  
  /**
   * Lists all available services
   * 
   * @returns {Array<string>} - Array of service names
   */
  listServices() {
    const credentials = this._loadCredentials();
    return Object.keys(credentials);
  }
  
  /**
   * Validates credentials for a specific service
   * 
   * @param {string} serviceName - Name of the service (e.g., 'openai')
   * @returns {boolean} - True if credentials exist and are valid
   */
  hasValidCredentials(serviceName) {
    const apiKey = this.getAPIKey(serviceName);
    return !!apiKey && apiKey.length > 0;
  }
  
  /**
   * Loads credentials from the config file
   * 
   * @returns {Object} - Credentials object
   * @private
   */
  _loadCredentials() {
    // Return cached credentials if available
    if (this.credentialsCache) {
      return this.credentialsCache;
    }
    
    try {
      // Check if the config file exists
      if (!fs.existsSync(this.configPath)) {
        return {};
      }
      
      // Read and parse the config file
      const fileContent = fs.readFileSync(this.configPath, 'utf8');
      const credentials = JSON.parse(fileContent);
      
      // Cache the credentials
      this.credentialsCache = credentials;
      
      return credentials;
    } catch (error) {
      console.error(`Failed to load credentials: ${error.message}`);
      return {};
    }
  }
  
  /**
   * Saves credentials to the config file
   * 
   * @param {Object} credentials - Credentials object
   * @returns {boolean} - True if successful
   * @private
   */
  _saveCredentials(credentials) {
    try {
      // Ensure the config directory exists
      this._ensureConfigDirectoryExists();
      
      // Write the credentials to the config file
      fs.writeFileSync(
        this.configPath,
        JSON.stringify(credentials, null, 2),
        'utf8'
      );
      
      // Update the cache
      this.credentialsCache = credentials;
      
      return true;
    } catch (error) {
      console.error(`Failed to save credentials: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Ensures the config directory exists
   * 
   * @private
   */
  _ensureConfigDirectoryExists() {
    const configDir = path.dirname(this.configPath);
    
    if (!fs.existsSync(configDir)) {
      try {
        fs.mkdirSync(configDir, { recursive: true });
      } catch (error) {
        console.error(`Failed to create config directory: ${error.message}`);
      }
    }
  }
  
  /**
   * Encrypts a string
   * 
   * @param {string} text - Text to encrypt
   * @returns {string} - Encrypted text
   * @private
   */
  _encrypt(text) {
    if (!text) return '';
    
    try {
      // Generate a random initialization vector
      const iv = crypto.randomBytes(16);
      
      // Create a cipher using the encryption key and IV
      const key = crypto.createHash('sha256').update(String(this.encryptionKey)).digest().slice(0, 32);
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      
      // Encrypt the text
      let encrypted = cipher.update(String(text), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Return the IV and encrypted text
      return `${iv.toString('hex')}:${encrypted}`;
    } catch (error) {
      console.error(`Encryption failed: ${error.message}`);
      return String(text); // Return the original text on failure
    }
  }
  
  /**
   * Decrypts a string
   * 
   * @param {string} encryptedText - Text to decrypt
   * @returns {string} - Decrypted text
   * @private
   */
  _decrypt(encryptedText) {
    if (!encryptedText) return '';
    
    try {
      // Split the IV and encrypted text
      const [ivHex, encrypted] = String(encryptedText).split(':');
      
      // If the format is invalid, return the original text
      if (!ivHex || !encrypted) {
        return String(encryptedText);
      }
      
      // Convert the IV from hex to bytes
      const iv = Buffer.from(ivHex, 'hex');
      
      // Create a decipher using the encryption key and IV
      const key = crypto.createHash('sha256').update(String(this.encryptionKey)).digest().slice(0, 32);
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      
      // Decrypt the text
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error(`Decryption failed: ${error.message}`);
      return String(encryptedText); // Return the original text on failure
    }
  }
}

module.exports = { APIKeyManager };
