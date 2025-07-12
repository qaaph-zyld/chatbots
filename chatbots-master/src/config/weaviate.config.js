/**
 * Weaviate Vector Database Configuration
 * 
 * Configuration settings for connecting to Weaviate vector database
 */

module.exports = {
  // Connection settings
  scheme: process.env.WEAVIATE_SCHEME || 'http',
  host: process.env.WEAVIATE_HOST || 'localhost:8080',
  
  // Authentication (if needed)
  auth: {
    apiKey: process.env.WEAVIATE_API_KEY || '',
  },
  
  // Default class settings
  defaultClassName: 'Document',
  
  // Vector settings
  vectorizer: 'text2vec-transformers',
  
  // Chunking settings
  maxChunkSize: 5000,
  
  // Search settings
  defaultSearchLimit: 10,
  
  // Performance settings
  batchSize: 100,
  
  // Docker configuration for local development
  docker: {
    image: 'semitechnologies/weaviate:1.19.6',
    transformersImage: 'semitechnologies/transformers-inference:sentence-transformers-multi-qa-mpnet-base-dot-v1',
    port: 8080,
    volumes: ['weaviate_data:/var/lib/weaviate'],
    environment: {
      TRANSFORMERS_INFERENCE_API: 'http://t2v-transformers:8080',
      QUERY_DEFAULTS_LIMIT: '25',
      AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED: 'true',
      PERSISTENCE_DATA_PATH: '/var/lib/weaviate',
      DEFAULT_VECTORIZER_MODULE: 'text2vec-transformers',
      ENABLE_MODULES: 'text2vec-transformers',
      CLUSTER_HOSTNAME: 'node1'
    }
  }
};
