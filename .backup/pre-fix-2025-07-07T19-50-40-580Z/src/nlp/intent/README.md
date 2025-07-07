# Advanced Intent Classification

This module provides advanced intent classification capabilities for the Open-Source Chatbots Platform using local models that can run directly in Node.js without requiring external services.

## Features

- **Local Processing**: Uses TensorFlow.js for local model inference
- **Rule-Based Fallback**: Provides a rule-based fallback mechanism when TensorFlow.js is not available
- **Domain-Specific Intents**: Supports domain-specific intent classification
- **Confidence Scoring**: Provides confidence scores for classified intents
- **Custom Intents**: Allows adding custom intents with examples
- **Persistence**: Saves intent examples to local storage for reuse

## Models

The intent classification service supports the following models:

1. **Universal Sentence Encoder (TensorFlow.js)**:
   - A lightweight model that converts text into embeddings for semantic similarity
   - Can be loaded directly from TensorFlow Hub or saved locally

2. **Rule-Based Classification**:
   - Uses Jaccard similarity for text matching
   - Provides a fallback when TensorFlow.js is not available

## Usage

### Basic Usage

```javascript
const { intentClassificationService } = require('./nlp/intent');

// Initialize the service
await intentClassificationService.initialize();

// Classify intent from text
const text = "What's the weather like in New York today?";
const result = await intentClassificationService.classifyIntent(text);

console.log(result);
// Output:
// {
//   intent: "weather",
//   confidence: 0.85,
//   intents: [
//     { intent: "weather", confidence: 0.85 },
//     { intent: "location", confidence: 0.42 }
//   ]
// }
```

### Adding Custom Intents

```javascript
// Add a custom intent with examples
await intentClassificationService.addIntent(
  'weather',
  [
    "What's the weather like today?",
    "Will it rain tomorrow?",
    "What's the temperature outside?",
    "Is it going to snow this weekend?",
    "How's the weather in London right now?"
  ]
);

// Classify intent
const text = "Is it going to be sunny tomorrow?";
const result = await intentClassificationService.classifyIntent(text);

// Output will include the custom intent if it matches
```

### Domain-Specific Intents

```javascript
// Add domain-specific intents
await intentClassificationService.addIntent(
  'symptom_check',
  [
    "I have a headache",
    "My throat hurts",
    "I'm feeling dizzy",
    "I have a fever"
  ],
  'healthcare' // Domain ID
);

// Classify intent with domain-specific context
const text = "I've been having a persistent cough";
const result = await intentClassificationService.classifyIntent(text, {
  domainId: 'healthcare'
});

// Output will include domain-specific intents
```

## Configuration

The intent classification service can be configured with the following options:

```javascript
await intentClassificationService.initialize({
  defaultModel: 'universal-sentence-encoder', // Default model to use
  fallbackToRules: true, // Fall back to rule-based classification if TensorFlow.js is not available
  confidenceThreshold: 0.7, // Minimum confidence score for intents
  enabledModels: ['universal-sentence-encoder', 'rules'] // Models to enable
});
```

## Integration with NLP Service

The intent classification service is integrated with the main NLP service, allowing it to be used seamlessly with other NLP features:

```javascript
const nlpService = require('../nlp.service');

// Process text with multiple NLP features
const result = await nlpService.processText(text, ['intent', 'entities', 'sentiment']);

// Access intent from the result
const intent = result.intent;
```

## Requirements

- Node.js 14+ with the following packages:
  - @tensorflow/tfjs-node (optional, for TensorFlow.js support)
  - uuid

## Performance Considerations

- TensorFlow.js requires more memory and processing power than rule-based classification
- For resource-constrained environments, enable the rule-based fallback
- The first run of TensorFlow.js will be slower due to model loading
- Pre-computing embeddings for intent examples improves classification speed

## License

This component is licensed under the MIT License, the same as the main project.
