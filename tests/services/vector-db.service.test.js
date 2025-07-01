/**
 * Vector Database Service Tests
 * 
 * Tests for the vector database service that handles document embedding and semantic search
 */

const vectorDBService = require('../../src/services/vector-db.service');
const weaviate = require('weaviate-client');
const { v4: uuidv4 } = require('uuid');

// Mock weaviate client
jest.mock('weaviate-client');
jest.mock('uuid');

describe('Vector Database Service', () => {
  let mockClient;
  let mockSchema;
  let mockData;
  let mockGraphql;

  beforeEach(() => {
    // Reset service state
    vectorDBService.initialized = false;
    vectorDBService.client = null;

    // Mock UUID generation
    uuidv4.mockImplementation(() => 'mock-uuid-123');

    // Create mock client and methods
    mockSchema = {
      getter: jest.fn().mockReturnThis(),
      classCreator: jest.fn().mockReturnThis(),
      do: jest.fn(),
      withClass: jest.fn().mockReturnThis(),
    };

    mockData = {
      creator: jest.fn().mockReturnThis(),
      updater: jest.fn().mockReturnThis(),
      deleter: jest.fn().mockReturnThis(),
      getterById: jest.fn().mockReturnThis(),
      withClassName: jest.fn().mockReturnThis(),
      withId: jest.fn().mockReturnThis(),
      withProperties: jest.fn().mockReturnThis(),
      do: jest.fn(),
    };

    mockGraphql = {
      get: jest.fn().mockReturnThis(),
      withClassName: jest.fn().mockReturnThis(),
      withFields: jest.fn().mockReturnThis(),
      withNearText: jest.fn().mockReturnThis(),
      withWhere: jest.fn().mockReturnThis(),
      withLimit: jest.fn().mockReturnThis(),
      withOffset: jest.fn().mockReturnThis(),
      do: jest.fn(),
    };

    mockClient = {
      schema: mockSchema,
      data: mockData,
      graphql: mockGraphql,
    };

    weaviate.client.mockReturnValue(mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize the client and schema', async () => {
      // Mock schema response
      mockSchema.do.mockResolvedValue({ classes: [] });

      const result = await vectorDBService.initialize();

      expect(result).toBe(true);
      expect(vectorDBService.initialized).toBe(true);
      expect(weaviate.client).toHaveBeenCalled();
      expect(mockSchema.getter).toHaveBeenCalled();
      expect(mockSchema.do).toHaveBeenCalled();
      expect(mockSchema.classCreator).toHaveBeenCalled();
      expect(mockSchema.withClass).toHaveBeenCalled();
    });

    it('should not recreate schema if it already exists', async () => {
      // Mock schema response with existing class
      mockSchema.do.mockResolvedValue({
        classes: [{ class: 'Document' }]
      });

      const result = await vectorDBService.initialize();

      expect(result).toBe(true);
      expect(vectorDBService.initialized).toBe(true);
      expect(mockSchema.classCreator).not.toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      // Mock schema error
      mockSchema.do.mockRejectedValue(new Error('Connection failed'));

      const result = await vectorDBService.initialize();

      expect(result).toBe(false);
      expect(vectorDBService.initialized).toBe(false);
    });

    it('should not reinitialize if already initialized', async () => {
      // Set initialized state
      vectorDBService.initialized = true;

      const result = await vectorDBService.initialize();

      expect(result).toBe(true);
      expect(weaviate.client).not.toHaveBeenCalled();
    });
  });

  describe('addDocument', () => {
    it('should add a document and return ID', async () => {
      // Mock initialization
      mockSchema.do.mockResolvedValue({ classes: [{ class: 'Document' }] });
      mockData.do.mockResolvedValue({ id: 'mock-uuid-123' });

      const document = {
        title: 'Test Document',
        content: 'This is a test document',
        category: 'test',
        tenantId: 'tenant-123',
        metadata: { author: 'Test User' }
      };

      const id = await vectorDBService.addDocument(document);

      expect(id).toBe('mock-uuid-123');
      expect(mockData.creator).toHaveBeenCalled();
      expect(mockData.withClassName).toHaveBeenCalledWith('Document');
      expect(mockData.withId).toHaveBeenCalledWith('mock-uuid-123');
      expect(mockData.withProperties).toHaveBeenCalledWith({
        title: 'Test Document',
        content: 'This is a test document',
        category: 'test',
        tenantId: 'tenant-123',
        metadata: { author: 'Test User' }
      });
    });

    it('should throw error if required fields are missing', async () => {
      // Mock initialization
      mockSchema.do.mockResolvedValue({ classes: [{ class: 'Document' }] });

      const document = {
        title: 'Test Document',
        // Missing content
        tenantId: 'tenant-123'
      };

      await expect(vectorDBService.addDocument(document)).rejects.toThrow('Document must have title, content, and tenantId');
    });
  });

  describe('addDocumentBatch', () => {
    it('should add multiple documents in batch', async () => {
      // Mock initialization
      mockSchema.do.mockResolvedValue({ classes: [{ class: 'Document' }] });
      mockData.do.mockResolvedValue({});

      const documents = [
        {
          title: 'Document 1',
          content: 'Content 1',
          category: 'test',
          tenantId: 'tenant-123'
        },
        {
          title: 'Document 2',
          content: 'Content 2',
          category: 'test',
          tenantId: 'tenant-123'
        }
      ];

      const ids = await vectorDBService.addDocumentBatch(documents);

      expect(ids).toEqual(['mock-uuid-123', 'mock-uuid-123']);
      expect(mockData.creator).toHaveBeenCalledTimes(2);
      expect(mockData.withClassName).toHaveBeenCalledWith('Document');
    });

    it('should throw error if documents array is empty', async () => {
      // Mock initialization
      mockSchema.do.mockResolvedValue({ classes: [{ class: 'Document' }] });

      await expect(vectorDBService.addDocumentBatch([])).rejects.toThrow('Documents must be a non-empty array');
    });
  });

  describe('semanticSearch', () => {
    it('should perform semantic search and return results', async () => {
      // Mock initialization
      mockSchema.do.mockResolvedValue({ classes: [{ class: 'Document' }] });
      
      // Mock search results
      mockGraphql.do.mockResolvedValue({
        data: {
          Get: {
            Document: [
              {
                title: 'Result 1',
                content: 'Content 1',
                category: 'test',
                metadata: { author: 'Test User' },
                _additional: {
                  id: 'doc-id-1',
                  certainty: 0.95,
                  distance: 0.05
                }
              },
              {
                title: 'Result 2',
                content: 'Content 2',
                category: 'test',
                metadata: { author: 'Test User' },
                _additional: {
                  id: 'doc-id-2',
                  certainty: 0.85,
                  distance: 0.15
                }
              }
            ]
          }
        }
      });

      const results = await vectorDBService.semanticSearch({
        query: 'test query',
        tenantId: 'tenant-123',
        category: 'test',
        limit: 10
      });

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('doc-id-1');
      expect(results[0].title).toBe('Result 1');
      expect(results[0].relevance.certainty).toBe(0.95);
      
      expect(mockGraphql.get).toHaveBeenCalled();
      expect(mockGraphql.withClassName).toHaveBeenCalledWith('Document');
      expect(mockGraphql.withNearText).toHaveBeenCalledWith({ concepts: ['test query'] });
      expect(mockGraphql.withWhere).toHaveBeenCalled();
      expect(mockGraphql.withLimit).toHaveBeenCalledWith(10);
    });

    it('should throw error if required parameters are missing', async () => {
      // Mock initialization
      mockSchema.do.mockResolvedValue({ classes: [{ class: 'Document' }] });

      await expect(vectorDBService.semanticSearch({
        // Missing query
        tenantId: 'tenant-123'
      })).rejects.toThrow('Query and tenantId are required');
    });
  });

  describe('updateDocument', () => {
    it('should update an existing document', async () => {
      // Mock initialization
      mockSchema.do.mockResolvedValue({ classes: [{ class: 'Document' }] });
      mockData.do.mockResolvedValue({});

      const result = await vectorDBService.updateDocument('doc-id-1', {
        title: 'Updated Title',
        content: 'Updated Content'
      });

      expect(result).toBe(true);
      expect(mockData.updater).toHaveBeenCalled();
      expect(mockData.withClassName).toHaveBeenCalledWith('Document');
      expect(mockData.withId).toHaveBeenCalledWith('doc-id-1');
      expect(mockData.withProperties).toHaveBeenCalledWith({
        title: 'Updated Title',
        content: 'Updated Content'
      });
    });

    it('should throw error if no properties are provided', async () => {
      // Mock initialization
      mockSchema.do.mockResolvedValue({ classes: [{ class: 'Document' }] });

      await expect(vectorDBService.updateDocument('doc-id-1', {}))
        .rejects.toThrow('At least one property must be provided for update');
    });
  });

  describe('deleteDocument', () => {
    it('should delete a document', async () => {
      // Mock initialization
      mockSchema.do.mockResolvedValue({ classes: [{ class: 'Document' }] });
      mockData.do.mockResolvedValue({});

      const result = await vectorDBService.deleteDocument('doc-id-1');

      expect(result).toBe(true);
      expect(mockData.deleter).toHaveBeenCalled();
      expect(mockData.withClassName).toHaveBeenCalledWith('Document');
      expect(mockData.withId).toHaveBeenCalledWith('doc-id-1');
    });
  });

  describe('getDocument', () => {
    it('should retrieve a document by ID', async () => {
      // Mock initialization
      mockSchema.do.mockResolvedValue({ classes: [{ class: 'Document' }] });
      
      // Mock document data
      mockData.do.mockResolvedValue({
        id: 'doc-id-1',
        properties: {
          title: 'Test Document',
          content: 'This is a test document',
          category: 'test',
          tenantId: 'tenant-123',
          metadata: { author: 'Test User' }
        }
      });

      const document = await vectorDBService.getDocument('doc-id-1');

      expect(document).not.toBeNull();
      expect(document.id).toBe('doc-id-1');
      expect(document.title).toBe('Test Document');
      expect(document.tenantId).toBe('tenant-123');
      
      expect(mockData.getterById).toHaveBeenCalled();
      expect(mockData.withClassName).toHaveBeenCalledWith('Document');
      expect(mockData.withId).toHaveBeenCalledWith('doc-id-1');
    });

    it('should return null if document not found', async () => {
      // Mock initialization
      mockSchema.do.mockResolvedValue({ classes: [{ class: 'Document' }] });
      
      // Mock document not found
      mockData.do.mockResolvedValue(null);

      const document = await vectorDBService.getDocument('non-existent-id');

      expect(document).toBeNull();
    });
  });

  describe('listDocuments', () => {
    it('should list documents for a tenant with pagination', async () => {
      // Mock initialization
      mockSchema.do.mockResolvedValue({ classes: [{ class: 'Document' }] });
      
      // Mock document list
      mockGraphql.do.mockResolvedValue({
        data: {
          Get: {
            Document: [
              {
                title: 'Document 1',
                content: 'Content 1',
                category: 'test',
                metadata: { author: 'Test User' },
                _additional: { id: 'doc-id-1' }
              },
              {
                title: 'Document 2',
                content: 'Content 2',
                category: 'test',
                metadata: { author: 'Test User' },
                _additional: { id: 'doc-id-2' }
              }
            ]
          }
        }
      });

      const documents = await vectorDBService.listDocuments('tenant-123', 10, 0);

      expect(documents).toHaveLength(2);
      expect(documents[0].id).toBe('doc-id-1');
      expect(documents[0].title).toBe('Document 1');
      
      expect(mockGraphql.get).toHaveBeenCalled();
      expect(mockGraphql.withClassName).toHaveBeenCalledWith('Document');
      expect(mockGraphql.withWhere).toHaveBeenCalled();
      expect(mockGraphql.withLimit).toHaveBeenCalledWith(10);
      expect(mockGraphql.withOffset).toHaveBeenCalledWith(0);
    });
  });
});
