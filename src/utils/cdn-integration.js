/**
 * CDN Integration Utility
 * 
 * This module provides functionality to integrate with content delivery networks (CDNs)
 * for improved delivery of static assets such as images, JavaScript, CSS, and other files.
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { promisify } = require('util');
const zlib = require('zlib');

// Promisify fs functions
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);
const mkdir = promisify(fs.mkdir);

class CDNIntegration {
  /**
   * Create a new CDN integration utility
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      provider: options.provider || 'custom', // 'cloudflare', 'aws', 'azure', 'custom'
      cdnUrl: options.cdnUrl || '',
      publicPath: options.publicPath || '/public',
      assetPath: options.assetPath || path.join(process.cwd(), 'public'),
      manifestPath: options.manifestPath || path.join(process.cwd(), 'public', 'cdn-manifest.json'),
      hashLength: options.hashLength || 8,
      hashAlgorithm: options.hashAlgorithm || 'md5',
      compressAssets: options.compressAssets !== false,
      uploadAssets: options.uploadAssets !== false,
      uploadConcurrency: options.uploadConcurrency || 5,
      logger: options.logger || console,
      credentials: options.credentials || {},
      ...options
    };
    
    // Initialize provider-specific client
    this.client = this._initializeClient();
    
    // Cache for manifest
    this.manifest = null;
  }

  /**
   * Initialize the CDN provider client
   * @private
   * @returns {Object} Provider client
   */
  _initializeClient() {
    switch (this.options.provider) {
      case 'aws':
        return this._initializeAwsClient();
      
      case 'azure':
        return this._initializeAzureClient();
      
      case 'cloudflare':
        return this._initializeCloudflareClient();
      
      case 'custom':
      default:
        return this._initializeCustomClient();
    }
  }

  /**
   * Initialize AWS S3 client
   * @private
   * @returns {Object} AWS S3 client
   */
  _initializeAwsClient() {
    try {
      const AWS = require('aws-sdk');
      
      const credentials = this.options.credentials;
      
      if (!credentials.accessKeyId || !credentials.secretAccessKey) {
        throw new Error('AWS credentials are required');
      }
      
      return new AWS.S3({
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        region: credentials.region || 'us-east-1'
      });
    } catch (err) {
      this.options.logger.warn('Failed to initialize AWS S3 client:', err.message);
      this.options.logger.warn('Falling back to custom client');
      
      return this._initializeCustomClient();
    }
  }

  /**
   * Initialize Azure Blob Storage client
   * @private
   * @returns {Object} Azure Blob Storage client
   */
  _initializeAzureClient() {
    try {
      const { BlobServiceClient } = require('@azure/storage-blob');
      
      const credentials = this.options.credentials;
      
      if (!credentials.connectionString && !credentials.accountName) {
        throw new Error('Azure credentials are required');
      }
      
      if (credentials.connectionString) {
        return BlobServiceClient.fromConnectionString(credentials.connectionString);
      } else {
        const { DefaultAzureCredential } = require('@azure/identity');
        return new BlobServiceClient(
          `https://${credentials.accountName}.blob.core.windows.net`,
          new DefaultAzureCredential()
        );
      }
    } catch (err) {
      this.options.logger.warn('Failed to initialize Azure Blob Storage client:', err.message);
      this.options.logger.warn('Falling back to custom client');
      
      return this._initializeCustomClient();
    }
  }

  /**
   * Initialize Cloudflare R2 client
   * @private
   * @returns {Object} Cloudflare R2 client
   */
  _initializeCloudflareClient() {
    try {
      const AWS = require('aws-sdk');
      
      const credentials = this.options.credentials;
      
      if (!credentials.accessKeyId || !credentials.secretAccessKey || !credentials.endpoint) {
        throw new Error('Cloudflare R2 credentials are required');
      }
      
      return new AWS.S3({
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        endpoint: credentials.endpoint,
        signatureVersion: 'v4',
        region: 'auto'
      });
    } catch (err) {
      this.options.logger.warn('Failed to initialize Cloudflare R2 client:', err.message);
      this.options.logger.warn('Falling back to custom client');
      
      return this._initializeCustomClient();
    }
  }

  /**
   * Initialize custom client
   * @private
   * @returns {Object} Custom client
   */
  _initializeCustomClient() {
    return {
      provider: 'custom',
      upload: async (key, content, contentType) => {
        // For custom client, we just copy the file to the asset path
        const destPath = path.join(this.options.assetPath, key);
        const destDir = path.dirname(destPath);
        
        // Create directory if it doesn't exist
        await mkdir(destDir, { recursive: true });
        
        // Write file
        await writeFile(destPath, content);
        
        return {
          key,
          url: path.join(this.options.publicPath, key),
          size: content.length
        };
      }
    };
  }

  /**
   * Get the CDN URL for an asset
   * @param {string} assetPath - Asset path
   * @returns {Promise<string>} CDN URL
   */
  async getAssetUrl(assetPath) {
    // Load manifest if not loaded
    if (!this.manifest) {
      await this.loadManifest();
    }
    
    // Check if asset is in manifest
    if (this.manifest[assetPath]) {
      return this.manifest[assetPath].cdnUrl;
    }
    
    // Return default URL
    return path.join(this.options.publicPath, assetPath);
  }

  /**
   * Process and upload an asset to the CDN
   * @param {string} filePath - File path
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Processed asset info
   */
  async processAsset(filePath, options = {}) {
    const relativePath = path.relative(this.options.assetPath, filePath);
    
    // Read file
    const content = await readFile(filePath);
    
    // Get file info
    const fileInfo = await this._getFileInfo(filePath);
    
    // Generate hash
    const hash = this._generateHash(content);
    
    // Get file extension
    const ext = path.extname(filePath);
    
    // Generate hashed filename
    const hashedFilename = this._generateHashedFilename(relativePath, hash);
    
    // Determine content type
    const contentType = this._getContentType(ext);
    
    // Compress if needed
    let processedContent = content;
    let compressionType = null;
    
    if (this.options.compressAssets && this._shouldCompress(ext)) {
      const compressed = await this._compressContent(content);
      
      if (compressed.content.length < content.length) {
        processedContent = compressed.content;
        compressionType = compressed.type;
      }
    }
    
    // Upload to CDN if enabled
    let uploadResult = null;
    
    if (this.options.uploadAssets) {
      uploadResult = await this._uploadToCdn(hashedFilename, processedContent, contentType, compressionType);
    }
    
    // Create asset info
    const assetInfo = {
      originalPath: relativePath,
      hashedPath: hashedFilename,
      cdnUrl: uploadResult ? uploadResult.url : path.join(this.options.publicPath, hashedFilename),
      hash,
      size: fileInfo.size,
      contentType,
      compression: compressionType,
      uploaded: !!uploadResult
    };
    
    return assetInfo;
  }

  /**
   * Process multiple assets
   * @param {Array<string>} filePaths - File paths
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Processed assets info
   */
  async processAssets(filePaths, options = {}) {
    const results = {};
    const errors = [];
    
    // Process assets with concurrency limit
    const concurrency = this.options.uploadConcurrency;
    
    for (let i = 0; i < filePaths.length; i += concurrency) {
      const batch = filePaths.slice(i, i + concurrency);
      
      const batchPromises = batch.map(filePath => 
        this.processAsset(filePath, options)
          .then(result => {
            const relativePath = path.relative(this.options.assetPath, filePath);
            results[relativePath] = result;
          })
          .catch(err => {
            const relativePath = path.relative(this.options.assetPath, filePath);
            errors.push({
              path: relativePath,
              error: err.message
            });
          })
      );
      
      await Promise.all(batchPromises);
    }
    
    // Update manifest
    await this.updateManifest(results);
    
    return {
      assets: results,
      errors
    };
  }

  /**
   * Load the CDN manifest
   * @returns {Promise<Object>} Manifest
   */
  async loadManifest() {
    try {
      const content = await readFile(this.options.manifestPath, 'utf8');
      this.manifest = JSON.parse(content);
    } catch (err) {
      this.options.logger.info('CDN manifest not found, creating new one');
      this.manifest = {};
    }
    
    return this.manifest;
  }

  /**
   * Update the CDN manifest
   * @param {Object} assets - Assets to add to the manifest
   * @returns {Promise<Object>} Updated manifest
   */
  async updateManifest(assets) {
    // Load manifest if not loaded
    if (!this.manifest) {
      await this.loadManifest();
    }
    
    // Update manifest
    for (const [path, info] of Object.entries(assets)) {
      this.manifest[path] = info;
    }
    
    // Create directory if it doesn't exist
    const manifestDir = path.dirname(this.options.manifestPath);
    await mkdir(manifestDir, { recursive: true });
    
    // Write manifest
    await writeFile(
      this.options.manifestPath,
      JSON.stringify(this.manifest, null, 2),
      'utf8'
    );
    
    return this.manifest;
  }

  /**
   * Get file information
   * @private
   * @param {string} filePath - File path
   * @returns {Promise<Object>} File info
   */
  async _getFileInfo(filePath) {
    const stats = await stat(filePath);
    
    return {
      size: stats.size,
      mtime: stats.mtime
    };
  }

  /**
   * Generate a hash for a file
   * @private
   * @param {Buffer} content - File content
   * @returns {string} Hash
   */
  _generateHash(content) {
    const hash = crypto.createHash(this.options.hashAlgorithm);
    hash.update(content);
    return hash.digest('hex').substring(0, this.options.hashLength);
  }

  /**
   * Generate a hashed filename
   * @private
   * @param {string} filePath - File path
   * @param {string} hash - File hash
   * @returns {string} Hashed filename
   */
  _generateHashedFilename(filePath, hash) {
    const parsedPath = path.parse(filePath);
    return path.join(
      parsedPath.dir,
      `${parsedPath.name}.${hash}${parsedPath.ext}`
    );
  }

  /**
   * Get content type for a file extension
   * @private
   * @param {string} ext - File extension
   * @returns {string} Content type
   */
  _getContentType(ext) {
    const contentTypes = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.avif': 'image/avif',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.otf': 'font/otf',
      '.eot': 'application/vnd.ms-fontobject',
      '.ico': 'image/x-icon',
      '.txt': 'text/plain',
      '.pdf': 'application/pdf',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav'
    };
    
    return contentTypes[ext.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Check if a file should be compressed
   * @private
   * @param {string} ext - File extension
   * @returns {boolean} Whether the file should be compressed
   */
  _shouldCompress(ext) {
    const compressibleTypes = [
      '.html', '.css', '.js', '.json', '.svg', '.txt', '.xml'
    ];
    
    return compressibleTypes.includes(ext.toLowerCase());
  }

  /**
   * Compress content
   * @private
   * @param {Buffer} content - Content to compress
   * @returns {Promise<Object>} Compressed content and type
   */
  async _compressContent(content) {
    // Try Brotli first
    try {
      const brotli = promisify(zlib.brotliCompress);
      const brotliContent = await brotli(content);
      
      return {
        content: brotliContent,
        type: 'br'
      };
    } catch (err) {
      // Fallback to Gzip
      try {
        const gzip = promisify(zlib.gzip);
        const gzipContent = await gzip(content);
        
        return {
          content: gzipContent,
          type: 'gzip'
        };
      } catch (err) {
        // Return original content if compression fails
        return {
          content,
          type: null
        };
      }
    }
  }

  /**
   * Upload content to CDN
   * @private
   * @param {string} key - Asset key
   * @param {Buffer} content - Asset content
   * @param {string} contentType - Content type
   * @param {string} compressionType - Compression type
   * @returns {Promise<Object>} Upload result
   */
  async _uploadToCdn(key, content, contentType, compressionType) {
    try {
      // Set up headers
      const headers = {
        'Content-Type': contentType
      };
      
      if (compressionType) {
        headers['Content-Encoding'] = compressionType;
      }
      
      // Upload based on provider
      switch (this.options.provider) {
        case 'aws':
          return await this._uploadToAws(key, content, contentType, headers);
        
        case 'azure':
          return await this._uploadToAzure(key, content, contentType, headers);
        
        case 'cloudflare':
          return await this._uploadToCloudflare(key, content, contentType, headers);
        
        case 'custom':
        default:
          return await this.client.upload(key, content, contentType);
      }
    } catch (err) {
      this.options.logger.error(`Failed to upload ${key} to CDN:`, err);
      throw err;
    }
  }

  /**
   * Upload to AWS S3
   * @private
   * @param {string} key - Asset key
   * @param {Buffer} content - Asset content
   * @param {string} contentType - Content type
   * @param {Object} headers - Additional headers
   * @returns {Promise<Object>} Upload result
   */
  async _uploadToAws(key, content, contentType, headers) {
    const params = {
      Bucket: this.options.credentials.bucket,
      Key: key,
      Body: content,
      ContentType: contentType,
      CacheControl: 'max-age=31536000' // 1 year
    };
    
    // Add content encoding if present
    if (headers['Content-Encoding']) {
      params.ContentEncoding = headers['Content-Encoding'];
    }
    
    const result = await this.client.upload(params).promise();
    
    return {
      key,
      url: this.options.cdnUrl ? `${this.options.cdnUrl}/${key}` : result.Location,
      size: content.length
    };
  }

  /**
   * Upload to Azure Blob Storage
   * @private
   * @param {string} key - Asset key
   * @param {Buffer} content - Asset content
   * @param {string} contentType - Content type
   * @param {Object} headers - Additional headers
   * @returns {Promise<Object>} Upload result
   */
  async _uploadToAzure(key, content, contentType, headers) {
    const containerName = this.options.credentials.container || 'assets';
    const containerClient = this.client.getContainerClient(containerName);
    
    // Create container if it doesn't exist
    await containerClient.createIfNotExists();
    
    const blobClient = containerClient.getBlockBlobClient(key);
    
    const options = {
      blobHTTPHeaders: {
        blobContentType: contentType,
        blobCacheControl: 'max-age=31536000' // 1 year
      }
    };
    
    // Add content encoding if present
    if (headers['Content-Encoding']) {
      options.blobHTTPHeaders.blobContentEncoding = headers['Content-Encoding'];
    }
    
    await blobClient.upload(content, content.length, options);
    
    return {
      key,
      url: this.options.cdnUrl ? `${this.options.cdnUrl}/${key}` : blobClient.url,
      size: content.length
    };
  }

  /**
   * Upload to Cloudflare R2
   * @private
   * @param {string} key - Asset key
   * @param {Buffer} content - Asset content
   * @param {string} contentType - Content type
   * @param {Object} headers - Additional headers
   * @returns {Promise<Object>} Upload result
   */
  async _uploadToCloudflare(key, content, contentType, headers) {
    const params = {
      Bucket: this.options.credentials.bucket,
      Key: key,
      Body: content,
      ContentType: contentType,
      CacheControl: 'max-age=31536000' // 1 year
    };
    
    // Add content encoding if present
    if (headers['Content-Encoding']) {
      params.ContentEncoding = headers['Content-Encoding'];
    }
    
    await this.client.putObject(params).promise();
    
    return {
      key,
      url: `${this.options.cdnUrl}/${key}`,
      size: content.length
    };
  }
}

/**
 * Express middleware for CDN integration
 * @param {CDNIntegration} cdnIntegration - CDN integration instance
 * @param {Object} options - Middleware options
 * @returns {Function} Express middleware
 */
function cdnMiddleware(cdnIntegration, options = {}) {
  const opts = {
    manifestPath: options.manifestPath || cdnIntegration.options.manifestPath,
    publicPath: options.publicPath || cdnIntegration.options.publicPath,
    assetPath: options.assetPath || cdnIntegration.options.assetPath,
    ...options
  };
  
  let manifest = null;
  
  return async function(req, res, next) {
    // Load manifest if not loaded
    if (!manifest) {
      try {
        manifest = await cdnIntegration.loadManifest();
      } catch (err) {
        return next(err);
      }
    }
    
    // Add cdn helper to res.locals
    res.locals.cdn = {
      asset: (path) => {
        const relativePath = path.startsWith('/') ? path.substring(1) : path;
        
        if (manifest[relativePath]) {
          return manifest[relativePath].cdnUrl;
        }
        
        return `${opts.publicPath}/${relativePath}`;
      }
    };
    
    next();
  };
}

module.exports = {
  CDNIntegration,
  cdnMiddleware
};
