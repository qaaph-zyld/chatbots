# Open-Source Voice Interface

This document provides a comprehensive guide to integrating voice capabilities into your chatbots using our 100% open-source Voice Interface.

## Overview

The Open-Source Voice Interface allows your chatbots to:

- Accept voice input from users (Speech-to-Text)
- Respond with voice output (Text-to-Speech)
- Recognize speakers (optional)
- Support multiple languages
- Customize voice characteristics

All of this is achieved using only free, open-source components with no dependency on commercial APIs.

## Key Benefits

- **Zero API Costs**: No usage fees or API keys required
- **Full Privacy**: All processing happens on your server
- **Complete Control**: Customize and extend as needed
- **Offline Operation**: Works without internet connection
- **No Vendor Lock-in**: Free from commercial service dependencies

## Open-Source Components

### Speech-to-Text Engines

1. **Mozilla DeepSpeech**
   - Neural network based STT engine
   - High accuracy for English
   - Supports custom acoustic models
   - [GitHub Repository](https://github.com/mozilla/DeepSpeech)

2. **Vosk**
   - Lightweight offline STT toolkit
   - Supports 20+ languages
   - Smaller model sizes available
   - [GitHub Repository](https://github.com/alphacep/vosk-api)

### Text-to-Speech Engines

1. **Coqui TTS**
   - High-quality neural TTS engine
   - Natural-sounding voices
   - Multiple voice models available
   - [GitHub Repository](https://github.com/coqui-ai/TTS)

2. **eSpeak NG**
   - Lightweight speech synthesizer
   - Supports 100+ languages
   - Low resource requirements
   - [GitHub Repository](https://github.com/espeak-ng/espeak-ng)

## Getting Started

### Prerequisites

To use the Open-Source Voice Interface, ensure you have:

1. A registered chatbot on the platform
2. Node.js 14+ installed on your server
3. Sufficient disk space for voice models (varies by engine)
4. At least 2GB of RAM for processing

### Configuration

Configure the open-source voice interface by setting environment variables or updating the `config/open-voice.config.js` file:

```javascript
// Speech-to-Text configuration
OPEN_VOICE_STT_ENGINE=deepspeech  // Options: deepspeech, vosk
OPEN_VOICE_STT_LANGUAGE=en-US
OPEN_VOICE_STT_AUTO_DOWNLOAD=true

// Text-to-Speech configuration
OPEN_VOICE_TTS_ENGINE=coqui  // Options: coqui, espeak
OPEN_VOICE_TTS_VOICE=ljspeech
OPEN_VOICE_TTS_SPEAKING_RATE=1.0
OPEN_VOICE_TTS_PITCH=0.0
```

### Model Management

Voice models are downloaded automatically when needed (if `autoDownload` is enabled). You can also manually download and place models in the appropriate directories:

- DeepSpeech models: `models/stt/deepspeech-0.9.3-models.pbmm` and `models/stt/deepspeech-0.9.3-models.scorer`
- Vosk models: `models/stt/vosk-model-small-en-us-0.15/`
- Coqui TTS models: `models/tts/tts_models--en--ljspeech--glow-tts/`

## API Endpoints

### Process Voice Input

Convert audio to text and get a chatbot response with voice output.

```
POST /api/open-voice/chatbots/:chatbotId/conversation
```

**Parameters:**
- `audio` (file): Audio file containing speech
- `conversationId` (optional): Ongoing conversation ID
- `language` (optional): Language code (e.g., "en-US")
- `sttEngine` (optional): Speech-to-text engine ("deepspeech" or "vosk")
- `ttsEngine` (optional): Text-to-speech engine ("coqui" or "espeak")
- `voice` (optional): Voice ID to use for response

**Response:**
```json
{
  "success": true,
  "input": {
    "text": "What's the weather like today?",
    "audioUrl": "/api/open-voice/audio/input-123.webm",
    "engine": "deepspeech"
  },
  "response": {
    "text": "The weather is sunny with a high of 75°F.",
    "audioUrl": "/api/open-voice/audio/response-456.mp3",
    "engine": "coqui"
  },
  "conversationId": "conv-789"
}
```

### Text to Speech

Convert text to speech using open-source engines.

```
POST /api/open-voice/tts
```

**Parameters:**
- `text` (required): Text to convert to speech
- `voice` (optional): Voice ID to use
- `language` (optional): Language code
- `engine` (optional): TTS engine ("coqui" or "espeak")
- `speakingRate` (optional): Speaking rate (0.5 to 2.0)
- `pitch` (optional): Voice pitch (-20.0 to 20.0)

**Response:**
```json
{
  "success": true,
  "text": "Hello, how can I help you?",
  "audioUrl": "/api/open-voice/audio/tts-123.mp3",
  "engine": "coqui",
  "voice": "ljspeech",
  "language": "en-US"
}
```

### Speech to Text

Convert speech to text using open-source engines.

```
POST /api/open-voice/stt
```

**Parameters:**
- `audio` (file): Audio file containing speech
- `language` (optional): Language code
- `engine` (optional): STT engine ("deepspeech" or "vosk")

**Response:**
```json
{
  "success": true,
  "text": "Hello, I'd like to book a flight.",
  "confidence": 0.85,
  "engine": "deepspeech",
  "language": "en-US"
}
```

### Get Available Voices

Get a list of available voices for the selected engine.

```
GET /api/open-voice/voices
```

**Parameters:**
- `engine` (optional): TTS engine ("coqui" or "espeak")
- `language` (optional): Filter voices by language

**Response:**
```json
{
  "success": true,
  "engine": "coqui",
  "voices": [
    {
      "id": "ljspeech",
      "name": "LJSpeech (Female)",
      "language": "en-US",
      "gender": "female"
    },
    {
      "id": "vctk/p225",
      "name": "VCTK p225 (Male)",
      "language": "en-GB",
      "gender": "male"
    }
  ]
}
```

### Get Voice Settings

Get voice settings for a chatbot.

```
GET /api/open-voice/chatbots/:chatbotId/settings
```

**Response:**
```json
{
  "success": true,
  "chatbotId": "chatbot-123",
  "settings": {
    "enabled": true,
    "stt": {
      "engine": "deepspeech",
      "language": "en-US"
    },
    "tts": {
      "engine": "coqui",
      "voice": "ljspeech",
      "language": "en-US",
      "speakingRate": 1.0,
      "pitch": 0
    }
  }
}
```

### Get Model Information

Get information about installed voice models.

```
GET /api/open-voice/models
```

**Response:**
```json
{
  "success": true,
  "stt": {
    "models": [
      {
        "name": "DeepSpeech English",
        "engine": "deepspeech",
        "version": "0.9.3",
        "language": "en-US",
        "path": "/path/to/models/stt/deepspeech-0.9.3-models.pbmm",
        "size": 188915987
      }
    ],
    "defaultEngine": "deepspeech",
    "modelPath": "/path/to/models/stt"
  },
  "tts": {
    "models": [
      {
        "name": "Coqui TTS LJSpeech Glow-TTS",
        "engine": "coqui",
        "version": "1.0",
        "language": "en-US",
        "path": "/path/to/models/tts/tts_models--en--ljspeech--glow-tts",
        "size": 167772160
      }
    ],
    "defaultEngine": "coqui",
    "modelPath": "/path/to/models/tts"
  }
}
```

## Frontend Integration

### React Component

We provide a React component for easy integration:

```javascript
import { OpenVoiceInterface } from '@chatbots/open-voice-interface';

function ChatApp() {
  const [conversationId, setConversationId] = useState(null);
  
  return (
    <div className="chat-container">
      <div className="messages">
        {/* Your chat messages here */}
      </div>
      
      <OpenVoiceInterface
        chatbotId="your-chatbot-id"
        conversationId={conversationId}
        buttonSize="medium"
        showEngineInfo={true}
        onResponse={(data) => {
          // Handle the response
          setConversationId(data.conversationId);
          // Add messages to your UI
        }}
        onError={(error) => {
          console.error('Voice error:', error);
        }}
      />
    </div>
  );
}
```

### HTML/JavaScript Integration

For non-React applications:

```html
<!-- Include the Open Voice Interface component -->
<script src="/js/components/OpenVoiceInterface.js"></script>
<link rel="stylesheet" href="/css/voice-interface.css">

<!-- Add a container for the voice interface -->
<div id="open-voice-interface-container"></div>

<script>
  // Create voice interface props
  const voiceProps = {
    chatbotId: 'your-chatbot-id',
    buttonSize: 'medium',
    showEngineInfo: true,
    onResponse: (data) => {
      // Handle the response
      console.log(data);
    }
  };
  
  // Create voice interface element
  const openVoiceInterfaceElement = React.createElement(OpenVoiceInterface, voiceProps);
  
  // Render voice interface
  ReactDOM.render(
    openVoiceInterfaceElement,
    document.getElementById('open-voice-interface-container')
  );
</script>
```

## Component Props

The `OpenVoiceInterface` component accepts the following props:

| Prop | Type | Description |
|------|------|-------------|
| `chatbotId` | string | Required. ID of the chatbot to use |
| `conversationId` | string | Optional. ID of an ongoing conversation |
| `buttonSize` | string | Optional. Size of the microphone button ('small', 'medium', 'large') |
| `showTranscript` | boolean | Optional. Whether to show the transcript of user speech |
| `showResponse` | boolean | Optional. Whether to show the text response from the chatbot |
| `showEngineInfo` | boolean | Optional. Whether to show information about the engines being used |
| `onListeningStart` | function | Optional. Callback when listening starts |
| `onListeningStop` | function | Optional. Callback when listening stops |
| `onProcessingStart` | function | Optional. Callback when processing starts |
| `onResponse` | function | Optional. Callback when a response is received |
| `onSpeakingStart` | function | Optional. Callback when speaking starts |
| `onSpeakingEnd` | function | Optional. Callback when speaking ends |
| `onConversationIdChange` | function | Optional. Callback when the conversation ID changes |
| `onSettingsLoaded` | function | Optional. Callback when settings are loaded |
| `onEngineInfoLoaded` | function | Optional. Callback when engine information is loaded |
| `onError` | function | Optional. Callback when an error occurs |

## Advanced Configuration

### Custom Model Paths

You can specify custom paths for voice models:

```javascript
// In config/open-voice.config.js
module.exports = {
  stt: {
    modelPath: '/custom/path/to/stt/models',
    // ...
  },
  tts: {
    modelPath: '/custom/path/to/tts/models',
    // ...
  }
};
```

### Engine-Specific Settings

Each engine has specific configuration options:

```javascript
// DeepSpeech settings
deepspeech: {
  version: '0.9.3',
  beamWidth: 500,
  modelUrl: 'https://github.com/mozilla/DeepSpeech/releases/download/v0.9.3/deepspeech-0.9.3-models.pbmm'
}

// Vosk settings
vosk: {
  version: '0.15',
  modelSize: 'small', // 'small', 'medium', 'large'
  modelUrl: 'https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip'
}

// Coqui TTS settings
coqui: {
  modelType: 'glow-tts', // 'glow-tts', 'tacotron2'
  vocoderType: 'hifigan', // 'hifigan', 'wavernn'
  modelUrl: 'https://github.com/coqui-ai/TTS/releases/download/v0.0.13/tts_models--en--ljspeech--glow-tts.zip'
}

// eSpeak settings
espeak: {
  variant: '',
  wordGap: 10,
  capitalPitch: 20
}
```

### Processing Configuration

Configure processing resources:

```javascript
processing: {
  workers: 2, // Number of worker threads
  timeout: 30, // Processing timeout in seconds
  useGpu: false, // Whether to use GPU acceleration
  memoryLimit: 1024 // Memory limit in MB
}
```

## Performance Considerations

### Hardware Requirements

Recommended hardware for optimal performance:

- **CPU**: 4+ cores for real-time processing
- **RAM**: 4GB+ (8GB recommended)
- **Disk**: 1GB+ for models
- **GPU**: Optional, but improves performance with DeepSpeech and Coqui TTS

### Model Selection

Choose models based on your needs:

- **Small models**: Faster, less accurate, lower resource usage
- **Medium models**: Balanced performance and accuracy
- **Large models**: Higher accuracy, more resource-intensive

### Optimizations

- Pre-load models at startup to reduce initial processing time
- Use smaller models for mobile or resource-constrained environments
- Consider running intensive processing in separate worker threads

## Demo

A complete demo is available at `/open-voice-demo.html` that showcases all the open-source voice interface capabilities.

## Troubleshooting

### Common Issues

1. **Model Download Failures**: Ensure your server has internet access during initial setup or disable auto-download and manually place models
2. **Processing Timeouts**: Increase the processing timeout or use smaller models
3. **High CPU Usage**: Reduce the number of concurrent voice processing requests or upgrade hardware
4. **Memory Issues**: Lower the memory limit or use smaller models
5. **Audio Quality Problems**: Ensure proper microphone access and check audio format compatibility

### Debugging

Enable debug logging by setting:

```javascript
localStorage.setItem('openVoiceDebug', 'true');
```

## Contributing

We welcome contributions to improve the open-source voice interface:

1. Add support for new STT/TTS engines
2. Improve model performance
3. Add support for more languages
4. Enhance the UI components
5. Optimize resource usage

## Support

For additional help, visit our developer forum at https://forum.chatbotsplatform.com or open an issue on our GitHub repository.
