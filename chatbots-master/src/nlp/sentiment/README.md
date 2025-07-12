# Sentiment Analysis

This module provides sentiment analysis capabilities for the Open-Source Chatbots Platform using open-source libraries like VADER and TextBlob, enabling chatbots to understand and respond to the emotional tone of user messages.

## Features

- **Local Processing**: Uses VADER and TextBlob for sentiment analysis without requiring external APIs
- **Emotion Detection**: Identifies basic emotions in text (joy, sadness, anger, fear, surprise)
- **Sentiment Tracking**: Tracks sentiment changes over conversations
- **Multiple Analysis Methods**: Supports VADER, TextBlob, or a combined approach
- **Confidence Scoring**: Provides detailed sentiment scores and confidence levels
- **Caching**: Implements caching for improved performance

## Sentiment Analysis Methods

The sentiment analysis service supports the following methods:

1. **VADER (Valence Aware Dictionary and sEntiment Reasoner)**:
   - Rule-based sentiment analysis tool specifically attuned to sentiments expressed in social media
   - Provides compound score and positive/negative/neutral scores
   - Particularly good at handling slang, emoticons, and context-specific expressions

2. **TextBlob**:
   - Simple but effective library for sentiment analysis
   - Provides polarity (positive/negative) and subjectivity scores
   - Good for general-purpose sentiment analysis

3. **Combined Approach (Default)**:
   - Uses a weighted average of VADER and TextBlob scores
   - Provides more balanced results across different types of text
   - Includes detailed scores from both methods for transparency

## Usage

### Basic Usage

```javascript
const { nlpService } = require('./nlp/nlp.service');

// Analyze sentiment of text
const text = "I absolutely love this product! It's amazing and works perfectly.";
const result = await nlpService.analyzeSentiment(text);

console.log(result);
// Output:
// {
//   text: "I absolutely love this product! It's amazing and works perfectly.",
//   sentiment: {
//     score: 0.92,
//     label: "very positive",
//     vader: {
//       compound: 0.957,
//       positive: 0.646,
//       negative: 0.0,
//       neutral: 0.354
//     },
//     textblob: {
//       polarity: 0.8,
//       subjectivity: 0.75
//     }
//   },
//   emotions: {
//     joy: 0.8,
//     sadness: 0.0,
//     anger: 0.0,
//     fear: 0.0,
//     surprise: 0.0
//   }
// }
```

### Specifying Analysis Method

```javascript
// Use specific analysis method
const vaderResult = await nlpService.analyzeSentiment(text, { method: 'vader' });
const textblobResult = await nlpService.analyzeSentiment(text, { method: 'textblob' });
const combinedResult = await nlpService.analyzeSentiment(text, { method: 'combined' });
```

### Tracking Sentiment Over Conversations

```javascript
// Create a conversation context
const userId = 'user123';
const context = await nlpService.createConversationContext(userId);

// Process messages with context
await nlpService.processTextWithContext(
  "I'm really excited about this new feature!",
  context.id,
  ['sentiment', 'entities', 'intent']
);

await nlpService.processTextWithContext(
  "But I'm having some trouble getting it to work properly.",
  context.id,
  ['sentiment', 'entities', 'intent']
);

await nlpService.processTextWithContext(
  "Now I've figured it out and it's working great!",
  context.id,
  ['sentiment', 'entities', 'intent']
);

// Track sentiment over the conversation
const sentimentTracking = await nlpService.trackConversationSentiment(context.id);

console.log(sentimentTracking);
// Output:
// {
//   averageScore: 0.45,
//   label: "positive",
//   distribution: {
//     positive: 2,
//     negative: 0,
//     neutral: 1
//   },
//   emotions: {
//     joy: 0.5,
//     sadness: 0.1,
//     anger: 0.0,
//     fear: 0.0,
//     surprise: 0.0
//   },
//   dominantEmotion: "joy",
//   trend: "improving",
//   messageCount: 3
// }
```

## Integration with NLP Service

The sentiment analysis module is fully integrated with the NLP service, allowing it to be used seamlessly with other NLP features:

```javascript
// Process text with multiple NLP features including sentiment
const result = await nlpService.processText(
  text,
  ['sentiment', 'entities', 'intent', 'keywords']
);

// Access sentiment from the result
const sentiment = result.sentiment;
```

## Sentiment Labels

Sentiment scores are converted to the following labels:

- **very positive**: score >= 0.5
- **positive**: score >= 0.1
- **neutral**: score between -0.1 and 0.1
- **negative**: score <= -0.1
- **very negative**: score <= -0.5

## Emotion Detection

The module can detect the following basic emotions:

- **joy**: Happiness, excitement, pleasure
- **sadness**: Unhappiness, disappointment, grief
- **anger**: Frustration, irritation, rage
- **fear**: Anxiety, worry, nervousness
- **surprise**: Astonishment, shock, amazement

## Configuration

The sentiment analysis service can be configured with the following options:

```javascript
// Environment variables
process.env.SENTIMENT_CACHE_SIZE = '1000'; // Maximum number of cached results
process.env.SENTIMENT_CACHE_TTL = '3600'; // Cache TTL in seconds

// Or through initialization options
await sentimentAnalysisService.initialize({
  defaultMethod: 'combined', // 'vader', 'textblob', or 'combined'
  cacheEnabled: true,
  emotionDetection: true,
  sentimentTrackingEnabled: true,
  sentimentHistorySize: 10
});
```

## Requirements

- Python 3.7+ with the following packages:
  - nltk
  - textblob
- Node.js 14+

## Performance Considerations

- The first run may be slower due to Python package installation and NLTK data download
- Caching improves performance for repeated sentiment analysis of the same text
- Emotion detection adds some overhead but provides valuable additional insights

## License

This component is licensed under the MIT License, the same as the main project.
