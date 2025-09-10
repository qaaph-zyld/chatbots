/**
 * Chatbot Interface Definitions
 * Type definitions and contracts for chatbot components
 */

/**
 * Chatbot configuration interface
 */
const ChatbotConfig = {
  id: 'string',
  name: 'string',
  description: 'string',
  engine: 'string',
  settings: 'object',
  isActive: 'boolean',
  createdAt: 'date',
  updatedAt: 'date'
};

/**
 * Message interface
 */
const Message = {
  id: 'string',
  content: 'string',
  type: 'string', // 'user' | 'bot' | 'system'
  timestamp: 'date',
  metadata: 'object'
};

/**
 * Conversation interface
 */
const Conversation = {
  id: 'string',
  chatbotId: 'string',
  userId: 'string',
  messages: 'array', // Array of Message objects
  context: 'object',
  status: 'string', // 'active' | 'closed' | 'archived'
  startedAt: 'date',
  lastActivity: 'date'
};

/**
 * Response interface
 */
const BotResponse = {
  content: 'string',
  type: 'string', // 'text' | 'image' | 'card' | 'quick_reply'
  confidence: 'number',
  intent: 'string',
  entities: 'array',
  metadata: 'object'
};

/**
 * Training data interface
 */
const TrainingData = {
  intent: 'string',
  examples: 'array', // Array of example phrases
  responses: 'array', // Array of possible responses
  entities: 'array'
};

module.exports = {
  ChatbotConfig,
  Message,
  Conversation,
  BotResponse,
  TrainingData
};
