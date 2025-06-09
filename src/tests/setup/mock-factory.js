/**
 * Mock Factory
 * 
 * Provides consistent mock implementations for services, models, and other dependencies
 * to ensure tests have proper mocks that match expected behavior.
 */

const mongoose = require('mongoose');

/**
 * Create a mock for any service with standardized implementation
 * @param {Object} customImplementation - Custom implementation overrides
 * @returns {Object} Mock service object
 */
const createServiceMock = (customImplementation = {}) => {
  // Default implementations that match expected behavior in tests
  const defaultImplementation = {
    // Chatbot service methods
    createChatbot: jest.fn().mockImplementation((chatbotData) => {
      // Validate required fields
      if (!chatbotData.name) {
        return Promise.reject(new Error('Chatbot name is required'));
      }
      
      const id = new mongoose.Types.ObjectId();
      return Promise.resolve({
        _id: id,
        id: id.toString(),
        name: chatbotData.name,
        description: chatbotData.description || 'A test chatbot',
        engine: chatbotData.engine || 'botpress',
        engineConfig: chatbotData.engineConfig || { apiKey: 'test-key' },
        createdAt: new Date(),
        updatedAt: new Date(),
        save: jest.fn().mockResolvedValue(true)
      });
    }),
    
    getChatbotById: jest.fn().mockImplementation((id) => {
      if (id === 'nonexistent') {
        return Promise.resolve(null);
      }
      
      return Promise.resolve({
        _id: id,
        id: typeof id === 'string' ? id : id.toString(),
        name: 'Test Bot',
        description: 'A test chatbot',
        engine: 'botpress',
        engineConfig: { apiKey: 'test-key' },
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }),
    
    updateChatbot: jest.fn().mockImplementation((id, chatbotData) => {
      if (id === 'nonexistent') {
        return Promise.resolve(null);
      }
      
      // Validate required fields
      if (chatbotData.name === '') {
        return Promise.reject(new Error('Chatbot name is required'));
      }
      
      return Promise.resolve({
        _id: id,
        id: typeof id === 'string' ? id : id.toString(),
        name: chatbotData.name || 'Updated Bot',
        description: chatbotData.description || 'Updated description',
        engine: chatbotData.engine || 'botpress',
        engineConfig: chatbotData.engineConfig || { apiKey: 'test-key' },
        updatedAt: new Date()
      });
    }),
    
    deleteChatbot: jest.fn().mockImplementation((id) => {
      if (id === 'nonexistent') {
        return Promise.resolve(null);
      }
      return Promise.resolve(true);
    }),
    
    trainChatbot: jest.fn().mockImplementation((id) => {
      if (id === 'nonexistent') {
        return Promise.reject(new Error('Chatbot not found'));
      }
      if (id === 'error') {
        return Promise.reject(new Error('Training failed'));
      }
      return Promise.resolve({
        status: 'success',
        message: 'Training completed successfully'
      });
    }),
    
    sendMessage: jest.fn().mockResolvedValue({
      message: 'Hello, human!',
      timestamp: new Date()
    }),
    
    getConversationHistory: jest.fn().mockResolvedValue([
      { role: 'user', content: 'Hello', timestamp: new Date() },
      { role: 'bot', content: 'Hi there!', timestamp: new Date() }
    ]),
    
    // Analytics service methods
    trackMessage: jest.fn().mockResolvedValue(true),
    
    getAnalytics: jest.fn().mockResolvedValue([
      {
        chatbotId: new mongoose.Types.ObjectId(),
        period: 'daily',
        date: new Date(),
        metrics: {
          messageCount: 100,
          userMessageCount: 50,
          botMessageCount: 50,
          averageResponseTime: 1.5,
          conversationCount: 10,
          uniqueUserCount: 5,
          averageConversationLength: 10,
          averageUserMessageLength: 20,
          averageBotMessageLength: 40
        },
        sentimentAnalysis: {
          positive: 30,
          neutral: 50,
          negative: 20
        },
        topUserQueries: [
          { query: 'Hello', count: 10 },
          { query: 'How are you?', count: 5 }
        ],
        topFailedQueries: [
          { query: 'Unknown command', count: 3 }
        ]
      }
    ]),
    
    getAllTimeAnalytics: jest.fn().mockResolvedValue({
      chatbotId: new mongoose.Types.ObjectId(),
      period: 'all',
      date: new Date(0),
      metrics: {
        messageCount: 1000,
        userMessageCount: 500,
        botMessageCount: 500,
        averageResponseTime: 1.2,
        conversationCount: 100,
        uniqueUserCount: 50,
        averageConversationLength: 10,
        averageUserMessageLength: 20,
        averageBotMessageLength: 40
      },
      sentimentAnalysis: {
        positive: 300,
        neutral: 500,
        negative: 200
      }
    }),
    
    generateReport: jest.fn().mockResolvedValue({
      chatbotId: new mongoose.Types.ObjectId(),
      period: 'daily',
      startDate: new Date(),
      endDate: new Date(),
      generatedAt: new Date(),
      metrics: {
        messageCount: 100,
        userMessageCount: 50,
        botMessageCount: 50,
        averageResponseTime: 1.5,
        conversationCount: 10,
        uniqueUserCount: 5,
        averageConversationLength: 10,
        averageUserMessageLength: 20,
        averageBotMessageLength: 40
      },
      trends: {
        messageCountTrend: 5.2,
        responseTimeTrend: -2.1,
        conversationCountTrend: 3.5,
        userCountTrend: 7.8
      },
      insights: [
        'Message volume is significantly higher than the all-time average.',
        'Response times are improving significantly.'
      ],
      topIntents: [
        { intent: 'greeting', count: 20 },
        { intent: 'farewell', count: 15 }
      ],
      topEntities: [
        { type: 'person', value: 'John', count: 10 },
        { type: 'location', value: 'New York', count: 8 }
      ],
      topQueries: {
        topUserQueries: [
          { query: 'Hello', count: 10 },
          { query: 'How are you?', count: 5 }
        ],
        topFailedQueries: [
          { query: 'Unknown command', count: 3 }
        ]
      },
      sentimentAnalysis: {
        positive: 30,
        negative: 20,
        neutral: 50,
        positivePercentage: 30,
        negativePercentage: 20,
        neutralPercentage: 50
      },
      performanceMetrics: {
        averageResponseTime: 1.5,
        responseTimePercentile90: 2.3,
        messageSuccessRate: 97,
        conversationCompletionRate: 95
      }
    }),
    
    processBuffer: jest.fn().mockResolvedValue(true),
    
    calculateTrends: jest.fn().mockReturnValue({
      messageCountTrend: 5.2,
      responseTimeTrend: -2.1,
      conversationCountTrend: 3.5,
      userCountTrend: 7.8
    }),
    
    aggregateMetrics: jest.fn().mockReturnValue({
      messageCount: 100,
      userMessageCount: 50,
      botMessageCount: 50,
      averageResponseTime: 1.5,
      conversationCount: 10,
      uniqueUserCount: 5,
      averageConversationLength: 10
    }),
    
    // Workflow service methods
    createWorkflow: jest.fn().mockImplementation((workflowData) => {
      const workflowId = new mongoose.Types.ObjectId();
      return Promise.resolve({
        _id: workflowId,
        id: workflowId.toString(),
        name: workflowData.name || 'Test Workflow',
        description: workflowData.description || 'A test workflow',
        nodes: workflowData.nodes || {
          start: { type: 'start', transitions: { default: 'message' } },
          message: { type: 'message', data: { text: 'Hello' }, transitions: { default: 'end' } },
          end: { type: 'end' }
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        save: jest.fn().mockResolvedValue(true)
      });
    }),
    
    getWorkflowById: jest.fn().mockImplementation((id) => {
      if (id === 'nonexistent') {
        return Promise.resolve(null);
      }
      return Promise.resolve({
        _id: id,
        name: 'Test Workflow',
        description: 'A test workflow',
        nodes: [{ id: 'start', type: 'start' }, { id: 'message', type: 'message' }],
        edges: [{ source: 'start', target: 'message' }],
        chatbotId: 'chatbot123',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }),
    
    startWorkflowExecution: jest.fn().mockImplementation((workflowId, input) => {
      // Check if workflow exists
      if (workflowId === 'nonexistent') {
        return Promise.reject(new Error('Workflow not found'));
      }
      
      return Promise.resolve({
        _id: 'execution123',
        workflowId,
        status: 'running',
        input,
        output: {},
        startedAt: new Date(),
        completedAt: null
      });
    }),
    
    getWorkflowExecutions: jest.fn().mockImplementation((workflowId) => {
      // Check if workflow exists
      if (workflowId === 'nonexistent') {
        return Promise.resolve([]);
      }
      
      return Promise.resolve([
        {
          _id: 'execution123',
          workflowId,
          status: 'completed',
          input: {},
          output: { result: 'success' },
          startedAt: new Date(Date.now() - 60000),
          completedAt: new Date()
        },
        {
          _id: 'execution456',
          workflowId,
          status: 'failed',
          input: {},
          output: { error: 'Something went wrong' },
          startedAt: new Date(Date.now() - 120000),
          completedAt: new Date(Date.now() - 115000)
        }
      ]);
    }),
    
    processNode: jest.fn().mockResolvedValue({
      nextNodeId: 'message',
      data: {}
    })
  };
  
  // Merge default with custom implementations
  return { ...defaultImplementation, ...customImplementation };
};

/**
 * Create a mock model with common Mongoose model methods
 * @param {Object} mockData - Data to return from find operations
 * @returns {Object} Mock Mongoose model
 */
const createModelMock = (mockData = {}) => {
  const mockDocument = {
    ...mockData,
    _id: mockData._id || new mongoose.Types.ObjectId(),
    save: jest.fn().mockResolvedValue(mockData),
    toObject: jest.fn().mockReturnValue(mockData),
    toJSON: jest.fn().mockReturnValue(mockData)
  };
  
  return {
    find: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockDocument])
      }),
      exec: jest.fn().mockResolvedValue([mockDocument]),
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis()
    }),
    
    findOne: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDocument)
      }),
      exec: jest.fn().mockResolvedValue(mockDocument),
      populate: jest.fn().mockReturnThis()
    }),
    
    findById: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDocument)
      }),
      exec: jest.fn().mockResolvedValue(mockDocument),
      populate: jest.fn().mockReturnThis()
    }),
    
    findByIdAndUpdate: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDocument)
      }),
      exec: jest.fn().mockResolvedValue(mockDocument)
    }),
    
    findByIdAndDelete: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockDocument)
    }),
    
    findOneAndUpdate: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDocument)
      }),
      exec: jest.fn().mockResolvedValue(mockDocument),
      upsert: jest.fn().mockReturnThis(),
      setOptions: jest.fn().mockReturnThis()
    }),
    
    create: jest.fn().mockResolvedValue(mockDocument),
    
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    
    countDocuments: jest.fn().mockResolvedValue(1),
    
    prototype: {
      save: jest.fn().mockResolvedValue(mockDocument)
    },
    
    schema: {
      path: jest.fn().mockReturnValue({
        options: {}
      })
    }
  };
};

/**
 * Create a mock response object for Express controllers
 * @returns {Object} Mock response object
 */
const createMockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
};

/**
 * Create a mock request object for Express controllers
 * @param {Object} options - Request options
 * @returns {Object} Mock request object
 */
const createMockRequest = (options = {}) => {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    cookies: {},
    user: { _id: 'user123' },
    ...options
  };
};

module.exports = {
  createServiceMock,
  createModelMock,
  createMockResponse,
  createMockRequest
};
