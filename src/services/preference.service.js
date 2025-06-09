/**
 * Preference Service
 * 
 * Service for managing user preferences in the chatbot platform
 * Refactored to use the repository pattern
 */

require('@src/data');
require('@src/utils');

/**
 * Get user preferences
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User preferences
 */
const getUserPreferences = async (userId) => {
  try {
    // Ensure database connection
    await databaseService.connect();
    
    // Get preference repository
    const preferenceRepo = repositories.preference;
    
    // Get user preferences by category
    const preferences = await preferenceRepo.getByUserId(userId, { lean: true });
    
    if (preferences.length === 0) {
      // Create default preferences if not found
      return await createUserPreferences(userId);
    }
    
    // Transform to structured object
    const result = {
      userId
    };
    
    // Group preferences by category and key
    preferences.forEach(pref => {
      if (!result[pref.category]) {
        result[pref.category] = {};
      }
      result[pref.category][pref.key] = pref.value;
    });
    
    return result;
  } catch (error) {
    logger.error('Error getting user preferences', { error: error.message, userId });
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
    // Ensure database connection
    await databaseService.connect();
    
    // Get preference repository
    const preferenceRepo = repositories.preference;
    
    // Define default preferences
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
        shareData: false,
        saveHistory: true
      },
      chatSettings: {
        autoSend: true,
        enterToSend: true,
        showTimestamps: true
      }
    };
    
    // Start a transaction for batch creation
    const session = await preferenceRepo.startTransaction();
    
    try {
      // Create preference entries for each category and key
      const preferences = [];
      
      // Process each category
      for (const [category, values] of Object.entries(defaultPreferences)) {
        // Skip userId as it's not a preference category
        if (category === 'userId') continue;
        
        if (typeof values === 'object') {
          // Process nested preferences
          for (const [key, value] of Object.entries(values)) {
            const pref = await preferenceRepo.setPreference(
              userId, category, key, value, 
              { 
                source: 'explicit', 
                confidence: 1.0, 
                metadata: { userId, createdAt: new Date() },
                session
              }
            );
            preferences.push(pref);
          }
        } else {
          // Process direct preferences
          const pref = await preferenceRepo.setPreference(
            userId, 'general', category, values, 
            { 
              source: 'explicit', 
              confidence: 1.0, 
              metadata: { userId, createdAt: new Date() },
              session
            }
          );
          preferences.push(pref);
        }
      }
      
      // Commit transaction
      await preferenceRepo.commitTransaction(session);
      
      logger.info('Created default preferences for user', { userId });
      
      // Return structured preferences object
      return getUserPreferences(userId);
    } catch (error) {
      // Abort transaction on error
      await preferenceRepo.abortTransaction(session);
      throw error;
    }
  } catch (error) {
    logger.error('Error creating user preferences', { error: error.message, userId });
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
    // Ensure database connection
    await databaseService.connect();
    
    // Get preference repository
    const preferenceRepo = repositories.preference;
    
    // Start a transaction
    const session = await preferenceRepo.startTransaction();
    
    try {
      // Process each update
      const updatedPrefs = [];
      
      for (const [category, values] of Object.entries(updates)) {
        // Skip userId as it's not a preference category
        if (category === 'userId' || category === '_id') continue;
        
        if (typeof values === 'object') {
          // Process nested preferences
          for (const [key, value] of Object.entries(values)) {
            const pref = await preferenceRepo.setPreference(
              userId, category, key, value, 
              { 
                source: 'explicit', 
                confidence: 1.0, 
                metadata: { userId, updatedAt: new Date() },
                session
              }
            );
            updatedPrefs.push(pref);
          }
        } else {
          // Process direct preferences
          const pref = await preferenceRepo.setPreference(
            userId, 'general', category, values, 
            { 
              source: 'explicit', 
              confidence: 1.0, 
              metadata: { userId, updatedAt: new Date() },
              session
            }
          );
          updatedPrefs.push(pref);
        }
      }
      
      // Commit transaction
      await preferenceRepo.commitTransaction(session);
      
      logger.info('Updated user preferences', { userId, count: updatedPrefs.length });
      
      // Return updated preferences
      return getUserPreferences(userId);
    } catch (error) {
      // Abort transaction on error
      await preferenceRepo.abortTransaction(session);
      throw error;
    }
  } catch (error) {
    logger.error('Error updating user preferences', { error: error.message, userId });
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
    // Ensure database connection
    await databaseService.connect();
    
    // Handle dot notation (e.g., 'notifications.email')
    if (key.includes('.')) {
      const parts = key.split('.');
      const category = parts[0];
      const prefKey = parts[1];
      
      // Get preference repository
      const preferenceRepo = repositories.preference;
      
      // Get specific preference
      const preference = await preferenceRepo.getPreference(userId, category, prefKey);
      
      if (!preference) {
        return null;
      }
      
      return {
        key,
        value: preference.value
      };
    } else {
      // For top-level keys, get all preferences and extract the value
      const preferences = await getUserPreferences(userId);
      
      return {
        key,
        value: preferences[key]
      };
    }
  } catch (error) {
    logger.error('Error getting preference', { error: error.message, userId, key });
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
    const preference = await getPreference(userId, key);
    return preference ? preference.value : null;
  } catch (error) {
    logger.error('Error getting preference value', { error: error.message, userId, key });
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
    // Ensure database connection
    await databaseService.connect();
    
    // Get preference repository
    const preferenceRepo = repositories.preference;
    
    // Handle dot notation (e.g., 'notifications.email')
    if (key.includes('.')) {
      const parts = key.split('.');
      const category = parts[0];
      const prefKey = parts[1];
      
      // Set the preference
      await preferenceRepo.setPreference(
        userId, category, prefKey, value, 
        { 
          source: 'explicit', 
          confidence: 1.0, 
          metadata: { userId, updatedAt: new Date() }
        }
      );
    } else {
      // For top-level keys, set as general preference
      await preferenceRepo.setPreference(
        userId, 'general', key, value, 
        { 
          source: 'explicit', 
          confidence: 1.0, 
          metadata: { userId, updatedAt: new Date() }
        }
      );
    }
    
    logger.info('Updated preference value', { userId, key });
    
    // Return updated preferences
    return getUserPreferences(userId);
  } catch (error) {
    logger.error('Error setting preference value', { error: error.message, userId, key });
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
    // Ensure database connection
    await databaseService.connect();
    
    // Get preference repository
    const preferenceRepo = repositories.preference;
    
    // Delete all user preferences
    await preferenceRepo.deleteAllUserPreferences(userId);
    
    // Create new default preferences
    const preferences = await createUserPreferences(userId);
    
    logger.info('Reset user preferences to defaults', { userId });
    return preferences;
  } catch (error) {
    logger.error('Error resetting user preferences', { error: error.message, userId });
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
    // Ensure database connection
    await databaseService.connect();
    
    // Get preference repository
    const preferenceRepo = repositories.preference;
    
    // Delete all user preferences
    await preferenceRepo.deleteAllUserPreferences(userId);
    
    logger.info('Deleted user preferences', { userId });
    return true;
  } catch (error) {
    logger.error('Error deleting user preferences', { error: error.message, userId });
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
