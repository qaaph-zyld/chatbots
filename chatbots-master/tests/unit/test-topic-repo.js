/**
 * Simple test for topic repository
 */

const { databaseService, repositories } = require('../../data');

async function testTopicRepo() {
  console.log('Testing topic repository...');
  
  // Set test database URI
  process.env.MONGODB_URI = 'mongodb://localhost:27017/chatbots-test';
  console.log('Using test database:', process.env.MONGODB_URI);
  
  try {
    // Connect to database
    console.log('Connecting to database...');
    await databaseService.connect();
    console.log('Database connected successfully');
    
    // Check if topic repository is available
    console.log('Checking topic repository...');
    console.log('Available repositories:', Object.keys(repositories));
    
    if (!repositories.topic) {
      console.error('Topic repository not found in repositories object');
      process.exit(1);
    }
    
    console.log('Topic repository found');
    
    // Create a test topic
    const topicData = {
      name: 'TestTopic',
      category: 'test',
      chatbotId: 'test-chatbot-123',
      description: 'Test topic for validation',
      isActive: true
    };
    
    console.log('Creating test topic...');
    const topic = await repositories.topic.create(topicData);
    console.log('Test topic created:', topic._id);
    
    // Get topic by ID
    console.log('Getting topic by ID...');
    const foundTopic = await repositories.topic.findById(topic._id);
    console.log('Found topic:', foundTopic ? 'Yes' : 'No');
    
    // Clean up
    console.log('Cleaning up...');
    await repositories.topic.deleteById(topic._id);
    console.log('Test completed successfully');
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    process.exit(0);
  }
}

// Run the test
testTopicRepo();
