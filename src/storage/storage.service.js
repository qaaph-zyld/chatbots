/**
 * Storage Service
 * 
 * Provides centralized storage functionality for the chatbot platform
 */

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('@src/utils');

/**
 * Storage Service class
 * Handles file storage operations for the chatbot platform
 */
class StorageService {
  /**
   * Create a new StorageService instance
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.baseDir = options.baseDir || './storage';
    this.tempDir = options.tempDir || path.join(this.baseDir, 'temp');
    this.dataDir = options.dataDir || path.join(this.baseDir, 'data');
    this.cacheDir = options.cacheDir || path.join(this.baseDir, 'cache');
    this.maxCacheSize = options.maxCacheSize || 100 * 1024 * 1024; // 100MB
    this.initialized = false;
    
    logger.debug('Storage service created', { baseDir: this.baseDir });
  }

  /**
   * Initialize the storage service
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Create base directories if they don't exist
      await this.ensureDirectoryExists(this.baseDir);
      await this.ensureDirectoryExists(this.tempDir);
      await this.ensureDirectoryExists(this.dataDir);
      await this.ensureDirectoryExists(this.cacheDir);
      
      this.initialized = true;
      logger.info('Storage service initialized', { baseDir: this.baseDir });
    } catch (error) {
      logger.error('Failed to initialize storage service', { error });
      throw error;
    }
  }

  /**
   * Ensure a directory exists, creating it if necessary
   * @param {string} dirPath - Directory path
   * @returns {Promise<void>}
   */
  async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await fs.mkdir(dirPath, { recursive: true });
        logger.debug(`Created directory: ${dirPath}`);
      } else {
        throw error;
      }
    }
  }

  /**
   * Store a file
   * @param {Buffer|string} data - File data
   * @param {string} filename - Original filename
   * @param {Object} options - Storage options
   * @returns {Promise<Object>} - Stored file info
   */
  async storeFile(data, filename, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const fileId = options.fileId || uuidv4();
    const category = options.category || 'general';
    const extension = path.extname(filename);
    const storageFilename = `${fileId}${extension}`;
    
    // Create category directory if needed
    const categoryDir = path.join(this.dataDir, category);
    await this.ensureDirectoryExists(categoryDir);
    
    // Store the file
    const filePath = path.join(categoryDir, storageFilename);
    await fs.writeFile(filePath, data);
    
    const fileInfo = {
      id: fileId,
      originalName: filename,
      path: filePath,
      category,
      size: Buffer.isBuffer(data) ? data.length : Buffer.from(data).length,
      extension,
      createdAt: new Date(),
      metadata: options.metadata || {}
    };
    
    logger.debug('File stored', { fileId, category, size: fileInfo.size });
    return fileInfo;
  }

  /**
   * Retrieve a file
   * @param {string} fileId - File ID
   * @param {string} category - File category
   * @returns {Promise<Object>} - Retrieved file data and info
   */
  async retrieveFile(fileId, category = 'general') {
    if (!this.initialized) {
      await this.initialize();
    }

    const categoryDir = path.join(this.dataDir, category);
    
    // Find the file in the category directory
    const files = await fs.readdir(categoryDir);
    const filePattern = new RegExp(`^${fileId}\\.[^.]+$`);
    const matchingFile = files.find(file => filePattern.test(file));
    
    if (!matchingFile) {
      logger.warn('File not found', { fileId, category });
      throw new Error(`File not found: ${fileId}`);
    }
    
    const filePath = path.join(categoryDir, matchingFile);
    const data = await fs.readFile(filePath);
    
    const fileInfo = {
      id: fileId,
      originalName: matchingFile,
      path: filePath,
      category,
      size: data.length,
      extension: path.extname(matchingFile),
      accessedAt: new Date()
    };
    
    logger.debug('File retrieved', { fileId, category, size: fileInfo.size });
    return { data, info: fileInfo };
  }

  /**
   * Delete a file
   * @param {string} fileId - File ID
   * @param {string} category - File category
   * @returns {Promise<boolean>} - True if file was deleted
   */
  async deleteFile(fileId, category = 'general') {
    if (!this.initialized) {
      await this.initialize();
    }

    const categoryDir = path.join(this.dataDir, category);
    
    // Find the file in the category directory
    const files = await fs.readdir(categoryDir);
    const filePattern = new RegExp(`^${fileId}\\.[^.]+$`);
    const matchingFile = files.find(file => filePattern.test(file));
    
    if (!matchingFile) {
      logger.warn('File not found for deletion', { fileId, category });
      return false;
    }
    
    const filePath = path.join(categoryDir, matchingFile);
    await fs.unlink(filePath);
    
    logger.debug('File deleted', { fileId, category });
    return true;
  }

  /**
   * List files in a category
   * @param {string} category - File category
   * @returns {Promise<Array>} - List of file info objects
   */
  async listFiles(category = 'general') {
    if (!this.initialized) {
      await this.initialize();
    }

    const categoryDir = path.join(this.dataDir, category);
    
    try {
      await this.ensureDirectoryExists(categoryDir);
      const files = await fs.readdir(categoryDir);
      
      const fileInfos = await Promise.all(files.map(async (file) => {
        const filePath = path.join(categoryDir, file);
        const stats = await fs.stat(filePath);
        const fileId = path.basename(file, path.extname(file));
        
        return {
          id: fileId,
          originalName: file,
          path: filePath,
          category,
          size: stats.size,
          extension: path.extname(file),
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime
        };
      }));
      
      logger.debug('Files listed', { category, count: fileInfos.length });
      return fileInfos;
    } catch (error) {
      logger.error('Error listing files', { category, error });
      throw error;
    }
  }

  /**
   * Create a temporary file
   * @param {Buffer|string} data - File data
   * @param {string} extension - File extension
   * @returns {Promise<Object>} - Temporary file info
   */
  async createTempFile(data, extension = '') {
    if (!this.initialized) {
      await this.initialize();
    }

    const fileId = uuidv4();
    const filename = `${fileId}${extension ? `.${extension}` : ''}`;
    const filePath = path.join(this.tempDir, filename);
    
    await fs.writeFile(filePath, data);
    
    const fileInfo = {
      id: fileId,
      path: filePath,
      size: Buffer.isBuffer(data) ? data.length : Buffer.from(data).length,
      extension,
      createdAt: new Date()
    };
    
    logger.debug('Temporary file created', { fileId, size: fileInfo.size });
    return fileInfo;
  }

  /**
   * Clean up temporary files older than the specified age
   * @param {number} maxAgeMs - Maximum age in milliseconds
   * @returns {Promise<number>} - Number of files deleted
   */
  async cleanupTempFiles(maxAgeMs = 24 * 60 * 60 * 1000) { // Default: 24 hours
    if (!this.initialized) {
      await this.initialize();
    }

    const files = await fs.readdir(this.tempDir);
    const now = Date.now();
    let deletedCount = 0;
    
    await Promise.all(files.map(async (file) => {
      const filePath = path.join(this.tempDir, file);
      const stats = await fs.stat(filePath);
      const fileAge = now - stats.mtime.getTime();
      
      if (fileAge > maxAgeMs) {
        await fs.unlink(filePath);
        deletedCount++;
      }
    }));
    
    logger.debug('Temporary files cleaned up', { deletedCount });
    return deletedCount;
  }
}

// Create a singleton instance
const storageService = new StorageService();

module.exports = {
  StorageService,
  storageService
};
