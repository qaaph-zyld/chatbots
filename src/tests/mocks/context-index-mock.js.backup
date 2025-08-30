/**
 * Context Index Mock
 * 
 * Mocks the context module index to prevent model compilation errors
 */

require('@src/tests\mocks\context-service-mock');

// Export mock services
module.exports = {
  contextService: {
    initialize: jest.fn().mockResolvedValue(true),
    extractContext: jest.fn().mockResolvedValue({}),
    enhanceResponse: jest.fn().mockImplementation((text) => Promise.resolve(text))
  },
  advancedContextService: mockAdvancedContextService,
  entityService: {
    initialize: jest.fn().mockResolvedValue(true),
    extractEntities: jest.fn().mockResolvedValue([]),
    trackEntity: jest.fn().mockResolvedValue(true)
  },
  topicService: {
    initialize: jest.fn().mockResolvedValue(true),
    detectTopics: jest.fn().mockResolvedValue([]),
    getRelatedTopics: jest.fn().mockResolvedValue([])
  },
  referenceService: {
    initialize: jest.fn().mockResolvedValue(true),
    createReference: jest.fn().mockResolvedValue(true),
    getReferences: jest.fn().mockResolvedValue([])
  }
};
