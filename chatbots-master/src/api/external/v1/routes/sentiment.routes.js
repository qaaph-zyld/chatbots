/**
 * Sentiment Analysis Routes
 * 
 * API routes for sentiment analysis operations
 */

// Import dependencies
const express = require('express');
const { SentimentController } = require('@modules/sentiment/controllers/sentiment.controller');
const { authenticate } = require('@middleware/auth');
const { createCacheMiddleware, clearCache } = require('@middleware/cache');
const { getRedisClient } = require('@core/redis-client');

// Create router
const router = express.Router();

// Create cache middleware for sentiment analysis
const sentimentCache = createCacheMiddleware(getRedisClient(), {
  ttl: 3600, // Cache sentiment results for 1 hour
  prefix: 'sentiment',
  enabled: process.env.CACHE_ENABLED !== 'false'
});

/**
 * @route   POST /api/sentiment/analyze
 * @desc    Analyze sentiment of a single text message
 * @access  Private
 */
router.post('/analyze', authenticate, sentimentCache, SentimentController.analyzeSentiment);

/**
 * @route   POST /api/sentiment/analyze-batch
 * @desc    Analyze sentiment of multiple text messages
 * @access  Private
 */
router.post('/analyze-batch', authenticate, sentimentCache, SentimentController.analyzeBatchSentiment);

/**
 * @route   DELETE /api/sentiment/cache
 * @desc    Clear sentiment analysis cache
 * @access  Private (admin only)
 */
router.delete('/cache', authenticate, (req, res) => {
  // Check if user is admin
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized: Admin access required'
    });
  }
  
  try {
    // Clear sentiment cache
    const redisClient = getRedisClient();
    clearCache(redisClient, 'sentiment:*')
      .then(count => {
        res.json({
          success: true,
          message: `Successfully cleared ${count} cached sentiment results`
        });
      })
      .catch(error => {
        res.status(500).json({
          success: false,
          message: `Error clearing cache: ${error.message}`
        });
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

module.exports = router;
