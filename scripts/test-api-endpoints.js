/**
 * API Endpoint Testing Script
 * 
 * This script tests the API endpoints for the advanced context awareness features.
 * It makes HTTP requests to the API endpoints and logs the responses.
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Configure axios with the proxy as specified in user requirements
axios.defaults.proxy = {
  host: '104.129.196.38',
  port: 10563
};

// Alternative proxy configuration method
// process.env.HTTP_PROXY = 'http://104.129.196.38:10563';
// process.env.HTTPS_PROXY = 'http://104.129.196.38:10563';

// Base URL for the API
const BASE_URL = process.env.API_URL || 'http://localhost:3000/api';

// Test data
const testData = {
  chatbotId: '60d21b4667d0d8992e610c85', // Replace with a valid chatbot ID
  userId: 'test-user-' + uuidv4().substring(0, 8),
  conversationId: uuidv4()
};

// JWT token for authentication (replace with a valid token)
let token = '';

// Helper function to make authenticated API requests
async function apiRequest(method, endpoint, data = null) {
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    let response;
    if (method === 'get') {
      response = await axios.get(`${BASE_URL}${endpoint}`, config);
    } else if (method === 'post') {
      response = await axios.post(`${BASE_URL}${endpoint}`, data, config);
    } else if (method === 'put') {
      response = await axios.put(`${BASE_URL}${endpoint}`, data, config);
    } else if (method === 'delete') {
      response = await axios.delete(`${BASE_URL}${endpoint}`, config);
    }

    return response.data;
  } catch (error) {
    console.error(`Error in ${method.toUpperCase()} ${endpoint}:`, error.response?.data || error.message);
    return null;
  }
}

// Login to get a JWT token
async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@example.com', // Replace with valid credentials
      password: 'password123'      // Replace with valid credentials
    });
    
    token = response.data.token;
    console.log('Authentication successful');
    return true;
  } catch (error) {
    console.error('Authentication failed:', error.response?.data || error.message);
    return false;
  }
}

// Test entity tracking endpoints
async function testEntityEndpoints() {
  console.log('\n--- Testing Entity Endpoints ---');
  
  // Create an entity
  const entity = await apiRequest('post', `/chatbots/${testData.chatbotId}/users/${testData.userId}/entities`, {
    name: 'John Doe',
    type: 'person',
    attributes: {
      age: 30,
      occupation: 'Software Developer'
    }
  });
  
  if (entity) {
    console.log('Created entity:', entity);
    
    // Get entities by user
    const entities = await apiRequest('get', `/chatbots/${testData.chatbotId}/users/${testData.userId}/entities`);
    console.log('User entities:', entities);
    
    // Create another entity for relation testing
    const entity2 = await apiRequest('post', `/chatbots/${testData.chatbotId}/users/${testData.userId}/entities`, {
      name: 'Jane Smith',
      type: 'person',
      attributes: {
        age: 28,
        occupation: 'Designer'
      }
    });
    
    if (entity2) {
      // Create entity relation
      const relation = await apiRequest('post', `/chatbots/${testData.chatbotId}/users/${testData.userId}/entity-relations`, {
        sourceEntityId: entity._id,
        targetEntityId: entity2._id,
        relationType: 'colleague',
        strength: 0.9
      });
      
      console.log('Created entity relation:', relation);
    }
  }
}

// Test topic detection endpoints
async function testTopicEndpoints() {
  console.log('\n--- Testing Topic Endpoints ---');
  
  // Create a topic
  const topic = await apiRequest('post', `/chatbots/${testData.chatbotId}/topics`, {
    name: 'Artificial Intelligence',
    description: 'Discussion about AI technologies',
    keywords: ['ai', 'machine learning', 'neural networks']
  });
  
  if (topic) {
    console.log('Created topic:', topic);
    
    // Get topics by chatbot
    const topics = await apiRequest('get', `/chatbots/${testData.chatbotId}/topics`);
    console.log('Chatbot topics:', topics);
    
    // Detect topics in a message
    const detectedTopics = await apiRequest('post', `/chatbots/${testData.chatbotId}/detect-topics`, {
      message: 'I am interested in learning more about artificial intelligence and machine learning.'
    });
    
    console.log('Detected topics:', detectedTopics);
  }
}

// Test preference learning endpoints
async function testPreferenceEndpoints() {
  console.log('\n--- Testing Preference Endpoints ---');
  
  // Set a user preference
  const preference = await apiRequest('post', `/chatbots/${testData.chatbotId}/users/${testData.userId}/preferences`, {
    category: 'communication',
    key: 'responseStyle',
    value: 'concise',
    source: 'explicit'
  });
  
  if (preference) {
    console.log('Set preference:', preference);
    
    // Get user preferences
    const preferences = await apiRequest('get', `/chatbots/${testData.chatbotId}/users/${testData.userId}/preferences`);
    console.log('User preferences:', preferences);
    
    // Get specific preference
    const specificPreference = await apiRequest('get', `/chatbots/${testData.chatbotId}/users/${testData.userId}/preferences/communication/responseStyle`);
    console.log('Specific preference:', specificPreference);
  }
}

// Test workflow endpoints
async function testWorkflowEndpoints() {
  console.log('\n--- Testing Workflow Endpoints ---');
  
  // Create a workflow
  const workflow = await apiRequest('post', `/chatbots/${testData.chatbotId}/workflows`, {
    name: 'Customer Onboarding',
    description: 'Workflow for onboarding new customers',
    nodes: [
      {
        id: 'start',
        type: 'start',
        position: { x: 100, y: 100 },
        data: {}
      },
      {
        id: 'welcome',
        type: 'message',
        position: { x: 300, y: 100 },
        data: {
          message: 'Welcome to our service! How can I help you today?'
        }
      }
    ],
    edges: [
      {
        id: 'edge-1',
        source: 'start',
        target: 'welcome'
      }
    ],
    isActive: true
  });
  
  if (workflow) {
    console.log('Created workflow:', workflow);
    
    // Get workflows by chatbot
    const workflows = await apiRequest('get', `/chatbots/${testData.chatbotId}/workflows`);
    console.log('Chatbot workflows:', workflows);
    
    // Start workflow execution
    const execution = await apiRequest('post', `/chatbots/${testData.chatbotId}/workflows/${workflow._id}/execute`, {
      userId: testData.userId,
      conversationId: testData.conversationId
    });
    
    if (execution) {
      console.log('Started workflow execution:', execution);
      
      // Get workflow executions
      const executions = await apiRequest('get', `/chatbots/${testData.chatbotId}/workflows/${workflow._id}/executions`);
      console.log('Workflow executions:', executions);
    }
  }
}

// Run all tests
async function runTests() {
  console.log('Starting API endpoint tests...');
  
  // Login first
  const authenticated = await login();
  if (!authenticated) {
    console.error('Cannot proceed with tests without authentication');
    return;
  }
  
  // Run tests for each feature
  await testEntityEndpoints();
  await testTopicEndpoints();
  await testPreferenceEndpoints();
  await testWorkflowEndpoints();
  
  console.log('\nAPI endpoint tests completed');
}

// Run the tests
runTests().catch(console.error);
