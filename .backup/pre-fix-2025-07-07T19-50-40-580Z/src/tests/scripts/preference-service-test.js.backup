/**
 * Preference Service Test
 * 
 * Tests the refactored preference service with the MongoDB model abstraction layer
 */

require('@src/services\preference.service');
require('@src/data');
require('@src/utils');
const fs = require('fs');
const path = require('path');

// Test configurations
const TEST_USER_ID = 'user123'; // Using test ID from test files

/**
 * Test creating and retrieving preferences
 */
async function testCreateAndRetrieve() {
  logger.info('Testing create and retrieve preferences...');
  
  try {
    // Create default preferences
    const preferences = await preferenceService.createUserPreferences(TEST_USER_ID);
    logger.info(`Created preferences for user: ${TEST_USER_ID}`);
    
    // Verify preferences structure
    if (preferences && 
        preferences.theme === 'light' && 
        preferences.notifications && 
        preferences.notifications.email === true) {
      logger.info('✅ Create and retrieve test passed');
    } else {
      logger.error('❌ Create and retrieve test failed - data mismatch');
    }
    
    return preferences;
  } catch (error) {
    logger.error('Error in create and retrieve test', { error: error.message });
    throw error;
  }
}

/**
 * Test updating preferences
 */
async function testUpdate() {
  logger.info('Testing update preferences...');
  
  try {
    // Update preferences
    const updates = {
      theme: 'dark',
      notifications: {
        email: false
      }
    };
    
    const updated = await preferenceService.updateUserPreferences(TEST_USER_ID, updates);
    logger.info(`Updated preferences for user: ${TEST_USER_ID}`);
    
    // Verify updates
    if (updated && 
        updated.theme === 'dark' && 
        updated.notifications && 
        updated.notifications.email === false) {
      logger.info('✅ Update test passed');
    } else {
      logger.error('❌ Update test failed - updates not applied correctly');
    }
  } catch (error) {
    logger.error('Error in update test', { error: error.message });
    throw error;
  }
}

/**
 * Test getting specific preference
 */
async function testGetPreference() {
  logger.info('Testing get specific preference...');
  
  try {
    // Get specific preference
    const pref1 = await preferenceService.getPreference(TEST_USER_ID, 'theme');
    logger.info(`Got preference theme: ${pref1.value}`);
    
    // Get nested preference
    const pref2 = await preferenceService.getPreference(TEST_USER_ID, 'notifications.email');
    logger.info(`Got preference notifications.email: ${pref2.value}`);
    
    // Verify preferences
    if (pref1 && pref1.value === 'dark' && 
        pref2 && pref2.value === false) {
      logger.info('✅ Get preference test passed');
    } else {
      logger.error('❌ Get preference test failed - incorrect values');
    }
  } catch (error) {
    logger.error('Error in get preference test', { error: error.message });
    throw error;
  }
}

/**
 * Test setting specific preference value
 */
async function testSetPreferenceValue() {
  logger.info('Testing set preference value...');
  
  try {
    // Set specific preference
    await preferenceService.setPreferenceValue(TEST_USER_ID, 'theme', 'blue');
    logger.info(`Set preference theme: blue`);
    
    // Set nested preference
    await preferenceService.setPreferenceValue(TEST_USER_ID, 'accessibility.highContrast', true);
    logger.info(`Set preference accessibility.highContrast: true`);
    
    // Verify values
    const theme = await preferenceService.getPreferenceValue(TEST_USER_ID, 'theme');
    const highContrast = await preferenceService.getPreferenceValue(TEST_USER_ID, 'accessibility.highContrast');
    
    if (theme === 'blue' && highContrast === true) {
      logger.info('✅ Set preference value test passed');
    } else {
      logger.error('❌ Set preference value test failed - values not set correctly');
    }
  } catch (error) {
    logger.error('Error in set preference value test', { error: error.message });
    throw error;
  }
}

/**
 * Test resetting preferences
 */
async function testReset() {
  logger.info('Testing reset preferences...');
  
  try {
    // Reset preferences
    const reset = await preferenceService.resetUserPreferences(TEST_USER_ID);
    logger.info(`Reset preferences for user: ${TEST_USER_ID}`);
    
    // Verify reset
    if (reset && 
        reset.theme === 'light' && 
        reset.notifications && 
        reset.notifications.email === true) {
      logger.info('✅ Reset test passed');
    } else {
      logger.error('❌ Reset test failed - preferences not reset to defaults');
    }
  } catch (error) {
    logger.error('Error in reset test', { error: error.message });
    throw error;
  }
}

/**
 * Test deleting preferences
 */
async function testDelete() {
  logger.info('Testing delete preferences...');
  
  try {
    // Delete preferences
    const deleted = await preferenceService.deleteUserPreferences(TEST_USER_ID);
    logger.info(`Delete result: ${deleted}`);
    
    // Try to get preferences (should create defaults)
    const prefs = await preferenceService.getUserPreferences(TEST_USER_ID);
    
    // Verify deletion and recreation
    if (deleted === true && 
        prefs && 
        prefs.theme === 'light') {
      logger.info('✅ Delete test passed');
    } else {
      logger.error('❌ Delete test failed');
    }
  } catch (error) {
    logger.error('Error in delete test', { error: error.message });
    throw error;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  try {
    logger.info('Starting preference service tests...');
    
    // Connect to database
    await databaseService.connect();
    logger.info('Connected to database');
    
    // Run tests
    await testCreateAndRetrieve();
    await testUpdate();
    await testGetPreference();
    await testSetPreferenceValue();
    await testReset();
    await testDelete();
    
    // Disconnect from database
    await databaseService.disconnect();
    logger.info('Disconnected from database');
    
    logger.info('All preference service tests completed');
    
    // Save test results to file
    const testResultsDir = path.join(__dirname, '..', '..', '..', 'test-results');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(testResultsDir)) {
      fs.mkdirSync(testResultsDir, { recursive: true });
    }
    
    // Write test results
    fs.writeFileSync(
      path.join(testResultsDir, 'manual-test-results.txt'),
      `Preference Service Test Results\n` +
      `Timestamp: ${new Date().toISOString()}\n` +
      `Status: Completed\n` +
      `Tests: Create, Retrieve, Update, Get, Set, Reset, Delete\n`
    );
    
    process.exit(0);
  } catch (error) {
    logger.error('Error running preference service tests', { error: error.message });
    
    // Try to disconnect even if tests fail
    try {
      await databaseService.disconnect();
    } catch (disconnectError) {
      logger.error('Error during disconnect', { error: disconnectError.message });
    }
    
    process.exit(1);
  }
}

// Run tests
runTests();
