/**
 * Sentiment Analysis Service
 * 
 * Provides sentiment analysis capabilities using open-source libraries
 * Supports VADER and TextBlob for local sentiment analysis
 */

const path = require('path');
const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');
require('@src/utils');

class SentimentAnalysisService {
  constructor() {
    this.pythonPath = process.env.PYTHON_PATH || 'python';
    this.scriptPath = path.join(__dirname, 'python', 'sentiment_analysis.py');
    this.initialized = false;
    this.cache = new Map();
    this.cacheSize = parseInt(process.env.SENTIMENT_CACHE_SIZE || '1000');
    this.cacheTTL = parseInt(process.env.SENTIMENT_CACHE_TTL || '3600') * 1000; // Default 1 hour in ms
    
    // Default configuration
    this.config = {
      defaultMethod: 'combined', // 'vader', 'textblob', or 'combined'
      cacheEnabled: true,
      emotionDetection: true,
      sentimentTrackingEnabled: true,
      sentimentHistorySize: 10
    };
  }
  
  /**
   * Initialize the sentiment analysis service
   * @param {Object} config - Configuration options
   * @returns {Promise<boolean>} - True if initialization was successful
   */
  async initialize(config = {}) {
    try {
      // Merge provided config with defaults
      this.config = { ...this.config, ...config };
      
      logger.info('Initializing sentiment analysis service');
      
      // Verify Python environment
      const pythonAvailable = await this._verifyPythonEnvironment();
      
      if (!pythonAvailable) {
        logger.error('Python environment not available, sentiment analysis will not work');
        return false;
      }
      
      this.initialized = true;
      logger.info('Sentiment analysis service initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize sentiment analysis service:', error.message);
      return false;
    }
  }
  
  /**
   * Verify that the Python environment is available
   * @returns {Promise<boolean>} - True if Python is available
   * @private
   */
  async _verifyPythonEnvironment() {
    return new Promise((resolve) => {
      try {
        const python = spawn(this.pythonPath, ['-c', 'print("Python is available")']);
        
        python.on('error', (error) => {
          logger.error('Python environment error:', error.message);
          resolve(false);
        });
        
        python.on('close', (code) => {
          if (code === 0) {
            logger.info('Python environment verified successfully');
            resolve(true);
          } else {
            logger.error(`Python environment verification failed with code ${code}`);
            resolve(false);
          }
        });
      } catch (error) {
        logger.error('Failed to verify Python environment:', error.message);
        resolve(false);
      }
    });
  }
  
  /**
   * Analyze sentiment of text
   * @param {string} text - Text to analyze
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} - Sentiment analysis result
   */
  async analyzeSentiment(text, options = {}) {
    if (!this.initialized) {
      throw new Error('Sentiment analysis service not initialized');
    }
    
    const opts = {
      method: options.method || this.config.defaultMethod,
      useCache: options.useCache !== undefined ? options.useCache : this.config.cacheEnabled
    };
    
    try {
      // Check cache if enabled
      if (opts.useCache) {
        const cacheKey = `${text}:${opts.method}`;
        const cachedResult = this._getCachedResult(cacheKey);
        
        if (cachedResult) {
          return cachedResult;
        }
      }
      
      // Analyze sentiment using Python bridge
      const result = await this._analyzeSentimentWithPython(text, opts.method);
      
      // Cache result if enabled
      if (opts.useCache) {
        const cacheKey = `${text}:${opts.method}`;
        this._cacheResult(cacheKey, result);
      }
      
      return result;
    } catch (error) {
      logger.error('Sentiment analysis error:', error.message);
      
      // Return a default result on error
      return {
        text,
        sentiment: {
          score: 0,
          label: 'neutral',
          error: error.message
        },
        emotions: {
          joy: 0,
          sadness: 0,
          anger: 0,
          fear: 0,
          surprise: 0
        }
      };
    }
  }
  
  /**
   * Analyze sentiment using the Python bridge
   * @param {string} text - Text to analyze
   * @param {string} method - Analysis method
   * @returns {Promise<Object>} - Sentiment analysis result
   * @private
   */
  async _analyzeSentimentWithPython(text, method) {
    return new Promise((resolve, reject) => {
      try {
        const python = spawn(this.pythonPath, [this.scriptPath]);
        let dataString = '';
        
        // Send data to Python script
        python.stdin.write(JSON.stringify({
          text,
          method
        }));
        python.stdin.end();
        
        // Collect data from Python script
        python.stdout.on('data', (data) => {
          dataString += data.toString();
        });
        
        // Handle errors
        python.stderr.on('data', (data) => {
          logger.error(`Python error: ${data.toString()}`);
        });
        
        python.on('error', (error) => {
          reject(new Error(`Failed to start Python process: ${error.message}`));
        });
        
        // Process complete
        python.on('close', (code) => {
          if (code !== 0) {
            reject(new Error(`Python process exited with code ${code}`));
            return;
          }
          
          try {
            const result = JSON.parse(dataString);
            
            if (result.error) {
              reject(new Error(`Python error: ${result.error}`));
              return;
            }
            
            resolve(result);
          } catch (error) {
            reject(new Error(`Failed to parse Python output: ${error.message}`));
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Get cached sentiment analysis result
   * @param {string} key - Cache key
   * @returns {Object|null} - Cached result or null if not found
   * @private
   */
  _getCachedResult(key) {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.result;
    }
    
    // Remove expired cache entry
    if (cached) {
      this.cache.delete(key);
    }
    
    return null;
  }
  
  /**
   * Cache sentiment analysis result
   * @param {string} key - Cache key
   * @param {Object} result - Result to cache
   * @private
   */
  _cacheResult(key, result) {
    // Limit cache size
    if (this.cache.size >= this.cacheSize) {
      // Remove oldest entry
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      result,
      timestamp: Date.now()
    });
  }
  
  /**
   * Track sentiment over a conversation
   * @param {Array<Object>} messages - Messages with sentiment analysis
   * @returns {Object} - Sentiment tracking result
   */
  trackSentiment(messages) {
    if (!this.initialized || !this.config.sentimentTrackingEnabled) {
      throw new Error('Sentiment tracking not enabled');
    }
    
    try {
      // Limit the number of messages to track
      const recentMessages = messages.slice(-this.config.sentimentHistorySize);
      
      // Calculate average sentiment
      let totalScore = 0;
      let positiveMessages = 0;
      let negativeMessages = 0;
      let neutralMessages = 0;
      
      // Emotion tracking
      const emotions = {
        joy: 0,
        sadness: 0,
        anger: 0,
        fear: 0,
        surprise: 0
      };
      
      // Process each message
      for (const message of recentMessages) {
        if (!message.sentiment) continue;
        
        const score = message.sentiment.score || 0;
        totalScore += score;
        
        // Count by sentiment category
        if (score >= 0.1) {
          positiveMessages++;
        } else if (score <= -0.1) {
          negativeMessages++;
        } else {
          neutralMessages++;
        }
        
        // Track emotions if available
        if (message.emotions) {
          for (const [emotion, value] of Object.entries(message.emotions)) {
            if (emotions[emotion] !== undefined) {
              emotions[emotion] += value;
            }
          }
        }
      }
      
      // Calculate averages
      const messageCount = recentMessages.length;
      const averageScore = messageCount > 0 ? totalScore / messageCount : 0;
      
      // Average emotions
      for (const emotion in emotions) {
        emotions[emotion] = messageCount > 0 ? emotions[emotion] / messageCount : 0;
      }
      
      // Determine dominant emotion
      let dominantEmotion = 'neutral';
      let maxEmotionScore = 0;
      
      for (const [emotion, score] of Object.entries(emotions)) {
        if (score > maxEmotionScore) {
          maxEmotionScore = score;
          dominantEmotion = emotion;
        }
      }
      
      // Only set dominant emotion if score is significant
      if (maxEmotionScore < 0.2) {
        dominantEmotion = 'neutral';
      }
      
      // Determine sentiment trend
      let trend = 'stable';
      
      if (recentMessages.length >= 3) {
        const firstHalf = recentMessages.slice(0, Math.floor(recentMessages.length / 2));
        const secondHalf = recentMessages.slice(Math.floor(recentMessages.length / 2));
        
        const firstHalfAvg = firstHalf.reduce((sum, msg) => sum + (msg.sentiment?.score || 0), 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, msg) => sum + (msg.sentiment?.score || 0), 0) / secondHalf.length;
        
        const difference = secondHalfAvg - firstHalfAvg;
        
        if (difference > 0.2) {
          trend = 'improving';
        } else if (difference < -0.2) {
          trend = 'deteriorating';
        }
      }
      
      return {
        averageScore,
        label: this._getSentimentLabel(averageScore),
        distribution: {
          positive: positiveMessages,
          negative: negativeMessages,
          neutral: neutralMessages
        },
        emotions,
        dominantEmotion,
        trend,
        messageCount
      };
    } catch (error) {
      logger.error('Sentiment tracking error:', error.message);
      return {
        averageScore: 0,
        label: 'neutral',
        distribution: {
          positive: 0,
          negative: 0,
          neutral: 0
        },
        emotions: {
          joy: 0,
          sadness: 0,
          anger: 0,
          fear: 0,
          surprise: 0
        },
        dominantEmotion: 'neutral',
        trend: 'stable',
        messageCount: 0,
        error: error.message
      };
    }
  }
  
  /**
   * Get sentiment label from score
   * @param {number} score - Sentiment score
   * @returns {string} - Sentiment label
   * @private
   */
  _getSentimentLabel(score) {
    if (score >= 0.5) {
      return 'very positive';
    } else if (score >= 0.1) {
      return 'positive';
    } else if (score > -0.1) {
      return 'neutral';
    } else if (score > -0.5) {
      return 'negative';
    } else {
      return 'very negative';
    }
  }
}

// Create singleton instance
const sentimentAnalysisService = new SentimentAnalysisService();

module.exports = sentimentAnalysisService;
