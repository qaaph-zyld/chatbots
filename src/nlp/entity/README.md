# Advanced Entity Recognition

This module provides advanced entity recognition capabilities for the Open-Source Chatbots Platform using open-source models that can run locally without requiring cloud services.

## Features

- **Local Processing**: Uses Hugging Face's transformer models (DistilBERT) for entity recognition without requiring API calls
- **Multiple Model Support**: Integrates with both transformer-based models and spaCy for entity recognition
- **Custom Entity Recognition**: Supports defining custom entity patterns using strings and regular expressions
- **Domain-Specific Entities**: Allows creating domain-specific entity patterns for different use cases
- **Confidence Scoring**: Provides confidence scores for extracted entities
- **Fallback Mechanism**: Falls back to spaCy if transformer models are unavailable

## Models

The entity recognition service supports the following models:

1. **Hugging Face Transformer Models**:
   - `distilbert-base-cased-ner`: A lightweight model that balances performance and resource usage
   - Other compatible Hugging Face NER models

2. **spaCy Models**:
   - Uses the existing spaCy integration for entity recognition
   - Supports all entity types available in the loaded spaCy model

## Entity Types

The supported entity types depend on the model being used, but typically include:

- **Person**: Names of people
- **Organization**: Names of companies, agencies, institutions
- **Location**: Names of locations, cities, countries
- **Date/Time**: Dates and times
- **Money**: Monetary values
- **Percent**: Percentage values
- **Product**: Names of products
- **Event**: Names of events
- **Custom**: User-defined entity types

## Usage

### Basic Usage

```javascript
const { entityRecognitionService } = require('./nlp/entity');

// Initialize the service
await entityRecognitionService.initialize();

// Extract entities from text
const text = "Apple Inc. is planning to open a new store in New York City next month.";
const entities = await entityRecognitionService.extractEntities(text);

console.log(entities);
// Output:
// [
//   {
//     text: "Apple Inc.",
//     type: "ORG",
//     start: 0,
//     end: 10,
//     confidence: 0.95,
//     source: "distilbert-base-cased-ner"
//   },
//   {
//     text: "New York City",
//     type: "GPE",
//     start: 41,
//     end: 54,
//     confidence: 0.92,
//     source: "distilbert-base-cased-ner"
//   },
//   {
//     text: "next month",
//     type: "DATE",
//     start: 55,
//     end: 65,
//     confidence: 0.87,
//     source: "distilbert-base-cased-ner"
//   }
// ]
```

### Custom Entity Patterns

```javascript
// Add custom entity patterns
await entityRecognitionService.addCustomEntityPatterns(
  'MEDICATION',
  [
    'ibuprofen',
    'aspirin',
    'acetaminophen',
    /\d+mg/i
  ]
);

// Extract entities with custom patterns
const text = "The patient was prescribed 500mg of ibuprofen.";
const entities = await entityRecognitionService.extractEntities(text);

// Output will include custom entities:
// [
//   {
//     text: "500mg",
//     type: "MEDICATION",
//     start: 27,
//     end: 32,
//     confidence: 1.0,
//     source: "custom"
//   },
//   {
//     text: "ibuprofen",
//     type: "MEDICATION",
//     start: 36,
//     end: 45,
//     confidence: 1.0,
//     source: "custom"
//   }
// ]
```

### Domain-Specific Entities

```javascript
// Add domain-specific entity patterns
await entityRecognitionService.addCustomEntityPatterns(
  'SYMPTOM',
  [
    'headache',
    'fever',
    'cough',
    'sore throat'
  ],
  'healthcare' // Domain ID
);

// Extract entities with domain-specific patterns
const text = "The patient reported a headache and fever.";
const entities = await entityRecognitionService.extractEntities(text, {
  domainId: 'healthcare'
});

// Output will include domain-specific entities
```

## Configuration

The entity recognition service can be configured with the following options:

```javascript
await entityRecognitionService.initialize({
  defaultModel: 'distilbert-base-cased-ner', // Default model to use
  fallbackToSpacy: true, // Fall back to spaCy if transformer model fails
  confidenceThreshold: 0.7, // Minimum confidence score for entities
  enabledModels: ['distilbert-base-cased-ner', 'spacy'] // Models to enable
});
```

## Integration with NLP Service

The entity recognition service is integrated with the main NLP service, allowing it to be used seamlessly with other NLP features:

```javascript
const nlpService = require('../nlp.service');

// Process text with multiple NLP features
const result = await nlpService.processText(text, ['entities', 'keywords', 'sentiment']);

// Access entities from the result
const entities = result.entities;
```

## Requirements

- Python 3.7+ with the following packages:
  - transformers
  - torch
  - numpy
- Node.js 14+ with the following packages:
  - uuid
  - child_process

## Performance Considerations

- Transformer models require more memory and processing power than spaCy
- For resource-constrained environments, use spaCy as the default model
- The first run of a transformer model will be slower due to model loading
- Consider using a smaller model like `distilbert-base-cased-ner` for better performance

## License

This component is licensed under the MIT License, the same as the main project.
