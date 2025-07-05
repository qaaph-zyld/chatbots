/**
 * Static Asset Optimizer
 * 
 * This utility provides tools for optimizing static assets like images, CSS, and fonts
 * to improve frontend performance and reduce bandwidth usage.
 */

const path = require('path');
const fs = require('fs').promises;
const { createReadStream, createWriteStream } = require('fs');
const zlib = require('zlib');
const crypto = require('crypto');
const stream = require('stream');
const { promisify } = require('util');
const pipeline = promisify(stream.pipeline);

// Optional dependencies - these will be loaded dynamically if available
let sharp;
let csso;
let terser;
let svgo;

/**
 * Try to require an optional dependency
 * @param {string} packageName - Package name to require
 * @returns {Object|null} - Package module or null if not available
 */
function tryRequire(packageName) {
  try {
    return require(packageName);
  } catch (e) {
    return null;
  }
}

class AssetOptimizer {
  /**
   * Create a new asset optimizer
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      outputDir: options.outputDir || 'dist',
      cacheDir: options.cacheDir || '.cache',
      publicPath: options.publicPath || '/assets/',
      hashLength: options.hashLength || 8,
      imageOptions: {
        quality: options.imageQuality || 80,
        webp: options.useWebp !== false,
        avif: options.useAvif || false,
        resize: options.resizeImages || false,
        sizes: options.imageSizes || [640, 1080, 1920],
        ...options.imageOptions
      },
      cssOptions: {
        minify: options.minifyCss !== false,
        autoprefixer: options.useAutoprefixer !== false,
        ...options.cssOptions
      },
      jsOptions: {
        minify: options.minifyJs !== false,
        ...options.jsOptions
      },
      svgOptions: {
        optimize: options.optimizeSvg !== false,
        ...options.svgOptions
      },
      fontOptions: {
        subset: options.subsetFonts || false,
        formats: options.fontFormats || ['woff2', 'woff'],
        ...options.fontOptions
      },
      compression: {
        gzip: options.gzip !== false,
        brotli: options.brotli || false,
        ...options.compressionOptions
      },
      ...options
    };
    
    // Initialize logger
    this.logger = options.logger || console;
    
    // Load optional dependencies
    this._loadOptionalDependencies();
  }

  /**
   * Load optional dependencies
   * @private
   */
  _loadOptionalDependencies() {
    // Image processing
    sharp = tryRequire('sharp');
    if (!sharp && this.options.imageOptions.resize) {
      this.logger.warn('sharp package not found. Image resizing will be disabled.');
      this.options.imageOptions.resize = false;
    }
    
    // CSS minification
    csso = tryRequire('csso');
    if (!csso && this.options.cssOptions.minify) {
      this.logger.warn('csso package not found. CSS minification will use basic methods.');
    }
    
    // JS minification
    terser = tryRequire('terser');
    if (!terser && this.options.jsOptions.minify) {
      this.logger.warn('terser package not found. JS minification will be disabled.');
      this.options.jsOptions.minify = false;
    }
    
    // SVG optimization
    svgo = tryRequire('svgo');
    if (!svgo && this.options.svgOptions.optimize) {
      this.logger.warn('svgo package not found. SVG optimization will be disabled.');
      this.options.svgOptions.optimize = false;
    }
  }

  /**
   * Optimize an image file
   * @param {string} filePath - Path to the image file
   * @param {Object} options - Optimization options (overrides defaults)
   * @returns {Promise<Object>} Optimization result with paths and metadata
   */
  async optimizeImage(filePath, options = {}) {
    const opts = { ...this.options.imageOptions, ...options };
    const fileExt = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath, fileExt);
    const outputDir = path.join(this.options.outputDir, 'images');
    
    // Create output directory if it doesn't exist
    await fs.mkdir(outputDir, { recursive: true });
    
    // Generate file hash for cache busting
    const fileBuffer = await fs.readFile(filePath);
    const fileHash = this._generateHash(fileBuffer).substring(0, this.options.hashLength);
    
    // Supported image formats
    const supportedFormats = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg'];
    
    if (!supportedFormats.includes(fileExt)) {
      this.logger.warn(`Unsupported image format: ${fileExt}`);
      
      // Copy the file as-is
      const outputPath = path.join(outputDir, `${fileName}.${fileHash}${fileExt}`);
      await fs.copyFile(filePath, outputPath);
      
      return {
        original: {
          path: outputPath,
          size: fileBuffer.length,
          url: `${this.options.publicPath}images/${fileName}.${fileHash}${fileExt}`
        }
      };
    }
    
    // If SVG, optimize with SVGO if available
    if (fileExt === '.svg' && this.options.svgOptions.optimize && svgo) {
      try {
        const result = await svgo.optimize(fileBuffer.toString(), {
          path: filePath,
          ...this.options.svgOptions
        });
        
        const outputPath = path.join(outputDir, `${fileName}.${fileHash}.svg`);
        await fs.writeFile(outputPath, result.data);
        
        const optimizedSize = Buffer.from(result.data).length;
        
        return {
          original: {
            path: outputPath,
            size: optimizedSize,
            saved: fileBuffer.length - optimizedSize,
            percent: ((fileBuffer.length - optimizedSize) / fileBuffer.length * 100).toFixed(2),
            url: `${this.options.publicPath}images/${fileName}.${fileHash}.svg`
          }
        };
      } catch (error) {
        this.logger.error('SVG optimization failed:', error);
        
        // Fall back to copying the file
        const outputPath = path.join(outputDir, `${fileName}.${fileHash}.svg`);
        await fs.copyFile(filePath, outputPath);
        
        return {
          original: {
            path: outputPath,
            size: fileBuffer.length,
            url: `${this.options.publicPath}images/${fileName}.${fileHash}.svg`
          }
        };
      }
    }
    
    // For other image formats, use sharp if available
    if (!sharp) {
      this.logger.warn('Image optimization skipped: sharp package not available');
      
      // Copy the file as-is
      const outputPath = path.join(outputDir, `${fileName}.${fileHash}${fileExt}`);
      await fs.copyFile(filePath, outputPath);
      
      return {
        original: {
          path: outputPath,
          size: fileBuffer.length,
          url: `${this.options.publicPath}images/${fileName}.${fileHash}${fileExt}`
        }
      };
    }
    
    try {
      const image = sharp(fileBuffer);
      const metadata = await image.metadata();
      
      const result = {
        original: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format
        },
        optimized: {},
        responsive: []
      };
      
      // Optimize original format
      const optimizedImage = await this._optimizeWithSharp(
        image, 
        metadata.format, 
        opts.quality,
        null // Don't resize
      );
      
      const optimizedPath = path.join(outputDir, `${fileName}.${fileHash}.${metadata.format}`);
      await fs.writeFile(optimizedPath, optimizedImage);
      
      result.optimized = {
        path: optimizedPath,
        size: optimizedImage.length,
        saved: fileBuffer.length - optimizedImage.length,
        percent: ((fileBuffer.length - optimizedImage.length) / fileBuffer.length * 100).toFixed(2),
        url: `${this.options.publicPath}images/${fileName}.${fileHash}.${metadata.format}`
      };
      
      // Generate WebP version if enabled
      if (opts.webp) {
        const webpImage = await this._optimizeWithSharp(
          image, 
          'webp', 
          opts.quality,
          null // Don't resize
        );
        
        const webpPath = path.join(outputDir, `${fileName}.${fileHash}.webp`);
        await fs.writeFile(webpPath, webpImage);
        
        result.webp = {
          path: webpPath,
          size: webpImage.length,
          saved: fileBuffer.length - webpImage.length,
          percent: ((fileBuffer.length - webpImage.length) / fileBuffer.length * 100).toFixed(2),
          url: `${this.options.publicPath}images/${fileName}.${fileHash}.webp`
        };
      }
      
      // Generate AVIF version if enabled
      if (opts.avif) {
        try {
          const avifImage = await this._optimizeWithSharp(
            image, 
            'avif', 
            opts.quality,
            null // Don't resize
          );
          
          const avifPath = path.join(outputDir, `${fileName}.${fileHash}.avif`);
          await fs.writeFile(avifPath, avifImage);
          
          result.avif = {
            path: avifPath,
            size: avifImage.length,
            saved: fileBuffer.length - avifImage.length,
            percent: ((fileBuffer.length - avifImage.length) / fileBuffer.length * 100).toFixed(2),
            url: `${this.options.publicPath}images/${fileName}.${fileHash}.avif`
          };
        } catch (error) {
          this.logger.warn('AVIF conversion failed:', error.message);
        }
      }
      
      // Generate responsive images if enabled
      if (opts.resize && metadata.width > Math.max(...opts.sizes)) {
        for (const size of opts.sizes) {
          if (size < metadata.width) {
            // Resize original format
            const resizedImage = await this._optimizeWithSharp(
              image, 
              metadata.format, 
              opts.quality,
              size
            );
            
            const resizedPath = path.join(outputDir, `${fileName}-${size}.${fileHash}.${metadata.format}`);
            await fs.writeFile(resizedPath, resizedImage);
            
            const responsiveResult = {
              width: size,
              path: resizedPath,
              size: resizedImage.length,
              format: metadata.format,
              url: `${this.options.publicPath}images/${fileName}-${size}.${fileHash}.${metadata.format}`
            };
            
            // Also create WebP version if enabled
            if (opts.webp) {
              const resizedWebP = await this._optimizeWithSharp(
                image, 
                'webp', 
                opts.quality,
                size
              );
              
              const webpPath = path.join(outputDir, `${fileName}-${size}.${fileHash}.webp`);
              await fs.writeFile(webpPath, resizedWebP);
              
              responsiveResult.webp = {
                path: webpPath,
                size: resizedWebP.length,
                url: `${this.options.publicPath}images/${fileName}-${size}.${fileHash}.webp`
              };
            }
            
            result.responsive.push(responsiveResult);
          }
        }
      }
      
      return result;
    } catch (error) {
      this.logger.error('Image optimization failed:', error);
      
      // Copy the file as-is
      const outputPath = path.join(outputDir, `${fileName}.${fileHash}${fileExt}`);
      await fs.copyFile(filePath, outputPath);
      
      return {
        original: {
          path: outputPath,
          size: fileBuffer.length,
          url: `${this.options.publicPath}images/${fileName}.${fileHash}${fileExt}`
        },
        error: error.message
      };
    }
  }

  /**
   * Optimize a CSS file
   * @param {string} filePath - Path to the CSS file
   * @param {Object} options - Optimization options (overrides defaults)
   * @returns {Promise<Object>} Optimization result with paths and metadata
   */
  async optimizeCSS(filePath, options = {}) {
    const opts = { ...this.options.cssOptions, ...options };
    const fileName = path.basename(filePath, '.css');
    const outputDir = path.join(this.options.outputDir, 'css');
    
    // Create output directory if it doesn't exist
    await fs.mkdir(outputDir, { recursive: true });
    
    // Read the CSS file
    const cssContent = await fs.readFile(filePath, 'utf8');
    
    // Generate file hash for cache busting
    const fileHash = this._generateHash(cssContent).substring(0, this.options.hashLength);
    
    let optimizedCSS = cssContent;
    let originalSize = Buffer.from(cssContent).length;
    
    // Minify CSS if enabled
    if (opts.minify) {
      if (csso) {
        // Use CSSO for better minification
        const result = csso.minify(cssContent, {
          restructure: true,
          comments: false,
          ...opts
        });
        
        optimizedCSS = result.css;
      } else {
        // Basic CSS minification
        optimizedCSS = this._basicMinifyCSS(cssContent);
      }
    }
    
    // Write optimized CSS to output file
    const outputPath = path.join(outputDir, `${fileName}.${fileHash}.css`);
    await fs.writeFile(outputPath, optimizedCSS);
    
    const optimizedSize = Buffer.from(optimizedCSS).length;
    
    const result = {
      path: outputPath,
      size: optimizedSize,
      saved: originalSize - optimizedSize,
      percent: ((originalSize - optimizedSize) / originalSize * 100).toFixed(2),
      url: `${this.options.publicPath}css/${fileName}.${fileHash}.css`
    };
    
    // Generate compressed versions if enabled
    if (this.options.compression.gzip) {
      await this._compressFile(outputPath, 'gzip');
      result.gzip = `${outputPath}.gz`;
    }
    
    if (this.options.compression.brotli) {
      await this._compressFile(outputPath, 'br');
      result.brotli = `${outputPath}.br`;
    }
    
    return result;
  }

  /**
   * Optimize a JavaScript file
   * @param {string} filePath - Path to the JavaScript file
   * @param {Object} options - Optimization options (overrides defaults)
   * @returns {Promise<Object>} Optimization result with paths and metadata
   */
  async optimizeJS(filePath, options = {}) {
    const opts = { ...this.options.jsOptions, ...options };
    const fileName = path.basename(filePath, '.js');
    const outputDir = path.join(this.options.outputDir, 'js');
    
    // Create output directory if it doesn't exist
    await fs.mkdir(outputDir, { recursive: true });
    
    // Read the JS file
    const jsContent = await fs.readFile(filePath, 'utf8');
    
    // Generate file hash for cache busting
    const fileHash = this._generateHash(jsContent).substring(0, this.options.hashLength);
    
    let optimizedJS = jsContent;
    let originalSize = Buffer.from(jsContent).length;
    
    // Minify JS if enabled and terser is available
    if (opts.minify && terser) {
      try {
        const result = await terser.minify(jsContent, {
          compress: true,
          mangle: true,
          ...opts
        });
        
        optimizedJS = result.code;
      } catch (error) {
        this.logger.error('JS minification failed:', error);
      }
    }
    
    // Write optimized JS to output file
    const outputPath = path.join(outputDir, `${fileName}.${fileHash}.js`);
    await fs.writeFile(outputPath, optimizedJS);
    
    const optimizedSize = Buffer.from(optimizedJS).length;
    
    const result = {
      path: outputPath,
      size: optimizedSize,
      saved: originalSize - optimizedSize,
      percent: ((originalSize - optimizedSize) / originalSize * 100).toFixed(2),
      url: `${this.options.publicPath}js/${fileName}.${fileHash}.js`
    };
    
    // Generate compressed versions if enabled
    if (this.options.compression.gzip) {
      await this._compressFile(outputPath, 'gzip');
      result.gzip = `${outputPath}.gz`;
    }
    
    if (this.options.compression.brotli) {
      await this._compressFile(outputPath, 'br');
      result.brotli = `${outputPath}.br`;
    }
    
    return result;
  }

  /**
   * Optimize a font file
   * @param {string} filePath - Path to the font file
   * @param {Object} options - Optimization options (overrides defaults)
   * @returns {Promise<Object>} Optimization result with paths and metadata
   */
  async optimizeFont(filePath, options = {}) {
    const opts = { ...this.options.fontOptions, ...options };
    const fileExt = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath, fileExt);
    const outputDir = path.join(this.options.outputDir, 'fonts');
    
    // Create output directory if it doesn't exist
    await fs.mkdir(outputDir, { recursive: true });
    
    // Read the font file
    const fontBuffer = await fs.readFile(filePath);
    
    // Generate file hash for cache busting
    const fileHash = this._generateHash(fontBuffer).substring(0, this.options.hashLength);
    
    // Copy the font file to the output directory
    const outputPath = path.join(outputDir, `${fileName}.${fileHash}${fileExt}`);
    await fs.copyFile(filePath, outputPath);
    
    const result = {
      path: outputPath,
      size: fontBuffer.length,
      url: `${this.options.publicPath}fonts/${fileName}.${fileHash}${fileExt}`
    };
    
    // Generate compressed versions if enabled
    if (this.options.compression.gzip) {
      await this._compressFile(outputPath, 'gzip');
      result.gzip = `${outputPath}.gz`;
    }
    
    if (this.options.compression.brotli) {
      await this._compressFile(outputPath, 'br');
      result.brotli = `${outputPath}.br`;
    }
    
    return result;
  }

  /**
   * Process a directory of assets
   * @param {string} dirPath - Path to the directory
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Processing results
   */
  async processDirectory(dirPath, options = {}) {
    const results = {
      images: [],
      css: [],
      js: [],
      fonts: [],
      other: []
    };
    
    // Get all files in the directory (recursive)
    const files = await this._getAllFiles(dirPath);
    
    // Process each file based on its extension
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      
      try {
        if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg'].includes(ext)) {
          const result = await this.optimizeImage(file, options.imageOptions);
          results.images.push({ file, result });
        } else if (ext === '.css') {
          const result = await this.optimizeCSS(file, options.cssOptions);
          results.css.push({ file, result });
        } else if (ext === '.js') {
          const result = await this.optimizeJS(file, options.jsOptions);
          results.js.push({ file, result });
        } else if (['.woff', '.woff2', '.ttf', '.eot', '.otf'].includes(ext)) {
          const result = await this.optimizeFont(file, options.fontOptions);
          results.fonts.push({ file, result });
        } else {
          // Copy other files as-is
          const fileName = path.basename(file);
          const outputPath = path.join(this.options.outputDir, 'other', fileName);
          
          // Create output directory if it doesn't exist
          await fs.mkdir(path.dirname(outputPath), { recursive: true });
          
          await fs.copyFile(file, outputPath);
          
          const fileSize = (await fs.stat(file)).size;
          
          results.other.push({
            file,
            result: {
              path: outputPath,
              size: fileSize,
              url: `${this.options.publicPath}other/${fileName}`
            }
          });
        }
      } catch (error) {
        this.logger.error(`Error processing file ${file}:`, error);
      }
    }
    
    return results;
  }

  /**
   * Generate a manifest file with all optimized assets
   * @param {Object} results - Processing results from processDirectory
   * @param {string} outputPath - Path to write the manifest file
   * @returns {Promise<Object>} Manifest object
   */
  async generateManifest(results, outputPath) {
    const manifest = {
      images: {},
      css: {},
      js: {},
      fonts: {},
      other: {}
    };
    
    // Add images to manifest
    for (const item of results.images) {
      const key = path.basename(item.file);
      manifest.images[key] = item.result;
    }
    
    // Add CSS to manifest
    for (const item of results.css) {
      const key = path.basename(item.file);
      manifest.css[key] = item.result;
    }
    
    // Add JS to manifest
    for (const item of results.js) {
      const key = path.basename(item.file);
      manifest.js[key] = item.result;
    }
    
    // Add fonts to manifest
    for (const item of results.fonts) {
      const key = path.basename(item.file);
      manifest.fonts[key] = item.result;
    }
    
    // Add other files to manifest
    for (const item of results.other) {
      const key = path.basename(item.file);
      manifest.other[key] = item.result;
    }
    
    // Add metadata
    manifest.metadata = {
      generated: new Date().toISOString(),
      totalFiles: Object.values(results).reduce((sum, arr) => sum + arr.length, 0),
      publicPath: this.options.publicPath
    };
    
    // Write manifest to file
    await fs.writeFile(outputPath, JSON.stringify(manifest, null, 2));
    
    return manifest;
  }

  /**
   * Optimize an image using sharp
   * @private
   * @param {Object} image - Sharp image object
   * @param {string} format - Output format
   * @param {number} quality - Output quality
   * @param {number|null} width - Target width (or null to maintain original size)
   * @returns {Promise<Buffer>} Optimized image buffer
   */
  async _optimizeWithSharp(image, format, quality, width) {
    let pipeline = image.clone();
    
    // Resize if width is specified
    if (width) {
      pipeline = pipeline.resize(width, null, {
        withoutEnlargement: true,
        fit: 'inside'
      });
    }
    
    // Convert to target format with quality settings
    switch (format) {
      case 'jpeg':
      case 'jpg':
        return pipeline.jpeg({ quality }).toBuffer();
      
      case 'png':
        return pipeline.png({ quality }).toBuffer();
      
      case 'webp':
        return pipeline.webp({ quality }).toBuffer();
      
      case 'avif':
        return pipeline.avif({ quality }).toBuffer();
      
      default:
        return pipeline.toBuffer();
    }
  }

  /**
   * Basic CSS minification
   * @private
   * @param {string} css - CSS content
   * @returns {string} Minified CSS
   */
  _basicMinifyCSS(css) {
    return css
      // Remove comments
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // Remove whitespace
      .replace(/\s+/g, ' ')
      .replace(/\s*({|}|;|,|:)\s*/g, '$1')
      .replace(/\s*>\s*/g, '>')
      .replace(/\s*\+\s*/g, '+')
      .replace(/\s*~\s*/g, '~')
      .trim();
  }

  /**
   * Compress a file using gzip or brotli
   * @private
   * @param {string} filePath - Path to the file
   * @param {string} algorithm - Compression algorithm ('gzip' or 'br')
   * @returns {Promise<void>}
   */
  async _compressFile(filePath, algorithm) {
    const input = createReadStream(filePath);
    const output = createWriteStream(`${filePath}.${algorithm === 'gzip' ? 'gz' : 'br'}`);
    
    const compress = algorithm === 'gzip' 
      ? zlib.createGzip({ level: 9 }) 
      : zlib.createBrotliCompress({
          params: {
            [zlib.constants.BROTLI_PARAM_QUALITY]: 11
          }
        });
    
    await pipeline(input, compress, output);
  }

  /**
   * Generate a hash from content
   * @private
   * @param {string|Buffer} content - Content to hash
   * @returns {string} Hash string
   */
  _generateHash(content) {
    return crypto
      .createHash('md5')
      .update(content)
      .digest('hex');
  }

  /**
   * Get all files in a directory recursively
   * @private
   * @param {string} dirPath - Directory path
   * @param {Array<string>} [arrayOfFiles=[]] - Array to store files
   * @returns {Promise<Array<string>>} Array of file paths
   */
  async _getAllFiles(dirPath, arrayOfFiles = []) {
    const files = await fs.readdir(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = await fs.stat(filePath);
      
      if (stat.isDirectory()) {
        arrayOfFiles = await this._getAllFiles(filePath, arrayOfFiles);
      } else {
        arrayOfFiles.push(filePath);
      }
    }
    
    return arrayOfFiles;
  }
}

module.exports = AssetOptimizer;
