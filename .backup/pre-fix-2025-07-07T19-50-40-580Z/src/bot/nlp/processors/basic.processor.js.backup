/**
 * Basic NLP Processor
 * 
 * Simple rule-based NLP processor for basic intent recognition
 */

require('@src/bot\nlp\base.processor');

class BasicProcessor extends BaseNLPProcessor {
  /**
   * Constructor
   * @param {Object} config - Processor configuration
   */
  constructor(config = {}) {
    super(config);
    this.name = 'basic';
    this.version = '1.0.0';
    this.ready = false;
    this.patterns = {};
  }
  
  /**
   * Initialize the processor
   * @returns {Promise<boolean>} - True if initialization was successful
   */
  async initialize() {
    try {
      console.log('Initializing Basic NLP processor with config:', this.config);
      
      // Load default patterns if not provided in config
      this.patterns = this.config.patterns || {
        greeting: [
          /hello/i,
          /hi there/i,
          /hey/i,
          /good (morning|afternoon|evening)/i
        ],
        farewell: [
          /goodbye/i,
          /bye/i,
          /see you/i,
          /talk to you later/i
        ],
        thanks: [
          /thank you/i,
          /thanks/i,
          /appreciate it/i
        ],
        help: [
          /help/i,
          /assist/i,
          /support/i,
          /how (can|do) (i|you)/i
        ]
      };
      
      this.ready = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize Basic NLP processor:', error);
      this.ready = false;
      return false;
    }
  }
  
  /**
   * Process text to extract intents and entities
   * @param {string} text - Text to process
   * @param {Object} context - Processing context
   * @returns {Promise<Object>} - Processing results with intents and entities
   */
  async process(text, context = {}) {
    if (!this.ready) {
      throw new Error('Basic NLP processor is not initialized');
    }
    
    try {
      console.log('Processing text with Basic NLP:', text, context);
      
      const intents = [];
      const entities = [];
      
      // Check text against patterns
      Object.keys(this.patterns).forEach(intent => {
        const patterns = this.patterns[intent];
        
        patterns.forEach(pattern => {
          if (pattern.test(text)) {
            intents.push({
              name: intent,
              confidence: 1.0, // Simple rule-based matching has full confidence
              pattern: pattern.toString()
            });
          }
        });
      });
      
      // If no intents matched, add fallback intent
      if (intents.length === 0) {
        intents.push({
          name: 'fallback',
          confidence: 1.0
        });
      }
      
      // Extract simple entities (very basic implementation)
      // In a real implementation, this would be more sophisticated
      const entityPatterns = {
        date: /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
        email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g
      };
      
      Object.keys(entityPatterns).forEach(entityType => {
        const pattern = entityPatterns[entityType];
        let match;
        
        while ((match = pattern.exec(text)) !== null) {
          entities.push({
            name: entityType,
            value: match[0],
            start: match.index,
            end: match.index + match[0].length,
            confidence: 1.0
          });
        }
      });
      
      return {
        text,
        language: context.language || 'en',
        intents,
        entities,
        metadata: {
          processor: this.name,
          processingTime: 5 // ms
        }
      };
    } catch (error) {
      console.error('Error processing text with Basic NLP:', error);
      throw error;
    }
  }
  
  /**
   * Train the processor with new data
   * @param {Array} trainingData - Training data
   * @returns {Promise<Object>} - Training results
   */
  async train(trainingData) {
    try {
      console.log('Training Basic NLP processor with data:', trainingData);
      
      // In a real implementation, this would update the patterns
      // based on the training data
      
      // For now, just add any new patterns from the training data
      trainingData.forEach(item => {
        if (item.intent && item.pattern) {
          if (!this.patterns[item.intent]) {
            this.patterns[item.intent] = [];
          }
          
          // Convert string pattern to RegExp
          const pattern = new RegExp(item.pattern, 'i');
          this.patterns[item.intent].push(pattern);
        }
      });
      
      return {
        success: true,
        timestamp: new Date().toISOString(),
        metrics: {
          samples: trainingData.length,
          patternsAdded: trainingData.length
        }
      };
    } catch (error) {
      console.error('Error training Basic NLP processor:', error);
      throw error;
    }
  }
  
  /**
   * Get processor status
   * @returns {Object} - Status information
   */
  getStatus() {
    return {
      name: this.name,
      version: this.version,
      ready: this.ready,
      patternCount: Object.keys(this.patterns).reduce(
        (count, intent) => count + this.patterns[intent].length, 
        0
      ),
      intents: Object.keys(this.patterns)
    };
  }
  
  /**
   * Clean up resources
   * @returns {Promise<void>}
   */
  async cleanup() {
    this.ready = false;
    return Promise.resolve();
  }
}

module.exports = BasicProcessor;
