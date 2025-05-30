/**
 * Performance Optimizer for Voice Components
 * 
 * This utility provides performance optimization for voice interface components,
 * including memory usage reduction, processing speed improvements, and resource
 * management strategies.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration
const config = {
  // Default optimization settings
  defaults: {
    // Audio processing
    audio: {
      bufferSize: 4096, // Audio buffer size
      sampleRate: 16000, // Default sample rate
      channels: 1, // Mono audio
      bitDepth: 16, // 16-bit audio
      useWorkers: true, // Use worker threads
      maxWorkers: Math.max(1, os.cpus().length - 1), // Leave one CPU core free
      chunkProcessing: true, // Process audio in chunks
      memoryLimit: 100 * 1024 * 1024, // 100MB memory limit for audio processing
      garbageCollectionInterval: 60000, // Run GC every minute during heavy processing
    },
    
    // Model management
    models: {
      cacheModels: true, // Cache models in memory
      maxCacheSize: 500 * 1024 * 1024, // 500MB model cache
      lazyLoading: true, // Load models only when needed
      unloadUnused: true, // Unload unused models
      inactivityTimeout: 300000, // Unload models after 5 minutes of inactivity
      compressionLevel: 1, // Model compression level (0-9)
      quantization: true, // Use quantized models when available
    },
    
    // Language detection
    language: {
      cacheResults: true, // Cache language detection results
      maxCacheEntries: 1000, // Maximum number of cached entries
      minTextLength: 10, // Minimum text length for accurate detection
      fastAlgorithm: true, // Use faster algorithm for short texts
    },
    
    // Voice recognition
    recognition: {
      embeddingCaching: true, // Cache voice embeddings
      maxEmbeddingCache: 100 * 1024 * 1024, // 100MB embedding cache
      optimizedMatching: true, // Use optimized matching algorithm
      batchProcessing: true, // Process in batches when possible
      adaptiveThreshold: true, // Use adaptive verification threshold
    }
  },
  
  // Profiles for different environments
  profiles: {
    // High-performance environment (servers, desktops)
    highPerformance: {
      audio: {
        bufferSize: 8192,
        maxWorkers: Math.max(2, os.cpus().length),
        memoryLimit: 500 * 1024 * 1024, // 500MB
      },
      models: {
        maxCacheSize: 1024 * 1024 * 1024, // 1GB
        compressionLevel: 0, // No compression
      },
      language: {
        maxCacheEntries: 10000,
        fastAlgorithm: false, // Use more accurate algorithm
      },
      recognition: {
        maxEmbeddingCache: 500 * 1024 * 1024, // 500MB
      }
    },
    
    // Balanced environment (laptops, mid-range devices)
    balanced: {
      // Use defaults
    },
    
    // Low-resource environment (mobile devices, IoT)
    lowResource: {
      audio: {
        bufferSize: 2048,
        maxWorkers: 1,
        memoryLimit: 50 * 1024 * 1024, // 50MB
        garbageCollectionInterval: 30000, // More frequent GC
      },
      models: {
        maxCacheSize: 100 * 1024 * 1024, // 100MB
        compressionLevel: 4, // Medium compression
        inactivityTimeout: 60000, // 1 minute
      },
      language: {
        maxCacheEntries: 100,
        fastAlgorithm: true,
      },
      recognition: {
        maxEmbeddingCache: 20 * 1024 * 1024, // 20MB
      }
    },
    
    // Minimal environment (very constrained devices)
    minimal: {
      audio: {
        bufferSize: 1024,
        useWorkers: false, // No worker threads
        chunkProcessing: false, // Process entire audio at once
        memoryLimit: 10 * 1024 * 1024, // 10MB
      },
      models: {
        cacheModels: false, // Don't cache models
        lazyLoading: true,
        unloadUnused: true,
        inactivityTimeout: 30000, // 30 seconds
        compressionLevel: 9, // Maximum compression
        quantization: true,
      },
      language: {
        cacheResults: false,
        fastAlgorithm: true,
      },
      recognition: {
        embeddingCaching: false,
        optimizedMatching: false, // Use simpler matching algorithm
        batchProcessing: false,
        adaptiveThreshold: false,
      }
    }
  }
};

// Current active configuration
let activeConfig = { ...config.defaults };
let activeProfile = 'balanced';

/**
 * Set optimization profile
 * @param {string} profileName - Name of the profile to use
 * @returns {object} - Active configuration
 */
function setProfile(profileName) {
  if (!config.profiles[profileName]) {
    console.warn(`Profile '${profileName}' not found, using 'balanced' instead`);
    profileName = 'balanced';
  }
  
  // Start with defaults
  activeConfig = { ...config.defaults };
  
  // Apply profile settings
  if (profileName !== 'balanced') {
    const profile = config.profiles[profileName];
    
    // Deep merge profile settings into active config
    for (const [category, settings] of Object.entries(profile)) {
      activeConfig[category] = {
        ...activeConfig[category],
        ...settings
      };
    }
  }
  
  activeProfile = profileName;
  console.log(`Activated '${profileName}' optimization profile`);
  
  return activeConfig;
}

/**
 * Get current optimization settings
 * @returns {object} - Current active configuration
 */
function getConfig() {
  return {
    profile: activeProfile,
    settings: { ...activeConfig }
  };
}

/**
 * Update specific optimization settings
 * @param {string} category - Category to update (audio, models, language, recognition)
 * @param {object} settings - Settings to update
 * @returns {object} - Updated configuration
 */
function updateSettings(category, settings) {
  if (!activeConfig[category]) {
    console.warn(`Category '${category}' not found`);
    return activeConfig;
  }
  
  activeConfig[category] = {
    ...activeConfig[category],
    ...settings
  };
  
  console.log(`Updated '${category}' optimization settings`);
  return activeConfig;
}

/**
 * Optimize audio processing settings based on input audio
 * @param {Buffer|string} audio - Audio buffer or path to audio file
 * @returns {object} - Optimized audio processing settings
 */
function optimizeAudioSettings(audio) {
  let audioBuffer;
  let fileSize = 0;
  
  // Get audio data
  if (typeof audio === 'string') {
    // Audio file path
    if (fs.existsSync(audio)) {
      const stats = fs.statSync(audio);
      fileSize = stats.size;
      
      // Only read a sample of the file for analysis
      const fd = fs.openSync(audio, 'r');
      const sampleSize = Math.min(fileSize, 1024 * 1024); // Read up to 1MB
      audioBuffer = Buffer.alloc(sampleSize);
      fs.readSync(fd, audioBuffer, 0, sampleSize, 0);
      fs.closeSync(fd);
    } else {
      console.warn(`Audio file not found: ${audio}`);
      return activeConfig.audio;
    }
  } else if (Buffer.isBuffer(audio)) {
    // Audio buffer
    audioBuffer = audio;
    fileSize = audioBuffer.length;
  } else {
    console.warn('Invalid audio input');
    return activeConfig.audio;
  }
  
  // Analyze audio to determine optimal settings
  const settings = { ...activeConfig.audio };
  
  // Adjust buffer size based on file size
  if (fileSize > 10 * 1024 * 1024) { // > 10MB
    settings.bufferSize = Math.min(16384, settings.bufferSize * 2);
    settings.chunkProcessing = true;
  } else if (fileSize < 1024 * 1024) { // < 1MB
    settings.bufferSize = Math.max(1024, settings.bufferSize / 2);
    settings.chunkProcessing = fileSize > 100 * 1024; // Only chunk if > 100KB
  }
  
  // Adjust worker count based on file size
  if (fileSize > 50 * 1024 * 1024) { // > 50MB
    settings.maxWorkers = Math.max(settings.maxWorkers, 2);
  } else if (fileSize < 1024 * 1024) { // < 1MB
    settings.maxWorkers = Math.min(settings.maxWorkers, 1);
  }
  
  return settings;
}

/**
 * Optimize model loading based on available resources
 * @param {string} modelType - Type of model (stt, tts, recognition)
 * @param {string} modelPath - Path to model file
 * @returns {object} - Optimized model loading settings
 */
function optimizeModelLoading(modelType, modelPath) {
  const settings = { ...activeConfig.models };
  
  // Check available memory
  const freeMem = os.freemem();
  const totalMem = os.totalmem();
  const memoryPercentage = freeMem / totalMem;
  
  // Adjust cache size based on available memory
  if (memoryPercentage < 0.2) { // Less than 20% free memory
    settings.maxCacheSize = Math.min(settings.maxCacheSize, 100 * 1024 * 1024); // 100MB max
    settings.unloadUnused = true;
    settings.inactivityTimeout = Math.min(settings.inactivityTimeout, 60000); // 1 minute max
  } else if (memoryPercentage > 0.5) { // More than 50% free memory
    settings.maxCacheSize = Math.max(settings.maxCacheSize, 200 * 1024 * 1024); // At least 200MB
  }
  
  // Check model file size if available
  if (modelPath && fs.existsSync(modelPath)) {
    const stats = fs.statSync(modelPath);
    const modelSize = stats.size;
    
    // Adjust settings based on model size
    if (modelSize > 500 * 1024 * 1024) { // > 500MB
      settings.lazyLoading = true;
      settings.quantization = true;
      settings.compressionLevel = Math.max(settings.compressionLevel, 2);
    } else if (modelSize < 50 * 1024 * 1024) { // < 50MB
      settings.lazyLoading = false; // Can load entire model
      settings.compressionLevel = Math.min(settings.compressionLevel, 1);
    }
  }
  
  return settings;
}

/**
 * Measure performance of a function
 * @param {Function} fn - Function to measure
 * @param {Array} args - Arguments to pass to the function
 * @returns {object} - Performance metrics
 */
async function measurePerformance(fn, args = []) {
  const startMemory = process.memoryUsage();
  const startTime = process.hrtime.bigint();
  
  let result;
  let error;
  
  try {
    result = await fn(...args);
  } catch (err) {
    error = err;
  }
  
  const endTime = process.hrtime.bigint();
  const endMemory = process.memoryUsage();
  
  const executionTime = Number(endTime - startTime) / 1_000_000; // Convert to ms
  const memoryDelta = {
    rss: endMemory.rss - startMemory.rss,
    heapTotal: endMemory.heapTotal - startMemory.heapTotal,
    heapUsed: endMemory.heapUsed - startMemory.heapUsed,
    external: endMemory.external - startMemory.external
  };
  
  return {
    success: !error,
    executionTime,
    memoryDelta,
    startMemory,
    endMemory,
    result,
    error
  };
}

/**
 * Generate performance recommendations
 * @returns {Array} - List of performance recommendations
 */
function generateRecommendations() {
  const recommendations = [];
  const freeMem = os.freemem();
  const totalMem = os.totalmem();
  const memoryPercentage = freeMem / totalMem;
  const cpuCount = os.cpus().length;
  
  // Memory recommendations
  if (memoryPercentage < 0.2) {
    recommendations.push({
      category: 'memory',
      severity: 'high',
      message: 'System is low on memory. Consider reducing cache sizes and enabling aggressive unloading of unused resources.'
    });
  }
  
  // CPU recommendations
  if (cpuCount < 2) {
    recommendations.push({
      category: 'cpu',
      severity: 'medium',
      message: 'Limited CPU resources detected. Consider disabling worker threads and using simpler processing algorithms.'
    });
  } else if (cpuCount >= 4 && activeConfig.audio.maxWorkers < 2) {
    recommendations.push({
      category: 'cpu',
      severity: 'low',
      message: 'Multiple CPU cores available. Consider increasing worker count for better performance.'
    });
  }
  
  // Audio processing recommendations
  if (activeConfig.audio.bufferSize < 2048 && memoryPercentage > 0.3) {
    recommendations.push({
      category: 'audio',
      severity: 'medium',
      message: 'Audio buffer size is small. Increasing buffer size may improve processing performance.'
    });
  }
  
  // Model recommendations
  if (!activeConfig.models.cacheModels && memoryPercentage > 0.4) {
    recommendations.push({
      category: 'models',
      severity: 'medium',
      message: 'Model caching is disabled. Enabling caching may improve response times.'
    });
  }
  
  // Language detection recommendations
  if (!activeConfig.language.cacheResults && memoryPercentage > 0.3) {
    recommendations.push({
      category: 'language',
      severity: 'low',
      message: 'Language detection caching is disabled. Enabling caching may improve performance for repeated texts.'
    });
  }
  
  // Recognition recommendations
  if (activeConfig.recognition.embeddingCaching && memoryPercentage < 0.15) {
    recommendations.push({
      category: 'recognition',
      severity: 'medium',
      message: 'Embedding caching may consume too much memory. Consider disabling or reducing cache size.'
    });
  }
  
  return recommendations;
}

/**
 * Apply automatic optimizations based on system resources
 * @returns {object} - Applied optimizations
 */
function autoOptimize() {
  const freeMem = os.freemem();
  const totalMem = os.totalmem();
  const memoryPercentage = freeMem / totalMem;
  const cpuCount = os.cpus().length;
  
  let profileName;
  
  // Select profile based on system resources
  if (memoryPercentage > 0.5 && cpuCount >= 4) {
    profileName = 'highPerformance';
  } else if (memoryPercentage < 0.2 || cpuCount === 1) {
    profileName = 'lowResource';
  } else if (memoryPercentage < 0.1) {
    profileName = 'minimal';
  } else {
    profileName = 'balanced';
  }
  
  // Apply profile
  setProfile(profileName);
  
  // Apply additional optimizations
  const optimizations = {
    profile: profileName,
    adjustments: {}
  };
  
  // Fine-tune worker count
  if (profileName !== 'minimal') {
    const optimalWorkers = Math.max(1, Math.min(cpuCount - 1, Math.floor(cpuCount * 0.75)));
    if (optimalWorkers !== activeConfig.audio.maxWorkers) {
      updateSettings('audio', { maxWorkers: optimalWorkers });
      optimizations.adjustments.workers = optimalWorkers;
    }
  }
  
  // Fine-tune cache sizes
  if (profileName !== 'minimal' && profileName !== 'lowResource') {
    const optimalCacheSize = Math.floor(totalMem * 0.2); // 20% of total memory
    if (optimalCacheSize !== activeConfig.models.maxCacheSize) {
      updateSettings('models', { maxCacheSize: optimalCacheSize });
      optimizations.adjustments.cacheSize = optimalCacheSize;
    }
  }
  
  return optimizations;
}

// Export functions
module.exports = {
  setProfile,
  getConfig,
  updateSettings,
  optimizeAudioSettings,
  optimizeModelLoading,
  measurePerformance,
  generateRecommendations,
  autoOptimize
};
