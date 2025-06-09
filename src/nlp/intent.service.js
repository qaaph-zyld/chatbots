/**
 * Intent Recognition Service
 * 
 * Provides advanced intent recognition capabilities for chatbots
 */

require('@src/nlp\nlp.service');
require('@src/nlp\entity.service');
require('@src/utils');

/**
 * Intent Recognition Service class
 */
class IntentService {
  /**
   * Constructor
   * @param {Object} options - Intent service options
   */
  constructor(options = {}) {
    this.options = {
      confidenceThreshold: 0.6,
      ...options
    };
    
    // Custom intent patterns
    this.intentPatterns = new Map();
    
    // Initialize default patterns
    this._initializeDefaultPatterns();
    
    logger.info('Intent Recognition Service initialized');
  }
  
  /**
   * Initialize default intent patterns
   * @private
   */
  _initializeDefaultPatterns() {
    // Greeting intent
    this.addIntentPattern('greeting', [
      'hello',
      'hi',
      'hey',
      'greetings',
      'good morning',
      'good afternoon',
      'good evening',
      'howdy'
    ]);
    
    // Farewell intent
    this.addIntentPattern('farewell', [
      'goodbye',
      'bye',
      'see you',
      'farewell',
      'take care',
      'until next time',
      'have a good day'
    ]);
    
    // Help intent
    this.addIntentPattern('help', [
      'help',
      'assist',
      'support',
      'guidance',
      'what can you do',
      'how does this work',
      'show me how',
      'need help'
    ]);
    
    // Thanks intent
    this.addIntentPattern('thanks', [
      'thank you',
      'thanks',
      'appreciate it',
      'grateful',
      'thank you so much',
      'thanks a lot'
    ]);
  }
  
  /**
   * Add an intent pattern
   * @param {string} intent - Intent name
   * @param {Array<string>} patterns - Array of patterns for this intent
   * @returns {IntentService} - This instance for chaining
   */
  addIntentPattern(intent, patterns) {
    this.intentPatterns.set(intent, patterns);
    return this;
  }
  
  /**
   * Remove an intent pattern
   * @param {string} intent - Intent name to remove
   * @returns {boolean} - True if intent was removed, false otherwise
   */
  removeIntentPattern(intent) {
    return this.intentPatterns.delete(intent);
  }
  
  /**
   * Recognize intent using patterns
   * @param {string} text - Text to recognize intent from
   * @returns {Object} - Intent recognition result
   */
  recognizeIntentWithPatterns(text) {
    const normalizedText = text.toLowerCase();
    let bestMatch = { intent: null, confidence: 0 };
    
    // Check each intent pattern
    for (const [intent, patterns] of this.intentPatterns.entries()) {
      for (const pattern of patterns) {
        if (normalizedText.includes(pattern.toLowerCase())) {
          // Simple confidence calculation based on pattern length relative to text
          const confidence = pattern.length / normalizedText.length;
          
          if (confidence > bestMatch.confidence) {
            bestMatch = { intent, confidence };
          }
        }
      }
    }
    
    return bestMatch.confidence >= this.options.confidenceThreshold
      ? bestMatch
      : { intent: null, confidence: 0 };
  }
  
  /**
   * Recognize intent using NLP service
   * @param {string} text - Text to recognize intent from
   * @returns {Promise<Object>} - Intent recognition result
   */
  async recognizeIntentWithNLP(text) {
    try {
      const result = await nlpService.parseIntent(text);
      
      return result.confidence >= this.options.confidenceThreshold
        ? { intent: result.intent, confidence: result.confidence }
        : { intent: null, confidence: 0 };
    } catch (error) {
      logger.error('Error recognizing intent with NLP:', error.message);
      return { intent: null, confidence: 0 };
    }
  }
  
  /**
   * Recognize intent using both patterns and NLP
   * @param {string} text - Text to recognize intent from
   * @returns {Promise<Object>} - Intent recognition result
   */
  async recognizeIntent(text) {
    try {
      // Get intent from patterns
      const patternResult = this.recognizeIntentWithPatterns(text);
      
      // If pattern confidence is high enough, return it
      if (patternResult.confidence >= 0.8) {
        return patternResult;
      }
      
      // Get intent from NLP
      const nlpResult = await this.recognizeIntentWithNLP(text);
      
      // Return the result with higher confidence
      return patternResult.confidence > nlpResult.confidence
        ? patternResult
        : nlpResult;
    } catch (error) {
      logger.error('Error recognizing intent:', error.message);
      return { intent: null, confidence: 0 };
    }
  }
  
  /**
   * Process message to extract intent and entities
   * @param {string} text - Text to process
   * @returns {Promise<Object>} - Processed message with intent and entities
   */
  async processMessage(text) {
    try {
      // Recognize intent
      const intentResult = await this.recognizeIntent(text);
      
      // Extract entities
      const entityResult = await entityService.processMessage(text);
      
      return {
        text,
        intent: intentResult.intent,
        intentConfidence: intentResult.confidence,
        hasIntent: intentResult.intent !== null,
        entities: entityResult.entities,
        entitiesByType: entityResult.entitiesByType,
        hasEntities: entityResult.hasEntities
      };
    } catch (error) {
      logger.error('Error processing message for intent:', error.message);
      return {
        text,
        intent: null,
        intentConfidence: 0,
        hasIntent: false,
        entities: [],
        entitiesByType: {},
        hasEntities: false
      };
    }
  }
  
  /**
   * Get suggested responses based on intent
   * @param {string} intent - Intent to get responses for
   * @returns {Array<string>} - Array of suggested responses
   */
  getSuggestedResponses(intent) {
    const responses = {
      greeting: [
        'Hello! How can I help you today?',
        'Hi there! What can I do for you?',
        'Greetings! How may I assist you?'
      ],
      farewell: [
        'Goodbye! Have a great day!',
        'Farewell! Feel free to return if you need anything else.',
        'Take care! It was nice chatting with you.'
      ],
      help: [
        'I can help you with various tasks. What do you need assistance with?',
        'I\'m here to help! What would you like to know?',
        'I can provide information, answer questions, or assist with tasks. What do you need?'
      ],
      thanks: [
        'You\'re welcome! Is there anything else I can help with?',
        'Happy to help! Let me know if you need anything else.',
        'My pleasure! Is there something else you\'d like to know?'
      ]
    };
    
    return responses[intent] || [];
  }
}

// Create singleton instance
const intentService = new IntentService();

module.exports = intentService;
