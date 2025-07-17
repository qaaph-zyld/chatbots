const intentPatterns = require('../config/intentPatterns.json');

class IntentClassifier {
  classify(message) {
    for (const [intentName, intentConfig] of Object.entries(intentPatterns)) {
      for (const pattern of intentConfig.patterns) {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(message)) {
          return {
            intent: intentName,
            confidence: intentConfig.confidence,
            requiresAuth: intentConfig.authentication,
            handler: intentConfig.handler
          };
        }
      }
    }
    return {
      intent: 'DEFAULT',
      confidence: 0.0,
      requiresAuth: false,
      handler: 'defaultHandler'
    };
  }
}

module.exports = IntentClassifier;
