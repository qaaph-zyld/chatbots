/**
 * Preference Service
 * 
 * Service for managing user preferences in the chatbot platform
 */

const { logger } = require('../utils');
const Preference = require('../models/preference.model');

/**
 * Get user preferences
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User preferences
 */
const getUserPreferences = async (userId) => {
  try {
    let preferences = await Preference.findOne({ userId });
    
    if (!preferences) {
      // Create default preferences if not found
      preferences = await createUserPreferences(userId);
    }
    
    return preferences;
  } catch (error) {
    logger.error('Error getting user preferences', { error, userId });
    throw error;
  }
};

/**
 * Create user preferences with defaults
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Created preferences
 */
const createUserPreferences = async (userId) => {
  try {
    const defaultPreferences = {
      userId,
      theme: 'light',
      language: 'en',
      notifications: {
        email: true,
        push: true,
        inApp: true
      },
      accessibility: {
        fontSize: 'medium',
        highContrast: false,
        reducedMotion: false
      },
      privacy: {
        shareUsageData: true,
        allowCookies: true
      },
      chatInterface: {
        showTimestamps: true,
        showAvatars: true,
        messageGrouping: true,
        soundEffects: true
      }
    };
    
    const preferences = new Preference(defaultPreferences);
    await preferences.save();
    
    logger.info('Created default preferences for user', { userId });
    return preferences;
  } catch (error) {
    logger.error('Error creating user preferences', { error, userId });
    throw error;
  }
};

/**
 * Update user preferences
 * @param {string} userId - User ID
 * @param {Object} updates - Preference updates
 * @returns {Promise<Object>} Updated preferences
 */
const updateUserPreferences = async (userId, updates) => {
  try {
    let preferences = await Preference.findOne({ userId });
    
    if (!preferences) {
      // Create with provided updates if not found
      preferences = new Preference({
        userId,
        ...updates
      });
    } else {
      // Apply updates to existing preferences
      Object.keys(updates).forEach(key => {
        if (key !== 'userId') {
          if (typeof updates[key] === 'object' && updates[key] !== null) {
            preferences[key] = { ...preferences[key], ...updates[key] };
          } else {
            preferences[key] = updates[key];
          }
        }
      });
    }
    
    await preferences.save();
    logger.info('Updated user preferences', { userId });
    return preferences;
  } catch (error) {
    logger.error('Error updating user preferences', { error, userId });
    throw error;
  }
};

/**
 * Reset user preferences to defaults
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Reset preferences
 */
const resetUserPreferences = async (userId) => {
  try {
    await Preference.findOneAndDelete({ userId });
    return createUserPreferences(userId);
  } catch (error) {
    logger.error('Error resetting user preferences', { error, userId });
    throw error;
  }
};

/**
 * Get a specific preference
 * @param {string} userId - User ID
 * @param {string} key - Preference key
 * @returns {Promise<Object>} Preference object with key and value
 */
const getPreference = async (userId, key) => {
  try {
    const preferences = await getUserPreferences(userId);
    
    // Handle dot notation (e.g., 'notifications.email')
    if (key.includes('.')) {
      const parts = key.split('.');
      let value = preferences;
      
      for (const part of parts) {
        if (value && typeof value === 'object') {
          value = value[part];
        } else {
          return null;
        }
      }
      
      return { key, value };
    }
    
    return { key, value: preferences[key] };
  } catch (error) {
    logger.error('Error getting preference', { error, userId, key });
    throw error;
  }
};

/**
 * Get specific preference value
 * @param {string} userId - User ID
 * @param {string} key - Preference key (dot notation supported)
 * @returns {Promise<any>} Preference value
 */
const getPreferenceValue = async (userId, key) => {
  try {
    const preferences = await getUserPreferences(userId);
    
    // Handle dot notation (e.g., 'notifications.email')
    if (key.includes('.')) {
      const parts = key.split('.');
      let value = preferences;
      
      for (const part of parts) {
        if (value && typeof value === 'object') {
          value = value[part];
        } else {
          return null;
        }
      }
      
      return value;
    }
    
    return preferences[key];
  } catch (error) {
    logger.error('Error getting preference value', { error, userId, key });
    throw error;
  }
};

/**
 * Set specific preference value
 * @param {string} userId - User ID
 * @param {string} key - Preference key (dot notation supported)
 * @param {any} value - Preference value
 * @returns {Promise<Object>} Updated preferences
 */
const setPreferenceValue = async (userId, key, value) => {
  try {
    // Handle dot notation (e.g., 'notifications.email')
    if (key.includes('.')) {
      const parts = key.split('.');
      const updates = {};
      let current = updates;
      
      for (let i = 0; i < parts.length - 1; i++) {
        current[parts[i]] = {};
        current = current[parts[i]];
      }
      
      current[parts[parts.length - 1]] = value;
      return updateUserPreferences(userId, updates);
    }
    
    // Simple key
    const updates = { [key]: value };
    return updateUserPreferences(userId, updates);
  } catch (error) {
    logger.error('Error setting preference value', { error, userId, key });
    throw error;
  }
};

/**
 * Delete user preferences
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if deleted
 */
const deleteUserPreferences = async (userId) => {
  try {
    const result = await Preference.findOneAndDelete({ userId });
    
    if (!result) {
      logger.warn('No preferences found to delete', { userId });
      return false;
    }
    
    logger.info('Deleted user preferences', { userId });
    return true;
  } catch (error) {
    logger.error('Error deleting user preferences', { error, userId });
    throw error;
  }
};

module.exports = {
  getUserPreferences,
  createUserPreferences,
  updateUserPreferences,
  resetUserPreferences,
  getPreference,
  getPreferenceValue,
  setPreferenceValue,
  deleteUserPreferences
};
