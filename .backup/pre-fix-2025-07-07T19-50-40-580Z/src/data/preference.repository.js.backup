/**
 * Preference Repository
 * 
 * Repository for managing user preferences with caching and optimized queries
 */

require('@src/data\base.repository');
require('@src/models\preference.model');
require('@src/utils');

class PreferenceRepository extends BaseRepository {
  constructor() {
    super(Preference, 'preference');
    
    // Cache configuration
    this.cacheEnabled = true;
    this.cacheTTL = 3600; // 1 hour in seconds
    this.cacheKeyPrefix = 'preference:';
  }
  
  /**
   * Get preferences by user ID
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - User preferences
   */
  async getByUserId(userId, options = {}) {
    const cacheKey = `${this.cacheKeyPrefix}user:${userId}`;
    
    // Try to get from cache
    if (this.cacheEnabled) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        logger.debug(`Cache hit for user preferences: ${userId}`);
        return cached;
      }
    }
    
    // Query database
    const preferences = await this.find(
      { 'metadata.userId': userId },
      options
    );
    
    // Save to cache
    if (this.cacheEnabled && preferences.length > 0) {
      this.saveToCache(cacheKey, preferences, this.cacheTTL);
    }
    
    return preferences;
  }
  
  /**
   * Get preferences by category
   * @param {string} userId - User ID
   * @param {string} category - Preference category
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Preferences in the category
   */
  async getByCategory(userId, category, options = {}) {
    const cacheKey = `${this.cacheKeyPrefix}user:${userId}:category:${category}`;
    
    // Try to get from cache
    if (this.cacheEnabled) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        logger.debug(`Cache hit for user category preferences: ${userId}:${category}`);
        return cached;
      }
    }
    
    // Query database
    const preferences = await this.find(
      { 
        'metadata.userId': userId,
        category 
      },
      options
    );
    
    // Save to cache
    if (this.cacheEnabled && preferences.length > 0) {
      this.saveToCache(cacheKey, preferences, this.cacheTTL);
    }
    
    return preferences;
  }
  
  /**
   * Get a specific preference
   * @param {string} userId - User ID
   * @param {string} category - Preference category
   * @param {string} key - Preference key
   * @returns {Promise<Object>} - Preference object
   */
  async getPreference(userId, category, key) {
    const cacheKey = `${this.cacheKeyPrefix}user:${userId}:${category}:${key}`;
    
    // Try to get from cache
    if (this.cacheEnabled) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        logger.debug(`Cache hit for specific preference: ${userId}:${category}:${key}`);
        return cached;
      }
    }
    
    // Query database
    const preference = await this.findOne({
      'metadata.userId': userId,
      category,
      key
    });
    
    // Save to cache
    if (this.cacheEnabled && preference) {
      this.saveToCache(cacheKey, preference, this.cacheTTL);
    }
    
    return preference;
  }
  
  /**
   * Set a preference
   * @param {string} userId - User ID
   * @param {string} category - Preference category
   * @param {string} key - Preference key
   * @param {*} value - Preference value
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Updated preference
   */
  async setPreference(userId, category, key, value, options = {}) {
    const { source = 'explicit', confidence = 1.0, metadata = {} } = options;
    
    // Combine metadata
    const combinedMetadata = {
      ...metadata,
      userId,
      updatedAt: new Date()
    };
    
    // Find and update or create
    const preference = await this.findOneAndUpdate(
      { 'metadata.userId': userId, category, key },
      {
        value,
        source,
        confidence,
        metadata: combinedMetadata
      },
      { upsert: true, new: true }
    );
    
    // Invalidate caches
    this.invalidateUserPreferenceCache(userId, category, key);
    
    return preference;
  }
  
  /**
   * Delete a preference
   * @param {string} userId - User ID
   * @param {string} category - Preference category
   * @param {string} key - Preference key
   * @returns {Promise<boolean>} - True if deleted
   */
  async deletePreference(userId, category, key) {
    const result = await this.deleteOne({
      'metadata.userId': userId,
      category,
      key
    });
    
    // Invalidate caches
    this.invalidateUserPreferenceCache(userId, category, key);
    
    return result;
  }
  
  /**
   * Delete all preferences for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Deletion result
   */
  async deleteAllUserPreferences(userId) {
    const result = await this.deleteMany({
      'metadata.userId': userId
    });
    
    // Invalidate all user caches
    this.invalidateAllUserPreferenceCache(userId);
    
    return result;
  }
  
  /**
   * Get preferences with confidence above threshold
   * @param {string} userId - User ID
   * @param {number} threshold - Confidence threshold (0-1)
   * @returns {Promise<Array>} - High confidence preferences
   */
  async getHighConfidencePreferences(userId, threshold = 0.7) {
    return this.find({
      'metadata.userId': userId,
      confidence: { $gte: threshold }
    });
  }
  
  /**
   * Batch update preferences
   * @param {string} userId - User ID
   * @param {Array} preferences - Array of preference objects
   * @returns {Promise<Array>} - Updated preferences
   */
  async batchUpdatePreferences(userId, preferences) {
    const session = await this.startTransaction();
    const results = [];
    
    try {
      for (const pref of preferences) {
        const { category, key, value, source, confidence, metadata } = pref;
        
        const result = await this.setPreference(
          userId, category, key, value, 
          { source, confidence, metadata, session }
        );
        
        results.push(result);
      }
      
      await this.commitTransaction(session);
      
      // Invalidate all user caches
      this.invalidateAllUserPreferenceCache(userId);
      
      return results;
    } catch (error) {
      await this.abortTransaction(session);
      logger.error('Error in batch update preferences', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Invalidate cache for a specific preference
   * @param {string} userId - User ID
   * @param {string} category - Preference category
   * @param {string} key - Preference key
   */
  invalidateUserPreferenceCache(userId, category, key) {
    if (!this.cacheEnabled) return;
    
    // Invalidate specific preference
    const specificKey = `${this.cacheKeyPrefix}user:${userId}:${category}:${key}`;
    this.invalidateCache(specificKey);
    
    // Invalidate category
    const categoryKey = `${this.cacheKeyPrefix}user:${userId}:category:${category}`;
    this.invalidateCache(categoryKey);
    
    // Invalidate all user preferences
    const userKey = `${this.cacheKeyPrefix}user:${userId}`;
    this.invalidateCache(userKey);
    
    logger.debug(`Invalidated preference cache for: ${userId}:${category}:${key}`);
  }
  
  /**
   * Invalidate all cache entries for a user
   * @param {string} userId - User ID
   */
  invalidateAllUserPreferenceCache(userId) {
    if (!this.cacheEnabled) return;
    
    // In a real implementation with a distributed cache like Redis,
    // we would use pattern matching to delete all keys for this user
    // For our in-memory cache, we'll just clear all cache
    // as we don't have pattern matching capabilities
    this.clearCache();
    
    logger.debug(`Invalidated all preference cache for user: ${userId}`);
  }
}

module.exports = new PreferenceRepository();
