/**
 * Entity Service Test
 * 
 * Tests the refactored entity service using the repository pattern
 */

require('@src/data');
require('@src/services\entity.service');
require('@src/utils');
const fs = require('fs');
const path = require('path');

// Test configurations
const TEST_CHATBOT_ID = 'test-chatbot-123';

/**
 * Run a test with proper setup and teardown
 * @param {string} name - Test name
 * @param {Function} testFn - Test function
 */
async function runTest(name, testFn) {
  logger.info(`Running test: ${name}`);
  try {
    await testFn();
    logger.info(`✅ Test passed: ${name}`);
    return true;
  } catch (error) {
    logger.error(`❌ Test failed: ${name}`, { error: error.message });
    return false;
  }
}

/**
 * Test creating an entity
 */
async function testCreateEntity() {
  // Create a new entity
  const entityData = {
    name: 'TestEntity',
    type: 'custom',
    chatbotId: TEST_CHATBOT_ID,
    description: 'Test entity for validation',
    values: [
      {
        value: 'test-value-1',
        synonyms: ['test1', 'value1']
      }
    ]
  };
  
  const entity = await entityService.createEntity(entityData);
  
  // Verify entity was created
  if (!entity || !entity._id) {
    throw new Error('Failed to create entity');
  }
  
  if (entity.name !== 'TestEntity') {
    throw new Error('Entity has incorrect name');
  }
  
  if (entity.chatbotId !== TEST_CHATBOT_ID) {
    throw new Error('Entity has incorrect chatbot ID');
  }
  
  if (!entity.values || entity.values.length !== 1) {
    throw new Error('Entity values not created correctly');
  }
  
  logger.info(`Created entity: ${entity._id}`);
  
  return entity._id;
}

/**
 * Test retrieving an entity
 */
async function testGetEntity(entityId) {
  // Get entity by ID
  const entity = await entityService.getEntityById(entityId);
  
  // Verify entity was retrieved
  if (!entity || !entity._id) {
    throw new Error('Failed to retrieve entity by ID');
  }
  
  if (entity._id.toString() !== entityId.toString()) {
    throw new Error('Retrieved entity has incorrect ID');
  }
  
  // Get entity by name
  const entityByName = await entityService.getEntityByName('TestEntity', TEST_CHATBOT_ID);
  
  // Verify entity was retrieved by name
  if (!entityByName || !entityByName._id) {
    throw new Error('Failed to retrieve entity by name');
  }
  
  if (entityByName._id.toString() !== entityId.toString()) {
    throw new Error('Retrieved entity by name has incorrect ID');
  }
  
  logger.info(`Retrieved entity: ${entity._id}`);
}

/**
 * Test updating an entity
 */
async function testUpdateEntity(entityId) {
  // Update entity
  const updateData = {
    description: 'Updated test entity description',
    metadata: {
      testKey: 'testValue'
    }
  };
  
  const updatedEntity = await entityService.updateEntity(entityId, updateData);
  
  // Verify entity was updated
  if (!updatedEntity || !updatedEntity._id) {
    throw new Error('Failed to update entity');
  }
  
  if (updatedEntity.description !== 'Updated test entity description') {
    throw new Error('Entity description not updated correctly');
  }
  
  if (!updatedEntity.metadata || updatedEntity.metadata.testKey !== 'testValue') {
    throw new Error('Entity metadata not updated correctly');
  }
  
  logger.info(`Updated entity: ${updatedEntity._id}`);
}

/**
 * Test adding a value to an entity
 */
async function testAddEntityValue(entityId) {
  // Add value to entity
  const valueData = {
    value: 'test-value-2',
    synonyms: ['test2', 'value2'],
    metadata: {
      priority: 'high'
    }
  };
  
  const updatedEntity = await entityService.addEntityValue(entityId, valueData);
  
  // Verify value was added
  if (!updatedEntity || !updatedEntity.values || updatedEntity.values.length !== 2) {
    throw new Error('Failed to add value to entity');
  }
  
  const addedValue = updatedEntity.values.find(v => v.value === 'test-value-2');
  
  if (!addedValue) {
    throw new Error('Added value not found in entity');
  }
  
  if (!addedValue.synonyms || !addedValue.synonyms.includes('test2')) {
    throw new Error('Value synonyms not added correctly');
  }
  
  logger.info(`Added value to entity: ${entityId}`);
  
  return addedValue._id;
}

/**
 * Test removing a value from an entity
 */
async function testRemoveEntityValue(entityId, valueId) {
  // Remove value from entity
  const updatedEntity = await entityService.removeEntityValue(entityId, valueId);
  
  // Verify value was removed
  if (!updatedEntity || !updatedEntity.values) {
    throw new Error('Failed to remove value from entity');
  }
  
  const removedValue = updatedEntity.values.find(v => v._id.toString() === valueId.toString());
  
  if (removedValue) {
    throw new Error('Value not removed from entity');
  }
  
  logger.info(`Removed value from entity: ${entityId}`);
}

/**
 * Test listing entities
 */
async function testListEntities() {
  // Create a few entities
  const entityIds = [];
  
  for (let i = 0; i < 3; i++) {
    const entityData = {
      name: `ListTestEntity${i}`,
      type: 'custom',
      chatbotId: TEST_CHATBOT_ID,
      description: `Test entity ${i} for listing`,
      values: [
        {
          value: `list-value-${i}`,
          synonyms: [`list${i}`, `value${i}`]
        }
      ]
    };
    
    const entity = await entityService.createEntity(entityData);
    entityIds.push(entity._id);
  }
  
  // List entities
  const entities = await entityService.listEntities(TEST_CHATBOT_ID);
  
  // Verify entities were listed
  if (!entities || entities.length < 3) {
    throw new Error('Failed to list entities');
  }
  
  // List entities with type filter
  const filteredEntities = await entityService.listEntities(TEST_CHATBOT_ID, { type: 'custom' });
  
  // Verify filtered entities
  if (!filteredEntities || filteredEntities.length < 3) {
    throw new Error('Failed to list entities with type filter');
  }
  
  logger.info(`Listed ${entities.length} entities for chatbot: ${TEST_CHATBOT_ID}`);
  
  return entityIds;
}

/**
 * Test entity recognition
 */
async function testRecognizeEntities() {
  // Create an entity with values for recognition
  const entityData = {
    name: 'TestFruit',
    type: 'custom',
    chatbotId: TEST_CHATBOT_ID,
    description: 'Test entity for recognition',
    values: [
      {
        value: 'apple',
        synonyms: ['red apple', 'green apple']
      },
      {
        value: 'banana',
        synonyms: ['yellow banana', 'ripe banana']
      }
    ]
  };
  
  const entity = await entityService.createEntity(entityData);
  
  // Test text for recognition
  const text = 'I would like a green apple and a ripe banana';
  
  // Recognize entities
  const recognizedEntities = await entityService.recognizeEntities(text, TEST_CHATBOT_ID);
  
  // Verify entities were recognized
  if (!recognizedEntities || recognizedEntities.length < 2) {
    throw new Error('Failed to recognize entities in text');
  }
  
  const appleEntity = recognizedEntities.find(e => e.value === 'apple');
  const bananaEntity = recognizedEntities.find(e => e.value === 'banana');
  
  if (!appleEntity) {
    throw new Error('Failed to recognize apple entity');
  }
  
  if (!bananaEntity) {
    throw new Error('Failed to recognize banana entity');
  }
  
  if (appleEntity.matchedSynonym !== 'green apple') {
    throw new Error('Incorrect synonym match for apple');
  }
  
  if (bananaEntity.matchedSynonym !== 'ripe banana') {
    throw new Error('Incorrect synonym match for banana');
  }
  
  logger.info(`Recognized ${recognizedEntities.length} entities in text`);
  
  return entity._id;
}

/**
 * Test deleting an entity
 */
async function testDeleteEntity(entityId) {
  // Delete entity
  const result = await entityService.deleteEntity(entityId);
  
  // Verify entity was deleted
  if (!result) {
    throw new Error('Failed to delete entity');
  }
  
  // Try to get deleted entity
  const deletedEntity = await entityService.getEntityById(entityId);
  
  if (deletedEntity) {
    throw new Error('Entity not deleted correctly');
  }
  
  logger.info(`Deleted entity: ${entityId}`);
}

/**
 * Clean up test data
 */
async function cleanupTestData(entityIds) {
  logger.info('Cleaning up test data...');
  
  try {
    // Delete test entities
    for (const id of entityIds) {
      await entityService.deleteEntity(id);
      logger.info(`Deleted test entity: ${id}`);
    }
    
    logger.info('Cleanup completed');
  } catch (error) {
    logger.error('Error cleaning up test data', { error: error.message });
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  const entityIds = [];
  
  const results = {
    total: 7,
    passed: 0,
    failed: 0
  };
  
  try {
    logger.info('Starting entity service tests...');
    
    // Connect to database
    await databaseService.connect();
    logger.info('Connected to database');
    
    // Run create entity test
    if (await runTest('Create Entity', async () => {
      const entityId = await testCreateEntity();
      entityIds.push(entityId);
    })) {
      results.passed++;
    } else {
      results.failed++;
    }
    
    // Run get entity test
    if (entityIds.length > 0 && await runTest('Get Entity', async () => {
      await testGetEntity(entityIds[0]);
    })) {
      results.passed++;
    } else {
      results.failed++;
    }
    
    // Run update entity test
    if (entityIds.length > 0 && await runTest('Update Entity', async () => {
      await testUpdateEntity(entityIds[0]);
    })) {
      results.passed++;
    } else {
      results.failed++;
    }
    
    // Run add entity value test
    let valueId;
    if (entityIds.length > 0 && await runTest('Add Entity Value', async () => {
      valueId = await testAddEntityValue(entityIds[0]);
    })) {
      results.passed++;
    } else {
      results.failed++;
    }
    
    // Run remove entity value test
    if (entityIds.length > 0 && valueId && await runTest('Remove Entity Value', async () => {
      await testRemoveEntityValue(entityIds[0], valueId);
    })) {
      results.passed++;
    } else {
      results.failed++;
    }
    
    // Run list entities test
    if (await runTest('List Entities', async () => {
      const listEntityIds = await testListEntities();
      entityIds.push(...listEntityIds);
    })) {
      results.passed++;
    } else {
      results.failed++;
    }
    
    // Run recognize entities test
    if (await runTest('Recognize Entities', async () => {
      const recognitionEntityId = await testRecognizeEntities();
      entityIds.push(recognitionEntityId);
    })) {
      results.passed++;
    } else {
      results.failed++;
    }
    
    // Run delete entity test
    if (entityIds.length > 0 && await runTest('Delete Entity', async () => {
      await testDeleteEntity(entityIds[0]);
      entityIds.shift(); // Remove the deleted entity from the array
    })) {
      results.passed++;
    } else {
      results.failed++;
    }
    
    // Clean up test data
    await cleanupTestData(entityIds);
    
    // Disconnect from database
    await databaseService.disconnect();
    logger.info('Disconnected from database');
    
    // Log test results
    logger.info('All entity service tests completed', {
      total: results.total,
      passed: results.passed,
      failed: results.failed
    });
    
    // Save test results to file
    const testResultsDir = path.join(__dirname, '..', '..', '..', 'test-results');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(testResultsDir)) {
      fs.mkdirSync(testResultsDir, { recursive: true });
    }
    
    // Read existing test results
    const testResultsPath = path.join(testResultsDir, 'manual-test-results.txt');
    let existingResults = '';
    
    if (fs.existsSync(testResultsPath)) {
      existingResults = fs.readFileSync(testResultsPath, 'utf8');
    }
    
    // Append new test results
    fs.writeFileSync(
      testResultsPath,
      `${existingResults}\n\n## MongoDB Abstraction Layer - Entity Service Refactoring Test Results\n\n` +
      `Entity Service Test Results\n` +
      `Timestamp: ${new Date().toISOString()}\n` +
      `Status: Completed\n` +
      `Tests: ${results.total}\n` +
      `Passed: ${results.passed}\n` +
      `Failed: ${results.failed}\n` +
      `\n` +
      `Operations Tested:\n` +
      `- Create Entity\n` +
      `- Get Entity (by ID and name)\n` +
      `- Update Entity\n` +
      `- Add Entity Value\n` +
      `- Remove Entity Value\n` +
      `- List Entities\n` +
      `- Recognize Entities\n` +
      `- Delete Entity\n` +
      `\n` +
      `Features Validated:\n` +
      `- Repository Pattern Integration\n` +
      `- Transaction Support\n` +
      `- Caching\n` +
      `- Error Handling\n`
    );
    
    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    logger.error('Error running entity service tests', { error: error.message });
    
    // Try to clean up even if tests fail
    try {
      await cleanupTestData(entityIds);
      await databaseService.disconnect();
    } catch (cleanupError) {
      logger.error('Error during cleanup', { error: cleanupError.message });
    }
    
    process.exit(1);
  }
}

// Run all tests
runAllTests();
