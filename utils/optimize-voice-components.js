/**
 * Voice Components Performance Optimizer
 * 
 * This script applies performance optimizations to the voice interface components.
 */

const performanceOptimizer = require('./performance-optimizer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Voice component paths
const voiceComponents = {
  audioProcessor: '../src/utils/audio-processor.js',
  languageDetector: '../src/utils/language-detector.js',
  modelManager: '../src/utils/model-manager.js',
  voiceRecognition: '../src/services/voice-recognition.service.js'
};

// Voice-specific optimizations
const voiceOptimizations = {
  // Audio processor optimizations
  audioProcessor: {
    // Optimize buffer management
    optimizeBuffers: (processor) => {
      if (!processor.optimizedBuffers) {
        console.log('Optimizing audio buffer management...');
        
        // Add buffer pooling
        processor.bufferPool = [];
        processor.getBuffer = function(size) {
          // Find a buffer in the pool or create a new one
          const existingBuffer = this.bufferPool.find(b => b.length >= size);
          if (existingBuffer) {
            const index = this.bufferPool.indexOf(existingBuffer);
            this.bufferPool.splice(index, 1);
            return existingBuffer;
          }
          return Buffer.alloc(size);
        };
        
        processor.releaseBuffer = function(buffer) {
          // Keep pool size reasonable
          if (this.bufferPool.length < 10) {
            this.bufferPool.push(buffer);
          }
        };
        
        // Mark as optimized
        processor.optimizedBuffers = true;
      }
      return processor;
    },
    
    // Optimize audio processing
    optimizeProcessing: (processor, config) => {
      if (!processor.optimizedProcessing) {
        console.log('Optimizing audio processing...');
        
        // Add chunked processing
        const originalProcessAudio = processor.processAudio;
        processor.processAudio = async function(audioPath, options = {}) {
          // Get optimized settings
          const settings = performanceOptimizer.optimizeAudioSettings(audioPath);
          
          // Apply optimized settings
          options.bufferSize = options.bufferSize || settings.bufferSize;
          options.useWorkers = options.useWorkers !== undefined ? options.useWorkers : settings.useWorkers;
          options.chunkProcessing = options.chunkProcessing !== undefined ? options.chunkProcessing : settings.chunkProcessing;
          
          // Use chunked processing for large files
          if (options.chunkProcessing && fs.existsSync(audioPath)) {
            const stats = fs.statSync(audioPath);
            if (stats.size > 5 * 1024 * 1024) { // > 5MB
              console.log('Using chunked processing for large audio file');
              return await this.processAudioInChunks(audioPath, options);
            }
          }
          
          // Use original processing for smaller files
          return await originalProcessAudio.call(this, audioPath, options);
        };
        
        // Add chunked processing method
        processor.processAudioInChunks = async function(audioPath, options = {}) {
          // Implementation of chunked processing
          // This is a simplified version - a real implementation would read and process
          // the file in chunks to reduce memory usage
          
          const chunkSize = options.bufferSize || 4096;
          const stats = fs.statSync(audioPath);
          const fileSize = stats.size;
          const chunks = Math.ceil(fileSize / chunkSize);
          
          // Process in chunks
          let processedChunks = [];
          for (let i = 0; i < chunks; i++) {
            // Read chunk
            const buffer = Buffer.alloc(Math.min(chunkSize, fileSize - i * chunkSize));
            const fd = fs.openSync(audioPath, 'r');
            fs.readSync(fd, buffer, 0, buffer.length, i * chunkSize);
            fs.closeSync(fd);
            
            // Process chunk
            const processedChunk = await this.processBuffer(buffer, options);
            processedChunks.push(processedChunk);
          }
          
          // Combine processed chunks
          const totalSize = processedChunks.reduce((size, chunk) => size + chunk.length, 0);
          const result = Buffer.concat(processedChunks, totalSize);
          
          return result;
        };
        
        // Add buffer processing method
        processor.processBuffer = async function(buffer, options = {}) {
          // Implementation of buffer processing
          // This would contain the core audio processing logic
          
          // For now, just return the buffer (placeholder)
          return buffer;
        };
        
        // Mark as optimized
        processor.optimizedProcessing = true;
      }
      return processor;
    }
  },
  
  // Language detector optimizations
  languageDetector: {
    // Optimize language detection
    optimizeDetection: (detector, config) => {
      if (!detector.optimizedDetection) {
        console.log('Optimizing language detection...');
        
        // Add result caching
        if (config.language.cacheResults) {
          detector.cache = new Map();
          
          const originalDetectLanguage = detector.detectLanguage;
          detector.detectLanguage = async function(text, options = {}) {
            // Skip cache for very short texts or if caching is disabled
            if (!text || text.length < config.language.minTextLength || options.noCache) {
              return await originalDetectLanguage.call(this, text, options);
            }
            
            // Generate cache key
            const cacheKey = `${text.substring(0, 100)}:${JSON.stringify(options)}`;
            
            // Check cache
            if (this.cache.has(cacheKey)) {
              return { ...this.cache.get(cacheKey), fromCache: true };
            }
            
            // Detect language
            const result = await originalDetectLanguage.call(this, text, options);
            
            // Cache result if successful
            if (result.detected) {
              // Limit cache size
              if (this.cache.size >= config.language.maxCacheEntries) {
                // Remove oldest entry
                const firstKey = this.cache.keys().next().value;
                this.cache.delete(firstKey);
              }
              
              this.cache.set(cacheKey, result);
            }
            
            return result;
          };
        }
        
        // Add fast detection for short texts
        if (config.language.fastAlgorithm) {
          detector.fastDetect = function(text) {
            // Simple language detection for short texts
            // This is a simplified version - a real implementation would use
            // a lightweight algorithm for quick language detection
            
            // Check for common language patterns
            const patterns = {
              en: /\b(the|and|is|in|to|a|for|that|this)\b/i,
              es: /\b(el|la|los|las|y|es|en|para|que|este)\b/i,
              fr: /\b(le|la|les|et|est|en|pour|que|ce)\b/i,
              de: /\b(der|die|das|und|ist|in|für|dass|diese)\b/i
            };
            
            // Count matches for each language
            const matches = {};
            for (const [lang, pattern] of Object.entries(patterns)) {
              const match = text.match(pattern);
              matches[lang] = match ? match.length : 0;
            }
            
            // Find language with most matches
            let bestLang = 'en';
            let bestCount = 0;
            
            for (const [lang, count] of Object.entries(matches)) {
              if (count > bestCount) {
                bestLang = lang;
                bestCount = count;
              }
            }
            
            return {
              detected: bestCount > 0,
              language: bestLang,
              confidence: Math.min(0.7, bestCount / 10)
            };
          };
          
          const originalDetectLanguage = detector.detectLanguage;
          detector.detectLanguage = async function(text, options = {}) {
            // Use fast detection for short texts
            if (text && text.length < 30 && !options.forceAccurate) {
              return this.fastDetect(text);
            }
            
            // Use full detection for longer texts
            return await originalDetectLanguage.call(this, text, options);
          };
        }
        
        // Mark as optimized
        detector.optimizedDetection = true;
      }
      return detector;
    }
  },
  
  // Model manager optimizations
  modelManager: {
    // Optimize model loading
    optimizeModelLoading: (manager, config) => {
      if (!manager.optimizedLoading) {
        console.log('Optimizing model loading...');
        
        // Add model caching
        if (config.models.cacheModels) {
          manager.modelCache = new Map();
          manager.modelLastUsed = new Map();
          
          const originalLoadModel = manager.loadModel;
          manager.loadModel = async function(modelPath, options = {}) {
            // Skip cache if disabled
            if (options.noCache) {
              return await originalLoadModel.call(this, modelPath, options);
            }
            
            // Check cache
            if (this.modelCache.has(modelPath)) {
              // Update last used time
              this.modelLastUsed.set(modelPath, Date.now());
              return this.modelCache.get(modelPath);
            }
            
            // Load model
            const model = await originalLoadModel.call(this, modelPath, options);
            
            // Cache model
            this.modelCache.set(modelPath, model);
            this.modelLastUsed.set(modelPath, Date.now());
            
            // Check cache size
            this.cleanModelCache();
            
            return model;
          };
          
          // Add cache cleaning
          manager.cleanModelCache = function() {
            // Calculate total cache size
            let totalSize = 0;
            for (const model of this.modelCache.values()) {
              totalSize += this.getModelSize(model);
            }
            
            // Clean cache if too large
            if (totalSize > config.models.maxCacheSize) {
              console.log(`Model cache too large (${Math.round(totalSize / 1024 / 1024)}MB), cleaning...`);
              
              // Sort models by last used time
              const sortedModels = [...this.modelLastUsed.entries()]
                .sort((a, b) => a[1] - b[1]);
              
              // Remove oldest models until cache is small enough
              for (const [modelPath, lastUsed] of sortedModels) {
                if (totalSize <= config.models.maxCacheSize) {
                  break;
                }
                
                // Remove model from cache
                const model = this.modelCache.get(modelPath);
                const modelSize = this.getModelSize(model);
                
                this.modelCache.delete(modelPath);
                this.modelLastUsed.delete(modelPath);
                
                totalSize -= modelSize;
                console.log(`Removed model ${modelPath} from cache (${Math.round(modelSize / 1024 / 1024)}MB)`);
              }
            }
          };
          
          // Add model size estimation
          manager.getModelSize = function(model) {
            // Estimate model size
            // This is a simplified version - a real implementation would
            // calculate the actual memory usage of the model
            
            if (!model) return 0;
            
            // Rough estimation based on model type
            if (model.byteLength) {
              return model.byteLength;
            } else if (model.size) {
              return model.size;
            } else if (model.params) {
              // Estimate based on parameter count
              return model.params * 4; // 4 bytes per parameter
            }
            
            // Default size estimate
            return 50 * 1024 * 1024; // 50MB
          };
          
          // Add automatic unloading
          if (config.models.unloadUnused) {
            // Set up interval to check for unused models
            setInterval(() => {
              const now = Date.now();
              
              for (const [modelPath, lastUsed] of this.modelLastUsed.entries()) {
                // Check if model has been unused for too long
                if (now - lastUsed > config.models.inactivityTimeout) {
                  // Unload model
                  this.modelCache.delete(modelPath);
                  this.modelLastUsed.delete(modelPath);
                  console.log(`Unloaded unused model: ${modelPath}`);
                }
              }
            }, 60000); // Check every minute
          }
        }
        
        // Mark as optimized
        manager.optimizedLoading = true;
      }
      return manager;
    }
  },
  
  // Voice recognition optimizations
  voiceRecognition: {
    // Optimize speaker verification
    optimizeVerification: (service, config) => {
      if (!service.optimizedVerification) {
        console.log('Optimizing speaker verification...');
        
        // Add embedding caching
        if (config.recognition.embeddingCaching) {
          service.embeddingCache = new Map();
          
          const originalExtractEmbedding = service.extractEmbedding;
          service.extractEmbedding = async function(audioPath, options = {}) {
            // Skip cache if disabled
            if (options.noCache) {
              return await originalExtractEmbedding.call(this, audioPath, options);
            }
            
            // Generate cache key
            const stats = fs.existsSync(audioPath) ? fs.statSync(audioPath) : { size: 0, mtimeMs: 0 };
            const cacheKey = `${audioPath}:${stats.size}:${stats.mtimeMs}`;
            
            // Check cache
            if (this.embeddingCache.has(cacheKey)) {
              return { ...this.embeddingCache.get(cacheKey), fromCache: true };
            }
            
            // Extract embedding
            const result = await originalExtractEmbedding.call(this, audioPath, options);
            
            // Cache result if successful
            if (result.success) {
              // Calculate cache size
              let cacheSize = 0;
              for (const cachedResult of this.embeddingCache.values()) {
                cacheSize += JSON.stringify(cachedResult).length;
              }
              
              // Clean cache if too large
              if (cacheSize > config.recognition.maxEmbeddingCache) {
                // Remove oldest entries
                const entriesToRemove = Math.ceil(this.embeddingCache.size * 0.2); // Remove 20%
                const keys = [...this.embeddingCache.keys()];
                
                for (let i = 0; i < entriesToRemove; i++) {
                  this.embeddingCache.delete(keys[i]);
                }
              }
              
              this.embeddingCache.set(cacheKey, result);
            }
            
            return result;
          };
        }
        
        // Optimize comparison algorithm
        if (config.recognition.optimizedMatching) {
          const originalCompareEmbeddings = service.compareEmbeddings;
          service.compareEmbeddings = function(embedding1, embedding2) {
            // Skip optimization for invalid embeddings
            if (!embedding1 || !embedding2 || !embedding1.length || !embedding2.length) {
              return originalCompareEmbeddings.call(this, embedding1, embedding2);
            }
            
            // Use optimized algorithm for large embeddings
            if (embedding1.length > 100) {
              // Use a faster dot product calculation
              let dotProduct = 0;
              let norm1 = 0;
              let norm2 = 0;
              
              // Process in chunks for better cache locality
              const chunkSize = 16;
              for (let i = 0; i < embedding1.length; i += chunkSize) {
                const end = Math.min(i + chunkSize, embedding1.length);
                
                for (let j = i; j < end; j++) {
                  dotProduct += embedding1[j] * embedding2[j];
                  norm1 += embedding1[j] * embedding1[j];
                  norm2 += embedding2[j] * embedding2[j];
                }
              }
              
              // Calculate cosine similarity
              const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
              return similarity;
            }
            
            // Use original algorithm for smaller embeddings
            return originalCompareEmbeddings.call(this, embedding1, embedding2);
          };
        }
        
        // Add batch processing
        if (config.recognition.batchProcessing) {
          service.processBatch = async function(audioFiles, processFn) {
            // Process multiple audio files in batch
            const results = [];
            
            // Process in parallel with limit
            const concurrency = Math.min(audioFiles.length, config.audio.maxWorkers);
            const batches = [];
            
            // Create batches
            for (let i = 0; i < concurrency; i++) {
              batches.push(audioFiles.filter((_, index) => index % concurrency === i));
            }
            
            // Process batches in parallel
            const batchPromises = batches.map(async (batch) => {
              const batchResults = [];
              
              for (const audioFile of batch) {
                const result = await processFn.call(this, audioFile);
                batchResults.push(result);
              }
              
              return batchResults;
            });
            
            // Combine results
            const batchResults = await Promise.all(batchPromises);
            for (const batch of batchResults) {
              results.push(...batch);
            }
            
            return results;
          };
        }
        
        // Mark as optimized
        service.optimizedVerification = true;
      }
      return service;
    }
  }
};

/**
 * Apply optimizations to voice components
 * @param {string} profileName - Optimization profile to use
 * @returns {object} - Optimization results
 */
async function optimizeVoiceComponents(profileName = 'auto') {
  console.log(`Optimizing voice components with profile: ${profileName}`);
  
  // Apply automatic optimization if requested
  let config;
  if (profileName === 'auto') {
    const optimization = performanceOptimizer.autoOptimize();
    console.log(`Auto-selected profile: ${optimization.profile}`);
    config = performanceOptimizer.getConfig().settings;
  } else {
    config = performanceOptimizer.setProfile(profileName);
  }
  
  // Results object
  const results = {
    profile: profileName === 'auto' ? performanceOptimizer.getConfig().profile : profileName,
    components: {},
    recommendations: []
  };
  
  // Load and optimize components
  for (const [name, filePath] of Object.entries(voiceComponents)) {
    const fullPath = path.resolve(__dirname, filePath);
    
    if (fs.existsSync(fullPath)) {
      console.log(`Optimizing ${name}...`);
      
      try {
        // Load component
        const component = require(filePath);
        
        // Apply component-specific optimizations
        const optimizations = voiceOptimizations[name];
        if (optimizations) {
          for (const [optimizationName, optimizationFn] of Object.entries(optimizations)) {
            try {
              optimizationFn(component, config);
              results.components[name] = results.components[name] || { optimizations: [] };
              results.components[name].optimizations.push(optimizationName);
            } catch (error) {
              console.error(`Error applying ${optimizationName} to ${name}:`, error);
              results.components[name] = results.components[name] || { errors: [] };
              results.components[name].errors = results.components[name].errors || [];
              results.components[name].errors.push({
                optimization: optimizationName,
                error: error.message
              });
            }
          }
        }
      } catch (error) {
        console.error(`Error loading ${name}:`, error);
        results.components[name] = { error: error.message };
      }
    } else {
      console.warn(`Component not found: ${fullPath}`);
      results.components[name] = { error: 'Component not found' };
    }
  }
  
  // Generate performance recommendations
  results.recommendations = performanceOptimizer.generateRecommendations();
  
  // Save results
  const resultsPath = path.resolve(__dirname, '../voice-optimization-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  
  console.log(`Optimization complete. Results saved to: ${resultsPath}`);
  
  return results;
}

// Run optimization if called directly
if (require.main === module) {
  // Get profile from command line argument
  const profileArg = process.argv[2] || 'auto';
  optimizeVoiceComponents(profileArg);
}

module.exports = {
  optimizeVoiceComponents
};
