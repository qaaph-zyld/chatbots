/**
 * Context Service Mock
 * 
 * Mocks the advanced context service to prevent model compilation errors
 */

// Mock the models to prevent "Cannot overwrite model" errors
const mockTopicModel = {
  find: jest.fn().mockResolvedValue([]),
  findById: jest.fn().mockResolvedValue(null),
  findOne: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockImplementation(data => {
    return Promise.resolve({
      _id: 'mock-topic-id',
      ...data,
      save: jest.fn().mockResolvedValue(true)
    });
  }),
  findByIdAndUpdate: jest.fn().mockResolvedValue(null),
  findByIdAndDelete: jest.fn().mockResolvedValue(null)
};

const mockEntityModel = {
  find: jest.fn().mockResolvedValue([]),
  findById: jest.fn().mockResolvedValue(null),
  findOne: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockImplementation(data => {
    return Promise.resolve({
      _id: 'mock-entity-id',
      ...data,
      save: jest.fn().mockResolvedValue(true)
    });
  }),
  findByIdAndUpdate: jest.fn().mockResolvedValue(null),
  findByIdAndDelete: jest.fn().mockResolvedValue(null)
};

const mockPreferenceModel = {
  find: jest.fn().mockResolvedValue([]),
  findById: jest.fn().mockResolvedValue(null),
  findOne: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockImplementation(data => {
    return Promise.resolve({
      _id: 'mock-preference-id',
      ...data,
      save: jest.fn().mockResolvedValue(true)
    });
  }),
  findByIdAndUpdate: jest.fn().mockResolvedValue(null),
  findByIdAndDelete: jest.fn().mockResolvedValue(null)
};

// Mock the advanced context service
const mockAdvancedContextService = {
  initialize: jest.fn().mockResolvedValue(true),
  
  // Topic management
  createTopic: jest.fn().mockImplementation(data => {
    return Promise.resolve({
      _id: 'mock-topic-id',
      ...data
    });
  }),
  getTopic: jest.fn().mockResolvedValue(null),
  updateTopic: jest.fn().mockResolvedValue(null),
  deleteTopic: jest.fn().mockResolvedValue(true),
  getAllTopics: jest.fn().mockResolvedValue([]),
  
  // Entity management
  createEntity: jest.fn().mockImplementation(data => {
    return Promise.resolve({
      _id: 'mock-entity-id',
      ...data
    });
  }),
  getEntity: jest.fn().mockResolvedValue(null),
  updateEntity: jest.fn().mockResolvedValue(null),
  deleteEntity: jest.fn().mockResolvedValue(true),
  getAllEntities: jest.fn().mockResolvedValue([]),
  
  // Cross-conversation entity tracking
  trackEntity: jest.fn().mockResolvedValue(true),
  getTrackedEntity: jest.fn().mockResolvedValue(null),
  updateTrackedEntity: jest.fn().mockResolvedValue(null),
  getAllTrackedEntities: jest.fn().mockResolvedValue([]),
  
  // User preferences
  setUserPreference: jest.fn().mockResolvedValue(true),
  getUserPreference: jest.fn().mockResolvedValue(null),
  getAllUserPreferences: jest.fn().mockResolvedValue([]),
  
  // Context management
  extractContext: jest.fn().mockImplementation(text => {
    return Promise.resolve({
      topics: [],
      entities: [],
      sentiment: 'neutral',
      intent: 'general'
    });
  }),
  enhanceResponse: jest.fn().mockImplementation((text, context) => {
    return Promise.resolve(text);
  }),
  
  // Reference management
  createReference: jest.fn().mockResolvedValue(true),
  getReference: jest.fn().mockResolvedValue(null),
  getAllReferences: jest.fn().mockResolvedValue([])
};

module.exports = {
  mockAdvancedContextService,
  mockTopicModel,
  mockEntityModel,
  mockPreferenceModel
};
