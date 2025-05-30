/**
 * Personality Message Processor
 * 
 * Applies personality modifiers to chatbot messages
 */

const { personalityService } = require('./index');
const { logger } = require('../utils');

/**
 * Personality Message Processor class
 */
class PersonalityMessageProcessor {
  /**
   * Constructor
   */
  constructor() {
    logger.info('Personality Message Processor initialized');
  }
  
  /**
   * Process message with personality modifiers
   * @param {string} chatbotId - Chatbot ID
   * @param {string} personalityId - Personality ID (optional)
   * @param {string} message - Original message
   * @param {Object} options - Processing options
   * @returns {Promise<string>} - Processed message
   */
  async processMessage(chatbotId, personalityId, message, options = {}) {
    try {
      if (!message) {
        return message;
      }
      
      // Get personality
      let personality;
      
      if (personalityId) {
        personality = await personalityService.getPersonalityById(personalityId);
      } else {
        personality = await personalityService.getDefaultPersonality(chatbotId);
      }
      
      // Apply personality modifiers to message
      let processedMessage = message;
      
      // Apply tone style modifiers
      if (!options.skipToneStyle) {
        processedMessage = this.applyToneStyleModifiers(processedMessage, personality.toneStyle);
      }
      
      // Apply response style modifiers
      if (!options.skipResponseStyle) {
        processedMessage = this.applyResponseStyleModifiers(processedMessage, personality.responseStyle);
      }
      
      // Apply behavioral tendencies
      if (!options.skipBehavioralTendencies) {
        processedMessage = this.applyBehavioralTendencies(processedMessage, personality.behavioralTendencies);
      }
      
      // Apply language patterns
      if (!options.skipLanguagePatterns) {
        processedMessage = this.applyLanguagePatterns(processedMessage, personality.languagePatterns);
      }
      
      return processedMessage;
    } catch (error) {
      logger.error('Error processing message with personality modifiers:', error.message);
      // Return original message if there's an error
      return message;
    }
  }
  
  /**
   * Apply tone style modifiers
   * @param {string} message - Original message
   * @param {Object} toneStyle - Tone style settings
   * @returns {string} - Modified message
   */
  applyToneStyleModifiers(message, toneStyle) {
    if (!message || !toneStyle) return message;
    
    let modifiedMessage = message;
    
    // Apply formality modifier
    if (toneStyle.formality !== undefined) {
      modifiedMessage = this.adjustFormality(modifiedMessage, toneStyle.formality);
    }
    
    // Apply friendliness modifier
    if (toneStyle.friendliness !== undefined) {
      modifiedMessage = this.adjustFriendliness(modifiedMessage, toneStyle.friendliness);
    }
    
    // Apply humor modifier
    if (toneStyle.humor !== undefined) {
      modifiedMessage = this.adjustHumor(modifiedMessage, toneStyle.humor);
    }
    
    return modifiedMessage;
  }
  
  /**
   * Apply response style modifiers
   * @param {string} message - Original message
   * @param {Object} responseStyle - Response style settings
   * @returns {string} - Modified message
   */
  applyResponseStyleModifiers(message, responseStyle) {
    if (!message || !responseStyle) return message;
    
    let modifiedMessage = message;
    
    // Apply verbosity modifier
    if (responseStyle.verbosity !== undefined) {
      modifiedMessage = this.adjustVerbosity(modifiedMessage, responseStyle.verbosity);
    }
    
    // Apply complexity modifier
    if (responseStyle.complexity !== undefined) {
      modifiedMessage = this.adjustComplexity(modifiedMessage, responseStyle.complexity);
    }
    
    return modifiedMessage;
  }
  
  /**
   * Apply behavioral tendencies
   * @param {string} message - Original message
   * @param {Object} behavioralTendencies - Behavioral tendencies settings
   * @returns {string} - Modified message
   */
  applyBehavioralTendencies(message, behavioralTendencies) {
    if (!message || !behavioralTendencies) return message;
    
    let modifiedMessage = message;
    
    // Apply proactiveness modifier
    if (behavioralTendencies.proactiveness !== undefined && behavioralTendencies.proactiveness > 0.7) {
      // Add proactive suggestions or follow-up questions
      if (!modifiedMessage.includes('?') && !modifiedMessage.includes('suggestion')) {
        modifiedMessage += ' Is there anything specific you would like to know more about?';
      }
    }
    
    // Apply curiosity modifier
    if (behavioralTendencies.curiosity !== undefined && behavioralTendencies.curiosity > 0.7) {
      // Add curious follow-up questions
      if (!modifiedMessage.includes('?')) {
        modifiedMessage += ' What do you think about this?';
      }
    }
    
    return modifiedMessage;
  }
  
  /**
   * Apply language patterns
   * @param {string} message - Original message
   * @param {Object} languagePatterns - Language patterns
   * @returns {string} - Modified message
   */
  applyLanguagePatterns(message, languagePatterns) {
    if (!message || !languagePatterns) return message;
    
    let modifiedMessage = message;
    
    // Apply greeting pattern if message starts with a greeting
    if (/^(hi|hello|hey|greetings)/i.test(message) && languagePatterns.greetings && languagePatterns.greetings.length > 0) {
      const randomGreeting = languagePatterns.greetings[Math.floor(Math.random() * languagePatterns.greetings.length)];
      modifiedMessage = modifiedMessage.replace(/^(hi|hello|hey|greetings)[,!]?\s/i, randomGreeting + ' ');
    }
    
    // Apply farewell pattern if message ends with a farewell
    if (/(goodbye|bye|farewell|see you|talk to you later)\.?$/i.test(message) && languagePatterns.farewells && languagePatterns.farewells.length > 0) {
      const randomFarewell = languagePatterns.farewells[Math.floor(Math.random() * languagePatterns.farewells.length)];
      modifiedMessage = modifiedMessage.replace(/(goodbye|bye|farewell|see you|talk to you later)\.?$/i, randomFarewell);
    }
    
    return modifiedMessage;
  }
  
  /**
   * Adjust formality of message
   * @param {string} message - Original message
   * @param {number} formalityLevel - Formality level (0-1)
   * @returns {string} - Modified message
   */
  adjustFormality(message, formalityLevel) {
    if (!message) return message;
    
    // For demonstration purposes, we'll just modify some common phrases
    if (formalityLevel > 0.7) {
      // More formal
      return message
        .replace(/hi\b/gi, 'Hello')
        .replace(/hey\b/gi, 'Hello')
        .replace(/thanks/gi, 'Thank you')
        .replace(/sorry/gi, 'I apologize')
        .replace(/ok\b/gi, 'Understood')
        .replace(/okay\b/gi, 'Understood')
        .replace(/yeah\b/gi, 'Yes')
        .replace(/nope\b/gi, 'No')
        .replace(/can't/gi, 'cannot')
        .replace(/won't/gi, 'will not')
        .replace(/don't/gi, 'do not');
    } else if (formalityLevel < 0.3) {
      // More casual
      return message
        .replace(/Hello/gi, 'Hi')
        .replace(/Thank you/gi, 'Thanks')
        .replace(/I apologize/gi, 'Sorry')
        .replace(/Understood/gi, 'Got it')
        .replace(/cannot/gi, "can't")
        .replace(/will not/gi, "won't")
        .replace(/do not/gi, "don't");
    }
    
    return message;
  }
  
  /**
   * Adjust friendliness of message
   * @param {string} message - Original message
   * @param {number} friendlinessLevel - Friendliness level (0-1)
   * @returns {string} - Modified message
   */
  adjustFriendliness(message, friendlinessLevel) {
    if (!message) return message;
    
    if (friendlinessLevel > 0.7) {
      // More friendly
      if (!message.includes('!')) {
        message = message.replace(/\.$/, '!');
      }
      
      if (!message.includes('great') && !message.includes('wonderful') && !message.includes('awesome')) {
        message = message.replace(/^/, 'Great! ');
      }
    } else if (friendlinessLevel < 0.3) {
      // Less friendly, more neutral
      message = message.replace(/!+/g, '.');
      message = message.replace(/Great! /i, '');
      message = message.replace(/Awesome! /i, '');
      message = message.replace(/Wonderful! /i, '');
    }
    
    return message;
  }
  
  /**
   * Adjust humor of message
   * @param {string} message - Original message
   * @param {number} humorLevel - Humor level (0-1)
   * @returns {string} - Modified message
   */
  adjustHumor(message, humorLevel) {
    if (!message) return message;
    
    // This is a simplified implementation
    // In a real system, this would use more sophisticated NLP techniques
    
    if (humorLevel > 0.7 && !message.includes('😊') && !message.includes('😄')) {
      // Add a light-hearted emoji
      return message + ' 😊';
    }
    
    return message;
  }
  
  /**
   * Adjust verbosity of message
   * @param {string} message - Original message
   * @param {number} verbosityLevel - Verbosity level (0-1)
   * @returns {string} - Modified message
   */
  adjustVerbosity(message, verbosityLevel) {
    if (!message) return message;
    
    const sentences = message.match(/[^.!?]+[.!?]+/g) || [message];
    
    if (verbosityLevel > 0.7 && sentences.length < 3) {
      // More verbose - add a generic elaboration
      return message + ' I hope that helps! Let me know if you need any additional information.';
    } else if (verbosityLevel < 0.3 && sentences.length > 2) {
      // More concise - return just the first 1-2 sentences
      return sentences.slice(0, 2).join(' ');
    }
    
    return message;
  }
  
  /**
   * Adjust complexity of message
   * @param {string} message - Original message
   * @param {number} complexityLevel - Complexity level (0-1)
   * @returns {string} - Modified message
   */
  adjustComplexity(message, complexityLevel) {
    if (!message) return message;
    
    // This is a simplified implementation
    // In a real system, this would use more sophisticated NLP techniques
    
    if (complexityLevel < 0.3) {
      // Simplify language
      return message
        .replace(/utilize/gi, 'use')
        .replace(/implement/gi, 'use')
        .replace(/facilitate/gi, 'help')
        .replace(/demonstrate/gi, 'show')
        .replace(/sufficient/gi, 'enough')
        .replace(/inquire/gi, 'ask')
        .replace(/commence/gi, 'start');
    }
    
    return message;
  }
}

// Create singleton instance
const personalityMessageProcessor = new PersonalityMessageProcessor();

module.exports = personalityMessageProcessor;
