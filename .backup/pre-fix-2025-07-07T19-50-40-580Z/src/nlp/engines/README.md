# Open-Source NLP Engines Integration

This directory contains adapters for integrating with open-source NLP libraries, specifically spaCy and NLTK. These integrations allow the chatbot platform to perform natural language processing tasks locally without relying on external API services.

## Available Engines

### spaCy Engine

The spaCy engine provides integration with the [spaCy](https://spacy.io/) Python library, which offers industrial-strength natural language processing capabilities.

Features:
- Entity extraction
- Part-of-speech tagging
- Dependency parsing
- Noun chunk extraction
- Keyword extraction
- Basic sentiment analysis

### NLTK Engine

The NLTK engine provides integration with the [Natural Language Toolkit (NLTK)](https://www.nltk.org/), a leading platform for building Python programs to work with human language data.

Features:
- Entity extraction
- Keyword extraction
- Sentiment analysis using VADER
- Part-of-speech tagging
- Tokenization

## Setup Requirements

To use these engines, you need to have Python installed on your system along with the required libraries:

### For spaCy:
```bash
pip install spacy
python -m spacy download en_core_web_md  # Download English model
```

### For NLTK:
```bash
pip install nltk
python -c "import nltk; nltk.download('punkt'); nltk.download('averaged_perceptron_tagger'); nltk.download('maxent_ne_chunker'); nltk.download('words'); nltk.download('wordnet'); nltk.download('stopwords'); nltk.download('vader_lexicon')"
```

## Configuration

The NLP engines can be configured using environment variables:

- `PREFER_LOCAL_NLP`: Set to 'true' to prefer local NLP processing over remote API calls
- `DEFAULT_NLP_ENGINE`: Set to 'spacy' or 'nltk' to select the default engine
- `PYTHON_PATH`: Path to the Python executable (defaults to 'python')
- `SPACY_MODEL`: spaCy model to use (defaults to 'en_core_web_md')

Example in `.env` file:
```
PREFER_LOCAL_NLP=true
DEFAULT_NLP_ENGINE=spacy
PYTHON_PATH=/usr/bin/python3
SPACY_MODEL=en_core_web_md
```

## Usage

The engines are automatically integrated with the main NLP service. When `PREFER_LOCAL_NLP` is set to 'true', the service will attempt to use the local engines before falling back to remote API calls.

### Direct Usage Example

```javascript
const { spacyEngine, nltkEngine } = require('./engines');

// Using spaCy engine directly
async function analyzeWithSpacy(text) {
  await spacyEngine.initialize();
  const entities = await spacyEngine.extractEntities(text);
  const sentiment = await spacyEngine.analyzeSentiment(text);
  
  console.log('Entities:', entities);
  console.log('Sentiment:', sentiment);
}

// Using NLTK engine directly
async function analyzeWithNLTK(text) {
  await nltkEngine.initialize();
  const entities = await nltkEngine.extractEntities(text);
  const sentiment = await nltkEngine.analyzeSentiment(text);
  
  console.log('Entities:', entities);
  console.log('Sentiment:', sentiment);
}
```

## Bridge Scripts

The engines communicate with Python through bridge scripts located in `scripts/python/`:

- `spacy_bridge.py`: Bridge for spaCy
- `nltk_bridge.py`: Bridge for NLTK

These scripts are automatically created if they don't exist when the engines are initialized.

## Error Handling

The engines include robust error handling and will fall back to remote API processing if local processing fails. All errors are logged for debugging purposes.

## Performance Considerations

Local NLP processing can be more efficient for high-volume applications but requires more system resources. Consider your deployment environment when deciding whether to use local or remote processing.

## Adding New Engines

To add a new engine:

1. Create a new engine adapter file (e.g., `new-engine.js`)
2. Implement the standard interface (initialize, extractEntities, analyzeSentiment, etc.)
3. Add the engine to the `index.js` exports
4. Update the main NLP service to include the new engine in the engines object

## License

All engine adapters are licensed under the MIT License, the same as the main project.
