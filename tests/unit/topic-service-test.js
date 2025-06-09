/**
 * Topic Service Test
 * 
 * Tests the refactored topic service using the repository pattern
 */

const { databaseService } = require('../../data');
const topicService = require('../../services/topic.service');
const { logger } = require('../../utils');
const fs = require('fs');
const path = require('path');

// Test configurations
const TEST_CHATBOT_ID = 'test-chatbot-123';
const TEST_RESULTS_DIR = path.join(process.cwd(), 'test-results');

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
    logger.error(`❌ Test failed: ${name}`, { error: error.message, stack: error.stack });
    return false;
  }
}

/**
 * Save test results to file
 * @param {Object} results - Test results
 */
function saveTestResults(results) {
  if (!fs.existsSync(TEST_RESULTS_DIR)) {
    fs.mkdirSync(TEST_RESULTS_DIR, { recursive: true });
  }
  
  const resultsPath = path.join(TEST_RESULTS_DIR, 'manual-test-results.txt');
  const timestamp = new Date().toISOString();
  
  let content = `\n\n=== Topic Service Test Results (${timestamp}) ===\n`;
  content += `Total Tests: ${results.total}\n`;
  content += `Passed: ${results.passed}\n`;
  content += `Failed: ${results.failed}\n\n`;
  
  results.details.forEach(detail => {
    content += `${detail.success ? '✅' : '❌'} ${detail.name}\n`;
  });
  
  fs.writeFileSync(resultsPath, content, { flag: 'a' });
  logger.info(`Test results saved to ${resultsPath}`);
}

/**
 * Test creating a topic
 */
async function testCreateTopic() {
  // Create a new topic
  const topicData = {
    name: 'TestTopic',
    category: 'test',
    chatbotId: TEST_CHATBOT_ID,
    description: 'Test topic for validation',
    isActive: true,
    priority: 10,
    patterns: [
      {
        pattern: 'test pattern',
        type: 'keyword',
        isActive: true,
        confidence: 0.8
      }
    ],
    responses: [
      {
        text: 'This is a test response',
        isActive: true
      }
    ]
  };
  
  const topic = await topicService.createTopic(topicData);
  
  if (!topic) {
    throw new Error('Failed to create topic');
  }
  
  if (topic.name !== topicData.name) {
    throw new Error(`Topic name mismatch: ${topic.name} !== ${topicData.name}`);
  }
  
  logger.info('Created test topic', { topicId: topic._id });
  return topic._id;
}

/**
 * Test retrieving a topic by ID
 * @param {string} topicId - Topic ID
 */
async function testGetTopicById(topicId) {
  const topic = await topicService.getTopicById(topicId);
  
  if (!topic) {
    throw new Error(`Failed to get topic by ID: ${topicId}`);
  }
  
  if (topic._id.toString() !== topicId.toString()) {
    throw new Error(`Topic ID mismatch: ${topic._id} !== ${topicId}`);
  }
  
  logger.info('Retrieved topic by ID', { topicId });
}

/**
 * Test retrieving a topic by name
 * @param {string} name - Topic name
 */
async function testGetTopicByName(name) {
  const topic = await topicService.getTopicByName(name, TEST_CHATBOT_ID);
  
  if (!topic) {
    throw new Error(`Failed to get topic by name: ${name}`);
  }
  
  if (topic.name !== name) {
    throw new Error(`Topic name mismatch: ${topic.name} !== ${name}`);
  }
  
  logger.info('Retrieved topic by name', { name, topicId: topic._id });
}

/**
 * Test updating a topic
 * @param {string} topicId - Topic ID
 */
async function testUpdateTopic(topicId) {
  const updateData = {
    description: 'Updated test topic description',
    priority: 20
  };
  
  const topic = await topicService.updateTopic(topicId, updateData);
  
  if (!topic) {
    throw new Error(`Failed to update topic: ${topicId}`);
  }
  
  if (topic.description !== updateData.description) {
    throw new Error(`Topic description mismatch: ${topic.description} !== ${updateData.description}`);
  }
  
  if (topic.priority !== updateData.priority) {
    throw new Error(`Topic priority mismatch: ${topic.priority} !== ${updateData.priority}`);
  }
  
  logger.info('Updated topic', { topicId });
}

/**
 * Test adding a pattern to a topic
 * @param {string} topicId - Topic ID
 */
async function testAddTopicPattern(topicId) {
  const patternData = {
    pattern: 'new test pattern',
    type: 'regex',
    isActive: true,
    confidence: 0.9
  };
  
  const topic = await topicService.addTopicPattern(topicId, patternData);
  
  if (!topic) {
    throw new Error(`Failed to add pattern to topic: ${topicId}`);
  }
  
  const addedPattern = topic.patterns.find(p => p.pattern === patternData.pattern);
  
  if (!addedPattern) {
    throw new Error(`Pattern not found in topic: ${patternData.pattern}`);
  }
  
  logger.info('Added pattern to topic', { topicId, patternId: addedPattern._id });
  return addedPattern._id;
}

/**
 * Test adding a response to a topic
 * @param {string} topicId - Topic ID
 */
async function testAddTopicResponse(topicId) {
  const responseData = {
    text: 'This is a new test response',
    isActive: true
  };
  
  const topic = await topicService.addTopicResponse(topicId, responseData);
  
  if (!topic) {
    throw new Error(`Failed to add response to topic: ${topicId}`);
  }
  
  const addedResponse = topic.responses.find(r => r.text === responseData.text);
  
  if (!addedResponse) {
    throw new Error(`Response not found in topic: ${responseData.text}`);
  }
  
  logger.info('Added response to topic', { topicId, responseId: addedResponse._id });
  return addedResponse._id;
}

/**
 * Test removing a pattern from a topic
 * @param {string} topicId - Topic ID
 * @param {string} patternId - Pattern ID
 */
async function testRemoveTopicPattern(topicId, patternId) {
  const topic = await topicService.removeTopicPattern(topicId, patternId);
  
  if (!topic) {
    throw new Error(`Failed to remove pattern from topic: ${topicId}`);
  }
  
  const pattern = topic.patterns.find(p => p._id.toString() === patternId.toString());
  
  if (pattern) {
    throw new Error(`Pattern still exists in topic: ${patternId}`);
  }
  
  logger.info('Removed pattern from topic', { topicId, patternId });
}

/**
 * Test removing a response from a topic
 * @param {string} topicId - Topic ID
 * @param {string} responseId - Response ID
 */
async function testRemoveTopicResponse(topicId, responseId) {
  const topic = await topicService.removeTopicResponse(topicId, responseId);
  
  if (!topic) {
    throw new Error(`Failed to remove response from topic: ${topicId}`);
  }
  
  const response = topic.responses.find(r => r._id.toString() === responseId.toString());
  
  if (response) {
    throw new Error(`Response still exists in topic: ${responseId}`);
  }
  
  logger.info('Removed response from topic', { topicId, responseId });
}

/**
 * Test listing topics
 */
async function testListTopics() {
  // Create additional test topics for listing
  const topicData1 = {
    name: 'TestTopic1',
    category: 'test',
    chatbotId: TEST_CHATBOT_ID,
    isActive: true,
    priority: 5
  };
  
  const topicData2 = {
    name: 'TestTopic2',
    category: 'other',
    chatbotId: TEST_CHATBOT_ID,
    isActive: true,
    priority: 15
  };
  
  await topicService.createTopic(topicData1);
  await topicService.createTopic(topicData2);
  
  // Test listing all topics
  const allTopics = await topicService.listTopics(TEST_CHATBOT_ID);
  
  if (!allTopics || !Array.isArray(allTopics)) {
    throw new Error('Failed to list topics');
  }
  
  if (allTopics.length < 3) { // We created at least 3 topics
    throw new Error(`Expected at least 3 topics, got ${allTopics.length}`);
  }
  
  // Test listing with category filter
  const testCategoryTopics = await topicService.listTopics(TEST_CHATBOT_ID, { category: 'test' });
  
  if (!testCategoryTopics.every(t => t.category === 'test')) {
    throw new Error('Category filter not working correctly');
  }
  
  logger.info('Listed topics with filters', { 
    totalCount: allTopics.length,
    testCategoryCount: testCategoryTopics.length
  });
}

/**
 * Test topic detection
 */
async function testDetectTopics() {
  // Create topics with patterns for detection
  const greetingTopic = {
    name: 'Greeting',
    category: 'general',
    chatbotId: TEST_CHATBOT_ID,
    isActive: true,
    patterns: [
      { pattern: 'hello', type: 'keyword', isActive: true, confidence: 0.8 },
      { pattern: 'hi there', type: 'keyword', isActive: true, confidence: 0.9 }
    ]
  };
  
  const weatherTopic = {
    name: 'Weather',
    category: 'general',
    chatbotId: TEST_CHATBOT_ID,
    isActive: true,
    patterns: [
      { pattern: 'weather', type: 'keyword', isActive: true, confidence: 0.8 },
      { pattern: 'temperature', type: 'keyword', isActive: true, confidence: 0.7 }
    ]
  };
  
  await topicService.createTopic(greetingTopic);
  await topicService.createTopic(weatherTopic);
  
  // Test detection with greeting text
  const greetingText = 'Hello, how are you today?';
  const greetingDetection = await topicService.detectTopics(greetingText, TEST_CHATBOT_ID);
  
  if (!greetingDetection || !Array.isArray(greetingDetection) || greetingDetection.length === 0) {
    throw new Error('Failed to detect greeting topic');
  }
  
  if (greetingDetection[0].name !== 'Greeting') {
    throw new Error(`Expected 'Greeting' as top topic, got '${greetingDetection[0].name}'`);
  }
  
  // Test detection with weather text
  const weatherText = 'What is the weather like today?';
  const weatherDetection = await topicService.detectTopics(weatherText, TEST_CHATBOT_ID);
  
  if (!weatherDetection || !Array.isArray(weatherDetection) || weatherDetection.length === 0) {
    throw new Error('Failed to detect weather topic');
  }
  
  if (weatherDetection[0].name !== 'Weather') {
    throw new Error(`Expected 'Weather' as top topic, got '${weatherDetection[0].name}'`);
  }
  
  logger.info('Detected topics in text', {
    greetingTopics: greetingDetection.map(t => t.name),
    weatherTopics: weatherDetection.map(t => t.name)
  });
}

/**
 * Test deleting a topic
 * @param {string} topicId - Topic ID
 */
async function testDeleteTopic(topicId) {
  const result = await topicService.deleteTopic(topicId);
  
  if (!result) {
    throw new Error(`Failed to delete topic: ${topicId}`);
  }
  
  // Verify topic is deleted
  const topic = await topicService.getTopicById(topicId);
  
  if (topic) {
    throw new Error(`Topic still exists after deletion: ${topicId}`);
  }
  
  logger.info('Deleted topic', { topicId });
}

/**
 * Clean up test data
 * @param {Array<string>} topicIds - Array of topic IDs to clean up
 */
async function cleanupTestData(topicIds = []) {
  logger.info('Cleaning up test data');
  
  try {
    // Delete all test topics
    const topics = await topicService.listTopics(TEST_CHATBOT_ID);
    
    for (const topic of topics) {
      if (topic.chatbotId === TEST_CHATBOT_ID) {
        await topicService.deleteTopic(topic._id);
        logger.debug(`Cleaned up topic: ${topic._id}`);
      }
    }
    
    logger.info('Test data cleanup complete');
  } catch (error) {
    logger.warn('Error during test data cleanup', { error: error.message });
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('Starting Topic Service tests');
  logger.info('Starting Topic Service tests');
  
  // Set test database URI if not already set
  if (!process.env.MONGODB_URI && !process.env.DATABASE_URL) {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/chatbots-test';
    console.log('Using test database:', process.env.MONGODB_URI);
    logger.info('Using test database', { uri: process.env.MONGODB_URI });
  }
  
  // Connect to database
  try {
    console.log('Connecting to database...');
    await databaseService.connect();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection error:', error.message);
    return;
  }
  
  const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    details: []
  };
  
  // Clean up any existing test data
  await cleanupTestData();
  
  // Store test topic IDs
  let topicId;
  let patternId;
  let responseId;
  
  // Run tests
  try {
    // Test 1: Create Topic
    const createTest = await runTest('Create Topic', async () => {
      topicId = await testCreateTopic();
    });
    testResults.total++;
    testResults.details.push({ name: 'Create Topic', success: createTest });
    if (createTest) testResults.passed++; else testResults.failed++;
    
    if (topicId) {
      // Test 2: Get Topic by ID
      const getByIdTest = await runTest('Get Topic by ID', async () => {
        await testGetTopicById(topicId);
      });
      testResults.total++;
      testResults.details.push({ name: 'Get Topic by ID', success: getByIdTest });
      if (getByIdTest) testResults.passed++; else testResults.failed++;
      
      // Test 3: Get Topic by Name
      const getByNameTest = await runTest('Get Topic by Name', async () => {
        await testGetTopicByName('TestTopic');
      });
      testResults.total++;
      testResults.details.push({ name: 'Get Topic by Name', success: getByNameTest });
      if (getByNameTest) testResults.passed++; else testResults.failed++;
      
      // Test 4: Update Topic
      const updateTest = await runTest('Update Topic', async () => {
        await testUpdateTopic(topicId);
      });
      testResults.total++;
      testResults.details.push({ name: 'Update Topic', success: updateTest });
      if (updateTest) testResults.passed++; else testResults.failed++;
      
      // Test 5: Add Topic Pattern
      const addPatternTest = await runTest('Add Topic Pattern', async () => {
        patternId = await testAddTopicPattern(topicId);
      });
      testResults.total++;
      testResults.details.push({ name: 'Add Topic Pattern', success: addPatternTest });
      if (addPatternTest) testResults.passed++; else testResults.failed++;
      
      // Test 6: Add Topic Response
      const addResponseTest = await runTest('Add Topic Response', async () => {
        responseId = await testAddTopicResponse(topicId);
      });
      testResults.total++;
      testResults.details.push({ name: 'Add Topic Response', success: addResponseTest });
      if (addResponseTest) testResults.passed++; else testResults.failed++;
    }
    
    // Test 7: List Topics
    const listTest = await runTest('List Topics', async () => {
      await testListTopics();
    });
    testResults.total++;
    testResults.details.push({ name: 'List Topics', success: listTest });
    if (listTest) testResults.passed++; else testResults.failed++;
    
    // Test 8: Detect Topics
    const detectTest = await runTest('Detect Topics', async () => {
      await testDetectTopics();
    });
    testResults.total++;
    testResults.details.push({ name: 'Detect Topics', success: detectTest });
    if (detectTest) testResults.passed++; else testResults.failed++;
    
    if (topicId) {
      if (patternId) {
        // Test 9: Remove Topic Pattern
        const removePatternTest = await runTest('Remove Topic Pattern', async () => {
          await testRemoveTopicPattern(topicId, patternId);
        });
        testResults.total++;
        testResults.details.push({ name: 'Remove Topic Pattern', success: removePatternTest });
        if (removePatternTest) testResults.passed++; else testResults.failed++;
      }
      
      if (responseId) {
        // Test 10: Remove Topic Response
        const removeResponseTest = await runTest('Remove Topic Response', async () => {
          await testRemoveTopicResponse(topicId, responseId);
        });
        testResults.total++;
        testResults.details.push({ name: 'Remove Topic Response', success: removeResponseTest });
        if (removeResponseTest) testResults.passed++; else testResults.failed++;
      }
      
      // Test 11: Delete Topic
      const deleteTest = await runTest('Delete Topic', async () => {
        await testDeleteTopic(topicId);
      });
      testResults.total++;
      testResults.details.push({ name: 'Delete Topic', success: deleteTest });
      if (deleteTest) testResults.passed++; else testResults.failed++;
    }
  } finally {
    // Clean up test data
    await cleanupTestData();
    
    // Save test results
    saveTestResults(testResults);
    
    // Log test summary
    logger.info('Topic Service tests completed', {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed
    });
    
    // Also log to console for visibility
    console.log('\nTopic Service tests completed:');
    console.log(`Total: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed}`);
    console.log(`Failed: ${testResults.failed}`);
    console.log('\nTest details:');
    testResults.details.forEach(detail => {
      console.log(`${detail.success ? '✅' : '❌'} ${detail.name}`);
    });
    
    // Exit with appropriate code
    process.exit(testResults.failed > 0 ? 1 : 0);
  }
}

// Run all tests
runAllTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});
