/**
 * Chatbot Core Service
 * 
 * Central service for managing chatbot instances and processing messages
 */

const { createEngine, getAvailableEngines } = require('./engines');
const config = require('../config');
const { analyticsService, insightsService, learningService } = require('../analytics');
const { contextService, topicService, entityService, referenceService } = require('../context');
const { logger } = require('../utils');

class ChatbotService {
  constructor() {
    this.chatbots = new Map();
    this.availableEngines = getAvailableEngines();
  }
  
  /**
   * Initialize the chatbot service
   * @returns {Promise<boolean>} - True if initialization was successful
   */
  async initialize() {
    try {
      console.log('Initializing Chatbot Service');
      return true;
    } catch (error) {
      console.error('Failed to initialize Chatbot Service:', error);
      return false;
    }
  }
  
  /**
   * Create a new chatbot instance
   * @param {Object} chatbotConfig - Chatbot configuration
   * @returns {Promise<Object>} - Chatbot instance data
   */
  async createChatbot(chatbotConfig) {
    try {
      const { id, name, description, engine, engineConfig } = chatbotConfig;
      
      if (!id || !name || !engine) {
        throw new Error('Missing required chatbot configuration: id, name, engine');
      }
      
      if (!this.availableEngines.includes(engine.toLowerCase())) {
        throw new Error(`Unsupported engine type: ${engine}. Available engines: ${this.availableEngines.join(', ')}`);
      }
      
      // Create engine instance
      const engineInstance = createEngine(engine, engineConfig || {});
      
      // Initialize engine
      await engineInstance.initialize();
      
      // Create chatbot data
      const chatbot = {
        id,
        name,
        description: description || '',
        engine,
        engineInstance,
        createdAt: new Date().toISOString(),
        status: 'active'
      };
      
      // Store chatbot instance
      this.chatbots.set(id, chatbot);
      
      return {
        id: chatbot.id,
        name: chatbot.name,
        description: chatbot.description,
        engine: chatbot.engine,
        status: chatbot.status,
        createdAt: chatbot.createdAt
      };
    } catch (error) {
      console.error('Error creating chatbot:', error);
      throw error;
    }
  }
  
  /**
   * Get chatbot by ID
   * @param {string} id - Chatbot ID
   * @returns {Object} - Chatbot data
   */
  getChatbot(id) {
    const chatbot = this.chatbots.get(id);
    
    if (!chatbot) {
      throw new Error(`Chatbot with ID ${id} not found`);
    }
    
    return {
      id: chatbot.id,
      name: chatbot.name,
      description: chatbot.description,
      engine: chatbot.engine,
      status: chatbot.status,
      createdAt: chatbot.createdAt
    };
  }
  
  /**
   * Get all chatbots
   * @returns {Array<Object>} - Array of chatbot data
   */
  getAllChatbots() {
    return Array.from(this.chatbots.values()).map(chatbot => ({
      id: chatbot.id,
      name: chatbot.name,
      description: chatbot.description,
      engine: chatbot.engine,
      status: chatbot.status,
      createdAt: chatbot.createdAt
    }));
  }
  
  /**
   * Train a chatbot with domain-specific data
   * @param {string} chatbotId - Chatbot ID
   * @param {Array} trainingData - Array of training examples
   * @param {Object} options - Training options
   * @returns {Promise<Object>} - Training results
   */
  async trainChatbot(chatbotId, trainingData, options = {}) {
    const chatbot = this.chatbots.get(chatbotId);
    
    if (!chatbot) {
      throw new Error(`Chatbot with ID ${chatbotId} not found`);
    }
    
    try {
      logger.info(`Training chatbot ${chatbotId} with ${trainingData.length} examples for domain: ${options.domain || 'general'}`);
      
      // Execute pre-train hook for plugins
      const trainingOptions = await pluginService.executeHook(chatbotId, 'pre-train', {
        trainingData,
        options
      });
      
      // Train the chatbot's engine
      const result = await chatbot.engineInstance.train(trainingOptions.trainingData);
      
      // Add domain information to result
      result.domain = options.domain || 'general';
      
      // Execute post-train hook for plugins
      const finalResult = await pluginService.executeHook(chatbotId, 'post-train', result);
      
      logger.info(`Chatbot ${chatbotId} training completed with ${finalResult.metrics ? finalResult.metrics.accuracy : 'unknown'} accuracy`);
      
      return finalResult;
    } catch (error) {
      logger.error(`Error training chatbot ${chatbotId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Process a message with NLP services
   * @param {string} message - User message
   * @returns {Promise<Object>} - NLP analysis results
   * @private
   */
  async _processMessageWithNLP(message) {
    try {
      const { nlpService, intentService, entityService, sentimentService } = require('../nlp');
      
      // Process in parallel for efficiency
      const [intentResult, entityResult, sentimentResult] = await Promise.all([
        intentService.processMessage(message),
        entityService.processMessage(message),
        sentimentService.processMessage(message)
      ]);
      
      // Generate embeddings for semantic search
      const embeddingsResult = await nlpService.generateEmbeddings(message);
      
      // Combine all NLP analysis results
      return {
        intent: intentResult.intent,
        intentConfidence: intentResult.intentConfidence,
        entities: entityResult.entities,
        entitiesByType: entityResult.entitiesByType,
        sentiment: sentimentResult.sentiment,
        sentimentScore: sentimentResult.score,
        sentimentMagnitude: sentimentResult.magnitude,
        embeddings: embeddingsResult.embeddings || [],
        suggestedResponses: [
          ...intentResult.hasIntent ? intentService.getSuggestedResponses(intentResult.intent) : [],
          ...sentimentResult.suggestedResponses || []
        ]
      };
    } catch (error) {
      logger.error('Error processing message with NLP:', error.message);
      return {
        intent: null,
        intentConfidence: 0,
        entities: [],
        entitiesByType: {},
        sentiment: 'neutral',
        sentimentScore: 0,
        sentimentMagnitude: 0,
        embeddings: [],
        suggestedResponses: []
      };
    }
  }
  
  /**
   * Process a message with a specific chatbot
   * @param {string} chatbotId - Chatbot ID
   * @param {string|Object} message - User message (string or multi-modal input object)
   * @param {string} userId - User ID
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} - Processed response
   */
  async processMessage(chatbotId, message, userId, options = {}) {
    const chatbot = this.chatbots.get(chatbotId);
    
    if (!chatbot) {
      throw new Error(`Chatbot with ID ${chatbotId} not found`);
    }
    
    try {
      logger.info(`Processing message for chatbot ${chatbotId} from user ${userId}`);
      
      // Create conversation if it doesn't exist
      if (!this.conversations.has(userId)) {
        await this.createConversation(chatbotId, userId);
      }
      
      // Get conversation
      const conversation = this.conversations.get(userId);
      
      // Process multi-modal input if needed
      const { inputService, outputService } = require('../multimodal');
      let processedInput;
      let textMessage;
      
      if (typeof message === 'string') {
        // Simple text message
        textMessage = message;
        processedInput = {
          type: 'text',
          content: message,
          processed: true
        };
      } else if (typeof message === 'object') {
        // Multi-modal input
        processedInput = await inputService.processInput(message);
        
        // Extract text from the input for NLP processing
        if (processedInput.type === 'text') {
          textMessage = processedInput.content;
        } else if (processedInput.type === 'audio' && processedInput.transcription) {
          textMessage = processedInput.transcription;
        } else if (processedInput.type === 'image' && processedInput.analysis && 
                  processedInput.analysis.textAnnotations && 
                  processedInput.analysis.textAnnotations.length > 0) {
          textMessage = processedInput.analysis.textAnnotations[0].description;
        } else {
          // Default to empty string if no text can be extracted
          textMessage = '';
        }
      } else {
        throw new Error('Invalid message format');
      }
      
      // Add message to conversation history (both text and full input)
      conversation.addMessage('user', textMessage, { input: processedInput });
      
      // Get personality for the chatbot
      const personality = await personalityService.getChatbotPersonality(chatbotId);
      
      // Get relevant knowledge items
      const knowledgeItems = await knowledgeBaseService.searchRelevantKnowledgeItems(
        chatbotId,
        textMessage
      );
      
      // Process message with NLP services
      const nlpAnalysis = await this._processMessageWithNLP(textMessage);

      // Process message for context awareness
      const contextData = await contextService.processMessageForContext(
        {
          role: 'user',
          content: textMessage,
          timestamp: new Date()
        },
        nlpAnalysis
      );

      // Update context with extracted data
      await contextService.updateContext(chatbotId, userId, conversation.id, contextData);

      // Track topic for conversation
      const topicInfo = await topicService.trackTopic(
        chatbotId,
        userId,
        conversation.id,
        textMessage,
        nlpAnalysis
      );

      // Process entities for entity memory
      await entityService.processEntities(
        chatbotId,
        userId,
        conversation.id,
        conversation.getLastMessageId('user'),
        nlpAnalysis.entities
      );

      // Get current context
      const currentContext = await contextService.getContext(chatbotId, userId, conversation.id);

      // Prepare message data
      const messageData = {
        message: textMessage,
        input: processedInput,
        userId,
        conversation: conversation.getHistory(),
        personality,
        knowledgeItems,
        nlpAnalysis,
        context: currentContext,
        currentTopic: topicInfo.currentTopic,
        options
      };
      
      // Execute pre-process hook for plugins
      const processedMessageData = await pluginService.executeHook(chatbotId, 'pre-process', messageData);
      
      // Generate response
      const response = await chatbot.engineInstance.generateResponse(
        processedMessageData.message,
        processedMessageData.conversation,
        {
          input: processedMessageData.input,
          personality: processedMessageData.personality,
          knowledgeItems: processedMessageData.knowledgeItems,
          nlpAnalysis: processedMessageData.nlpAnalysis,
          context: processedMessageData.context,
          currentTopic: processedMessageData.currentTopic,
          ...processedMessageData.options
        }
      );
      
      // Process multi-modal output if needed
      let processedOutput;
      
      if (typeof response === 'string') {
        // Simple text response
        processedOutput = await outputService.processOutput({
          type: 'text',
          content: response
        });
      } else if (Array.isArray(response)) {
        // Multiple outputs
        processedOutput = await outputService.processOutputs(response);
      } else if (typeof response === 'object') {
        // Single multi-modal output
        processedOutput = await outputService.processOutput(response);
      } else {
        throw new Error('Invalid response format');
      }
      
      // Execute post-process hook for plugins
      const processedResponse = await pluginService.executeHook(chatbotId, 'post-process', {
        originalMessage: textMessage,
        originalInput: processedInput,
        response: processedOutput,
        messageData: processedMessageData
      });

      // Apply reference resolution to response if it's text
      let resolvedResponse = processedResponse.response;
      if (typeof resolvedResponse === 'string' || 
          (typeof resolvedResponse === 'object' && resolvedResponse.type === 'text')) {
        const textToResolve = typeof resolvedResponse === 'string' ? 
          resolvedResponse : resolvedResponse.content;
        
        const resolvedResult = await referenceService.applyResolvedReferences(
          chatbotId,
          userId,
          conversation.id,
          {
            content: textToResolve,
            role: 'bot',
            timestamp: new Date()
          }
        );
        
        if (typeof resolvedResponse === 'string') {
          resolvedResponse = resolvedResult.content;
        } else {
          resolvedResponse.content = resolvedResult.content;
          resolvedResponse.metadata = {
            ...resolvedResponse.metadata,
            resolvedReferences: resolvedResult.metadata?.resolvedReferences
          };
        }
      }
      
      // Add response to conversation history
      const responseText = this._getResponseText(resolvedResponse);
      conversation.addMessage('bot', responseText, { output: resolvedResponse });

      // Process bot message for context
      const botContextData = await contextService.processMessageForContext(
        {
          role: 'bot',
          content: responseText,
          timestamp: new Date()
        },
        {}
      );

      // Update context with bot message
      await contextService.updateContext(chatbotId, userId, conversation.id, botContextData);
      
      // Store NLP analysis in conversation metadata
      conversation.setMetadata('lastNlpAnalysis', nlpAnalysis);
      
      // Track message for analytics
      this._trackMessageForAnalytics({
        chatbotId,
        userId,
        conversationId: conversation.id,
        role: 'user',
        content: textMessage,
        timestamp: new Date(),
        nlpAnalysis,
        input: processedInput
      });
      
      // Track response for analytics
      this._trackMessageForAnalytics({
        chatbotId,
        userId,
        conversationId: conversation.id,
        role: 'bot',
        content: responseText,
        timestamp: new Date(),
        output: processedResponse.response
      });
      
      logger.info(`Generated response for chatbot ${chatbotId} to user ${userId}`);
      
      // Get conversation summary for context awareness
      const conversationSummary = await contextService.getConversationSummary(
        chatbotId,
        userId,
        conversation.id
      );

      return {
        chatbotId,
        userId,
        message: textMessage,
        input: processedInput,
        response: resolvedResponse,
        conversationId: conversation.id,
        nlpAnalysis,
        context: {
          currentTopic: topicInfo.currentTopic,
          activeTopics: topicInfo.activeTopics,
          summary: conversationSummary
        }
      };
    } catch (error) {
      logger.error(`Error processing message for chatbot ${chatbotId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Extract text from a multi-modal response for conversation history
   * @param {Object|Array} response - Response object or array
   * @returns {string} - Text representation of the response
   * @private
   */
  _getResponseText(response) {
    if (typeof response === 'string') {
      return response;
    } else if (Array.isArray(response)) {
      return response
        .map(item => this._getResponseText(item))
        .filter(Boolean)
        .join('\n');
    } else if (response && typeof response === 'object') {
      if (response.type === 'text' && response.content) {
        return response.content;
      } else if (response.type === 'card' && response.content) {
        return `${response.content.title}${response.content.subtitle ? ': ' + response.content.subtitle : ''}${response.content.text ? '\n' + response.content.text : ''}`;
      } else if (response.type === 'quick_reply' && response.content) {
        return response.content.text || '';
      } else if (response.type === 'carousel' && Array.isArray(response.content)) {
        return response.content
          .map(card => this._getResponseText({ type: 'card', content: card }))
          .join('\n');
      } else if (response.type === 'image') {
        return '[Image]' + (response.alt ? ': ' + response.alt : '');
      } else if (response.type === 'audio') {
        return '[Audio]';
      } else if (response.type === 'video') {
        return '[Video]';
      } else if (response.type === 'file') {
        return '[File]';
      } else if (response.type === 'location') {
        return '[Location]' + (response.content && response.content.address ? ': ' + response.content.address : '');
      }
    }
    
    return '';
  }
  
  /**
   * Track message for analytics
   * @param {Object} messageData - Message data to track
   * @private
   */
  async _trackMessageForAnalytics(messageData) {
    try {
      await analyticsService.trackMessage(messageData);
    } catch (error) {
      logger.error('Error tracking message for analytics:', error.message);
    }
  }
  
  /**
   * Rate a response for a specific conversation
   * @param {string} chatbotId - Chatbot ID
   * @param {string} conversationId - Conversation ID
   * @param {string} rating - Rating (positive, neutral, negative)
   * @param {Object} options - Additional options (query, response, comment)
   * @returns {Promise<Object>} - Rating results
   */
  async rateResponse(chatbotId, conversationId, rating, options = {}) {
    try {
      logger.info(`Rating response for chatbot ${chatbotId}, conversation ${conversationId}: ${rating}`);
      
      // Track rating in analytics
      await analyticsService.trackResponseRating(chatbotId, conversationId, rating);
      
      // If positive rating, add to learning
      if (rating === 'positive' && options.query && options.response) {
        await learningService.addLearningFromFeedback({
          chatbotId,
          type: 'query_response',
          query: options.query,
          response: options.response,
          conversationId,
          userId: options.userId,
          rating,
          comment: options.comment
        });
      }
      
      return { success: true, rating };
    } catch (error) {
      logger.error(`Error rating response for chatbot ${chatbotId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Generate insights for a chatbot
   * @param {string} chatbotId - Chatbot ID
   * @param {string} period - Period type (daily, weekly, monthly, all)
   * @returns {Promise<Object>} - Insights and recommendations
   */
  async generateInsights(chatbotId, period = 'monthly') {
    try {
      return await insightsService.generateInsights(chatbotId, period);
    } catch (error) {
      logger.error(`Error generating insights for chatbot ${chatbotId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Apply learning to a chatbot
   * @param {string} chatbotId - Chatbot ID
   * @returns {Promise<Object>} - Application results
   */
  async applyLearning(chatbotId) {
    try {
      // Generate learning items from analytics
      await learningService.generateLearningFromAnalytics(chatbotId);
      
      // Apply approved learning items
      const results = await learningService.applyLearning(chatbotId);
      
      logger.info(`Applied ${results.applied} learning items to chatbot ${chatbotId}`);
      
      return results;
    } catch (error) {
      logger.error(`Error applying learning for chatbot ${chatbotId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Delete a chatbot instance
   * @param {string} id - Chatbot ID
   * @returns {Promise<boolean>} - True if deletion was successful
   */
  async deleteChatbot(id) {
    const chatbot = this.chatbots.get(id);
    
    if (!chatbot) {
      throw new Error(`Chatbot with ID ${id} not found`);
    }
    
    try {
      // Clean up engine resources
      await chatbot.engineInstance.cleanup();
      
      // Remove chatbot from map
      this.chatbots.delete(id);
      
      return true;
    } catch (error) {
      console.error(`Error deleting chatbot ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Get available engine types
   * @returns {Array<string>} - Array of available engine types
   */
  getAvailableEngines() {
    return this.availableEngines;
  }
}

// Create singleton instance
const chatbotService = new ChatbotService();

module.exports = chatbotService;
