// Mock implementation for @models
const models = {
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    findOneAndUpdate: jest.fn(),
    find: jest.fn(),
    deleteOne: jest.fn(),
    countDocuments: jest.fn()
  },
  // Add other models as needed
  Chatbot: {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    deleteOne: jest.fn()
  },
  Conversation: {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    deleteOne: jest.fn()
  },
  // Add more model mocks as needed
};

// Add reset function to easily reset all mocks between tests
models.resetMocks = () => {
  Object.values(models).forEach(model => {
    if (typeof model === 'object' && model !== null) {
      Object.values(model).forEach(mockFn => {
        if (typeof mockFn === 'function' && '_isMockFunction' in mockFn) {
          mockFn.mockClear();
        }
      });
    }
  });
};

module.exports = models;
