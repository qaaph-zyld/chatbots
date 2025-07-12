/**
 * Database Models
 * 
 * Defines the data models for the application
 */

// This is a placeholder for actual database models
// In a real implementation, we would use a proper ORM or database client
// such as Mongoose (for MongoDB) or Sequelize (for SQL databases)

/**
 * Chatbot model
 * @typedef {Object} Chatbot
 * @property {string} id - Unique identifier
 * @property {string} name - Chatbot name
 * @property {string} description - Chatbot description
 * @property {string} engine - Engine type (e.g., 'botpress', 'rasa', 'huggingface')
 * @property {Object} configuration - Engine-specific configuration
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * Template model
 * @typedef {Object} Template
 * @property {string} id - Unique identifier
 * @property {string} name - Template name
 * @property {string} description - Template description
 * @property {string} category - Template category
 * @property {Object} content - Template content and structure
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * Integration model
 * @typedef {Object} Integration
 * @property {string} id - Unique identifier
 * @property {string} name - Integration name
 * @property {string} type - Integration type (e.g., 'slack', 'facebook', 'website')
 * @property {Object} configuration - Integration-specific configuration
 * @property {boolean} enabled - Whether the integration is enabled
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * Conversation model
 * @typedef {Object} Conversation
 * @property {string} id - Unique identifier
 * @property {string} chatbotId - ID of the associated chatbot
 * @property {string} sessionId - Session identifier
 * @property {Array<Message>} messages - Array of messages in the conversation
 * @property {Object} context - Conversation context data
 * @property {Date} startedAt - Conversation start timestamp
 * @property {Date} lastMessageAt - Last message timestamp
 */

/**
 * Message model
 * @typedef {Object} Message
 * @property {string} id - Unique identifier
 * @property {string} conversationId - ID of the associated conversation
 * @property {string} text - Message text content
 * @property {string} sender - Message sender ('user' or 'bot')
 * @property {Object} metadata - Additional message metadata
 * @property {Date} timestamp - Message timestamp
 */

// In-memory storage for development purposes
const db = {
  chatbots: [],
  templates: [],
  integrations: [],
  conversations: [],
  messages: []
};

module.exports = {
  db,
  // Export model types for documentation purposes
  models: {
    Chatbot: {},
    Template: {},
    Integration: {},
    Conversation: {},
    Message: {}
  }
};
