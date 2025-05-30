/**
 * Data Protection Service
 * 
 * This service provides advanced data protection features for the chatbot platform,
 * including encryption, data masking, and secure storage.
 */

// Use mock utilities for testing
const { logger, generateUuid } = require('../../utils/mock-utils');
const crypto = require('crypto');

/**
 * Data Protection Service class
 */
class DataProtectionService {
  /**
   * Initialize the data protection service
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      encryptionAlgorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm',
      hashAlgorithm: process.env.HASH_ALGORITHM || 'sha256',
      defaultMaskingPattern: process.env.DEFAULT_MASKING_PATTERN || 'XXXX-XXXX-XXXX-$4',
      ...options
    };

    // In a real implementation, these would be securely stored and managed
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'a-very-secure-32-byte-encryption-key';
    this.encryptionIV = process.env.ENCRYPTION_IV || 'a-16-byte-secure-iv';

    // Storage for sensitive data types and masking rules
    this.sensitiveDataTypes = new Map();
    this.maskingRules = new Map();
    this.encryptedData = new Map();

    // Initialize default sensitive data types and masking rules
    this._initializeDefaults();

    logger.info('Data Protection Service initialized with options:', {
      encryptionAlgorithm: this.options.encryptionAlgorithm,
      hashAlgorithm: this.options.hashAlgorithm
    });
  }

  /**
   * Encrypt sensitive data
   * @param {string} data - Data to encrypt
   * @param {Object} options - Encryption options
   * @returns {Object} - Encryption result
   */
  encrypt(data, options = {}) {
    try {
      if (!data) {
        throw new Error('Data to encrypt is required');
      }

      const { purpose, metadata } = options;

      // Generate a unique ID for the encrypted data
      const dataId = generateUuid();

      // In a real implementation, use a secure encryption library
      // This is a simplified version for demonstration purposes
      const cipher = crypto.createCipheriv(
        this.options.encryptionAlgorithm, 
        Buffer.from(this.encryptionKey), 
        Buffer.from(this.encryptionIV)
      );
      
      let encryptedData = cipher.update(data, 'utf8', 'hex');
      encryptedData += cipher.final('hex');
      const authTag = cipher.getAuthTag().toString('hex');

      // Store encrypted data with metadata
      this.encryptedData.set(dataId, {
        id: dataId,
        encryptedData,
        authTag,
        algorithm: this.options.encryptionAlgorithm,
        purpose: purpose || 'general',
        metadata: metadata || {},
        createdAt: new Date().toISOString()
      });

      logger.info(`Encrypted data with ID: ${dataId}`, { purpose });
      return { 
        success: true, 
        dataId,
        encryptedData
      };
    } catch (error) {
      logger.error('Error encrypting data:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Decrypt data
   * @param {string} dataId - ID of the encrypted data
   * @returns {Object} - Decryption result
   */
  decrypt(dataId) {
    try {
      if (!dataId) {
        throw new Error('Data ID is required');
      }

      const encryptedDataObj = this.encryptedData.get(dataId);
      if (!encryptedDataObj) {
        throw new Error(`Encrypted data with ID ${dataId} not found`);
      }

      // In a real implementation, use a secure decryption library
      // This is a simplified version for demonstration purposes
      const decipher = crypto.createDecipheriv(
        encryptedDataObj.algorithm,
        Buffer.from(this.encryptionKey),
        Buffer.from(this.encryptionIV)
      );
      
      decipher.setAuthTag(Buffer.from(encryptedDataObj.authTag, 'hex'));
      
      let decryptedData = decipher.update(encryptedDataObj.encryptedData, 'hex', 'utf8');
      decryptedData += decipher.final('utf8');

      logger.info(`Decrypted data with ID: ${dataId}`);
      return { 
        success: true, 
        data: decryptedData,
        metadata: encryptedDataObj.metadata
      };
    } catch (error) {
      logger.error('Error decrypting data:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Hash data (one-way)
   * @param {string} data - Data to hash
   * @param {Object} options - Hashing options
   * @returns {Object} - Hashing result
   */
  hash(data, options = {}) {
    try {
      if (!data) {
        throw new Error('Data to hash is required');
      }

      const { salt, algorithm } = options;
      const hashAlgorithm = algorithm || this.options.hashAlgorithm;

      // In a real implementation, use a proper password hashing library like bcrypt
      // This is a simplified version for demonstration purposes
      let hashData = data;
      
      if (salt) {
        hashData = salt + data;
      }
      
      const hashedData = crypto.createHash(hashAlgorithm).update(hashData).digest('hex');

      logger.info(`Hashed data using algorithm: ${hashAlgorithm}`);
      return { 
        success: true, 
        hashedData,
        algorithm: hashAlgorithm
      };
    } catch (error) {
      logger.error('Error hashing data:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Register a sensitive data type
   * @param {Object} dataTypeInfo - Sensitive data type information
   * @returns {Object} - Registration result
   */
  registerSensitiveDataType(dataTypeInfo) {
    try {
      const { name, description, pattern, maskingRule } = dataTypeInfo;

      if (!name) {
        throw new Error('Data type name is required');
      }

      if (!pattern) {
        throw new Error('Data type pattern is required');
      }

      // Check if data type already exists
      if (this.sensitiveDataTypes.has(name)) {
        throw new Error(`Sensitive data type '${name}' already exists`);
      }

      // Create data type object
      const dataType = {
        name,
        description: description || '',
        pattern,
        maskingRule: maskingRule || 'default',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store data type
      this.sensitiveDataTypes.set(name, dataType);

      logger.info(`Registered sensitive data type: ${name}`);
      return { success: true, dataType };
    } catch (error) {
      logger.error('Error registering sensitive data type:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a masking rule
   * @param {Object} ruleInfo - Masking rule information
   * @returns {Object} - Creation result
   */
  createMaskingRule(ruleInfo) {
    try {
      const { name, description, pattern, preserveLength } = ruleInfo;

      if (!name) {
        throw new Error('Masking rule name is required');
      }

      if (!pattern) {
        throw new Error('Masking pattern is required');
      }

      // Check if rule already exists
      if (this.maskingRules.has(name)) {
        throw new Error(`Masking rule '${name}' already exists`);
      }

      // Create rule object
      const rule = {
        name,
        description: description || '',
        pattern,
        preserveLength: preserveLength !== undefined ? preserveLength : true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store rule
      this.maskingRules.set(name, rule);

      logger.info(`Created masking rule: ${name}`);
      return { success: true, rule };
    } catch (error) {
      logger.error('Error creating masking rule:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mask sensitive data
   * @param {string} data - Data to mask
   * @param {string} dataType - Type of sensitive data
   * @returns {Object} - Masking result
   */
  maskData(data, dataType) {
    try {
      if (!data) {
        throw new Error('Data to mask is required');
      }

      if (!dataType) {
        throw new Error('Data type is required');
      }

      // Get data type info
      const dataTypeInfo = this.sensitiveDataTypes.get(dataType);
      if (!dataTypeInfo) {
        throw new Error(`Sensitive data type '${dataType}' not found`);
      }

      // Get masking rule
      const ruleName = dataTypeInfo.maskingRule;
      const rule = this.maskingRules.get(ruleName);
      
      if (!rule) {
        throw new Error(`Masking rule '${ruleName}' not found`);
      }

      // Apply masking pattern
      let maskedData = data;
      
      if (rule.name === 'default') {
        // Default masking: replace all but last 4 characters with X
        const pattern = this.options.defaultMaskingPattern;
        if (pattern.includes('$')) {
          const preserveCount = parseInt(pattern.match(/\$(\d+)/)[1]);
          const prefix = pattern.split('$')[0];
          maskedData = prefix + data.slice(-preserveCount);
        } else {
          maskedData = pattern;
        }
      } else if (rule.name === 'email') {
        // Email masking: mask username portion
        const [username, domain] = data.split('@');
        if (username && domain) {
          const firstChar = username.charAt(0);
          const maskedUsername = firstChar + 'x'.repeat(username.length - 1);
          maskedData = `${maskedUsername}@${domain}`;
        }
      } else if (rule.name === 'phone') {
        // Phone masking: keep last 4 digits
        maskedData = 'XXX-XXX-' + data.slice(-4);
      } else if (rule.name === 'name') {
        // Name masking: keep first initial
        const parts = data.split(' ');
        maskedData = parts.map(part => part.charAt(0) + 'x'.repeat(part.length - 1)).join(' ');
      } else {
        // Custom pattern
        maskedData = rule.pattern;
      }

      logger.info(`Masked ${dataType} data`);
      return { 
        success: true, 
        maskedData,
        dataType,
        ruleName
      };
    } catch (error) {
      logger.error('Error masking data:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Scan text for sensitive data
   * @param {string} text - Text to scan
   * @returns {Object} - Scan result
   */
  scanForSensitiveData(text) {
    try {
      if (!text) {
        throw new Error('Text to scan is required');
      }

      const findings = [];

      // Scan for each sensitive data type
      for (const [name, dataType] of this.sensitiveDataTypes.entries()) {
        try {
          const regex = new RegExp(dataType.pattern, 'g');
          const matches = text.match(regex);
          
          if (matches && matches.length > 0) {
            findings.push({
              dataType: name,
              count: matches.length,
              samples: matches.slice(0, 3).map(match => this.maskData(match, name).maskedData)
            });
          }
        } catch (regexError) {
          logger.warn(`Error with regex pattern for data type ${name}:`, regexError.message);
        }
      }

      logger.info(`Scanned text for sensitive data, found ${findings.length} types`);
      return { 
        success: true, 
        findings,
        hasSensitiveData: findings.length > 0
      };
    } catch (error) {
      logger.error('Error scanning for sensitive data:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Redact sensitive data from text
   * @param {string} text - Text to redact
   * @returns {Object} - Redaction result
   */
  redactSensitiveData(text) {
    try {
      if (!text) {
        throw new Error('Text to redact is required');
      }

      let redactedText = text;
      const redactions = [];

      // Redact each sensitive data type
      for (const [name, dataType] of this.sensitiveDataTypes.entries()) {
        try {
          const regex = new RegExp(dataType.pattern, 'g');
          const matches = text.match(regex);
          
          if (matches && matches.length > 0) {
            for (const match of matches) {
              const maskResult = this.maskData(match, name);
              if (maskResult.success) {
                redactedText = redactedText.replace(match, maskResult.maskedData);
                redactions.push({
                  dataType: name,
                  original: match,
                  masked: maskResult.maskedData
                });
              }
            }
          }
        } catch (regexError) {
          logger.warn(`Error with regex pattern for data type ${name}:`, regexError.message);
        }
      }

      logger.info(`Redacted sensitive data from text, made ${redactions.length} redactions`);
      return { 
        success: true, 
        redactedText,
        redactions,
        hasRedactions: redactions.length > 0
      };
    } catch (error) {
      logger.error('Error redacting sensitive data:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Initialize default sensitive data types and masking rules
   * @private
   */
  _initializeDefaults() {
    // Create default masking rules
    this.maskingRules.set('default', {
      name: 'default',
      description: 'Default masking rule that preserves last 4 characters',
      pattern: 'XXXX-XXXX-XXXX-$4',
      preserveLength: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    this.maskingRules.set('email', {
      name: 'email',
      description: 'Email masking rule that preserves domain and first character',
      pattern: 'special:email',
      preserveLength: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    this.maskingRules.set('phone', {
      name: 'phone',
      description: 'Phone masking rule that preserves last 4 digits',
      pattern: 'XXX-XXX-$4',
      preserveLength: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    this.maskingRules.set('name', {
      name: 'name',
      description: 'Name masking rule that preserves first initial',
      pattern: 'special:name',
      preserveLength: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Create default sensitive data types
    this.sensitiveDataTypes.set('creditCard', {
      name: 'creditCard',
      description: 'Credit card numbers',
      pattern: '\\b(?:\\d{4}[- ]?){3}\\d{4}\\b',
      maskingRule: 'default',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    this.sensitiveDataTypes.set('email', {
      name: 'email',
      description: 'Email addresses',
      pattern: '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b',
      maskingRule: 'email',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    this.sensitiveDataTypes.set('phone', {
      name: 'phone',
      description: 'Phone numbers',
      pattern: '\\b\\(?\\d{3}\\)?[-. ]?\\d{3}[-. ]?\\d{4}\\b',
      maskingRule: 'phone',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    this.sensitiveDataTypes.set('ssn', {
      name: 'ssn',
      description: 'Social Security Numbers',
      pattern: '\\b\\d{3}-\\d{2}-\\d{4}\\b',
      maskingRule: 'default',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    logger.info('Initialized default sensitive data types and masking rules');
  }
}

module.exports = { dataProtectionService: new DataProtectionService() };
