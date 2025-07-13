// Mock implementation of the models module
const { v4: uuidv4 } = require('uuid');

// Mock ApiKey model
class ApiKey {
  static findOne(where) {
    return Promise.resolve({
      id: uuidv4(),
      key: 'test-api-key',
      isActive: true,
      userId: 'test-user-id',
      getUser: () => Promise.resolve({
        id: 'test-user-id',
        username: 'testuser',
        role: 'admin',
        email: 'test@example.com'
      })
    });
  }
}

// Mock other models as needed
const User = {
  findOne: jest.fn()
};

const Chatbot = {
  findOne: jest.fn(),
  findAll: jest.fn()
};

// Export all models
module.exports = {
  ApiKey,
  User,
  Chatbot,
  // Add other models as needed
  sequelize: {
    transaction: jest.fn(() => ({
      commit: jest.fn(),
      rollback: jest.fn()
    }))
  }
};
