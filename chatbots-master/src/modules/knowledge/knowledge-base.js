/**
 * Knowledge Base Integration Module
 * 
 * Provides vector search capabilities using Weaviate for semantic search
 * and document embedding with open source models.
 */

const weaviate = require('weaviate-client');
const { pipeline } = require('@xenova/transformers');
const { logger } = require('../../utils/logger');

// Default configuration
const DEFAULT_CONFIG = {
  weaviate: {
    host: 'localhost',
    port: 8080,
    scheme: 'http'
  },
  classNames: {
    documents: 'KnowledgeDocument',
    chunks: 'KnowledgeChunk'
  },
  embedding: {
    model: 'Xenova/all-MiniLM-L6-v2', // Open source embedding model
    dimension: 384
  },
  chunkSize: 500, // Characters per chunk
  chunkOverlap: 100 // Character overlap between chunks
};

let client = null;
let embeddingPipeline = null;

/**
 * Initialize the knowledge base module
 * 
 * @param {Object} config - Configuration options
 * @returns {Promise<void>}
 */
const initialize = async (config = {}) => {
  const options = { ...DEFAULT_CONFIG, ...config };
  
  try {
    // Initialize Weaviate client
    client = weaviate.client({
      scheme: options.weaviate.scheme,
      host: `${options.weaviate.host}:${options.weaviate.port}`
    });
    
    // Check if Weaviate is available
    await client.misc.readiness().then(result => {
      if (!result.status === 'OK') {
        throw new Error('Weaviate is not ready');
      }
    });
    
    logger.info('Knowledge Base: Connected to Weaviate successfully');
    
    // Initialize schema if it doesn't exist
    await initializeSchema(options);
    
    // Initialize embedding pipeline
    embeddingPipeline = await pipeline('feature-extraction', options.embedding.model);
    logger.info(`Knowledge Base: Initialized embedding model ${options.embedding.model}`);
    
    return true;
  } catch (err) {
    logger.error(`Knowledge Base: Initialization failed: ${err.message}`);
    throw err;
  }
};

/**
 * Initialize Weaviate schema for knowledge base
 * 
 * @param {Object} options - Configuration options
 * @returns {Promise<void>}
 */
const initializeSchema = async (options) => {
  try {
    // Check if document class exists
    const schemaRes = await client.schema.getter().do();
    const classes = schemaRes.classes || [];
    const classNames = classes.map(c => c.class);
    
    // Create document class if it doesn't exist
    if (!classNames.includes(options.classNames.documents)) {
      await client.schema.classCreator().withClass({
        class: options.classNames.documents,
        description: 'Knowledge base document',
        vectorizer: 'none', // We'll provide our own vectors
        properties: [
          {
            name: 'title',
            dataType: ['string'],
            description: 'Document title'
          },
          {
            name: 'content',
            dataType: ['text'],
            description: 'Document content'
          },
          {
            name: 'source',
            dataType: ['string'],
            description: 'Document source'
          },
          {
            name: 'metadata',
            dataType: ['object'],
            description: 'Document metadata'
          },
          {
            name: 'createdAt',
            dataType: ['date'],
            description: 'Document creation timestamp'
          },
          {
            name: 'updatedAt',
            dataType: ['date'],
            description: 'Document update timestamp'
          }
        ]
      }).do();
      
      logger.info(`Knowledge Base: Created schema class ${options.classNames.documents}`);
    }
    
    // Create chunk class if it doesn't exist
    if (!classNames.includes(options.classNames.chunks)) {
      await client.schema.classCreator().withClass({
        class: options.classNames.chunks,
        description: 'Knowledge base document chunk',
        vectorizer: 'none', // We'll provide our own vectors
        properties: [
          {
            name: 'content',
            dataType: ['text'],
            description: 'Chunk content'
          },
          {
            name: 'documentId',
            dataType: ['string'],
            description: 'Reference to parent document'
          },
          {
            name: 'index',
            dataType: ['int'],
            description: 'Chunk index in document'
          },
          {
            name: 'metadata',
            dataType: ['object'],
            description: 'Chunk metadata'
          }
        ]
      }).do();
      
      logger.info(`Knowledge Base: Created schema class ${options.classNames.chunks}`);
    }
  } catch (err) {
    logger.error(`Knowledge Base: Schema initialization failed: ${err.message}`);
    throw err;
  }
};

/**
 * Generate embeddings for text using the embedding model
 * 
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} - Vector embedding
 */
const generateEmbedding = async (text) => {
  if (!embeddingPipeline) {
    throw new Error('Knowledge Base: Embedding pipeline not initialized');
  }
  
  try {
    // Generate embedding
    const result = await embeddingPipeline(text, {
      pooling: 'mean',
      normalize: true
    });
    
    return Array.from(result.data);
  } catch (err) {
    logger.error(`Knowledge Base: Embedding generation failed: ${err.message}`);
    throw err;
  }
};

/**
 * Split text into chunks for embedding
 * 
 * @param {string} text - Text to split
 * @param {number} chunkSize - Size of each chunk
 * @param {number} chunkOverlap - Overlap between chunks
 * @returns {string[]} - Array of text chunks
 */
const splitTextIntoChunks = (text, chunkSize = DEFAULT_CONFIG.chunkSize, chunkOverlap = DEFAULT_CONFIG.chunkOverlap) => {
  const chunks = [];
  let startIndex = 0;
  
  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + chunkSize, text.length);
    chunks.push(text.substring(startIndex, endIndex));
    startIndex = endIndex - chunkOverlap;
  }
  
  return chunks;
};

/**
 * Add a document to the knowledge base
 * 
 * @param {Object} document - Document to add
 * @param {string} document.title - Document title
 * @param {string} document.content - Document content
 * @param {string} document.source - Document source
 * @param {Object} document.metadata - Document metadata
 * @returns {Promise<string>} - Document ID
 */
const addDocument = async (document) => {
  if (!client) {
    throw new Error('Knowledge Base: Not initialized');
  }
  
  try {
    // Generate document embedding
    const documentEmbedding = await generateEmbedding(document.title + ' ' + document.content);
    
    // Add document to Weaviate
    const documentId = await client.data.creator()
      .withClassName(DEFAULT_CONFIG.classNames.documents)
      .withProperties({
        title: document.title,
        content: document.content,
        source: document.source,
        metadata: document.metadata || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .withVector(documentEmbedding)
      .do();
    
    // Split document into chunks
    const chunks = splitTextIntoChunks(document.content);
    
    // Add chunks to Weaviate
    for (let i = 0; i < chunks.length; i++) {
      const chunkEmbedding = await generateEmbedding(chunks[i]);
      
      await client.data.creator()
        .withClassName(DEFAULT_CONFIG.classNames.chunks)
        .withProperties({
          content: chunks[i],
          documentId: documentId,
          index: i,
          metadata: {
            documentTitle: document.title,
            documentSource: document.source
          }
        })
        .withVector(chunkEmbedding)
        .do();
    }
    
    logger.info(`Knowledge Base: Added document ${documentId} with ${chunks.length} chunks`);
    
    return documentId;
  } catch (err) {
    logger.error(`Knowledge Base: Error adding document: ${err.message}`);
    throw err;
  }
};

/**
 * Get a document from the knowledge base
 * 
 * @param {string} documentId - Document ID
 * @returns {Promise<Object>} - Document object
 */
const getDocument = async (documentId) => {
  if (!client) {
    throw new Error('Knowledge Base: Not initialized');
  }
  
  try {
    const result = await client.data.getterById()
      .withClassName(DEFAULT_CONFIG.classNames.documents)
      .withId(documentId)
      .do();
    
    return result;
  } catch (err) {
    logger.error(`Knowledge Base: Error getting document: ${err.message}`);
    throw err;
  }
};

/**
 * Delete a document from the knowledge base
 * 
 * @param {string} documentId - Document ID
 * @returns {Promise<boolean>} - True if successful
 */
const deleteDocument = async (documentId) => {
  if (!client) {
    throw new Error('Knowledge Base: Not initialized');
  }
  
  try {
    // Delete document
    await client.data.deleter()
      .withClassName(DEFAULT_CONFIG.classNames.documents)
      .withId(documentId)
      .do();
    
    // Delete associated chunks
    const chunks = await client.graphql.get()
      .withClassName(DEFAULT_CONFIG.classNames.chunks)
      .withFields(['id'])
      .withWhere({
        operator: 'Equal',
        path: ['documentId'],
        valueString: documentId
      })
      .do();
    
    if (chunks.data.Get[DEFAULT_CONFIG.classNames.chunks]) {
      for (const chunk of chunks.data.Get[DEFAULT_CONFIG.classNames.chunks]) {
        await client.data.deleter()
          .withClassName(DEFAULT_CONFIG.classNames.chunks)
          .withId(chunk.id)
          .do();
      }
    }
    
    logger.info(`Knowledge Base: Deleted document ${documentId}`);
    
    return true;
  } catch (err) {
    logger.error(`Knowledge Base: Error deleting document: ${err.message}`);
    throw err;
  }
};

/**
 * Search the knowledge base using semantic search
 * 
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @param {number} options.limit - Maximum number of results
 * @param {number} options.threshold - Similarity threshold
 * @returns {Promise<Object[]>} - Search results
 */
const search = async (query, options = {}) => {
  if (!client) {
    throw new Error('Knowledge Base: Not initialized');
  }
  
  const searchOptions = {
    limit: options.limit || 10,
    threshold: options.threshold || 0.7
  };
  
  try {
    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);
    
    // Search chunks
    const chunkResults = await client.graphql.get()
      .withClassName(DEFAULT_CONFIG.classNames.chunks)
      .withFields(['content', 'documentId', 'index', 'metadata', '_additional { certainty }'])
      .withNearVector({ vector: queryEmbedding })
      .withLimit(searchOptions.limit)
      .do();
    
    // Filter results by threshold
    let results = chunkResults.data.Get[DEFAULT_CONFIG.classNames.chunks] || [];
    results = results.filter(result => result._additional.certainty >= searchOptions.threshold);
    
    // Get document details for each result
    const documentIds = [...new Set(results.map(result => result.documentId))];
    const documents = {};
    
    for (const documentId of documentIds) {
      const document = await getDocument(documentId);
      documents[documentId] = document;
    }
    
    // Format results
    const formattedResults = results.map(result => ({
      content: result.content,
      certainty: result._additional.certainty,
      document: documents[result.documentId],
      chunkIndex: result.index,
      metadata: result.metadata
    }));
    
    return formattedResults;
  } catch (err) {
    logger.error(`Knowledge Base: Error searching: ${err.message}`);
    throw err;
  }
};

/**
 * Close the knowledge base connection
 * 
 * @returns {Promise<void>}
 */
const shutdown = async () => {
  logger.info('Knowledge Base: Shutting down');
  client = null;
  embeddingPipeline = null;
};

module.exports = {
  initialize,
  addDocument,
  getDocument,
  deleteDocument,
  search,
  generateEmbedding,
  splitTextIntoChunks,
  shutdown
};