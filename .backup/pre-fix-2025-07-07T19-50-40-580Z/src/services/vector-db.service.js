/**
 * Vector Database Service
 * 
 * Provides integration with Weaviate vector database for semantic search capabilities
 * Handles document embedding, storage, and retrieval
 */

const weaviate = require('weaviate-client');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const logger = require('../utils/logger');

class VectorDBService {
  constructor() {
    this.client = null;
    this.initialized = false;
    this.className = 'Document';
  }

  /**
   * Initialize the Weaviate client connection
   * @returns {Promise<boolean>} Connection success status
   */
  async initialize() {
    try {
      if (this.initialized) {
        return true;
      }

      this.client = weaviate.client({
        scheme: config.weaviate.scheme || 'http',
        host: config.weaviate.host || 'localhost:8080',
      });

      // Check if the schema exists, create if it doesn't
      await this._ensureSchema();
      
      this.initialized = true;
      logger.info('Vector database connection established');
      return true;
    } catch (error) {
      logger.error(`Failed to initialize vector database: ${error.message}`, { error });
      return false;
    }
  }

  /**
   * Ensure the required schema exists in Weaviate
   * @private
   */
  async _ensureSchema() {
    try {
      // Check if class exists
      const schemaResponse = await this.client.schema.getter().do();
      const classExists = schemaResponse.classes?.some(c => c.class === this.className);

      if (!classExists) {
        // Create class for documents
        await this.client.schema
          .classCreator()
          .withClass({
            class: this.className,
            description: 'Knowledge base documents for semantic search',
            vectorizer: 'text2vec-transformers',
            moduleConfig: {
              'text2vec-transformers': {
                vectorizeClassName: false
              }
            },
            properties: [
              {
                name: 'title',
                dataType: ['text'],
                description: 'Document title',
                moduleConfig: {
                  'text2vec-transformers': {
                    skip: false,
                    vectorizePropertyName: false
                  }
                }
              },
              {
                name: 'content',
                dataType: ['text'],
                description: 'Document content',
                moduleConfig: {
                  'text2vec-transformers': {
                    skip: false,
                    vectorizePropertyName: false
                  }
                }
              },
              {
                name: 'category',
                dataType: ['text'],
                description: 'Document category',
                moduleConfig: {
                  'text2vec-transformers': {
                    skip: false,
                    vectorizePropertyName: false
                  }
                }
              },
              {
                name: 'tenantId',
                dataType: ['string'],
                description: 'Tenant ID for multi-tenancy',
                moduleConfig: {
                  'text2vec-transformers': {
                    skip: true
                  }
                }
              },
              {
                name: 'metadata',
                dataType: ['object'],
                description: 'Additional document metadata',
                moduleConfig: {
                  'text2vec-transformers': {
                    skip: true
                  }
                }
              }
            ]
          })
          .do();
        
        logger.info(`Created schema class: ${this.className}`);
      }
    } catch (error) {
      logger.error(`Failed to ensure schema: ${error.message}`, { error });
      throw error;
    }
  }

  /**
   * Add a document to the vector database
   * @param {Object} document - Document to add
   * @param {string} document.title - Document title
   * @param {string} document.content - Document content
   * @param {string} document.category - Document category
   * @param {string} document.tenantId - Tenant ID
   * @param {Object} document.metadata - Additional metadata
   * @returns {Promise<string>} Document ID
   */
  async addDocument(document) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const { title, content, category, tenantId, metadata = {} } = document;
      
      if (!title || !content || !tenantId) {
        throw new Error('Document must have title, content, and tenantId');
      }

      const id = uuidv4();
      
      await this.client.data
        .creator()
        .withClassName(this.className)
        .withId(id)
        .withProperties({
          title,
          content,
          category: category || 'general',
          tenantId,
          metadata
        })
        .do();

      logger.debug(`Added document to vector database: ${id}`);
      return id;
    } catch (error) {
      logger.error(`Failed to add document: ${error.message}`, { error });
      throw error;
    }
  }

  /**
   * Add multiple documents to the vector database in batch
   * @param {Array<Object>} documents - Array of documents to add
   * @returns {Promise<Array<string>>} Array of document IDs
   */
  async addDocumentBatch(documents) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (!Array.isArray(documents) || documents.length === 0) {
        throw new Error('Documents must be a non-empty array');
      }

      const batchSize = 100; // Process in chunks to avoid overwhelming the server
      const documentIds = [];
      
      // Process in batches
      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        const batchPromises = batch.map(doc => {
          const { title, content, category, tenantId, metadata = {} } = doc;
          
          if (!title || !content || !tenantId) {
            throw new Error(`Document at index ${i} must have title, content, and tenantId`);
          }

          const id = uuidv4();
          documentIds.push(id);
          
          return this.client.data
            .creator()
            .withClassName(this.className)
            .withId(id)
            .withProperties({
              title,
              content,
              category: category || 'general',
              tenantId,
              metadata
            })
            .do();
        });

        await Promise.all(batchPromises);
        logger.debug(`Added batch of ${batch.length} documents to vector database`);
      }

      return documentIds;
    } catch (error) {
      logger.error(`Failed to add document batch: ${error.message}`, { error });
      throw error;
    }
  }

  /**
   * Update an existing document in the vector database
   * @param {string} id - Document ID
   * @param {Object} document - Updated document data
   * @returns {Promise<boolean>} Update success status
   */
  async updateDocument(id, document) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (!id) {
        throw new Error('Document ID is required');
      }

      const { title, content, category, metadata } = document;
      const properties = {};
      
      if (title) properties.title = title;
      if (content) properties.content = content;
      if (category) properties.category = category;
      if (metadata) properties.metadata = metadata;

      if (Object.keys(properties).length === 0) {
        throw new Error('At least one property must be provided for update');
      }

      await this.client.data
        .updater()
        .withClassName(this.className)
        .withId(id)
        .withProperties(properties)
        .do();

      logger.debug(`Updated document in vector database: ${id}`);
      return true;
    } catch (error) {
      logger.error(`Failed to update document: ${error.message}`, { error });
      throw error;
    }
  }

  /**
   * Delete a document from the vector database
   * @param {string} id - Document ID
   * @returns {Promise<boolean>} Deletion success status
   */
  async deleteDocument(id) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (!id) {
        throw new Error('Document ID is required');
      }

      await this.client.data
        .deleter()
        .withClassName(this.className)
        .withId(id)
        .do();

      logger.debug(`Deleted document from vector database: ${id}`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete document: ${error.message}`, { error });
      throw error;
    }
  }

  /**
   * Delete all documents for a specific tenant
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<boolean>} Deletion success status
   */
  async deleteAllTenantDocuments(tenantId) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (!tenantId) {
        throw new Error('Tenant ID is required');
      }

      // Weaviate doesn't have a direct "delete where" operation,
      // so we need to find all documents for the tenant first
      const result = await this.client.graphql
        .get()
        .withClassName(this.className)
        .withFields('_additional { id }')
        .withWhere({
          operator: 'Equal',
          path: ['tenantId'],
          valueString: tenantId
        })
        .do();

      const documents = result.data.Get[this.className] || [];
      
      // Delete each document
      for (const doc of documents) {
        await this.client.data
          .deleter()
          .withClassName(this.className)
          .withId(doc._additional.id)
          .do();
      }

      logger.debug(`Deleted ${documents.length} documents for tenant: ${tenantId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete tenant documents: ${error.message}`, { error });
      throw error;
    }
  }

  /**
   * Perform semantic search on documents
   * @param {Object} params - Search parameters
   * @param {string} params.query - Search query text
   * @param {string} params.tenantId - Tenant ID to restrict search
   * @param {string} [params.category] - Optional category filter
   * @param {number} [params.limit=10] - Maximum number of results
   * @returns {Promise<Array<Object>>} Search results
   */
  async semanticSearch({ query, tenantId, category, limit = 10 }) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (!query || !tenantId) {
        throw new Error('Query and tenantId are required');
      }

      // Build where filter
      const whereFilter = {
        operator: 'And',
        operands: [
          {
            operator: 'Equal',
            path: ['tenantId'],
            valueString: tenantId
          }
        ]
      };

      // Add category filter if provided
      if (category) {
        whereFilter.operands.push({
          operator: 'Equal',
          path: ['category'],
          valueString: category
        });
      }

      // Perform the search
      const result = await this.client.graphql
        .get()
        .withClassName(this.className)
        .withFields('title content category metadata _additional { id certainty distance }')
        .withNearText({ concepts: [query] })
        .withWhere(whereFilter)
        .withLimit(limit)
        .do();

      const searchResults = result.data.Get[this.className] || [];
      
      // Format results
      return searchResults.map(item => ({
        id: item._additional.id,
        title: item.title,
        content: item.content,
        category: item.category,
        metadata: item.metadata,
        relevance: {
          certainty: item._additional.certainty,
          distance: item._additional.distance
        }
      }));
    } catch (error) {
      logger.error(`Failed to perform semantic search: ${error.message}`, { error });
      throw error;
    }
  }

  /**
   * Get document by ID
   * @param {string} id - Document ID
   * @returns {Promise<Object|null>} Document data or null if not found
   */
  async getDocument(id) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (!id) {
        throw new Error('Document ID is required');
      }

      const result = await this.client.data
        .getterById()
        .withClassName(this.className)
        .withId(id)
        .do();

      if (!result) {
        return null;
      }

      return {
        id: result.id,
        title: result.properties.title,
        content: result.properties.content,
        category: result.properties.category,
        tenantId: result.properties.tenantId,
        metadata: result.properties.metadata
      };
    } catch (error) {
      logger.error(`Failed to get document: ${error.message}`, { error });
      throw error;
    }
  }

  /**
   * List all documents for a tenant with pagination
   * @param {string} tenantId - Tenant ID
   * @param {number} [limit=100] - Maximum number of results
   * @param {number} [offset=0] - Offset for pagination
   * @returns {Promise<Array<Object>>} List of documents
   */
  async listDocuments(tenantId, limit = 100, offset = 0) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (!tenantId) {
        throw new Error('Tenant ID is required');
      }

      const result = await this.client.graphql
        .get()
        .withClassName(this.className)
        .withFields('title content category metadata _additional { id }')
        .withWhere({
          operator: 'Equal',
          path: ['tenantId'],
          valueString: tenantId
        })
        .withLimit(limit)
        .withOffset(offset)
        .do();

      const documents = result.data.Get[this.className] || [];
      
      return documents.map(item => ({
        id: item._additional.id,
        title: item.title,
        content: item.content,
        category: item.category,
        metadata: item.metadata
      }));
    } catch (error) {
      logger.error(`Failed to list documents: ${error.message}`, { error });
      throw error;
    }
  }
}

module.exports = new VectorDBService();
