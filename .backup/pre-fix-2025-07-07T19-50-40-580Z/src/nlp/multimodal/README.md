# Multi-Modal Input/Output

This module provides multi-modal input and output capabilities for the Open-Source Chatbots Platform, enabling chatbots to process and generate various types of content beyond text, including images, audio, and rich UI components.

## Features

### Input Processing

- **Image Processing**:
  - Object detection using OpenCV and TensorFlow Lite
  - Face detection using Haar cascades
  - Color analysis for dominant colors
  - Image metadata extraction

- **Audio Processing**:
  - Speech-to-text using Mozilla DeepSpeech and other open-source engines
  - Audio feature extraction with Librosa
  - Audio metadata analysis

- **Location Processing**:
  - Geocoding and reverse geocoding
  - Points of interest lookup
  - Address formatting

### Output Generation

- **Text-to-Speech**:
  - Voice synthesis using Mozilla TTS/Coqui TTS
  - Multiple voice options
  - Adjustable speech parameters (rate, pitch)
  - Fallback to pyttsx3 and gTTS for broader compatibility

- **Rich UI Components**:
  - Cards with images, titles, and buttons
  - Carousels for displaying multiple items
  - Quick replies for suggested responses
  - Custom component templates

## Usage

### Input Processing

```javascript
const { inputService } = require('./nlp/multimodal');

// Initialize the service
await inputService.initialize();

// Process an image
const imageResult = await inputService.processImage({
  path: '/path/to/image.jpg'
}, {
  detectObjects: true,
  detectFaces: true,
  extractColors: true
});

// Process audio (speech-to-text)
const audioResult = await inputService.processAudio({
  path: '/path/to/audio.wav'
}, {
  language: 'en-US'
});

// Process location data
const locationResult = await inputService.processLocation({
  latitude: 37.7749,
  longitude: -122.4194
}, {
  includePointsOfInterest: true
});
```

### Output Generation

```javascript
const { outputService } = require('./nlp/multimodal');

// Initialize the service
await outputService.initialize();

// Generate speech from text
const speechResult = await outputService.generateSpeech(
  'Hello, how can I help you today?',
  {
    voice: 'female',
    rate: 1.0,
    pitch: 1.0
  }
);

// Create a card component
const card = outputService.createCard('basic', {
  title: 'Product Title',
  subtitle: 'Product description',
  imageUrl: 'https://example.com/image.jpg',
  buttons: [
    { text: 'View Details', value: 'view_details' },
    { text: 'Add to Cart', value: 'add_to_cart' }
  ]
});

// Create a carousel component
const carousel = outputService.createCarousel([
  {
    title: 'Item 1',
    imageUrl: 'https://example.com/image1.jpg'
  },
  {
    title: 'Item 2',
    imageUrl: 'https://example.com/image2.jpg'
  }
]);

// Create quick replies
const quickReplies = outputService.createQuickReplies(
  'What would you like to do?',
  ['View Products', 'Contact Support', 'Check Order Status']
);

// Create a complete multi-modal response
const response = await outputService.createResponse({
  text: 'Here are some products you might like:',
  speech: {
    text: 'Here are some products you might like. Would you like to see more details?'
  },
  carousel: {
    items: [
      {
        title: 'Product 1',
        subtitle: '$19.99',
        imageUrl: 'https://example.com/product1.jpg'
      },
      {
        title: 'Product 2',
        subtitle: '$24.99',
        imageUrl: 'https://example.com/product2.jpg'
      }
    ]
  },
  quickReplies: {
    replies: ['Show more', 'Filter results', 'Sort by price']
  }
});
```

## Integration with NLP Service

The multi-modal module is fully integrated with the NLP service, allowing it to be used seamlessly with other NLP features:

```javascript
const { nlpService } = require('./nlp/nlp.service');

// Process text with multi-modal response
const result = await nlpService.processText(
  'Show me some product recommendations',
  {
    includeMultiModalResponse: true,
    responseType: 'carousel'
  }
);

// Access multi-modal response
const multiModalResponse = result.response;
```

## Python Dependencies

This module uses several Python libraries for processing:

- **Image Processing**:
  - OpenCV (`opencv-python`)
  - NumPy (`numpy`)
  - PIL/Pillow (`pillow`)
  - TensorFlow Lite (`tflite-runtime` or `tensorflow`)

- **Audio Processing**:
  - SpeechRecognition (`speech_recognition`)
  - Librosa (`librosa`)
  - NumPy (`numpy`)
  - PyDub (`pydub`)
  - Mozilla DeepSpeech (`deepspeech`)

- **Text-to-Speech**:
  - Mozilla TTS/Coqui TTS (`TTS`)
  - pyttsx3 (`pyttsx3`)
  - gTTS (`gtts`)

The module will attempt to install missing dependencies automatically when needed.

## Configuration

The multi-modal services can be configured with the following environment variables:

```
# General
PYTHON_PATH=python                # Path to Python executable
TEMP_DIR=./temp                   # Directory for temporary files
MODEL_PATH=./models               # Directory for models

# Input Service
USE_LOCAL_IMAGE_PROCESSING=true   # Whether to use local processing for images
USE_LOCAL_AUDIO_PROCESSING=true   # Whether to use local processing for audio
MAX_FILE_SIZE=10485760            # Maximum file size in bytes (10MB)

# Output Service
TEXT_TO_SPEECH_ENABLED=true       # Whether to enable text-to-speech
RICH_COMPONENTS_ENABLED=true      # Whether to enable rich components
DEFAULT_TTS_VOICE=en-US-female    # Default voice for text-to-speech
```

## Performance Considerations

- Image and audio processing can be resource-intensive. Consider the following:
  - Use appropriate timeouts for processing operations
  - Implement caching for frequently used outputs
  - Limit the size of input files
  - Use lower-resolution images when full resolution is not needed

- Text-to-speech generation can be slow with some engines:
  - Consider pre-generating audio for common phrases
  - Use caching for TTS results
  - Implement fallback mechanisms for when TTS is unavailable

## License

This component is licensed under the MIT License, the same as the main project.
