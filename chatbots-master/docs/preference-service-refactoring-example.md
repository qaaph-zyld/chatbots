# Preference Service Refactoring Example

This document provides a detailed example of refactoring the preference service to use the MongoDB data abstraction layer with the repository pattern.

## Before: Direct Model Usage

```javascript
const Preference = require('../models/preference.model');
const logger = require('../utils/logger');

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
 * Set specific preference value
 * @param {string} userId - User ID
 * @param {string} key - Preference key (dot notation supported)
 * @param {any} value - Preference value
 * @returns {Promise<Object>} Updated preferences
 */
const setPreferenceValue = async (userId, key, value) => {
  try {
    const preferences = await getUserPreferences(userId);
    
    // Handle dot notation (e.g., 'notifications.email')
    if (key.includes('.')) {
      const parts = key.split('.');
      let target = preferences;
      
      // Navigate to the nested object
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        
        if (!(part in target) || typeof target[part] !== 'object') {
          target[part] = {};
        }
        
        target = target[part];
      }
      
      // Set the value
      const lastPart = parts[parts.length - 1];
      target[lastPart] = value;
    } else {
      // Set top-level preference
      preferences[key] = value;
    }
    
    // Save updated preferences
    await preferences.save();
    
    logger.info('Updated preference value', { userId, key });
    return preferences;
  } catch (error) {
    logger.error('Error setting preference value', { error, userId, key });
    throw error;
  }
};
```

## After: Repository Pattern Usage

```javascript
const { databaseService, repositories } = require('../data');
const { logger } = require('../utils');

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
```

## Key Improvements

1. **Structured Data Model**: The refactored code uses a more structured data model with categories and keys, making it easier to manage and query preferences.

2. **Transaction Support**: The refactored code uses transactions for batch operations, ensuring data consistency.

3. **Caching**: The repository handles caching automatically, improving performance for frequently accessed preferences.

4. **Optimized Queries**: The repository uses optimized queries with proper indexing for better performance.

5. **Separation of Concerns**: Data access logic is isolated in the repository, making the service more focused on business logic.

6. **Consistent Error Handling**: Error handling is consistent across all repository operations.

7. **Metadata Support**: The refactored code supports additional metadata for preferences, such as confidence scores and sources.

## Migration Considerations

When refactoring an existing preference service:

1. **Data Migration**: You may need to migrate existing preference data to the new structure with categories and keys.

2. **API Compatibility**: Ensure the refactored service maintains the same API for backward compatibility.

3. **Testing**: Thoroughly test the refactored service to ensure it behaves the same as the original.

4. **Gradual Rollout**: Consider a gradual rollout to minimize disruption to the application.
